import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  Mail,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectAPI, inviteAPI } from '../services/api';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/common/Button';
import { TeamRequestsSection } from '../components/community/TeamRequestsSection';
import { AiMatchVisualizer3D } from '../components/matching/AiMatchVisualizer3D';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '👋' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '👋' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '👋' };
  return { text: 'Good night', emoji: '🌙' };
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show3DMatcher, setShow3DMatcher] = useState(false);

  const greeting = getGreeting();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projRes, myProjRes, invRes] = await Promise.all([
          projectAPI.getProjects({ sort: 'best_match' }),
          projectAPI.getProjects({ member: user?._id }),
          inviteAPI.getInvitations()
        ]);

        if (projRes.data.success) {
          const currentUserId = user?._id?.toString();
          const unjoined = projRes.data.data.filter(p => !p.members?.some(m => {
            const memberId = (m.user?._id || m.user)?.toString();
            return memberId === currentUserId;
          }));
          setRecommendedProjects(unjoined.slice(0, 3));
        }

        if (myProjRes.data.success) {
          setMyProjects(myProjRes.data.data);
        }

        if (invRes.data.success) {
          setInvitations(invRes.data.data.received || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const activeProjectsCount = myProjects.filter(p => p.status === 'In Progress' || p.status === 'Recruiting').length;
  const completedProjectsCount = myProjects.filter(p => p.status === 'Completed').length;
  const pendingInvitesCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Greeting Banner */}
      <div className="bg-[#111111] rounded-3xl p-6 sm:p-8 text-[#F5F5F5] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden border border-[#242424]">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161616] text-[10px] font-mono font-bold uppercase tracking-wider mb-3 text-[#A1A1A1] border border-[#242424]">
            <Sparkles className="w-3 h-3 text-[#E50914]" />
            <span>Welcome to TeamForge</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
            {greeting.text}, {user?.name || 'Student'} {greeting.emoji}
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 max-w-xl">
            Find your next hackathon project or recruit the missing skills to make your idea a reality.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShow3DMatcher(!show3DMatcher)}
            className="px-4 py-2.5 rounded-full bg-[#161616] hover:bg-[#222222] border border-[#242424] text-xs font-mono font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
            <span>{show3DMatcher ? 'Close Matcher' : 'Find My Best Teammate'}</span>
          </button>
          <Link to="/projects/create">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D AI Matcher Section */}
      {show3DMatcher && (
        <AiMatchVisualizer3D
          projectId={myProjects.length > 0 ? myProjects[0]._id : null}
          onClose={() => setShow3DMatcher(false)}
        />
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424] flex items-center justify-center">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F5]">{activeProjectsCount}</div>
          <p className="text-[10px] font-mono text-[#666666] mt-1">Currently building</p>
        </div>

        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Teams Joined</span>
            <div className="w-8 h-8 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F5]">{myProjects.length}</div>
          <p className="text-[10px] font-mono text-[#666666] mt-1">Collaborating teams</p>
        </div>

        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Invitations</span>
            <div className="w-8 h-8 rounded-full bg-[#161616] text-[#20D47A] border border-[#242424] flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#20D47A]">{pendingInvitesCount}</div>
          <p className="text-[10px] font-mono text-[#666666] mt-1">Pending requests</p>
        </div>

        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-[#888888] mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-full bg-[#161616] text-[#F2B705] border border-[#242424] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F5]">{user?.pastProjectsCount || 0}</div>
          <p className="text-[10px] font-mono text-[#666666] mt-1">Verified portfolio</p>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <span>Recommended Projects for You</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-[#161616] text-[#E50914] border border-[#242424]">
                AI MATCH
              </span>
            </h2>
            <p className="text-xs text-[#888888]">Projects looking for skills that match your profile.</p>
          </div>
          <Link to="/projects" className="text-xs font-mono font-bold text-[#E50914] hover:underline flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />
            ))}
          </div>
        ) : recommendedProjects.length === 0 ? (
          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-8 text-center">
            <p className="text-xs font-mono text-[#888888]">No project recommendations available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedProjects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* MY ACTIVE PROJECTS & RECENT INVITATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Projects */}
        <div className="lg:col-span-2 bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F1F1F]">
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">Your Current Projects</h3>
            <Link to="/my-projects" className="text-xs font-mono text-[#888888] hover:text-white">
              View all ({myProjects.length})
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-mono text-[#888888] mb-3">You haven't created or joined any projects yet.</p>
              <Link to="/projects/create">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myProjects.slice(0, 3).map(proj => (
                <div
                  key={proj._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#161616] border border-[#242424] hover:border-[#333333] transition-all"
                >
                  <div>
                    <Link to={`/projects/${proj._id}`} className="font-bold text-[#F5F5F5] text-xs sm:text-sm hover:text-[#E50914] transition-colors">
                      {proj.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#888888] mt-1">
                      <span>{proj.category}</span>
                      <span>•</span>
                      <span>{proj.members?.length || 1} / {proj.teamSize} Members</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-mono font-bold text-[#F5F5F5]">{proj.progress || 0}%</div>
                      <div className="w-14 bg-[#111111] h-1 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#E50914] h-full rounded-full" style={{ width: `${proj.progress || 0}%` }} />
                      </div>
                    </div>
                    <Link to={`/projects/${proj._id}`}>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full text-xs font-mono bg-[#111111] hover:bg-[#202020] border border-[#242424] text-white"
                      >
                        Workspace
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations Panel */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F1F1F]">
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">Recent Invitations</h3>
            <Link to="/invitations" className="text-xs font-mono text-[#888888] hover:text-white">
              View all
            </Link>
          </div>

          {invitations.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#888888]">
              No pending invitations right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {invitations.slice(0, 3).map(inv => (
                <div key={inv._id} className="p-3 rounded-2xl bg-[#161616] border border-[#242424] text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#F5F5F5] text-xs">{inv.project?.title}</span>
                    <span className="text-[9px] font-bold text-[#20D47A] uppercase">{inv.status}</span>
                  </div>
                  <p className="text-[10px] text-[#888888] line-clamp-1">Role: {inv.role || 'Member'}</p>
                  <Link to="/invitations" className="text-[10px] font-bold text-[#E50914] hover:underline mt-2 inline-block">
                    Review Request →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COMMUNITY TEAM RECRUITMENT REQUESTS */}
      <TeamRequestsSection />
    </div>
  );
};
