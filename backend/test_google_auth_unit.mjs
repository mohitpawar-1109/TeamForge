import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const JWT_SECRET = 'teamforge_super_secret_jwt_key_2026_hackathon_demo';

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
}

async function runUnitTests() {
  console.log('🚀 [Unit Test Suite] Starting TeamForge Google Auth Unit Verification...\n');

  // Test 1: User Schema Validation for Local User (Requires Password)
  const localDoc = new User({
    name: 'Local Student',
    email: 'local@student.edu',
    authProvider: 'local'
  });
  const localValErr = localDoc.validateSync();
  if (!localValErr || !localValErr.errors.password) {
    throw new Error('Local user must require password');
  }
  console.log('✅ Test 1 Passed: Local user requires password as expected.');

  // Test 2: User Schema Validation for Google User (Passwordless)
  const googleDoc = new User({
    name: 'Google Student',
    email: 'google@student.edu',
    authProvider: 'google',
    googleId: 'google_1234567890',
    avatar: 'https://lh3.googleusercontent.com/a/test-avatar'
  });
  const googleValErr = googleDoc.validateSync();
  if (googleValErr) {
    throw new Error(`Google user validation failed: ${googleValErr.message}`);
  }
  console.log('✅ Test 2 Passed: Google user is valid without requiring local password.');

  // Test 3: Password Comparison Methods
  const salt = await bcrypt.genSalt(10);
  localDoc.password = await bcrypt.hash('SecurePass123!', salt);
  const isMatchValid = await localDoc.matchPassword('SecurePass123!');
  const isMatchInvalid = await localDoc.matchPassword('WrongPass');
  const isGoogleMatch = await googleDoc.matchPassword('AnyPass');

  if (!isMatchValid || isMatchInvalid || isGoogleMatch) {
    throw new Error('Password comparison method failed');
  }
  console.log('✅ Test 3 Passed: Password match checks work correctly for local and safely reject for passwordless Google users.');

  // Test 4: JWT Token Issuance & Payload Integrity
  const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const token = generateToken(testUserId);
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.id !== testUserId) {
    throw new Error('JWT token verification payload mismatch');
  }
  console.log('✅ Test 4 Passed: JWT issuance and verification 100% verified.');

  console.log('\n🎉 ALL GOOGLE AUTHENTICATION INTEGRITY TESTS PASSED! (100%)\n');
}

runUnitTests();
