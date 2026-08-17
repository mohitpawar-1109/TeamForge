import { Server } from 'socket.io';
import { authenticateSocket } from './middleware/auth.socket.middleware.js';
import { registerStatusHandlers } from './handlers/status.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import { registerNotificationHandlers } from './handlers/notification.handler.js';

let io = null;

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('localhost') || origin.includes('vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Apply JWT authentication middleware to all incoming socket handshakes
  io.use(authenticateSocket);

  // Connection Lifecycle
  io.on('connection', (socket) => {
    // Register modular feature handlers
    registerStatusHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on('error', (err) => {
      console.warn(`[Socket Error - ${socket.id}]:`, err.message);
    });
  });

  console.log('[Socket.IO] Real-time collaboration engine initialized.');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Please call initSocket(server) first.');
  }
  return io;
};

// Real-time helper utilities for REST controllers
export const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, data);
};

export const emitToRoom = (roomId, event, data) => {
  if (!io || !roomId) return;
  io.to(roomId).emit(event, data);
};

export const emitNotificationToUser = (userId, notification) => {
  if (!io || !userId) return;
  emitToUser(userId, 'new_notification', notification);
};
