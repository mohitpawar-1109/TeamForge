import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import { emitToRoom, emitToUser } from '../socket/socket.js';

// Helper to populate sender & replyTo fields
const populateMessageQuery = (query) => {
  return query
    .populate('sender', 'name avatar headline college email')
    .populate({
      path: 'replyTo',
      select: 'content sender createdAt type isDeleted attachments',
      populate: {
        path: 'sender',
        select: 'name avatar'
      }
    });
};

// @desc    Get message history for a room with pagination
// @route   GET /api/messages/:roomId
// @access  Private
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // ISO date string or timestamp

    const filter = { roomId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    // Fetch in descending order to get the most recent N messages before cursor, then reverse for display
    const messages = await populateMessageQuery(
      Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
    );

    // Reverse to chronological order (oldest -> newest)
    const chronologicalMessages = messages.reverse();

    // Determine if there are older messages available
    let hasMore = false;
    if (chronologicalMessages.length > 0) {
      const oldestDate = chronologicalMessages[0].createdAt;
      const olderCount = await Message.countDocuments({ roomId, createdAt: { $lt: oldestDate } });
      hasMore = olderCount > 0;
    }

    res.json({
      success: true,
      count: chronologicalMessages.length,
      hasMore,
      data: chronologicalMessages
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
    const { content, type = 'text', attachments = [], project, recipient, replyTo, group } = req.body;

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

    let validGroupId = undefined;
    if (group && mongoose.Types.ObjectId.isValid(group)) {
      validGroupId = group;
    } else if (roomId.startsWith('group:')) {
      const potentialId = roomId.replace('group:', '');
      if (mongoose.Types.ObjectId.isValid(potentialId)) {
        validGroupId = potentialId;
      }
    }

    let validRecipientId = undefined;
    if (recipient && mongoose.Types.ObjectId.isValid(recipient)) {
      validRecipientId = recipient;
    }

    let validReplyTo = undefined;
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      validReplyTo = replyTo;
    }

    const message = await Message.create({
      sender: req.user._id,
      roomId: roomId.trim(),
      content: content.trim(),
      type,
      attachments,
      project: validProjectId,
      group: validGroupId,
      recipient: validRecipientId,
      replyTo: validReplyTo,
      readBy: [{ user: req.user._id, readAt: new Date() }]
    });

    // Update group's lastMessage if applicable
    if (validGroupId) {
      await Group.findByIdAndUpdate(validGroupId, {
        lastMessage: {
          content: content.trim().substring(0, 100),
          sender: req.user._id,
          createdAt: new Date()
        }
      });
    }

    const populated = await populateMessageQuery(Message.findById(message._id));

    // Broadcast real-time event through Socket.IO
    emitToRoom(roomId, 'new_message', populated);

    if (validRecipientId) {
      emitToUser(validRecipientId, 'new_message', populated);
    }

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete own message or message in managed group
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Valid message ID is required.' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const isSender = message.sender.toString() === req.user._id.toString();
    let isAuthorized = isSender;

    if (!isAuthorized && message.group) {
      const groupDoc = await Group.findById(message.group);
      if (groupDoc) {
        const mem = groupDoc.members.find(m => m.user.toString() === req.user._id.toString());
        if (mem && (mem.role === 'admin' || mem.role === 'lead')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this message.' });
    }

    // Soft delete message
    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.deletedAt = new Date();
    await message.save();

    // Broadcast real-time deletion
    emitToRoom(message.roomId, 'message_deleted', {
      messageId: message._id.toString(),
      roomId: message.roomId
    });

    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        _id: message._id,
        roomId: message.roomId,
        isDeleted: true
      }
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
