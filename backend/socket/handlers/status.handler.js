// In-memory map of userId -> Set of active socket IDs
const onlineUsers = new Map();

export const registerStatusHandlers = (io, socket) => {
  const userId = socket.userId;
  const userName = socket.user?.name || 'User';

  // Add socket ID to user's active socket set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  const userSockets = onlineUsers.get(userId);
  const wasAlreadyOnline = userSockets.size > 0;
  userSockets.add(socket.id);

  // Automatically join personal room for targeted events & notifications
  socket.join(`user:${userId}`);

  // If newly came online, broadcast to all connected clients
  if (!wasAlreadyOnline) {
    io.emit('user_online', {
      userId,
      name: userName,
      onlineAt: new Date().toISOString()
    });
  }

  // Send current online users list to this connected client
  socket.emit('online_users_list', Array.from(onlineUsers.keys()));

  // Request online users list on demand
  socket.on('get_online_users', () => {
    socket.emit('online_users_list', Array.from(onlineUsers.keys()));
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    if (onlineUsers.has(userId)) {
      const activeSockets = onlineUsers.get(userId);
      activeSockets.delete(socket.id);

      if (activeSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user_offline', {
          userId,
          offlineAt: new Date().toISOString()
        });
      }
    }
  });
};

export const isUserOnline = (userId) => {
  if (!userId) return false;
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};
