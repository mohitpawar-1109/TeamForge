import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Mail, ExternalLink, GraduationCap, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const CandidateCard = ({ candidateData, onInvite, onViewBreakdown, onViewProfile }) => {
  const { student, score, skillMatch, interestMatch, availabilityMatch, experienceMatch, matchedSkills, missingSkills, explanations, invitationStatus } = candidateData;

  return (
    <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-5 hover:border-indigo-500/40 hover:shadow-glow/10 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, College, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#27272A] bg-[#111113] flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#FAFAFA] text-base">{student.name}</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                  {student.year || '3rd Year'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium line-clamp-1">{student.headline}</p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" /> {student.college}</span>
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{score}%</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Match</span>
          </div>
        </div>

        {/* Match Breakdown Mini Bars */}
        <div className="bg-[#111113] rounded-xl p-3 border border-[#27272A] mb-4">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2 font-semibold text-zinc-400">
            <div>
              <div className="text-zinc-500">Skills</div>
              <div className="text-[#FAFAFA] text-xs font-bold">{skillMatch}%</div>
            </div>
            <div>
              <div className="text-zinc-500">Interests</div>
              <div className="text-[#FAFAFA] text-xs font-bold">{interestMatch}%</div>
            </div>
            <div>
              <div className="text-zinc-500">Availability</div>
              <div className="text-[#FAFAFA] text-xs font-bold">{availabilityMatch}%</div>
            </div>
            <div>
              <div className="text-zinc-500">Experience</div>
              <div className="text-[#FAFAFA] text-xs font-bold">{experienceMatch}%</div>
            </div>
          </div>

          {/* Progress fill */}
          <div className="w-full bg-[#27272A] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Matched Skills Chips */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
            <span>Skills Overview:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(student.skills || []).map((skill, idx) => {
              const isMatched = (matchedSkills || []).some(m => m.toLowerCase() === skill.name.toLowerCase());
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    isMatched
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#111113] text-zinc-400 border-[#27272A]'
                  }`}
                >
                  {skill.name}
                  {isMatched && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Why this match box */}
        <div className="mb-4 bg-indigo-950/30 rounded-xl p-3 border border-indigo-500/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
            Why this match?
          </div>
          <ul className="space-y-1">
            {(explanations || []).slice(0, 3).map((exp, idx) => (
              <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                <span className="text-indigo-400 font-bold">✓</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#27272A] flex items-center gap-2">
        <button
          onClick={() => onViewProfile(student._id)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#111113] hover:bg-[#27272A] text-zinc-300 hover:text-[#FAFAFA] font-semibold text-xs border border-[#27272A] transition-colors text-center"
        >
          View Profile
        </button>

        {invitationStatus === 'pending' ? (
          <Button variant="secondary" size="sm" disabled className="flex-1 text-xs">
            Invite Sent
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={Mail}
            onClick={() => onInvite(student)}
            className="flex-1 text-xs"
          >
            Invite to Team
          </Button>
        )}
      </div>
    </div>
  );
};
