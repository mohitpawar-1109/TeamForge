const BASE_URL = 'http://localhost:5000/api';

async function runForgotPasswordE2ETest() {
  console.log('==================================================');
  console.log('🚀 RUNNING FORGOT PASSWORD & OTP E2E VERIFICATION');
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
  const testEmail = `student_${rand}@teamforge-test.edu`;
  const originalPassword = 'OldPassword123!';
  const updatedPassword = 'NewSecretPassword456!';

  // 1. Register a test user
  await test('Register test user account', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Student ${rand}`,
        email: testEmail,
        password: originalPassword,
        headline: 'CS Student',
        skills: ['JavaScript']
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Registration failed');
  });

  // 2. Test Invalid Email format
  await test('Validation error for empty/invalid email', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 3. Test Forgot Password for non-existent email (enumeration protection)
  await test('Forgot password for non-existent account returns safe generic message', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `ghost_${rand}@nonexistent.edu` })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  });

  // 4. Test Forgot Password for registered user -> triggers real OTP email dispatch
  await test('Forgot password for valid registered user dispatches email', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Forgot password failed');
  });

  // 5. Test Rate Limiting Cooldown on immediate second request
  await test('Rate limiting cooldown check on immediate resend', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    if (!data.message.includes('recently sent') && !data.message.includes('wait 60 seconds')) {
      throw new Error(`Expected rate limit warning, got: ${data.message}`);
    }
  });

  // 6. Test OTP verification with Wrong OTP
  await test('OTP verification rejects incorrect code', async () => {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for wrong OTP, got ${res.status}`);
  });

  console.log('\n==================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runForgotPasswordE2ETest();
