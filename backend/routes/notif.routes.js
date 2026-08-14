import express from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notif.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markNotificationRead);
router.patch('/mark-all-read', protect, markAllNotificationsRead);

export default router;
