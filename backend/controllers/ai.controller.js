import { analyzeProjectDescription } from '../services/ai.service.js';

export const analyzeProject = async (req, res, next) => {
  try {
    const { description, category } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a descriptive project overview for AI analysis.' });
    }

    const analysis = await analyzeProjectDescription(description, category || '');

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};
