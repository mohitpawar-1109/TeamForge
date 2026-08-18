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

import { OAuth2Client } from 'google-auth-library';

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

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

