import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { info } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  // Compute Socket server base URL
  const getSocketURL = () => {
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
  };

  useEffect(() => {
    const token = localStorage.getItem('teamforge_token');

    // Only establish socket connection if user is logged in
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    const socketUrl = getSocketURL();

    // Create and configure socket instance
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socketRef.current = socketInstance;

    // Connection Events
    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('get_online_users');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket Connection Error]:', err.message);
      setIsConnected(false);
    });

    // Presence Tracking
    socketInstance.on('online_users_list', (usersList) => {
      setOnlineUsers(new Set((usersList || []).map(String)));
    });

    socketInstance.on('user_online', ({ userId }) => {
      if (userId) {
        setOnlineUsers((prev) => new Set([...prev, String(userId)]));
      }
    });

    socketInstance.on('user_offline', ({ userId }) => {
      if (userId) {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(String(userId));
          return updated;
        });
      }
    });

    // Cleanup on logout or unmount
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
    };
  }, [isAuthenticated, user?._id]);

  // Helper Methods
  const joinRoom = useCallback((roomId, callback) => {
    if (socketRef.current && isConnected && roomId) {
      socketRef.current.emit('join_room', { roomId }, callback);
    }
  }, [isConnected]);

  const leaveRoom = useCallback((roomId, callback) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('leave_room', { roomId }, callback);
    }
  }, []);

  const sendMessage = useCallback((messagePayload, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', messagePayload, callback);
    } else if (callback) {
      callback({ success: false, message: 'Socket is not connected.' });
    }
  }, [isConnected]);

  const sendTyping = useCallback((roomId, isTyping) => {
    if (socketRef.current && isConnected && roomId) {
      socketRef.current.emit(isTyping ? 'typing_start' : 'typing_stop', { roomId });
    }
  }, [isConnected]);

  const markMessagesRead = useCallback((roomId, callback) => {
    if (socketRef.current && isConnected && roomId) {
      socketRef.current.emit('mark_messages_read', { roomId }, callback);
    }
  }, [isConnected]);

  const isUserOnline = useCallback((targetUserId) => {
    if (!targetUserId) return false;
    return onlineUsers.has(String(targetUserId));
  }, [onlineUsers]);

  const subscribeToEvent = useCallback((eventName, handler) => {
    const socket = socketRef.current;
    if (socket && eventName && handler) {
      socket.on(eventName, handler);
      return () => {
        socket.off(eventName, handler);
      };
    }
    return () => {};
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendTyping,
        markMessagesRead,
        isUserOnline,
        subscribeToEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
