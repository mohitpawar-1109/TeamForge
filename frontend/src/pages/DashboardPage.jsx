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

export const DashboardPage = () => {
  const { user } = useAuth();
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show3DMatcher, setShow3DMatcher] = useState(false);

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
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Ambient shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Welcome to TeamForge</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-sm text-brand-100 mt-1 max-w-xl">
            Find your next hackathon project or recruit the missing skills to make your idea a reality.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Sparkles}
            onClick={() => setShow3DMatcher(!show3DMatcher)}
            className="bg-white text-indigo-700 hover:bg-slate-50 border-transparent shadow-lg font-extrabold"
          >
            {show3DMatcher ? 'Close Matcher' : '✨ Find My Best Teammate'}
          </Button>
          <Link to="/projects/create">
            <Button variant="outline" size="md" icon={PlusCircle} className="text-white border-white/40 hover:bg-white/10">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeProjectsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Currently building</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Teams Joined</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{myProjects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Collaborating teams</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invitations</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pendingInvitesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Pending team requests</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{user?.pastProjectsCount || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Verified portfolio items</p>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Recommended Projects for You</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                AI MATCH
              </span>
            </h2>
            <p className="text-xs text-slate-500">Projects looking for skills that match your verified profile.</p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : recommendedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">No project recommendations available at the moment.</p>
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Your Current Projects</h3>
            <Link to="/my-projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all ({myProjects.length})
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-500 mb-3">You haven't created or joined any projects yet.</p>
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
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 transition-all"
                >
                  <div>
                    <Link to={`/projects/${proj._id}`} className="font-bold text-slate-900 text-sm hover:text-brand-600 transition-colors">
                      {proj.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{proj.category}</span>
                      <span>•</span>
                      <span>{proj.members?.length || 1} / {proj.teamSize} Members</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-slate-700">{proj.progress || 0}%</div>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-brand-500 h-full rounded-full" style={{ width: `${proj.progress || 0}%` }} />
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Invitations</h3>
            <Link to="/invitations" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          {invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No pending invitations right now.
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.slice(0, 3).map(inv => (
                <div key={inv._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{inv.project?.title}</span>
                    <span className="text-[10px] font-bold text-brand-600 uppercase">{inv.status}</span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">Role: {inv.role || 'Member'}</p>
                  <Link to="/invitations" className="text-[11px] font-bold text-brand-600 hover:underline mt-2 inline-block">
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
