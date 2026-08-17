const BASE_URL = 'http://localhost:5000/api';

async function runSkillGapAndScoringTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING SKILL GAP ANALYSIS & STUDENT SCORING TESTS');
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

  // Student 1: Lead developer with React (Expert), Node.js (Advanced), Python (Beginner)
  const student1Data = {
    name: `Dev Lead ${rand}`,
    email: `lead_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'CSE',
    headline: 'Full Stack Engineer',
    experienceLevel: 'Experienced',
    pastProjectsCount: 2,
    skills: [
      { name: 'React', proficiency: 'Expert', verified: true },
      { name: 'Node.js', proficiency: 'Advanced', verified: true },
      { name: 'Python', proficiency: 'Beginner', verified: false }
    ],
    interests: ['AI / Machine Learning', 'Web Development']
  };

  // Student 2: Peer developer with ML (Expert), UI/UX (Advanced)
  const student2Data = {
    name: `Peer Specialist ${rand}`,
    email: `peer_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'BITS Pilani',
    course: 'Data Science',
    headline: 'ML & Design Specialist',
    experienceLevel: 'Intermediate',
    pastProjectsCount: 3,
    skills: [
      { name: 'ML', proficiency: 'Expert', verified: true },
      { name: 'UI/UX', proficiency: 'Advanced', verified: true },
      { name: 'Python', proficiency: 'Advanced', verified: true }
    ],
    interests: ['AI', 'Design']
  };

  let token1 = '';
  let id1 = '';
  let token2 = '';
  let id2 = '';
  let projectId = '';

  // 1. Auth Setup
  await test('Register Student 1 (Dev Lead)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student1Data)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token1 = json.data.token;
    id1 = json.data._id;
  });

  await test('Register Student 2 (Peer Specialist)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student2Data)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token2 = json.data.token;
    id2 = json.data._id;
  });

  // 2. Create Project requiring React, Node.js, Python, ML, UI/UX
  await test('Create Project with Target Required Skills', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: `AI Autonomous Agent Platform ${rand}`,
        description: 'Collaborative AI system requiring React, Node.js, Python, ML, and UI/UX',
        category: 'AI / Machine Learning',
        difficulty: 'Advanced',
        teamSize: 4,
        requiredSkills: ['React', 'Node.js', 'Python', 'ML', 'UI/UX']
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create project failed');
    projectId = json.data._id;
  });

  // 3. Test Skill Gap Analysis (Covered vs Partial vs Missing)
  let gapData = null;
  await test('GET /api/projects/:id/skill-gap (Verify Covered, Partial, Missing)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/skill-gap`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error(json.message || 'Fetch skill gap failed');
    gapData = json.data;

    console.log('\n   📊 SKILL GAP BREAKDOWN:');
    gapData.details.forEach(item => {
      console.log(`      • ${item.skill.padEnd(12)} -> ${item.status.toUpperCase()}`);
    });

    const reactStatus = gapData.details.find(d => d.skill === 'React')?.status;
    const nodeStatus = gapData.details.find(d => d.skill === 'Node.js')?.status;
    const pythonStatus = gapData.details.find(d => d.skill === 'Python')?.status;
    const mlStatus = gapData.details.find(d => d.skill === 'ML')?.status;
    const uiuxStatus = gapData.details.find(d => d.skill === 'UI/UX')?.status;

    if (reactStatus !== 'Covered') throw new Error(`Expected React to be Covered, got ${reactStatus}`);
    if (nodeStatus !== 'Covered') throw new Error(`Expected Node.js to be Covered, got ${nodeStatus}`);
    if (pythonStatus !== 'Partial') throw new Error(`Expected Python to be Partial, got ${pythonStatus}`);
    if (mlStatus !== 'Missing') throw new Error(`Expected ML to be Missing, got ${mlStatus}`);
    if (uiuxStatus !== 'Missing') throw new Error(`Expected UI/UX to be Missing, got ${uiuxStatus}`);
  });

  await test('Verify Gap Analysis Recommends Gap-Filling Students', async () => {
    if (!gapData.recommendedStudents || gapData.recommendedStudents.length === 0) {
      throw new Error('recommendedStudents is empty');
    }
    const foundPeer = gapData.recommendedStudents.find(r => r.student._id === id2);
    if (!foundPeer) throw new Error('Student 2 was not recommended to fill missing skills');
    if (!foundPeer.filledSkills.includes('ML') || !foundPeer.filledSkills.includes('UI/UX')) {
      throw new Error('Student 2 filledSkills should include ML and UI/UX');
    }
  });

  // 4. Test Student Skill Scoring & Analytics API
  let student1Scores = null;
  await test('GET /api/users/:id/skill-scores (Calculate genuine skill scoring)', async () => {
    const res = await fetch(`${BASE_URL}/users/${id1}/skill-scores`);
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error(json.message || 'Fetch skill scores failed');
    student1Scores = json.data;

    console.log(`\n   ⭐ Overall Score: ${student1Scores.overallScore}/100 (${student1Scores.overallTier})`);
    console.log(`   📁 Total Projects: ${student1Scores.projects.total}`);
    console.log(`   ⚡ Total Contributions: ${student1Scores.contributions.total}`);
    console.log('   🎯 Skill Scores Breakdown:');
    student1Scores.skillScores.forEach(s => {
      console.log(`      • ${s.name.padEnd(10)} : ${s.score}% (${s.masteryLevel}) [${s.category}]`);
    });

    if (typeof student1Scores.overallScore !== 'number' || student1Scores.overallScore < 50) {
      throw new Error('Invalid overall score');
    }
    if (student1Scores.projects.total < 1) {
      throw new Error('Created project was not counted in projects.total');
    }
  });

  // 5. Test Peer Endorsement
  await test('POST /api/users/:id/skills/:skillName/endorse (Student 2 endorses Student 1)', async () => {
    const res = await fetch(`${BASE_URL}/users/${id1}/skills/React/endorse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Endorse skill failed');

    const reactSkill = json.data?.skillScores?.find(s => s.name === 'React');
    if (!reactSkill || reactSkill.endorsementsCount < 1) {
      throw new Error('Endorsement was not added to React skill');
    }
  });

  await test('Prevent Self-Endorsement', async () => {
    const res = await fetch(`${BASE_URL}/users/${id1}/skills/React/endorse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      }
    });
    if (res.status !== 400) throw new Error('Should prevent self-endorsement');
  });

  await test('Prevent Duplicate Endorsement', async () => {
    const res = await fetch(`${BASE_URL}/users/${id1}/skills/React/endorse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      }
    });
    if (res.status !== 400) throw new Error('Should prevent duplicate endorsement');
  });

  console.log('\n==================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSkillGapAndScoringTests();
