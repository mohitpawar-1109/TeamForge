import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Layers,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Users,
  CheckCircle2,
  Code2,
  FolderTree,
  AlertTriangle,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Simple Markdown renderer for structured AI output
const MarkdownContent = ({ content }) => {
  if (!content) return null;

  // Split into lines for formatting
  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-[#F6E8E2]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-[#F6E8E2] mt-4 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CB6B5A]" />
              <span>{trimmed.replace('### ', '')}</span>
            </h3>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-[#DDA081] mt-3 mb-1.5 uppercase tracking-wide">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
          const isDone = trimmed.startsWith('- [x] ');
          return (
            <div key={idx} className="flex items-start gap-2.5 py-0.5">
              <div
                className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                  isDone
                    ? 'bg-[#5B8A68] border-[#5B8A68] text-white'
                    : 'border-[#703344] bg-[#281A21] text-transparent'
                }`}
              >
                <Check className="w-3 h-3" />
              </div>
              <span className={isDone ? 'line-through text-[#DDA081]' : 'text-[#F6E8E2]'}>
                {trimmed.replace(/- \[[ x]\] /, '')}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#CB6B5A] font-bold">•</span>
              <span>{text}</span>
            </div>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-[#CB6B5A] pl-3.5 py-1 text-xs text-[#DDA081] italic bg-[#703344]/30 rounded-r-lg"
            >
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        if (trimmed.startsWith('```')) {
          return null; // Ignore fence lines in simple view
        }

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
};

export const AiProjectMentorView = ({ projectId, projectData, onBack }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [messages, setMessages] = useState([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch conversation history and tailored prompts
  const loadMentorHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await aiAPI.getMentorHistory(projectId);
      if (res.data?.success) {
        setMessages(res.data.data || []);
        setSuggestedPrompts(res.data.suggestedPrompts || []);
        setProjectSummary(res.data.projectSummary || null);
      }
    } catch (err) {
      console.warn('Failed to load mentor history:', err.message);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadMentorHistory();
    }
  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Submit query
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      user: { name: user?.name, avatar: user?.avatar },
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      // Pass recent history for multi-turn context
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiAPI.askMentor(projectId, {
        prompt: textToSend.trim(),
        history: historyPayload
      });

      if (res.data?.success) {
        const assistantMsg = res.data.data;
        setMessages((prev) => [...prev, assistantMsg]);
        if (res.data.contextSummary) {
          setProjectSummary((prev) => ({
            ...prev,
            ...res.data.contextSummary
          }));
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'AI Mentor encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (window.confirm('Clear all conversation history with the AI Mentor for this project?')) {
      try {
        await aiAPI.clearMentorHistory(projectId);
        setMessages([]);
        success('Conversation history cleared.');
      } catch (err) {
        error('Failed to clear conversation.');
      }
    }
  };

  // Copy answer to clipboard
  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Keyboard shortcut: Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[760px] max-h-[82vh] bg-[#4A2A35] border border-[#703344] rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Top Mentor Header */}
      <div className="p-4 sm:p-5 bg-[#281A21] border-b border-[#703344] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#A84A4D] via-[#CB6B5A] to-[#DDA081] p-0.5 shadow-lg shadow-[#A84A4D]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#281A21] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#CB6B5A]" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#5B8A68] rounded-full ring-2 ring-[#281A21]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#F6E8E2] tracking-tight">
                AI Project Mentor
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                Gemini 1.5 Flash
              </span>
            </div>
            <p className="text-xs text-[#DDA081] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{projectSummary?.title || projectData?.title || 'Project Workspace'}</span>
              {projectSummary?.readinessScore !== undefined && (
                <span className="text-[#CB6B5A] font-semibold">• {projectSummary.readinessScore}% Team Readiness</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-2 text-[#DDA081] hover:text-[#E07D82] hover:bg-[#C04A4D]/20 rounded-xl border border-transparent hover:border-[#C04A4D]/40 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-[#703344] hover:bg-[#A84A4D] text-[#F6E8E2] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 divide-y divide-transparent">
        {fetchingHistory ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#A84A4D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#DDA081]">Loading project context & mentor memory...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State & Welcome Card */
          <div className="py-8 px-2 max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center mx-auto shadow-inner">
              <Bot className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-[#F6E8E2] mb-1.5">
                Hi! I'm your TeamForge Project Mentor 👋
              </h4>
              <p className="text-xs text-[#DDA081] leading-relaxed max-w-md mx-auto">
                I'm synced with your project overview, required skills, team composition, and sprint tasks. Ask me anything to jumpstart your progress!
              </p>
            </div>

            {/* Quick Starter Prompts */}
            <div className="text-left pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#DDA081] mb-3 text-center">
                Frequently Asked Mentor Questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(suggestedPrompts.length > 0 ? suggestedPrompts : [
                  { icon: '🚀', title: 'What should we build first?', prompt: 'What should we build first for our MVP?' },
                  { icon: '🛠️', title: 'What tech stack should we use?', prompt: 'What technologies should we use for this project?' },
                  { icon: '📋', title: 'What tasks should we create?', prompt: 'What tasks should we create for our sprint backlog?' },
                  { icon: '🧩', title: 'What skills are missing?', prompt: 'What skills are missing from our current team?' }
                ]).map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3 bg-[#281A21] hover:bg-[#703344]/50 border border-[#703344] hover:border-[#A84A4D]/60 rounded-2xl text-left transition-all group flex items-start gap-3 shadow-xs cursor-pointer active:scale-98"
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-[#F6E8E2] group-hover:text-[#CB6B5A] transition-colors">
                        {item.title}
                      </h5>
                      {item.subtitle && (
                        <p className="text-[10px] text-[#DDA081] truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#DDA081] group-hover:text-[#CB6B5A] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg._id || idx}
                className={`flex items-start gap-3 sm:gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-[#A84A4D] text-[#F6E8E2] shadow-xs'
                      : 'bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 relative group shadow-md ${
                    isUser
                      ? 'bg-[#A84A4D] text-[#F6E8E2] rounded-tr-xs'
                      : 'bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      <MarkdownContent content={msg.content} />

                      {/* Assistant Message Actions */}
                      <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[#703344]/60 text-[11px] text-[#DDA081]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#CB6B5A]" />
                          <span>AI Mentor</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="flex items-center gap-1 hover:text-[#CB6B5A] transition-colors cursor-pointer"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-[#86B190]" />
                              <span className="text-[#86B190] font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Advice</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-[#281A21] border border-[#703344] rounded-3xl rounded-tl-xs p-4 sm:p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A84A4D] animate-ping" />
                <span className="text-xs font-bold text-[#CB6B5A]">
                  AI Mentor is analyzing project architecture & squad skills...
                </span>
              </div>
              <div className="flex gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-[#703344] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-[#703344] animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-[#703344] animate-pulse delay-300" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (when in active chat) */}
      {messages.length > 0 && !loading && (
        <div className="px-4 py-2 bg-[#281A21]/90 border-t border-[#703344] overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] font-black uppercase text-[#DDA081] flex items-center gap-1 flex-shrink-0">
            <Lightbulb className="w-3 h-3 text-[#E5B079]" /> Suggested:
          </span>
          {(suggestedPrompts.length > 0 ? suggestedPrompts : [
            { icon: '🚀', title: 'What to build first?', prompt: 'What should we build first for our MVP?' },
            { icon: '🛠️', title: 'Tech Stack?', prompt: 'What technologies should we use for this project?' },
            { icon: '📋', title: 'Sprint Tasks?', prompt: 'What tasks should we create for our sprint backlog?' },
            { icon: '⚠️', title: 'Technical Risks?', prompt: 'What are the possible technical risks?' },
            { icon: '👥', title: 'Divide Tasks?', prompt: 'How can we divide tasks among team members?' }
          ]).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="px-2.5 py-1 bg-[#4A2A35] hover:bg-[#703344] text-[#F6E8E2] hover:text-[#CB6B5A] text-[11px] font-semibold rounded-xl border border-[#703344] hover:border-[#A84A4D]/40 transition-all whitespace-nowrap flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <span>{item.icon}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Field */}
      <div className="p-3 sm:p-4 bg-[#281A21] border-t border-[#703344] z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#4A2A35] border border-[#703344] focus-within:border-[#CB6B5A] rounded-2xl p-1.5 transition-all shadow-inner"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask mentor: 'What should we build first?', 'What tech stack?', 'Sprint tasks?'..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 bg-transparent px-3.5 py-2 text-xs sm:text-sm text-[#F6E8E2] placeholder-[#DDA081]/60 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] hover:from-[#CB6B5A] hover:to-[#DDA081] disabled:opacity-40 disabled:hover:from-[#A84A4D] disabled:hover:to-[#CB6B5A] text-[#F6E8E2] hover:text-[#281A21] rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
