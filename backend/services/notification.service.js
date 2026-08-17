import Notification from '../models/Notification.js';
import { emitToUser } from '../socket/socket.js';

/**
 * TeamForge Real-time Notification Engine
 * Handles persistence, deduplication, and instant Socket.IO broadcasting
 */

export const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  link = '',
  metadata = {},
  relatedProject,
  relatedGroup,
  relatedTask,
  relatedPost,
  relatedTeamRequest,
  deduplicateWindowSeconds = 15
}) => {
  if (!recipient) return null;

  // Prevent sending notification to self
  if (sender && sender.toString() === recipient.toString()) {
    return null;
  }

  // Deduplication check: check if an identical notification was created recently
  if (deduplicateWindowSeconds > 0) {
    const cutoffTime = new Date(Date.now() - deduplicateWindowSeconds * 1000);
    const existing = await Notification.findOne({
      $or: [{ recipient }, { user: recipient }],
      type,
      ...(sender ? { sender } : {}),
      ...(relatedProject ? { relatedProject } : {}),
      ...(relatedGroup ? { relatedGroup } : {}),
      ...(relatedTask ? { relatedTask } : {}),
      ...(relatedPost ? { relatedPost } : {}),
      createdAt: { $gte: cutoffTime }
    });

    if (existing) {
      return existing;
    }
  }

  const notif = await Notification.create({
    recipient,
    user: recipient,
    sender: sender || null,
    type: type || 'general',
    title: title || '',
    message: message || '',
    link,
    metadata,
    relatedProject: relatedProject || null,
    relatedGroup: relatedGroup || null,
    relatedTask: relatedTask || null,
    relatedPost: relatedPost || null,
    relatedTeamRequest: relatedTeamRequest || null,
    read: false
  });

  const populated = await Notification.findById(notif._id)
    .populate('sender', 'name avatar headline college')
    .populate('relatedProject', 'title category')
    .populate('relatedGroup', 'name type')
    .populate('relatedTask', 'title priority status')
    .populate('relatedPost', 'title type');

  // Real-time socket broadcast to the target user channel
  try {
    emitToUser(recipient, 'new_notification', populated);

    // Compute updated unread count and emit
    const unreadCount = await Notification.countDocuments({
      $or: [{ recipient }, { user: recipient }],
      read: false
    });
    emitToUser(recipient, 'notification_unread_count', { unreadCount });
  } catch (err) {
    console.warn('[Notification Socket Emit Failed]:', err.message);
  }

  return populated;
};

// 1. Team / Project Invitation
export const notifyProjectInvitation = async ({ recipientId, senderId, project, role }) => {
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'project_invite',
    title: 'Project Invitation',
    message: `You were invited to join "${project.title}" as ${role || 'Team Member'}.`,
    link: `/projects/${project._id || project}`,
    relatedProject: project._id || project,
    metadata: { role }
  });
};

// 2. Group Invitation
export const notifyGroupInvitation = async ({ recipientId, senderId, group, role }) => {
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'group_invite',
    title: 'Squad Invitation',
    message: `You were invited to join the group "${group.name}".`,
    link: `/groups/${group._id || group}`,
    relatedGroup: group._id || group,
    metadata: { role }
  });
};

// 3. New Group Member
export const notifyNewGroupMember = async ({ recipientIds = [], newMember, group }) => {
  for (const rId of recipientIds) {
    if (rId.toString() === newMember._id?.toString()) continue;
    await createNotification({
      recipient: rId,
      sender: newMember._id,
      type: 'group_member_joined',
      title: 'New Squad Member',
      message: `${newMember.name} joined "${group.name}".`,
      link: `/groups/${group._id || group}`,
      relatedGroup: group._id || group
    });
  }
};

