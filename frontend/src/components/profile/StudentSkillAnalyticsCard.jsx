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
  BarChart2,
  FileCheck2,
  AlertTriangle,
  PlayCircle,
  MessageSquarePlus,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { userAPI, verificationAPI, trustAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SkillAssessmentModal } from '../verification/SkillAssessmentModal';
import { SkillVerificationReportModal } from '../verification/SkillVerificationReportModal';
import { UserFeedbackModal } from '../verification/UserFeedbackModal';

export const StudentSkillAnalyticsCard = ({ userId, initialUser }) => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [trustProfile, setTrustProfile] = useState(null);
  const [peerFeedbacks, setPeerFeedbacks] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endorsingSkill, setEndorsingSkill] = useState(null);

  // Modals state
  const [assessmentModalState, setAssessmentModalState] = useState({
    isOpen: false,
    skillName: '',
    claimedLevel: 'Intermediate'
  });
  const [reportModalState, setReportModalState] = useState({
    isOpen: false,
    report: null
  });
  const [feedbackModalState, setFeedbackModalState] = useState({
    isOpen: false,
    targetUser: null,
    projectId: null
  });

  const isSelf = currentUser && (currentUser._id === userId || !userId);
  const targetId = userId || currentUser?._id;

  const fetchData = async () => {
    if (!targetId) return;
    try {
      setLoading(true);

      const [scoresRes, verifsRes, trustRes, feedbackRes] = await Promise.allSettled([
        userAPI.getSkillScores(targetId),
        verificationAPI.getUserSkillVerifications(targetId),
        trustAPI.getUserTrustScore(targetId),
        verificationAPI.getUserFeedback(targetId)
      ]);

      if (scoresRes.status === 'fulfilled' && scoresRes.value?.data?.success) {
        setAnalytics(scoresRes.value.data.data);
      }
      if (verifsRes.status === 'fulfilled' && verifsRes.value?.data?.success) {
        setVerifications(verifsRes.value.data.data || []);
      }
      if (trustRes.status === 'fulfilled' && trustRes.value?.data?.success) {
        setTrustProfile(trustRes.value.data.data);
      }
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value?.data?.success) {
        setPeerFeedbacks(feedbackRes.value.data.data || []);
      }

      // Check if visitor has shared project with profile user to enable peer reviews
      if (!isSelf && currentUser) {
        try {
          const myProjectsRes = await projectAPI.getProjects({ limit: 50 });
          if (myProjectsRes.data.success) {
            const list = myProjectsRes.data.data || [];
            const shared = list.filter((p) => {
              const pOwner = p.owner?._id || p.owner;
              const pMembers = (p.members || []).map((m) => m.user?._id || m.user);
              const hasTarget = pOwner?.toString() === targetId.toString() || pMembers.some((m) => m?.toString() === targetId.toString());
              return hasTarget;
            });
            setSharedProjects(shared);
          }
        } catch (pErr) {
          console.error(pErr);
        }
      }
    } catch (err) {
      console.error('Failed to load skill verification analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, currentUser]);

  const handleEndorseSkill = async (skillName) => {
    if (isSelf) {
      error('You cannot endorse your own skills.');
      return;
    }

    try {
      setEndorsingSkill(skillName);
      const res = await userAPI.endorseSkill(targetId, skillName);

      if (res.data.success) {
        success(res.data.message || `Endorsed ${skillName}! ⭐`);
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to endorse skill.');
    } finally {
      setEndorsingSkill(null);
    }
  };

  const handleOpenAssessment = (skillName, claimedLevel) => {
    setAssessmentModalState({
      isOpen: true,
      skillName,
      claimedLevel: claimedLevel || 'Intermediate'
    });
  };

  const handleOpenReport = (skillName) => {
    const v = verifications.find(
      (item) => (item.skillName || '').toLowerCase() === (skillName || '').toLowerCase()
    );
    if (v) {
      setReportModalState({
        isOpen: true,
        report: v
      });
    } else {
      error(`No verification report available for ${skillName} yet.`);
    }
  };

  const handleAssessmentCompleted = (result) => {
    fetchData();
    setReportModalState({
      isOpen: true,
      report: result
    });
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

  // Map verification status to each skill score
  const verifMap = {};
  verifications.forEach((v) => {
    verifMap[(v.skillName || '').toLowerCase()] = v;
  });

  const verifiedSkillsCount = verifications.filter((v) => v.status === 'VERIFIED').length;

  return (
    <>
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft space-y-8 relative overflow-hidden">
        {/* Top Banner: Trust Index & Quick Verification Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#1F1F1F] relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-full bg-[#161616] text-[#E50914] border border-[#242424]">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E50914]">
                Skill Verification & Authenticity Engine
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
              Evidence-Based Skill Authenticity & Trust
            </h2>
            <p className="text-xs font-mono text-[#888888] mt-1">
              Evaluated through adaptive practical assessments, real project tasks, consistency checks & peer reviews.
            </p>
          </div>

          {/* Big Trust Profile Card */}
          <div className="flex items-center gap-5 bg-[#161616] border border-[#242424] p-4 sm:p-5 rounded-2xl shadow-sm flex-shrink-0">
            <div className="text-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888888] block mb-0.5">
                Trust Score
              </span>
              <div className="text-3xl font-bold text-white">
                {trustProfile?.overallTrustScore || overallScore}
                <span className="text-xs text-[#888888] font-normal">/100</span>
              </div>
            </div>

            <div className="h-10 w-px bg-[#242424]" />

            <div className="space-y-1 text-xs font-mono">
              <div className="font-bold text-[#20D47A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{trustProfile?.tier || overallTier}</span>
              </div>
              <div className="text-[10px] text-[#888888]">
                {verifiedSkillsCount} Verified • {skillScores.length} Claimed
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Peer Reviews</span>
              <Star className="w-4 h-4 text-[#F2B705]" />
            </div>
            <div className="text-xl font-bold text-[#F2B705]">{peerFeedbacks.length}</div>
            <div className="text-[10px] font-mono text-[#666666] mt-0.5">
              {endorsements.total || 0} Skill Endorsements
            </div>
          </div>
        </div>

        {/* VERIFIED SKILLS & SKILL TEST DASHBOARD */}
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#20D47A]" />
                <span>Skill Verification & Assessment Center</span>
              </h3>
              <p className="text-[11px] font-mono text-[#888888] mt-0.5">
                Take adaptive assessments to prove authenticity and boost project matching priority
              </p>
            </div>

            <div className="text-[10px] font-mono text-[#666666]">
              {isSelf ? 'Take tests to earn verified badges' : 'Verified by platform tests'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillScores.map((skill, idx) => {
              const sName = skill.name;
              const verif = verifMap[sName.toLowerCase()];
              const isVerified = verif?.status === 'VERIFIED' || skill.verified;
              const status = verif?.status || (skill.verified ? 'VERIFIED' : 'UNVERIFIED');
              const hasReport = !!verif;

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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#F5F5F5]">{skill.name}</span>
                        {isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#20D47A]" />
                        )}
                        <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#111111] text-[#888888] border border-[#242424]">
                          {skill.category}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#888888] mt-1">
                        Claimed: <span className="text-white font-semibold">{skill.proficiency}</span>
                        {verif?.verifiedLevel && verif.verifiedLevel !== 'Unverified' && (
                          <span className="ml-2 text-[#20D47A]">
                            • Verified: <strong>{verif.verifiedLevel}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border ${
                        status === 'VERIFIED'
                          ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30 font-bold'
                          : status === 'PARTIALLY_VERIFIED'
                          ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                          : 'bg-[#111111] text-[#888888] border-[#242424]'
                      }`}
                    >
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Progress Bar with Confidence */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#888888]">
                      <span>Authenticity Confidence</span>
                      <span className="text-white font-bold">
                        {verif?.verifiedConfidence || skill.score}%
                      </span>
                    </div>
                    <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isVerified ? 'bg-[#20D47A]' : 'bg-[#E50914]'
                        }`}
                        style={{ width: `${verif?.verifiedConfidence || skill.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Verification Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F1F1F]">
                    <div className="flex items-center gap-2">
                      {isSelf ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenAssessment(skill.name, skill.proficiency)}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono px-3 py-1 rounded-full bg-[#E50914] hover:bg-[#C40812] text-white font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>{hasReport ? 'Re-verify' : 'Take Skill Test'}</span>
                          </button>

                          {hasReport && (
                            <button
                              type="button"
                              onClick={() => handleOpenReport(skill.name)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#111111] hover:bg-[#202020] border border-[#242424] text-[#A1A1A1] transition-all cursor-pointer"
                            >
                              <FileCheck2 className="w-3 h-3 text-[#20D47A]" />
                              <span>Report</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {hasReport && (
                            <button
                              type="button"
                              onClick={() => handleOpenReport(skill.name)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#111111] hover:bg-[#202020] border border-[#242424] text-[#A1A1A1] transition-all cursor-pointer"
                            >
                              <FileCheck2 className="w-3 h-3 text-[#20D47A]" />
                              <span>View Test Report</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {!isSelf && currentUser && (
                      <button
                        onClick={() => handleEndorseSkill(skill.name)}
                        disabled={hasEndorsed || endorsingSkill === skill.name}
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
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

        {/* TRUST & REPUTATION 5-FACTOR PROFILE */}
        {trustProfile && (
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#242424] space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F2B705]" />
                <span>Multi-Factor Trust & Reputation Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-[#20D47A] font-bold">
                Tier: {trustProfile.tier}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Skill Verification</div>
                <div className="text-base font-bold text-white font-mono">{trustProfile.breakdown?.skillVerification || 0}%</div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#20D47A]" style={{ width: `${trustProfile.breakdown?.skillVerification || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Project Contribution</div>
                <div className="text-base font-bold text-white font-mono">{trustProfile.breakdown?.projectContribution || 0}%</div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#E50914]" style={{ width: `${trustProfile.breakdown?.projectContribution || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Team Reliability</div>
                <div className="text-base font-bold text-white font-mono">{trustProfile.breakdown?.teamReliability || 0}%</div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#20D47A]" style={{ width: `${trustProfile.breakdown?.teamReliability || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Peer Feedback</div>
                <div className="text-base font-bold text-[#F2B705] font-mono">{trustProfile.breakdown?.peerFeedback || 0}%</div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#F2B705]" style={{ width: `${trustProfile.breakdown?.peerFeedback || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#111111] p-3 rounded-xl border border-[#242424]">
                <div className="text-[10px] font-mono text-[#888888] uppercase mb-1">Community Activity</div>
                <div className="text-base font-bold text-white font-mono">{trustProfile.breakdown?.communityContribution || 0}%</div>
                <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#E50914]" style={{ width: `${trustProfile.breakdown?.communityContribution || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PEER COLLABORATION REVIEWS */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E50914]" />
              <span>Teammate Collaboration Reviews</span>
            </h3>

            {!isSelf && sharedProjects.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFeedbackModalState({
                    isOpen: true,
                    targetUser: initialUser || { _id: targetId, name: analytics.studentName },
                    projectId: sharedProjects[0]._id
                  })
                }
                className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-[#F2B705]" />
                <span>Leave Peer Review</span>
              </button>
            )}
          </div>

          {peerFeedbacks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {peerFeedbacks.map((fb, idx) => {
                const avgStars = (
                  (fb.technicalSkills + fb.communication + fb.reliability + fb.contribution) /
                  4
                ).toFixed(1);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#161616] border border-[#242424] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            fb.author?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${fb.author?.name || 'Peer'}`
                          }
                          alt=""
                          className="w-7 h-7 rounded-full border border-[#242424] bg-[#111111]"
                        />
                        <div>
                          <div className="text-xs font-bold text-white font-mono">
                            {fb.author?.name || 'Verified Teammate'}
                          </div>
                          <div className="text-[10px] font-mono text-[#666666]">
                            Project: {fb.project?.title || 'Shared Project'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111111] border border-[#242424] text-xs font-mono text-[#F2B705] font-bold">
                        <Star className="w-3 h-3 fill-[#F2B705]" />
                        <span>{avgStars}</span>
                      </div>
                    </div>

                    {fb.writtenFeedback && (
                      <p className="text-xs text-[#D0D0D0] italic bg-[#111111] p-3 rounded-xl border border-[#242424] leading-relaxed">
                        "{fb.writtenFeedback}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pt-1">
                      <span>Reliability: {fb.reliability}/5 • Tech: {fb.technicalSkills}/5</span>
                      {fb.wouldWorkAgain && (
                        <span className="text-[#20D47A]">✓ Would collaborate again</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] text-xs font-mono text-[#888888] text-center">
              No peer collaboration reviews recorded yet. Reviews are unlocked between team members upon active project collaboration.
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {assessmentModalState.isOpen && (
        <SkillAssessmentModal
          isOpen={assessmentModalState.isOpen}
          skillName={assessmentModalState.skillName}
          claimedLevel={assessmentModalState.claimedLevel}
          onClose={() => setAssessmentModalState((prev) => ({ ...prev, isOpen: false }))}
          onCompleted={handleAssessmentCompleted}
        />
      )}

      {reportModalState.isOpen && (
        <SkillVerificationReportModal
          isOpen={reportModalState.isOpen}
          report={reportModalState.report}
          onClose={() => setReportModalState({ isOpen: false, report: null })}
          onRetake={(sName, cLevel) => handleOpenAssessment(sName, cLevel)}
        />
      )}

      {feedbackModalState.isOpen && (
        <UserFeedbackModal
          isOpen={feedbackModalState.isOpen}
          targetUser={feedbackModalState.targetUser}
          projectId={feedbackModalState.projectId}
          onClose={() => setFeedbackModalState({ isOpen: false, targetUser: null, projectId: null })}
          onFeedbackSubmitted={() => fetchData()}
        />
      )}
    </>
  );
};
