import Notification from '../models/Notification.js';

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
      .populate('relatedProject', 'title')
      .populate('relatedPost', 'content title type')
      .populate('relatedTeamRequest', 'status')
      .sort({ createdAt: -1 })
      .limit(50);

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
      .populate('relatedPost', 'content title')
      .populate('relatedProject', 'title');

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
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

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
