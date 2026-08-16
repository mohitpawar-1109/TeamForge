const BASE_URL = 'http://localhost:5000/api';

async function runTeamBuildingTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING TEAMFORGE TEAM BUILDING & JOIN REQUEST TESTS');
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

  // 1. Register Owner & Applicant
  const randomSuffix = Math.floor(Math.random() * 100000);
  const ownerData = {
    name: `Team Lead ${randomSuffix}`,
    email: `owner_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Madras',
    course: 'Computer Science',
    headline: 'AI Project Architect'
  };

  const applicantData = {
    name: `Mohit Applicant ${randomSuffix}`,
    email: `applicant_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'BITS Pilani',
    course: 'Data Science',
    headline: 'ML Developer & Python Specialist'
  };

  let ownerToken = '';
  let ownerId = '';
  let applicantToken = '';
  let applicantId = '';

  await test('Register Owner', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerData)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    ownerToken = json.data.token;
    ownerId = json.data._id;
  });

  await test('Register Applicant', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicantData)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    applicantToken = json.data.token;
    applicantId = json.data._id;
  });

  // 2. Create LOOKING_FOR_TEAMMATES Post
  let postId = '';
  await test('Create LOOKING_FOR_TEAMMATES Post', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'LOOKING_FOR_TEAMMATES',
        title: 'AI Resume Analyzer',
        content: 'Building an automated resume score and ATS optimization assistant.',
        requiredRoles: ['ML Developer', 'UI/UX Designer', 'Backend Developer'],
        requiredSkills: ['Python', 'React', 'Gemini'],
        teamSize: 4,
        currentMembers: 1
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create post failed');
    if (json.data.type !== 'LOOKING_FOR_TEAMMATES') throw new Error('Post type mismatch');
    if (json.data.requiredRoles?.length !== 3) throw new Error('Required roles mismatch');
    if (json.data.requiredSkills?.length !== 3) throw new Error('Required skills mismatch');
    if (json.data.teamSize !== 4) throw new Error('Team size mismatch');
    postId = json.data._id;
  });

  // 3. Prevent Owner Joining Own Post
  await test('POST /api/posts/:id/join (Prevent Owner Joining Own Post)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'I want to join my own team' })
    });
    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  });

  // 4. Prevent Unauthenticated Join
  await test('POST /api/posts/:id/join (Reject Unauthenticated Request)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Unauthenticated join' })
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 5. Send Join Request by Applicant
  let requestId = '';
  await test('POST /api/posts/:id/join (Applicant Sends Join Request)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${applicantToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'I have 2 years of Python & Gemini API experience and would love to build the ML backend!'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Join request failed');
    if (json.data.status !== 'pending') throw new Error(`Expected status pending, got ${json.data.status}`);
    if (json.data.requester?.name !== applicantData.name) throw new Error('Requester was not populated properly');
    requestId = json.data._id;
  });

  // 6. Duplicate Join Request Rejection
  await test('POST /api/posts/:id/join (Reject Duplicate Request)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${applicantToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Duplicate request' })
    });
    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  });

  // 7. GET /api/team-requests for Owner
  await test('GET /api/team-requests (Owner Sees Incoming Request)', async () => {
    const res = await fetch(`${BASE_URL}/team-requests`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.incoming)) throw new Error('Fetch team requests failed');
    const found = json.incoming.find(r => r._id === requestId);
    if (!found) throw new Error('Created request not found in owner incoming requests');
    if (found.status !== 'pending') throw new Error('Expected status pending');
  });

  // 8. Non-owner Forbidden on PATCH /api/team-requests/:id
  await test('PATCH /api/team-requests/:id (Forbidden for Non-Owner)', async () => {
    const res = await fetch(`${BASE_URL}/team-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${applicantToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 9. Owner Accepts Join Request
  await test('PATCH /api/team-requests/:id (Owner Accepts Request)', async () => {
    const res = await fetch(`${BASE_URL}/team-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    const json = await res.json();
    if (!res.ok || json.data?.status !== 'accepted') {
      throw new Error(json.message || 'Accept request failed');
    }
  });

  // 10. Verify Post members and currentMembers updated
  await test('GET /api/posts/:id (Verify currentMembers = 2 and Member Populated)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error('Get post failed');
    const post = json.data;
    if (post.currentMembers !== 2) throw new Error(`Expected currentMembers 2, got ${post.currentMembers}`);
    const isMember = post.members?.some(m => (m?._id || m)?.toString() === applicantId.toString());
    if (!isMember) throw new Error('Applicant ID not found in post members array');
  });

  // 11. Cleanup Post
  await test('DELETE /api/posts/:id (Cleanup Test Post)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Cleanup failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL TEAM BUILDING TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTeamBuildingTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
