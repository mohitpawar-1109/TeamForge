const BASE_URL = 'http://localhost:5000/api';

async function runNotificationTests() {
  console.log('==================================================');
  console.log('🔔 RUNNING TEAMFORGE NOTIFICATION SYSTEM TESTS');
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

  const randomSuffix = Math.floor(Math.random() * 100000);
  const userA = {
    name: `Author Rahul ${randomSuffix}`,
    email: `rahul_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'Computer Science',
    headline: 'Full Stack Engineer'
  };

  const userB = {
    name: `Collaborator Priya ${randomSuffix}`,
    email: `priya_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIIT Hyderabad',
    course: 'AI & Data Science',
    headline: 'ML Specialist'
  };

  let tokenA = '';
  let idA = '';
  let tokenB = '';
  let idB = '';

  await test('Register User A (Author)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    tokenA = json.data.token;
    idA = json.data._id;
  });

  await test('Register User B (Collaborator)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userB)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    tokenB = json.data.token;
    idB = json.data._id;
  });

  // Create Standard Post by User A
  let post1Id = '';
  await test('User A Creates Discussion Post', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'DISCUSSION',
        content: 'Excited to build smart agents with Gemini 1.5 Pro!'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Post creation failed');
    post1Id = json.data._id;
  });

  // User B Likes User A's Post
  await test('User B Likes Post (Triggers LIKE Notification)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${post1Id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok || !json.liked) throw new Error(json.message || 'Like failed');
  });

  // User B Comments on User A's Post
  await test('User B Comments on Post (Triggers COMMENT Notification)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${post1Id}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Amazing post! What libraries are you using for agent orchestration?'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Comment failed');
  });

  // User A Creates LOOKING_FOR_TEAMMATES Post
  let post2Id = '';
  await test('User A Creates LOOKING_FOR_TEAMMATES Post', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'LOOKING_FOR_TEAMMATES',
        title: 'AI Resume Analyzer',
        content: 'Looking for a UI designer and ML developer.',
        requiredRoles: ['ML Developer', 'UI/UX Designer'],
        requiredSkills: ['Python', 'React', 'Gemini'],
        teamSize: 4
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Post creation failed');
    post2Id = json.data._id;
  });

  // User B Sends Join Request
  let teamReqId = '';
  await test('User B Sends Join Request (Triggers TEAM_REQUEST Notification)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${post2Id}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'I would love to join as the ML developer!'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Join request failed');
    teamReqId = json.data._id;
  });

  // User A Fetches Notifications
  let notifListA = [];
  await test('GET /api/notifications (User A Receives 3 Notifications)', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data)) throw new Error(json.message || 'Fetch notifications failed');
    notifListA = json.data;

    if (json.unreadCount < 3) {
      throw new Error(`Expected unreadCount >= 3, got ${json.unreadCount}`);
    }

    const likeNotif = json.data.find(n => n.type === 'LIKE');
    const commentNotif = json.data.find(n => n.type === 'COMMENT');
    const teamReqNotif = json.data.find(n => n.type === 'TEAM_REQUEST');

    if (!likeNotif) throw new Error('LIKE notification not found');
    if (!commentNotif) throw new Error('COMMENT notification not found');
    if (!teamReqNotif) throw new Error('TEAM_REQUEST notification not found');
  });

  // User A Accepts Team Request -> Triggers TEAM_REQUEST_ACCEPTED for User B
  await test('User A Accepts Team Request (Triggers TEAM_REQUEST_ACCEPTED for User B)', async () => {
    const res = await fetch(`${BASE_URL}/team-requests/${teamReqId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    const json = await res.json();
    if (!res.ok || json.data?.status !== 'accepted') throw new Error(json.message || 'Accept failed');
  });

  // User B Fetches Notifications
  await test('GET /api/notifications (User B Receives TEAM_REQUEST_ACCEPTED Notification)', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data)) throw new Error('Fetch notifications failed');

    const acceptedNotif = json.data.find(n => n.type === 'TEAM_REQUEST_ACCEPTED');
    if (!acceptedNotif) throw new Error('TEAM_REQUEST_ACCEPTED notification not found for User B');
    if (!acceptedNotif.message.includes('accepted your request')) {
      throw new Error(`Unexpected message: ${acceptedNotif.message}`);
    }
  });

  // Mark single notification as read
  const notifToMark = notifListA[0];
  await test('PATCH /api/notifications/:id/read (Mark Single Read)', async () => {
    const res = await fetch(`${BASE_URL}/notifications/${notifToMark._id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data?.read) throw new Error(json.message || 'Mark single read failed');
  });

  // Mark all notifications as read
  await test('PATCH /api/notifications/read-all (Mark All Read)', async () => {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Mark all read failed');

    // Verify unreadCount is now 0
    const checkRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const checkJson = await checkRes.json();
    if (checkJson.unreadCount !== 0) {
      throw new Error(`Expected unreadCount = 0, got ${checkJson.unreadCount}`);
    }
  });

  // Verify scoped authorization (User B cannot mark User A's notification)
  await test('Security: User B cannot modify User A notification', async () => {
    const res = await fetch(`${BASE_URL}/notifications/${notifToMark._id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    if (res.status !== 404 && res.status !== 403) {
      throw new Error(`Expected 404 or 403, got status ${res.status}`);
    }
  });

  // Clean up
  await test('Cleanup Test Posts', async () => {
    await fetch(`${BASE_URL}/posts/${post1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    await fetch(`${BASE_URL}/posts/${post2Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL NOTIFICATION TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runNotificationTests().catch(err => {
  console.error('Fatal notification test error:', err);
  process.exit(1);
});
