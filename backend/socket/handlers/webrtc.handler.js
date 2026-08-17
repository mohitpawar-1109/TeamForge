import Project from '../../models/Project.js';
import Group from '../../models/Group.js';

/**
 * WebRTC Video Collaboration Signaling Handler
 * Manages secure peer-to-peer WebRTC signaling, authorization, media toggles, and participant tracking.
 */

// Active meetings in memory: roomId -> Map(socketId -> { userId, userName, userAvatar, isAudioMuted, isVideoOff, isScreenSharing })
const activeMeetings = new Map();

// Helper to verify user is authorized for project/group meeting room
export const isUserAuthorizedForMeeting = async (userId, roomId) => {
  if (!userId || !roomId) return false;

  // Format: "project-<projectId>" or "group-<groupId>" or direct roomId
  if (roomId.startsWith('project-')) {
    const projectId = roomId.replace('project-', '');
    const project = await Project.findById(projectId).select('owner members');
    if (!project) return false;

    const isOwner = project.owner && (project.owner._id || project.owner).toString() === userId.toString();
    const isMember = (project.members || []).some(
      (m) => (m.user?._id || m.user || m).toString() === userId.toString()
    );
    return isOwner || isMember;
  }

  if (roomId.startsWith('group-')) {
    const groupId = roomId.replace('group-', '');
    const group = await Group.findById(groupId).select('isPublic members createdBy');
    if (!group) return false;
    if (group.isPublic) return true;

    const isOwner = group.createdBy && (group.createdBy._id || group.createdBy).toString() === userId.toString();
    const isMember = (group.members || []).some(
      (m) => (m.user?._id || m.user || m).toString() === userId.toString()
    );
    return isOwner || isMember;
  }

  return true; // Generic authorized meeting
};

export const registerWebRTCHandlers = (io, socket) => {
  const user = socket.user;
  if (!user) return;

  const userId = user._id.toString();
  const userName = user.name || 'Team Member';
  const userAvatar = user.avatar || '';

  // 1. Join Video Meeting Room
  socket.on('join_meeting', async ({ roomId }, callback) => {
    try {
      if (!roomId) {
        if (callback) callback({ success: false, message: 'Room ID is required.' });
        return;
      }

      // Verify membership authorization
      const isAuth = await isUserAuthorizedForMeeting(userId, roomId);
      if (!isAuth) {
        if (callback) callback({ success: false, message: 'Unauthorized. You must be a member of this team or group to join.' });
        return;
      }

      // Join socket room
      socket.join(roomId);

      if (!activeMeetings.has(roomId)) {
        activeMeetings.set(roomId, new Map());
      }

      const roomParticipants = activeMeetings.get(roomId);

      // Participant descriptor
      const participantInfo = {
        socketId: socket.id,
        userId,
        userName,
        userAvatar,
        isAudioMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        joinedAt: new Date().toISOString()
      };

      // Gather existing participants to return to the newcomer
      const existingParticipants = Array.from(roomParticipants.values()).filter(
        (p) => p.socketId !== socket.id
      );

      // Save new participant
      roomParticipants.set(socket.id, participantInfo);

      // Notify other participants in the room
      socket.to(roomId).emit('meeting_user_joined', {
        participant: participantInfo
      });

      console.log(`[WebRTC] User ${userName} (${socket.id}) joined meeting: ${roomId}`);

      if (callback) {
        callback({
          success: true,
          roomId,
          existingParticipants,
          currentParticipant: participantInfo
        });
      }
    } catch (err) {
      console.error('[WebRTC join_meeting error]:', err);
      if (callback) callback({ success: false, message: 'Failed to join meeting room.' });
    }
  });

  // 2. WebRTC Peer-to-Peer Offer
  socket.on('webrtc_offer', ({ targetSocketId, sdp, callerInfo }) => {
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('webrtc_offer', {
      senderSocketId: socket.id,
      sdp,
      callerInfo: callerInfo || { userId, userName, userAvatar }
    });
  });

  // 3. WebRTC Peer-to-Peer Answer
  socket.on('webrtc_answer', ({ targetSocketId, sdp, responderInfo }) => {
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('webrtc_answer', {
      senderSocketId: socket.id,
      sdp,
      responderInfo: responderInfo || { userId, userName, userAvatar }
    });
  });

  // 4. WebRTC ICE Candidate Exchange
  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
    if (!targetSocketId || !candidate) return;
    io.to(targetSocketId).emit('webrtc_ice_candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  // 5. Toggle Media State (Audio/Video/Screen)
  socket.on('meeting_media_toggle', ({ roomId, type, enabled }) => {
    if (!roomId || !activeMeetings.has(roomId)) return;

    const roomParticipants = activeMeetings.get(roomId);
    const participant = roomParticipants.get(socket.id);

    if (participant) {
      if (type === 'audio') participant.isAudioMuted = !enabled;
      if (type === 'video') participant.isVideoOff = !enabled;
      if (type === 'screen') participant.isScreenSharing = enabled;

      socket.to(roomId).emit('meeting_media_toggled', {
        socketId: socket.id,
        userId,
        type,
        enabled
      });
    }
  });

  // 6. Leave Video Meeting
  const handleLeaveMeeting = (roomId) => {
    if (!roomId || !activeMeetings.has(roomId)) return;

    const roomParticipants = activeMeetings.get(roomId);
    if (roomParticipants.has(socket.id)) {
      roomParticipants.delete(socket.id);
      socket.leave(roomId);

      socket.to(roomId).emit('meeting_user_left', {
        socketId: socket.id,
        userId,
        userName
      });

      console.log(`[WebRTC] User ${userName} (${socket.id}) left meeting: ${roomId}`);

      if (roomParticipants.size === 0) {
        activeMeetings.delete(roomId);
      }
    }
  };

  socket.on('leave_meeting', ({ roomId }) => {
    handleLeaveMeeting(roomId);
  });

  // 7. Cleanup on Socket Disconnect
  socket.on('disconnect', () => {
    activeMeetings.forEach((participants, rId) => {
      if (participants.has(socket.id)) {
        handleLeaveMeeting(rId);
      }
    });
  });
};
