import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Plus,
  Compass,
  Search,
  Send,
  CornerDownRight,
  Trash2,
  Reply,
  Shield,
  ShieldAlert,
  Globe,
  Lock,
  FolderGit2,
  User,
  Settings,
  UserPlus,
  LogOut,
  Sparkles,
  Check,
  CheckCheck,
  MoreVertical,
  ChevronLeft,
  Info,
  Smile,
  Wifi,
  WifiOff,
  Code,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Video
} from 'lucide-react';
import { groupAPI, messageAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CreateGroupModal } from '../components/chat/CreateGroupModal';
import { GroupDiscoveryModal } from '../components/chat/GroupDiscoveryModal';
import { InviteMemberModal } from '../components/chat/InviteMemberModal';

export const GroupsChatPage = () => {
  const { groupId: paramGroupId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markMessagesRead,
    isUserOnline
  } = useSocket();

  // State: Groups & active selection
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'project' | 'public' | 'dm'
  const [groupSearch, setGroupSearch] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);

  // State: Messages & Chatroom
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [sending, setSending] = useState(false);

  // Modals & Panels
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Mobile layout state
  const [mobileView, setMobileView] = useState('list');

  // Refs
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeGroupIdRef = useRef(null);

  // Computed Room ID
  const activeRoomId = activeGroup ? `group:${activeGroup._id}` : null;
  activeGroupIdRef.current = activeGroup?._id;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch User Groups
  const fetchUserGroups = async (preferredSelectId = null) => {
    try {
      setLoadingGroups(true);
      const res = await groupAPI.getGroups({ scope: 'my_groups' });
      if (res.data.success) {
        const list = res.data.data || [];
        setGroups(list);

        const targetId = preferredSelectId || paramGroupId || searchParams.get('id');
        if (targetId) {
          const match = list.find((g) => g._id === targetId);
          if (match) {
            setActiveGroup(match);
            setMobileView('chat');
          } else {
            try {
              const singleRes = await groupAPI.getGroupById(targetId);
              if (singleRes.data.success) {
                const fetched = singleRes.data.data;
                setGroups((prev) => [fetched, ...prev.filter((g) => g._id !== fetched._id)]);
                setActiveGroup(fetched);
                setMobileView('chat');
              }
            } catch (err) {
              if (list.length > 0) setActiveGroup(list[0]);
            }
          }
        } else if (list.length > 0 && !activeGroup) {
          setActiveGroup(list[0]);
        }
      }
    } catch (err) {
      console.error('[Groups] Failed to load user groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, [paramGroupId]);

  // 2. Fetch Messages for Active Group
  const fetchGroupMessages = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingMessages(true);
      const roomId = `group:${groupId}`;
      const res = await messageAPI.getMessages(roomId, { limit: 50 });
      if (res.data.success) {
        setMessages(res.data.data || []);
        setHasMoreMessages(res.data.hasMore || false);
        setTimeout(() => scrollToBottom('auto'), 80);
      }
    } catch (err) {
      console.error('[Groups] Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeGroup?._id) {
      fetchGroupMessages(activeGroup._id);
      setReplyTarget(null);
      setEditName(activeGroup.name);
      setEditDesc(activeGroup.description || '');
      setIsEditingSettings(false);
    }
  }, [activeGroup?._id]);

  // 3. Pagination: Load Earlier Messages
  const handleLoadOlderMessages = async () => {
    if (!activeGroup || loadingOlder || !hasMoreMessages || messages.length === 0) return;

    try {
      setLoadingOlder(true);
      const oldestMsg = messages[0];
      const roomId = `group:${activeGroup._id}`;
      const res = await messageAPI.getMessages(roomId, {
        limit: 40,
        before: oldestMsg.createdAt
      });

      if (res.data.success) {
        const older = res.data.data || [];
        setHasMoreMessages(res.data.hasMore || false);

        const container = chatScrollContainerRef.current;
        const prevScrollHeight = container ? container.scrollHeight : 0;

        setMessages((prev) => [...older, ...prev]);

        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        }, 50);
      }
    } catch (err) {
      console.error('[Groups] Pagination error:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // 4. Real-time Socket Event Subscriptions
  useEffect(() => {
    if (!socket || !isConnected || !activeRoomId || !activeGroup) return;

    joinRoom(activeRoomId);
    markMessagesRead(activeRoomId);

    const handleNewMessage = (newMsg) => {
      if (newMsg.roomId === activeRoomId || (newMsg.group && newMsg.group === activeGroup._id)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender?._id) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(newMsg.sender._id);
            return next;
          });
        }

        if (newMsg.sender?._id !== user?._id) {
          markMessagesRead(activeRoomId);
        }

        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g._id === activeGroup._id || activeRoomId === `group:${g._id}`) {
            return {
              ...g,
              lastMessage: {
                content: newMsg.content,
                sender: newMsg.sender,
                createdAt: newMsg.createdAt
              }
            };
          }
          return g;
        })
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );
    };

    const handleUserTyping = ({ roomId, userId: uId, name }) => {
      if (roomId === activeRoomId && uId !== user?._id) {
        setTypingUsers((prev) => new Map(prev).set(uId, name || 'Member'));
      }
    };

    const handleUserStopTyping = ({ roomId, userId: uId }) => {
      if (roomId === activeRoomId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(uId);
          return next;
        });
      }
    };

    const handleMessagesRead = ({ roomId, userId: uId, readAt }) => {
      if (roomId === activeRoomId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.sender?._id === user?._id) {
              const already = (msg.readBy || []).some(
                (r) => (r.user?._id || r.user)?.toString() === uId
              );
              if (!already) {
                return {
                  ...msg,
                  readBy: [...(msg.readBy || []), { user: uId, readAt }]
                };
              }
            }
            return msg;
          })
        );
      }
    };

    const handleGroupUpdated = (updatedGroup) => {
      if (updatedGroup._id === activeGroup._id) {
        setActiveGroup(updatedGroup);
      }
      setGroups((prev) =>
        prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g))
      );
    };

    const handleMemberJoined = ({ groupId, user: newUser, role: newRole }) => {
      if (groupId === activeGroup._id) {
        setActiveGroup((prev) => {
          if (!prev) return prev;
          const exists = prev.members?.some((m) => m.user?._id === newUser._id);
          if (exists) return prev;
          return {
            ...prev,
            members: [...(prev.members || []), { user: newUser, role: newRole || 'member', joinedAt: new Date() }]
          };
        });
      }
    };

    const handleMemberLeft = ({ groupId, userId: leftUserId }) => {
      if (groupId === activeGroup._id) {
        setActiveGroup((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: (prev.members || []).filter((m) => (m.user?._id || m.user) !== leftUserId)
          };
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('group_updated', handleGroupUpdated);
    socket.on('member_joined', handleMemberJoined);
    socket.on('member_left', handleMemberLeft);

    return () => {
      leaveRoom(activeRoomId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('group_updated', handleGroupUpdated);
      socket.off('member_joined', handleMemberJoined);
      socket.off('member_left', handleMemberLeft);
    };
  }, [socket, isConnected, activeRoomId, activeGroup?._id, user?._id]);

  // Handle typing input
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeRoomId) return;

    sendTyping(activeRoomId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeRoomId, false);
    }, 2000);
  };

  // Send Message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending || !activeGroup) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(activeRoomId, false);

    setSending(true);
    setInputText('');

    const payload = {
      roomId: activeRoomId,
      group: activeGroup._id,
      content: trimmed,
      type: 'text',
      replyTo: replyTarget?._id || undefined
    };

    if (activeGroup.type === 'dm') {
      const otherMember = activeGroup.members?.find(
        (m) => (m.user?._id || m.user)?.toString() !== user?._id?.toString()
      );
      if (otherMember) {
        payload.recipient = otherMember.user?._id || otherMember.user;
      }
    }

    if (activeGroup.type === 'project' && activeGroup.project) {
      payload.project = activeGroup.project._id || activeGroup.project;
    }

    setReplyTarget(null);

    sendMessage(payload, (res) => {
      setSending(false);
      if (res?.success && res?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message for everyone in the group?')) return;
    try {
      if (socket && isConnected) {
        socket.emit('delete_message', { messageId: msgId }, (res) => {
          if (res?.success) {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
              )
            );
            success('Message deleted.');
          }
        });
      } else {
        const res = await messageAPI.deleteMessage(msgId);
        if (res.data.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
            )
          );
          success('Message deleted.');
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    if (window.confirm(`Are you sure you want to leave "${activeGroup.name}"?`)) {
      try {
        await groupAPI.leaveGroup(activeGroup._id);
        success(`You left "${activeGroup.name}"`);
        const remaining = groups.filter((g) => g._id !== activeGroup._id);
        setGroups(remaining);
        setActiveGroup(remaining.length > 0 ? remaining[0] : null);
        setMobileView('list');
      } catch (err) {
        error(err.response?.data?.message || 'Failed to leave group.');
      }
    }
  };

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    if (window.confirm(`Permanently delete group "${activeGroup.name}" and all message history? This action cannot be undone.`)) {
      try {
        await groupAPI.deleteGroup(activeGroup._id);
        success(`Group "${activeGroup.name}" deleted.`);
        const remaining = groups.filter((g) => g._id !== activeGroup._id);
        setGroups(remaining);
        setActiveGroup(remaining.length > 0 ? remaining[0] : null);
        setMobileView('list');
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete group.');
      }
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      error('Group name cannot be empty.');
      return;
    }
    try {
      const res = await groupAPI.updateGroup(activeGroup._id, {
        name: editName.trim(),
        description: editDesc.trim()
      });
      if (res.data.success) {
        success('Group settings updated!');
        setActiveGroup(res.data.data);
        setGroups((prev) => prev.map((g) => (g._id === activeGroup._id ? res.data.data : g)));
        setIsEditingSettings(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update group settings.');
    }
  };

  // Member role update
  const handleUpdateRole = async (targetUserId, newRole) => {
    try {
      const res = await groupAPI.updateMemberRole(activeGroup._id, targetUserId, newRole);
      if (res.data.success) {
        success(`Member role updated to ${newRole}`);
        setActiveGroup(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update member role.');
    }
  };

  // Remove member
  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Remove ${targetName || 'this member'} from the group?`)) return;
    try {
      const res = await groupAPI.removeMember(activeGroup._id, targetUserId);
      if (res.data.success) {
        success(`${targetName || 'Member'} removed.`);
        setActiveGroup(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // Helper: Filter groups in left sidebar
  const filteredGroups = groups.filter((g) => {
    if (activeTab === 'project' && g.type !== 'project') return false;
    if (activeTab === 'public' && g.type !== 'public') return false;
    if (activeTab === 'dm' && g.type !== 'dm') return false;

    if (groupSearch.trim()) {
      const q = groupSearch.toLowerCase();
      const matchName = g.name?.toLowerCase().includes(q);
      const matchDesc = g.description?.toLowerCase().includes(q);
      const matchTag = (g.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTag;
    }
    return true;
  });

  const myMembership = activeGroup?.members?.find(
    (m) => (m.user?._id || m.user)?.toString() === user?._id?.toString()
  );
  const isGroupAdmin = myMembership?.role === 'admin' || myMembership?.role === 'lead' || activeGroup?.createdBy?._id === user?._id || activeGroup?.createdBy === user?._id;

  const getGroupDisplayName = (g) => {
    if (!g) return '';
    if (g.type === 'dm') {
      const other = g.members?.find((m) => (m.user?._id || m.user)?.toString() !== user?._id?.toString());
      return other?.user?.name || g.name || 'Direct Message';
    }
    return g.name;
  };

  const getGroupAvatar = (g) => {
    if (g.type === 'dm') {
      const other = g.members?.find((m) => (m.user?._id || m.user)?.toString() !== user?._id?.toString());
      return other?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.user?.name || 'DM'}`;
    }
    return null;
  };

  const isDMOnline = (g) => {
    if (g.type !== 'dm') return false;
    const other = g.members?.find((m) => (m.user?._id || m.user)?.toString() !== user?._id?.toString());
    return other?.user?._id ? isUserOnline(other.user._id) : false;
  };

  const onlineMembersCount = (activeGroup?.members || []).filter((m) =>
    isUserOnline(m.user?._id || m.user)
  ).length;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-[#050505] rounded-3xl border border-[#242424] overflow-hidden shadow-soft">
      <div className="flex-1 flex min-h-0 relative">
        {/* ========================================================================= */}
        {/* COLUMN 1: LEFT SIDEBAR (Groups & Direct Messages List)                   */}
        {/* ========================================================================= */}
        <aside
          className={`w-full lg:w-80 bg-[#050505] border-r border-[#1F1F1F] flex flex-col z-20 flex-shrink-0 transition-all ${
            mobileView === 'list' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Header & Quick Action Buttons */}
          <div className="p-4 border-b border-[#1F1F1F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#161616] text-[#20D47A] border border-[#242424] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-mono font-bold text-[#F5F5F5] tracking-wider uppercase">
                  Collaboration Hub
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDiscoverModalOpen(true)}
                  title="Discover Public Groups"
                  className="p-1.5 rounded-lg bg-[#111111] hover:bg-[#161616] text-[#A1A1A1] hover:text-white border border-[#242424] transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#20D47A]" />
                </button>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  title="Create Group or DM"
                  className="p-1.5 rounded-lg bg-[#E50914] hover:bg-[#FF1F2D] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-[#111111] border border-[#242424] focus:border-[#E50914] rounded-full pl-8 pr-3 py-1.5 text-xs font-mono text-[#F5F5F5] placeholder-[#555555] focus:outline-none transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#111111] rounded-full border border-[#242424] text-[11px] font-mono text-center">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'text-[#888888] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('project')}
                className={`py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'project' ? 'bg-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'text-[#888888] hover:text-white'
                }`}
              >
                Teams
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('public')}
                className={`py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'public' ? 'bg-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'text-[#888888] hover:text-white'
                }`}
              >
                Clubs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dm')}
                className={`py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'dm' ? 'bg-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'text-[#888888] hover:text-white'
                }`}
              >
                DMs
              </button>
            </div>
          </div>

          {/* Conversation List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
            {loadingGroups ? (
              <div className="p-8 text-center text-xs font-mono text-[#888888] space-y-2">
                <div className="w-5 h-5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading squads...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#111111] text-[#888888] border border-[#242424] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono text-[#888888]">No conversations found</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscoverModalOpen(true)}
                    className="w-full bg-[#161616] hover:bg-[#222222] border border-[#242424] text-white font-mono text-xs py-2 px-4 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#20D47A]" />
                    <span>Discover Groups</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full bg-[#E50914] hover:bg-[#FF1F2D] text-white font-mono font-bold text-xs py-2 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(229,9,20,0.5)] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create Group / DM</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredGroups.map((g) => {
                const isSelected = activeGroup?._id === g._id;
                const displayName = getGroupDisplayName(g);
                const dmAvatar = getGroupAvatar(g);
                const isOnline = isDMOnline(g);

                return (
                  <div
                    key={g._id}
                    onClick={() => {
                      setActiveGroup(g);
                      setMobileView('chat');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#161616] border border-[#333333] text-[#F5F5F5] shadow-xs'
                        : 'hover:bg-[#111111] text-[#A1A1A1] border border-transparent'
                    }`}
                  >
                    {/* Icon / Avatar */}
                    <div className="relative flex-shrink-0">
                      {g.type === 'dm' ? (
                        <img
                          src={dmAvatar}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover border border-[#242424] bg-[#111111]"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                            g.type === 'project'
                              ? 'bg-[#161616] text-[#20D47A] border-[#242424]'
                              : g.type === 'private'
                              ? 'bg-[#161616] text-[#F2B705] border-[#242424]'
                              : 'bg-[#161616] text-[#A1A1A1] border-[#242424]'
                          }`}
                        >
                          {g.type === 'project' ? (
                            <FolderGit2 className="w-4 h-4" />
                          ) : g.type === 'private' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      {/* Online Presence Pill for DMs */}
                      {g.type === 'dm' && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#050505] ${
                            isOnline ? 'bg-[#20D47A]' : 'bg-neutral-600'
                          }`}
                        />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-[#F5F5F5]' : 'text-[#D0D0D0]'
                          }`}
                        >
                          {displayName}
                        </h4>
                        {g.lastMessage?.createdAt && (
                          <span className="text-[10px] font-mono text-[#666666] flex-shrink-0">
                            {new Date(g.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#888888]">
                        <p className="truncate max-w-[150px]">
                          {g.lastMessage?.content
                            ? g.lastMessage.content
                            : g.description || `${g.members?.length || 1} members`}
                        </p>

                        <span
                          className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full uppercase bg-[#111111] text-[#888888] border border-[#242424]"
                        >
                          {g.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* COLUMN 2: CENTER CHAT AREA                                               */}
        {/* ========================================================================= */}
        <main
          className={`flex-1 flex flex-col bg-[#0A0A0A] min-w-0 z-10 transition-all ${
            mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeGroup ? (
            <>
              {/* Center Chat Header */}
              <div className="h-16 px-4 sm:px-6 bg-[#050505] border-b border-[#1F1F1F] flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-1.5 rounded-full text-[#A1A1A1] hover:bg-[#161616] hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-[#F5F5F5] truncate">
                        {getGroupDisplayName(activeGroup)}
                      </h3>

                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                        {activeGroup.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#666666]">
                      {activeGroup.type === 'dm' ? (
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDMOnline(activeGroup) ? 'bg-[#20D47A]' : 'bg-neutral-600'
                            }`}
                          />
                          <span>{isDMOnline(activeGroup) ? 'Online now' : 'Offline'}</span>
                        </span>
                      ) : (
                        <span>
                          {activeGroup.members?.length || 1} members •{' '}
                          <span className="text-[#20D47A] font-medium">
                            {onlineMembersCount} online
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Connection indicator */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                      isConnected
                        ? 'bg-[#20D47A]/15 text-[#20D47A] border border-[#20D47A]/30'
                        : 'bg-[#161616] text-[#888888] border border-[#242424]'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Wifi className="w-3 h-3 text-[#20D47A]" />
                        <span className="hidden sm:inline">LIVE</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-[#888888]" />
                        <span className="hidden sm:inline">CONNECTING</span>
                      </>
                    )}
                  </span>

                  {/* Start Video Meeting Button */}
                  <button
                    onClick={() => {
                      navigate(`/meetings/group-${activeGroup._id}`);
                    }}
                    title="Start Team Video Meeting"
                    className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#20D47A]/15 text-[#20D47A] border border-[#20D47A]/40 hover:bg-[#20D47A]/25 transition-all cursor-pointer shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">VIDEO CALL</span>
                  </button>

                  {/* Invite Shortcut Button */}
                  {activeGroup.type !== 'dm' && (
                    <button
                      onClick={() => setInviteModalOpen(true)}
                      className="hidden sm:flex items-center gap-1 text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-[#161616] text-white border border-[#242424] hover:border-[#333333] transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>INVITE</span>
                    </button>
                  )}

                  {/* Toggle Right Details Sidebar */}
                  <button
                    onClick={() => {
                      setShowRightSidebar(!showRightSidebar);
                      if (mobileView === 'chat') setMobileView('info');
                    }}
                    title="Group Details & Members"
                    className={`p-2 rounded-full border transition-colors cursor-pointer ${
                      showRightSidebar
                        ? 'bg-[#161616] text-white border-[#333333]'
                        : 'bg-[#111111] text-[#888888] hover:text-white border-[#242424]'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Feed */}
              <div
                ref={chatScrollContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain bg-[#0A0A0A]"
              >
                {/* Pagination Button */}
                {hasMoreMessages && (
                  <div className="flex justify-center pb-2">
                    <button
                      onClick={handleLoadOlderMessages}
                      disabled={loadingOlder}
                      className="text-xs font-mono font-semibold text-[#A1A1A1] hover:text-white bg-[#111111] hover:bg-[#161616] border border-[#242424] px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {loadingOlder ? (
                        <>
                          <div className="w-3 h-3 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                          <span>Loading earlier messages...</span>
                        </>
                      ) : (
                        <span>↑ Load Earlier Messages</span>
                      )}
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-[#888888]">
                    <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-full bg-[#161616] text-white border border-[#242424] flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-[#E50914]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#F5F5F5]">
                      Welcome to #{getGroupDisplayName(activeGroup)}!
                    </h4>
                    <p className="text-xs text-[#888888] max-w-sm mt-1 leading-relaxed">
                      This is the beginning of the conversation. Say hello, discuss milestones, or share code!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe =
                      (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();
                    const senderUser = msg.sender || {};
                    const isOnline = isUserOnline(senderUser._id);

                    const senderMembership = activeGroup.members?.find(
                      (m) => (m.user?._id || m.user)?.toString() === senderUser._id?.toString()
                    );
                    const senderRole = senderMembership?.role || 'member';

                    return (
                      <div
                        key={msg._id || index}
                        className={`group relative flex items-end gap-2.5 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Avatar */}
                        {!isMe && (
                          <div className="relative flex-shrink-0 mb-1">
                            <img
                              src={
                                senderUser.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                  senderUser.name || 'User'
                                }`
                              }
                              alt={senderUser.name}
                              className="w-7 h-7 rounded-full object-cover border border-[#242424] bg-[#111111]"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0A0A0A] ${
                                isOnline ? 'bg-[#20D47A]' : 'bg-neutral-600'
                              }`}
                            />
                          </div>
                        )}

                        {/* Message Content Container */}
                        <div
                          className={`max-w-[85%] sm:max-w-[72%] flex flex-col ${
                            isMe ? 'items-end' : 'items-start'
                          }`}
                        >
                          {/* Sender name & role badge */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-xs font-semibold text-[#E5E5E5]">
                                {senderUser.name || 'Member'}
                              </span>

                              {activeGroup.type !== 'dm' && senderRole !== 'member' && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                                  {senderRole === 'lead' ? 'Team Lead' : 'Admin'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Quoted Parent Reply Bubble */}
                          {msg.replyTo && (
                            <div
                              className={`mb-1 p-2 rounded-xl text-[11px] border border-[#242424] bg-[#111111] text-[#A1A1A1] max-w-full flex items-center gap-2 ${
                                isMe ? 'rounded-br-xs' : 'rounded-bl-xs'
                              }`}
                            >
                              <CornerDownRight className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                              <div className="min-w-0 truncate">
                                <span className="font-bold text-[#E50914] mr-1">
                                  {msg.replyTo.sender?.name || 'User'}:
                                </span>
                                <span className="italic text-[#888888] truncate">
                                  {msg.replyTo.content || 'Attached snippet'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed break-words relative ${
                              isMe
                                ? 'bg-[#E50914] text-white rounded-br-xs shadow-[0_0_15px_rgba(229,9,20,0.3)]'
                                : 'bg-[#161616] text-[#F5F5F5] border border-[#242424] rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            <div
                              className={`flex items-center justify-end gap-1.5 mt-1 text-[9px] font-mono ${
                                isMe ? 'text-white/80' : 'text-[#666666]'
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isMe && <CheckCheck className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>

                        {/* Hover Action Controls (Reply/Delete) */}
                        <div
                          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1 ${
                            isMe ? 'order-first' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setReplyTarget(msg)}
                            title="Reply"
                            className="p-1 rounded-full bg-[#161616] border border-[#242424] text-[#888888] hover:text-white transition-colors cursor-pointer"
                          >
                            <Reply className="w-3 h-3" />
                          </button>
                          {(isMe || isGroupAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg._id)}
                              title="Delete"
                              className="p-1 rounded-full bg-[#161616] border border-[#242424] text-[#888888] hover:text-[#E50914] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview Bar */}
              {replyTarget && (
                <div className="px-4 py-2 bg-[#111111] border-t border-[#1F1F1F] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                    <span className="text-[#888888] font-mono">
                      Replying to <span className="text-white font-bold">{replyTarget.sender?.name || 'User'}</span>:
                    </span>
                    <span className="text-[#A1A1A1] italic truncate max-w-sm">
                      "{replyTarget.content}"
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyTarget(null)}
                    className="text-[#888888] hover:text-white text-xs px-2 py-0.5 rounded-full hover:bg-white/10 cursor-pointer font-mono"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-[#050505] border-t border-[#1F1F1F] flex items-center gap-2 flex-shrink-0"
              >
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isConnected
                        ? `Message #${getGroupDisplayName(activeGroup)}... (Enter to send)`
                        : 'Connecting to live chat engine...'
                    }
                    disabled={!isConnected}
                    rows={1}
                    className="w-full resize-none bg-[#111111] border border-[#242424] focus:border-[#E50914] rounded-full py-2.5 px-5 text-xs sm:text-sm font-mono text-[#F5F5F5] placeholder:text-[#555555] focus:outline-none max-h-24 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || !isConnected || sending}
                  className="p-3 rounded-full bg-[#E50914] hover:bg-[#FF1F2D] disabled:opacity-40 text-white shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all flex items-center justify-center flex-shrink-0 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#161616] text-[#888888] border border-[#242424] flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5]">Select or Create a Conversation</h3>
                <p className="text-xs font-mono text-[#888888] mt-1 max-w-sm">
                  Join project teams, open interest communities, or message teammates directly in real time.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDiscoverModalOpen(true)}
                  className="bg-[#161616] hover:bg-[#202020] border border-[#242424] text-white font-mono text-xs py-2.5 px-5 rounded-full flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#20D47A]" />
                  <span>Explore Groups</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-[#E50914] hover:bg-[#FF1F2D] text-white font-mono font-bold text-xs py-2.5 px-5 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(229,9,20,0.5)] transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create New Group</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* COLUMN 3: RIGHT SIDEBAR (Group Members & Info Details)                    */}
        {/* ========================================================================= */}
        {activeGroup && (showRightSidebar || mobileView === 'info') && (
          <aside
            className={`w-full lg:w-72 bg-[#050505] border-l border-[#1F1F1F] flex flex-col z-20 flex-shrink-0 ${
              mobileView === 'info' ? 'flex fixed inset-0 z-40 bg-[#050505]' : 'hidden lg:flex'
            }`}
          >
            {/* Header */}
            <div className="h-16 px-5 border-b border-[#1F1F1F] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1A1] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#E50914]" />
                <span>Group Information</span>
              </h3>

              {mobileView === 'info' && (
                <button
                  onClick={() => setMobileView('chat')}
                  className="lg:hidden p-1.5 rounded-full text-[#888888] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Group Overview Card */}
              <div className="space-y-3">
                {isEditingSettings ? (
                  <form onSubmit={handleSaveSettings} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] block mb-1">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#111111] border border-[#242424] focus:border-[#E50914] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] block mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-[#111111] border border-[#242424] focus:border-[#E50914] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] resize-none font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingSettings(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" variant="primary">
                        Save
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[#F5F5F5]">{getGroupDisplayName(activeGroup)}</h4>
                      {isGroupAdmin && activeGroup.type !== 'dm' && (
                        <button
                          onClick={() => setIsEditingSettings(true)}
                          className="p-1 text-[#888888] hover:text-[#E50914] transition-colors cursor-pointer"
                          title="Edit Group Info"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#888888] leading-relaxed">
                      {activeGroup.description || 'No description provided.'}
                    </p>
                  </div>
                )}

                {/* Project Team Card Shortcut */}
                {activeGroup.type === 'project' && activeGroup.project && (
                  <div className="p-3.5 rounded-2xl bg-[#111111] border border-[#242424] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#20D47A]">
                      <span className="flex items-center gap-1.5 font-mono">
                        <FolderGit2 className="w-4 h-4" />
                        <span>Associated Project</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#F5F5F5] font-semibold">{activeGroup.project.title || 'Project Workspace'}</p>
                    <Link
                      to={`/projects/${activeGroup.project._id || activeGroup.project}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E50914] hover:underline pt-1"
                    >
                      <span>Open Project Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Category & Tags */}
                {activeGroup.type !== 'dm' && (
                  <div className="space-y-2 pt-2 border-t border-[#1F1F1F]">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#888888]">Category:</span>
                      <span className="font-semibold text-white">{activeGroup.category || 'General'}</span>
                    </div>

                    {activeGroup.tags && activeGroup.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {activeGroup.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Members Roster Section */}
              <div className="space-y-3 pt-4 border-t border-[#1F1F1F]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>Members ({activeGroup.members?.length || 1})</span>
                  </h4>

                  {activeGroup.type !== 'dm' && (
                    <button
                      onClick={() => setInviteModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#E50914] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </button>
                  )}
                </div>

                {/* Member items list */}
                <div className="space-y-2">
                  {(activeGroup.members || []).map((m, idx) => {
                    const memberUser = m.user;
                    if (!memberUser) return null;
                    const uId = memberUser._id || memberUser;
                    const isOnline = isUserOnline(uId);
                    const isMe = uId?.toString() === user?._id?.toString();

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#111111] border border-[#242424] hover:border-[#333333] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                memberUser.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                                  memberUser.name || 'Member'
                                }`
                              }
                              alt={memberUser.name}
                              className="w-7 h-7 rounded-full object-cover border border-[#242424] bg-[#161616]"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#111111] ${
                                isOnline ? 'bg-[#20D47A]' : 'bg-neutral-600'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F5F5F5] truncate">
                              {memberUser.name} {isMe && '(You)'}
                            </p>
                            <p className="text-[10px] font-mono text-[#666666] truncate">
                              {memberUser.headline || memberUser.course || 'Student'}
                            </p>
                          </div>
                        </div>

                        {/* Role & Admin Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase bg-[#161616] text-[#A1A1A1] border border-[#242424]"
                          >
                            {m.role === 'lead' ? 'Lead' : m.role}
                          </span>

                          {isGroupAdmin && !isMe && activeGroup.type !== 'dm' && (
                            <div className="relative group/opt">
                              <button className="p-1 rounded text-[#888888] hover:text-white cursor-pointer">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              <div className="hidden group-hover/opt:block absolute right-0 top-6 w-32 bg-[#111111] border border-[#242424] rounded-xl shadow-xl p-1 z-30 space-y-1">
                                {m.role === 'member' && (
                                  <button
                                    onClick={() => handleUpdateRole(uId, 'admin')}
                                    className="w-full text-left px-2 py-1 text-[10px] font-mono text-[#E50914] hover:bg-[#161616] rounded cursor-pointer"
                                  >
                                    Make Admin
                                  </button>
                                )}
                                {m.role === 'admin' && (
                                  <button
                                    onClick={() => handleUpdateRole(uId, 'member')}
                                    className="w-full text-left px-2 py-1 text-[10px] font-mono text-[#A1A1A1] hover:bg-[#161616] rounded cursor-pointer"
                                  >
                                    Demote to Member
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveMember(uId, memberUser.name)}
                                  className="w-full text-left px-2 py-1 text-[10px] font-mono text-[#FF1F2D] hover:bg-[#E50914]/15 rounded cursor-pointer"
                                >
                                  Remove Member
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone / Leave Actions */}
              {activeGroup.type !== 'dm' && (
                <div className="pt-4 border-t border-[#1F1F1F] space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeaveGroup}
                    icon={LogOut}
                    className="w-full justify-center text-xs font-mono text-[#A1A1A1] hover:text-[#FF1F2D] hover:border-[#E50914]/40"
                  >
                    Leave Group
                  </Button>

                  {isGroupAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteGroup}
                      icon={Trash2}
                      className="w-full justify-center text-xs font-mono text-[#FF1F2D] hover:bg-[#E50914]/15 border-[#E50914]/30"
                    >
                      Delete Group
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev.filter((g) => g._id !== newGroup._id)]);
          setActiveGroup(newGroup);
          setMobileView('chat');
        }}
      />

      <GroupDiscoveryModal
        isOpen={discoverModalOpen}
        onClose={() => setDiscoverModalOpen(false)}
        onSelectGroup={(selected) => {
          setGroups((prev) => [selected, ...prev.filter((g) => g._id !== selected._id)]);
          setActiveGroup(selected);
          setMobileView('chat');
        }}
      />

      {activeGroup && (
        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          group={activeGroup}
          onMemberInvited={(updatedGroup) => {
            setActiveGroup(updatedGroup);
            setGroups((prev) => prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)));
          }}
        />
      )}
    </div>
  );
};
