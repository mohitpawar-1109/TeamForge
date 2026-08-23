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

  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-xs sm:text-sm font-mono leading-relaxed text-[#F5F5F5]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-[#F5F5F5] mt-4 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
              <span>{trimmed.replace('### ', '')}</span>
            </h3>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-[#888888] mt-3 mb-1.5 uppercase tracking-wider">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
          const isDone = trimmed.startsWith('- [x] ');
          return (
            <div key={idx} className="flex items-start gap-2.5 py-0.5">
              <div
                className={`w-3.5 h-3.5 rounded border mt-0.5 flex items-center justify-center ${
                  isDone
                    ? 'bg-[#20D47A] border-[#20D47A] text-black'
                    : 'border-[#242424] bg-[#111111] text-transparent'
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </div>
              <span className={isDone ? 'line-through text-[#666666]' : 'text-[#F5F5F5]'}>
                {trimmed.replace(/- \[[ x]\] /, '')}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#E50914] font-bold">•</span>
              <span>{text}</span>
            </div>
          );
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-[#E50914] pl-3.5 py-1 text-xs text-[#888888] italic bg-[#161616] rounded-r-lg"
            >
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        if (trimmed.startsWith('```')) {
          return null;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[760px] max-h-[82vh] bg-[#111111] border border-[#242424] rounded-3xl shadow-soft overflow-hidden relative">
      {/* Top Mentor Header */}
      <div className="p-4 sm:p-5 bg-[#0A0A0A] border-b border-[#1F1F1F] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#242424] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#E50914]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#20D47A] rounded-full ring-2 ring-[#0A0A0A]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#F5F5F5] tracking-tight">
                AI Project Mentor
              </h3>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                Gemini 1.5 Flash
              </span>
            </div>
            <p className="text-xs font-mono text-[#888888] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{projectSummary?.title || projectData?.title || 'Project Workspace'}</span>
              {projectSummary?.readinessScore !== undefined && (
                <span className="text-[#20D47A] font-semibold">• {projectSummary.readinessScore}% Team Readiness</span>
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
              className="p-2 text-[#888888] hover:text-[#FF1F2D] hover:bg-[#FF1F2D]/10 rounded-full border border-transparent hover:border-[#FF1F2D]/30 transition-all text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[#F5F5F5] text-xs font-mono font-bold rounded-full transition-all cursor-pointer"
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
            <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#888888]">Loading project context & mentor memory...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State & Welcome Card */
          <div className="py-8 px-2 max-w-2xl mx-auto text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center mx-auto shadow-inner">
              <Bot className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-[#F5F5F5] mb-1.5">
                Hi! I'm your TeamForge Project Mentor 👋
              </h4>
              <p className="text-xs font-mono text-[#888888] leading-relaxed max-w-md mx-auto">
                I'm synced with your project overview, required skills, team composition, and sprint tasks. Ask me anything to jumpstart your progress!
              </p>
            </div>

            {/* Quick Starter Prompts */}
            <div className="text-left pt-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] mb-3 text-center">
                // SUGGESTED_MENTOR_QUERIES
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
                    className="p-3 bg-[#161616] hover:bg-[#202020] border border-[#242424] hover:border-[#333333] rounded-2xl text-left transition-all group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-mono font-bold text-[#F5F5F5] group-hover:text-white transition-colors">
                        {item.title}
                      </h5>
                      {item.subtitle && (
                        <p className="text-[10px] font-mono text-[#888888] truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
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
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold ${
                    isUser
                      ? 'bg-white text-black'
                      : 'bg-[#161616] border border-[#242424] text-[#E50914]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 relative group shadow-md ${
                    isUser
                      ? 'bg-white text-black'
                      : 'bg-[#161616] border border-[#242424] text-[#F5F5F5]'
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      <MarkdownContent content={msg.content} />

                      <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[#242424] text-[10px] font-mono text-[#888888]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#E50914]" />
                          <span>AI Mentor</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-[#20D47A]" />
                              <span className="text-[#20D47A] font-semibold">Copied</span>
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

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="bg-[#161616] border border-[#242424] rounded-3xl p-4 sm:p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
                <span className="text-xs font-mono font-bold text-[#E50914]">
                  AI Mentor is analyzing project architecture & squad skills...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      {messages.length > 0 && !loading && (
        <div className="px-4 py-2 bg-[#0A0A0A] border-t border-[#1F1F1F] overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[9px] font-mono font-bold uppercase text-[#888888] flex items-center gap-1 flex-shrink-0">
            <Lightbulb className="w-3 h-3 text-[#F2B705]" /> Suggested:
          </span>
          {(suggestedPrompts.length > 0 ? suggestedPrompts : [
            { icon: '🚀', title: 'What to build first?', prompt: 'What should we build first for our MVP?' },
            { icon: '🛠️', title: 'Tech Stack?', prompt: 'What technologies should we use for this project?' },
            { icon: '📋', title: 'Sprint Tasks?', prompt: 'What tasks should we create for our sprint backlog?' },
            { icon: '⚠️', title: 'Technical Risks?', prompt: 'What are the possible technical risks?' }
          ]).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white text-[10px] font-mono font-bold rounded-full border border-[#242424] transition-all whitespace-nowrap flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <span>{item.icon}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Field */}
      <div className="p-3 sm:p-4 bg-[#0A0A0A] border-t border-[#1F1F1F] z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#161616] border border-[#242424] focus-within:border-[#E50914] rounded-full px-3 py-1.5 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask mentor: 'What should we build first?', 'What tech stack?', 'Sprint tasks?'..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm font-mono text-[#F5F5F5] placeholder-[#555555] focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-2 bg-[#E50914] hover:bg-[#FF1F2D] disabled:opacity-40 text-white rounded-full transition-all shadow-[0_0_10px_rgba(229,9,20,0.4)] cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
