import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Heart,
  MessageSquare,
  Users,
  FolderGit2,
  CheckCircle2,
  Sparkles,
  Clock,
  ExternalLink,
  Shield,
  Calendar,
  Filter,
  Search,
  ArrowRight,
  Flame
} from 'lucide-react';
import { notifAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Relative time formatter
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

// Notification badge and icon styling config
const getNotificationTypeConfig = (type) => {
  switch (type) {
    case 'LIKE':
    case 'post_like':
      return {
        icon: Heart,
        color: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/30',
        label: 'Post Like',
        category: 'social'
      };
    case 'COMMENT':
    case 'post_comment':
      return {
        icon: MessageSquare,
        color: 'text-blue-400',
        bg: 'bg-blue-950/40',
        border: 'border-blue-500/30',
        label: 'Discussion Comment',
        category: 'social'
      };
    case 'new_message':
      return {
        icon: MessageSquare,
        color: 'text-sky-400',
        bg: 'bg-sky-950/40',
        border: 'border-sky-500/30',
        label: 'Direct Message',
        category: 'message'
      };
    case 'project_invite':
    case 'invite':
    case 'team_invite':
      return {
        icon: FolderGit2,
        color: 'text-purple-400',
        bg: 'bg-purple-950/40',
        border: 'border-purple-500/30',
        label: 'Team Invitation',
        category: 'project'
      };
    case 'group_invite':
      return {
        icon: Users,
        color: 'text-indigo-400',
        bg: 'bg-indigo-950/40',
        border: 'border-indigo-500/30',
        label: 'Group Invitation',
        category: 'project'
      };
    case 'group_member_joined':
    case 'team_join':
    case 'TEAM_REQUEST_ACCEPTED':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/30',
        label: 'Squad Joined',
        category: 'project'
      };
    case 'task_assigned':
    case 'task':
      return {
        icon: CheckCircle2,
        color: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/30',
        label: 'Task Assignment',
        category: 'task'
      };
    case 'task_completed':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/30',
        label: 'Task Completed',
        category: 'task'
      };
    case 'team_update':
      return {
        icon: Shield,
        color: 'text-cyan-400',
        bg: 'bg-cyan-950/40',
        border: 'border-cyan-500/30',
        label: 'Team Update',
        category: 'project'
      };
    case 'ai_recommendation':
    case 'MATCH_FOUND':
    case 'match':
      return {
        icon: Sparkles,
        color: 'text-violet-400',
        bg: 'bg-violet-950/40',
        border: 'border-violet-500/30',
        label: 'AI Recommendation',
        category: 'ai'
      };
    case 'hackathon_deadline':
    case 'deadline':
      return {
        icon: Calendar,
        color: 'text-orange-400',
        bg: 'bg-orange-950/40',
        border: 'border-orange-500/30',
        label: 'Deadline Alert',
        category: 'project'
      };
    default:
      return {
        icon: Bell,
        color: 'text-indigo-400',
        bg: 'bg-indigo-950/40',
        border: 'border-indigo-500/30',
        label: 'Notification',
        category: 'general'
      };
  }
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, project, social, message
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notifAPI.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      if (!newNotif) return;
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== newNotif._id);
        return [newNotif, ...filtered];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCount = ({ unreadCount }) => {
      if (typeof unreadCount === 'number') {
        setUnreadCount(unreadCount);
      }
    };

    const handleNotificationRead = ({ notificationId, unreadCount }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      if (typeof unreadCount === 'number') {
        setUnreadCount(unreadCount);
      }
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('notification_unread_count', handleUnreadCount);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllNotificationsRead);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_unread_count', handleUnreadCount);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllNotificationsRead);
    };
  }, [socket]);

  // Mark single notification read
  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notifAPI.markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await notifAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notifAPI.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Navigation on click
  const handleNotificationClick = async (n) => {
    if (!n.read) {
      handleMarkAsRead(n._id);
    }

    if (n.link) {
      navigate(n.link);
    } else if (n.relatedProject) {
      navigate(`/projects/${n.relatedProject._id || n.relatedProject}`);
    } else if (n.relatedGroup) {
      navigate(`/groups/${n.relatedGroup._id || n.relatedGroup}`);
    } else if (n.relatedPost) {
      navigate('/community');
    } else if (n.type?.includes('invite')) {
      navigate('/invitations');
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    // Tab filter
    if (activeTab === 'unread' && n.read) return false;
    if (activeTab === 'project') {
      const cat = getNotificationTypeConfig(n.type).category;
      if (cat !== 'project' && cat !== 'task' && cat !== 'ai') return false;
    }
    if (activeTab === 'social') {
      const cat = getNotificationTypeConfig(n.type).category;
      if (cat !== 'social') return false;
    }
    if (activeTab === 'message') {
      const cat = getNotificationTypeConfig(n.type).category;
      if (cat !== 'message') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchSender = n.sender?.name?.toLowerCase().includes(q);
      return matchMsg || matchTitle || matchSender;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Card */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tracking-tight flex items-center gap-2.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-zinc-400">
              Stay updated on team invitations, squad chat messages, peer endorsements, and task milestones in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-bold rounded-2xl border border-[#3F3F46] transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-indigo-400" />
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={fetchNotifications}
              className="p-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-300 hover:text-white rounded-2xl border border-[#3F3F46] transition-all"
              title="Refresh"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#27272A]/80">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#111113] rounded-2xl border border-[#27272A] w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'project', label: 'Teams & Tasks' },
              { id: 'social', label: 'Community' },
              { id: 'message', label: 'Messages' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181B]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#27272A] text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#111113] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#18181B] border border-[#27272A] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#FAFAFA] mb-1">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? `No notifications matching "${searchQuery}". Try adjusting your search query.`
              : "You're all caught up on activities, team invitations, and task assignments."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => {
            const config = getNotificationTypeConfig(notif.type);
            const Icon = config.icon;

            return (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  notif.read
                    ? 'bg-[#18181B] border-[#27272A] hover:bg-[#1E1E22] hover:border-[#3F3F46]'
                    : 'bg-indigo-950/25 border-indigo-500/30 hover:bg-indigo-950/35 hover:border-indigo-500/50 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border ${config.bg} ${config.color} ${config.border}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border}`}
                      >
                        {config.label}
                      </span>
                      {notif.sender && (
                        <span className="text-xs font-bold text-zinc-300">
                          {notif.sender.name}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                        • <Clock className="w-3 h-3" /> {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-snug ${
                        notif.read ? 'text-zinc-300 font-normal' : 'text-[#FAFAFA] font-semibold'
                      }`}
                    >
                      {notif.message || notif.title}
                    </p>

                    {/* Metadata Context Tags */}
                    {notif.relatedProject?.title && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#27272A] text-[11px] text-zinc-300 font-medium">
                        <FolderGit2 className="w-3 h-3 text-purple-400" />
                        <span>Project: {notif.relatedProject.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#27272A]/50">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="p-2 text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-xl transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(notif._id, e)}
                    title="Remove notification"
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
