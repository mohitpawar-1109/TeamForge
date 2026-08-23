import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'teamforge_super_secret_jwt_key_2026_hackathon_demo', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, college, course, year, bio, headline, skills, interests, availability, weeklyHours } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Process skills if sent as strings or objects
    let formattedSkills = [];
    if (Array.isArray(skills)) {
      formattedSkills = skills.map(s => typeof s === 'string' ? { name: s, proficiency: 'Intermediate' } : s);
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      college: college || 'Institute of Technology',
      course: course || 'Computer Science',
      year: year || '3rd Year',
      bio: bio || 'Passionate student developer eager to collaborate on ambitious projects.',
      headline: headline || 'Student Developer',
      skills: formattedSkills,
      interests: interests || ['Web Development', 'AI / ML'],
      availability: availability || ['Weekdays', 'Weekends'],
      weeklyHours: weeklyHours || 15
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        college: user.college,
        course: user.course,
        year: user.year,
        avatar: user.avatar,
        skills: user.skills,
        interests: user.interests,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Safe diagnostic logs
    console.log(`[Auth Login] Searching normalized email: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    console.log(`[Auth Login] User found: ${user ? 'true' : 'false'}`);

    let isPasswordMatch = false;
    if (user) {
      isPasswordMatch = await user.matchPassword(password);
    }
    console.log(`[Auth Login] Password match: ${isPasswordMatch ? 'true' : 'false'}`);

    if (user && isPasswordMatch) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          headline: user.headline,
          college: user.college,
          course: user.course,
          year: user.year,
          bio: user.bio,
          avatar: user.avatar,
          skills: user.skills,
          interests: user.interests,
          availability: user.availability,
          weeklyHours: user.weeklyHours,
          experienceLevel: user.experienceLevel,
          pastProjectsCount: user.pastProjectsCount,
          teamsJoinedCount: user.teamsJoinedCount,
          contributionsCount: user.contributionsCount,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import PasswordReset from '../models/PasswordReset.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID Token securely
const verifyGoogleCredential = async (token) => {
  if (!token) throw new Error('No Google token provided');

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || undefined
    });
    return ticket.getPayload();
  } catch (primaryErr) {
    // Secondary fallback to Google tokeninfo endpoint
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (response.ok) {
        const data = await response.json();
        return {
          sub: data.sub,
          email: data.email,
          name: data.name,
          picture: data.picture,
          email_verified: data.email_verified === 'true' || data.email_verified === true
        };
      }
    } catch (fallbackErr) {
      console.error('Google fallback verification failed:', fallbackErr.message);
    }
    throw primaryErr;
  }
};

// @desc    Authenticate with Google OAuth ID Token
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, idToken, token } = req.body;
    const rawToken = credential || idToken || token;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication credential is required.'
      });
    }

    // Verify token with Google
    let payload;
    try {
      payload = await verifyGoogleCredential(rawToken);
    } catch (verifyError) {
      console.error('[Google Auth Error] Token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google identity token. Please try again.'
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to retrieve email from Google profile.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists by email or googleId
    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId }]
    });

    if (user) {
      // If user exists without googleId, link the account
      let isUpdated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        isUpdated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        isUpdated = true;
      }
      if (isUpdated) {
        await user.save();
      }
    } else {
      // 2. Create new user for first-time Google sign-in
      user = await User.create({
        name: name?.trim() || 'Student Developer',
        email: normalizedEmail,
        authProvider: 'google',
        googleId,
        avatar: picture || '',
        headline: 'Student Developer',
        college: 'Institute of Technology',
        course: 'Computer Science',
        year: '3rd Year',
        bio: 'Passionate student developer eager to collaborate on ambitious projects.',
        skills: [{ name: 'Full Stack', proficiency: 'Intermediate' }],
        interests: ['Web Development', 'AI / ML'],
        availability: ['Weekdays', 'Weekends'],
        weeklyHours: 15
      });
    }

    // Return authenticated user and standard JWT token
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        college: user.college,
        course: user.course,
        year: user.year,
        bio: user.bio,
        avatar: user.avatar,
        skills: user.skills,
        interests: user.interests,
        availability: user.availability,
        weeklyHours: user.weeklyHours,
        experienceLevel: user.experienceLevel,
        pastProjectsCount: user.pastProjectsCount,
        teamsJoinedCount: user.teamsJoinedCount,
        contributionsCount: user.contributionsCount,
        authProvider: user.authProvider,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('[Google Auth Controller Error]:', error);
    next(error);
  }
};

// @desc    Temporary Diagnostic Endpoint to test email delivery independently
// @route   POST /api/auth/test-email
// @access  Public (Diagnostic)
export const testEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for test dispatch.' });
    }

    const { sendTestEmail, maskEmail } = await import('../services/email.service.js');
    console.log('\n[TEST EMAIL] Request received for:', maskEmail(email));

    const result = await sendTestEmail(email);

    res.json({
      success: true,
      message: 'Test email successfully dispatched to SMTP provider.',
      transporterType: result.transporterType,
      messageId: result.info.messageId,
      accepted: result.info.accepted,
      rejected: result.info.rejected,
      response: result.info.response
    });
  } catch (error) {
    console.error('[TEST EMAIL FAILED]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch test email.',
      error: {
        code: error.code,
        message: error.message,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response
      }
    });
  }
};

// @desc    Initiate Forgot Password Flow (Generates Hashed OTP & Dispatches Email)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    console.log('\n[FORGOT PASSWORD]');
    console.log('Request received');

    if (!email) {
      console.log('[FORGOT PASSWORD] Rejected: No email provided.');
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const { maskEmail } = await import('../services/email.service.js');
    const normalizedEmail = email.trim().toLowerCase();

    console.log('[FORGOT PASSWORD]');
    console.log(`Email received: ${maskEmail(normalizedEmail)}`);

    const user = await User.findOne({ email: normalizedEmail });
    console.log('[FORGOT PASSWORD]');
    console.log(`User found: ${!!user}`);

    // Handle Google-only account without a local password
    if (user && user.authProvider === 'google' && !user.password) {
      console.log('[FORGOT PASSWORD] Google-only account detected.');
      return res.status(400).json({
        success: false,
        isGoogleUser: true,
        message: 'This account was created with Google Sign-In. Please continue with Google.'
      });
    }

    if (user) {
      // Rate limiting / cooldown check: prevent spamming resend within 60 seconds
      const recentOtp = await PasswordReset.findOne({
        email: normalizedEmail,
        createdAt: { $gt: new Date(Date.now() - 60000) }
      });

      if (recentOtp) {
        console.log('[FORGOT PASSWORD] Rate limit active: OTP requested within last 60 seconds.');
        return res.json({
          success: true,
          message: 'A verification code was recently sent. Please check your inbox or wait 60 seconds before requesting again.'
        });
      }

      // Generate cryptographically secure 6-digit OTP
      const rawOtp = crypto.randomInt(100000, 1000000).toString();
      console.log('[FORGOT PASSWORD]');
      console.log('OTP generated: true');

      // Hash the OTP with SHA-256 for secure database storage
      const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Clean up previous unverified OTPs for this email
      await PasswordReset.deleteMany({ email: normalizedEmail, verified: false });

      // Save hashed OTP record in MongoDB
      await PasswordReset.create({
        email: normalizedEmail,
        otpHash,
        expiresAt,
        attempts: 0,
        verified: false
      });
      console.log('[FORGOT PASSWORD]');
      console.log('OTP saved: true');

      // Dispatch OTP email through configured email service
      console.log('[FORGOT PASSWORD]');
      console.log('Attempting email send...');

      const emailResult = await sendPasswordResetEmail(normalizedEmail, user.name, rawOtp);

      if (!emailResult.success) {
        console.log('[FORGOT PASSWORD]');
        console.log('Email send result: FAILED');
        return res.status(500).json({
          success: false,
          message: 'Unable to send OTP email.'
        });
      }

      console.log('[FORGOT PASSWORD]');
      console.log('Email send result: SUCCESS');
    } else {
      console.log('[FORGOT PASSWORD] Account does not exist. Returning generic security response.');
    }

    // Generic response prevents account enumeration security vulnerabilities
    res.json({
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.'
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Internal Error:', error);
    next(error);
  }
};

// @desc    Verify 6-Digit Password Reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    console.log('\n[VERIFY OTP] Request received');
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and the 6-digit OTP.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    console.log(`[VERIFY OTP] Email: ${normalizedEmail}`);

    const resetRecord = await PasswordReset.findOne({
      email: normalizedEmail,
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      console.log('[VERIFY OTP] Rejected: No active, unexpired OTP record found for this email.');
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired or is invalid. Please request a new one.'
      });
    }

    // Max 5 attempts rate limiting
    if (resetRecord.attempts >= 5) {
      console.log('[VERIFY OTP] Rejected: Maximum attempt limit (5) exceeded. Invalidating record.');
      await PasswordReset.deleteMany({ email: normalizedEmail });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. For your security, this code has been invalidated. Please request a new one.'
      });
    }

    // Compare entered OTP hash with stored hash
    const enteredHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    if (enteredHash !== resetRecord.otpHash) {
      resetRecord.attempts += 1;
      await resetRecord.save();
      const remaining = 5 - resetRecord.attempts;
      console.log(`[VERIFY OTP] Hash mismatch. Attempt ${resetRecord.attempts} of 5. Remaining: ${remaining}`);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
      });
    }

    // Mark as verified & issue single-use secure resetToken
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    resetRecord.verified = true;
    resetRecord.resetTokenHash = resetTokenHash;
    await resetRecord.save();

    console.log('[VERIFY OTP] ✅ OTP verification successful. Reset token issued.');
    res.json({
      success: true,
      resetToken: rawResetToken,
      message: 'Email verified successfully. You may now reset your password.'
    });
  } catch (error) {
    console.error('[VERIFY OTP] Error:', error);
    next(error);
  }
};

// @desc    Reset Password using Verified Token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    console.log('\n[RESET PASSWORD] Request received');
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find valid verified reset record
    const validResetRecord = await PasswordReset.findOne({
      email: normalizedEmail,
      resetTokenHash: tokenHash,
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!validResetRecord) {
      console.log('[RESET PASSWORD] Rejected: Invalid or expired reset token session.');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please request a new verification code.'
      });
    }

    // Find and update user password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.password = newPassword;
    await user.save(); // Triggers Mongoose pre('save') bcrypt hashing

    // Clean up all password reset records for this email
    await PasswordReset.deleteMany({ email: normalizedEmail });
    console.log(`[RESET PASSWORD] ✅ Password successfully updated for ${normalizedEmail}. Reset sessions cleared.`);

    res.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('[RESET PASSWORD] Error:', error);
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};


