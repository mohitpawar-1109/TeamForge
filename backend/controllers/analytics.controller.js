import { computeTeamAnalytics } from '../services/analytics.service.js';
import Project from '../models/Project.js';

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const analytics = await computeTeamAnalytics(id);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
