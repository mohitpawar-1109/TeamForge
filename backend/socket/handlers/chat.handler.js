import mongoose from 'mongoose';
import Message from '../../models/Message.js';
import Project from '../../models/Project.js';

export const registerChatHandlers = (io, socket) => {
  const user = socket.user;
  const userId = socket.userId;

  // 1. Join Room (e.g. project:66bf... or direct:user1_user2)
  socket.on('join_room', async (data, callback) => {
    try {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (!roomId) return;

      socket.join(roomId);

      // Acknowledge join
      if (typeof callback === 'function') {
        callback({ success: true, roomId });
      }

      // Notify others in room if appropriate
      socket.to(roomId).emit('user_joined_room', {
        roomId,
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          headline: user.headline
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[Socket Chat Error] join_room failed:', err.message);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
    }
  });

  // 2. Leave Room
  socket.on('leave_room', (data, callback) => {
    try {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (!roomId) return;

      socket.leave(roomId);

      socket.to(roomId).emit('user_left_room', {
        roomId,
        userId,
        name: user.name,
        timestamp: new Date().toISOString()
      });

      if (typeof callback === 'function') {
        callback({ success: true, roomId });
      }
    } catch (err) {
      console.error('[Socket Chat Error] leave_room failed:', err.message);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
    }
  });

  // 3. Send Message
  socket.on('send_message', async (data, callback) => {
    try {
      const { roomId, content, type = 'text', attachments = [], project, recipient } = data;

      if (!roomId || !content || !content.trim()) {
        if (typeof callback === 'function') {
          return callback({ success: false, message: 'Room ID and content are required.' });
        }
        return;
      }

      let validProjectId = undefined;
      if (project && mongoose.Types.ObjectId.isValid(project)) {
        validProjectId = project;
      } else if (roomId.startsWith('project:')) {
        const potentialId = roomId.replace('project:', '');
        if (mongoose.Types.ObjectId.isValid(potentialId)) {
          validProjectId = potentialId;
        }
      }

      let validRecipientId = undefined;
      if (recipient && mongoose.Types.ObjectId.isValid(recipient)) {
        validRecipientId = recipient;
      }

      // Create and persist message in MongoDB
      const messageDoc = await Message.create({
        sender: user._id,
        roomId: roomId.trim(),
        content: content.trim(),
        type,
        attachments,
        project: validProjectId,
        recipient: validRecipientId,
        readBy: [{ user: user._id, readAt: new Date() }]
      });

      const populatedMessage = await Message.findById(messageDoc._id)
        .populate('sender', 'name avatar headline college email');

      // Emit to room (all members in this room receive it)
      io.to(roomId).emit('new_message', populatedMessage);

      // If direct message and recipient is online in their personal room, deliver it there too
      if (recipient) {
        io.to(`user:${recipient}`).emit('new_message', populatedMessage);
      }

      // Delivery acknowledgment to sender
      if (typeof callback === 'function') {
        callback({ success: true, data: populatedMessage });
      }
    } catch (err) {
      console.error('[Socket Chat Error] send_message failed:', err.message);
      if (typeof callback === 'function') {
        callback({ success: false, message: err.message });
      }
    }
  });

  // 4. Typing Indicators
  socket.on('typing_start', (data) => {
    const roomId = typeof data === 'string' ? data : data?.roomId;
    if (!roomId) return;

    socket.to(roomId).emit('user_typing', {
      roomId,
      userId,
      name: user.name,
      avatar: user.avatar
    });
  });

  socket.on('typing_stop', (data) => {
    const roomId = typeof data === 'string' ? data : data?.roomId;
    if (!roomId) return;

    socket.to(roomId).emit('user_stop_typing', {
      roomId,
      userId
    });
  });

  // 5. Read Receipts
  socket.on('mark_messages_read', async (data, callback) => {
    try {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (!roomId) return;

      const now = new Date();

      // Add user to readBy array for unread messages in this room
      await Message.updateMany(
        {
          roomId,
          'readBy.user': { $ne: user._id }
        },
        {
          $addToSet: {
            readBy: { user: user._id, readAt: now }
          }
        }
      );

      // Broadcast read receipt to room
      io.to(roomId).emit('messages_read', {
        roomId,
        userId,
        readAt: now.toISOString()
      });

      if (typeof callback === 'function') {
        callback({ success: true, roomId });
      }
    } catch (err) {
      console.error('[Socket Chat Error] mark_messages_read failed:', err.message);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
    }
  });
};
