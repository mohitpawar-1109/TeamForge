import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg hover:border-brand-300 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top bar: Category + Match percentage */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
            {project.category}
          </span>
          {showMatchScore && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/projects/${project._id}`}>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Required Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(project.requiredSkills || []).slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
            >
              {skill}
            </span>
          ))}
          {(project.requiredSkills || []).length > 4 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
              +{(project.requiredSkills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Progress Bar & Members count */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{memberCount} / {teamSize} Members</span>
            {isFull ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">FULL</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">RECRUITING</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.duration || '4 Weeks'}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/projects/${project._id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-medium text-sm border border-slate-200 hover:border-brand-200 transition-all"
        >
          <span>View Project</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
