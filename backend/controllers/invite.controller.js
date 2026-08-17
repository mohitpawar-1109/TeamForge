import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import { emitNotificationToUser } from '../socket/socket.js';
import { notifyProjectInvitation, notifyTeamUpdate } from '../services/notification.service.js';

export const createInvitation = async (req, res, next) => {
  try {
    const { receiverId, projectId, role, message } = req.body;

    if (!receiverId || !projectId) {
      return res.status(400).json({ success: false, message: 'Receiver and Project IDs are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if receiver is already in the project
    const isMember = project.members.some(m => m.user.toString() === receiverId);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'Student is already a member of this team' });
    }

    // Check if pending invitation already exists
    const existing = await Invitation.findOne({ receiver: receiverId, project: projectId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active invitation has already been sent to this student' });
    }

    const invitation = await Invitation.create({
      sender: req.user._id,
      receiver: receiverId,
      project: projectId,
      role: role || 'Team Member',
      message: message || `Hey! We loved your profile and would love to have you join "${project.title}".`,
      status: 'pending'
    });

    // Create a real-time notification for the receiver
    try {
      await notifyProjectInvitation({
        recipientId: receiverId,
        senderId: req.user._id,
        project,
        role: role || 'Team Member'
      });
    } catch (notifErr) {
      console.warn('Failed to create invite notification:', notifErr.message);
    }

    const populated = await Invitation.findById(invitation._id)
      .populate('sender', 'name email headline avatar')
      .populate('receiver', 'name email headline avatar')
      .populate('project', 'title category teamSize requiredSkills');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const getInvitations = async (req, res, next) => {
  try {
    const received = await Invitation.find({ receiver: req.user._id })
      .populate('sender', 'name email headline avatar college')
      .populate('project', 'title description category teamSize requiredSkills members')
      .sort({ createdAt: -1 });

    const sent = await Invitation.find({ sender: req.user._id })
      .populate('receiver', 'name email headline avatar college skills')
      .populate('project', 'title category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        received,
        sent
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvitationStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or declined' });
    }

    const invitation = await Invitation.findById(req.params.id)
      .populate('project')
      .populate('sender', 'name email');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this invitation' });
    }

    invitation.status = status;
    await invitation.save();

    if (status === 'accepted') {
      const project = await Project.findById(invitation.project._id);
      if (project) {
        const alreadyMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        if (!alreadyMember) {
          project.members.push({
            user: req.user._id,
            role: invitation.role || 'Contributor',
            joinedAt: new Date()
          });

          // Check if team is now full
          if (project.members.length >= project.teamSize) {
            project.status = 'In Progress';
          }
          await project.save();

          // Sync into project group
          try {
            await Group.updateOne(
              { project: project._id, 'members.user': { $ne: req.user._id } },
              { $push: { members: { user: req.user._id, role: 'member', joinedAt: new Date() } } }
            );
          } catch (gErr) {
            console.warn('Failed to sync group member on invite accept:', gErr.message);
          }
        }

        // Notify the project owner
        try {
          const notif = await Notification.create({
            recipient: project.owner,
            user: project.owner,
            sender: req.user._id,
            type: 'team_join',
            title: 'Invitation Accepted! 🎉',
            message: `${req.user.name} accepted your invitation to join "${project.title}"!`,
            relatedProject: project._id
          });
          emitNotificationToUser(project.owner, notif);
        } catch (notifErr) {
          console.warn('Failed to create invitation accept notification:', notifErr.message);
        }
      }
    }

    res.json({ success: true, message: `Invitation ${status}`, data: invitation });
  } catch (error) {
    next(error);
  }
};
