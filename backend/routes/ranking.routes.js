import express from 'express';
import {
  getUsersLeaderboard,
  getProjectsLeaderboard,
  getMyRanking
} from '../controllers/ranking.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/users', protect, getUsersLeaderboard);
router.get('/projects', protect, getProjectsLeaderboard);
router.get('/me', protect, getMyRanking);

export default router;
