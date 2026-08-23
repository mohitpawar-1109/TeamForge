import { io } from './frontend/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runMultiParticipantWebRTCTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING MULTI-PARTICIPANT WEBRTC AUDIO & SIGNALING TESTS');
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
  let socketC = null;

  // 1. Register 3 Users (A = Lead, B = Member 1, C = Member 2)
  await test('Register Users A, B, C', async () => {
    const resA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Alice ${rand}`,
        email: `alice_${rand}@multitest.com`,
        password: 'Password123!',
        skills: ['React']
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
        name: `Bob ${rand}`,
        email: `bob_${rand}@multitest.com`,
        password: 'Password123!',
        skills: ['WebRTC']
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
        name: `Charlie ${rand}`,
        email: `charlie_${rand}@multitest.com`,
        password: 'Password123!',
        skills: ['Audio']
      })
    });
    const dataC = await resC.json();
    if (!dataC.success) throw new Error(dataC.message);
    tokenC = dataC.data.token;
    userC = dataC.data;
  });

  // 2. Create Project and Add B & C
  await test('Create Project and Join B and C', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: `Mesh Audio Multi Test ${rand}`,
        description: 'Multi-participant audio mesh test',
        category: 'Web Development',
        difficulty: 'Hard',
        teamSize: 4,
        requiredSkills: ['React', 'WebRTC']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    project = data.data;

    // Invite & accept B
    const invResB = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ projectId: project._id, receiverId: userB._id, role: 'Audio Dev' })
    });
    const invDataB = await invResB.json();
    await fetch(`${BASE_URL}/invitations/${invDataB.data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: 'accepted' })
    });

    // Invite & accept C
    const invResC = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ projectId: project._id, receiverId: userC._id, role: 'Frontend Dev' })
    });
    const invDataC = await invResC.json();
    await fetch(`${BASE_URL}/invitations/${invDataC.data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ status: 'accepted' })
    });
  });

  // 3. Connect 3 Sockets
  await test('Connect Socket.IO instances for A, B, and C', async () => {
    socketA = io(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
    socketB = io(SOCKET_URL, { auth: { token: tokenB }, transports: ['websocket'] });
    socketC = io(SOCKET_URL, { auth: { token: tokenC }, transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => socketA.on('connect', resolve)),
      new Promise((resolve) => socketB.on('connect', resolve)),
      new Promise((resolve) => socketC.on('connect', resolve))
    ]);
  });

  // 4. Test 3-Way Mesh Room Joining and Signaling
  await test('3-Way Mesh Joining: A joins, B joins (A<->B), C joins (A<->C and B<->C)', async () => {
    const roomId = `project-${project._id}`;

    // Track offers and answers received
    const offersReceived = { A: [], B: [], C: [] };
    const answersReceived = { A: [], B: [], C: [] };
    const iceReceived = { A: [], B: [], C: [] };

    socketA.on('webrtc_offer', ({ senderSocketId, sdp }) => {
      offersReceived.A.push({ senderSocketId, sdp });
      // Send answer back to sender
      socketA.emit('webrtc_answer', { targetSocketId: senderSocketId, sdp: { type: 'answer', sdp: 'sdp-answer-A' } });
    });
    socketA.on('webrtc_answer', ({ senderSocketId, sdp }) => {
      answersReceived.A.push({ senderSocketId, sdp });
    });
    socketA.on('webrtc_ice_candidate', ({ senderSocketId, candidate }) => {
      iceReceived.A.push({ senderSocketId, candidate });
    });

    socketB.on('webrtc_offer', ({ senderSocketId, sdp }) => {
      offersReceived.B.push({ senderSocketId, sdp });
      socketB.emit('webrtc_answer', { targetSocketId: senderSocketId, sdp: { type: 'answer', sdp: 'sdp-answer-B' } });
    });
    socketB.on('webrtc_answer', ({ senderSocketId, sdp }) => {
      answersReceived.B.push({ senderSocketId, sdp });
    });
    socketB.on('webrtc_ice_candidate', ({ senderSocketId, candidate }) => {
      iceReceived.B.push({ senderSocketId, candidate });
    });

    socketC.on('webrtc_offer', ({ senderSocketId, sdp }) => {
      offersReceived.C.push({ senderSocketId, sdp });
      socketC.emit('webrtc_answer', { targetSocketId: senderSocketId, sdp: { type: 'answer', sdp: 'sdp-answer-C' } });
    });
    socketC.on('webrtc_answer', ({ senderSocketId, sdp }) => {
      answersReceived.C.push({ senderSocketId, sdp });
    });
    socketC.on('webrtc_ice_candidate', ({ senderSocketId, candidate }) => {
      iceReceived.C.push({ senderSocketId, candidate });
    });

    // A joins
    const joinA = await new Promise((resolve) => socketA.emit('join_meeting', { roomId }, resolve));
    if (!joinA.success) throw new Error('A failed to join');
    if (joinA.existingParticipants.length !== 0) throw new Error('A should have 0 existing participants');

    // B joins -> existingParticipants contains [A]
    const joinB = await new Promise((resolve) => socketB.emit('join_meeting', { roomId }, resolve));
    if (!joinB.success) throw new Error('B failed to join');
    if (joinB.existingParticipants.length !== 1 || joinB.existingParticipants[0].socketId !== socketA.id) {
      throw new Error('B should have A in existingParticipants');
    }

    // B sends offer to A
    socketB.emit('webrtc_offer', { targetSocketId: socketA.id, sdp: { type: 'offer', sdp: 'sdp-offer-B-to-A' } });

    await new Promise((r) => setTimeout(r, 100));
    if (offersReceived.A.length !== 1) throw new Error('A did not receive B offer');
    if (answersReceived.B.length !== 1) throw new Error('B did not receive A answer');

    // C joins -> existingParticipants contains [A, B]
    const joinC = await new Promise((resolve) => socketC.emit('join_meeting', { roomId }, resolve));
    if (!joinC.success) throw new Error('C failed to join');
    if (joinC.existingParticipants.length !== 2) {
      throw new Error(`C should have 2 existing participants (A & B), got ${joinC.existingParticipants.length}`);
    }

    // C sends offer to BOTH A and B
    socketC.emit('webrtc_offer', { targetSocketId: socketA.id, sdp: { type: 'offer', sdp: 'sdp-offer-C-to-A' } });
    socketC.emit('webrtc_offer', { targetSocketId: socketB.id, sdp: { type: 'offer', sdp: 'sdp-offer-C-to-B' } });

    await new Promise((r) => setTimeout(r, 100));

    // Verify all 3 pairs have established signaling:
    // A received offers from B and C (2 total)
    if (offersReceived.A.length !== 2) throw new Error(`A should have received 2 offers (from B & C), got ${offersReceived.A.length}`);
    // B received offer from C (1 total)
    if (offersReceived.B.length !== 1) throw new Error(`B should have received 1 offer (from C), got ${offersReceived.B.length}`);
    // C received answers from both A and B (2 total)
    if (answersReceived.C.length !== 2) throw new Error(`C should have received 2 answers (from A & B), got ${answersReceived.C.length}`);

    // Verify ICE candidate dispatch to multiple peers
    socketA.emit('webrtc_ice_candidate', { targetSocketId: socketB.id, candidate: { candidate: 'cand-A->B' } });
    socketA.emit('webrtc_ice_candidate', { targetSocketId: socketC.id, candidate: { candidate: 'cand-A->C' } });

    await new Promise((r) => setTimeout(r, 100));
    if (iceReceived.B.length !== 1) throw new Error('B did not receive A candidate');
    if (iceReceived.C.length !== 1) throw new Error('C did not receive A candidate');
  });

  // 5. Test Media Toggle (Microphone Mute) across 3 participants
  await test('Microphone Mute broadcast to all peers', async () => {
    const roomId = `project-${project._id}`;
    let muteReceivedByA = null;
    let muteReceivedByC = null;

    socketA.on('meeting_media_toggled', (payload) => {
      if (payload.socketId === socketB.id) muteReceivedByA = payload;
    });
    socketC.on('meeting_media_toggled', (payload) => {
      if (payload.socketId === socketB.id) muteReceivedByC = payload;
    });

    // B mutes microphone
    socketB.emit('meeting_media_toggle', { roomId, type: 'audio', enabled: false });

    await new Promise((r) => setTimeout(r, 100));
    if (!muteReceivedByA || muteReceivedByA.type !== 'audio' || muteReceivedByA.enabled !== false) {
      throw new Error('A did not receive B audio mute');
    }
    if (!muteReceivedByC || muteReceivedByC.type !== 'audio' || muteReceivedByC.enabled !== false) {
      throw new Error('C did not receive B audio mute');
    }
  });

  // 6. Test Participant B leaves, A and C remain connected
  await test('Participant B leaves while A and C remain connected', async () => {
    const roomId = `project-${project._id}`;
    let bLeftSeenByA = false;
    let bLeftSeenByC = false;

    socketA.on('meeting_user_left', ({ socketId }) => {
      if (socketId === socketB.id) bLeftSeenByA = true;
    });
    socketC.on('meeting_user_left', ({ socketId }) => {
      if (socketId === socketB.id) bLeftSeenByC = true;
    });

    socketB.emit('leave_meeting', { roomId });

    await new Promise((r) => setTimeout(r, 100));
    if (!bLeftSeenByA) throw new Error('A did not receive B leaving');
    if (!bLeftSeenByC) throw new Error('C did not receive B leaving');

    // Verify A and C can still signal each other
    let msgFromAtoC = null;
    socketC.on('webrtc_ice_candidate', ({ candidate }) => {
      if (candidate.candidate === 'cand-A->C-after-B-left') msgFromAtoC = candidate;
    });

    socketA.emit('webrtc_ice_candidate', { targetSocketId: socketC.id, candidate: { candidate: 'cand-A->C-after-B-left' } });
    await new Promise((r) => setTimeout(r, 100));
    if (!msgFromAtoC) throw new Error('A and C could not communicate after B left');
  });

  // Cleanup
  if (socketA) socketA.disconnect();
  if (socketB) socketB.disconnect();
  if (socketC) socketC.disconnect();

  console.log('\n==================================================');
  console.log(`🎉 MULTI-PARTICIPANT WEBRTC TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runMultiParticipantWebRTCTests();
