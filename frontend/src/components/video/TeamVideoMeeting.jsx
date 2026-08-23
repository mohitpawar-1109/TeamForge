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
  MessageSquare,
  Volume2
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { meetingAPI } from '../../services/api';

/**
 * TeamForge WebRTC Video & Multi-Participant Audio Collaboration Room
 * Full-mesh peer-to-peer audio/video streaming with screen share, authorization,
 * dedicated per-participant audio streams, ICE candidate queuing, and media controls.
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
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [participants, setParticipants] = useState(new Map());
  const [mediaError, setMediaError] = useState(null);

  // Refs for stable, non-stale WebRTC resources across closures
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const iceCandidateQueues = useRef(new Map());
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);
  const containerRef = useRef(null);

  // Helper: Flush queued ICE candidates after remote description is set
  const processQueuedIceCandidates = async (targetSocketId, pc) => {
    const queued = iceCandidateQueues.current.get(targetSocketId);
    if (queued && queued.length > 0) {
      console.log(`[WEBRTC] Processing ${queued.length} queued ICE candidates for ${targetSocketId}`);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn(`[WEBRTC] Error adding queued ICE candidate for ${targetSocketId}:`, err);
        }
      }
      iceCandidateQueues.current.delete(targetSocketId);
    }
  };

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
        console.warn('[WEBRTC] Camera/Mic combined permission failed, attempting audio only:', camErr.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          setIsVideoEnabled(false);
        } catch (micErr) {
          console.warn('[WEBRTC] Microphone permission also failed. Generating dummy audio track for negotiation:', micErr.message);
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          osc.connect(dst);
          osc.start();
          stream = dst.stream;
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
          setMediaError('Camera & Microphone unavailable. You can still view and hear other participants.');
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('[WEBRTC] Failed to acquire media stream:', err);
      setMediaError('Could not access media devices.');
      return null;
    }
  };

  // 2. Create WebRTC Peer Connection for a remote peer
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peersRef.current.has(targetSocketId)) {
      console.log(`[WEBRTC] Reusing existing RTCPeerConnection for ${targetSocketId}`);
      return peersRef.current.get(targetSocketId);
    }

    console.log(`[WEBRTC] Creating new RTCPeerConnection for peer ${targetSocketId}`);
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    peersRef.current.set(targetSocketId, pc);

    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const track = event.track;
      let remoteStream = remoteStreamsRef.current.get(targetSocketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteStreamsRef.current.set(targetSocketId, remoteStream);
      }

      remoteStream.getTracks().filter((t) => t.kind === track.kind).forEach((t) => {
        remoteStream.removeTrack(t);
      });
      remoteStream.addTrack(track);

      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(targetSocketId) || { socketId: targetSocketId };
        next.set(targetSocketId, {
          ...p,
          stream: remoteStream,
          lastUpdated: Date.now()
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(targetSocketId);
        remoteStreamsRef.current.delete(targetSocketId);
        iceCandidateQueues.current.delete(targetSocketId);
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
    let isMounted = true;

    const setupMeeting = async () => {
      if (!socket || !roomId) return;

      try {
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

        await initLocalMedia();

        if (!isMounted) return;

        socket.emit('join_meeting', { roomId }, async (resp) => {
          if (!resp?.success) {
            error(resp?.message || 'Could not join meeting.');
            onLeave && onLeave();
            return;
          }

          setConnectionStatus('connected');
          const existing = resp.existingParticipants || [];

          for (const participant of existing) {
            const targetSocketId = participant.socketId;
            setParticipants((prev) => new Map(prev).set(targetSocketId, { ...participant }));

            const pc = createPeerConnection(targetSocketId);
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
        error(err.response?.data?.message || 'Failed to authenticate meeting.');
        onLeave && onLeave();
      }
    };

    setupMeeting();

    const handleUserJoined = ({ participant }) => {
      info(`${participant.userName} joined the meeting.`);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(participant.socketId, { ...participant });
        return next;
      });
    };

    const handleOffer = async ({ senderSocketId, sdp, callerInfo }) => {
      let pc = peersRef.current.get(senderSocketId);
      if (!pc) {
        pc = createPeerConnection(senderSocketId);
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
      await processQueuedIceCandidates(senderSocketId, pc);

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

    const handleAnswer = async ({ senderSocketId, sdp }) => {
      const pc = peersRef.current.get(senderSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await processQueuedIceCandidates(senderSocketId, pc);
      }
    };

    const handleIceCandidate = async ({ senderSocketId, candidate }) => {
      if (!candidate) return;
      const pc = peersRef.current.get(senderSocketId);

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WEBRTC] Candidate add error:', e);
        }
      } else {
        if (!iceCandidateQueues.current.has(senderSocketId)) {
          iceCandidateQueues.current.set(senderSocketId, []);
        }
        iceCandidateQueues.current.get(senderSocketId).push(candidate);
      }
    };

    const handleMediaToggled = ({ socketId, type, enabled }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) {
          if (type === 'audio') p.isAudioMuted = !enabled;
          if (type === 'video') p.isVideoOff = !enabled;
          if (type === 'screen') p.isScreenSharing = enabled;
          next.set(socketId, { ...p, lastUpdated: Date.now() });
        }
        return next;
      });
    };

    const handleUserLeft = ({ socketId, userName }) => {
      info(`${userName || 'A participant'} left the meeting.`);

      if (peersRef.current.has(socketId)) {
        try {
          peersRef.current.get(socketId).close();
        } catch (e) {}
        peersRef.current.delete(socketId);
      }
      if (remoteStreamsRef.current.has(socketId)) {
        const stream = remoteStreamsRef.current.get(socketId);
        stream.getTracks().forEach((t) => t.stop());
        remoteStreamsRef.current.delete(socketId);
      }
      iceCandidateQueues.current.delete(socketId);
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

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      peersRef.current.forEach((pc) => {
        try { pc.close(); } catch (e) {}
      });
      peersRef.current.clear();
      remoteStreamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((t) => t.stop());
      });
      remoteStreamsRef.current.clear();
      iceCandidateQueues.current.clear();
    };
  }, [roomId, socket, createPeerConnection]);

  const toggleMicrophone = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextState = !isAudioEnabled;
      audioTracks.forEach((track) => {
        track.enabled = nextState;
      });
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

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextState = !isVideoEnabled;
      videoTracks.forEach((track) => {
        track.enabled = nextState;
      });
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

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        const screenTrack = sStream.getVideoTracks()[0];

        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

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

        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.warn('[WEBRTC] Screen share canceled or failed:', err);
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

    const stream = localStreamRef.current;
    if (stream) {
      const camTrack = stream.getVideoTracks()[0];
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
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

  const handleLeave = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (socket) {
      socket.emit('leave_meeting', { roomId });
    }
    onLeave && onLeave();
  };

  const participantList = Array.from(participants.values());
  const totalCount = participantList.length + 1;

  const getGridColsClass = () => {
    if (totalCount === 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (totalCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalCount <= 4) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#0A0A0A] border border-[#242424] rounded-3xl overflow-hidden shadow-soft relative ${
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[750px] max-h-[85vh]'
      }`}
    >
      {/* Top Video Room Header */}
      <div className="p-4 bg-[#111111] border-b border-[#1F1F1F] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#F5F5F5] tracking-tight truncate max-w-xs sm:max-w-md">
                {meetingTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20D47A] animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs font-mono text-[#888888] flex items-center gap-2 mt-0.5">
              <span>{totalCount} Active {totalCount === 1 ? 'Participant' : 'Participants'}</span>
              <span>•</span>
              <span className="text-[#20D47A] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> WebRTC Encrypted Mesh
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[#888888] hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mediaError && (
        <div className="px-4 py-2 bg-[#F2B705]/10 border-b border-[#F2B705]/30 text-[#F2B705] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Video & Audio Tiles Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-black flex items-center justify-center">
        <div className={`w-full grid gap-4 ${getGridColsClass()}`}>
          {/* Local User Tile */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#111111] border border-[#242424] shadow-soft group flex items-center justify-center">
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
                <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-white flex items-center justify-center text-lg font-mono font-bold shadow-soft">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-mono text-[#888888]">Camera is off</span>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-[#F5F5F5] border border-[#242424] shadow-md flex items-center gap-1.5">
                <span>{user?.name || 'You'} (You)</span>
              </span>
              {isScreenSharing && (
                <span className="px-2 py-0.5 rounded-full bg-[#E50914] text-white text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> Screen
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <div
                className={`p-1.5 rounded-full backdrop-blur-md ${
                  !isAudioEnabled
                    ? 'bg-[#FF1F2D] text-white'
                    : 'bg-black/60 text-[#20D47A] border border-[#242424]'
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

      {/* Bottom Control Bar */}
      <div className="p-4 bg-[#111111] border-t border-[#1F1F1F] flex items-center justify-center gap-3 sm:gap-4 z-10">
        <button
          type="button"
          onClick={toggleMicrophone}
          className={`p-3 sm:px-5 rounded-full font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            isAudioEnabled
              ? 'bg-[#161616] hover:bg-[#202020] text-[#F5F5F5] border border-[#242424]'
              : 'bg-[#FF1F2D] text-white shadow-[0_0_12px_rgba(255,31,45,0.4)]'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">{isAudioEnabled ? 'Mute' : 'Unmuted'}</span>
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className={`p-3 sm:px-5 rounded-full font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            isVideoEnabled
              ? 'bg-[#161616] hover:bg-[#202020] text-[#F5F5F5] border border-[#242424]'
              : 'bg-[#FF1F2D] text-white shadow-[0_0_12px_rgba(255,31,45,0.4)]'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`p-3 sm:px-5 rounded-full font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            isScreenSharing
              ? 'bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
              : 'bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white border border-[#242424]'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
        </button>

        <button
          type="button"
          onClick={handleLeave}
          className="p-3 sm:px-6 rounded-full bg-[#E50914] hover:bg-[#FF1F2D] text-white font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(229,9,20,0.4)] cursor-pointer active:scale-95"
          title="Leave Meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};

const RemoteVideoTile = ({ participant }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl && participant.stream) {
      if (audioEl.srcObject !== participant.stream) {
        audioEl.srcObject = participant.stream;
      }
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[WEBRTC] Audio successfully playing for participant ${participant.userName || participant.socketId}`);
          })
          .catch((err) => {
            console.warn(`[WEBRTC] Remote audio play() blocked for ${participant.userName || participant.socketId}:`, err);
          });
      }
    }
  }, [participant.stream, participant.lastUpdated]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && participant.stream) {
      if (videoEl.srcObject !== participant.stream) {
        videoEl.srcObject = participant.stream;
      }
    }
  }, [participant.stream, participant.lastUpdated, participant.isVideoOff]);

  const isVideoOff = participant.isVideoOff || !participant.stream;
  const isAudioMuted = participant.isAudioMuted;

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#111111] border border-[#242424] shadow-soft flex items-center justify-center">
      <audio
        ref={audioRef}
        autoPlay
        playsInline
      />

      {participant.stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center text-lg font-mono font-bold shadow-inner">
            {participant.userName?.charAt(0) || 'P'}
          </div>
          <span className="text-xs font-mono text-[#888888]">{participant.userName || 'Peer'}</span>
        </div>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-[#F5F5F5] border border-[#242424] shadow-md">
          {participant.userName || 'Team Member'}
        </span>
        {participant.isScreenSharing && (
          <span className="px-2 py-0.5 rounded-full bg-[#E50914] text-white text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
            <Monitor className="w-3 h-3" /> Screen
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div
          className={`p-1.5 rounded-full backdrop-blur-md ${
            isAudioMuted ? 'bg-[#FF1F2D] text-white' : 'bg-black/60 text-[#20D47A] border border-[#242424]'
          }`}
          title={isAudioMuted ? 'Microphone Muted' : 'Microphone Active'}
        >
          {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
};
