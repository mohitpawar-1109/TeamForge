import React from 'react';
import { Sparkles, Brain, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const AIAnalysisModal = ({ isOpen, onClose, analysisData, onApply }) => {
  if (!analysisData) return null;

  const { difficulty, recommendedTeamSize, requiredSkills, suggestedRoles, potentialChallenges, skillImportance } = analysisData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Project Requirements Analysis"
      subtitle="Structured recommendations generated from project scope and industry benchmarks"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-[#111113] rounded-xl p-3 border border-[#27272A] text-center">
            <div className="text-xs text-zinc-500 font-medium">Difficulty</div>
            <div className="text-base font-bold text-[#FAFAFA] mt-0.5">{difficulty || 'Medium'}</div>
          </div>
          <div className="bg-[#111113] rounded-xl p-3 border border-[#27272A] text-center">
            <div className="text-xs text-zinc-500 font-medium">Recommended Team</div>
            <div className="text-base font-bold text-indigo-400 mt-0.5">{recommendedTeamSize || 4} Members</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#111113] rounded-xl p-3 border border-[#27272A] text-center">
            <div className="text-xs text-zinc-500 font-medium">Skills Identified</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{(requiredSkills || []).length} Required</div>
          </div>
        </div>

        {/* Required Skills & Importance */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Identified Technical Skills
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(requiredSkills || []).map((skill, idx) => {
              const imp = (skillImportance && skillImportance[skill]) || 'High';
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#111113] border border-[#27272A]">
                  <span className="text-sm font-semibold text-zinc-200">{skill}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    imp === 'High' ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {imp} Priority
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Roles */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Suggested Team Roles
          </h4>
          <div className="flex flex-wrap gap-2">
            {(suggestedRoles || []).map((role, idx) => (
              <Badge key={idx} variant="purple" size="md">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Potential Challenges */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Potential Architectural Challenges
          </h4>
          <ul className="space-y-1.5 bg-amber-950/20 rounded-xl p-3.5 border border-amber-500/30">
            {(potentialChallenges || []).map((ch, idx) => (
              <li key={idx} className="text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{ch}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#27272A] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Edit Manually
          </Button>
          <Button variant="gradient" icon={Check} onClick={onApply}>
            Use These Recommendations
          </Button>
        </div>
      </div>
    </Modal>
  );
};
