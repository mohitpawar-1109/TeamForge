import Project from '../models/Project.js';
import Group from '../models/Group.js';
import { isUserAuthorizedForMeeting } from '../socket/handlers/webrtc.handler.js';

/**
 * Get Secure WebRTC Meeting Configuration and Authorization
 * @route POST /api/meetings/config
 * @access Private (JWT Authenticated)
 */
export const getMeetingConfig = async (req, res, next) => {
  try {
    const { roomId, projectId, groupId } = req.body;
    const userId = req.user._id;

    const targetRoomId = roomId || (projectId ? `project-${projectId}` : (groupId ? `group-${groupId}` : null));

    if (!targetRoomId) {
      return res.status(400).json({
        success: false,
        message: 'A valid roomId, projectId, or groupId is required.'
      });
    }

    // Verify user authorization
    const isAuthorized = await isUserAuthorizedForMeeting(userId, targetRoomId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be an authorized member of this project or group to join this video meeting.'
      });
    }

    // Retrieve context title
    let meetingTitle = 'TeamForge Video Meeting';
    if (targetRoomId.startsWith('project-')) {
      const proj = await Project.findById(targetRoomId.replace('project-', '')).select('title');
      if (proj) meetingTitle = `${proj.title} • Video Sync`;
    } else if (targetRoomId.startsWith('group-')) {
      const grp = await Group.findById(targetRoomId.replace('group-', '')).select('name');
      if (grp) meetingTitle = `${grp.name} • Video Call`;
    }

    // Standard STUN servers and optional production TURN configuration
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    // Optional Managed TURN configuration (e.g. Twilio Network Traversal, Metered, Xirsys, or self-hosted coturn)
    if (process.env.TURN_SERVER_URL) {
      iceServers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || ''
      });
    }

    res.json({
      success: true,
      data: {
        roomId: targetRoomId,
        title: meetingTitle,
        iceServers,
        authorized: true,
        user: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Meeting Status
 * @route GET /api/meetings/:roomId/status
 * @access Private
 */
export const getMeetingStatus = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const isAuthorized = await isUserAuthorizedForMeeting(userId, roomId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    res.json({
      success: true,
      data: {
        roomId,
        active: true
      }
    });
  } catch (error) {
    next(error);
  }
};
