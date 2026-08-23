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
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Post Like',
        category: 'social'
      };
    case 'COMMENT':
    case 'post_comment':
      return {
        icon: MessageSquare,
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Discussion Comment',
        category: 'social'
      };
    case 'new_message':
      return {
        icon: MessageSquare,
        color: 'text-[#DDA081]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Direct Message',
        category: 'message'
      };
    case 'project_invite':
    case 'invite':
    case 'team_invite':
      return {
        icon: FolderGit2,
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Team Invitation',
        category: 'project'
      };
    case 'group_invite':
      return {
        icon: Users,
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Group Invitation',
        category: 'project'
      };
    case 'group_member_joined':
    case 'team_join':
    case 'TEAM_REQUEST_ACCEPTED':
      return {
        icon: CheckCircle2,
        color: 'text-[#86B190]',
        bg: 'bg-[#5B8A68]/20',
        border: 'border-[#5B8A68]/40',
        label: 'Squad Joined',
        category: 'project'
      };
    case 'task_assigned':
    case 'task':
      return {
        icon: CheckCircle2,
        color: 'text-[#E5B079]',
        bg: 'bg-[#D99443]/20',
        border: 'border-[#D99443]/40',
        label: 'Task Assignment',
        category: 'task'
      };
    case 'task_completed':
      return {
        icon: CheckCircle2,
        color: 'text-[#86B190]',
        bg: 'bg-[#5B8A68]/20',
        border: 'border-[#5B8A68]/40',
        label: 'Task Completed',
        category: 'task'
      };
    case 'team_update':
      return {
        icon: Shield,
        color: 'text-[#DDA081]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'Team Update',
        category: 'project'
      };
    case 'ai_recommendation':
    case 'MATCH_FOUND':
    case 'match':
      return {
        icon: Sparkles,
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
        label: 'AI Recommendation',
        category: 'ai'
      };
    case 'hackathon_deadline':
    case 'deadline':
      return {
        icon: Calendar,
        color: 'text-[#E5B079]',
        bg: 'bg-[#D99443]/20',
        border: 'border-[#D99443]/40',
        label: 'Deadline Alert',
        category: 'project'
      };
    default:
      return {
        icon: Bell,
        color: 'text-[#CB6B5A]',
        bg: 'bg-[#703344]/50',
        border: 'border-[#A84A4D]/40',
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
      <div className="bg-[#4A2A35] border border-[#703344] rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A84A4D]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#703344] border border-[#A84A4D]/40 flex items-center justify-center text-[#CB6B5A]">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F6E8E2] tracking-tight flex items-center gap-2.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#C04A4D]/20 text-[#E07D82] border border-[#C04A4D]/40">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-[#DDA081]">
              Stay updated on team invitations, squad chat messages, peer endorsements, and task milestones in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 bg-[#281A21] hover:bg-[#703344] text-[#F6E8E2] text-xs font-bold rounded-2xl border border-[#703344] transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-[#86B190]" />
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={fetchNotifications}
              className="p-2.5 bg-[#281A21] hover:bg-[#703344] text-[#DDA081] hover:text-[#F6E8E2] rounded-2xl border border-[#703344] transition-all cursor-pointer"
              title="Refresh"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#703344]">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#281A21] rounded-2xl border border-[#703344] w-full sm:w-auto overflow-x-auto">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#A84A4D] text-[#F6E8E2] shadow-xs'
                    : 'text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#4A2A35]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-[#F6E8E2]' : 'bg-[#703344] text-[#DDA081]'
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
            <Search className="w-3.5 h-3.5 text-[#DDA081] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#281A21] border border-[#703344] rounded-xl text-xs text-[#F6E8E2] placeholder-[#DDA081]/60 focus:outline-none focus:border-[#CB6B5A] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#4A2A35] border border-[#703344] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-[#4A2A35] border border-[#703344] rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#F6E8E2] mb-1">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
          </h3>
          <p className="text-xs text-[#DDA081] max-w-sm mx-auto">
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
                    ? 'bg-[#4A2A35] border-[#703344] hover:bg-[#703344]/50 hover:border-[#A84A4D]/50'
                    : 'bg-[#703344]/30 border-[#A84A4D]/40 hover:bg-[#703344]/45 hover:border-[#CB6B5A]/60 shadow-md'
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
                        <span className="text-xs font-bold text-[#F6E8E2]">
                          {notif.sender.name}
                        </span>
                      )}
                      <span className="text-[11px] text-[#DDA081] font-medium flex items-center gap-1">
                        • <Clock className="w-3 h-3 text-[#CB6B5A]" /> {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-snug ${
                        notif.read ? 'text-[#DDA081] font-normal' : 'text-[#F6E8E2] font-semibold'
                      }`}
                    >
                      {notif.message || notif.title}
                    </p>

                    {/* Metadata Context Tags */}
                    {notif.relatedProject?.title && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#281A21] border border-[#703344] text-[11px] text-[#DDA081] font-medium">
                        <FolderGit2 className="w-3 h-3 text-[#CB6B5A]" />
                        <span>Project: {notif.relatedProject.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#703344]">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="p-2 text-[#DDA081] hover:text-[#86B190] hover:bg-[#5B8A68]/20 rounded-xl transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(notif._id, e)}
                    title="Remove notification"
                    className="p-2 text-[#DDA081] hover:text-[#E07D82] hover:bg-[#C04A4D]/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-[#DDA081] group-hover:text-[#CB6B5A] transition-colors">
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
