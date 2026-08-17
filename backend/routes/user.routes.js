import express from 'express';
import {
  getUsers,
  getUserById,
  updateProfile,
  getSkillNetwork,
  getUserSkillAnalytics,
  endorseUserSkill
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/skill-network', getSkillNetwork);
router.put('/profile', protect, updateProfile);
router.get('/:id/skill-scores', getUserSkillAnalytics);
router.post('/:id/skills/:skillName/endorse', protect, endorseUserSkill);
router.get('/:id', getUserById);

export default router;

