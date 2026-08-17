import { io } from './frontend/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runNotificationTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING COMPLETE REAL-TIME NOTIFICATION TESTS');
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

  let tokenA = '';
  let userA = null;
  let tokenB = '';
  let userB = null;
  let socketA = null;
  let socketB = null;
  let project = null;
  let group = null;
  let task = null;
  let post = null;

  const notifsReceivedByB = [];
  const notifsReceivedByA = [];

  // 1. Register User A (Alice - Project Lead)
  await test('Register User A (Project Lead)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Alice Lead ${rand}`,
        email: `alice_${rand}@notifmail.com`,
        password: 'Password123!',
        headline: 'Lead Architect',
        skills: ['React', 'Node.js']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    tokenA = data.data.token;
    userA = data.data;
  });

  // 2. Register User B (Bob - Dev Teammate)
  await test('Register User B (Developer)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Bob Dev ${rand}`,
        email: `bob_${rand}@notifmail.com`,
        password: 'Password123!',
        headline: 'Frontend Engineer',
        skills: ['React', 'TypeScript']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    tokenB = data.data.token;
    userB = data.data;
  });

  // 3. Connect User A & User B via Socket.IO
  await test('Connect User A & B to Real-Time Socket Gateway', async () => {
    socketA = io(SOCKET_URL, {
      auth: { token: tokenA },
      transports: ['websocket', 'polling']
    });

    socketB = io(SOCKET_URL, {
      auth: { token: tokenB },
      transports: ['websocket', 'polling']
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) {
          clearTimeout(timeout);
          resolve();
        }
      };
      socketA.on('connect', check);
      socketB.on('connect', check);
    });

    socketB.emit('subscribe_notifications');

    socketB.on('new_notification', (notif) => {
      notifsReceivedByB.push(notif);
    });

    socketA.on('new_notification', (notif) => {
      notifsReceivedByA.push(notif);
    });
  });

  // 4. Create Project
  await test('Create Project by User A', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: `AI Analytics Suite ${rand}`,
        description: 'Real-time collaborative analytics dashboard',
        category: 'Web Development',
        teamSize: 4,
        requiredSkills: ['React', 'Node.js', 'Python']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    project = data.data;
  });

  // 5. Send Project Invitation (User A -> User B)
  await test('Send Project Invitation -> Socket Notification to User B', async () => {
    const res = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        receiverId: userB._id,
        projectId: project._id,
        role: 'Frontend Lead',
        message: 'Join our squad!'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    await new Promise((r) => setTimeout(r, 600));
    const notif = notifsReceivedByB.find((n) => n.type === 'project_invite' || n.type === 'invite');
    if (!notif) throw new Error('Real-time project invitation not received on socket');
  });

  // 6. Create Group & Invite Member
  await test('Invite to Group -> Socket Notification to User B', async () => {
    const gRes = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: `Sprint Team ${rand}`,
        type: 'private',
        description: 'Core dev squad'
      })
    });
    const gData = await gRes.json();
    group = gData.data;

    const invRes = await fetch(`${BASE_URL}/groups/${group._id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        userIds: [userB._id],
        role: 'member'
      })
    });
    const invData = await invRes.json();
    if (!invData.success) throw new Error(invData.message);

    await new Promise((r) => setTimeout(r, 600));
    const notif = notifsReceivedByB.find((n) => n.type === 'group_invite');
    if (!notif) throw new Error('Group invite notification not received on socket');
  });

  // 7. Join Public Group -> Notify Creator
  await test('User B Joins Public Group -> Notify User A (New Member)', async () => {
    const pubRes = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: `Open Developers ${rand}`,
        type: 'public',
        description: 'Public community channel'
      })
    });
    const pubData = await pubRes.json();
    const pubGroup = pubData.data;

    const joinRes = await fetch(`${BASE_URL}/groups/${pubGroup._id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      }
    });
    const joinData = await joinRes.json();
    if (!joinData.success) throw new Error(joinData.message);

    await new Promise((r) => setTimeout(r, 600));
    const notif = notifsReceivedByA.find((n) => n.type === 'group_member_joined');
    if (!notif) throw new Error('New group member notification not received on socket');
  });

  // 8. Assign Task -> Socket Notification to Assignee
  await test('Task Assignment -> Socket Notification to User B', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Design UI Theme and Component Tokens',
        assignedTo: userB._id,
        priority: 'High',
        status: 'TODO'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    task = data.data;

    await new Promise((r) => setTimeout(r, 600));
    const notif = notifsReceivedByB.find((n) => n.type === 'task_assigned' || n.type === 'task');
    if (!notif) throw new Error('Task assignment notification not received on socket');
  });

  // 9. Task Completion -> Socket Notification to Team
  await test('Task Completion -> Broadcast Notification to Project Lead', async () => {
    const res = await fetch(`${BASE_URL}/tasks/${task._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        status: 'DONE'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    await new Promise((r) => setTimeout(r, 600));
    const notif = notifsReceivedByA.find((n) => n.type === 'task_completed');
    if (!notif) throw new Error('Task completed notification not received');
  });

  // 10. Post Like & Comment Notifications
  await test('Post Like & Comment -> Socket Notifications to Post Author', async () => {
    // User B creates post
    const pRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        title: `Excited for Hackathon ${rand}`,
        content: 'Launching our brand new real-time collaboration tool.',
        type: 'general'
      })
    });
    const pData = await pRes.json();
    post = pData.data;

    // User A likes post
    await fetch(`${BASE_URL}/posts/${post._id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    // User A comments on post
    await fetch(`${BASE_URL}/posts/${post._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ content: 'Congratulations on this milestone!' })
    });

    await new Promise((r) => setTimeout(r, 600));
    const likeNotif = notifsReceivedByB.find((n) => n.type === 'post_like' || n.type === 'LIKE');
    const commentNotif = notifsReceivedByB.find((n) => n.type === 'post_comment' || n.type === 'COMMENT');

    if (!likeNotif) throw new Error('Post like notification not received on socket');
    if (!commentNotif) throw new Error('Post comment notification not received on socket');
  });

  // 11. AI Recommendation & Hackathon Deadline Notifications
  await test('AI Recommendation & Hackathon Deadline Notifications', async () => {
    // AI Recommendation
    await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        recipientId: userB._id,
        type: 'ai_recommendation',
        title: '✨ AI Match Found',
        message: 'You have a 96% match for "AI Analytics Suite".'
      })
    });

    // Hackathon Deadline
    await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        recipientId: userB._id,
        type: 'hackathon_deadline',
        title: '⏰ Hackathon Deadline Approaching',
        message: '24 hours remaining until demo submissions close!'
      })
    });

    await new Promise((r) => setTimeout(r, 600));
    const aiNotif = notifsReceivedByB.find((n) => n.type === 'ai_recommendation');
    const deadlineNotif = notifsReceivedByB.find((n) => n.type === 'hackathon_deadline');

    if (!aiNotif) throw new Error('AI recommendation notification not received');
    if (!deadlineNotif) throw new Error('Hackathon deadline notification not received');
  });

  // 12. Prevent Duplicate Notifications
  await test('Prevent Duplicate Notifications (Deduplication Mechanism)', async () => {
    const res1 = await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        recipientId: userB._id,
        type: 'hackathon_deadline',
        title: '⏰ Hackathon Deadline Approaching',
        message: '24 hours remaining until demo submissions close!'
      })
    });
    const data1 = await res1.json();

    const res2 = await fetch(`${BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        recipientId: userB._id,
        type: 'hackathon_deadline',
        title: '⏰ Hackathon Deadline Approaching',
        message: '24 hours remaining until demo submissions close!'
      })
    });
    const data2 = await res2.json();

    if (data1.data._id !== data2.data._id) {
      throw new Error('Duplicate notification was erroneously created within deduplication window');
    }
  });

  // 13. GET /api/notifications
  let targetNotifId = '';
  await test('GET /api/notifications (Verify Unread Count & Feed Items)', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.data || data.data.length === 0) throw new Error('No notifications returned in feed');
    if (data.unreadCount <= 0) throw new Error('Expected unread count > 0');

    targetNotifId = data.data[0]._id;
    console.log(`\n   📬 Notification Feed for ${userB.name}:`);
    console.log(`      • Total Items: ${data.data.length}`);
    console.log(`      • Unread Count: ${data.unreadCount}`);
  });

  // 14. PATCH /api/notifications/:id/read
  await test('PATCH /api/notifications/:id/read (Mark Single Read)', async () => {
    const res = await fetch(`${BASE_URL}/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const data = await res.json();
    if (!data.success || !data.data.read) {
      throw new Error('Failed to mark notification as read');
    }
  });

  // 15. PATCH /api/notifications/read-all
  await test('PATCH /api/notifications/read-all (Mark All Read)', async () => {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const data = await res.json();
    if (!data.success || data.unreadCount !== 0) {
      throw new Error('Failed to mark all notifications as read');
    }
  });

  // 16. DELETE /api/notifications/:id
  await test('DELETE /api/notifications/:id (Remove Notification)', async () => {
    const res = await fetch(`${BASE_URL}/notifications/${targetNotifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // Cleanup
  if (socketA) socketA.disconnect();
  if (socketB) socketB.disconnect();

  console.log('\n==================================================');
  console.log(`🎉 NOTIFICATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runNotificationTests();
