import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  sendNotificationDirect
} from '../controllers/notif.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, sendNotificationDirect);
router.patch('/read-all', protect, markAllNotificationsRead);
router.patch('/mark-all-read', protect, markAllNotificationsRead);
router.patch('/:id/read', protect, markNotificationRead);
router.delete('/:id', protect, deleteNotification);

export default router;

