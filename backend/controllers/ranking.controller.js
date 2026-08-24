import { getTopUsers, getTopProjects } from '../services/ranking.service.js';
import User from '../models/User.js';

export const getUsersLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const topUsers = await getTopUsers(limit);
    res.json({ success: true, data: topUsers });
  } catch (error) {
    next(error);
  }
};

export const getProjectsLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const topProjects = await getTopProjects(limit);
    res.json({ success: true, data: topProjects });
  } catch (error) {
    next(error);
  }
};

export const getMyRanking = async (req, res, next) => {
  try {
    const topUsers = await getTopUsers(1000); // Need a reasonably large list to find rank
    const myRankItem = topUsers.find(u => u.user._id.toString() === req.user.id);
    
    if (myRankItem) {
      res.json({ success: true, data: myRankItem });
    } else {
      // User is not in top 1000 or hasn't got any reputation yet
      const me = await User.findById(req.user.id).select('reputationScore averageRating verifiedFeedbackCount pastProjectsCount reputationLevel skills');
      res.json({
        success: true,
        data: {
          rank: null,
          user: {
            _id: me._id,
            name: me.name,
            avatar: me.avatar,
            reputationLevel: me.reputationLevel
          },
          reputationScore: me.reputationScore,
          averageRating: me.averageRating,
          verifiedSkills: (me.skills || []).filter(s => s.verified).length,
          completedProjects: me.pastProjectsCount,
          feedbackCount: me.verifiedFeedbackCount
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
