import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { notifyTaskAssignment, notifyTaskCompletion } from '../services/notification.service.js';

export const getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email headline avatar')
      .sort({ createdAt: -1 });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const inProgress = tasks.filter(t => t.status === 'IN PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total,
        completed,
        inProgress,
        todo,
        progressPercent
      },
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const targetAssignee = assignedTo || req.user._id;

    const task = await Task.create({
      project: projectId,
      title,
      description: description || '',
      assignedTo: targetAssignee,
      priority: priority || 'Medium',
      status: status || 'TODO',
      dueDate: dueDate || null
    });

    // Update project progress automatically
    await updateProjectProgress(projectId);

    const populated = await Task.findById(task._id).populate('assignedTo', 'name email headline avatar');

    // Trigger Task Assignment notification if assigned to another user
    if (targetAssignee && targetAssignee.toString() !== req.user._id.toString()) {
      try {
        await notifyTaskAssignment({
          recipientId: targetAssignee,
          assigner: req.user,
          task: populated,
          project
        });
      } catch (notifErr) {
        console.warn('Failed to send task assign notification:', notifErr.message);
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousStatus = task.status;
    const previousAssignee = task.assignedTo?.toString();

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email headline avatar');

    await updateProjectProgress(task.project);

    const project = await Project.findById(task.project);

    // Notify on new assignment
    if (req.body.assignedTo && req.body.assignedTo.toString() !== previousAssignee && req.body.assignedTo.toString() !== req.user._id.toString()) {
      try {
        await notifyTaskAssignment({
          recipientId: req.body.assignedTo,
          assigner: req.user,
          task: updated,
          project
        });
      } catch (err) {
        console.warn('Task reassign notif failed:', err.message);
      }
    }

    // Notify team on task completion
    if (req.body.status === 'DONE' && previousStatus !== 'DONE' && project) {
      try {
        const teamMemberIds = (project.members || []).map(m => m.user.toString());
        await notifyTaskCompletion({
          recipientIds: teamMemberIds,
          completer: req.user,
          task: updated,
          project
        });
      } catch (err) {
        console.warn('Task completion notif failed:', err.message);
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const projectId = task.project;
    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(projectId);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateProjectProgress = async (projectId) => {
  const allTasks = await Task.find({ project: projectId });
  if (allTasks.length > 0) {
    const done = allTasks.filter(t => t.status === 'DONE').length;
    const progress = Math.round((done / allTasks.length) * 100);
    await Project.findByIdAndUpdate(projectId, { progress });
  }
};
