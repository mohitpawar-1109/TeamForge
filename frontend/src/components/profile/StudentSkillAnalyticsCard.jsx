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
      <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-6 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-[#111113] rounded-2xl" />
          <div className="h-28 bg-[#111113] rounded-2xl" />
          <div className="h-28 bg-[#111113] rounded-2xl" />
        </div>
        <div className="h-44 bg-[#111113] rounded-2xl" />
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
    <div className="bg-gradient-to-b from-[#18181B] to-[#111113] rounded-3xl border border-indigo-500/20 p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Top Banner: Overall Score & Verified Data Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#27272A] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
              Verified Student Skill Analytics
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Skill Scoring & Contribution Index
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Computed from real project activity, completed tasks, peer endorsements & skill proficiency.
          </p>
        </div>

        {/* Big Overall Score Card */}
        <div className="flex items-center gap-5 bg-[#09090B]/80 backdrop-blur-md border border-indigo-500/30 p-4 sm:p-5 rounded-2xl shadow-xl flex-shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
              Overall Score
            </span>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {overallScore}
              <span className="text-xs text-zinc-500 font-normal">/100</span>
            </div>
          </div>

          <div className="h-10 w-px bg-[#27272A]" />

          <div className="space-y-1 text-xs">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{overallTier}</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-medium">
              {skillScores.length} Skills Profiled
            </div>
          </div>
        </div>
      </div>

      {/* 4 Application Proof Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-[#111113] rounded-2xl p-4 border border-[#27272A] shadow-soft">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{projects.total || 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {projects.created || 0} Lead • {projects.joined || 0} Team Member
          </div>
        </div>

        <div className="bg-[#111113] rounded-2xl p-4 border border-[#27272A] shadow-soft">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasks Done</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{contributions.completedTasks || 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Completed across team boards
          </div>
        </div>

        <div className="bg-[#111113] rounded-2xl p-4 border border-[#27272A] shadow-soft">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contributions</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{contributions.total || 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {contributions.postsCreated || 0} Posts • {contributions.commentsAuthored || 0} Comments
          </div>
        </div>

        <div className="bg-[#111113] rounded-2xl p-4 border border-[#27272A] shadow-soft">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Endorsements</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{endorsements.total || 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Peer developer validations
          </div>
        </div>
      </div>

      {/* Individual Skill Scores Table & Progress Bars */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Individual Skill Competency Breakdown</span>
          </h3>
          <span className="text-[11px] text-zinc-500">
            Calculated score + verified projects & task multiplier
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
                className="bg-[#111113] rounded-2xl p-4 border border-[#27272A] hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    {skill.verified && (
                      <span title="Verified Skill">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {skill.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-indigo-300">{skill.score}%</span>
                    <Badge
                      variant={
                        skill.masteryLevel === 'Mastery'
                          ? 'purple'
                          : skill.masteryLevel === 'Advanced'
                          ? 'brand'
                          : 'default'
                      }
                      size="sm"
                    >
                      {skill.masteryLevel}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#18181B] h-2 rounded-full overflow-hidden border border-[#27272A]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.score >= 90
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        : skill.score >= 80
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>

                {/* Proof details and Endorse Action */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>
                    Self: <strong className="text-zinc-300">{skill.proficiency}</strong>
                    {skill.endorsementsCount > 0 && (
                      <span className="ml-2 text-amber-400 font-semibold">
                        ★ {skill.endorsementsCount} Endorsement{skill.endorsementsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>

                  {!isSelf && currentUser && (
                    <button
                      onClick={() => handleEndorseSkill(skill.name)}
                      disabled={hasEndorsed || endorsingSkill === skill.name}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        hasEndorsed
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 cursor-default'
                          : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/50'
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

      {/* Category Radar / Domain Distribution */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-[#111113] rounded-2xl p-5 border border-[#27272A] space-y-3 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Domain Competency Index
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-[#18181B] p-3 rounded-xl border border-[#27272A]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-300">{cat.category}</span>
                  <span className="font-bold text-indigo-400">{cat.averageScore}%</span>
                </div>
                <div className="w-full bg-[#111113] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: `${cat.averageScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {cat.skillsCount} skill{cat.skillsCount > 1 ? 's' : ''} mapped
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
