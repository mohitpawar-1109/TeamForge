import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  CheckSquare,
  Star,
  MessageSquarePlus,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProjectFeedbackModal } from './ProjectFeedbackModal';

export const ProjectCredibilityCard = ({ project, isMemberOrOwner }) => {
  const { user: currentUser } = useAuth();
  const [credibility, setCredibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const fetchCredibility = async () => {
    if (!project?._id) return;
    try {
      setLoading(true);
      const res = await verificationAPI.getProjectCredibility(project._id);
      if (res.data.success) {
        setCredibility(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project credibility:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredibility();
  }, [project?._id]);

  if (loading) {
    return (
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-44 bg-[#161616] rounded-full" />
        <div className="h-20 bg-[#161616] rounded-2xl" />
      </div>
    );
  }

  if (!credibility) return null;

  const {
    credibilityScore = 80,
    tier = 'Verified Project',
    breakdown = {},
    stats = {}
  } = credibility;

  return (
    <>
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#161616] border border-[#242424] text-[#20D47A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Project Credibility Index
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30">
                  {tier}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#888888] mt-0.5">
                Computed from verified member skill authenticity, task execution & peer evaluations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase text-[#888888] block">Credibility</span>
              <div className="text-2xl font-bold text-white font-mono">
                {credibilityScore}<span className="text-xs text-[#888888]">/100</span>
              </div>
            </div>

            {isMemberOrOwner && (
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Evaluate</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Signals Bar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#161616] p-3.5 rounded-2xl border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Verified Contributors</div>
            <div className="text-lg font-bold text-white font-mono">{breakdown.verifiedContributors || 0}%</div>
            <div className="text-[9px] font-mono text-[#666666] mt-0.5">
              {stats.verifiedMembersCount || 0}/{stats.totalMembers || 0} members verified
            </div>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-2xl border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Task Execution</div>
            <div className="text-lg font-bold text-[#20D47A] font-mono">{breakdown.taskExecution || 0}%</div>
            <div className="text-[9px] font-mono text-[#666666] mt-0.5">
              {stats.completedTasks || 0}/{stats.totalTasks || 0} completed
            </div>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-2xl border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Peer Reviews</div>
            <div className="text-lg font-bold text-[#F2B705] font-mono">{breakdown.peerReviews || 0}%</div>
            <div className="text-[9px] font-mono text-[#666666] mt-0.5">
              {stats.reviewsCount || 0} evaluations recorded
            </div>
          </div>

          <div className="bg-[#161616] p-3.5 rounded-2xl border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Collaboration</div>
            <div className="text-lg font-bold text-[#E50914] font-mono">{breakdown.collaborationActivity || 0}%</div>
            <div className="text-[9px] font-mono text-[#666666] mt-0.5">
              Active workspace activity
            </div>
          </div>
        </div>
      </div>

      {isFeedbackOpen && (
        <ProjectFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          project={project}
          onFeedbackSubmitted={() => fetchCredibility()}
        />
      )}
    </>
  );
};
