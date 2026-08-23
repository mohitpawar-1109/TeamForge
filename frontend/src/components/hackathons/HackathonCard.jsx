import React from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  ArrowRight,
  Heart
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const HackathonCard = ({ hackathon, onToggleSave, onToggleInterest }) => {
  if (!hackathon) return null;

  const {
    _id,
    title,
    tagline,
    bannerImage,
    organizer,
    mode,
    location,
    difficulty,
    teamSize,
    requiredSkills = [],
    prizePool,
    deadline,
    daysLeft,
    featured,
    isSaved,
    isInterested,
    interestedCount = 0,
    skillMatch = {}
  } = hackathon;

  const { matchPercentage = 0, matchedSkills = [], missingSkills = [] } = skillMatch;

  return (
    <div className="group bg-[#111111] border border-[#242424] hover:border-[#333333] rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-soft flex flex-col justify-between relative">
      {/* Top Banner Image / Accent */}
      <div className="relative h-44 w-full overflow-hidden bg-[#0A0A0A]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0A0A0A] via-[#161616] to-[#111111] flex items-center justify-center">
            <Trophy className="w-12 h-12 text-[#666666]/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/50" />

        {/* Badges on Banner */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {featured && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F2B705] text-black flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-black" /> FEATURED
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
              mode === 'Online'
                ? 'bg-[#20D47A]/20 text-[#20D47A] border border-[#20D47A]/40'
                : mode === 'Hybrid'
                ? 'bg-[#E50914]/20 text-[#FF1F2D] border border-[#E50914]/40'
                : 'bg-[#2AA8FF]/20 text-[#2AA8FF] border border-[#2AA8FF]/40'
            }`}
          >
            {mode}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#111111]/90 text-[#A1A1A1] border border-[#242424]">
            {difficulty}
          </span>
        </div>

        {/* Save / Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave && onToggleSave(_id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isSaved
              ? 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]'
              : 'bg-black/60 hover:bg-black/80 text-[#A1A1A1] hover:text-white border border-[#242424]'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Hackathon'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Prize Pool Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111]/95 border border-[#242424] text-[#F2B705] text-xs font-mono font-bold shadow-md">
          <Trophy className="w-3.5 h-3.5 text-[#F2B705]" />
          <span>{prizePool} Prize Pool</span>
        </div>

        {/* Deadline Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#111111]/95 border border-[#242424] text-[#A1A1A1] text-[11px] font-mono font-medium">
          <Calendar className="w-3 h-3 text-[#666666]" />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ends today'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-[#666666]">
            <span>{organizer?.name || 'TechForge League'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#666666]" />
              {teamSize?.min === teamSize?.max
                ? `${teamSize.min} members`
                : `${teamSize?.min || 1}-${teamSize?.max || 4} members`}
            </span>
          </div>

          <Link to={`/hackathons/${_id}`}>
            <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-white transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-[#888888] mt-1 line-clamp-2 leading-relaxed">
            {tagline || hackathon.description?.replace(/#/g, '').slice(0, 100)}
          </p>
        </div>

        {/* TeamForge Skill Match Integration */}
        <div className="space-y-2.5 pt-2 border-t border-[#1F1F1F]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#F5F5F5] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#20D47A]" />
              <span>You match {matchPercentage}% of the required skills</span>
            </span>
          </div>

          {/* Skill Pills */}
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30 flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" /> {skill}
              </span>
            ))}

            {missingSkills.slice(0, 2).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#161616] text-[#888888] border border-[#242424]"
                title={`Skill gap: ${skill}`}
              >
                + Need {skill}
              </span>
            ))}

            {requiredSkills.length > 5 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#666666]">
                +{requiredSkills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleInterest && onToggleInterest(_id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              isInterested
                ? 'bg-[#E50914]/20 text-[#FF1F2D] border border-[#E50914]/50'
                : 'bg-transparent hover:bg-[#161616] text-[#A1A1A1] hover:text-white border border-[#242424]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isInterested ? 'fill-[#FF1F2D] text-[#FF1F2D]' : ''}`} />
            <span>{isInterested ? 'Interested' : 'Interested?'}</span>
            {interestedCount > 0 && (
              <span className="text-[10px] opacity-75">({interestedCount})</span>
            )}
          </button>

          <Link
            to={`/hackathons/${_id}`}
            className="px-4 py-1.5 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(229,9,20,0.45)] group-hover:gap-1.5"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
