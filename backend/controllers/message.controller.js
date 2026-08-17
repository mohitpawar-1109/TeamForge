import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { emitToRoom } from '../socket/socket.js';

// @desc    Get message history for a room
// @route   GET /api/messages/:roomId
// @access  Private
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const before = req.query.before; // For pagination if needed

    const filter = { roomId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name avatar headline college email')
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message via REST endpoint
// @route   POST /api/messages/:roomId
// @access  Private
export const sendRoomMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', attachments = [], project, recipient } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
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

    const message = await Message.create({
      sender: req.user._id,
      roomId: roomId.trim(),
      content: content.trim(),
      type,
      attachments,
      project: validProjectId,
      recipient: validRecipientId,
      readBy: [{ user: req.user._id, readAt: new Date() }]
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar headline college email');

    // Broadcast real-time event through Socket.IO
    emitToRoom(roomId, 'new_message', populated);

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages in a room as read
// @route   PATCH /api/messages/:roomId/read
// @access  Private
export const markRoomMessagesRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    const now = new Date();

    await Message.updateMany(
      {
        roomId,
        'readBy.user': { $ne: userId }
      },
      {
        $addToSet: {
          readBy: { user: userId, readAt: now }
        }
      }
    );

    emitToRoom(roomId, 'messages_read', {
      roomId,
      userId: userId.toString(),
      readAt: now.toISOString()
    });

    res.json({
      success: true,
      message: 'Room messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};
