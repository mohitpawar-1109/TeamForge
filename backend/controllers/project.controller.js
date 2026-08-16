import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { calculateCandidateMatch } from '../services/match.service.js';

export const sanitizeSkillImportance = (skillImportance) => {
  const sanitizeKey = (k) => String(k).replace(/\./g, '․').replace(/^\$/, '＄');
  const map = new Map();
  if (!skillImportance) return map;

  if (skillImportance instanceof Map) {
    for (const [k, v] of skillImportance.entries()) {
      map.set(sanitizeKey(k), String(v));
    }
    return map;
  }

  if (typeof skillImportance === 'object' && !Array.isArray(skillImportance)) {
    for (const [k, v] of Object.entries(skillImportance)) {
      map.set(sanitizeKey(k), String(v));
    }
    return map;
  }

  return map;
};

export const createProject = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, duration, teamSize, requiredSkills, suggestedRoles, availabilityNeeded, aiAnalysis } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide project title and description' });
    }

    let processedAiAnalysis = { analyzed: false, skillImportance: new Map() };
    if (aiAnalysis) {
      const rawImportance = aiAnalysis.skillImportance;
      const skillImportanceMap = sanitizeSkillImportance(rawImportance);

      processedAiAnalysis = {
        ...aiAnalysis,
        analyzed: aiAnalysis.analyzed !== undefined ? aiAnalysis.analyzed : true,
        skillImportance: skillImportanceMap
      };
    }

    const project = await Project.create({
      title,
      description,
      category: category || 'Web Development',
      difficulty: difficulty || 'Medium',
      duration: duration || '4-6 Weeks',
      teamSize: teamSize || 4,
      requiredSkills: requiredSkills || [],
      suggestedRoles: suggestedRoles || [],
      availabilityNeeded: availabilityNeeded || ['Weekdays', 'Weekends'],
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Project Lead', joinedAt: new Date() }],
      aiAnalysis: processedAiAnalysis,
      status: 'Recruiting',
      progress: 0
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email headline avatar college')
      .populate('members.user', 'name email headline avatar skills college course');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { search, category, skill, difficulty, status, sort, owner, member } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (skill) {
      query.requiredSkills = { $in: [new RegExp(skill, 'i')] };
    }

    if (owner) {
      query.owner = owner;
    }

    if (member) {
      query['members.user'] = member;
    }

    let projectDocs = await Project.find(query)
      .populate('owner', 'name email headline avatar college')
      .populate('members.user', 'name email headline avatar skills')
      .sort({ createdAt: -1 });

    // If authenticated user, compute dynamic match percentage for each project!
    let results = projectDocs.map(doc => {
      const pObj = doc.toObject();
      if (req.user) {
        const match = calculateCandidateMatch(doc, req.user);
        pObj.userMatchScore = match.score;
      } else {
        pObj.userMatchScore = 75; // baseline preview
      }
      return pObj;
    });

    if (sort === 'best_match') {
      results.sort((a, b) => (b.userMatchScore || 0) - (a.userMatchScore || 0));
    } else if (sort === 'almost_full') {
      results.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
    } else if (sort === 'most_active') {
      results.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email headline avatar college bio course year')
      .populate('members.user', 'name email headline avatar skills college course availability experienceLevel weeklyHours');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const pObj = project.toObject();
    if (req.user) {
      const match = calculateCandidateMatch(project, req.user);
      pObj.userMatch = match;
    }

    res.json({ success: true, data: pObj });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can update settings' });
    }

    const updateData = { ...req.body };
    if (updateData.aiAnalysis && updateData.aiAnalysis.skillImportance !== undefined) {
      updateData.aiAnalysis.skillImportance = sanitizeSkillImportance(updateData.aiAnalysis.skillImportance);
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('owner', 'name email headline avatar')
      .populate('members.user', 'name email headline avatar skills');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });

    res.json({ success: true, message: 'Project and associated tasks removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const leaveTeam = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Project owner cannot leave the team. Transfer ownership or delete project.' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.user._id.toString());
    await project.save();

    res.json({ success: true, message: 'You have left the team successfully', data: project });
  } catch (error) {
    next(error);
  }
};
