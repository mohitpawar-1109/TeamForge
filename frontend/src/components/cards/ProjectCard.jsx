import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const ProjectCard = ({ project, showMatchScore = true }) => {
  const memberCount = project.members?.length || 1;
  const teamSize = project.teamSize || 4;
  const isFull = memberCount >= teamSize;
  const matchScore = project.userMatchScore || 85;

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Beginner': return <Badge variant="success">Beginner</Badge>;
      case 'Advanced': return <Badge variant="purple">Advanced</Badge>;
      case 'Hard': return <Badge variant="danger">Hard</Badge>;
      default: return <Badge variant="brand">Medium</Badge>;
    }
  };

  return (
    <div className="group bg-[#18181B] rounded-2xl border border-[#27272A] p-5 hover:border-indigo-500/40 hover:shadow-glow/10 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top bar: Category + Match percentage */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            {project.category}
          </span>
          {showMatchScore && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/projects/${project._id}`}>
          <h3 className="text-lg font-bold text-[#FAFAFA] group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Required Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(project.requiredSkills || []).slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#111113] text-zinc-300 border border-[#27272A]"
            >
              {skill}
            </span>
          ))}
          {(project.requiredSkills || []).length > 4 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#111113] text-zinc-500 border border-[#27272A]">
              +{(project.requiredSkills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Progress Bar & Members count */}
        <div className="pt-4 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-400 mb-4">
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Users className="w-4 h-4 text-zinc-500" />
            <span>{memberCount} / {teamSize} Members</span>
            {isFull ? (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">FULL</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">RECRUITING</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.duration || '4 Weeks'}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/projects/${project._id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#111113] hover:bg-indigo-950/50 text-zinc-300 hover:text-indigo-300 font-semibold text-sm border border-[#27272A] hover:border-indigo-500/40 transition-all"
        >
          <span>View Project</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
