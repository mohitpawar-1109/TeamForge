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

  if (hour >= 5 && hour < 12) {
    return { text: 'Good morning', emoji: '👋' };
  }

  if (hour >= 12 && hour < 17) {
    return { text: 'Good afternoon', emoji: '👋' };
  }

  if (hour >= 17 && hour < 21) {
    return { text: 'Good evening', emoji: '👋' };
  }

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
    <div className="space-y-8">
      {/* Header Greeting Banner */}
      <div className="bg-gradient-to-r from-[#4A2A35] via-[#703344] to-[#A84A4D] rounded-3xl p-6 sm:p-8 text-[#F6E8E2] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden border border-[#703344]">
        {/* Ambient shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#CB6B5A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#281A21]/40 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3 text-[#F6E8E2] border border-[#703344]">
            <Sparkles className="w-3.5 h-3.5 text-[#CB6B5A]" />
            <span>Welcome to TeamForge</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F6E8E2]">
            {greeting.text}, {user?.name || 'Student'} {greeting.emoji}
          </h1>
          <p className="text-sm text-[#F6E8E2]/90 mt-1 max-w-xl">
            Find your next hackathon project or recruit the missing skills to make your idea a reality.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Sparkles}
            onClick={() => setShow3DMatcher(!show3DMatcher)}
            className="bg-[#281A21] text-[#F6E8E2] hover:bg-[#703344] border border-[#703344] shadow-lg font-extrabold"
          >
            {show3DMatcher ? 'Close Matcher' : '✨ Find My Best Teammate'}
          </Button>
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
        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 shadow-soft hover:border-[#A84A4D]/60 transition-all">
          <div className="flex items-center justify-between text-[#DDA081] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DDA081]">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-[#281A21] text-[#CB6B5A] border border-[#703344] flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2]">{activeProjectsCount}</div>
          <p className="text-[11px] text-[#DDA081] mt-1 font-medium">Currently building</p>
        </div>

        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 shadow-soft hover:border-[#A84A4D]/60 transition-all">
          <div className="flex items-center justify-between text-[#DDA081] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DDA081]">Teams Joined</span>
            <div className="w-8 h-8 rounded-xl bg-[#281A21] text-[#CB6B5A] border border-[#703344] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2]">{myProjects.length}</div>
          <p className="text-[11px] text-[#DDA081] mt-1 font-medium">Collaborating teams</p>
        </div>

        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 shadow-soft hover:border-[#A84A4D]/60 transition-all">
          <div className="flex items-center justify-between text-[#DDA081] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DDA081]">Invitations</span>
            <div className="w-8 h-8 rounded-xl bg-[#281A21] text-[#86B190] border border-[#703344] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2]">{pendingInvitesCount}</div>
          <p className="text-[11px] text-[#DDA081] mt-1 font-medium">Pending team requests</p>
        </div>

        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 shadow-soft hover:border-[#A84A4D]/60 transition-all">
          <div className="flex items-center justify-between text-[#DDA081] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DDA081]">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-[#281A21] text-[#DDA081] border border-[#703344] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2]">{user?.pastProjectsCount || 0}</div>
          <p className="text-[11px] text-[#DDA081] mt-1 font-medium">Verified portfolio items</p>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#F6E8E2] flex items-center gap-2">
              <span>Recommended Projects for You</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                AI MATCH
              </span>
            </h2>
            <p className="text-xs text-[#DDA081]">Projects looking for skills that match your verified profile.</p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-[#CB6B5A] hover:text-[#DDA081] flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-[#4A2A35] border border-[#703344] animate-pulse" />
            ))}
          </div>
        ) : recommendedProjects.length === 0 ? (
          <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-8 text-center">
            <p className="text-sm text-[#DDA081]">No project recommendations available at the moment.</p>
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
        <div className="lg:col-span-2 bg-[#4A2A35] rounded-2xl border border-[#703344] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#703344]">
            <h3 className="text-base font-bold text-[#F6E8E2]">Your Current Projects</h3>
            <Link to="/my-projects" className="text-xs font-semibold text-[#CB6B5A] hover:text-[#DDA081]">
              View all ({myProjects.length})
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[#DDA081] mb-3">You haven't created or joined any projects yet.</p>
              <Link to="/projects/create">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.slice(0, 3).map(proj => (
                <div
                  key={proj._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/60 transition-all"
                >
                  <div>
                    <Link to={`/projects/${proj._id}`} className="font-bold text-[#F6E8E2] text-sm hover:text-[#CB6B5A] transition-colors">
                      {proj.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-[#DDA081] mt-1">
                      <span>{proj.category}</span>
                      <span>•</span>
                      <span>{proj.members?.length || 1} / {proj.teamSize} Members</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-[#F6E8E2]">{proj.progress || 0}%</div>
                      <div className="w-16 bg-[#4A2A35] h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#A84A4D] h-full rounded-full" style={{ width: `${proj.progress || 0}%` }} />
                      </div>
                    </div>
                    <Link to={`/projects/${proj._id}`}>
                      <Button variant="outline" size="sm">
                        Workspace
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations Panel */}
        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#703344]">
            <h3 className="text-base font-bold text-[#F6E8E2]">Recent Invitations</h3>
            <Link to="/invitations" className="text-xs font-semibold text-[#CB6B5A] hover:text-[#DDA081]">
              View all
            </Link>
          </div>

          {invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#DDA081]">
              No pending invitations right now.
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.slice(0, 3).map(inv => (
                <div key={inv._id} className="p-3 rounded-xl bg-[#281A21] border border-[#703344] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#F6E8E2]">{inv.project?.title}</span>
                    <span className="text-[10px] font-bold text-[#CB6B5A] uppercase">{inv.status}</span>
                  </div>
                  <p className="text-[#DDA081] line-clamp-1">Role: {inv.role || 'Member'}</p>
                  <Link to="/invitations" className="text-[11px] font-bold text-[#CB6B5A] hover:underline mt-2 inline-block">
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
