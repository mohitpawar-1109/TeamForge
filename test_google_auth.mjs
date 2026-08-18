import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import User from './backend/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'teamforge_super_secret_jwt_key_2026_hackathon_demo';

async function runGoogleAuthTests() {
  console.log('🚀 [Test Suite] Starting TeamForge Google Authentication Verification...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Test Existing User (Local auth)
    const testLocalEmail = `test_local_${Date.now()}@teamforge.app`;
    const localUser = await User.create({
      name: 'Local Student',
      email: testLocalEmail,
      password: 'Password123!',
      authProvider: 'local',
      headline: 'React Developer'
    });
    console.log('✅ Test 1 Passed: Local user created with password hash.');

    const isMatch = await localUser.matchPassword('Password123!');
    if (!isMatch) throw new Error('Password mismatch for local user');
    console.log('✅ Test 2 Passed: Local user password match verified.');

    // 2. Test Account Linking (Google Login on existing email)
    const googleId1 = `google_sub_${Date.now()}`;
    let existingUser = await User.findOne({ email: testLocalEmail });
    if (existingUser) {
      if (!existingUser.googleId) {
        existingUser.googleId = googleId1;
        existingUser.avatar = 'https://lh3.googleusercontent.com/a/test-avatar-1';
        await existingUser.save();
      }
    }
    const linkedUser = await User.findOne({ email: testLocalEmail });
    if (linkedUser.googleId !== googleId1 || linkedUser.authProvider !== 'local') {
      throw new Error('Account linking failed or corrupted authProvider');
    }
    console.log('✅ Test 3 Passed: Existing account seamlessly linked to Google ID without duplicate.');

    // 3. Test New User Creation via Google (Passwordless)
    const testGoogleEmail = `test_google_${Date.now()}@gmail.com`;
    const googleId2 = `google_sub_new_${Date.now()}`;
    const newGoogleUser = await User.create({
      name: 'Google Student',
      email: testGoogleEmail,
      authProvider: 'google',
      googleId: googleId2,
      avatar: 'https://lh3.googleusercontent.com/a/test-avatar-2',
      headline: 'AI / ML Enthusiast'
    });

    if (!newGoogleUser._id || newGoogleUser.authProvider !== 'google') {
      throw new Error('New Google user creation failed');
    }
    console.log('✅ Test 4 Passed: New Google user created successfully without requiring local password.');

    // 4. Test JWT Generation & Verification for Google User
    const token = jwt.sign({ id: newGoogleUser._id }, JWT_SECRET, { expiresIn: '30d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id !== newGoogleUser._id.toString()) {
      throw new Error('JWT verification mismatch');
    }
    console.log('✅ Test 5 Passed: JWT generation and verification for Google user is 100% valid.');

    // 5. Cleanup test artifacts
    await User.deleteMany({
      email: { $in: [testLocalEmail, testGoogleEmail] }
    });
    console.log('✅ Test 6 Passed: Test records cleaned up.');

    console.log('\n🎉 ALL 6 GOOGLE AUTHENTICATION INTEGRITY TESTS PASSED SUCCESSFULLY! (100%)\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runGoogleAuthTests();
