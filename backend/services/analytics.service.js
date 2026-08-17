import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Service to compute Team Performance Analytics from real database records.
 * Ensures zero fabrication: strictly uses stored projects, tasks, messages, and timestamps.
 */
export const computeTeamAnalytics = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email headline avatar skills')
    .populate('members.user', 'name email headline avatar skills');

  if (!project) {
    throw new Error('Project not found');
  }

  // 1. Fetch all tasks for this project
  const tasks = await Task.find({ project: projectId }).populate('assignedTo', 'name email avatar');

  // 2. Fetch all messages in project team chat room
  const projectRoomIds = [
    projectId.toString(),
    `project-${projectId}`,
    `project:${projectId}`
  ];
  const messages = await Message.find({
    $or: [
      { roomId: { $in: projectRoomIds } },
      { project: projectId }
    ]
  }).populate('sender', 'name email avatar');

  // 3. Task Progress & Status Distribution
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN PROGRESS').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;

  const calculatedProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : project.progress || 0;

  // Task Priority Distribution
  const priorityBreakdown = {
    Urgent: tasks.filter((t) => t.priority === 'Urgent').length,
    High: tasks.filter((t) => t.priority === 'High').length,
    Medium: tasks.filter((t) => t.priority === 'Medium').length,
    Low: tasks.filter((t) => t.priority === 'Low').length
  };

  // Due Date Status
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
  ).length;

  // 4. Assemble Team Roster (Owner + Members)
  const allTeamMembers = [];
  if (project.owner) {
    allTeamMembers.push({
      _id: project.owner._id,
      name: project.owner.name,
      email: project.owner.email,
      avatar: project.owner.avatar,
      headline: project.owner.headline || 'Project Lead',
      role: 'Project Lead',
      joinedAt: project.createdAt
    });
  }

  if (Array.isArray(project.members)) {
    project.members.forEach((m) => {
      if (m.user && m.user._id.toString() !== project.owner?._id.toString()) {
        allTeamMembers.push({
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          headline: m.user.headline || 'Contributor',
          role: m.role || 'Team Member',
          joinedAt: m.joinedAt || project.createdAt
        });
      }
    });
  }

  // 5. Compute Per-Member Performance
  const memberPerformance = allTeamMembers.map((member) => {
    const memberIdStr = member._id.toString();

    // Member assigned tasks
    const memberTasks = tasks.filter(
      (t) => t.assignedTo && (t.assignedTo._id || t.assignedTo).toString() === memberIdStr
    );
    const assignedCount = memberTasks.length;
    const completedCount = memberTasks.filter((t) => t.status === 'DONE').length;
    const inProgressCount = memberTasks.filter((t) => t.status === 'IN PROGRESS').length;
    const todoCount = memberTasks.filter((t) => t.status === 'TODO').length;

    // Member chat messages
    const messageCount = messages.filter(
      (msg) => msg.sender && (msg.sender._id || msg.sender).toString() === memberIdStr
    ).length;

    const completionRate =
      assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 100;

    // Contribution weight (tasks done * 3 + in progress * 1 + messages * 0.5)
    const rawContributionScore =
      completedCount * 10 + inProgressCount * 3 + messageCount * 1;

    return {
      memberId: member._id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role,
      headline: member.headline,
      joinedAt: member.joinedAt,
      assignedCount,
      completedCount,
      inProgressCount,
      todoCount,
      completionRate,
      messageCount,
      rawContributionScore
    };
  });

  // Calculate percentage share of total contribution
  const totalScoreSum = memberPerformance.reduce(
    (acc, m) => acc + m.rawContributionScore,
    0
  );
  memberPerformance.forEach((m) => {
    m.contributionShare =
      totalScoreSum > 0
        ? Math.round((m.rawContributionScore / totalScoreSum) * 100)
        : Math.round(100 / (memberPerformance.length || 1));
  });

  // 6. Communication Activity Analysis
  const totalMessages = messages.length;
  const messageDates = {};
  messages.forEach((msg) => {
    const d = new Date(msg.createdAt).toISOString().split('T')[0];
    messageDates[d] = (messageDates[d] || 0) + 1;
  });

  // 7. Last 7 Days Activity Trend (Tasks & Messages)
  const activityTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    // Tasks completed on this day (or created if not marked)
    const tasksOnDay = tasks.filter((t) => {
      const tDate = new Date(t.createdAt).toISOString().split('T')[0];
      return tDate === dateKey;
    }).length;

    const messagesOnDay = messageDates[dateKey] || 0;

    activityTrend.push({
      date: dateKey,
      day: dayName,
      tasks: tasksOnDay,
      messages: messagesOnDay,
      totalActivity: tasksOnDay + messagesOnDay
    });
  }

  // 8. Milestones Tracker
  const milestones = [
    {
      id: 'kickoff',
      title: 'Project Kickoff & Formation',
      description: 'Project created and initialized on TeamForge',
      targetProgress: 0,
      completed: true,
      date: project.createdAt
    },
    {
      id: 'team_assembled',
      title: 'Team Assembly',
      description: `Roster populated with ${allTeamMembers.length} team members`,
      targetProgress: 25,
      completed: allTeamMembers.length >= 2,
      date: allTeamMembers[allTeamMembers.length - 1]?.joinedAt || project.createdAt
    },
    {
      id: 'tasks_initiated',
      title: 'Sprint Planning & Tasks',
      description: `${totalTasks} sprint tasks defined and assigned`,
      targetProgress: 50,
      completed: totalTasks >= 2,
      date: tasks[0]?.createdAt || null
    },
    {
      id: 'halfway',
      title: 'Core Milestone Execution',
      description: '50% of scheduled tasks completed',
      targetProgress: 75,
      completed: calculatedProgress >= 50,
      date: null
    },
    {
      id: 'submission',
      title: 'Final Release & Submission',
      description: 'All tasks completed and project delivered',
      targetProgress: 100,
      completed: calculatedProgress === 100 && totalTasks > 0,
      date: null
    }
  ];

  // 9. Activity Timeline Events (Chronological stream of real actions)
  const timelineEvents = [];

  // Project Created Event
  timelineEvents.push({
    type: 'project_created',
    title: 'Project Initialized',
    description: `"${project.title}" created by ${project.owner?.name || 'Project Lead'}`,
    timestamp: project.createdAt,
    actor: project.owner
  });

  // Team Joined Events
  if (Array.isArray(project.members)) {
    project.members.forEach((m) => {
      if (m.user) {
        timelineEvents.push({
          type: 'member_joined',
          title: 'Member Joined Team',
          description: `${m.user.name} joined as ${m.role || 'Contributor'}`,
          timestamp: m.joinedAt || project.createdAt,
          actor: m.user
        });
      }
    });
  }

  // Task Created / Done Events
  tasks.forEach((t) => {
    timelineEvents.push({
      type: 'task_created',
      title: 'Task Created',
      description: `Task "${t.title}" (${t.priority} Priority) assigned to ${t.assignedTo?.name || 'Unassigned'}`,
      timestamp: t.createdAt,
      actor: t.assignedTo,
      status: t.status
    });
  });

  // Sort timeline chronologically (newest first)
  timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    projectId: project._id,
    projectTitle: project.title,
    category: project.category,
    status: project.status,
    difficulty: project.difficulty,
    teamSize: project.teamSize,
    progress: calculatedProgress,
    summary: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      totalMessages,
      totalMembers: allTeamMembers.length
    },
    priorityBreakdown,
    memberPerformance,
    activityTrend,
    milestones,
    timelineEvents: timelineEvents.slice(0, 20) // Most recent 20 events
  };
};
