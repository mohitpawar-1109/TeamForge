import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Shield, ArrowLeft, LogOut, Sparkles, CheckCircle2, Mail } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillGapVisualizer } from '../components/matching/SkillGapVisualizer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const ProjectTeamPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [project, setProject] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);

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
            Team Members & Skill Roster
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Project: <span className="font-bold text-zinc-200">{project.title}</span> • {project.members?.length || 1} / {project.teamSize} Formed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link to={`/projects/${id}/matches`}>
              <Button variant="gradient" size="md" icon={Sparkles}>
                Find More Teammates
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="md" icon={LogOut} onClick={handleLeaveTeam}>
              Leave Team
            </Button>
          )}
        </div>
      </div>

      {/* Full Skill Gap Visualizer Component */}
      <SkillGapVisualizer gapData={skillGap} projectId={project._id} />

      {/* Member Roster Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Current Team Roster</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(project.members || []).map((m, idx) => {
            const memberUser = m.user;
            if (!memberUser) return null;

            return (
              <div key={idx} className="bg-[#18181B] rounded-2xl border border-[#27272A] p-5 shadow-soft">
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={memberUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberUser.name}`}
                    alt={memberUser.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#27272A] bg-[#111113] flex-shrink-0"
                  />
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
  );
};
