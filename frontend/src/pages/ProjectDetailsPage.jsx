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
  Brain,
  Bot
} from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillGapVisualizer } from '../components/matching/SkillGapVisualizer';
import { AiProjectMentorView } from '../components/ai/AiProjectMentorView';
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
        <div className="h-48 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />
        <div className="h-64 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-[#888888] font-mono">Project not found.</p>
        <Link to="/projects" className="text-[#E50914] font-mono font-bold mt-2 inline-block">Back to Explore</Link>
      </div>
    );
  }

  const isOwner = user && project.owner && ((project.owner._id && project.owner._id.toString() === user._id.toString()) || project.owner.toString() === user._id.toString());
  const isMember = user && project.members?.some(m => (m.user?._id && m.user._id.toString() === user._id.toString()) || m.user?.toString() === user._id.toString());

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1F1F1F]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#A1A1A1] bg-[#161616] px-2.5 py-0.5 rounded-full border border-[#242424]">
                {project.category}
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#161616] text-[#F5F5F5] border border-[#242424]">
                {project.difficulty}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                project.status === 'Recruiting'
                  ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                  : 'bg-[#161616] text-[#A1A1A1] border-[#242424]'
              }`}>
                {project.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs font-mono text-[#888888] mt-1">
              Created by <span className="font-semibold text-[#F5F5F5]">{project.owner?.name}</span> • Duration: {project.duration}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/projects/${project._id}/mentor`}>
              <Button variant="primary" size="md" icon={Bot}>
                AI Mentor
              </Button>
            </Link>

            {isMember && (
              <Link to={`/projects/${project._id}/tasks`}>
                <Button variant="outline" size="md" icon={FolderKanban}>
                  Project Tasks
                </Button>
              </Link>
            )}

            {isOwner && (
              <Link to={`/projects/${project._id}/matches`}>
                <Button variant="outline" size="md" icon={UserPlus}>
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
                className="p-2.5 rounded-full border border-[#FF1F2D]/30 bg-[#FF1F2D]/10 text-[#FF1F2D] hover:bg-[#FF1F2D]/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Description */}
        <div className="py-6 border-b border-[#1F1F1F]">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] mb-2">// OVERVIEW & OBJECTIVES</h3>
          <p className="text-xs sm:text-sm font-mono text-[#CCCCCC] leading-relaxed max-w-4xl">
            {project.description}
          </p>
        </div>

        {/* Required Skills & Roles */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] mb-2">// REQUIRED_SKILLS</h4>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills?.map((skill, idx) => (
                <span key={idx} className="px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-xs font-mono text-[#F5F5F5]">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] mb-2">// TARGET_ROLES</h4>
            <div className="flex flex-wrap gap-1.5">
              {project.suggestedRoles?.map((role, idx) => (
                <span key={idx} className="px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-xs font-mono text-[#A1A1A1]">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded AI Project Mentor Chat Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#E50914]" />
            <h2 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">Project AI Mentor</h2>
          </div>
          <Link
            to={`/projects/${project._id}/mentor`}
            className="text-xs font-mono font-bold text-[#E50914] hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Open Fullscreen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <AiProjectMentorView projectId={project._id} projectData={project} />
      </div>

      {/* Skill Gap Analysis & Gap-Filling Student Recommendations */}
      <SkillGapVisualizer
        gapData={skillGap}
        projectId={project._id}
        projectTitle={project.title}
        onInviteSent={() => fetchProjectData()}
      />

      {/* AI Insights Card if analyzed */}
      {project.aiAnalysis?.analyzed && (
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-[#E50914]" />
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">AI Architectural Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div>
              <span className="font-bold text-[#888888] block mb-2">// SUGGESTED_ROLES</span>
              <div className="flex flex-wrap gap-1.5">
                {(project.aiAnalysis.suggestedRoles || []).map((role, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-xs text-[#F5F5F5]">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-[#888888] block mb-2">// TECHNICAL_CHALLENGES</span>
              <ul className="space-y-1 text-[#888888]">
                {(project.aiAnalysis.potentialChallenges || []).map((ch, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#E50914] font-bold">•</span>
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
