import mongoose from 'mongoose';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import { emitToRoom, emitToUser } from '../socket/socket.js';

// Helper to format/populate a group
const populateGroupQuery = (query) => {
  return query
    .populate('createdBy', 'name email avatar headline college')
    .populate('members.user', 'name email avatar headline college skills course year')
    .populate('project', 'title description category status progress teamSize')
    .populate('lastMessage.sender', 'name avatar');
};

// @desc    Create a new group (Public Community, Private Group, Project Team, DM)
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const {
      name,
      description = '',
      type = 'public',
      avatar = '',
      category = 'General',
      tags = [],
      project = null,
      initialMembers = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const validTypes = ['public', 'private', 'project', 'dm'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid group type. Must be one of: ${validTypes.join(', ')}` });
    }

    let projectRef = null;
    let creatorRole = type === 'project' ? 'lead' : 'admin';

    if (project && mongoose.Types.ObjectId.isValid(project)) {
      const projDoc = await Project.findById(project);
      if (projDoc) {
        projectRef = projDoc._id;
      }
    }

    // Build members list with creator as admin/lead
    const memberMap = new Map();
    memberMap.set(req.user._id.toString(), {
      user: req.user._id,
      role: creatorRole,
      joinedAt: new Date()
    });

    // Add any initial valid members
    if (Array.isArray(initialMembers)) {
      for (const m of initialMembers) {
        const uId = typeof m === 'object' ? m.user || m._id || m.userId : m;
        if (uId && mongoose.Types.ObjectId.isValid(uId) && !memberMap.has(uId.toString())) {
          memberMap.set(uId.toString(), {
            user: uId,
            role: typeof m === 'object' && m.role ? m.role : 'member',
            joinedAt: new Date()
          });
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      description: description.trim(),
      type,
      avatar,
      category,
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
      project: projectRef,
      createdBy: req.user._id,
      members: Array.from(memberMap.values())
    });

    const populated = await populateGroupQuery(Group.findById(group._id));

    // Notify any other added members
    for (const m of populated.members) {
      if (m.user && m.user._id.toString() !== req.user._id.toString()) {
        emitToUser(m.user._id, 'group_joined', {
          group: populated,
          addedBy: req.user.name
        });
      }
    }

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accessible groups for user (or discover public groups)
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req, res, next) => {
  try {
    const { type, search, category, scope } = req.query;
    const userId = req.user._id;

    let query = {};

    if (scope === 'discover') {
      // Discovery mode: public groups user is NOT yet a member of + public groups in general
      query.type = 'public';
      if (req.query.notMember === 'true') {
        query['members.user'] = { $ne: userId };
      }
    } else if (scope === 'my_groups') {
      // Only groups where user is an active member
      query['members.user'] = userId;
    } else {
      // Default: user's groups OR public groups
      query.$or = [
        { 'members.user': userId },
        { type: 'public' }
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      });
    }

    const groups = await populateGroupQuery(Group.find(query).sort({ 'lastMessage.createdAt': -1, createdAt: -1 }));

    res.json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group by ID
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = async (req, res, next) => {
  try {
    const group = await populateGroupQuery(Group.findById(req.params.id));

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.user && m.user._id.toString() === req.user._id.toString());
    if (group.type === 'private' && !isMember) {
      return res.status(403).json({ success: false, message: 'This group is private. You must be invited or added by an admin.' });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group settings
// @route   PUT /api/groups/:id
// @access  Private (Admin / Lead / Creator)
export const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isAdmin = member && (member.role === 'admin' || member.role === 'lead');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or leads can update group settings.' });
    }

    const { name, description, avatar, category, tags, type } = req.body;

    if (name && name.trim()) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;
    if (category !== undefined) group.category = category;
    if (Array.isArray(tags)) group.tags = tags.map(t => String(t).trim()).filter(Boolean);
    if (type && ['public', 'private'].includes(type) && group.type !== 'project' && group.type !== 'dm') {
      group.type = type;
    }

    await group.save();

    const updated = await populateGroupQuery(Group.findById(group._id));

    emitToRoom(`group:${group._id}`, 'group_updated', updated);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private (Admin / Creator)
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isAdmin = member && (member.role === 'admin' || member.role === 'lead');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group creator or admin can delete this group.' });
    }

    const groupId = group._id.toString();

    // Delete group and associated messages
    await Group.findByIdAndDelete(groupId);
    await Message.deleteMany({
      $or: [
        { group: groupId },
        { roomId: `group:${groupId}` }
      ]
    });

    emitToRoom(`group:${groupId}`, 'group_deleted', { groupId });

    res.json({
      success: true,
      message: 'Group and message history removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a public group
// @route   POST /api/groups/:id/join
// @access  Private
export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.type === 'private') {
      return res.status(403).json({ success: false, message: 'Cannot directly join a private group. Please request an invite.' });
    }

    const alreadyMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      group.members.push({
        user: req.user._id,
        role: 'member',
        joinedAt: new Date()
      });
      await group.save();
    }

    const populated = await populateGroupQuery(Group.findById(group._id));

    emitToRoom(`group:${group._id}`, 'member_joined', {
      groupId: group._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
        headline: req.user.headline
      },
      role: 'member'
    });

    res.json({
      success: true,
      message: 'Successfully joined group',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIndex = group.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, message: 'You are not a member of this group.' });
    }

    const leavingMember = group.members[memberIndex];
    group.members.splice(memberIndex, 1);

    // If leaving member was admin/lead and no other admins exist, promote next member if available
    const hasAdmin = group.members.some(m => m.role === 'admin' || m.role === 'lead');
    if (!hasAdmin && group.members.length > 0) {
      group.members[0].role = 'admin';
    }

    await group.save();

    emitToRoom(`group:${group._id}`, 'member_left', {
      groupId: group._id,
      userId: req.user._id.toString(),
      name: req.user.name
    });

    res.json({
      success: true,
      message: 'You have left the group.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite / Add members to a group
// @route   POST /api/groups/:id/invite
// @access  Private
export const inviteMembers = async (req, res, next) => {
  try {
    const { userIds = [], emails = [], role = 'member' } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const currentMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isAdmin = currentMember && (currentMember.role === 'admin' || currentMember.role === 'lead');

    if (group.type === 'private' && !isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can invite members to a private group.' });
    }

    const targetUserIds = new Set(userIds.filter(id => mongoose.Types.ObjectId.isValid(id)));

    // Look up any provided emails
    if (Array.isArray(emails) && emails.length > 0) {
      const emailUsers = await User.find({ email: { $in: emails.map(e => String(e).toLowerCase().trim()) } });
      emailUsers.forEach(u => targetUserIds.add(u._id.toString()));
    }

    let addedCount = 0;
    for (const targetId of targetUserIds) {
      const alreadyIn = group.members.some(m => m.user.toString() === targetId.toString());
      if (!alreadyIn) {
        group.members.push({
          user: targetId,
          role: role || 'member',
          joinedAt: new Date()
        });
        addedCount++;
      }
    }

    await group.save();

    const populated = await populateGroupQuery(Group.findById(group._id));

    // Notify newly added members
    targetUserIds.forEach(targetId => {
      emitToUser(targetId, 'group_joined', {
        group: populated,
        addedBy: req.user.name
      });
    });

    emitToRoom(`group:${group._id}`, 'group_updated', populated);

    res.json({
      success: true,
      message: `Added ${addedCount} member(s) to group.`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (Admin / Lead / Creator)
export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const currentMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isAdmin = currentMember && (currentMember.role === 'admin' || currentMember.role === 'lead');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or leads can remove members.' });
    }

    group.members = group.members.filter(m => m.user.toString() !== userId.toString());
    await group.save();

    const populated = await populateGroupQuery(Group.findById(group._id));

    emitToUser(userId, 'group_removed', { groupId: group._id, groupName: group.name });
    emitToRoom(`group:${group._id}`, 'member_removed', { groupId: group._id, userId });

    res.json({
      success: true,
      message: 'Member removed from group.',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member's role (admin, lead, member)
// @route   PATCH /api/groups/:id/members/:userId/role
// @access  Private (Admin / Creator)
export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'lead', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, lead, or member.' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const currentMember = group.members.find(m => m.user.toString() === req.user._id.toString());
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isAdmin = currentMember && (currentMember.role === 'admin' || currentMember.role === 'lead');

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or creator can modify roles.' });
    }

    const targetMember = group.members.find(m => m.user.toString() === userId.toString());
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Target user is not in this group.' });
    }

    targetMember.role = role;
    await group.save();

    const populated = await populateGroupQuery(Group.findById(group._id));

    emitToRoom(`group:${group._id}`, 'member_role_updated', {
      groupId: group._id,
      userId,
      role
    });

    res.json({
      success: true,
      message: `Member role updated to ${role}`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create Direct Message conversation between two users
// @route   POST /api/groups/dm
// @access  Private
export const getOrCreateDM = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: 'Valid recipient ID is required.' });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create a DM with yourself.' });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    // Find existing DM group with both members
    let dmGroup = await Group.findOne({
      type: 'dm',
      'members.user': { $all: [req.user._id, recipientId] },
      $expr: { $eq: [{ $size: '$members' }, 2] }
    });

    if (!dmGroup) {
      dmGroup = await Group.create({
        name: `${req.user.name} & ${recipientUser.name}`,
        type: 'dm',
        createdBy: req.user._id,
        members: [
          { user: req.user._id, role: 'member', joinedAt: new Date() },
          { user: recipientId, role: 'member', joinedAt: new Date() }
        ]
      });
    }

    const populated = await populateGroupQuery(Group.findById(dmGroup._id));

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or auto-create project team group
// @route   GET /api/groups/project/:projectId
// @access  Private
export const getProjectGroup = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid project ID required.' });
    }

    const project = await Project.findById(projectId).populate('members.user', 'name avatar email');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    let group = await Group.findOne({ project: projectId, type: 'project' });

    if (!group) {
      // Map project members
      const members = (project.members || []).map(m => ({
        user: m.user?._id || m.user,
        role: (m.user?._id || m.user)?.toString() === project.owner.toString() ? 'lead' : 'member',
        joinedAt: m.joinedAt || new Date()
      }));

      // Ensure owner is in members
      if (!members.some(m => m.user?.toString() === project.owner.toString())) {
        members.push({
          user: project.owner,
          role: 'lead',
          joinedAt: new Date()
        });
      }

      group = await Group.create({
        name: `${project.title} (Team)`,
        description: project.description || `Official team chat for project: ${project.title}`,
        type: 'project',
        project: project._id,
        category: project.category || 'Web Development',
        tags: project.requiredSkills || [],
        createdBy: project.owner,
        members
      });
    } else {
      // Sync members with project members
      const existingUserIds = new Set(group.members.map(m => m.user.toString()));
      let updated = false;

      (project.members || []).forEach(m => {
        const uId = (m.user?._id || m.user)?.toString();
        if (uId && !existingUserIds.has(uId)) {
          group.members.push({
            user: uId,
            role: uId === project.owner.toString() ? 'lead' : 'member',
            joinedAt: new Date()
          });
          existingUserIds.add(uId);
          updated = true;
        }
      });

      if (updated) {
        await group.save();
      }
    }

    const populated = await populateGroupQuery(Group.findById(group._id));

    res.json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};
