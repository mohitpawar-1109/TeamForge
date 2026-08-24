import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Shield, ArrowLeft, LogOut, Sparkles, CheckCircle2, Mail, MessageSquare, Network, Bot, Video, BarChart3 } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { SkillGapVisualizer } from '../components/matching/SkillGapVisualizer';
import { TeamChatRoom } from '../components/chat/TeamChatRoom';
import { AiTeamRecommendationPanel } from '../components/matching/AiTeamRecommendationPanel';
import { AiProjectMentorView } from '../components/ai/AiProjectMentorView';
import { TeamTopology3D } from '../components/team/TeamTopology3D';
import { TeamVideoMeeting } from '../components/video/TeamVideoMeeting';
import { TeamPerformanceAnalytics } from '../components/analytics/TeamPerformanceAnalytics';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Star } from 'lucide-react';

export const ProjectTeamPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { success, error } = useToast();

  const [project, setProject] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [projRes, gapRes] = await Promise.all([
        projectAPI.getProjectById(id),
        projectAPI.getSkillGap(id)
      ]);

      if (projRes.data.success) setProject(projRes.data.data);
      if (gapRes.data.success) setSkillGap(gapRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this project team?')) {
      try {
        await projectAPI.leaveTeam(id);
        success('You have left the team.');
        fetchTeamData();
      } catch (err) {
        error(err.response?.data?.message || 'Failed to leave team.');
      }
    }
  };

  if (loading) return <div className="h-64 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />;
  if (!project) return <div className="text-xs font-mono text-[#888888]">Project not found</div>;

  const isOwner = user && (project.owner?._id === user._id || project.owner === user._id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#888888] hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
            Team Workspace & Collaboration
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#888888] mt-1">
            Real-time chat, video collaboration, 3D topology, and AI mentoring for <span className="text-[#F5F5F5] font-bold">{project.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className="px-4 py-2 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(229,9,20,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Video Sync</span>
          </button>

          {isOwner ? (
            <Link to={`/projects/${id}/matches`}>
              <Button variant="outline" size="md" icon={Sparkles}>
                Find Teammates
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="md" icon={LogOut} onClick={handleLeaveTeam}>
              Leave Team
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1F1F1F] gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#E50914]" />
          <span>Team Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'chat'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#888888]" />
          <span>Real-time Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'video'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-[#888888]" />
          <span>Video Meeting</span>
        </button>

        <button
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'topology'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-[#888888]" />
          <span>3D Topology</span>
        </button>

        <button
          onClick={() => setActiveTab('mentor')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'mentor'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-[#E50914]" />
          <span>AI Mentor</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'roster'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#888888]" />
          <span>Roster & Skill Gap ({project.members?.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'recommendations'
              ? 'border-[#E50914] text-[#F5F5F5]'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
          <span>AI Recommendations</span>
        </button>
      </div>

      {/* Tab: Team Performance Analytics */}
      {activeTab === 'analytics' && (
        <TeamPerformanceAnalytics projectId={project._id} />
      )}

      {/* Tab: Video Meeting */}
      {activeTab === 'video' && (
        <TeamVideoMeeting
          roomId={`project-${project._id}`}
          projectId={project._id}
          onLeave={() => setActiveTab('chat')}
        />
      )}

      {/* Tab: 3D Team Topology */}
      {activeTab === 'topology' && (
        <TeamTopology3D project={project} />
      )}

      {/* Tab: AI Project Mentor */}
      {activeTab === 'mentor' && (
        <AiProjectMentorView
          projectId={project._id}
          projectData={project}
        />
      )}

      {/* Tab: AI Recommendations Panel */}
      {activeTab === 'recommendations' && (
        <AiTeamRecommendationPanel
          projectId={project._id}
          onInviteSent={() => fetchTeamData()}
        />
      )}

      {/* Tab: Real-time Team Chatroom */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <TeamChatRoom
              projectId={project._id}
              projectTitle={project.title}
              members={project.members || []}
            />
          </div>

          {/* Quick Team Presence Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Team Presence</span>
              </h4>

              <div className="space-y-2.5">
                {(project.members || []).map((m, idx) => {
                  const memberUser = m.user;
                  if (!memberUser) return null;
                  const isOnline = isUserOnline(memberUser._id);

                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#161616] border border-[#242424]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={memberUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberUser.name}`}
                            alt={memberUser.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#242424] bg-[#111111]"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#161616] ${
                              isOnline ? 'bg-[#20D47A]' : 'bg-[#666666]'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{memberUser.name}</p>
                          <p className="text-[10px] font-mono text-[#888888] truncate">{m.role || 'Member'}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isOnline ? 'bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30' : 'bg-[#111111] text-[#666666]'
                      }`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Kanban tasks shortcut */}
            <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft">
              <h4 className="text-xs font-mono font-bold text-[#F5F5F5] mb-1.5">// SPRINT_TASKS</h4>
              <p className="text-xs font-mono text-[#888888] mb-3">Organize sprint milestones and task boards in real time.</p>
              <Link to={`/projects/${project._id}/tasks`}>
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Open Kanban Board →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Full Skill Gap Visualizer & Member Roster Cards */}
      {activeTab === 'roster' && (
        <div className="space-y-8">
          <SkillGapVisualizer
            gapData={skillGap}
            projectId={project._id}
            projectTitle={project.title}
            onInviteSent={() => fetchTeamData()}
          />

          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#888888] mb-4">// CURRENT_ROSTER</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(project.members || []).map((m, idx) => {
                const memberUser = m.user;
                if (!memberUser) return null;
                const isOnline = isUserOnline(memberUser._id);

                return (
                  <div key={idx} className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={memberUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberUser.name}`}
                          alt={memberUser.name}
                          className="w-11 h-11 rounded-full object-cover border border-[#242424] bg-[#161616]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#111111] ${
                            isOnline ? 'bg-[#20D47A]' : 'bg-[#666666]'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-[#F5F5F5] text-xs truncate">{memberUser.name}</h4>
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[#A1A1A1]">
                            {m.role || 'Member'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-[#888888] truncate">{memberUser.headline}</p>
                        <p className="text-[10px] font-mono text-[#666666] mt-0.5 truncate">{memberUser.college}</p>
                      </div>
                    </div>

                    {/* Skills chips */}
                    <div className="mb-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#888888] block mb-1">Contributed Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {(memberUser.skills || []).map((s, sIdx) => (
                          <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 bg-[#161616] text-[#F5F5F5] rounded-full border border-[#242424]">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-[10px] font-mono text-[#888888]">
                      <div className="flex items-center gap-2">
                        <span>Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}</span>
                        {project.status === 'Completed' && memberUser._id !== user?._id && (
                          <button
                            onClick={() => setFeedbackTarget(memberUser)}
                            className="font-bold text-[#20D47A] border border-[#20D47A]/30 bg-[#20D47A]/10 hover:bg-[#20D47A]/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                          >
                            + Add Feedback
                          </button>
                        )}
                      </div>
                      <Link to={`/profile?id=${memberUser._id}`} className="font-bold text-[#E50914] hover:underline">
                        View Profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <FeedbackModal
        isOpen={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        targetUser={feedbackTarget}
        projectId={project._id}
      />
    </div>
  );
};
