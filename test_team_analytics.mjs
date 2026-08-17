const BASE_URL = 'http://localhost:5000/api';

async function runTeamAnalyticsTests() {
  console.log('==================================================');
  console.log('📊 RUNNING TEAM PERFORMANCE ANALYTICS TESTS');
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
  let project = null;

  // 1. Register Users
  await test('Register Lead & Contributor', async () => {
    const resA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Diana AnalyticsLead ${rand}`,
        email: `analytics_lead_${rand}@test.com`,
        password: 'Password123!',
        headline: 'Lead Data Architect',
        skills: ['React', 'Python', 'Node.js']
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
        name: `Ethan Dev ${rand}`,
        email: `analytics_dev_${rand}@test.com`,
        password: 'Password123!',
        headline: 'Backend Engineer',
        skills: ['Node.js', 'MongoDB']
      })
    });
    const dataB = await resB.json();
    if (!dataB.success) throw new Error(dataB.message);
    tokenB = dataB.data.token;
    userB = dataB.data;
  });

  // 2. Create Project and Add Member
  await test('Create Target Project and Add Team Member', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: `AI Analytics Engine ${rand}`,
        description: 'Performance benchmarking and metrics computation',
        category: 'Web Development',
        difficulty: 'Medium',
        teamSize: 3,
        requiredSkills: ['React', 'Python', 'Node.js']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    project = data.data;

    // Send invitation to User B
    const invRes = await fetch(`${BASE_URL}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        projectId: project._id,
        receiverId: userB._id,
        role: 'Core Developer'
      })
    });
    const invData = await invRes.json();
    if (!invData.success) throw new Error(invData.message);

    // Accept invitation
    const acceptRes = await fetch(`${BASE_URL}/invitations/${invData.data._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    const acceptData = await acceptRes.json();
    if (!acceptData.success) throw new Error(acceptData.message);
  });

  // 3. Create Real Sprint Tasks (Done, In Progress, Todo)
  await test('Create Tasks in Various States and Priorities', async () => {
    // Task 1: DONE (Urgent) assigned to User A
    const t1Res = await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Design Database Schemas',
        priority: 'Urgent',
        status: 'DONE',
        assignedTo: userA._id
      })
    });
    const t1Data = await t1Res.json();
    if (!t1Data.success) throw new Error(t1Data.message);

    // Task 2: IN PROGRESS (High) assigned to User B
    const t2Res = await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Build API Gateway and Routing',
        priority: 'High',
        status: 'IN PROGRESS',
        assignedTo: userB._id
      })
    });
    const t2Data = await t2Res.json();
    if (!t2Data.success) throw new Error(t2Data.message);

    // Task 3: TODO (Medium) assigned to User B
    const t3Res = await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Implement Unit Tests',
        priority: 'Medium',
        status: 'TODO',
        assignedTo: userB._id
      })
    });
    const t3Data = await t3Res.json();
    if (!t3Data.success) throw new Error(t3Data.message);
  });

  // 4. Send Real Team Chat Messages
  await test('Send Team Chat Messages to Populate Communication Metrics', async () => {
    const roomId = `project-${project._id}`;

    // User A sends message
    const msg1Res = await fetch(`${BASE_URL}/messages/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        project: project._id,
        content: 'Welcome to the AI Analytics sprint team!'
      })
    });
    const msg1Data = await msg1Res.json();
    if (!msg1Data.success) throw new Error(msg1Data.message);

    // User B sends message
    const msg2Res = await fetch(`${BASE_URL}/messages/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        project: project._id,
        content: 'Excited to build! Starting on the API gateway now.'
      })
    });
    const msg2Data = await msg2Res.json();
    if (!msg2Data.success) throw new Error(msg2Data.message);
  });

  // 5. Test Analytics Computation (GET /api/projects/:id/analytics)
  await test('Verify Computed Team Performance Analytics', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const a = data.data;

    // Check project summary
    if (a.summary.totalTasks !== 3) throw new Error(`Expected 3 tasks, got ${a.summary.totalTasks}`);
    if (a.summary.completedTasks !== 1) throw new Error(`Expected 1 completed task, got ${a.summary.completedTasks}`);
    if (a.summary.inProgressTasks !== 1) throw new Error(`Expected 1 in progress task, got ${a.summary.inProgressTasks}`);
    if (a.summary.todoTasks !== 1) throw new Error(`Expected 1 todo task, got ${a.summary.todoTasks}`);
    if (a.summary.totalMessages < 2) throw new Error(`Expected at least 2 messages, got ${a.summary.totalMessages}`);
    if (a.summary.totalMembers !== 2) throw new Error(`Expected 2 members, got ${a.summary.totalMembers}`);

    // Check Progress Calculation (1/3 = 33%)
    if (a.progress !== 33) throw new Error(`Expected progress 33%, got ${a.progress}%`);

    // Check Priority Breakdown
    if (a.priorityBreakdown.Urgent !== 1) throw new Error(`Expected 1 urgent task, got ${a.priorityBreakdown.Urgent}`);
    if (a.priorityBreakdown.High !== 1) throw new Error(`Expected 1 high task, got ${a.priorityBreakdown.High}`);
    if (a.priorityBreakdown.Medium !== 1) throw new Error(`Expected 1 medium task, got ${a.priorityBreakdown.Medium}`);

    // Check Member Performance
    if (!Array.isArray(a.memberPerformance) || a.memberPerformance.length !== 2) {
      throw new Error('Member performance array incomplete');
    }

    const leadPerf = a.memberPerformance.find((m) => m.name.includes('Diana'));
    if (!leadPerf || leadPerf.completedCount !== 1) {
      throw new Error('Lead performance metrics incorrect');
    }

    const devPerf = a.memberPerformance.find((m) => m.name.includes('Ethan'));
    if (!devPerf || devPerf.assignedCount !== 2 || devPerf.inProgressCount !== 1) {
      throw new Error('Dev performance metrics incorrect');
    }

    // Check Milestones and Timeline
    if (!Array.isArray(a.milestones) || a.milestones.length < 4) {
      throw new Error('Milestones array incomplete');
    }
    if (!Array.isArray(a.timelineEvents) || a.timelineEvents.length === 0) {
      throw new Error('Timeline events array empty');
    }

    console.log(`\n   📈 Progress: ${a.progress}% (${a.summary.completedTasks}/${a.summary.totalTasks} Tasks Completed)`);
    console.log(`   👥 Team Members: ${a.summary.totalMembers} • Chat Messages: ${a.summary.totalMessages}`);
    console.log(`   🏆 Top Contributor: ${leadPerf.name} (${leadPerf.contributionShare}% Share)`);
  });

  console.log('\n==================================================');
  console.log(`🎉 TEAM PERFORMANCE ANALYTICS TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTeamAnalyticsTests();
