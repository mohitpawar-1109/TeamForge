import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const SkillGapVisualizer = ({ gapData, projectId }) => {
  if (!gapData) return null;

  const { overallCoverage, coveredCount, totalRequired, missingCount, details, missingSkills, teamHealth } = gapData;

  return (
    <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 shadow-soft">
      {/* Header with Coverage Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#FAFAFA]">Team Skill Coverage</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              overallCoverage >= 100
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : overallCoverage >= 60
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            }`}>
              {overallCoverage}% Covered
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Analyzing current member skills against project requirements
          </p>
        </div>

        {/* Progress Bar & Health */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-500 font-medium">Team Health</div>
            <div className="text-base font-extrabold text-[#FAFAFA]">{teamHealth || 85}%</div>
          </div>
          <div className="w-32 sm:w-40 bg-[#111113] h-3 rounded-full overflow-hidden p-0.5 border border-[#27272A]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallCoverage >= 100
                  ? 'bg-emerald-500'
                  : overallCoverage >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overallCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skill List with status */}
      <div className="py-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Required Skill Breakdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(details || []).map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                item.covered
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.covered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <span className="text-sm font-semibold">{item.skill}</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                item.covered ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action if missing skills */}
      {missingCount > 0 && projectId && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-200">
                Your team is missing {missingCount} skill{missingCount > 1 ? 's' : ''}: {missingSkills.slice(0, 3).join(', ')}
              </p>
              <p className="text-xs text-zinc-400">Find compatible candidates who fill these exact gaps.</p>
            </div>
          </div>

          <Link to={`/projects/${projectId}/matches`}>
            <Button variant="primary" size="sm" icon={Sparkles}>
              Find Teammates
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
