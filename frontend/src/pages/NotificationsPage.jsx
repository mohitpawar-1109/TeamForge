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
  Search,
  ArrowRight
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
        color: 'text-[#FF1F2D]',
        bg: 'bg-[#E50914]/15',
        border: 'border-[#E50914]/40',
        label: 'POST LIKE',
        category: 'social'
      };
    case 'COMMENT':
    case 'post_comment':
      return {
        icon: MessageSquare,
        color: 'text-[#A1A1A1]',
        bg: 'bg-[#161616]',
        border: 'border-[#242424]',
        label: 'COMMENT',
        category: 'social'
      };
    case 'new_message':
      return {
        icon: MessageSquare,
        color: 'text-[#A1A1A1]',
        bg: 'bg-[#161616]',
        border: 'border-[#242424]',
        label: 'MESSAGE',
        category: 'message'
      };
    case 'project_invite':
    case 'invite':
    case 'team_invite':
      return {
        icon: FolderGit2,
        color: 'text-[#20D47A]',
        bg: 'bg-[#20D47A]/15',
        border: 'border-[#20D47A]/40',
        label: 'TEAM INVITATION',
        category: 'project'
      };
    case 'group_invite':
      return {
        icon: Users,
        color: 'text-[#2AA8FF]',
        bg: 'bg-[#2AA8FF]/15',
        border: 'border-[#2AA8FF]/40',
        label: 'GROUP INVITATION',
        category: 'project'
      };
    case 'group_member_joined':
    case 'team_join':
    case 'TEAM_REQUEST_ACCEPTED':
      return {
        icon: CheckCircle2,
        color: 'text-[#20D47A]',
        bg: 'bg-[#20D47A]/15',
        border: 'border-[#20D47A]/40',
        label: 'SQUAD JOINED',
        category: 'project'
      };
    case 'task_assigned':
    case 'task':
      return {
        icon: CheckCircle2,
        color: 'text-[#F2B705]',
        bg: 'bg-[#F2B705]/15',
        border: 'border-[#F2B705]/40',
        label: 'TASK ASSIGNED',
        category: 'task'
      };
    case 'task_completed':
      return {
        icon: CheckCircle2,
        color: 'text-[#20D47A]',
        bg: 'bg-[#20D47A]/15',
        border: 'border-[#20D47A]/40',
        label: 'TASK COMPLETED',
        category: 'task'
      };
    case 'ai_recommendation':
    case 'MATCH_FOUND':
    case 'match':
      return {
        icon: Sparkles,
        color: 'text-[#8B5CF6]',
        bg: 'bg-[#8B5CF6]/15',
        border: 'border-[#8B5CF6]/40',
        label: 'AI RECOMMENDATION',
        category: 'ai'
      };
    case 'hackathon_deadline':
    case 'deadline':
      return {
        icon: Calendar,
        color: 'text-[#F2B705]',
        bg: 'bg-[#F2B705]/15',
        border: 'border-[#F2B705]/40',
        label: 'DEADLINE ALERT',
        category: 'project'
      };
    default:
      return {
        icon: Bell,
        color: 'text-[#A1A1A1]',
        bg: 'bg-[#161616]',
        border: 'border-[#242424]',
        label: 'NOTIFICATION',
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
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Top Hero Card with Atmospheric Red Glow */}
      <div className="bg-gradient-to-r from-[#111111] via-[#160c0e] to-[#220d11] border border-[#242424] rounded-3xl p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#242424] flex items-center justify-center text-white">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#E50914]/20 text-[#FF1F2D] border border-[#E50914]/40">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#888888] max-w-xl">
              Stay updated on team invitations, squad chat messages, peer endorsements, and task milestones in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-5 py-2.5 bg-[#161616] hover:bg-[#202020] text-white text-xs font-mono font-medium rounded-full border border-[#242424] hover:border-[#333333] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#20D47A]" />
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={fetchNotifications}
              className="p-2.5 bg-[#161616] hover:bg-[#202020] text-[#A1A1A1] hover:text-white rounded-full border border-[#242424] transition-all cursor-pointer"
              title="Refresh"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#1F1F1F]">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0A0A0A] rounded-full border border-[#242424] w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'project', label: 'Teams & Tasks' },
              { id: 'social', label: 'Community' },
              { id: 'message', label: 'Messages' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white font-bold shadow-[0_0_12px_rgba(229,9,20,0.45)]'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-black/20 text-white font-bold' : 'bg-[#161616] text-[#A1A1A1]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#111111] border border-[#242424] rounded-full text-xs font-mono text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E50914] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#111111] border border-[#242424] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-[#111111] border border-[#242424] rounded-3xl p-12 text-center shadow-soft">
          <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-[#A1A1A1] flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] mb-1">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
          </h3>
          <p className="text-xs text-[#777777] max-w-sm mx-auto">
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
                    ? 'bg-[#111111] border-[#242424] hover:bg-[#161616] hover:border-[#333333]'
                    : 'bg-[#141414] border-[#2E2E2E] hover:bg-[#181818] shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border ${config.bg} ${config.color} ${config.border}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}
                      >
                        {config.label}
                      </span>
                      {notif.sender && (
                        <span className="text-xs font-bold text-[#F5F5F5]">
                          {notif.sender.name}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[#666666] flex items-center gap-1">
                        • <Clock className="w-3 h-3 text-[#666666]" /> {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-snug ${
                        notif.read ? 'text-[#A1A1A1]' : 'text-[#F5F5F5] font-semibold'
                      }`}
                    >
                      {notif.message || notif.title}
                    </p>

                    {/* Metadata Context Tags */}
                    {notif.relatedProject?.title && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[10px] font-mono text-[#A1A1A1]">
                        <FolderGit2 className="w-3 h-3 text-[#A1A1A1]" />
                        <span>Project: {notif.relatedProject.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1F1F1F]">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="p-2 text-[#888888] hover:text-[#20D47A] hover:bg-[#161616] rounded-full transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(notif._id, e)}
                    title="Remove notification"
                    className="p-2 text-[#888888] hover:text-[#E50914] hover:bg-[#161616] rounded-full transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-2 text-[#666666] group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
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
