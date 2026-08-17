const BASE_URL = 'http://localhost:5000/api';

async function runRecommendationTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING ADVANCED AI TEAM RECOMMENDATIONS TESTS');
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

  // 1. Owner & Candidates setup
  const ownerData = {
    name: `Owner ${rand}`,
    email: `owner_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'CSE',
    headline: 'Project Lead',
    skills: [{ name: 'React', proficiency: 'Advanced' }],
    interests: ['AI / Machine Learning', 'Web Development']
  };

  const candidate1Data = {
    name: `Mohit ${rand}`,
    email: `mohit_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Delhi',
    course: 'CSE',
    headline: 'Senior Backend Architect',
    experienceLevel: 'Experienced',
    pastProjectsCount: 4,
    skills: [
      { name: 'Node.js', proficiency: 'Expert' },
      { name: 'MongoDB', proficiency: 'Expert' },
      { name: 'Express', proficiency: 'Advanced' },
      { name: 'REST APIs', proficiency: 'Expert' }
    ],
    interests: ['AI / Machine Learning', 'Cloud']
  };

  const candidate2Data = {
    name: `Aarav ${rand}`,
    email: `aarav_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'BITS Pilani',
    course: 'AI & Data Science',
    headline: 'ML & NLP Specialist',
    experienceLevel: 'Experienced',
    pastProjectsCount: 3,
    skills: [
      { name: 'Python', proficiency: 'Expert' },
      { name: 'Machine Learning', proficiency: 'Expert' },
      { name: 'NLP', proficiency: 'Advanced' },
      { name: 'PyTorch', proficiency: 'Advanced' }
    ],
    interests: ['AI / Machine Learning', 'NLP', 'Computer Vision']
  };

  const candidate3Data = {
    name: `Priya ${rand}`,
    email: `priya_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'NID Ahmedabad',
    course: 'Interaction Design',
    headline: 'Product & UI/UX Designer',
    experienceLevel: 'Intermediate',
    pastProjectsCount: 2,
    skills: [
      { name: 'UI/UX', proficiency: 'Expert' },
      { name: 'Figma', proficiency: 'Expert' },
      { name: 'Tailwind CSS', proficiency: 'Advanced' },
      { name: 'Design Systems', proficiency: 'Advanced' }
    ],
    interests: ['Design', 'AI / Machine Learning', 'Web Apps']
  };

  const candidate4Data = {
    name: `Rahul ${rand}`,
    email: `rahul_${rand}@teamforge.test`,
    password: 'Password@123',
    college: 'IIIT Hyderabad',
    course: 'ECE',
    headline: 'Frontend Engineer',
    experienceLevel: 'Intermediate',
    pastProjectsCount: 2,
    skills: [
      { name: 'React', proficiency: 'Advanced' },
      { name: 'TypeScript', proficiency: 'Advanced' },
      { name: 'Next.js', proficiency: 'Intermediate' }
    ],
    interests: ['Web Development', 'Open Source']
  };

  let ownerToken = '';
  let projectId = '';

  // Register users
  await test('Register Project Owner', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerData)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Owner register failed');
    ownerToken = json.data.token;
  });

  await test('Register Candidates (Mohit, Aarav, Priya, Rahul)', async () => {
    for (const c of [candidate1Data, candidate2Data, candidate3Data, candidate4Data]) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      const json = await res.json();
      if (!res.ok || !json.data?.token) throw new Error(`Register failed for ${c.name}: ${json.message}`);
    }
  });

  // Verify Existing AI Project Analysis Works
  await test('POST /api/ai/analyze-project (Existing AI Analysis intact)', async () => {
    const res = await fetch(`${BASE_URL}/ai/analyze-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        description: 'Build an AI Resume Scanner and matching platform using Gemini, React, Node.js and NLP algorithms.',
        category: 'AI / Machine Learning'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error(json.message || 'AI analyze project failed');
    if (!Array.isArray(json.data.requiredSkills) || json.data.requiredSkills.length === 0) {
      throw new Error('requiredSkills missing in AI analysis');
    }
    if (!json.data.skillImportance) {
      throw new Error('skillImportance missing in AI analysis');
    }
  });

  // Create Project
  await test('Create Project with AI Analysis metadata', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: `AI Resume Scanner Hub ${rand}`,
        description: 'Building an intelligent AI resume scanner and candidate matching engine with NLP models and interactive dashboard.',
        category: 'AI / Machine Learning',
        difficulty: 'Medium',
        teamSize: 5,
        requiredSkills: ['Python', 'Machine Learning', 'NLP', 'Node.js', 'UI/UX', 'MongoDB'],
        suggestedRoles: ['Backend Lead', 'ML Architect', 'UI/UX Designer', 'Frontend Specialist']
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create project failed');
    projectId = json.data._id;
  });

  // Query AI Team Recommendations
  let recData = null;
  await test('GET /api/projects/:id/ai-team-recommendations', async () => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/ai-team-recommendations`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error(json.message || 'Fetch AI recommendations failed');
    recData = json.data;

    console.log(`\n   ⭐ Team Compatibility Score: ${recData.teamCompatibilityScore}%`);
    console.log(`   📝 Team Synergy Summary: "${recData.teamSynergySummary}"`);
    console.log(`   👥 Recommended Team Composition (${recData.recommendedTeam?.length} members):`);
    recData.recommendedTeam.forEach((m, idx) => {
      console.log(`      ${idx + 1}. ${m.student.name} — ${m.role} — ${m.matchScore}%`);
      console.log(`         Why: ${m.whyRecommended}`);
    });
  });

  await test('Validate Recommendation Structure & Logic', async () => {
    if (typeof recData.teamCompatibilityScore !== 'number' || recData.teamCompatibilityScore < 50) {
      throw new Error(`Invalid team compatibility score: ${recData.teamCompatibilityScore}`);
    }
    if (!recData.recommendedTeam || recData.recommendedTeam.length === 0) {
      throw new Error('Recommended team array is empty');
    }
    for (const member of recData.recommendedTeam) {
      if (!member.student?.name) throw new Error('Member student name is missing');
      if (!member.role) throw new Error(`Role is missing for ${member.student.name}`);
      if (typeof member.matchScore !== 'number' || member.matchScore < 50) {
        throw new Error(`Invalid matchScore for ${member.student.name}: ${member.matchScore}`);
      }
      if (!member.whyRecommended || member.whyRecommended.length < 5) {
        throw new Error(`whyRecommended explanation is missing for ${member.student.name}`);
      }
    }
  });

  // Verify 1-click invitation to a recommended member
  await test('Send Invitation to Top Recommended Member', async () => {
    const topMember = recData.recommendedTeam[0];
    const res = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        receiverId: topMember.student._id,
        projectId,
        role: topMember.role,
        message: `Hey ${topMember.student.name}! You are recommended for our ${topMember.role} role.`
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Send invitation failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRecommendationTests();
