const BASE_URL = 'http://localhost:5000/api';

async function runMentorTests() {
  console.log('==================================================');
  console.log('🚀 RUNNING AI PROJECT MENTOR SYSTEM TESTS');
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
  let project = null;

  // 1. Register User
  await test('Register User (Lead Developer)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Mohit MentorLead ${rand}`,
        email: `lead_${rand}@mentortest.com`,
        password: 'Password123!',
        headline: 'Full Stack Architect',
        skills: ['React', 'Node.js']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    token = data.data.token;
    user = data.data;
  });

  // 2. Create Project with context (skills, description)
  await test('Create Target Project with Real Context', async () => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `AI Resume Scanner Hub ${rand}`,
        description: 'An AI-powered web platform that extracts candidate skills from PDF resumes, calculates match scores, and matches candidates to open engineering positions.',
        category: 'AI / Machine Learning',
        difficulty: 'Medium',
        duration: '4 Weeks',
        teamSize: 4,
        requiredSkills: ['React', 'Node.js', 'Python', 'Machine Learning', 'UI/UX']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    project = data.data;
  });

  // 3. Create Sample Tasks on Project
  await test('Seed Project Tasks for Mentor Context', async () => {
    await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Design Landing Page Wireframes',
        assignedTo: user._id,
        priority: 'High',
        status: 'IN PROGRESS'
      })
    });

    await fetch(`${BASE_URL}/projects/${project._id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Implement Resume PDF Parser API',
        assignedTo: user._id,
        priority: 'High',
        status: 'TODO'
      })
    });
  });

  // 4. GET /api/projects/:id/ai-mentor/prompts
  await test('GET /api/projects/:id/ai-mentor/prompts (Verify 7 Core Prompts)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/prompts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!Array.isArray(data.data) || data.data.length < 7) {
      throw new Error(`Expected at least 7 core prompt templates, got ${data.data?.length}`);
    }
  });

  // 5. Query: "What should we build first?"
  await test('AI Mentor: "What should we build first?" (MVP Roadmap)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'What should we build first for our MVP?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.data?.content || data.data.content.length < 50) {
      throw new Error('Mentor response content too short or empty');
    }
    console.log(`\n   🤖 Mentor Answer Snippet: "${data.data.content.substring(0, 100).replace(/\n/g, ' ')}..." [Source: ${data.source}]`);
  });

  // 6. Query: "What technologies should we use?"
  await test('AI Mentor: "What technologies should we use?" (Tech Stack & Architecture)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'What technologies and architectural stack should we use?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.data?.content) throw new Error('No content returned');
  });

  // 7. Query: "What tasks should we create?"
  await test('AI Mentor: "What tasks should we create?" (Sprint Backlog Items)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'What tasks should we create for our sprint backlog?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // 8. Query: "What skills are missing?"
  await test('AI Mentor: "What skills are missing?" (Skill Gap Awareness)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'What skills are missing from our squad right now?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    // Verify response mentions Python or Machine Learning or missing skills
    const content = data.data.content;
    if (!content.includes('Python') && !content.includes('Machine Learning') && !content.includes('Missing') && !content.includes('skills')) {
      throw new Error('Mentor did not address the project missing skills accurately');
    }
  });

  // 9. Query: "How should we structure the project?"
  await test('AI Mentor: "How should we structure the project?" (Folder Layout)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'How should we structure our folder layout and codebase?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // 10. Query: "What are possible technical risks?"
  await test('AI Mentor: "What are possible technical risks?" (Bottlenecks & Security)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'What are the possible technical risks and performance bottlenecks?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // 11. Query: "How can we divide tasks among team members?"
  await test('AI Mentor: "How can we divide tasks among team members?" (Workload Allocation)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'How can we divide tasks among team members?'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // 12. GET /api/projects/:id/ai-mentor/history
  await test('GET /api/projects/:id/ai-mentor/history (Verify Persistent History)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    if (!data.data || data.data.length < 14) {
      throw new Error(`Expected at least 14 messages (7 user + 7 assistant), got ${data.data?.length}`);
    }
    console.log(`\n   📜 Conversation History: ${data.data.length} messages preserved`);
  });

  // 13. DELETE /api/projects/:id/ai-mentor/history
  await test('DELETE /api/projects/:id/ai-mentor/history (Clear Conversation)', async () => {
    const res = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    // Verify history is now empty
    const checkRes = await fetch(`${BASE_URL}/projects/${project._id}/ai-mentor/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const checkData = await checkRes.json();
    if (checkData.data.length !== 0) {
      throw new Error(`Expected 0 messages after clear, got ${checkData.data.length}`);
    }
  });

  console.log('\n==================================================');
  console.log(`🎉 AI MENTOR TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runMentorTests();
