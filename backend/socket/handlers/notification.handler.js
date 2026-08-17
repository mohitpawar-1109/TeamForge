export const registerNotificationHandlers = (io, socket) => {
  const userId = socket.userId;

  // Subscribe to personal notification channel explicitly
  socket.on('subscribe_notifications', () => {
    socket.join(`user:${userId}`);
    socket.emit('subscribed_notifications', { userId });
  });
};
