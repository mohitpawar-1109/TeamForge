import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mail,
  Check,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { notifAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// Format relative time helper
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
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const NotificationDropdown = ({ isMobile = false, onCloseMobile }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notifAPI.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket notification listener
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRealtimeNotification = (newNotif) => {
      if (newNotif) {
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n._id !== newNotif._id)]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('new_notification', handleRealtimeNotification);

    return () => {
      socket.off('new_notification', handleRealtimeNotification);
    };
  }, [socket, isConnected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notifAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notifAPI.markRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();

    if (notif.relatedPost) {
      navigate('/community');
    } else if (notif.relatedProject) {
      const projId = notif.relatedProject?._id || notif.relatedProject;
      navigate(`/projects/${projId}`);
    } else if (notif.type?.includes('TEAM_REQUEST')) {
      navigate('/dashboard');
    } else if (notif.type === 'invite') {
      navigate('/invitations');
    }
  };

  // Get icon and colors by notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return {
          icon: Heart,
          emoji: '❤️',
          bg: 'bg-rose-950/50',
          text: 'text-rose-400',
          border: 'border-rose-500/30'
        };
      case 'COMMENT':
        return {
          icon: MessageSquare,
          emoji: '💬',
          bg: 'bg-blue-950/50',
          text: 'text-blue-400',
          border: 'border-blue-500/30'
        };
      case 'TEAM_REQUEST':
        return {
          icon: Users,
          emoji: '🤝',
          bg: 'bg-indigo-950/50',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30'
        };
      case 'TEAM_REQUEST_ACCEPTED':
        return {
          icon: CheckCircle2,
          emoji: '🎉',
          bg: 'bg-emerald-950/50',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30'
        };
      case 'TEAM_REQUEST_REJECTED':
        return {
          icon: XCircle,
          emoji: '✕',
          bg: 'bg-[#27272A]',
          text: 'text-zinc-400',
          border: 'border-[#3F3F46]'
        };
      case 'MATCH_FOUND':
        return {
          icon: Sparkles,
          emoji: '🎯',
          bg: 'bg-amber-950/50',
          text: 'text-amber-400',
          border: 'border-amber-500/30'
        };
      case 'invite':
        return {
          icon: Mail,
          emoji: '✉️',
          bg: 'bg-purple-950/50',
          text: 'text-purple-400',
          border: 'border-purple-500/30'
        };
      default:
        return {
          icon: Bell,
          emoji: '🔔',
          bg: 'bg-indigo-950/50',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30'
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2.5 rounded-2xl text-zinc-400 hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all active:scale-95 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#09090B] shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-[#18181B] rounded-3xl shadow-2xl border border-[#27272A] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3.5 bg-[#111113] border-b border-[#27272A]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#FAFAFA] flex items-center gap-1.5">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                      {unreadCount} new
                    </span>
                  )}
                </h4>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-indigo-950/40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#27272A] overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-zinc-300">You're all caught up!</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = getNotificationIcon(n.type);

                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 select-none ${
                      n.read
                        ? 'bg-[#18181B] hover:bg-[#27272A]/60'
                        : 'bg-indigo-950/20 hover:bg-indigo-950/35'
                    }`}
                  >
                    {/* Notification Icon Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-xs ${config.bg} ${config.text} ${config.border}`}
                    >
                      <span className="text-sm">{config.emoji}</span>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs leading-snug line-clamp-2 ${
                            n.read ? 'text-zinc-300 font-medium' : 'text-[#FAFAFA] font-bold'
                          }`}
                        >
                          {n.message || n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 ring-2 ring-indigo-950" />
                        )}
                      </div>

                      {/* Relative Time & Action Hint */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-zinc-500" />
                          {formatTimeAgo(n.createdAt)}
                        </span>
                        {n.relatedPost && <span>• Post</span>}
                        {n.relatedProject && <span>• Project</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-[#111113] border-t border-[#27272A] text-center">
              <span className="text-[11px] text-zinc-500 font-medium">
                Showing latest notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
