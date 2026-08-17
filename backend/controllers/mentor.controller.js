import Project from '../models/Project.js';
import MentorMessage from '../models/MentorMessage.js';
import {
  askProjectMentor,
  getSuggestedPrompts,
  buildPrivacySafeProjectContext
} from '../services/mentor.service.js';
import { calculateTeamSkillGap } from '../services/match.service.js';

// @desc    Send question to AI Project Mentor
// @route   POST /api/projects/:id/ai-mentor/chat
// @access  Private
export const sendMentorMessage = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { prompt, history = [] } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a prompt for the AI Mentor.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const result = await askProjectMentor({
      projectId,
      userId: req.user._id,
      prompt: prompt.trim(),
      history
    });

    res.json({
      success: true,
      data: result.message,
      source: result.source,
      contextSummary: result.contextSummary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation history with AI Mentor for a project
// @route   GET /api/projects/:id/ai-mentor/history
// @access  Private
export const getMentorHistory = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const messages = await MentorMessage.find({ project: projectId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    const context = await buildPrivacySafeProjectContext(projectId);
    const gapAnalysis = calculateTeamSkillGap(project);
    const suggestedPrompts = getSuggestedPrompts(project, gapAnalysis);

    res.json({
      success: true,
      count: messages.length,
      data: messages,
      suggestedPrompts,
      projectSummary: {
        title: project.title,
        category: project.category,
        progress: project.progress,
        readinessScore: gapAnalysis.readinessScore,
        membersCount: project.members?.length || 0,
        missingSkills: gapAnalysis.missingSkills
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear AI Mentor conversation history for a project
// @route   DELETE /api/projects/:id/ai-mentor/history
// @access  Private
export const clearMentorHistory = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await MentorMessage.deleteMany({ project: projectId });

    res.json({
      success: true,
      message: 'AI Mentor conversation history cleared.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested prompts tailored for this project
// @route   GET /api/projects/:id/ai-mentor/prompts
// @access  Private
export const getPrompts = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const gapAnalysis = calculateTeamSkillGap(project);
    const prompts = getSuggestedPrompts(project, gapAnalysis);

    res.json({
      success: true,
      data: prompts
    });
  } catch (error) {
    next(error);
  }
};
