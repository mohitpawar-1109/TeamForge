import Hackathon from '../models/Hackathon.js';
import User from '../models/User.js';
import {
  getFilteredHackathons,
  calculateHackathonSkillMatch,
  extractUserSkills,
  seedHackathonsIfEmpty
} from '../services/hackathon.service.js';

// @desc    Get all hackathons with optional filters, search, and personal skill matching
// @route   GET /api/hackathons
// @access  Public / Private (Attaches personalized match score if authenticated)
export const getHackathons = async (req, res, next) => {
  try {
    const {
      search,
      mode,
      technology,
      difficulty,
      theme,
      savedOnly,
      interestedOnly
    } = req.query;

    const userId = req.user?._id || null;

    const hackathons = await getFilteredHackathons({
      search,
      mode,
      technology,
      difficulty,
      theme,
      savedOnly: savedOnly === 'true',
      interestedOnly: interestedOnly === 'true',
      userId
    });

    res.json({
      success: true,
      count: hackathons.length,
      data: hackathons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hackathon details with skill gap analysis & potential team members
// @route   GET /api/hackathons/:id
// @access  Public / Private
export const getHackathonById = async (req, res, next) => {
  try {
    await seedHackathonsIfEmpty();
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('interestedUsers', 'name avatar headline college skills');

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    const userId = req.user?._id || null;
    let userSkills = [];

    if (userId) {
      const userDoc = await User.findById(userId).select('skills');
      if (userDoc) {
        userSkills = extractUserSkills(userDoc);
      }
    }

    const matchAnalysis = calculateHackathonSkillMatch(hackathon.requiredSkills, userSkills);

    const userIdStr = userId ? userId.toString() : '';
    const isSaved = (hackathon.savedBy || []).some((id) => id.toString() === userIdStr);
    const isInterested = (hackathon.interestedUsers || []).some((u) => (u._id || u).toString() === userIdStr);

    const now = new Date();
    const deadlineDate = new Date(hackathon.deadline);
    const diffDays = Math.max(0, Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)));

    // Recommend candidates who fill the missing skills for this hackathon
    let recommendedTeammates = [];
    if (matchAnalysis.missingSkills.length > 0) {
      const candidateUsers = await User.find({
        _id: { $ne: userId }
      }).select('name avatar headline college skills experienceLevel').limit(15);

      recommendedTeammates = candidateUsers.filter((cand) => {
        const cSkills = extractUserSkills(cand);
        return matchAnalysis.missingSkills.some((miss) =>
          cSkills.some((cs) => cs.includes(miss.toLowerCase()) || miss.toLowerCase().includes(cs))
        );
      }).slice(0, 4);
    }

    res.json({
      success: true,
      data: {
        _id: hackathon._id,
        title: hackathon.title,
        tagline: hackathon.tagline,
        description: hackathon.description,
        bannerImage: hackathon.bannerImage,
        organizer: hackathon.organizer,
        mode: hackathon.mode,
        location: hackathon.location,
        difficulty: hackathon.difficulty,
        teamSize: hackathon.teamSize,
        requiredSkills: hackathon.requiredSkills,
        themes: hackathon.themes,
        prizePool: hackathon.prizePool,
        prizes: hackathon.prizes,
        startDate: hackathon.startDate,
        deadline: hackathon.deadline,
        daysLeft: diffDays,
        websiteUrl: hackathon.websiteUrl,
        rules: hackathon.rules,
        featured: hackathon.featured,
        savedCount: (hackathon.savedBy || []).length,
        interestedCount: (hackathon.interestedUsers || []).length,
        interestedUsers: hackathon.interestedUsers || [],
        isSaved,
        isInterested,
        skillMatch: matchAnalysis,
        recommendedTeammates
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Save / Bookmark Hackathon
// @route   POST /api/hackathons/:id/save
// @access  Private
export const toggleSaveHackathon = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    const index = hackathon.savedBy.indexOf(userId);
    let saved = false;

    if (index === -1) {
      hackathon.savedBy.push(userId);
      saved = true;
    } else {
      hackathon.savedBy.splice(index, 1);
      saved = false;
    }

    await hackathon.save();

    res.json({
      success: true,
      saved,
      savedCount: hackathon.savedBy.length,
      message: saved ? 'Hackathon bookmarked' : 'Hackathon removed from saved'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Expressed Interest in Hackathon
// @route   POST /api/hackathons/:id/interested
// @access  Private
export const toggleInterestHackathon = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    const index = hackathon.interestedUsers.indexOf(userId);
    let interested = false;

    if (index === -1) {
      hackathon.interestedUsers.push(userId);
      interested = true;
    } else {
      hackathon.interestedUsers.splice(index, 1);
      interested = false;
    }

    await hackathon.save();

    res.json({
      success: true,
      interested,
      interestedCount: hackathon.interestedUsers.length,
      message: interested ? 'Expressed interest in hackathon' : 'Removed interest'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Ingest a new hackathon
// @route   POST /api/hackathons
// @access  Private
export const createHackathon = async (req, res, next) => {
  try {
    const {
      title,
      tagline,
      description,
      bannerImage,
      organizer,
      mode,
      location,
      difficulty,
      teamSize,
      requiredSkills,
      themes,
      prizePool,
      prizes,
      startDate,
      deadline,
      websiteUrl,
      rules
    } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, description, and deadline are required.' });
    }

    const hackathon = await Hackathon.create({
      title,
      tagline: tagline || '',
      description,
      bannerImage: bannerImage || '',
      organizer: organizer || { name: 'TechForge League' },
      mode: mode || 'Online',
      location: location || 'Virtual',
      difficulty: difficulty || 'All Levels',
      teamSize: teamSize || { min: 1, max: 4 },
      requiredSkills: requiredSkills || [],
      themes: themes || ['Hackathon'],
      prizePool: prizePool || '$5,000',
      prizes: prizes || [],
      startDate: startDate || new Date(),
      deadline: new Date(deadline),
      websiteUrl: websiteUrl || '',
      rules: rules || []
    });

    res.status(201).json({
      success: true,
      data: hackathon
    });
  } catch (error) {
    next(error);
  }
};
