const BASE_URL = 'http://localhost:5000/api';

async function runHackathonDiscoveryTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING HACKATHON DISCOVERY SYSTEM TESTS');
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

  let token = '';
  let user = null;
  let sampleHackathonId = null;

  // 1. Register User with predefined skills
  await test('Register User (Dev Lead with React, Node.js, Python)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Aarav HackathonDev ${rand}`,
        email: `hack_${rand}@teamforge.test`,
        password: 'Password123!',
        headline: 'Full Stack & ML Enthusiast',
        skills: ['React', 'Node.js', 'Python']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    token = data.data.token;
    user = data.data;
  });

  // 2. GET /api/hackathons (Verify Auto-seeding and List)
  await test('GET /api/hackathons (Verify Auto-seeded Data)', async () => {
    const res = await fetch(`${BASE_URL}/hackathons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!Array.isArray(data.data) || data.data.length < 5) {
      throw new Error(`Expected at least 5 hackathons, got ${data.data?.length}`);
    }
    sampleHackathonId = data.data[0]._id;
    console.log(`\n   🏆 Loaded ${data.data.length} Hackathons (First: "${data.data[0].title}")`);
  });

  // 3. Verify Skill Match Calculation
  await test('Verify Personalized Skill Match Score & Missing Skills', async () => {
    const res = await fetch(`${BASE_URL}/hackathons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const globalAIHack = data.data.find((h) => h.title.includes('Global AI Hackathon'));
    if (!globalAIHack) throw new Error('Global AI Hackathon not found');

    const match = globalAIHack.skillMatch;
    if (!match) throw new Error('No skillMatch object on hackathon');

    console.log(`\n   ✨ Match Score: ${match.matchPercentage}%`);
    console.log(`   ✓ Covered: [${match.matchedSkills.join(', ')}]`);
    console.log(`   + Missing: [${match.missingSkills.join(', ')}]`);

    // User has React, Node.js, Python. Required: React, Python, Machine Learning, FastAPI, Node.js
    // 3 matched out of 5 = 60%
    if (match.matchPercentage < 50 || match.matchPercentage > 75) {
      throw new Error(`Expected match percentage ~60%, got ${match.matchPercentage}%`);
    }
    if (!match.matchedSkills.includes('React') || !match.matchedSkills.includes('Python')) {
      throw new Error('Expected React and Python in matchedSkills');
    }
    if (!match.missingSkills.includes('Machine Learning') || !match.missingSkills.includes('FastAPI')) {
      throw new Error('Expected Machine Learning and FastAPI in missingSkills');
    }
  });

  // 4. Test Filter by Mode
  await test('Filter by Mode (mode=Online)', async () => {
    const res = await fetch(`${BASE_URL}/hackathons?mode=Online`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (data.data.some((h) => h.mode !== 'Online')) {
      throw new Error('Found non-Online hackathon in mode=Online query');
    }
  });

  // 5. Test Filter by Technology
  await test('Filter by Technology (technology=Python)', async () => {
    const res = await fetch(`${BASE_URL}/hackathons?technology=Python`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (data.data.length === 0) throw new Error('Expected Python hackathons');
  });

  // 6. Test Keyword Search
  await test('Search Hackathons by Keyword (search="FinTech")', async () => {
    const res = await fetch(`${BASE_URL}/hackathons?search=FinTech`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (data.data.length === 0 || !data.data[0].title.includes('FinTech')) {
      throw new Error('Expected FinTech hackathon in search results');
    }
  });

  // 7. GET /api/hackathons/:id (Single Details with Teammate Recommendations)
  await test('GET /api/hackathons/:id (Details & Peer Gap Fillers)', async () => {
    const res = await fetch(`${BASE_URL}/hackathons/${sampleHackathonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const h = data.data;

    if (!h.title || !h.prizePool || !h.deadline || !h.skillMatch) {
      throw new Error('Hackathon details missing essential fields');
    }
    console.log(`\n   📄 Hackathon: "${h.title}" • Prize: ${h.prizePool} • Days Left: ${h.daysLeft}`);
  });

  // 8. Toggle Save / Bookmark Hackathon
  await test('POST /api/hackathons/:id/save (Bookmark Toggle)', async () => {
    // 1st call: Bookmark
    let res = await fetch(`${BASE_URL}/hackathons/${sampleHackathonId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    let data = await res.json();
    if (!data.success || !data.saved) throw new Error('Failed to bookmark hackathon');

    // Verify savedOnly filter
    const savedRes = await fetch(`${BASE_URL}/hackathons?savedOnly=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const savedData = await savedRes.json();
    if (!savedData.data.some((h) => h._id === sampleHackathonId)) {
      throw new Error('Saved hackathon not returned in savedOnly query');
    }

    // 2nd call: Unbookmark
    res = await fetch(`${BASE_URL}/hackathons/${sampleHackathonId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    data = await res.json();
    if (!data.success || data.saved !== false) throw new Error('Failed to un-bookmark hackathon');
  });

  // 9. Toggle Interest in Hackathon
  await test('POST /api/hackathons/:id/interested (Interest Toggle)', async () => {
    // Express interest
    let res = await fetch(`${BASE_URL}/hackathons/${sampleHackathonId}/interested`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    let data = await res.json();
    if (!data.success || !data.interested) throw new Error('Failed to mark interested');

    // Verify interestedOnly query
    const intRes = await fetch(`${BASE_URL}/hackathons?interestedOnly=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const intData = await intRes.json();
    if (!intData.data.some((h) => h._id === sampleHackathonId)) {
      throw new Error('Hackathon not found in interestedOnly list');
    }
  });

  // 10. Create / Ingest Custom Hackathon
  await test('POST /api/hackathons (Extensibility & Custom Ingest)', async () => {
    const res = await fetch(`${BASE_URL}/hackathons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `NextGen Quantum & AI Challenge ${rand}`,
        tagline: 'Quantum algorithms and hybrid AI optimization',
        description: 'Explore quantum computing SDKs and hybrid machine learning pipelines.',
        mode: 'Online',
        difficulty: 'Advanced',
        teamSize: { min: 2, max: 4 },
        requiredSkills: ['Python', 'Qiskit', 'Linear Algebra', 'Machine Learning'],
        themes: ['Quantum', 'AI / ML'],
        prizePool: '$60,000',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    });
    const data = await res.json();
    if (!data.success || !data.data?._id) throw new Error(data.message || 'Failed to create hackathon');
  });

  console.log('\n==================================================');
  console.log(`🎉 HACKATHON DISCOVERY TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runHackathonDiscoveryTests();
