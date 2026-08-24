import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart2,
  Award
} from 'lucide-react';

export const RegistrationSkillSummaryView = ({
  results,
  userName = 'Developer',
  onFinish
}) => {
  const {
    overallScore = 80,
    verifiedConfidence = 80,
    skillResults = []
  } = results || {};

  return (
    <div className="space-y-6 animate-fadeIn text-center">
      {/* Celebration Icon */}
      <div className="w-16 h-16 rounded-full bg-[#20D47A]/10 border border-[#20D47A]/30 text-[#20D47A] flex items-center justify-center mx-auto shadow-lg">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] mb-1">
          <Sparkles className="w-3 h-3 text-[#E50914]" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5] uppercase">
            Onboarding Verified
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          YOUR SKILL PROFILE IS READY
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[#888888]">
          Welcome, {userName}! Your TeamForge profile and initial skill badges are activated.
        </p>
      </div>

      {/* Score Summary Box */}
      <div className="bg-[#161616] border border-[#242424] rounded-3xl p-6 text-left space-y-4 shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#888888]">
            Skill Authenticity Results
          </span>
          <span className="text-xs font-mono font-bold text-[#20D47A]">
            Overall Accuracy: {overallScore}%
          </span>
        </div>

        {/* Skill Badges List */}
        <div className="space-y-2.5">
          {skillResults.map((sr, idx) => {
            const isVerif = sr.status === 'VERIFIED' || sr.verified;
            const isPart = sr.status === 'PARTIALLY_VERIFIED';

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111111] border border-[#242424] transition-all hover:border-[#333333]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-full border ${
                      isVerif
                        ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                        : isPart
                        ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                        : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/30'
                    }`}
                  >
                    {isVerif ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <span>{sr.skill}</span>
                      <span className="text-[10px] font-normal text-[#888888]">
                        ({sr.score}%)
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#666666]">
                      Claimed: {sr.claimedLevel} • Verified: {sr.verifiedLevel}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase ${
                    isVerif
                      ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                      : isPart
                      ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                      : 'bg-[#161616] text-[#888888] border-[#242424]'
                  }`}
                >
                  {isVerif ? 'Verified' : isPart ? 'Partially Verified' : 'Self-Reported'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Growth Note */}
        <p className="text-[11px] font-mono text-[#666666] pt-1">
          💡 You can re-verify skills or take advanced challenges anytime from your student profile.
        </p>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onFinish}
        className="w-full py-3.5 bg-[#E50914] hover:bg-[#C40812] text-white text-xs sm:text-sm font-mono font-bold rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2"
      >
        <span>Go to Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
