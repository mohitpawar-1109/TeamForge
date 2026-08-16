const BASE_URL = 'http://localhost:5000/api';

async function runCommentsTests() {
  console.log('==================================================');
  console.log('💬 RUNNING TEAMFORGE COMMENTS SYSTEM API TESTS');
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

  // 1. Register Author 1 and Author 2
  const randomSuffix = Math.floor(Math.random() * 100000);
  const user1Data = {
    name: `Mohit Pawar ${randomSuffix}`,
    email: `mohit_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Delhi',
    course: 'Computer Science',
    headline: 'Backend Lead & Cloud Architect'
  };

  const user2Data = {
    name: `Aman Sharma ${randomSuffix}`,
    email: `aman_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'Electrical Eng',
    headline: 'UI/UX & Frontend Developer'
  };

  let token1 = '';
  let user1Id = '';
  let token2 = '';
  let user2Id = '';

  await test('Register User 1 (Post Owner & Commenter)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Data)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token1 = json.data.token;
    user1Id = json.data._id;
  });

  await test('Register User 2 (Secondary Commenter)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user2Data)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token2 = json.data.token;
    user2Id = json.data._id;
  });

  // 2. Create Post
  let postId = '';
  await test('Create Test Post', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Anyone participating in Smart India Hackathon 2026? Looking for feedback on our architecture!',
        type: 'HACKATHON',
        tags: ['sih2026', 'architecture']
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Create post failed');
    postId = json.data._id;
  });

  // 3. GET /api/posts/:id/comments (Initially Empty)
  await test('GET /api/posts/:id/comments (Empty List Check)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data) || json.data.length !== 0) {
      throw new Error(`Expected empty comments list, got ${json.data?.length}`);
    }
  });

  // 4. POST /api/posts/:id/comments (Empty validation)
  await test('POST /api/posts/:id/comments (Reject Empty Comment)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: '   ' })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 5. POST /api/posts/:id/comments (Unauthenticated rejection)
  await test('POST /api/posts/:id/comments (Reject Unauthenticated)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Unauthenticated comment' })
    });
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
  });

  // 6. POST /api/posts/:id/comments (Valid Comment by User 2)
  let comment1Id = '';
  await test('POST /api/posts/:id/comments (User 2 Adds Comment)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Great idea! I can help with the backend and Docker containers.'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to post comment');
    if (!json.data.author?.name || json.data.author.name !== user2Data.name) {
      throw new Error('Author was not populated properly');
    }
    comment1Id = json.data._id;
  });

  // 7. Verify Post's commentsCount incremented
  await test('GET /api/posts/:id (Verify commentsCount incremented to 1)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || json.data.commentsCount !== 1) {
      throw new Error(`Expected commentsCount = 1, got ${json.data?.commentsCount}`);
    }
  });

  // 8. PUT /api/comments/:id (Non-author Forbidden Check)
  await test('PUT /api/comments/:id (Forbidden for Non-Author)', async () => {
    const res = await fetch(`${BASE_URL}/comments/${comment1Id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token1}`, // User 1 trying to edit User 2's comment
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Malicious edit!' })
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  // 9. PUT /api/comments/:id (Author Edit Comment)
  await test('PUT /api/comments/:id (Author Updates Comment Content)', async () => {
    const res = await fetch(`${BASE_URL}/comments/${comment1Id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Great idea! I can help with the backend and Kubernetes deployment.'
      })
    });
    const json = await res.json();
    if (!res.ok || json.data.content !== 'Great idea! I can help with the backend and Kubernetes deployment.') {
      throw new Error(json.message || 'Edit failed');
    }
  });

  // 10. User 1 adds a second comment
  let comment2Id = '';
  await test('POST /api/posts/:id/comments (User 1 Replies)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Awesome Aman, I will send you an invitation right now!'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Reply failed');
    comment2Id = json.data._id;
  });

  // 11. GET /api/posts/:id/comments (Verify 2 comments returned in order)
  await test('GET /api/posts/:id/comments (List 2 Comments Populated)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.data) || json.data.length !== 2) {
      throw new Error(`Expected 2 comments, got ${json.data?.length}`);
    }
    if (json.data[0]._id !== comment1Id || json.data[1]._id !== comment2Id) {
      throw new Error('Comments order mismatch');
    }
    if (!json.data[0].author?.name || !json.data[1].author?.name) {
      throw new Error('Author populated info missing in comments list');
    }
  });

  // 12. DELETE /api/comments/:id (Non-author Forbidden Check)
  await test('DELETE /api/comments/:id (Forbidden for Non-Author)', async () => {
    const res = await fetch(`${BASE_URL}/comments/${comment1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token1}` } // User 1 trying to delete User 2's comment
    });
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  // 13. DELETE /api/comments/:id (Author Deletes Comment)
  await test('DELETE /api/comments/:id (Author Deletes Comment)', async () => {
    const res = await fetch(`${BASE_URL}/comments/${comment1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Delete comment failed');
  });

  // 14. Verify Post's commentsCount decremented to 1
  await test('GET /api/posts/:id (Verify commentsCount decremented to 1)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    const json = await res.json();
    if (!res.ok || json.data.commentsCount !== 1) {
      throw new Error(`Expected commentsCount = 1, got ${json.data?.commentsCount}`);
    }
  });

  // 15. Clean up post
  await test('DELETE /api/posts/:id (Cleanup Test Post)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Cleanup post failed');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL COMMENTS TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCommentsTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
