import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Zap,
  Mail,
  RefreshCw,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { projectAPI, inviteAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AiTeamRecommendationPanel = ({ projectId, onInviteSent }) => {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [invitingId, setInvitingId] = useState(null);
  const [invitingAll, setInvitingAll] = useState(false);

  // Single Invite Modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getTeamRecommendations(projectId);
      if (res.data.success) {
        setData(res.data.data);
        setProjectTitle(res.data.projectTitle);
      }
    } catch (err) {
      console.error('[AI Recommendation Error]:', err);
      error(err.response?.data?.message || 'Failed to generate AI team recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  const handleOpenInvite = (item) => {
    setSelectedMember(item);
    setInviteRole(item.role || 'Core Developer');
    setInviteMessage(
      `Hey ${item.student?.name}! Our AI matching algorithm recommended you as our ${item.role || 'Team Member'} for "${projectTitle}" with a ${item.matchScore}% compatibility score.`
    );
  };

  const handleSendSingleInvite = async (e) => {
    e?.preventDefault();
    if (!selectedMember) return;

    try {
      setInvitingId(selectedMember.student._id);
      const res = await inviteAPI.sendInvitation({
        receiverId: selectedMember.student._id,
        projectId,
        role: inviteRole,
        message: inviteMessage
      });

      if (res.data.success) {
        success(`Invitation sent to ${selectedMember.student.name}! ✉️`);
        setSelectedMember(null);
        // Mark as pending locally
        setData((prev) => ({
          ...prev,
          recommendedTeam: prev.recommendedTeam.map((m) =>
            m.student._id === selectedMember.student._id ? { ...m, invitationStatus: 'pending' } : m
          )
        }));
        if (onInviteSent) onInviteSent();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInvitingId(null);
    }
  };

  const handleInviteEntireSquad = async () => {
    if (!data?.recommendedTeam || data.recommendedTeam.length === 0) return;

    const uninvited = data.recommendedTeam.filter((m) => m.invitationStatus !== 'pending');
    if (uninvited.length === 0) {
      success('Invitations have already been sent to all recommended teammates!');
      return;
    }

    if (!window.confirm(`Send invitations to all ${uninvited.length} recommended teammates for this squad?`)) return;

    try {
      setInvitingAll(true);
      let sentCount = 0;

      for (const member of uninvited) {
        try {
          await inviteAPI.sendInvitation({
            receiverId: member.student._id,
            projectId,
            role: member.role || 'Team Contributor',
            message: `Hey ${member.student.name}! You are recommended for our ${member.role || 'Contributor'} role in "${projectTitle}" (${member.matchScore}% match). Join our squad!`
          });
          sentCount++;
        } catch (subErr) {
          console.warn(`Failed to invite ${member.student?.name}:`, subErr.message);
        }
      }

      success(`Successfully sent ${sentCount} squad invitations! 🎉`);
      fetchRecommendations();
      if (onInviteSent) onInviteSent();
    } catch (err) {
      error('Encountered an issue sending squad invitations.');
    } finally {
      setInvitingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#4A2A35] border border-[#703344] rounded-3xl p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#703344] rounded-xl" />
            <div className="h-4 w-72 bg-[#703344]/60 rounded-lg" />
          </div>
          <div className="h-14 w-28 bg-[#703344] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-[#281A21] rounded-2xl border border-[#703344]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.recommendedTeam || data.recommendedTeam.length === 0) {
    return (
      <div className="bg-[#4A2A35] border border-[#703344] rounded-3xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#F6E8E2]">No Team Recommendations Available</h3>
          <p className="text-xs text-[#DDA081] mt-1 max-w-md mx-auto">
            All team slots might already be filled, or you can adjust your required project skills to discover more candidates.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchRecommendations} icon={RefreshCw}>
          Re-run AI Analysis
        </Button>
      </div>
    );
  }

  const { teamCompatibilityScore, teamSynergySummary, totalSkillsCovered, totalSkillsRequired, skillCoveragePercentage, recommendedTeam } = data;

  return (
    <div className="bg-[#4A2A35] border border-[#703344] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Header: Score Banner & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40">
              <Brain className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#DDA081]">
              AI Squad Architecture Engine
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#F6E8E2] tracking-tight">
            Optimal Complementary Team
          </h2>

          <p className="text-xs sm:text-sm text-[#F6E8E2]/90 max-w-2xl leading-relaxed">
            {teamSynergySummary}
          </p>
        </div>

        {/* Big Team Compatibility Metric Card */}
        <div className="flex items-center gap-4 sm:gap-6 bg-[#281A21] border border-[#703344] p-4 sm:p-5 rounded-2xl shadow-xl flex-shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block mb-0.5">
              Team Compatibility
            </span>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#A84A4D] via-[#CB6B5A] to-[#DDA081]">
              {teamCompatibilityScore}%
            </div>
          </div>

          <div className="h-10 w-px bg-[#703344]" />

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-[#F6E8E2] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#86B190]" />
              <span>{totalSkillsCovered}/{totalSkillsRequired} Skills ({skillCoveragePercentage}%)</span>
            </div>
            <div className="text-[11px] text-[#DDA081] font-medium">
              {recommendedTeam.length} Squad Roles Identified
            </div>
          </div>
        </div>
      </div>

      {/* Squad Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#703344] relative z-10">
        <div className="flex items-center gap-2 text-xs text-[#DDA081]">
          <Zap className="w-4 h-4 text-[#E5B079]" />
          <span>
            Deterministic skill synthesis & Gemini AI contextual reasoning applied.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchRecommendations}
            icon={RefreshCw}
            className="text-xs"
          >
            Re-analyze
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleInviteEntireSquad}
            loading={invitingAll}
            icon={Mail}
            className="text-xs font-bold"
          >
            Invite Full Squad
          </Button>
        </div>
      </div>

      {/* Recommended Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative z-10">
        {recommendedTeam.map((item, index) => {
          const student = item.student || {};
          const isPending = item.invitationStatus === 'pending';

          return (
            <div
              key={student._id || index}
              className="bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/60 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between space-y-4 group"
            >
              {/* Top Header with Avatar, Name, Role & Match Score */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          student.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name || 'User'}`
                        }
                        alt={student.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#703344] bg-[#4A2A35]"
                      />
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#A84A4D] text-[#F6E8E2] font-bold text-[10px] flex items-center justify-center shadow-md">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F6E8E2] truncate group-hover:text-[#CB6B5A] transition-colors">
                          {student.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#DDA081] truncate mt-0.5">{student.headline || student.course}</p>
                      <p className="text-[11px] text-[#DDA081]/70 truncate">{student.college}</p>
                    </div>
                  </div>

                  {/* Individual Score Badge */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-base font-black text-[#86B190]">
                      {item.matchScore}%
                    </span>
                    <span className="text-[9px] font-bold text-[#DDA081] uppercase">Match</span>
                  </div>
                </div>

                {/* Why this person is recommended (Key AI Justification) */}
                <div className="p-3 rounded-xl bg-[#4A2A35] border border-[#703344] text-xs text-[#F6E8E2]/90 leading-relaxed mb-3">
                  <span className="font-bold text-[#CB6B5A] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#CB6B5A]" />
                    <span>Why Recommended:</span>
                  </span>
                  <p className="text-[11px] text-[#F6E8E2]/80">
                    {item.whyRecommended || 'Matches required technical proficiencies and complementary team dynamics.'}
                  </p>
                </div>

                {/* Skills Chips */}
                {item.matchedSkills && item.matchedSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block">
                      Contributed & Matched Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.matchedSkills.map((skill, sIdx) => {
                        const isMissingGap = (item.coveredMissingSkills || []).includes(skill);
                        return (
                          <span
                            key={sIdx}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                              isMissingGap
                                ? 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40'
                                : 'bg-[#4A2A35] text-[#F6E8E2] border-[#703344]'
                            }`}
                          >
                            {skill} {isMissingGap && '★'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="pt-3 border-t border-[#703344] flex items-center justify-between gap-2">
                <a
                  href={`/profile?id=${student._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#DDA081] hover:text-[#F6E8E2] inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {isPending ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E5B079] bg-[#D99443]/20 border border-[#D99443]/40 px-3 py-1.5 rounded-xl">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Invite Sent</span>
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenInvite(item)}
                    loading={invitingId === student._id}
                    icon={Mail}
                    className="text-xs"
                  >
                    Invite as {item.role}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Candidate Invitation Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Invite ${selectedMember.student?.name} to "${projectTitle}"`}
          subtitle={`AI Recommended Role: ${selectedMember.role} (${selectedMember.matchScore}% Match)`}
        >
          <form onSubmit={handleSendSingleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">
                Assigned Team Role
              </label>
              <input
                type="text"
                required
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="e.g. ML Lead, Frontend Architect, UI/UX Designer"
                className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:border-[#CB6B5A] focus:outline-none placeholder:text-[#DDA081]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">
                Personalized Invitation Message
              </label>
              <textarea
                rows={3}
                required
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:border-[#CB6B5A] focus:outline-none resize-none placeholder:text-[#DDA081]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#703344]">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedMember(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={invitingId === selectedMember.student?._id}
                icon={Mail}
              >
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
