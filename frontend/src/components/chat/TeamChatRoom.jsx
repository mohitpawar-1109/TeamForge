import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  CheckCheck,
  Check,
  Smile,
  Clock,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { messageAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const TeamChatRoom = ({
  projectId,
  projectTitle = 'Project Workspace',
  members = [],
  className = ''
}) => {
  const { user } = useAuth();
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

  const roomId = `project:${projectId}`;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Map()); // userId -> name
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch initial message history
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await messageAPI.getMessages(roomId);
        if (res.data.success && isMounted) {
          setMessages(res.data.data || []);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err) {
        console.warn('[TeamChat] Failed to load history:', err.message);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    if (projectId) {
      fetchHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [projectId, roomId]);

  // 2. Join Socket Room & Register Real-time Listeners
  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    joinRoom(roomId);
    markMessagesRead(roomId);

    // Incoming new message handler
    const handleNewMessage = (newMsg) => {
      if (newMsg.roomId === roomId) {
        setMessages((prev) => {
          // Avoid duplicate messages if already added
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Clear typing indicator for sender
        if (newMsg.sender?._id) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(newMsg.sender._id);
            return next;
          });
        }

        // Mark as read if user is viewing chat
        if (newMsg.sender?._id !== user?._id) {
          markMessagesRead(roomId);
        }

        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    };

    // Typing handlers
    const handleUserTyping = ({ roomId: rId, userId: uId, name }) => {
      if (rId === roomId && uId !== user?._id) {
        setTypingUsers((prev) => new Map(prev).set(uId, name || 'Teammate'));
      }
    };

    const handleUserStopTyping = ({ roomId: rId, userId: uId }) => {
      if (rId === roomId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(uId);
          return next;
        });
      }
    };

    // Read receipts handler
    const handleMessagesRead = ({ roomId: rId, userId: uId, readAt }) => {
      if (rId === roomId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.sender?._id === user?._id) {
              const alreadyMarked = (msg.readBy || []).some((r) => (r.user?._id || r.user) === uId);
              if (!alreadyMarked) {
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

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      leaveRoom(roomId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, projectId, roomId, user?._id, joinRoom, leaveRoom, markMessagesRead]);

  // Handle Input Changes & Debounced Typing Indicators
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    sendTyping(roomId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(roomId, false);
    }, 2000);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(roomId, false);

    setSending(true);
    setInputText('');

    sendMessage(
      {
        roomId,
        project: projectId,
        content: trimmed,
        type: 'text'
      },
      (response) => {
        setSending(false);
        if (response?.success && response?.data) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.data._id)) return prev;
            return [...prev, response.data];
          });
          setTimeout(() => scrollToBottom('smooth'), 50);
        }
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatMsgTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onlineMembersCount = members.filter((m) => isUserOnline(m.user?._id || m.user)).length;

  return (
    <div className={`flex flex-col h-[600px] bg-[#18181B] border border-[#27272A] rounded-3xl shadow-soft overflow-hidden ${className}`}>
      {/* Chat Room Header */}
      <div className="px-6 py-4 bg-[#111113] border-b border-[#27272A] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#FAFAFA] truncate">
              {projectTitle} • Team Chat
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-zinc-300 font-medium">
                  {isConnected ? `${onlineMembersCount} of ${members.length || 1} online` : 'Connecting...'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              <WifiOff className="w-3 h-3 text-zinc-400" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain divide-y divide-transparent"
      >
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading team messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA]">Welcome to your Team Workspace!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Start the conversation, align on tasks, share technical links, or coordinate hackathon milestones in real time.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const senderUser = msg.sender || {};
            const isOnline = isUserOnline(senderUser._id);
            const isReadByOthers = (msg.readBy || []).some(
              (r) => (r.user?._id || r.user)?.toString() !== user?._id?.toString()
            );

            return (
              <div
                key={msg._id || index}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for other members */}
                {!isMe && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={senderUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderUser.name || 'User'}`}
                      alt={senderUser.name}
                      className="w-8 h-8 rounded-xl object-cover border border-[#27272A] bg-[#111113]"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#18181B] ${
                        isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-zinc-300">
                        {senderUser.name || 'Teammate'}
                      </span>
                      {senderUser.headline && (
                        <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                          • {senderUser.headline}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-xs ${
                      isMe
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-br-xs'
                        : 'bg-[#111113] border border-[#27272A] text-zinc-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Message Meta / Timestamp */}
                  <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-zinc-500 font-medium">
                    <span>{formatMsgTime(msg.createdAt)}</span>
                    {isMe && (
                      <span title={isReadByOthers ? 'Read by team' : 'Delivered'}>
                        {isReadByOthers ? (
                          <CheckCheck className="w-3 h-3 text-indigo-400 inline" />
                        ) : (
                          <Check className="w-3 h-3 text-zinc-500 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 py-1 animate-pulse">
            <div className="flex gap-1 py-1 px-2.5 rounded-full bg-[#111113] border border-[#27272A] items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1.5 text-[11px] text-zinc-400 font-medium">
                {Array.from(typingUsers.values()).join(', ')} is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-[#111113] border-t border-[#27272A] flex items-center gap-2 flex-shrink-0"
      >
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message to your team... (Enter to send)" : "Reconnecting to live server..."}
            disabled={!isConnected}
            rows={1}
            className="w-full resize-none bg-[#18181B] border border-[#27272A] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-2xl py-2.5 px-4 text-xs sm:text-sm text-[#FAFAFA] placeholder:text-zinc-500 focus:outline-none max-h-24 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || !isConnected || sending}
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
