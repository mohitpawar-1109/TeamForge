const BASE_URL = 'http://localhost:5000/api';

async function runAiPostMatchesTests() {
  console.log('==================================================');
  console.log('🎯 RUNNING TEAMFORGE AI TEAMMATE DISCOVERY TESTS');
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
  const creatorUser = {
    name: `Creator ${randomSuffix}`,
    email: `creator_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Delhi',
    course: 'Computer Science',
    headline: 'Hackathon Enthusiast'
  };

  const candidate1 = {
    name: `Rahul Sharma ${randomSuffix}`,
    email: `rahul_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'Computer Science',
    headline: 'Full Stack & AI Engineer',
    skills: [
      { name: 'React', level: 'Expert' },
      { name: 'Node.js', level: 'Advanced' },
      { name: 'Python', level: 'Advanced' },
      { name: 'MongoDB', level: 'Advanced' }
    ],
    interests: ['AI/ML', 'Hackathons', 'Web Development'],
    experienceLevel: 'Experienced',
    pastProjectsCount: 4
  };

  const candidate2 = {
    name: `Priya Patel ${randomSuffix}`,
    email: `priya_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'NID Ahmedabad',
    course: 'Interaction Design',
    headline: 'UI/UX Designer & Frontend Craftsman',
    skills: [
      { name: 'Figma', level: 'Expert' },
      { name: 'UI/UX', level: 'Expert' },
      { name: 'Tailwind CSS', level: 'Advanced' }
    ],
    interests: ['UI/UX', 'Product Design'],
    experienceLevel: 'Intermediate',
    pastProjectsCount: 2
  };

  let creatorToken = '';
  let creatorId = '';
  let cand1Token = '';
  let cand2Token = '';

  await test('Register Creator', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creatorUser)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Creator registration failed');
    creatorToken = json.data.token;
    creatorId = json.data._id;
  });

  await test('Register Candidate 1 (Rahul - Full Stack / ML)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate1)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Candidate 1 registration failed');
    cand1Token = json.data.token;
  });

  await test('Register Candidate 2 (Priya - UI/UX)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate2)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Candidate 2 registration failed');
    cand2Token = json.data.token;
  });

  let postId = '';
  await test('Create LOOKING_FOR_TEAMMATES Post', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'LOOKING_FOR_TEAMMATES',
        title: 'AI Resume Analyzer',
        content: 'Building an automated ATS optimizer and resume feedback tool with React and Python.',
        requiredRoles: ['ML Developer', 'UI/UX Designer', 'Backend Developer'],
        requiredSkills: ['Python', 'React', 'Gemini', 'Node.js'],
        teamSize: 4
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Post creation failed');
    postId = json.data._id;
  });

  // Test Unauthenticated GET /api/posts/:id/matches
  await test('GET /api/posts/:id/matches (Reject Unauthenticated)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/matches`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // Test Non-existent Post
  await test('GET /api/posts/:id/matches (404 on Invalid Post ID)', async () => {
    const res = await fetch(`${BASE_URL}/posts/661234567890abcdef123456/matches`, {
      headers: { 'Authorization': `Bearer ${creatorToken}` }
    });
    if (res.status !== 404) throw new Error(`Expected 404 Not Found, got ${res.status}`);
  });

  // Test Authenticated GET /api/posts/:id/matches
  await test('GET /api/posts/:id/matches (Return Ranked AI Matches)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/matches`, {
      headers: { 'Authorization': `Bearer ${creatorToken}` }
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data)) throw new Error(json.message || 'Fetch matches failed');

    // Verify creator is excluded
    const hasCreator = json.data.some(m => m.user?._id === creatorId);
    if (hasCreator) throw new Error('Post creator was not excluded from matches');

    // Find Rahul and Priya in matches
    const rahulMatch = json.data.find(m => m.user?.email === candidate1.email);
    const priyaMatch = json.data.find(m => m.user?.email === candidate2.email);

    if (!rahulMatch) throw new Error('Candidate 1 (Rahul) was not found in matches');
    if (!priyaMatch) throw new Error('Candidate 2 (Priya) was not found in matches');

    // Verify required match fields
    if (typeof rahulMatch.compatibilityScore !== 'number' || rahulMatch.compatibilityScore < 70) {
      throw new Error(`Expected high compatibilityScore for Rahul, got ${rahulMatch.compatibilityScore}`);
    }

    if (!Array.isArray(rahulMatch.matchingSkills) || rahulMatch.matchingSkills.length === 0) {
      throw new Error('matchingSkills was empty for Rahul');
    }

    if (!rahulMatch.suggestedRole) {
      throw new Error('suggestedRole was missing for Rahul');
    }

    if (!rahulMatch.reason || !rahulMatch.explanation) {
      throw new Error('reason / explanation was missing for Rahul');
    }

    // Verify suggested roles
    if (!rahulMatch.suggestedRole.includes('Developer')) {
      throw new Error(`Expected developer role for Rahul, got ${rahulMatch.suggestedRole}`);
    }

    if (!priyaMatch.suggestedRole.includes('Designer') && !priyaMatch.suggestedRole.includes('UI')) {
      throw new Error(`Expected designer role for Priya, got ${priyaMatch.suggestedRole}`);
    }

    // Verify matches array is sorted descending by compatibilityScore
    for (let i = 0; i < json.data.length - 1; i++) {
      if (json.data[i].compatibilityScore < json.data[i + 1].compatibilityScore) {
        throw new Error('Matches are not sorted descending by compatibilityScore');
      }
    }
  });

  // Cleanup
  await test('Cleanup Test Post', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${creatorToken}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Cleanup failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL AI MATCHES TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAiPostMatchesTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
