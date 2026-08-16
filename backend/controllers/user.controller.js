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

const categorizeSkill = (skillName) => {
  const s = (skillName || '').toLowerCase().trim();
  if (/react|vue|angular|frontend|tailwind|css|html|javascript|typescript|next|svelte|flutter|redux|web/i.test(s)) return 'Frontend';
  if (/node|express|django|flask|spring|backend|api|mongo|postgres|sql|database|golang|go|java|c\+\+|redis|graphql/i.test(s)) return 'Backend';
  if (/ai|ml|machine learning|deep learning|python|nlp|vision|tensorflow|pytorch|data|pandas|gemini|llm|scikit/i.test(s)) return 'AI/ML';
  if (/figma|ui|ux|design|adobe|wireframe|prototype|product design|canva/i.test(s)) return 'Design';
  if (/docker|kubernetes|aws|cloud|devops|ci\/cd|linux|git|gcp|azure|terraform/i.test(s)) return 'DevOps';
  return 'General';
};

export const getSkillNetwork = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const users = await User.find({})
      .select('name headline avatar college course skills interests experienceLevel pastProjectsCount')
      .limit(60)
      .lean();

    const skillMap = new Map();
    const userList = [];
    const links = [];

    users.forEach(u => {
      const userSkills = (u.skills || []).map(s => (typeof s === 'string' ? s : s?.name || '').trim()).filter(Boolean);
      
      const userNode = {
        id: `user_${u._id}`,
        dbId: u._id,
        type: 'user',
        name: u.name,
        headline: u.headline || 'Student Developer',
        avatar: u.avatar || '',
        college: u.college || 'Institute of Technology',
        course: u.course || 'Computer Science',
        experienceLevel: u.experienceLevel || 'Intermediate',
        skills: userSkills
      };
      userList.push(userNode);

      userSkills.forEach(sName => {
        const cat = categorizeSkill(sName);
        const skillKey = sName.toLowerCase();

        if (!skillMap.has(skillKey)) {
          skillMap.set(skillKey, {
            id: `skill_${skillKey.replace(/[^a-z0-9]/g, '_')}`,
            name: sName,
            type: 'skill',
            category: cat,
            userCount: 0,
            userIds: []
          });
        }

        const skillNode = skillMap.get(skillKey);
        skillNode.userCount += 1;
        skillNode.userIds.push(userNode.id);

        links.push({
          source: userNode.id,
          target: skillNode.id,
          type: 'user_skill'
        });
      });
    });

    let skillList = Array.from(skillMap.values()).sort((a, b) => b.userCount - a.userCount);

    // Apply optional category or search filters
    if (category && category !== 'All') {
      skillList = skillList.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      skillList = skillList.filter(s => s.name.toLowerCase().includes(q));
    }

    res.json({
      success: true,
      data: {
        skills: skillList,
        users: userList,
        links: links,
        totalSkills: skillList.length,
        totalUsers: userList.length
      }
    });
  } catch (error) {
    next(error);
  }
};
