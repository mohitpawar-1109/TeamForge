import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  ThumbsUp,
  FolderGit2,
  Activity,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Star,
  CheckSquare,
  MessageSquare,
  Users,
  BarChart2
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const StudentSkillAnalyticsCard = ({ userId, initialUser }) => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endorsingSkill, setEndorsingSkill] = useState(null);

  const isSelf = currentUser && (currentUser._id === userId || !userId);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const targetId = userId || currentUser?._id;
      if (!targetId) return;

      const res = await userAPI.getSkillScores(targetId);
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load skill analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId, currentUser]);

  const handleEndorseSkill = async (skillName) => {
    if (isSelf) {
      error('You cannot endorse your own skills.');
      return;
    }

    try {
      setEndorsingSkill(skillName);
      const targetId = userId || initialUser?._id;
      const res = await userAPI.endorseSkill(targetId, skillName);

      if (res.data.success) {
        success(res.data.message || `Endorsed ${skillName}! ⭐`);
        setAnalytics(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to endorse skill.');
    } finally {
      setEndorsingSkill(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-[#161616] rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-[#161616] rounded-2xl" />
          <div className="h-28 bg-[#161616] rounded-2xl" />
          <div className="h-28 bg-[#161616] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    overallScore,
    overallTier,
    skillScores = [],
    categoryBreakdown = [],
    projects = {},
    contributions = {},
    endorsements = {}
  } = analytics;

  return (
    <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft space-y-8 relative overflow-hidden">
      {/* Top Banner: Overall Score & Verified Data Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#1F1F1F] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-full bg-[#161616] text-[#E50914] border border-[#242424]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E50914]">
              Verified Skill Analytics
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            Skill Scoring & Contribution Index
          </h2>
          <p className="text-xs font-mono text-[#888888] mt-1">
            Computed from real project activity, completed tasks, peer endorsements & skill proficiency.
          </p>
        </div>

        {/* Big Overall Score Card */}
        <div className="flex items-center gap-5 bg-[#161616] border border-[#242424] p-4 sm:p-5 rounded-2xl shadow-sm flex-shrink-0">
          <div className="text-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888888] block mb-0.5">
              Overall Score
            </span>
            <div className="text-3xl font-bold text-white">
              {overallScore}
              <span className="text-xs text-[#888888] font-normal">/100</span>
            </div>
          </div>

          <div className="h-10 w-px bg-[#242424]" />

          <div className="space-y-1 text-xs font-mono">
            <div className="font-bold text-[#20D47A] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{overallTier}</span>
            </div>
            <div className="text-[10px] text-[#888888]">
              {skillScores.length} Skills Profiled
            </div>
          </div>
        </div>
      </div>

      {/* 4 Application Proof Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424]">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-[#A1A1A1]" />
          </div>
          <div className="text-xl font-bold text-[#F5F5F5]">{projects.total || 0}</div>
          <div className="text-[10px] font-mono text-[#666666] mt-0.5">
            {projects.created || 0} Lead • {projects.joined || 0} Member
          </div>
        </div>

        <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424]">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tasks Done</span>
            <CheckSquare className="w-4 h-4 text-[#20D47A]" />
          </div>
          <div className="text-xl font-bold text-[#20D47A]">{contributions.completedTasks || 0}</div>
          <div className="text-[10px] font-mono text-[#666666] mt-0.5">
            Completed across team boards
          </div>
        </div>

        <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424]">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Contributions</span>
            <Activity className="w-4 h-4 text-[#E50914]" />
          </div>
          <div className="text-xl font-bold text-[#E50914]">{contributions.total || 0}</div>
          <div className="text-[10px] font-mono text-[#666666] mt-0.5">
            {contributions.postsCreated || 0} Posts • {contributions.commentsAuthored || 0} Comments
          </div>
        </div>

        <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424]">
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Endorsements</span>
            <Star className="w-4 h-4 text-[#F2B705]" />
          </div>
          <div className="text-xl font-bold text-[#F2B705]">{endorsements.total || 0}</div>
          <div className="text-[10px] font-mono text-[#666666] mt-0.5">
            Peer developer validations
          </div>
        </div>
      </div>

      {/* Individual Skill Scores */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#E50914]" />
            <span>Individual Skill Competency Breakdown</span>
          </h3>
          <span className="text-[10px] font-mono text-[#666666]">
            Calculated score + task multiplier
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillScores.map((skill, idx) => {
            const hasEndorsed =
              currentUser &&
              (skill.endorsements || []).some(
                (e) => (e.user?._id || e.user)?.toString() === currentUser._id?.toString()
              );

            return (
              <div
                key={idx}
                className="bg-[#161616] rounded-2xl p-4 border border-[#242424] hover:border-[#333333] transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-[#F5F5F5]">{skill.name}</span>
                    {skill.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#20D47A]" />
                    )}
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#111111] text-[#888888] border border-[#242424]">
                      {skill.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E50914]">{skill.score}%</span>
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#111111] text-[#A1A1A1] border border-[#242424]">
                      {skill.masteryLevel}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                  <div
                    className="h-full rounded-full bg-[#E50914] transition-all duration-500"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>

                {/* Proof details and Endorse Action */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pt-1">
                  <span>
                    Self: <strong className="text-[#F5F5F5]">{skill.proficiency}</strong>
                    {skill.endorsementsCount > 0 && (
                      <span className="ml-2 text-[#F2B705]">
                        ★ {skill.endorsementsCount}
                      </span>
                    )}
                  </span>

                  {!isSelf && currentUser && (
                    <button
                      onClick={() => handleEndorseSkill(skill.name)}
                      disabled={hasEndorsed || endorsingSkill === skill.name}
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        hasEndorsed
                          ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                          : 'bg-[#111111] text-white border-[#242424] hover:bg-[#202020]'
                      }`}
                    >
                      <ThumbsUp className="w-2.5 h-2.5" />
                      <span>{hasEndorsed ? 'Endorsed' : 'Endorse'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Domain Distribution */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-[#161616] rounded-2xl p-5 border border-[#242424] space-y-3 relative z-10">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
            Domain Competency Index
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[#F5F5F5]">{cat.category}</span>
                  <span className="font-bold text-[#E50914]">{cat.averageScore}%</span>
                </div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E50914] rounded-full"
                    style={{ width: `${cat.averageScore}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-[#666666] mt-1 block">
                  {cat.skillsCount} mapped
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
