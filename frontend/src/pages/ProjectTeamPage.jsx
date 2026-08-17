import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Shield, ArrowLeft, LogOut, Sparkles, CheckCircle2, Mail, MessageSquare, Network, Bot, Video } from 'lucide-react';
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
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const ProjectTeamPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { success, error } = useToast();

  const [project, setProject] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'video' | 'topology' | 'mentor' | 'roster' | 'recommendations'

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

  if (loading) return <div className="h-64 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse" />;
  if (!project) return <div className="text-zinc-400">Project not found</div>;

  const isOwner = user && (project.owner?._id === user._id || project.owner === user._id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            Team Workspace & Collaboration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time chat, video collaboration, 3D topology, and AI mentoring for <span className="text-zinc-200 font-bold">{project.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Join Video Sync</span>
          </button>

          {isOwner ? (
            <Link to={`/projects/${id}/matches`}>
              <Button variant="gradient" size="md" icon={Sparkles}>
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
      <div className="flex border-b border-[#27272A] gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Real-time Team Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'video'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Video className="w-4 h-4 text-emerald-400" />
          <span>📹 Video Meeting</span>
        </button>

        <button
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'topology'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Network className="w-4 h-4 text-cyan-400" />
          <span>🌐 3D Team Topology</span>
        </button>

        <button
          onClick={() => setActiveTab('mentor')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'mentor'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>⚡ AI Project Mentor</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'roster'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Roster & Skill Gap ({project.members?.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>✨ AI Squad Recommendations</span>
        </button>
      </div>

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

      {/* Tab 3: AI Squad Recommendations Panel */}
      {activeTab === 'recommendations' && (
        <AiTeamRecommendationPanel
          projectId={project._id}
          onInviteSent={() => fetchTeamData()}
        />
      )}

      {/* Tab 1: Real-time Team Chatroom */}
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
            <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-5 shadow-soft">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Team Presence</span>
              </h4>

              <div className="space-y-3">
                {(project.members || []).map((m, idx) => {
                  const memberUser = m.user;
                  if (!memberUser) return null;
                  const isOnline = isUserOnline(memberUser._id);

                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#111113] border border-[#27272A]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={memberUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberUser.name}`}
                            alt={memberUser.name}
                            className="w-8 h-8 rounded-xl object-cover border border-[#27272A] bg-[#18181B]"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#111113] ${
                              isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#FAFAFA] truncate">{memberUser.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{m.role || 'Member'}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOnline ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Kanban tasks shortcut */}
            <div className="bg-indigo-950/20 rounded-3xl border border-indigo-500/30 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">Team Sprint Tasks</h4>
              <p className="text-xs text-zinc-300 mb-3">Organize sprint milestones and task boards in real time.</p>
              <Link to={`/projects/${project._id}/tasks`}>
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Open Kanban Board →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full Skill Gap Visualizer & Member Roster Cards */}
      {activeTab === 'roster' && (
        <div className="space-y-8">
          <SkillGapVisualizer
            gapData={skillGap}
            projectId={project._id}
            projectTitle={project.title}
            onInviteSent={() => fetchTeamData()}
          />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Current Team Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(project.members || []).map((m, idx) => {
                const memberUser = m.user;
                if (!memberUser) return null;
                const isOnline = isUserOnline(memberUser._id);

                return (
                  <div key={idx} className="bg-[#18181B] rounded-2xl border border-[#27272A] p-5 shadow-soft">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={memberUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberUser.name}`}
                          alt={memberUser.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#27272A] bg-[#111113]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#18181B] ${
                            isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-[#FAFAFA] text-sm truncate">{memberUser.name}</h4>
                          <Badge variant="brand" size="sm">{m.role || 'Member'}</Badge>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{memberUser.headline}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{memberUser.college}</p>
                      </div>
                    </div>

                    {/* Skills chips */}
                    <div className="mb-4">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">Contributed Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {(memberUser.skills || []).map((s, sIdx) => (
                          <span key={sIdx} className="text-[11px] font-medium px-2 py-0.5 bg-[#111113] text-zinc-300 rounded border border-[#27272A]">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}</span>
                      <Link to={`/profile?id=${memberUser._id}`} className="font-semibold text-indigo-400 hover:underline">
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
    </div>
  );
};
