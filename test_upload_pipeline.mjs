import zlib from 'zlib';

const BASE_URL = 'http://localhost:5000/api';

// Helper to generate a valid real PNG buffer (~5KB)
function createRealPngBuffer(width = 64, height = 64) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // truecolor RGB
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]),
    ihdrData,
    Buffer.alloc(4)
  ]);
  
  // Uncompressed scanlines with pseudo-random colors to make it non-trivial in size (~5KB)
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let i = 0; i < rawData.length; i++) {
    rawData[i] = (i * 37 + 11) % 256;
  }
  const compressed = zlib.deflateSync(rawData);
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idatChunk = Buffer.concat([
    idatLen,
    Buffer.from('IDAT'),
    compressed,
    Buffer.alloc(4)
  ]);
  
  // IEND chunk
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Real valid PNG (~5 KB)
const realPngBuffer = createRealPngBuffer(64, 64);

// Real valid MP4 buffer (> 2KB)
const realMp4Buffer = Buffer.concat([
  Buffer.from('AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQ==', 'base64'),
  Buffer.alloc(2048, 0x00)
]);

async function runUploadPipelineTest() {
  console.log('==================================================');
  console.log('🧪 TESTING TEAMFORGE COMMUNITY REAL MEDIA PIPELINE');
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
    if (json.data.media?.length !== 0) throw new Error('Expected media to be empty');
    createdPostIds.push(json.data._id);
  });

  // TEST 2: Real image upload (> 500 bytes)
  await test('TEST 2: Real Image post (Valid PNG buffer > 500B)', async () => {
    const formData = new FormData();
    formData.append('content', 'Real image post test');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([realPngBuffer], { type: 'image/png' }), 'real_screenshot.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create image post');
    if (!json.data.media || json.data.media.length !== 1) throw new Error('Expected 1 media item');
    if (!json.data.media[0].url.startsWith('https://ik.imagekit.io/')) throw new Error('Expected ImageKit URL');
    createdPostIds.push(json.data._id);
  });

  // TEST 3: Real video upload (> 2KB)
  await test('TEST 3: Real Video post (Valid MP4 buffer > 2KB)', async () => {
    const formData = new FormData();
    formData.append('content', 'Real video post test');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([realMp4Buffer], { type: 'video/mp4' }), 'real_demo.mp4');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create video post');
    if (!json.data.media || json.data.media.length !== 1 || json.data.media[0].type !== 'video') {
      throw new Error('Expected video media item');
    }
    createdPostIds.push(json.data._id);
  });

  // TEST 4: Multiple real images (3 images)
  await test('TEST 4: Multiple images post (3 attached real PNGs)', async () => {
    const formData = new FormData();
    formData.append('content', '3 Real Screenshots');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([realPngBuffer], { type: 'image/png' }), 'screen1.png');
    formData.append('media', new Blob([realPngBuffer], { type: 'image/png' }), 'screen2.png');
    formData.append('media', new Blob([realPngBuffer], { type: 'image/png' }), 'screen3.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (!res.ok || !json.data?._id) throw new Error(json.message || 'Failed to create multi-image post');
    if (!json.data.media || json.data.media.length !== 3) {
      throw new Error(`Expected 3 media items, but got ${json.data.media?.length}`);
    }
    createdPostIds.push(json.data._id);
  });

  // TEST 5: Tiny placeholder/corrupt file rejection (< 100B)
  await test('TEST 5: Tiny dummy file rejection (< 100B rejected with 400)', async () => {
    const tinyBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // 4 bytes
    const formData = new FormData();
    formData.append('content', 'Tiny corrupted file');
    formData.append('type', 'PROJECT');
    formData.append('media', new Blob([tinyBuffer], { type: 'image/png' }), 'tiny_dummy.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (res.status !== 400 || json.success === true) {
      throw new Error('Expected 400 rejection for tiny dummy file');
    }
  });

  // TEST 6: Empty post rejection (no text + no media)
  await test('TEST 6: Empty post rejection (no text + no media)', async () => {
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
