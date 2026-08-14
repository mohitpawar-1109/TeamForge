import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const SkillGapVisualizer = ({ gapData, projectId }) => {
  if (!gapData) return null;

  const { overallCoverage, coveredCount, totalRequired, missingCount, details, missingSkills, teamHealth } = gapData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft">
      {/* Header with Coverage Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Team Skill Coverage</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              overallCoverage >= 100
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : overallCoverage >= 60
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {overallCoverage}% Covered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing current member skills against project requirements
          </p>
        </div>

        {/* Progress Bar & Health */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400 font-medium">Team Health</div>
            <div className="text-base font-extrabold text-slate-800">{teamHealth || 85}%</div>
          </div>
          <div className="w-32 sm:w-40 bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
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
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Required Skill Breakdown</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(details || []).map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                item.covered
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                  : 'bg-amber-50/60 border-amber-200/80 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.covered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <span className="text-sm font-semibold">{item.skill}</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                item.covered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action if missing skills */}
      {missingCount > 0 && projectId && (
        <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-brand-900">
                Your team is missing {missingCount} skill{missingCount > 1 ? 's' : ''}: {missingSkills.slice(0, 3).join(', ')}
              </p>
              <p className="text-xs text-brand-700">Find compatible candidates who fill these exact gaps.</p>
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
