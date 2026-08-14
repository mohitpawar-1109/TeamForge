import express from 'express';
import { getProjectMatches, getProjectSkillGap } from '../controllers/match.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:id/matches', protect, getProjectMatches);
router.get('/:id/skill-gap', protect, getProjectSkillGap);

export default router;
