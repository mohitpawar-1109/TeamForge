import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  BarChart2,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const SkillVerificationReportModal = ({
  isOpen,
  onClose,
  report,
  onRetake
}) => {
  if (!isOpen || !report) return null;

  const {
    skillName,
    claimedLevel = 'Intermediate',
    verifiedLevel = 'Intermediate',
    testScore = 0,
    practicalScore = 0,
    consistencyScore = 0,
    verifiedConfidence = 0,
    status = 'UNVERIFIED',
    strongAreas = [],
    improvements = [],
    projectEvidence = [],
    attemptsCount = 1
  } = report;

  const isVerified = status === 'VERIFIED';
  const isPartially = status === 'PARTIALLY_VERIFIED';

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111111] border border-[#242424] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 bg-[#161616] border-b border-[#1F1F1F] flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl border ${
                isVerified
                  ? 'bg-[#20D47A]/10 border-[#20D47A]/30 text-[#20D47A]'
                  : isPartially
                  ? 'bg-[#F2B705]/10 border-[#F2B705]/30 text-[#F2B705]'
                  : 'bg-[#E50914]/10 border-[#E50914]/30 text-[#E50914]'
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Verification Report: <span className="text-[#E50914]">{skillName}</span>
                </h3>
              </div>
              <p className="text-xs font-mono text-[#888888] mt-0.5">
                Evaluated by TeamForge Skill Authenticity Engine • Attempt #{attemptsCount}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#202020] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Status and Big Score Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
                Authenticity Status
              </span>
              <div className="mt-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    isVerified
                      ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                      : isPartially
                      ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                      : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/30'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>{status.replace(/_/g, ' ')}</span>
                </span>
              </div>
            </div>

            <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
                Verified Level
              </span>
              <div className="text-xl font-bold text-white mt-1">
                {verifiedLevel}
              </div>
              <div className="text-[10px] font-mono text-[#666666]">
                Claimed: {claimedLevel}
              </div>
            </div>

            <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
                Verified Confidence
              </span>
              <div className="text-2xl font-bold text-[#E50914] mt-0.5">
                {verifiedConfidence}%
              </div>
              <div className="text-[10px] font-mono text-[#666666]">
                Multi-signal accuracy
              </div>
            </div>
          </div>

          {/* Sub-Score Progress Breakdown */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#242424] space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#E50914]" />
              <span>Multi-Signal Authenticity Breakdown</span>
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A1A1A1]">Theoretical Test Score</span>
                  <span className="text-white font-bold">{testScore}%</span>
                </div>
                <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                  <div className="h-full bg-[#E50914]" style={{ width: `${testScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A1A1A1]">Practical & Debugging Accuracy</span>
                  <span className="text-white font-bold">{practicalScore}%</span>
                </div>
                <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                  <div className="h-full bg-[#20D47A]" style={{ width: `${practicalScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A1A1A1]">Claimed vs Scored Consistency</span>
                  <span className="text-white font-bold">{consistencyScore}%</span>
                </div>
                <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                  <div className="h-full bg-[#F2B705]" style={{ width: `${consistencyScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#20D47A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Demonstrated Strengths</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#D0D0D0]">
                {strongAreas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#20D47A] font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F2B705] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Recommendations for Growth</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#D0D0D0]">
                {improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#F2B705] font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Real Project Evidence Detected */}
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#A1A1A1]" />
                <span>Correlated Project Evidence</span>
              </h4>
              <span className="text-[10px] font-mono text-[#666666]">
                {projectEvidence.length} projects linked
              </span>
            </div>

            {projectEvidence.length > 0 ? (
              <div className="space-y-2">
                {projectEvidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#242424] text-xs font-mono"
                  >
                    <span className="font-bold text-[#F5F5F5]">{ev.title}</span>
                    <span className="text-[#20D47A] bg-[#161616] px-2.5 py-0.5 rounded-full border border-[#242424]">
                      {ev.tasksCompleted} tasks completed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-[#888888] bg-[#111111] p-3 rounded-xl border border-[#242424]">
                No existing TeamForge projects currently tagged with {skillName}. Complete collaborative team tasks to boost verified confidence further.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1F1F1F] bg-[#161616]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#242424] bg-[#111111] hover:bg-[#202020] text-xs font-mono text-white transition-all cursor-pointer"
          >
            Close Report
          </button>

          {onRetake && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetake(skillName, claimedLevel);
              }}
              className="px-5 py-2 rounded-full bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <span>Retake Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
