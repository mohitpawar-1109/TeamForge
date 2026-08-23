import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Mail, ExternalLink, GraduationCap, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const CandidateCard = ({ candidateData, onInvite, onViewBreakdown, onViewProfile }) => {
  const { student, score, skillMatch, interestMatch, availabilityMatch, experienceMatch, matchedSkills, missingSkills, explanations, invitationStatus } = candidateData;

  return (
    <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-5 hover:border-[#A84A4D]/60 hover:shadow-soft transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, College, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#703344] bg-[#281A21] flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#F6E8E2] text-base">{student.name}</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                  {student.year || '3rd Year'}
                </span>
              </div>
              <p className="text-xs text-[#DDA081] font-medium line-clamp-1">{student.headline}</p>
              <div className="flex items-center gap-2 text-[11px] text-[#DDA081]/80 mt-0.5">
                <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" /> {student.college}</span>
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40 font-extrabold text-sm shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{score}%</span>
            </div>
            <span className="text-[10px] font-bold text-[#86B190] uppercase tracking-wider mt-0.5">Match</span>
          </div>
        </div>

        {/* Match Breakdown Mini Bars */}
        <div className="bg-[#281A21] rounded-xl p-3 border border-[#703344] mb-4">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2 font-semibold text-[#DDA081]">
            <div>
              <div className="text-[#DDA081]/70">Skills</div>
              <div className="text-[#F6E8E2] text-xs font-bold">{skillMatch}%</div>
            </div>
            <div>
              <div className="text-[#DDA081]/70">Interests</div>
              <div className="text-[#F6E8E2] text-xs font-bold">{interestMatch}%</div>
            </div>
            <div>
              <div className="text-[#DDA081]/70">Availability</div>
              <div className="text-[#F6E8E2] text-xs font-bold">{availabilityMatch}%</div>
            </div>
            <div>
              <div className="text-[#DDA081]/70">Experience</div>
              <div className="text-[#F6E8E2] text-xs font-bold">{experienceMatch}%</div>
            </div>
          </div>

          {/* Progress fill */}
          <div className="w-full bg-[#4A2A35] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Matched Skills Chips */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[#DDA081] mb-1.5 flex items-center gap-1">
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
                      ? 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40'
                      : 'bg-[#281A21] text-[#DDA081] border-[#703344]'
                  }`}
                >
                  {skill.name}
                  {isMatched && <CheckCircle2 className="w-3 h-3 text-[#86B190]" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Why this match box */}
        <div className="mb-4 bg-[#281A21] rounded-xl p-3 border border-[#703344]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#CB6B5A] mb-1.5">
            Why this match?
          </div>
          <ul className="space-y-1">
            {(explanations || []).slice(0, 3).map((exp, idx) => (
              <li key={idx} className="text-xs text-[#DDA081] flex items-start gap-1.5">
                <span className="text-[#CB6B5A] font-bold">✓</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#703344] flex items-center gap-2">
        <button
          onClick={() => onViewProfile(student._id)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#281A21] hover:bg-[#703344] text-[#F6E8E2] hover:text-white font-semibold text-xs border border-[#703344] transition-colors text-center cursor-pointer"
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
