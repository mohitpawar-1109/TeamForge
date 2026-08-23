import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  FolderKanban,
  Users,
  Layers,
  Bot
} from 'lucide-react';
import { projectAPI } from '../services/api';
import { AiProjectMentorView } from '../components/ai/AiProjectMentorView';
import { Badge } from '../components/common/Badge';

export const ProjectMentorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await projectAPI.getProjectById(id);
        if (res.data?.success) {
          setProject(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="h-20 bg-[#111111] border border-[#242424] rounded-3xl animate-pulse" />
        <div className="h-[650px] bg-[#111111] border border-[#242424] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-xs font-mono text-[#888888]">Project not found or inaccessible.</p>
        <Link to="/projects" className="text-xs font-mono font-bold text-[#E50914] mt-3 inline-block">
          Return to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Navigation Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${project._id}`}
            className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[#F5F5F5] transition-all flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#F5F5F5]">{project.title}</h2>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#A1A1A1] bg-[#161616] px-2 py-0.5 rounded-full border border-[#242424]">
                {project.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project._id}/tasks`}
            className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-[#F5F5F5] transition-all flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#F2B705]" />
            <span>Tasks</span>
          </Link>
          <Link
            to={`/projects/${project._id}/team`}
            className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-[#F5F5F5] transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Team Roster</span>
          </Link>
        </div>
      </div>

      {/* Main Mentor Chat Component */}
      <AiProjectMentorView projectId={project._id} projectData={project} />
    </div>
  );
};
