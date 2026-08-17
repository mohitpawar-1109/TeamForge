const BASE_URL = 'http://localhost:5000/api';

async function runGroupTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING REAL-TIME GROUP & TEAM SYSTEM TESTS');
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
  const userAData = {
    name: `Group Admin ${rand}`,
    email: `admin_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Delhi',
    course: 'CSE',
    headline: 'Full Stack Dev'
  };

  const userBData = {
    name: `Member Beta ${rand}`,
    email: `beta_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'BITS Pilani',
    course: 'ECE',
    headline: 'Flutter Dev'
  };

  let tokenA = '';
  let idA = '';
  let tokenB = '';
  let idB = '';

  let publicGroupId = '';
  let privateGroupId = '';
  let dmGroupId = '';
  let projectGroupId = '';
  let testMsgId = '';

  // 1. Auth Setup
  await test('Register User A (Admin)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAData)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    tokenA = json.data.token;
    idA = json.data._id;
  });

  await test('Register User B (Member)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userBData)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    tokenB = json.data.token;
    idB = json.data._id;
  });

  // 2. Public Community Group Creation & Discovery
  await test('Create Public Community Group', async () => {
    const res = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: `AI Innovation Squad ${rand}`,
        description: 'Collaborative group for LLMs and deep learning projects',
        type: 'public',
        category: 'AI & Machine Learning',
        tags: ['AI', 'PyTorch', 'LLM']
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create public group failed');
    publicGroupId = json.data._id;
    if (json.data.members[0].role !== 'admin') throw new Error('Creator should be admin');
  });

  await test('User B Discovers Public Group', async () => {
    const res = await fetch(`${BASE_URL}/groups?scope=discover&type=public&search=${rand}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error(json.message || 'Discover groups failed');
    const found = json.data.find(g => g._id === publicGroupId);
    if (!found) throw new Error('Public group not found in discovery list');
  });

  await test('User B Joins Public Community Group', async () => {
    const res = await fetch(`${BASE_URL}/groups/${publicGroupId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Join group failed');
    const isMember = json.data?.members?.some(m => m.user?._id === idB || m.user === idB);
    if (!isMember) throw new Error('User B not in group members list');
  });

  // 3. Private Group Creation & Member Invitation
  await test('Create Private Group (User A)', async () => {
    const res = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: `Stealth Hackathon Core ${rand}`,
        description: 'Private core team',
        type: 'private',
        category: 'Hackathons'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create private group failed');
    privateGroupId = json.data._id;
  });

  await test('User B Cannot Join Private Group Directly', async () => {
    const res = await fetch(`${BASE_URL}/groups/${privateGroupId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    if (res.status !== 403) throw new Error('Should block direct joining of private group');
  });

  await test('User A Invites User B to Private Group', async () => {
    const res = await fetch(`${BASE_URL}/groups/${privateGroupId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        userIds: [idB],
        role: 'member'
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Invite failed');
    const isMember = json.data?.members?.some(m => (m.user?._id || m.user)?.toString() === idB);
    if (!isMember) throw new Error('User B was not added to private group');
  });

  // 4. Role Management: Promote to Admin
  await test('User A Promotes User B to Admin', async () => {
    const res = await fetch(`${BASE_URL}/groups/${privateGroupId}/members/${idB}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Role update failed');
    const bMembership = json.data?.members?.find(m => (m.user?._id || m.user)?.toString() === idB);
    if (bMembership?.role !== 'admin') throw new Error('Role was not updated to admin');
  });

  // 5. Direct Message (1-on-1) Conversation
  await test('Get or Create DM Conversation (User A -> User B)', async () => {
    const res = await fetch(`${BASE_URL}/groups/dm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ recipientId: idB })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create DM failed');
    dmGroupId = json.data._id;
    if (json.data.type !== 'dm') throw new Error('Group type should be dm');
  });

  // 6. Project Team Auto Group Creation & Sync
  await test('Auto-create Project Team Group on Project Creation', async () => {
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: `Decentralized AI Marketplace ${rand}`,
        description: 'Building web3 AI hub',
        category: 'AI / Machine Learning',
        requiredSkills: ['React', 'Solidity', 'Python']
      })
    });
    const projJson = await projRes.json();
    if (!projRes.ok || !projJson.data?._id) throw new Error('Project creation failed');
    const projectId = projJson.data._id;

    // Verify Project Team group was auto-created
    const groupRes = await fetch(`${BASE_URL}/groups/project/${projectId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const groupJson = await groupRes.json();
    if (!groupRes.ok || !groupJson.data?._id) throw new Error('Project team group was not found/created');
    projectGroupId = groupJson.data._id;
    if (groupJson.data.type !== 'project') throw new Error('Group type should be project');
  });

  // 7. Real-Time Chat Messaging, Replies, Read Receipts, Deletion & Pagination
  await test('Send Message in Public Group with Reply', async () => {
    const roomId = `group:${publicGroupId}`;

    // 1st message
    const msg1Res = await fetch(`${BASE_URL}/messages/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        content: 'Hello everyone! Welcome to the AI Innovation Squad.'
      })
    });
    const msg1Json = await msg1Res.json();
    if (!msg1Res.ok || !msg1Json.data?._id) throw new Error('Send message 1 failed');
    testMsgId = msg1Json.data._id;

    // 2nd message (reply from User B)
    const msg2Res = await fetch(`${BASE_URL}/messages/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        content: 'Excited to be here! Let us build something cool.',
        replyTo: testMsgId
      })
    });
    const msg2Json = await msg2Res.json();
    if (!msg2Res.ok || !msg2Json.data?._id) throw new Error('Send reply failed');
    if (!msg2Json.data.replyTo?._id) throw new Error('Reply parent was not populated');
  });

  await test('Get Room Messages & Pagination', async () => {
    const roomId = `group:${publicGroupId}`;
    const res = await fetch(`${BASE_URL}/messages/${roomId}?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data || json.data.length < 2) throw new Error('Fetch messages failed');
    if (json.data[1].replyTo?.content !== 'Hello everyone! Welcome to the AI Innovation Squad.') {
      throw new Error('Reply content not populated correctly in history');
    }
  });

  await test('Mark Room Messages as Read', async () => {
    const roomId = `group:${publicGroupId}`;
    const res = await fetch(`${BASE_URL}/messages/${roomId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Mark read failed');
  });

  await test('Delete Own Message (Soft Delete)', async () => {
    const res = await fetch(`${BASE_URL}/messages/${testMsgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Delete message failed');
    if (!json.data?.isDeleted) throw new Error('Message isDeleted was not true');
  });

  // 8. Leave Group & Remove Member
  await test('User B Leaves Public Community Group', async () => {
    const res = await fetch(`${BASE_URL}/groups/${publicGroupId}/leave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Leave group failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGroupTests();
