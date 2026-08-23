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
      <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-[#703344] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-[#281A21] rounded-2xl" />
          <div className="h-28 bg-[#281A21] rounded-2xl" />
          <div className="h-28 bg-[#281A21] rounded-2xl" />
        </div>
        <div className="h-44 bg-[#281A21] rounded-2xl" />
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
    <div className="bg-gradient-to-b from-[#4A2A35] to-[#281A21] rounded-3xl border border-[#703344] p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Top Banner: Overall Score & Verified Data Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#703344] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#CB6B5A]">
              Verified Student Skill Analytics
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#F6E8E2] tracking-tight">
            Skill Scoring & Contribution Index
          </h2>
          <p className="text-xs text-[#DDA081] mt-1">
            Computed from real project activity, completed tasks, peer endorsements & skill proficiency.
          </p>
        </div>

        {/* Big Overall Score Card */}
        <div className="flex items-center gap-5 bg-[#281A21]/90 backdrop-blur-md border border-[#703344] p-4 sm:p-5 rounded-2xl shadow-xl flex-shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block mb-0.5">
              Overall Score
            </span>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#CB6B5A] via-[#DDA081] to-[#F6E8E2]">
              {overallScore}
              <span className="text-xs text-[#DDA081] font-normal">/100</span>
            </div>
          </div>

          <div className="h-10 w-px bg-[#703344]" />

          <div className="space-y-1 text-xs">
            <div className="font-bold text-[#86B190] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{overallTier}</span>
            </div>
            <div className="text-[11px] text-[#DDA081] font-medium">
              {skillScores.length} Skills Profiled
            </div>
          </div>
        </div>
      </div>

      {/* 4 Application Proof Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-[#281A21] rounded-2xl p-4 border border-[#703344] shadow-soft">
          <div className="flex items-center justify-between text-[#DDA081] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-[#CB6B5A]" />
          </div>
          <div className="text-2xl font-black text-[#F6E8E2]">{projects.total || 0}</div>
          <div className="text-[11px] text-[#DDA081] mt-0.5">
            {projects.created || 0} Lead • {projects.joined || 0} Team Member
          </div>
        </div>

        <div className="bg-[#281A21] rounded-2xl p-4 border border-[#703344] shadow-soft">
          <div className="flex items-center justify-between text-[#DDA081] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasks Done</span>
            <CheckSquare className="w-4 h-4 text-[#86B190]" />
          </div>
          <div className="text-2xl font-black text-[#86B190]">{contributions.completedTasks || 0}</div>
          <div className="text-[11px] text-[#DDA081] mt-0.5">
            Completed across team boards
          </div>
        </div>

        <div className="bg-[#281A21] rounded-2xl p-4 border border-[#703344] shadow-soft">
          <div className="flex items-center justify-between text-[#DDA081] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contributions</span>
            <Activity className="w-4 h-4 text-[#CB6B5A]" />
          </div>
          <div className="text-2xl font-black text-[#CB6B5A]">{contributions.total || 0}</div>
          <div className="text-[11px] text-[#DDA081] mt-0.5">
            {contributions.postsCreated || 0} Posts • {contributions.commentsAuthored || 0} Comments
          </div>
        </div>

        <div className="bg-[#281A21] rounded-2xl p-4 border border-[#703344] shadow-soft">
          <div className="flex items-center justify-between text-[#DDA081] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Endorsements</span>
            <Star className="w-4 h-4 text-[#E5B079]" />
          </div>
          <div className="text-2xl font-black text-[#E5B079]">{endorsements.total || 0}</div>
          <div className="text-[11px] text-[#DDA081] mt-0.5">
            Peer developer validations
          </div>
        </div>
      </div>

      {/* Individual Skill Scores Table & Progress Bars */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F6E8E2] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#CB6B5A]" />
            <span>Individual Skill Competency Breakdown</span>
          </h3>
          <span className="text-[11px] text-[#DDA081]">
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
                className="bg-[#281A21] rounded-2xl p-4 border border-[#703344] hover:border-[#CB6B5A]/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F6E8E2]">{skill.name}</span>
                    {skill.verified && (
                      <span title="Verified Skill">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#86B190]" />
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4A2A35] text-[#DDA081] border border-[#703344]">
                      {skill.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#CB6B5A]">{skill.score}%</span>
                    <Badge
                      variant={
                        skill.masteryLevel === 'Mastery'
                          ? 'terracotta'
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
                <div className="w-full bg-[#4A2A35] h-2 rounded-full overflow-hidden border border-[#703344]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.score >= 90
                        ? 'bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A]'
                        : skill.score >= 80
                        ? 'bg-[#CB6B5A]'
                        : 'bg-[#5B8A68]'
                    }`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>

                {/* Proof details and Endorse Action */}
                <div className="flex items-center justify-between text-[11px] text-[#DDA081] pt-1">
                  <span>
                    Self: <strong className="text-[#F6E8E2]">{skill.proficiency}</strong>
                    {skill.endorsementsCount > 0 && (
                      <span className="ml-2 text-[#E5B079] font-semibold">
                        ★ {skill.endorsementsCount} Endorsement{skill.endorsementsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>

                  {!isSelf && currentUser && (
                    <button
                      onClick={() => handleEndorseSkill(skill.name)}
                      disabled={hasEndorsed || endorsingSkill === skill.name}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        hasEndorsed
                          ? 'bg-[#D99443]/20 text-[#E5B079] border-[#D99443]/40 cursor-default'
                          : 'bg-[#703344] text-[#F6E8E2] border-[#A84A4D]/40 hover:bg-[#A84A4D]'
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
        <div className="bg-[#281A21] rounded-2xl p-5 border border-[#703344] space-y-3 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#DDA081]">
            Domain Competency Index
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-[#4A2A35] p-3 rounded-xl border border-[#703344]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#F6E8E2]">{cat.category}</span>
                  <span className="font-bold text-[#CB6B5A]">{cat.averageScore}%</span>
                </div>
                <div className="w-full bg-[#281A21] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] rounded-full"
                    style={{ width: `${cat.averageScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#DDA081] mt-1 block">
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
