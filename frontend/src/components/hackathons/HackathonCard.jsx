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

  const getMatchBadgeColor = (pct) => {
    if (pct >= 75) return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
    if (pct >= 40) return 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40';
    return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
  };

  return (
    <div className="group bg-[#18181B] border border-[#27272A] hover:border-indigo-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between relative">
      {/* Top Banner Image / Accent */}
      <div className="relative h-40 w-full overflow-hidden bg-[#111113]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-indigo-950 via-purple-950 to-zinc-900 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-indigo-400/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-transparent to-black/40" />

        {/* Badges on Banner */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {featured && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-black" /> Featured
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              mode === 'Online'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : mode === 'Hybrid'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
            }`}
          >
            {mode}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900/90 text-zinc-300 border border-zinc-700/60">
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
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
            isSaved
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Hackathon'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Prize Pool Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/90 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{prizePool} Prize Pool</span>
        </div>

        {/* Deadline Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold">
          <Calendar className="w-3 h-3 text-indigo-400" />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ends today'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-400">
            <span>{organizer?.name || 'TechForge League'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-zinc-500" />
              {teamSize?.min === teamSize?.max
                ? `${teamSize.min} members`
                : `${teamSize?.min || 1}-${teamSize?.max || 4} members`}
            </span>
          </div>

          <Link to={`/hackathons/${_id}`}>
            <h3 className="text-base font-extrabold text-[#FAFAFA] group-hover:text-indigo-400 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {tagline || hackathon.description?.replace(/#/g, '').slice(0, 100)}
          </p>
        </div>

        {/* TeamForge Skill Match Integration */}
        <div className="space-y-2 pt-2 border-t border-[#27272A]">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${getMatchBadgeColor(
                matchPercentage
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>You match {matchPercentage}% of the required skills</span>
            </span>
          </div>

          {/* Skill Pills */}
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" /> {skill}
              </span>
            ))}

            {missingSkills.slice(0, 2).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-800/80 text-zinc-400 border border-dashed border-zinc-600/60"
                title={`Skill gap: ${skill}`}
              >
                + Need {skill}
              </span>
            ))}

            {requiredSkills.length > 5 && (
              <span className="px-1.5 py-0.5 text-[10px] text-zinc-500">
                +{requiredSkills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#27272A] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleInterest && onToggleInterest(_id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isInterested
                ? 'bg-pink-950/60 text-pink-300 border border-pink-500/40'
                : 'bg-[#27272A]/70 hover:bg-[#27272A] text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isInterested ? 'fill-pink-400 text-pink-400' : ''}`} />
            <span>{isInterested ? 'Interested' : 'Interested?'}</span>
            {interestedCount > 0 && (
              <span className="text-[10px] opacity-75">({interestedCount})</span>
            )}
          </button>

          <Link
            to={`/hackathons/${_id}`}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm group-hover:gap-1.5"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
