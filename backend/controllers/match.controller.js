import Project from '../models/Project.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { calculateCandidateMatch, calculateTeamSkillGap } from '../services/match.service.js';
import { generateAITeamRecommendations } from '../services/recommendation.service.js';

export const getProjectMatches = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Exclude current team members from candidate recommendations
    const memberIds = project.members.map(m => m.user.toString());
    
    // Also fetch any existing pending invitations sent by this project
    const pendingInvites = await Invitation.find({ project: project._id, status: 'pending' }).select('receiver');
    const pendingReceiverIds = pendingInvites.map(inv => inv.receiver.toString());

    const candidateUsers = await User.find({ _id: { $nin: memberIds } }).select('-password');

    const matches = candidateUsers.map(candidate => {
      const matchData = calculateCandidateMatch(project, candidate);
      return {
        student: candidate,
        score: matchData.score,
        skillMatch: matchData.breakdown.skills,
        interestMatch: matchData.breakdown.interests,
        availabilityMatch: matchData.breakdown.availability,
        experienceMatch: matchData.breakdown.experience,
        matchedSkills: matchData.matchedSkills,
        missingSkills: matchData.missingSkills,
        explanations: matchData.explanations,
        invitationStatus: pendingReceiverIds.includes(candidate._id.toString()) ? 'pending' : 'none'
      };
    });

    // Sort descending by highest match score
    matches.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      count: matches.length,
      projectId: project._id,
      projectTitle: project.title,
      requiredSkills: project.requiredSkills,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectSkillGap = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name headline skills avatar');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const memberUsers = project.members.map(m => m.user).filter(Boolean);
    const gapAnalysis = calculateTeamSkillGap(project, memberUsers);

    res.json({
      success: true,
      projectId: project._id,
      projectTitle: project.title,
      teamMembersCount: memberUsers.length,
      data: gapAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Advanced AI Team Recommendations for a project
// @route   GET /api/projects/:id/ai-team-recommendations
// @access  Private
export const getAITeamRecommendations = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name headline skills avatar experienceLevel pastProjectsCount');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Exclude existing members
    const memberIds = project.members.map(m => (m.user?._id || m.user).toString());

    // Fetch existing pending invites
    const pendingInvites = await Invitation.find({ project: project._id, status: 'pending' }).select('receiver');
    const pendingReceiverIds = new Set(pendingInvites.map(inv => inv.receiver.toString()));

    const candidateUsers = await User.find({ _id: { $nin: memberIds } }).select('-password');

    const recommendationData = await generateAITeamRecommendations(project, candidateUsers);

    // Attach invitationStatus to each recommended member
    if (Array.isArray(recommendationData.recommendedTeam)) {
      recommendationData.recommendedTeam.forEach(item => {
        const uId = item.student?._id?.toString();
        item.invitationStatus = pendingReceiverIds.has(uId) ? 'pending' : 'none';
      });
    }

    res.json({
      success: true,
      projectId: project._id,
      projectTitle: project.title,
      data: recommendationData
    });
  } catch (error) {
    next(error);
  }
};

