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
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

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
    // Mark as read if not already read
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

    // Navigate to appropriate context
    if (notif.relatedPost) {
      navigate('/community');
    } else if (notif.relatedProject) {
      const projId = notif.relatedProject?._id || notif.relatedProject;
      navigate(`/projects/${projId}`);
    } else if (notif.type.includes('TEAM_REQUEST')) {
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
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200'
        };
      case 'COMMENT':
        return {
          icon: MessageSquare,
          emoji: '💬',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200'
        };
      case 'TEAM_REQUEST':
        return {
          icon: Users,
          emoji: '🤝',
          bg: 'bg-indigo-50',
          text: 'text-indigo-600',
          border: 'border-indigo-200'
        };
      case 'TEAM_REQUEST_ACCEPTED':
        return {
          icon: CheckCircle2,
          emoji: '🎉',
          bg: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-200'
        };
      case 'TEAM_REQUEST_REJECTED':
        return {
          icon: XCircle,
          emoji: '✕',
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-200'
        };
      case 'MATCH_FOUND':
        return {
          icon: Sparkles,
          emoji: '🎯',
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200'
        };
      case 'invite':
        return {
          icon: Mail,
          emoji: '✉️',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200'
        };
      default:
        return {
          icon: Bell,
          emoji: '🔔',
          bg: 'bg-brand-50',
          text: 'text-brand-600',
          border: 'border-brand-200'
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
        className="relative p-2.5 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all active:scale-95 focus:outline-none"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3.5 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
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
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-indigo-50/70"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">You're all caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = getNotificationIcon(n.type);
                const Icon = config.icon;

                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 select-none ${
                      n.read
                        ? 'bg-white hover:bg-slate-50/80'
                        : 'bg-indigo-50/30 hover:bg-indigo-50/60'
                    }`}
                  >
                    {/* Notification Icon Avatar */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-2xs ${config.bg} ${config.text} ${config.border}`}
                    >
                      <span className="text-sm">{config.emoji}</span>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            n.read ? 'text-slate-700' : 'text-slate-900 font-bold'
                          }`}
                        >
                          {n.message || n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 ring-2 ring-indigo-100" />
                        )}
                      </div>

                      {/* Relative Time & Action Hint */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
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
            <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Showing latest notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
