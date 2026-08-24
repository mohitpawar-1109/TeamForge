import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export const ProjectCard = ({ project, showMatchScore = true }) => {
  const { user } = useAuth();
  const memberCount = project.members?.length || 1;
  const teamSize = project.teamSize || 4;
  const isFull = memberCount >= teamSize;
  const matchScore = project.userMatchScore || 85;
  const isParticipant = user && (project.members || []).some(m => {
    const mId = (m.user?._id || m.user)?.toString();
    return mId === user._id?.toString();
  });

  return (
    <div className="group bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 hover:border-[#333333] transition-all duration-200 flex flex-col justify-between shadow-soft">
      <div>
        {/* Top bar: Category + Match percentage */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1A1] bg-[#161616] px-2.5 py-0.5 rounded-full border border-[#242424]">
            {project.category}
          </span>
          {showMatchScore && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30 text-[10px] font-mono font-bold">
              <Sparkles className="w-3 h-3 text-[#20D47A]" />
              <span>{matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/projects/${project._id}`}>
          <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-[#E50914] transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#888888] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Required Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(project.requiredSkills || []).slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
            >
              {skill}
            </span>
          ))}
          {(project.requiredSkills || []).length > 4 && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#161616] text-[#666666] border border-[#242424]">
              +{(project.requiredSkills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Progress Bar & Members count */}
        <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-xs font-mono text-[#888888] mb-4">
          <div className="flex items-center gap-1.5 text-[#F5F5F5]">
            <Users className="w-3.5 h-3.5 text-[#888888]" />
            <span>{memberCount} / {teamSize} Members</span>
            {isFull ? (
              <span className="text-[9px] font-bold text-[#F2B705] bg-[#F2B705]/10 px-1.5 py-0.2 rounded-full border border-[#F2B705]/30">FULL</span>
            ) : (
              <span className="text-[9px] font-bold text-[#20D47A] bg-[#20D47A]/10 px-1.5 py-0.2 rounded-full border border-[#20D47A]/30">RECRUITING</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[#666666]">
            <Clock className="w-3 h-3" />
            <span>{project.duration || '4 Weeks'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Link
            to={`/projects/${project._id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#161616] hover:bg-[#202020] text-[#F5F5F5] hover:text-white font-mono font-bold text-xs border border-[#242424] hover:border-[#333333] transition-all cursor-pointer"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          
          {isParticipant && project.status === 'Completed' && (
            <Link
              to={`/projects/${project._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center py-2 px-4 rounded-full bg-[#20D47A]/10 hover:bg-[#20D47A]/20 text-[#20D47A] font-mono font-bold text-xs border border-[#20D47A]/30 transition-all cursor-pointer whitespace-nowrap"
            >
              Give Feedback
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
