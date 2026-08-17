import { io } from './frontend/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runVideoCollaborationTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING WEBRTC VIDEO COLLABORATION TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  const rand = Math.floor(Math.random() * 100000);

  let tokenA = '', userA = null;
  let tokenB = '', userB = null;
  let tokenC = '', userC = null;
  let project = null;

  let socketA = null;
  let socketB = null;

  // 1. Register Users
  await test('Register User A (Project Lead) & User B (Member)', async () => {
    const resA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Alice VideoLead ${rand}`,
        email: `lead_${rand}@videotest.com`,
        password: 'Password123!',
        headline: 'Lead Architect',
        skills: ['React', 'Node.js']
      })
    });
    const dataA = await resA.json();
    if (!dataA.success) throw new Error(dataA.message);
    tokenA = dataA.data.token;
    userA = dataA.data;

    const resB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Bob VideoDev ${rand}`,
        email: `dev_${rand}@videotest.com`,
        password: 'Password123!',
        headline: 'Frontend Engineer',
        skills: ['React', 'WebRTC']
      })
    });
    const dataB = await resB.json();
    if (!dataB.success) throw new Error(dataB.message);
    tokenB = dataB.data.token;
    userB = dataB.data;

    const resC = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Charlie Outsider ${rand}`,
        email: `outsider_${rand}@videotest.com`,
        password: 'Password123!',
        skills: ['Java']
      })
    });
    const dataC = await resC.json();
    if (!dataC.success) throw new Error(dataC.message);
    tokenC = dataC.data.token;
    userC = dataC.data;
  });

  // 2. Create Project and Add User B as Member
  await test('Create Target Project with Lead & Member', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: `Cloud Sync Video Workspace ${rand}`,
        description: 'Collaborative real-time video project workspace',
        category: 'Web Development',
        difficulty: 'Medium',
        teamSize: 3,
        requiredSkills: ['React', 'WebRTC', 'Node.js']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    project = data.data;

    // Send and accept invitation for User B
    const invRes = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        projectId: project._id,
        receiverId: userB._id,
        role: 'Frontend Developer'
      })
    });
    const invData = await invRes.json();
    if (!invData.success) throw new Error(invData.message);

    const acceptRes = await fetch(`${BASE_URL}/invitations/${invData.data._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    const acceptData = await acceptRes.json();
    if (!acceptData.success) throw new Error(acceptData.message);
  });

  // 3. Test Meeting Authorization (POST /api/meetings/config)
  await test('Authorize Meeting Room (Authorized Lead & Member vs Unauthorized Outsider)', async () => {
    const roomId = `project-${project._id}`;

    // User A (Owner) -> Success
    const resA = await fetch(`${BASE_URL}/meetings/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ roomId })
    });
    const dataA = await resA.json();
    if (!dataA.success || !dataA.data?.authorized) throw new Error('User A failed to authorize meeting');
    if (!Array.isArray(dataA.data.iceServers) || dataA.data.iceServers.length === 0) {
      throw new Error('No STUN/ICE servers returned');
    }

    // User B (Member) -> Success
    const resB = await fetch(`${BASE_URL}/meetings/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ roomId })
    });
    const dataB = await resB.json();
    if (!dataB.success || !dataB.data?.authorized) throw new Error('User B failed to authorize meeting');

    // User C (Unauthorized Outsider) -> 403 Forbidden
    const resC = await fetch(`${BASE_URL}/meetings/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`
      },
      body: JSON.stringify({ roomId })
    });
    if (resC.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized user C, got status ${resC.status}`);
    }
  });

  // 4. Socket.IO Connections for WebRTC Signaling
  await test('Connect Socket.IO Signaling for User A and User B', async () => {
    socketA = io(SOCKET_URL, {
      auth: { token: tokenA },
      transports: ['websocket']
    });

    socketB = io(SOCKET_URL, {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    await Promise.all([
      new Promise((resolve) => socketA.on('connect', resolve)),
      new Promise((resolve) => socketB.on('connect', resolve))
    ]);
  });

  // 5. Test WebRTC Room Join & Signaling Flow
  await test('WebRTC Signaling: join_meeting, webrtc_offer, webrtc_answer, webrtc_ice_candidate', async () => {
    const roomId = `project-${project._id}`;

    // User A joins meeting first
    const joinRespA = await new Promise((resolve) => {
      socketA.emit('join_meeting', { roomId }, resolve);
    });
    if (!joinRespA.success) throw new Error('User A failed to join meeting');

    // Set up User A listeners
    let userBJoinedReceived = false;
    let offerReceivedByA = null;
    let iceCandidateReceivedByA = null;
    let mediaToggledReceivedByA = null;
    let userBLeftReceived = false;

    socketA.on('meeting_user_joined', ({ participant }) => {
      if (participant.userId === userB._id) userBJoinedReceived = true;
    });

    socketA.on('webrtc_offer', ({ senderSocketId, sdp, callerInfo }) => {
      offerReceivedByA = { senderSocketId, sdp, callerInfo };
      // User A answers immediately
      socketA.emit('webrtc_answer', {
        targetSocketId: senderSocketId,
        sdp: { type: 'answer', sdp: 'v=0\r\no=- 2 2 IN IP4 127.0.0.1...' }
      });
    });

    socketA.on('webrtc_ice_candidate', ({ candidate }) => {
      iceCandidateReceivedByA = candidate;
    });

    socketA.on('meeting_media_toggled', ({ type, enabled }) => {
      mediaToggledReceivedByA = { type, enabled };
    });

    socketA.on('meeting_user_left', ({ userId }) => {
      if (userId === userB._id) userBLeftReceived = true;
    });

    // Set up User B listener for answer
    let answerReceivedByB = null;
    socketB.on('webrtc_answer', ({ sdp }) => {
      answerReceivedByB = sdp;
    });

    // User B joins meeting
    const joinRespB = await new Promise((resolve) => {
      socketB.emit('join_meeting', { roomId }, resolve);
    });
    if (!joinRespB.success) throw new Error('User B failed to join meeting');
    if (!joinRespB.existingParticipants.some((p) => p.userId === userA._id)) {
      throw new Error('User A not found in User B existingParticipants');
    }

    // Wait a brief tick for user_joined
    await new Promise((r) => setTimeout(r, 100));
    if (!userBJoinedReceived) throw new Error('User A did not receive meeting_user_joined event');

    // User B sends webrtc_offer to User A
    socketB.emit('webrtc_offer', {
      targetSocketId: socketA.id,
      sdp: { type: 'offer', sdp: 'v=0\r\no=- 1 1 IN IP4 127.0.0.1...' },
      callerInfo: { userId: userB._id, userName: userB.name }
    });

    await new Promise((r) => setTimeout(r, 100));
    if (!offerReceivedByA) throw new Error('User A did not receive webrtc_offer');
    if (!answerReceivedByB) throw new Error('User B did not receive webrtc_answer');

    // User B sends webrtc_ice_candidate to User A
    socketB.emit('webrtc_ice_candidate', {
      targetSocketId: socketA.id,
      candidate: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 }
    });

    await new Promise((r) => setTimeout(r, 100));
    if (!iceCandidateReceivedByA) throw new Error('User A did not receive webrtc_ice_candidate');

    // User B toggles video state
    socketB.emit('meeting_media_toggle', {
      roomId,
      type: 'video',
      enabled: false
    });

    await new Promise((r) => setTimeout(r, 100));
    if (!mediaToggledReceivedByA || mediaToggledReceivedByA.type !== 'video' || mediaToggledReceivedByA.enabled !== false) {
      throw new Error('User A did not receive meeting_media_toggled');
    }

    // User B leaves meeting
    socketB.emit('leave_meeting', { roomId });

    await new Promise((r) => setTimeout(r, 100));
    if (!userBLeftReceived) throw new Error('User A did not receive meeting_user_left');
  });

  // Cleanup Sockets
  if (socketA) socketA.disconnect();
  if (socketB) socketB.disconnect();

  console.log('\n==================================================');
  console.log(`🎉 VIDEO COLLABORATION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runVideoCollaborationTests();
