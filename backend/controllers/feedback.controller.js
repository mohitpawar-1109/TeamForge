import Feedback from '../models/Feedback.js';
import FeedbackReport from '../models/FeedbackReport.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { updateUserReputation, updateProjectReputation } from '../services/reputation.service.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const createFeedback = async (req, res, next) => {
  try {
    const { targetId } = req.params; // Can be userId or projectId
    const { type, project: projectId, rating, categories, comment } = req.body;
    const reviewerId = req.user.id;

    if (!['user', 'project'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback type.' });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Feedback must contain at least 10 characters.' });
    }

    if (type === 'user' && reviewerId === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Feedback can only be given for completed projects.' });
    }

    const memberIds = project.members.map(m => m.user.toString());
    const ownerId = project.owner.toString();
    const allProjectParticipants = [...memberIds, ownerId];

    if (!allProjectParticipants.includes(reviewerId)) {
      return res.status(403).json({ success: false, message: 'You must be a participant in this project to leave feedback.' });
    }

    if (type === 'user' && !allProjectParticipants.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'The user you are reviewing was not a participant in this project.' });
    }

    // Check for existing feedback to prevent duplicates
    let existingFeedback;
    if (type === 'user') {
      existingFeedback = await Feedback.findOne({ reviewer: reviewerId, reviewee: targetId, project: projectId, type: 'user', deletedAt: null });
    } else {
      existingFeedback = await Feedback.findOne({ reviewer: reviewerId, project: projectId, type: 'project', deletedAt: null });
    }

    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this entity on this project.' });
    }

    const feedback = await Feedback.create({
      reviewer: reviewerId,
      reviewee: type === 'user' ? targetId : undefined,
      project: projectId,
      type,
      rating,
      categories,
      comment,
      isVerified: true // Assuming they are participants of a completed project, it is verified.
    });

    // Notify
    if (type === 'user') {
      await Notification.create({
        recipient: targetId,
        sender: reviewerId,
        type: 'feedback',
        message: `${req.user.name} left feedback on your collaboration for ${project.title}.`,
        relatedProject: project._id,
        link: `/profile/${targetId}`
      });
      await updateUserReputation(targetId);
    } else {
      await Notification.create({
        recipient: project.owner,
        sender: reviewerId,
        type: 'feedback',
        message: `${req.user.name} left feedback on your project ${project.title}.`,
        relatedProject: project._id,
        link: `/project/${project._id}`
      });
      await updateProjectReputation(projectId);
    }

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

export const updateFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback || feedback.deletedAt) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this feedback.' });
    }

    const age = Date.now() - new Date(feedback.createdAt).getTime();
    if (age > SEVEN_DAYS_MS) {
      return res.status(400).json({ success: false, message: 'Feedback can only be edited within 7 days of creation.' });
    }

    const { rating, categories, comment } = req.body;
    if (rating !== undefined) feedback.rating = rating;
    if (categories !== undefined) feedback.categories = categories;
    if (comment !== undefined) feedback.comment = comment;

    await feedback.save();

    if (feedback.type === 'user') {
      await updateUserReputation(feedback.reviewee);
    } else {
      await updateProjectReputation(feedback.project);
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback || feedback.deletedAt) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this feedback.' });
    }

    feedback.deletedAt = new Date();
    await feedback.save();

    if (feedback.type === 'user') {
      await updateUserReputation(feedback.reviewee);
    } else {
      await updateProjectReputation(feedback.project);
    }

    res.json({ success: true, message: 'Feedback deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const reportFeedback = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    const feedbackId = req.params.id;

    const existingReport = await FeedbackReport.findOne({ reporter: req.user.id, feedback: feedbackId });
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this feedback.' });
    }

    const report = await FeedbackReport.create({
      reporter: req.user.id,
      feedback: feedbackId,
      reason,
      details
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getUserFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ reviewee: req.params.userId, type: 'user', deletedAt: null })
      .populate('reviewer', 'name avatar reputationLevel')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(20);
      
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

export const getProjectFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ project: req.params.projectId, type: 'project', deletedAt: null })
      .populate('reviewer', 'name avatar reputationLevel')
      .sort({ createdAt: -1 })
      .limit(20);
      
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
};