// 4. New Direct Message / Mention
export const notifyNewMessage = async ({ recipientId, sender, group, messageContent }) => {
  const snippet = messageContent?.length > 45 ? `${messageContent.substring(0, 42)}...` : messageContent;
  return createNotification({
    recipient: recipientId,
    sender: sender._id || sender,
    type: 'new_message',
    title: `Message from ${sender.name || 'Teammate'}`,
    message: snippet || 'Sent you a new message in chat.',
    link: `/groups/${group._id || group}`,
    relatedGroup: group._id || group,
    deduplicateWindowSeconds: 5
  });
};

// 5. Post Like
export const notifyPostLike = async ({ recipientId, liker, post }) => {
  return createNotification({
    recipient: recipientId,
    sender: liker._id || liker,
    type: 'post_like',
    title: 'New Like',
    message: `${liker.name || 'Someone'} liked your post "${post.title || 'Feed Post'}".`,
    link: `/feed`,
    relatedPost: post._id || post
  });
};

// 6. Post Comment
export const notifyPostComment = async ({ recipientId, commenter, post, commentText }) => {
  const snippet = commentText?.length > 40 ? `${commentText.substring(0, 37)}...` : commentText;
  return createNotification({
    recipient: recipientId,
    sender: commenter._id || commenter,
    type: 'post_comment',
    title: 'New Discussion Reply',
    message: `${commenter.name || 'A student'} commented: "${snippet}"`,
    link: `/feed`,
    relatedPost: post._id || post
  });
};

// 7. Task Assignment
export const notifyTaskAssignment = async ({ recipientId, assigner, task, project }) => {
  return createNotification({
    recipient: recipientId,
    sender: assigner?._id || assigner,
    type: 'task_assigned',
    title: 'Task Assigned',
    message: `You were assigned task "${task.title}" in "${project.title || 'Project'}".`,
    link: `/projects/${project._id || project}/tasks`,
    relatedProject: project._id || project,
    relatedTask: task._id || task
  });
};

// 8. Task Completion
export const notifyTaskCompletion = async ({ recipientIds = [], completer, task, project }) => {
  for (const rId of recipientIds) {
    if (completer && rId.toString() === (completer._id || completer).toString()) continue;
    await createNotification({
      recipient: rId,
      sender: completer?._id || completer,
      type: 'task_completed',
      title: 'Task Completed',
      message: `${completer?.name || 'Teammate'} completed "${task.title}" in "${project.title || 'Project'}".`,
      link: `/projects/${project._id || project}/tasks`,
      relatedProject: project._id || project,
      relatedTask: task._id || task
    });
  }
};

// 9. Team Updates
export const notifyTeamUpdate = async ({ recipientIds = [], updater, project, updateText }) => {
  for (const rId of recipientIds) {
    if (updater && rId.toString() === (updater._id || updater).toString()) continue;
    await createNotification({
      recipient: rId,
      sender: updater?._id || updater,
      type: 'team_update',
      title: 'Team Update',
      message: updateText || `Updates posted in "${project.title}".`,
      link: `/projects/${project._id || project}/team`,
      relatedProject: project._id || project
    });
  }
};

// 10. AI Recommendation
export const notifyAIRecommendation = async ({ recipientId, project, matchScore }) => {
  return createNotification({
    recipient: recipientId,
    type: 'ai_recommendation',
    title: '✨ AI Match Opportunity',
    message: `You have a ${matchScore}% compatibility match for "${project.title}". Check out the squad!`,
    link: `/projects/${project._id || project}`,
    relatedProject: project._id || project,
    metadata: { matchScore }
  });
};

// 11. Hackathon Deadline
export const notifyHackathonDeadline = async ({ recipientId, project, deadlineTitle, daysLeft }) => {
  return createNotification({
    recipient: recipientId,
    type: 'hackathon_deadline',
    title: '⏰ Upcoming Project Deadline',
    message: `Milestone "${deadlineTitle || 'Milestone'}" for "${project.title}" is due in ${daysLeft || 1} day(s)!`,
    link: `/projects/${project._id || project}/tasks`,
    relatedProject: project._id || project
  });
};
