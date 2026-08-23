const BASE_URL = 'http://localhost:5000/api';

async function runUploadPipelineTest() {
  console.log('==================================================');
  console.log('🧪 TESTING TEAMFORGE COMMUNITY ALL POST SCENARIOS');
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

  // Sample 1x1 PNG & fake MP4 byte streams
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const mp4Buffer = Buffer.from('AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQ==', 'base64');

  // 1. Register User
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    name: `Media Tester ${randomSuffix}`,
    email: `media_${randomSuffix}@teamforge.test`,
    password: 'Password@123',
    college: 'IIT Bombay',
    course: 'Computer Science',
    year: '3rd Year'
  };

  let token = '';
  await test('User Registration', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const json = await res.json();
    if (!res.ok || !json.data?.token) throw new Error(json.message || 'Registration failed');
    token = json.data.token;
  });

  const createdPostIds = [];

  // TEST 1: Text only
  await test('TEST 1: Text-only post ("Hello TeamForge")', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Hello TeamForge',
        type: 'TEXT'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create text post');
    createdPostIds.push(json.data._id);
  });

  // TEST 2: Image only (empty text)
  await test('TEST 2: Image-only post (Empty text + Image attachment)', async () => {
    const formData = new FormData();
    formData.append('content', '');
    formData.append('type', 'TEXT');
    formData.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'design_mockup.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create image-only post');
    if (!json.data.media || json.data.media.length === 0) throw new Error('Post created without media object');
    createdPostIds.push(json.data._id);
  });

  // TEST 3: Video only (empty text)
  await test('TEST 3: Video-only post (Empty text + Video attachment)', async () => {
    const formData = new FormData();
    formData.append('content', '');
    formData.append('type', 'TEXT');
    formData.append('media', new Blob([mp4Buffer], { type: 'video/mp4' }), 'demo_video.mp4');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create video-only post');
    if (!json.data.media || json.data.media.length === 0 || json.data.media[0].type !== 'video') {
      throw new Error('Post created without video media');
    }
    createdPostIds.push(json.data._id);
  });

  // TEST 4: Text + Image
  await test('TEST 4: Text + Image post ("Here is my project" + Image)', async () => {
    const formData = new FormData();
    formData.append('content', 'Here is my project');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'project_shot.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create text+image post');
    createdPostIds.push(json.data._id);
  });

  // TEST 5: Text + Video
  await test('TEST 5: Text + Video post ("Project demo" + Video)', async () => {
    const formData = new FormData();
    formData.append('content', 'Project demo');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([mp4Buffer], { type: 'video/mp4' }), 'project_demo.mp4');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create text+video post');
    createdPostIds.push(json.data._id);
  });

  // TEST 6: Multiple images (3 images)
  await test('TEST 6: Multiple images post (3 attached images)', async () => {
    const formData = new FormData();
    formData.append('content', '3 UI Variations');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'ui1.png');
    formData.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'ui2.png');
    formData.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'ui3.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create multiple images post');
    if (!json.data.media || json.data.media.length !== 3) {
      throw new Error(`Expected 3 media items, but got ${json.data.media?.length}`);
    }
    createdPostIds.push(json.data._id);
  });

  // TEST 7: Empty post rejection
  await test('TEST 7: Empty post rejection (no text + no media)', async () => {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: '   ',
        type: 'TEXT'
      })
    });
    const json = await res.json();
    if (res.status !== 400 || json.success === true) {
      throw new Error('Expected 400 rejection for empty post, but request succeeded');
    }
  });

  // Clean up all created posts
  await test('Clean up all test posts', async () => {
    for (const pId of createdPostIds) {
      await fetch(`${BASE_URL}/posts/${pId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runUploadPipelineTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
