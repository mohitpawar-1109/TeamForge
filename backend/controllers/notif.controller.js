import Notification from '../models/Notification.js';
import { emitToUser } from '../socket/socket.js';
import { createNotification } from '../services/notification.service.js';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const filter = {
      $or: [
        { recipient: userId },
        { user: userId }
      ]
    };

    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar headline college')
      .populate('relatedProject', 'title category')
      .populate('relatedGroup', 'name type')
      .populate('relatedTask', 'title priority status')
      .populate('relatedPost', 'content title type')
      .populate('relatedTeamRequest', 'status')
      .sort({ createdAt: -1 })
      .limit(60);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notif = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { recipient: userId },
          { user: userId }
        ]
      },
      { read: true },
      { new: true }
    )
      .populate('sender', 'name avatar headline')
      .populate('relatedProject', 'title')
      .populate('relatedGroup', 'name type')
      .populate('relatedTask', 'title priority status')
      .populate('relatedPost', 'content title');

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipient: userId }, { user: userId }],
      read: false
    });

    emitToUser(userId, 'notification_unread_count', { unreadCount });
    emitToUser(userId, 'notification_read', { notificationId: notif._id, unreadCount });

    res.json({
      success: true,
      unreadCount,
      data: notif
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all or /api/notifications/mark-all-read
// @access  Private
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { user: userId }
        ],
        read: false
      },
      { read: true }
    );

    emitToUser(userId, 'notification_unread_count', { unreadCount: 0 });
    emitToUser(userId, 'all_notifications_read', { userId });

    res.json({
      success: true,
      unreadCount: 0,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { recipient: userId },
        { user: userId }
      ]
    });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipient: userId }, { user: userId }],
      read: false
    });

    emitToUser(userId, 'notification_unread_count', { unreadCount });

    res.json({
      success: true,
      unreadCount,
      message: 'Notification removed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create and send a notification
// @route   POST /api/notifications
// @access  Private
export const sendNotificationDirect = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { recipientId, type, title, message, link, metadata, relatedProject, relatedGroup, relatedTask, relatedPost } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({ success: false, message: 'recipientId and message are required' });
    }

    const notif = await createNotification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      link,
      metadata,
      relatedProject,
      relatedGroup,
      relatedTask,
      relatedPost
    });

    res.status(201).json({
      success: true,
      data: notif
    });
  } catch (error) {
    next(error);
  }
};

