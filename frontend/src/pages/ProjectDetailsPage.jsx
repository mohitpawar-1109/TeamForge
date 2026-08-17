import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  UserPlus,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight,
  Trash2,
  Brain
} from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillGapVisualizer } from '../components/matching/SkillGapVisualizer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, gapRes] = await Promise.all([
        projectAPI.getProjectById(id),
        projectAPI.getSkillGap(id)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data);
      }
      if (gapRes.data.success) {
        setSkillGap(gapRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        await projectAPI.deleteProject(id);
        success('Project removed.');
        navigate('/my-projects');
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse" />
        <div className="h-64 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Project not found.</p>
        <Link to="/projects" className="text-indigo-400 font-bold mt-2 inline-block">Back to Explore</Link>
      </div>
    );
  }

  const isOwner = user && project.owner && ((project.owner._id && project.owner._id.toString() === user._id.toString()) || project.owner.toString() === user._id.toString());
  const isMember = user && project.members?.some(m => (m.user?._id && m.user._id.toString() === user._id.toString()) || m.user?.toString() === user._id.toString());

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#27272A]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                {project.category}
              </span>
              <Badge variant="brand">{project.difficulty} Difficulty</Badge>
              <Badge variant={project.status === 'Recruiting' ? 'success' : 'purple'}>{project.status}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Created by <span className="font-semibold text-zinc-200">{project.owner?.name}</span> • Duration: {project.duration}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {isMember && (
              <Link to={`/projects/${project._id}/tasks`}>
                <Button variant="primary" size="md" icon={FolderKanban}>
                  Project Tasks
                </Button>
              </Link>
            )}

            {isOwner && (
              <Link to={`/projects/${project._id}/matches`}>
                <Button variant="gradient" size="md" icon={UserPlus}>
                  Find Teammates
                </Button>
              </Link>
            )}

            <Link to={`/projects/${project._id}/team`}>
              <Button variant="outline" size="md" icon={Users}>
                Team Roster
              </Button>
            </Link>

            {isOwner && (
              <button
                onClick={handleDeleteProject}
                title="Delete Project"
                className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Description */}
        <div className="py-6 border-b border-[#27272A]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Overview & Objectives</h3>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-4xl">
            {project.description}
          </p>
        </div>

        {/* Required Skills & Roles */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {(project.requiredSkills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#111113] text-zinc-300 border border-[#27272A]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Team Capacity</h4>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <Users className="w-5 h-5 text-zinc-500" />
              <span className="font-bold">{project.members?.length || 1} / {project.teamSize} Formed</span>
              <div className="flex-1 bg-[#111113] h-2 rounded-full overflow-hidden max-w-[150px] border border-[#27272A]">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${((project.members?.length || 1) / project.teamSize) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Team Skill Gap Visualizer */}
      <SkillGapVisualizer
        gapData={skillGap}
        projectId={project._id}
        projectTitle={project.title}
        onInviteSent={() => fetchProject()}
      />

      {/* AI Insights Card if analyzed */}
      {project.aiAnalysis?.analyzed && (
        <div className="bg-indigo-950/20 rounded-3xl border border-indigo-500/30 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-[#FAFAFA]">AI Architectural Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="font-bold text-zinc-300 block mb-2">Suggested Team Roles:</span>
              <div className="flex flex-wrap gap-1.5">
                {(project.aiAnalysis.suggestedRoles || []).map((role, idx) => (
                  <Badge key={idx} variant="purple">{role}</Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-zinc-300 block mb-2">Potential Technical Challenges:</span>
              <ul className="space-y-1 text-zinc-300">
                {(project.aiAnalysis.potentialChallenges || []).map((ch, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{ch}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
