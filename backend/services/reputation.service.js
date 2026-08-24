import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import SkillVerification from '../models/SkillVerification.js';
import Task from '../models/Task.js';

// Calculate the lower bound of Wilson score confidence interval for a Bernoulli parameter
// For 5-star ratings, we can normalize it to 0-1 and apply a similar smoothing.
// To keep things simple yet statistically sound, we use a Bayesian-like smoothing formula.
// adjustedRating = (reviewCount / (reviewCount + C)) * actualRating + (C / (reviewCount + C)) * platformAverage

const CONFIDENCE_CONSTANT = 5.0; // The number of "average" reviews we hallucinate
const PLATFORM_AVG_RATING = 3.5;

export const updateProjectReputation = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return;

  const feedbacks = await Feedback.find({ project: projectId, type: 'project', deletedAt: null });
  
  let totalRating = 0;
  let verifiedCount = 0;
  
  feedbacks.forEach(f => {
    totalRating += f.rating;
    if (f.isVerified) verifiedCount++;
  });

  const reviewCount = feedbacks.length;
  const rawAverage = reviewCount > 0 ? (totalRating / reviewCount) : 0;
  
  let smoothedRating = 0;
  if (reviewCount > 0) {
    smoothedRating = (reviewCount / (reviewCount + CONFIDENCE_CONSTANT)) * rawAverage + 
                     (CONFIDENCE_CONSTANT / (reviewCount + CONFIDENCE_CONSTANT)) * PLATFORM_AVG_RATING;
  }

  // Calculate projectReputationScore (0-100)
  // projectRatingScore = 50
  // completionScore = 20
  // teamCollaborationScore = 15
  // engagementScore = 10
  // qualitySignals = 5

  let ratingScore = (smoothedRating / 5) * 50;
  let completionScore = project.status === 'Completed' ? 20 : (project.progress / 100) * 10; // partial if not completed
  
  let teamCollaborationScore = 0;
  if (reviewCount > 0) {
    let collabSum = 0;
    feedbacks.forEach(f => {
      collabSum += f.categories?.teamCollaboration || f.rating;
    });
    teamCollaborationScore = ((collabSum / reviewCount) / 5) * 15;
  } else {
    teamCollaborationScore = 7.5; // neutral base
  }

  const tasksCount = await Task.countDocuments({ project: projectId });
  const completedTasksCount = await Task.countDocuments({ project: projectId, status: 'DONE' });
  const engagementScore = tasksCount > 0 ? (completedTasksCount / tasksCount) * 10 : 5;

  const qualitySignals = verifiedCount > 0 ? Math.min(5, verifiedCount) : 0;

  const projectReputationScore = Math.min(100, Math.round(
    ratingScore + completionScore + teamCollaborationScore + engagementScore + qualitySignals
  ));

  project.projectReputationScore = projectReputationScore;
  project.averageRating = Number(rawAverage.toFixed(2));
  project.feedbackCount = reviewCount;
  project.verifiedFeedbackCount = verifiedCount;

  await project.save();
  return project;
};

export const updateUserReputation = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const feedbacks = await Feedback.find({ reviewee: userId, type: 'user', deletedAt: null });
  
  let totalRating = 0;
  let verifiedCount = 0;
  let collabSum = 0;
  
  feedbacks.forEach(f => {
    // Weight verified reviews more than unverified reviews
    const weight = f.isVerified ? 1.0 : 0.25;
    totalRating += f.rating * weight;
    
    // Average the categories to find general collaboration score
    const c = f.categories || {};
    const catAvg = ((c.communication || f.rating) + (c.reliability || f.rating) + (c.teamwork || f.rating) + (c.professionalism || f.rating)) / 4;
    collabSum += catAvg * weight;

    if (f.isVerified) verifiedCount++;
  });

  // Calculate weighted review count
  const weightedReviewCount = feedbacks.reduce((acc, f) => acc + (f.isVerified ? 1.0 : 0.25), 0);

  const rawAverage = weightedReviewCount > 0 ? (totalRating / weightedReviewCount) : 0;
  
  let smoothedRating = 0;
  if (weightedReviewCount > 0) {
    smoothedRating = (weightedReviewCount / (weightedReviewCount + CONFIDENCE_CONSTANT)) * rawAverage + 
                     (CONFIDENCE_CONSTANT / (weightedReviewCount + CONFIDENCE_CONSTANT)) * PLATFORM_AVG_RATING;
  }

  // userReputationScore Formula:
  // feedbackScore = smoothedRating * (40/5) -> Max 40
  // skillScore = verified skills -> Max 25
  // projectScore = completed projects -> Max 15
  // collaborationScore = avg categories -> Max 10
  // activityScore = tasks/platform -> Max 10

  const feedbackScore = (smoothedRating / 5) * 40;

  // Verified skill score
  const verifications = await SkillVerification.find({ user: userId, status: 'VERIFIED' });
  const skillScore = Math.min(25, verifications.length * 5); // 5 points per verified skill

  // Project score
  const completedProjects = await Project.countDocuments({
    'members.user': userId,
    status: 'Completed'
  });
  const projectScore = Math.min(15, completedProjects * 3);

  // Collaboration score
  const avgCollab = weightedReviewCount > 0 ? (collabSum / weightedReviewCount) : 0;
  const collaborationScore = weightedReviewCount > 0 ? (avgCollab / 5) * 10 : 5; // default 5 if no reviews

  // Activity score (completed tasks)
  const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'DONE' });
  const activityScore = Math.min(10, completedTasks * 0.5);

  const totalScore = Math.round(
    feedbackScore + skillScore + projectScore + collaborationScore + activityScore
  );
  
  const reputationScore = Math.min(100, Math.max(0, totalScore));

  let level = 'New';
  if (reputationScore >= 90) level = 'Elite Collaborator';
  else if (reputationScore >= 75) level = 'Highly Trusted';
  else if (reputationScore >= 60) level = 'Trusted';
  else if (reputationScore >= 40) level = 'Contributor';

  user.reputationScore = reputationScore;
  user.averageRating = Number(rawAverage.toFixed(2));
  user.feedbackCount = feedbacks.length;
  user.verifiedFeedbackCount = verifiedCount;
  user.reputationLevel = level;

  // We should also update pastProjectsCount just in case
  user.pastProjectsCount = completedProjects;

  await user.save();
  return user;
};
