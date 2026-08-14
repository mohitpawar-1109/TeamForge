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
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-xs text-slate-400 font-medium">Difficulty</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{difficulty || 'Medium'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-xs text-slate-400 font-medium">Recommended Team</div>
            <div className="text-base font-bold text-brand-600 mt-0.5">{recommendedTeamSize || 4} Members</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
            <div className="text-xs text-slate-400 font-medium">Skills Identified</div>
            <div className="text-base font-bold text-emerald-600 mt-0.5">{(requiredSkills || []).length} Required</div>
          </div>
        </div>

        {/* Required Skills & Importance */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Identified Technical Skills
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(requiredSkills || []).map((skill, idx) => {
              const imp = (skillImportance && skillImportance[skill]) || 'High';
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-sm font-semibold text-slate-800">{skill}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    imp === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-brand-50 text-brand-700 border border-brand-200'
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Potential Architectural Challenges
          </h4>
          <ul className="space-y-1.5 bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80">
            {(potentialChallenges || []).map((ch, idx) => (
              <li key={idx} className="text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{ch}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
