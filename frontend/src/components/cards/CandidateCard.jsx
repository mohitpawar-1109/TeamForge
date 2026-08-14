import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Mail, ExternalLink, GraduationCap, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const CandidateCard = ({ candidateData, onInvite, onViewBreakdown, onViewProfile }) => {
  const { student, score, skillMatch, interestMatch, availabilityMatch, experienceMatch, matchedSkills, missingSkills, explanations, invitationStatus } = candidateData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, College, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">{student.name}</h4>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  {student.year || '3rd Year'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{student.headline}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" /> {student.college}</span>
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-sm shadow-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{score}%</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Match</span>
          </div>
        </div>

        {/* Match Breakdown Mini Bars */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2 font-semibold text-slate-600">
            <div>
              <div className="text-slate-400">Skills</div>
              <div className="text-slate-900 text-xs font-bold">{skillMatch}%</div>
            </div>
            <div>
              <div className="text-slate-400">Interests</div>
              <div className="text-slate-900 text-xs font-bold">{interestMatch}%</div>
            </div>
            <div>
              <div className="text-slate-400">Availability</div>
              <div className="text-slate-900 text-xs font-bold">{availabilityMatch}%</div>
            </div>
            <div>
              <div className="text-slate-400">Experience</div>
              <div className="text-slate-900 text-xs font-bold">{experienceMatch}%</div>
            </div>
          </div>

          {/* Progress fill */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Matched Skills Chips */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <span>Skills Overview:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(student.skills || []).map((skill, idx) => {
              const isMatched = (matchedSkills || []).some(m => m.toLowerCase() === skill.name.toLowerCase());
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                    isMatched
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {skill.name}
                  {isMatched && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Why this match box */}
        <div className="mb-4 bg-brand-50/50 rounded-xl p-3 border border-brand-100/60">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-800 mb-1.5">
            Why this match?
          </div>
          <ul className="space-y-1">
            {(explanations || []).slice(0, 3).map((exp, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="text-brand-600 font-bold">✓</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => onViewProfile(student._id)}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors text-center"
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
