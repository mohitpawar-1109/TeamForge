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
    if (pct >= 75) return 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40';
    if (pct >= 40) return 'bg-[#703344] text-[#F6E8E2] border-[#A84A4D]/40';
    return 'bg-[#D99443]/20 text-[#E5B079] border-[#D99443]/40';
  };

  return (
    <div className="group bg-[#4A2A35] border border-[#703344] hover:border-[#A84A4D]/60 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#A84A4D]/10 flex flex-col justify-between relative">
      {/* Top Banner Image / Accent */}
      <div className="relative h-40 w-full overflow-hidden bg-[#281A21]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#281A21] via-[#703344] to-[#4A2A35] flex items-center justify-center">
            <Trophy className="w-12 h-12 text-[#DDA081]/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#4A2A35] via-transparent to-black/40" />

        {/* Badges on Banner */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {featured && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D99443] text-[#281A21] flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-[#281A21]" /> Featured
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              mode === 'Online'
                ? 'bg-[#5B8A68]/30 text-[#86B190] border border-[#5B8A68]/40'
                : mode === 'Hybrid'
                ? 'bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40'
                : 'bg-[#A84A4D]/30 text-[#CB6B5A] border border-[#A84A4D]/40'
            }`}
          >
            {mode}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#281A21]/90 text-[#DDA081] border border-[#703344]">
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
              ? 'bg-[#A84A4D] text-[#F6E8E2]'
              : 'bg-[#281A21]/80 hover:bg-[#281A21] text-[#DDA081] hover:text-[#F6E8E2] border border-[#703344]'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Hackathon'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F6E8E2]' : ''}`} />
        </button>

        {/* Prize Pool Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#281A21]/90 border border-[#D99443]/40 text-[#E5B079] text-xs font-black shadow-lg">
          <Trophy className="w-3.5 h-3.5 text-[#D99443]" />
          <span>{prizePool} Prize Pool</span>
        </div>

        {/* Deadline Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#281A21]/90 border border-[#703344] text-[#DDA081] text-[11px] font-semibold">
          <Calendar className="w-3 h-3 text-[#CB6B5A]" />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Ends today'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#DDA081]">
            <span>{organizer?.name || 'TechForge League'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#DDA081]" />
              {teamSize?.min === teamSize?.max
                ? `${teamSize.min} members`
                : `${teamSize?.min || 1}-${teamSize?.max || 4} members`}
            </span>
          </div>

          <Link to={`/hackathons/${_id}`}>
            <h3 className="text-base font-extrabold text-[#F6E8E2] group-hover:text-[#CB6B5A] transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-[#DDA081] mt-1 line-clamp-2 leading-relaxed">
            {tagline || hackathon.description?.replace(/#/g, '').slice(0, 100)}
          </p>
        </div>

        {/* TeamForge Skill Match Integration */}
        <div className="space-y-2 pt-2 border-t border-[#703344]">
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
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/30 flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" /> {skill}
              </span>
            ))}

            {missingSkills.slice(0, 2).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#281A21] text-[#DDA081] border border-dashed border-[#703344]"
                title={`Skill gap: ${skill}`}
              >
                + Need {skill}
              </span>
            ))}

            {requiredSkills.length > 5 && (
              <span className="px-1.5 py-0.5 text-[10px] text-[#DDA081]">
                +{requiredSkills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#703344] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleInterest && onToggleInterest(_id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isInterested
                ? 'bg-[#C04A4D]/20 text-[#E07D82] border border-[#C04A4D]/40'
                : 'bg-[#281A21] hover:bg-[#703344] text-[#DDA081] hover:text-[#F6E8E2] border border-[#703344]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isInterested ? 'fill-[#E07D82] text-[#E07D82]' : ''}`} />
            <span>{isInterested ? 'Interested' : 'Interested?'}</span>
            {interestedCount > 0 && (
              <span className="text-[10px] opacity-75">({interestedCount})</span>
            )}
          </button>

          <Link
            to={`/hackathons/${_id}`}
            className="px-3.5 py-1.5 bg-[#A84A4D] hover:bg-[#CB6B5A] text-[#F6E8E2] rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm group-hover:gap-1.5"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
