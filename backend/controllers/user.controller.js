import User from '../models/User.js';

export const getUsers = async (req, res, next) => {
  try {
    const { search, skill, interest } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { headline: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    if (skill) {
      query['skills.name'] = { $regex: skill, $options: 'i' };
    }

    if (interest) {
      query.interests = { $in: [new RegExp(interest, 'i')] };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const allowedFields = ['name', 'headline', 'college', 'course', 'year', 'location', 'bio', 'avatar', 'skills', 'interests', 'availability', 'weeklyHours', 'experienceLevel', 'githubUrl', 'linkedinUrl', 'portfolioUrl'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};
