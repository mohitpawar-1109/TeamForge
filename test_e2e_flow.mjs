const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING TEAMFORGE COMPREHENSIVE E2E FLOW TESTS');
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

  // 1. Health check
  await test('GET /api/health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!res.ok || data.status !== 'online') throw new Error(`Health failed: ${JSON.stringify(data)}`);
  });

  // 2. Register Owner User
  const randomSuffix = Math.floor(Math.random() * 100000);
  const ownerUser = {
    name: `Owner Student ${randomSuffix}`,
    email: `owner_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'Stanford University',
    course: 'B.Tech Computer Science',
    year: '3rd Year',
    headline: 'Full Stack & AI Lead',
    skills: [{ name: 'React', level: 'Advanced' }, { name: 'Node.js', level: 'Advanced' }],
    interests: ['AI / Machine Learning', 'Web Development'],
    availability: ['Weekdays', 'Weekends']
  };

  let ownerToken = '';
  let ownerId = '';

  await test('POST /api/auth/register (Owner)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerUser)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    ownerToken = json.data.token;
    ownerId = json.data._id;
  });

  // 2b. Register Candidate User
  const candidateUser = {
    name: `Candidate Student ${randomSuffix}`,
    email: `candidate_${randomSuffix}@teamforge.test`,
    password: 'CandidatePassword@123',
    college: 'MIT',
    course: 'B.Tech AI & Data',
    year: '4th Year',
    headline: 'Machine Learning & NLP Specialist',
    skills: [{ name: 'Python', level: 'Advanced' }, { name: 'Machine Learning', level: 'Advanced' }, { name: 'NLP', level: 'Intermediate' }],
    interests: ['AI / Machine Learning'],
    availability: ['Weekdays', 'Weekends']
  };

  let candidateToken = '';
  let candidateId = '';

  await test('POST /api/auth/register (Candidate)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateUser)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Candidate Registration failed');
    candidateToken = json.data.token;
    candidateId = json.data._id;
  });

  // 3. Login Owner
  await test('POST /api/auth/login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerUser.email, password: ownerUser.password })
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Login failed');
    ownerToken = json.data.token;
  });

  // 4. GET /api/auth/me
  await test('GET /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || json.data?.email !== ownerUser.email) throw new Error(json.message || 'Auth me failed');
  });

  // 5. AI Project Analysis
  let aiData = null;
  await test('POST /api/ai/analyze-project', async () => {
    const res = await fetch(`${BASE_URL}/ai/analyze-project`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        description: 'An AI-powered smart resume screening platform that matches candidate profiles to job specifications using NLP and React dashboard.',
        category: 'AI / Machine Learning'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?.requiredSkills) throw new Error(json.message || 'AI analyze failed');
    aiData = json.data;
  });

  // 6. POST /api/projects (Create Project)
  let createdProjectId = '';
  await test('POST /api/projects (Create Project)', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        title: `AI Resume Evaluator ${randomSuffix}`,
        description: 'An AI-powered smart resume screening platform that matches candidate profiles to job specifications.',
        category: 'AI / Machine Learning',
        difficulty: 'Medium',
        duration: '4 Weeks',
        teamSize: 4,
        requiredSkills: ['Python', 'Machine Learning', 'React', 'Node.js'],
        suggestedRoles: ['ML Engineer', 'Frontend Dev', 'Backend Dev'],
        availabilityNeeded: ['Weekdays', 'Weekends'],
        aiAnalysis: { analyzed: true, data: aiData }
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Project creation failed');
    createdProjectId = json.data._id;
  });

  // 7. GET /api/projects
  await test('GET /api/projects', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data) || json.data.length === 0) throw new Error(json.message || 'Projects list failed');
  });

  // 8. GET /api/projects/:id/matches (Find Teammates & Match Score)
  await test(`GET /api/projects/${createdProjectId}/matches`, async () => {
    const res = await fetch(`${BASE_URL}/projects/${createdProjectId}/matches`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data) || json.data.length === 0) throw new Error(json.message || 'Match lookup failed');
    const matched = json.data.find(m => m.student._id === candidateId);
    if (!matched || matched.score === undefined) throw new Error('Candidate not matched properly');
  });

  // 9. POST /api/invitations (Invite User)
  let createdInviteId = '';
  await test('POST /api/invitations (Invite Candidate)', async () => {
    const res = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        receiverId: candidateId,
        projectId: createdProjectId,
        role: 'ML Engineer',
        message: 'We loved your profile! Join our AI Resume Evaluator project.'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Invitation creation failed');
    createdInviteId = json.data._id;
  });

  // 10. GET /api/invitations (Verify Candidate Received Invitation)
  await test('GET /api/invitations (Verify Received)', async () => {
    const res = await fetch(`${BASE_URL}/invitations`, {
      headers: { 'Authorization': `Bearer ${candidateToken}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data?.received) || json.data.received.length === 0) {
      throw new Error('Received invitations not found');
    }
  });

  // 11. PATCH /api/invitations/:id (Accept Invitation)
  await test(`PATCH /api/invitations/${createdInviteId} (Accept)`, async () => {
    const res = await fetch(`${BASE_URL}/invitations/${createdInviteId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${candidateToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    const json = await res.json();
    if (!res.ok || json.data?.status !== 'accepted') throw new Error(json.message || 'Accept invitation failed');
  });

  // 12. GET /api/projects/:id (Verify Team Member Added)
  await test(`GET /api/projects/${createdProjectId} (Verify Team Member)`, async () => {
    const res = await fetch(`${BASE_URL}/projects/${createdProjectId}`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error('Project details failed');
    const memberAdded = json.data.members.some(m => m.user._id === candidateId || m.user === candidateId);
    if (!memberAdded) throw new Error('Candidate was not added to project members');
  });

  // 13. POST /api/projects/:projectId/tasks (Create Task)
  let taskId = '';
  await test(`POST /api/projects/${createdProjectId}/tasks`, async () => {
    const res = await fetch(`${BASE_URL}/projects/${createdProjectId}/tasks`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        title: 'Design Transformer Architecture for Resume Parsing',
        description: 'Implement BERT embeddings and NER for entity extraction.',
        assignedTo: candidateId,
        priority: 'High',
        status: 'TODO'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Task creation failed');
    taskId = json.data._id;
  });

  // 14. PUT /api/tasks/:id (Update Task Status to IN PROGRESS then DONE)
  await test(`PUT /api/tasks/${taskId} (Update to IN PROGRESS)`, async () => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: 'IN PROGRESS' })
    });
    const json = await res.json();
    if (!res.ok || json.data?.status !== 'IN PROGRESS') throw new Error(json.message || 'Task update failed');
  });

  await test(`PUT /api/tasks/${taskId} (Update to DONE)`, async () => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: 'DONE' })
    });
    const json = await res.json();
    if (!res.ok || json.data?.status !== 'DONE') throw new Error(json.message || 'Task complete update failed');
  });

  // 15. GET /api/projects/:projectId/tasks (Verify stats and 100% progress)
  await test(`GET /api/projects/${createdProjectId}/tasks (Verify Progress)`, async () => {
    const res = await fetch(`${BASE_URL}/projects/${createdProjectId}/tasks`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || json.stats?.progressPercent !== 100) throw new Error(`Progress mismatch: expected 100%, got ${json.stats?.progressPercent}%`);
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
