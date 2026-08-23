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
      case 'Advanced': return <Badge variant="terracotta">Advanced</Badge>;
      case 'Hard': return <Badge variant="danger">Hard</Badge>;
      default: return <Badge variant="peach">Medium</Badge>;
    }
  };

  return (
    <div className="group bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 hover:border-[#A84A4D]/60 hover:shadow-soft transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top bar: Category + Match percentage */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#DDA081] bg-[#281A21] px-2.5 py-1 rounded-lg border border-[#703344]">
            {project.category}
          </span>
          {showMatchScore && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#86B190]" />
              <span>{matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/projects/${project._id}`}>
          <h3 className="text-lg font-bold text-[#F6E8E2] group-hover:text-[#CB6B5A] transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-[#DDA081] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Required Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(project.requiredSkills || []).slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#281A21] text-[#F6E8E2] border border-[#703344]"
            >
              {skill}
            </span>
          ))}
          {(project.requiredSkills || []).length > 4 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#281A21] text-[#DDA081] border border-[#703344]">
              +{(project.requiredSkills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Progress Bar & Members count */}
        <div className="pt-4 border-t border-[#703344] flex items-center justify-between text-xs text-[#DDA081] mb-4">
          <div className="flex items-center gap-1.5 font-medium text-[#F6E8E2]">
            <Users className="w-4 h-4 text-[#DDA081]" />
            <span>{memberCount} / {teamSize} Members</span>
            {isFull ? (
              <span className="text-[10px] font-bold text-[#E5B079] bg-[#D99443]/20 px-1.5 py-0.5 rounded border border-[#D99443]/40">FULL</span>
            ) : (
              <span className="text-[10px] font-bold text-[#86B190] bg-[#5B8A68]/20 px-1.5 py-0.5 rounded border border-[#5B8A68]/40">RECRUITING</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[#DDA081]">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.duration || '4 Weeks'}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/projects/${project._id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#281A21] hover:bg-[#703344] text-[#F6E8E2] hover:text-white font-semibold text-sm border border-[#703344] hover:border-[#A84A4D]/60 transition-all"
        >
          <span>View Project</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
