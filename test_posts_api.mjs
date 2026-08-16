const BASE_URL = 'http://localhost:5000/api';

async function runPostsTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING TEAMFORGE COMMUNITY POSTS API TESTS');
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

  // 1. Authenticate / Register Test User
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    name: `Community Tester ${randomSuffix}`,
    email: `community_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'Computer Science',
    year: '4th Year',
    headline: 'AI Hacker & Open Source Contributor'
  };

  let token = '';
  let userId = '';

  await test('POST /api/auth/register', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token = json.data.token;
    userId = json.data._id;
  });

  // 2. Create a Post
  let postId = '';
  await test('POST /api/posts (Create HACKATHON Post)', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Building an AI agent for Smart India Hackathon! Looking for 1 frontend dev skilled in React and Tailwind.',
        type: 'LOOKING_FOR_TEAMMATES',
        tags: ['hackathon', 'aiml', 'react', 'sih2026'],
        projectLink: 'https://github.com/teamforge/ai-sih'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create post failed');
    if (json.data.type !== 'LOOKING_FOR_TEAMMATES') throw new Error(`Type mismatch: ${json.data.type}`);
    if (json.data.tags.length !== 4) throw new Error(`Tags mismatch: expected 4, got ${json.data.tags.length}`);
    postId = json.data._id;
  });

  // 3. GET /api/posts (List All)
  await test('GET /api/posts (List with Author Populated)', async () => {
    const res = await fetch(`${BASE_URL}/posts`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data) || json.data.length === 0) throw new Error('Get posts failed');
    const created = json.data.find(p => p._id === postId);
    if (!created) throw new Error('Created post not found in feed');
    if (!created.author?.name) throw new Error('Author was not populated');
  });

  // 4. GET /api/posts?type=LOOKING_FOR_TEAMMATES (Filtered)
  await test('GET /api/posts?type=LOOKING_FOR_TEAMMATES (Filter Check)', async () => {
    const res = await fetch(`${BASE_URL}/posts?type=LOOKING_FOR_TEAMMATES`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data)) throw new Error('Filter query failed');
    const allMatch = json.data.every(p => p.type === 'LOOKING_FOR_TEAMMATES');
    if (!allMatch) throw new Error('Filter returned mismatched post types');
  });

  // 5. GET /api/posts/:id
  await test(`GET /api/posts/${postId} (Single Post)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || !json.data || json.data._id !== postId) throw new Error('Get single post failed');
  });

  // 6. POST /api/posts/:id/like (Toggle Like)
  await test(`POST /api/posts/${postId}/like (Toggle Like ON)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data || json.data.likesCount !== 1 || !json.data.isLiked) {
      throw new Error(`Like ON failed: ${JSON.stringify(json)}`);
    }
  });

  await test(`POST /api/posts/${postId}/like (Toggle Like OFF)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.data || json.data.likesCount !== 0 || json.data.isLiked) {
      throw new Error(`Like OFF failed: ${JSON.stringify(json)}`);
    }
  });

  // 7. PUT /api/posts/:id (Update Content)
  await test(`PUT /api/posts/${postId} (Update Content)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Updated: Found 1 teammate! Still looking for 1 UI/UX designer.',
        tags: ['hackathon', 'uiux', 'figma']
      })
    });
    const json = await res.json();
    if (!res.ok || json.data.content !== 'Updated: Found 1 teammate! Still looking for 1 UI/UX designer.') {
      throw new Error(json.message || 'Update failed');
    }
  });

  // 8. Test Non-Author Forbidden Edit & Delete
  let otherToken = '';
  await test('Register Non-Author User', async () => {
    const nonAuthor = {
      name: `Other User ${randomSuffix}`,
      email: `other_${randomSuffix}@teamforge.test`,
      password: 'Password@123'
    };
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nonAuthor)
    });
    const regJson = await regRes.json();
    if (!regRes.ok || !regJson.data?.token) throw new Error('Registration failed');
    otherToken = regJson.data.token;
  });

  await test(`PUT /api/posts/${postId} (Forbidden for Non-Author)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${otherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Hacked update!' })
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  // 9. DELETE /api/posts/:id (Author Delete)
  await test(`DELETE /api/posts/${postId} (Author Delete)`, async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed');

    // Confirm deleted
    const checkRes = await fetch(`${BASE_URL}/posts/${postId}`);
    if (checkRes.status !== 404) throw new Error('Post still exists after delete');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPostsTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
