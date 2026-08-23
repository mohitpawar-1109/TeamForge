import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  Signal,
  AlertTriangle,
  User,
  Settings,
  MessageSquare
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { meetingAPI } from '../../services/api';

/**
 * TeamForge WebRTC Video Collaboration Room
 * Full-mesh peer-to-peer audio/video streaming with screen share, authorization, and media controls.
 */
export const TeamVideoMeeting = ({
  roomId,
  projectId = null,
  groupId = null,
  onLeave = null
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  // Media States
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Connection & Room States
  const [meetingTitle, setMeetingTitle] = useState('Team Video Meeting');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [participants, setParticipants] = useState(new Map()); // socketId -> { info, stream, peerConnection }
  const [mediaError, setMediaError] = useState(null);

  // Refs
  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);
  const containerRef = useRef(null);

  // 1. Initialize Local Media Stream
  const initLocalMedia = async () => {
    try {
      setMediaError(null);
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (camErr) {
        console.warn('Camera/Mic permission failed, attempting audio only:', camErr.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsVideoEnabled(false);
        } catch (micErr) {
          console.warn('Microphone permission also failed. Using simulated dummy track for reception:', micErr.message);
          // Create dummy silent audio track so WebRTC negotiation completes cleanly
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          osc.connect(dst);
          osc.start();
          stream = dst.stream;
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
          setMediaError('Camera & Microphone unavailable. You can still view other participants.');
        }
      }

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to acquire media stream:', err);
      setMediaError('Could not access media devices.');
      return null;
    }
  };

  // 2. Create WebRTC Peer Connection for a remote peer
  const createPeerConnection = useCallback((targetSocketId, currentLocalStream) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    peersRef.current.set(targetSocketId, pc);

    // Add local tracks to peer connection
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });
    }

    // ICE candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote track arrived
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${targetSocketId}`);
      let remoteStream = remoteStreamsRef.current.get(targetSocketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, remoteStream);
      }
      remoteStream.addTrack(event.track);

      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(targetSocketId) || { socketId: targetSocketId };
        next.set(targetSocketId, {
          ...p,
          stream: remoteStream
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // Cleanup failed peer
        peersRef.current.delete(targetSocketId);
        remoteStreamsRef.current.delete(targetSocketId);
        setParticipants((prev) => {
          const next = new Map(prev);
          next.delete(targetSocketId);
          return next;
        });
      }
    };

    return pc;
  }, [socket]);

  // 3. Main Room Join & Signaling Event Handlers
  useEffect(() => {
    let activeStream = null;
    let isMounted = true;

    const setupMeeting = async () => {
      if (!socket || !roomId) return;

      try {
        // Get authorized meeting configuration & ICE servers
        const res = await meetingAPI.getMeetingConfig({
          roomId,
          projectId,
          groupId
        });

        if (!res.data?.success) {
          error(res.data?.message || 'Access denied to this meeting room.');
          onLeave && onLeave();
          return;
        }

        if (res.data.data.iceServers) {
          iceServersRef.current = res.data.data.iceServers;
        }
        if (res.data.data.title) {
          setMeetingTitle(res.data.data.title);
        }

        // Initialize local video/audio
        activeStream = await initLocalMedia();

        if (!isMounted) return;

        // Join socket room
        socket.emit('join_meeting', { roomId }, async (resp) => {
          if (!resp?.success) {
            error(resp?.message || 'Could not join meeting.');
            onLeave && onLeave();
            return;
          }

          setConnectionStatus('connected');
          const existing = resp.existingParticipants || [];

          // Connect to each existing participant by creating an Offer
          for (const participant of existing) {
            const targetSocketId = participant.socketId;
            setParticipants((prev) => new Map(prev).set(targetSocketId, { ...participant }));

            const pc = createPeerConnection(targetSocketId, activeStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('webrtc_offer', {
              targetSocketId,
              sdp: offer,
              callerInfo: {
                userId: user?._id,
                userName: user?.name,
                userAvatar: user?.avatar
              }
            });
          }
        });
      } catch (err) {
        console.error('Error establishing meeting session:', err);
        error(err.response?.data?.message || 'Failed to authenticate meeting.');
        onLeave && onLeave();
      }
    };

    setupMeeting();

    // Socket Event: New User Joined -> prepare for their offer
    const handleUserJoined = ({ participant }) => {
      info(`${participant.userName} joined the meeting.`);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(participant.socketId, { ...participant });
        return next;
      });
    };

    // Socket Event: WebRTC Offer received
    const handleOffer = async ({ senderSocketId, sdp, callerInfo }) => {
      console.log(`[WebRTC] Received offer from ${senderSocketId}`);
      let pc = peersRef.current.get(senderSocketId);
      if (!pc) {
        pc = createPeerConnection(senderSocketId, activeStream || localStream);
      }

      setParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(senderSocketId) || {};
        next.set(senderSocketId, {
          ...existing,
          ...callerInfo,
          socketId: senderSocketId
        });
        return next;
      });

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc_answer', {
        targetSocketId: senderSocketId,
        sdp: answer,
        responderInfo: {
          userId: user?._id,
          userName: user?.name,
          userAvatar: user?.avatar
        }
      });
    };

    // Socket Event: WebRTC Answer received
    const handleAnswer = async ({ senderSocketId, sdp }) => {
      console.log(`[WebRTC] Received answer from ${senderSocketId}`);
      const pc = peersRef.current.get(senderSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    // Socket Event: ICE Candidate received
    const handleIceCandidate = async ({ senderSocketId, candidate }) => {
      const pc = peersRef.current.get(senderSocketId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    };

    // Socket Event: Media toggled by peer
    const handleMediaToggled = ({ socketId, type, enabled }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) {
          if (type === 'audio') p.isAudioMuted = !enabled;
          if (type === 'video') p.isVideoOff = !enabled;
          if (type === 'screen') p.isScreenSharing = enabled;
          next.set(socketId, { ...p });
        }
        return next;
      });
    };

    // Socket Event: User Left
    const handleUserLeft = ({ socketId, userName }) => {
      info(`${userName || 'A participant'} left the meeting.`);
      if (peersRef.current.has(socketId)) {
        peersRef.current.get(socketId).close();
        peersRef.current.delete(socketId);
      }
      remoteStreamsRef.current.delete(socketId);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    if (socket) {
      socket.on('meeting_user_joined', handleUserJoined);
      socket.on('webrtc_offer', handleOffer);
      socket.on('webrtc_answer', handleAnswer);
      socket.on('webrtc_ice_candidate', handleIceCandidate);
      socket.on('meeting_media_toggled', handleMediaToggled);
      socket.on('meeting_user_left', handleUserLeft);
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.emit('leave_meeting', { roomId });
        socket.off('meeting_user_joined', handleUserJoined);
        socket.off('webrtc_offer', handleOffer);
        socket.off('webrtc_answer', handleAnswer);
        socket.off('webrtc_ice_candidate', handleIceCandidate);
        socket.off('meeting_media_toggled', handleMediaToggled);
        socket.off('meeting_user_left', handleUserLeft);
      }

      // Cleanup local tracks
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }

      // Cleanup all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, [roomId, socket, createPeerConnection]);

  // 4. Toggle Microphone (Audio Track)
  const toggleMicrophone = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !isAudioEnabled;
      audioTrack.enabled = nextState;
      setIsAudioEnabled(nextState);

      if (socket) {
        socket.emit('meeting_media_toggle', {
          roomId,
          type: 'audio',
          enabled: nextState
        });
      }
    }
  };

  // 5. Toggle Camera (Video Track)
  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !isVideoEnabled;
      videoTrack.enabled = nextState;
      setIsVideoEnabled(nextState);

      if (socket) {
        socket.emit('meeting_media_toggle', {
          roomId,
          type: 'video',
          enabled: nextState
        });
      }
    }
  };

  // 6. Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        const screenTrack = sStream.getVideoTracks()[0];

        // Replace track on all active peer connections
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = sStream;
        }

        setScreenStream(sStream);
        setIsScreenSharing(true);

        if (socket) {
          socket.emit('meeting_media_toggle', {
            roomId,
            type: 'screen',
            enabled: true
          });
        }

        // Handle user stopping share via browser native banner
        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }

    // Revert video track on all peer connections
    if (localStream) {
      const camTrack = localStream.getVideoTracks()[0];
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    setIsScreenSharing(false);

    if (socket) {
      socket.emit('meeting_media_toggle', {
        roomId,
        type: 'screen',
        enabled: false
      });
    }
  };

  // 7. Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // 8. Leave Meeting Handler
  const handleLeave = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (socket) {
      socket.emit('leave_meeting', { roomId });
    }
    onLeave && onLeave();
  };

  const participantList = Array.from(participants.values());
  const totalCount = participantList.length + 1; // + 1 for local user

  // Adaptive Grid Layout Classes
  const getGridColsClass = () => {
    if (totalCount === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (totalCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalCount <= 4) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#281A21] border border-[#703344] rounded-3xl overflow-hidden shadow-2xl relative ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[750px] max-h-[85vh]'
      }`}
    >
      {/* Top Video Room Header */}
      <div className="p-4 bg-[#4A2A35] border-b border-[#703344] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center shadow-inner">
            <VideoIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#F6E8E2] tracking-tight truncate max-w-xs sm:max-w-md">
                {meetingTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86B190] animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-[#DDA081] flex items-center gap-2 mt-0.5">
              <span>{totalCount} Active {totalCount === 1 ? 'Participant' : 'Participants'}</span>
              <span>•</span>
              <span className="text-[#86B190] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> WebRTC Encrypted
              </span>
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-[#281A21] hover:bg-[#703344] border border-[#703344] text-[#DDA081] hover:text-[#F6E8E2] transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Media Device Notice Banner if limited */}
      {mediaError && (
        <div className="px-4 py-2 bg-[#D99443]/20 border-b border-[#D99443]/40 text-[#E5B079] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Video Tiles Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#281A21] flex items-center justify-center">
        <div className={`w-full grid gap-4 ${getGridColsClass()}`}>
          {/* Local User Tile */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#4A2A35] border-2 border-[#703344] shadow-xl group flex items-center justify-center">
            {isVideoEnabled || isScreenSharing ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] text-[#F6E8E2] flex items-center justify-center text-xl font-extrabold shadow-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-semibold text-[#DDA081]">Camera is off</span>
              </div>
            )}

            {/* Local Tile Floating Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-[#F6E8E2] border border-white/10 shadow-md flex items-center gap-1.5">
                <span>{user?.name || 'You'} (You)</span>
              </span>
              {isScreenSharing && (
                <span className="px-2 py-0.5 rounded-lg bg-[#A84A4D] text-[#F6E8E2] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> Screen
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <div
                className={`p-1.5 rounded-xl backdrop-blur-md ${
                  !isAudioEnabled
                    ? 'bg-[#C04A4D] text-white'
                    : 'bg-black/50 text-[#86B190]'
                }`}
              >
                {!isAudioEnabled ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* Remote Participants Tiles */}
          {participantList.map((participant) => (
            <RemoteVideoTile
              key={participant.socketId}
              participant={participant}
            />
          ))}
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-4 bg-[#4A2A35] border-t border-[#703344] flex items-center justify-center gap-3 sm:gap-4 z-10">
        {/* Microphone Toggle Button */}
        <button
          type="button"
          onClick={toggleMicrophone}
          className={`p-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
            isAudioEnabled
              ? 'bg-[#281A21] hover:bg-[#703344] text-[#F6E8E2] border border-[#703344]'
              : 'bg-[#C04A4D] hover:bg-[#A84A4D] text-white'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="hidden sm:inline text-xs">{isAudioEnabled ? 'Mute' : 'Unmuted'}</span>
        </button>

        {/* Camera Toggle Button */}
        <button
          type="button"
          onClick={toggleCamera}
          className={`p-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
            isVideoEnabled
              ? 'bg-[#281A21] hover:bg-[#703344] text-[#F6E8E2] border border-[#703344]'
              : 'bg-[#C04A4D] hover:bg-[#A84A4D] text-white'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          <span className="hidden sm:inline text-xs">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
        </button>

        {/* Screen Share Button */}
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
            isScreenSharing
              ? 'bg-[#A84A4D] hover:bg-[#CB6B5A] text-[#F6E8E2]'
              : 'bg-[#281A21] hover:bg-[#703344] text-[#DDA081] hover:text-[#F6E8E2] border border-[#703344]'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          <span className="hidden sm:inline text-xs">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
        </button>

        {/* Leave / End Call Button */}
        <button
          type="button"
          onClick={handleLeave}
          className="p-3.5 px-6 rounded-2xl bg-[#C04A4D] hover:bg-[#A84A4D] text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
          title="Leave Meeting"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};

// Remote Participant Video Tile
const RemoteVideoTile = ({ participant }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const isVideoOff = participant.isVideoOff || !participant.stream;
  const isAudioMuted = participant.isAudioMuted;

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#4A2A35] border-2 border-[#703344] shadow-xl flex items-center justify-center">
      {participant.stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center text-xl font-extrabold shadow-inner">
            {participant.userName?.charAt(0) || 'P'}
          </div>
          <span className="text-xs font-semibold text-[#DDA081]">{participant.userName || 'Peer'}</span>
        </div>
      )}

      {/* Floating Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-[#F6E8E2] border border-white/10 shadow-md">
          {participant.userName || 'Team Member'}
        </span>
        {participant.isScreenSharing && (
          <span className="px-2 py-0.5 rounded-lg bg-[#A84A4D] text-[#F6E8E2] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Monitor className="w-3 h-3" /> Screen
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md ${
            isAudioMuted ? 'bg-[#C04A4D] text-white' : 'bg-black/50 text-[#86B190]'
          }`}
        >
          {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
};
