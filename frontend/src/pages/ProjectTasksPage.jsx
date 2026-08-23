import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Calendar
} from 'lucide-react';
import { taskAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const ProjectTasksPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, todo: 0, progressPercent: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State for Task Creation/Edit
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    status: 'TODO',
    dueDate: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getProjectById(id),
        taskAPI.getTasks(id)
      ]);

      if (projRes.data.success) setProject(projRes.data.data);
      if (taskRes.data.success) {
        setTasks(taskRes.data.data);
        setStats(taskRes.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, [id]);

  const handleOpenCreateModal = (columnStatus = 'TODO') => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      assignedTo: user?._id || '',
      priority: 'Medium',
      status: columnStatus,
      dueDate: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      priority: task.priority || 'Medium',
      status: task.status || 'TODO',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask._id, taskForm);
        success('Task updated successfully!');
      } else {
        await taskAPI.createTask(id, taskForm);
        success('Task created successfully! 🎉');
      }
      setIsTaskModalOpen(false);
      fetchTasksData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (taskId, nextStatus) => {
    try {
      await taskAPI.updateTask(taskId, { status: nextStatus });
      fetchTasksData();
    } catch (err) {
      error('Failed to change status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await taskAPI.deleteTask(taskId);
        success('Task deleted.');
        fetchTasksData();
      } catch (err) {
        error('Failed to delete task.');
      }
    }
  };

  const columns = [
    { id: 'TODO', title: 'TODO', badgeColor: 'bg-[#4A2A35] text-[#F6E8E2] border-[#703344]' },
    { id: 'IN PROGRESS', title: 'IN PROGRESS', badgeColor: 'bg-[#D99443]/20 text-[#E5B079] border-[#D99443]/40' },
    { id: 'DONE', title: 'DONE', badgeColor: 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Project Progress Bar */}
      <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#703344]">
          <div>
            <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#CB6B5A] hover:underline mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2] tracking-tight">
              Project Task Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#DDA081] mt-0.5">
              Collaborative Kanban board for <span className="font-bold text-[#F6E8E2]">{project?.title}</span>
            </p>
          </div>

          <Button variant="primary" size="md" icon={Plus} onClick={() => handleOpenCreateModal('TODO')}>
            Add New Task
          </Button>
        </div>

        {/* Progress Metrics Row */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-[#DDA081]">{stats.total} Total Tasks</span>
            <span>•</span>
            <span className="text-[#86B190] font-bold">{stats.completed} Completed</span>
            <span>•</span>
            <span className="text-[#E5B079] font-bold">{stats.inProgress} In Progress</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-[#F6E8E2]">{stats.progressPercent}% Overall Progress</span>
            <div className="w-36 bg-[#281A21] h-2.5 rounded-full overflow-hidden border border-[#703344]">
              <div
                className="bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div key={col.id} className="bg-[#281A21] rounded-2xl border border-[#703344] p-4 flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#703344]">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${col.badgeColor}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-[#DDA081]">({colTasks.length})</span>
                </div>

                <button
                  onClick={() => handleOpenCreateModal(col.id)}
                  className="p-1 rounded-lg text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#4A2A35] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-[#703344] rounded-xl flex items-center justify-center text-xs text-[#DDA081]/60 font-medium">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-[#4A2A35] rounded-xl border border-[#703344] p-4 shadow-xs hover:border-[#A84A4D]/60 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant={
                            task.priority === 'Urgent' ? 'danger' :
                            task.priority === 'High' ? 'warning' :
                            task.priority === 'Low' ? 'default' : 'brand'
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEditModal(task)} className="p-1 text-[#DDA081] hover:text-[#F6E8E2] cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-[#DDA081] hover:text-[#E07D82] cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-[#F6E8E2] text-sm mb-1.5 leading-snug">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-[#DDA081] line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                      )}

                      {/* Card Footer: Assignee & Move Controls */}
                      <div className="pt-3 border-t border-[#703344] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assignedTo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo?.name || 'Assignee'}`}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-[#703344]"
                          />
                          <span className="text-[11px] text-[#DDA081] font-medium truncate max-w-[80px]">
                            {task.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Move Status Select */}
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task._id, e.target.value)}
                          className="text-[11px] bg-[#281A21] border border-[#703344] rounded px-1.5 py-0.5 text-[#F6E8E2] font-medium focus:outline-none focus:border-[#CB6B5A]"
                        >
                          <option value="TODO">→ TODO</option>
                          <option value="IN PROGRESS">→ In Progress</option>
                          <option value="DONE">→ Done</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Create / Edit Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create Project Task'}
        subtitle={`Project: ${project?.title}`}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#DDA081] mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement ATS parser schema..."
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none placeholder:text-[#DDA081]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#DDA081] mb-1">Task Description</label>
            <textarea
              rows={3}
              placeholder="Provide technical notes or implementation instructions..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none placeholder:text-[#DDA081]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Assignee</label>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:outline-none focus:border-[#CB6B5A]"
              >
                <option value="">Select Member</option>
                {(project?.members || []).map((m, idx) => (
                  <option key={idx} value={m.user?._id || m.user}>
                    {m.user?.name || 'Team Member'} ({m.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:outline-none focus:border-[#CB6B5A]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Status</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:outline-none focus:border-[#CB6B5A]"
              >
                <option value="TODO">TODO</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#703344]">
            <Button variant="outline" size="md" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={submitting} type="submit">
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
