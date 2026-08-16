const BASE_URL = 'http://localhost:5000/api';

async function runLikeSystemTests() {
  console.log('==================================================');
  console.log('❤️ RUNNING TEAMFORGE LIKE & UNLIKE SYSTEM TESTS');
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

  // 1. Register test user
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    name: `Liker User ${randomSuffix}`,
    email: `liker_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'BITS Pilani',
    course: 'Computer Science',
    headline: 'Full Stack & Open Source Enthusiast'
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

  // 2. Create post
  let postId = '';
  await test('POST /api/posts (Create test post)', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Check out our new hackathon submission for TeamForge!',
        type: 'PROJECT',
        tags: ['hackathon', 'teamforge', 'react']
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create post failed');
    postId = json.data._id;
  });

  // 3. Unauthenticated Like Attempt
  await test('POST /api/posts/:id/like (Unauthenticated 401 Check)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST'
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 4. Like post (POST /api/posts/:id/like)
  await test('POST /api/posts/:id/like (First Like)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Like failed');
    if (json.liked !== true) throw new Error(`Expected liked: true, got ${json.liked}`);
    if (json.likeCount !== 1) throw new Error(`Expected likeCount: 1, got ${json.likeCount}`);
  });

  // 5. Duplicate Like Prevention
  await test('POST /api/posts/:id/like (Duplicate Like Prevention)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Duplicate like check failed');
    if (json.liked !== true) throw new Error(`Expected liked: true, got ${json.liked}`);
    if (json.likeCount !== 1) throw new Error(`Expected likeCount to remain 1, got ${json.likeCount}`);
  });

  // 6. Persistence check via GET /api/posts/:id
  await test('GET /api/posts/:id (Verify Like Persistence in DB)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error('Get post failed');
    const post = json.data;
    if (!Array.isArray(post.likes) || post.likes.length !== 1) {
      throw new Error(`Expected likes length 1, got ${post.likes?.length}`);
    }
    const hasUserId = post.likes.some(id => (id?._id || id)?.toString() === userId.toString());
    if (!hasUserId) throw new Error('User ID not present in post likes array');
  });

  // 7. Unlike post (DELETE /api/posts/:id/like)
  await test('DELETE /api/posts/:id/like (Unlike)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Unlike failed');
    if (json.liked !== false) throw new Error(`Expected liked: false, got ${json.liked}`);
    if (json.likeCount !== 0) throw new Error(`Expected likeCount: 0, got ${json.likeCount}`);
  });

  // 8. Verify Removed State in DB
  await test('GET /api/posts/:id (Verify Unlike Persistence in DB)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || !json.data) throw new Error('Get post failed');
    const post = json.data;
    if (!Array.isArray(post.likes) || post.likes.length !== 0) {
      throw new Error(`Expected likes length 0, got ${post.likes?.length}`);
    }
  });

  // 9. Clean up test post
  await test('DELETE /api/posts/:id (Cleanup)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Cleanup failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL LIKE SYSTEM TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLikeSystemTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
