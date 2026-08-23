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
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await notifAPI.markRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsOpen(false);
      if (onCloseMobile) onCloseMobile();

      // Navigation routing based on notification type / context
      if (notif.relatedPost || notif.link?.includes('/community')) {
        navigate('/community');
      } else if (notif.relatedProject || notif.link?.includes('/projects')) {
        navigate(notif.link || `/projects/${notif.relatedProject}`);
      } else if (notif.type === 'team_invite' || notif.type === 'INVITATION_RECEIVED') {
        navigate('/invitations');
      } else if (notif.type === 'team_join_request') {
        navigate('/dashboard');
      } else if (notif.link) {
        navigate(notif.link);
      } else {
        navigate('/notifications');
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'POST_LIKED':
        return {
          icon: Heart,
          emoji: '❤️',
          bg: 'bg-[#703344]',
          text: 'text-[#CB6B5A]',
          border: 'border-[#A84A4D]/40'
        };
      case 'comment':
      case 'POST_COMMENTED':
        return {
          icon: MessageSquare,
          emoji: '💬',
          bg: 'bg-[#703344]',
          text: 'text-[#CB6B5A]',
          border: 'border-[#A84A4D]/40'
        };
      case 'team_invite':
      case 'INVITATION_RECEIVED':
        return {
          icon: Mail,
          emoji: '📩',
          bg: 'bg-[#5B8A68]/20',
          text: 'text-[#86B190]',
          border: 'border-[#5B8A68]/40'
        };
      case 'team_join_request':
        return {
          icon: Users,
          emoji: '🤝',
          bg: 'bg-[#D99443]/20',
          text: 'text-[#E5B079]',
          border: 'border-[#D99443]/40'
        };
      case 'team_request_accepted':
      case 'INVITATION_ACCEPTED':
        return {
          icon: Check,
          emoji: '🎉',
          bg: 'bg-[#5B8A68]/20',
          text: 'text-[#86B190]',
          border: 'border-[#5B8A68]/40'
        };
      case 'team_request_rejected':
      case 'INVITATION_REJECTED':
        return {
          icon: XCircle,
          emoji: '❌',
          bg: 'bg-[#C04A4D]/20',
          text: 'text-[#E07D82]',
          border: 'border-[#C04A4D]/40'
        };
      case 'task_completed':
        return {
          icon: CheckCircle2,
          emoji: '✅',
          bg: 'bg-[#5B8A68]/20',
          text: 'text-[#86B190]',
          border: 'border-[#5B8A68]/40'
        };
      case 'team_update':
        return {
          icon: Users,
          emoji: '🛡️',
          bg: 'bg-[#703344]',
          text: 'text-[#DDA081]',
          border: 'border-[#A84A4D]/40'
        };
      case 'ai_recommendation':
      case 'MATCH_FOUND':
        return {
          icon: Sparkles,
          emoji: '✨',
          bg: 'bg-[#703344]',
          text: 'text-[#CB6B5A]',
          border: 'border-[#A84A4D]/40'
        };
      case 'hackathon_deadline':
        return {
          icon: Clock,
          emoji: '⏰',
          bg: 'bg-[#D99443]/20',
          text: 'text-[#E5B079]',
          border: 'border-[#D99443]/40'
        };
      default:
        return {
          icon: Bell,
          emoji: '🔔',
          bg: 'bg-[#703344]',
          text: 'text-[#CB6B5A]',
          border: 'border-[#A84A4D]/40'
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
        className="relative p-2.5 rounded-2xl text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#703344]/50 transition-all active:scale-95 focus:outline-none cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#A84A4D] text-[#F6E8E2] text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#281A21] shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-[#4A2A35] rounded-3xl shadow-2xl border border-[#703344] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3.5 bg-[#281A21] border-b border-[#703344]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#F6E8E2] flex items-center gap-1.5">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40">
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
                className="text-xs font-bold text-[#CB6B5A] hover:text-[#F6E8E2] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#703344]/50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#703344] overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#F6E8E2]">You're all caught up!</p>
                <p className="text-[11px] text-[#DDA081] mt-0.5">
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
                        ? 'bg-[#4A2A35] hover:bg-[#703344]/50'
                        : 'bg-[#703344]/30 hover:bg-[#703344]/60'
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
                            n.read ? 'text-[#DDA081] font-medium' : 'text-[#F6E8E2] font-bold'
                          }`}
                        >
                          {n.message || n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#CB6B5A] flex-shrink-0 ring-2 ring-[#281A21]" />
                        )}
                      </div>

                      {/* Relative Time & Action Hint */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#DDA081] font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#DDA081]" />
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
          <div className="p-2.5 bg-[#281A21] border-t border-[#703344] flex items-center justify-between px-4">
            <span className="text-[11px] text-[#DDA081] font-medium">
              {notifications.length} recent
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onCloseMobile) onCloseMobile();
                navigate('/notifications');
              }}
              className="text-xs font-bold text-[#CB6B5A] hover:text-[#F6E8E2] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
