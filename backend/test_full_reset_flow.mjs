import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import PasswordReset from './models/PasswordReset.js';
import User from './models/User.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runFullPasswordResetVerification() {
  console.log('==================================================');
  console.log('🚀 RUNNING COMPLETE FORGOT PASSWORD -> RESET -> LOGIN FLOW');
  console.log('==================================================\n');

  await connectDB();

  const rand = Math.floor(Math.random() * 100000);
  const email = `testuser_${rand}@domain.com`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewResetPassword789!';

  // 1. Create User
  console.log('1. Registering user...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Reset Tester ${rand}`,
      email,
      password: initialPassword,
      headline: 'Tester',
      skills: ['Security']
    })
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error(regData.message);
  console.log('   ✅ User registered successfully.');

  // 2. Forgot Password Request
  console.log('2. Requesting Forgot Password OTP...');
  const fpRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const fpData = await fpRes.json();
  if (!fpData.success) throw new Error(fpData.message);
  console.log('   ✅ Forgot password API responded with success.');

  // 3. Find OTP Record in DB
  console.log('3. Inspecting MongoDB for OTP record...');
  const record = await PasswordReset.findOne({ email, verified: false });
  if (!record) throw new Error('PasswordReset record not found in MongoDB!');
  console.log(`   ✅ Record found in DB (Hashed OTP: ${record.otpHash.substring(0, 12)}..., ExpiresAt: ${record.expiresAt})`);

  // To test exact OTP verification endpoint
  const knownOtp = '742918';
  const knownHash = crypto.createHash('sha256').update(knownOtp).digest('hex');
  record.otpHash = knownHash;
  await record.save();

  // 4. Verify OTP endpoint with the known OTP
  console.log('4. Verifying OTP via /api/auth/verify-otp...');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: knownOtp })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success || !verifyData.resetToken) {
    throw new Error(`OTP verification failed: ${verifyData.message}`);
  }
  console.log('   ✅ OTP accepted! Reset token issued.');

  // 5. Reset Password endpoint
  console.log('5. Submitting new password via /api/auth/reset-password...');
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      resetToken: verifyData.resetToken,
      newPassword
    })
  });
  const resetData = await resetRes.json();
  if (!resetData.success) throw new Error(`Reset password failed: ${resetData.message}`);
  console.log('   ✅ Password reset confirmed.');

  // 6. Test Login with old password (MUST FAIL)
  console.log('6. Attempting login with OLD password (should fail)...');
  const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: initialPassword })
  });
  if (oldLoginRes.status === 200) {
    throw new Error('Old password was still accepted after reset!');
  }
  console.log('   ✅ Old password rejected.');

  // 7. Test Login with NEW password (MUST SUCCEED)
  console.log('7. Attempting login with NEW password (should succeed)...');
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword })
  });
  const newLoginData = await newLoginRes.json();
  if (!newLoginData.success || !newLoginData.data?.token) {
    throw new Error('Login with new password failed!');
  }
  console.log(`   ✅ Login with new password succeeded! (User: ${newLoginData.data.name}, Token acquired)`);

  await mongoose.disconnect();
  console.log('\n🎉 COMPLETE PASSWORD RESET FLOW 100% VERIFIED!\n');
}

runFullPasswordResetVerification().catch((err) => {
  console.error('❌ Error during verification:', err);
  process.exit(1);
});
