import express from 'express';
import {
  getProjectMatches,
  getProjectSkillGap,
  getAITeamRecommendations
} from '../controllers/match.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:id/matches', protect, getProjectMatches);
router.get('/:id/skill-gap', protect, getProjectSkillGap);
router.get('/:id/ai-team-recommendations', protect, getAITeamRecommendations);

export default router;

