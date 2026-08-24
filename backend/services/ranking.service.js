import User from '../models/User.js';
import Project from '../models/Project.js';
import SkillVerification from '../models/SkillVerification.js';

export const getTopUsers = async (limit = 20) => {
  // Sort by: reputationScore DESC, verifiedSkills DESC, completedProjects DESC, feedbackCount DESC
  const users = await User.find({})
    .select('name avatar headline reputationScore averageRating verifiedFeedbackCount pastProjectsCount reputationLevel skills')
    .sort({
      reputationScore: -1,
      pastProjectsCount: -1,
      verifiedFeedbackCount: -1
    })
    .limit(limit)
    .lean();
    
  // Since we can't perfectly sort by verifiedSkills count directly in MongoDB without an aggregation pipeline,
  // we can use a quick JS side sort for the final polish or just rely on reputationScore which already includes it.
  // A deterministic tie-breaker can be the createdAt timestamp or ID.
  
  // Format the output
  const rankedUsers = users.map((u, idx) => {
    const verifiedSkillsCount = (u.skills || []).filter(s => s.verified).length;
    return {
      rank: idx + 1,
      user: {
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        headline: u.headline,
        reputationLevel: u.reputationLevel
      },
      reputationScore: u.reputationScore,
      averageRating: u.averageRating,
      verifiedSkills: verifiedSkillsCount,
      completedProjects: u.pastProjectsCount,
      feedbackCount: u.verifiedFeedbackCount // Focus on verified feedback
    };
  });
  
  // Custom sort to explicitly enforce the requested order
  rankedUsers.sort((a, b) => {
    if (b.reputationScore !== a.reputationScore) return b.reputationScore - a.reputationScore;
    if (b.verifiedSkills !== a.verifiedSkills) return b.verifiedSkills - a.verifiedSkills;
    if (b.completedProjects !== a.completedProjects) return b.completedProjects - a.completedProjects;
    if (b.feedbackCount !== a.feedbackCount) return b.feedbackCount - a.feedbackCount;
    return a.user._id.toString().localeCompare(b.user._id.toString());
  });
  
  // Re-assign ranks after custom sort
  rankedUsers.forEach((u, idx) => {
    u.rank = idx + 1;
  });

  return rankedUsers;
};

export const getTopProjects = async (limit = 20) => {
  const projects = await Project.find({ status: { $in: ['Completed', 'In Progress'] } })
    .select('title description category projectReputationScore averageRating verifiedFeedbackCount members status')
    .sort({
      projectReputationScore: -1,
      verifiedFeedbackCount: -1
    })
    .limit(limit)
    .lean();

  const rankedProjects = projects.map((p, idx) => {
    return {
      rank: idx + 1,
      project: {
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category
      },
      reputationScore: p.projectReputationScore || 0,
      rating: p.averageRating || 0,
      reviews: p.verifiedFeedbackCount || 0,
      completed: p.status === 'Completed',
      teamSize: (p.members || []).length
    };
  });
  
  rankedProjects.sort((a, b) => {
    if (b.reputationScore !== a.reputationScore) return b.reputationScore - a.reputationScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.reviews !== a.reviews) return b.reviews - a.reviews;
    return a.project._id.toString().localeCompare(b.project._id.toString());
  });
  
  rankedProjects.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  return rankedProjects;
};
