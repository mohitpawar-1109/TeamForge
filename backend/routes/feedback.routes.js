import express from 'express';
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  reportFeedback,
  getUserFeedback,
  getProjectFeedback
} from '../controllers/feedback.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/user/:targetId', protect, createFeedback);
router.post('/project/:targetId', protect, createFeedback);

router.get('/user/:userId', protect, getUserFeedback);
router.get('/project/:projectId', protect, getProjectFeedback);

router.put('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);
router.post('/:id/report', protect, reportFeedback);

export default router;
