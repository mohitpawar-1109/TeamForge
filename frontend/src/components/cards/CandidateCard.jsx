import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Mail, ExternalLink, GraduationCap, MapPin } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const CandidateCard = ({ candidateData, onInvite, onViewBreakdown, onViewProfile }) => {
  const { student, score, skillMatch, interestMatch, availabilityMatch, experienceMatch, matchedSkills, missingSkills, explanations, invitationStatus } = candidateData;

  return (
    <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between shadow-soft">
      <div>
        {/* Header: Avatar, Name, College, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
              alt={student.name}
              className="w-12 h-12 rounded-full object-cover border border-[#242424] bg-[#161616] flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#F5F5F5] text-sm">{student.name}</h4>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                  {student.year || '3rd Year'}
                </span>
              </div>
              <p className="text-xs font-mono text-[#888888] font-medium line-clamp-1">{student.headline}</p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#666666] mt-0.5">
                <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" /> {student.college}</span>
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30 font-mono font-bold text-xs">
              <Sparkles className="w-3 h-3" />
              <span>{score}%</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#20D47A] uppercase tracking-wider mt-0.5">Match</span>
          </div>
        </div>

        {/* Match Breakdown Mini Bars */}
        <div className="bg-[#161616] rounded-2xl p-3 border border-[#242424] mb-4">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2 font-mono text-[#888888]">
            <div>
              <div className="text-[#666666]">Skills</div>
              <div className="text-[#F5F5F5] font-bold">{skillMatch}%</div>
            </div>
            <div>
              <div className="text-[#666666]">Interests</div>
              <div className="text-[#F5F5F5] font-bold">{interestMatch}%</div>
            </div>
            <div>
              <div className="text-[#666666]">Availability</div>
              <div className="text-[#F5F5F5] font-bold">{availabilityMatch}%</div>
            </div>
            <div>
              <div className="text-[#666666]">Experience</div>
              <div className="text-[#F5F5F5] font-bold">{experienceMatch}%</div>
            </div>
          </div>

          <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
            <div
              className="h-full bg-[#E50914] rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Matched Skills Chips */}
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold uppercase text-[#888888] mb-1.5 flex items-center gap-1">
            <span>Skills Overview:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(student.skills || []).map((skill, idx) => {
              const isMatched = (matchedSkills || []).some(m => m.toLowerCase() === skill.name.toLowerCase());
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                    isMatched
                      ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                      : 'bg-[#161616] text-[#888888] border-[#242424]'
                  }`}
                >
                  {skill.name}
                  {isMatched && <CheckCircle2 className="w-2.5 h-2.5 text-[#20D47A]" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Why this match box */}
        <div className="mb-4 bg-[#161616] rounded-2xl p-3 border border-[#242424]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E50914] mb-1.5">
            Why this match?
          </div>
          <ul className="space-y-1">
            {(explanations || []).slice(0, 3).map((exp, idx) => (
              <li key={idx} className="text-xs font-mono text-[#888888] flex items-start gap-1.5">
                <span className="text-[#E50914] font-bold">✓</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#1F1F1F] flex items-center gap-2">
        <button
          onClick={() => onViewProfile(student._id)}
          className="flex-1 py-2 px-3 rounded-full bg-[#161616] hover:bg-[#202020] text-[#F5F5F5] hover:text-white font-mono font-bold text-xs border border-[#242424] transition-colors text-center cursor-pointer"
        >
          View Profile
        </button>

        {invitationStatus === 'pending' ? (
          <Button variant="outline" size="sm" disabled className="flex-1 text-xs">
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
