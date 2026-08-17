import express from 'express';
import { getMeetingConfig, getMeetingStatus } from '../controllers/meeting.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/config', protect, getMeetingConfig);
router.get('/:roomId/status', protect, getMeetingStatus);

export default router;
