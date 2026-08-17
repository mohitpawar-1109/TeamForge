import Notification from '../../models/Notification.js';

export const registerNotificationHandlers = (io, socket) => {
  const userId = socket.userId;
  if (!userId) return;

  // Auto-join personal user notification room
  socket.join(`user:${userId}`);

  // Subscribe to personal notification channel explicitly
  socket.on('subscribe_notifications', async () => {
    socket.join(`user:${userId}`);
    const unreadCount = await Notification.countDocuments({
      $or: [{ recipient: userId }, { user: userId }],
      read: false
    });
    socket.emit('notification_unread_count', { unreadCount });
    socket.emit('subscribed_notifications', { userId });
  });

  // Socket action: Mark single notification read
  socket.on('mark_notification_read', async (data) => {
    try {
      const { notificationId } = data || {};
      if (!notificationId) return;

      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          $or: [{ recipient: userId }, { user: userId }]
        },
        { read: true }
      );

      const unreadCount = await Notification.countDocuments({
        $or: [{ recipient: userId }, { user: userId }],
        read: false
      });

      io.to(`user:${userId}`).emit('notification_unread_count', { unreadCount });
      io.to(`user:${userId}`).emit('notification_read', { notificationId, unreadCount });
    } catch (err) {
      console.warn('[Socket Notif Handler Error]:', err.message);
    }
  });

  // Socket action: Mark all read
  socket.on('mark_all_read', async () => {
    try {
      await Notification.updateMany(
        {
          $or: [{ recipient: userId }, { user: userId }],
          read: false
        },
        { read: true }
      );

      io.to(`user:${userId}`).emit('notification_unread_count', { unreadCount: 0 });
      io.to(`user:${userId}`).emit('all_notifications_read', { userId });
    } catch (err) {
      console.warn('[Socket Notif Handler Error]:', err.message);
    }
  });
};

