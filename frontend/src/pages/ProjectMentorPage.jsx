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
        <div className="h-20 bg-[#4A2A35] border border-[#703344] rounded-3xl animate-pulse" />
        <div className="h-[650px] bg-[#4A2A35] border border-[#703344] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-sm text-[#DDA081]">Project not found or inaccessible.</p>
        <Link to="/projects" className="text-xs font-bold text-[#CB6B5A] mt-3 inline-block">
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
            className="p-2 rounded-xl bg-[#4A2A35] hover:bg-[#703344] border border-[#703344] text-[#F6E8E2] transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Overview</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#F6E8E2]">{project.title}</h2>
              <Badge variant="brand">{project.category}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project._id}/tasks`}
            className="px-3 py-1.5 rounded-xl bg-[#4A2A35] hover:bg-[#703344] border border-[#703344] text-xs font-bold text-[#F6E8E2] transition-all flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#E5B079]" />
            <span>Tasks</span>
          </Link>
          <Link
            to={`/projects/${project._id}/team`}
            className="px-3 py-1.5 rounded-xl bg-[#4A2A35] hover:bg-[#703344] border border-[#703344] text-xs font-bold text-[#F6E8E2] transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#CB6B5A]" />
            <span>Team Roster</span>
          </Link>
        </div>
      </div>

      {/* Main Mentor Chat Component */}
      <AiProjectMentorView projectId={project._id} projectData={project} />
    </div>
  );
};
