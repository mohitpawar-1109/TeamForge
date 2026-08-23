import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Users,
  Mail,
  UserCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { inviteAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const SkillGapVisualizer = ({ gapData, projectId, projectTitle, onInviteSent }) => {
  const { success, error } = useToast();

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [inviteRole, setInviteRole] = useState('Contributor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [invitingId, setInvitingId] = useState(null);

  if (!gapData) return null;

  const {
    overallCoverage,
    coveredCount,
    partialCount,
    totalRequired,
    missingCount,
    details = [],
    missingSkills = [],
    partialSkills = [],
    coveredSkills = [],
    recommendedStudents = [],
    teamHealth = 85
  } = gapData;

  const handleOpenInvite = (candidateObj) => {
    setSelectedCandidate(candidateObj);
    const candidate = candidateObj.student || candidateObj;
    setInviteRole('Team Specialist');
    setInviteMessage(
      `Hey ${candidate.name}! We saw your expertise in ${(candidateObj.filledSkills || []).join(', ')} and would love for you to join our squad for "${projectTitle || 'our project'}".`
    );
  };

  const handleSendInvite = async (e) => {
    e?.preventDefault();
    if (!selectedCandidate) return;

    const candidate = selectedCandidate.student || selectedCandidate;
    setInvitingId(candidate._id);

    try {
      const res = await inviteAPI.sendInvitation({
        receiverId: candidate._id,
        projectId,
        role: inviteRole,
        message: inviteMessage
      });

      if (res.data.success) {
        success(`Invitation sent to ${candidate.name}! ✉️`);
        setSelectedCandidate(null);
        if (onInviteSent) onInviteSent();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header: Overview and Health Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#703344]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-black text-[#F6E8E2] tracking-tight">
              Project Skill Gap Analysis
            </h3>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                overallCoverage >= 100
                  ? 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40'
                  : overallCoverage >= 60
                  ? 'bg-[#D99443]/20 text-[#E5B079] border-[#D99443]/40'
                  : 'bg-[#C04A4D]/20 text-[#E07D82] border-[#C04A4D]/40'
              }`}
            >
              {overallCoverage}% Coverage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#DDA081] mt-1">
            Comparing <span className="font-bold text-[#F6E8E2]">Required Project Skills</span> vs <span className="font-bold text-[#F6E8E2]">Current Team Skills</span>.
          </p>
        </div>

        {/* Health & Coverage Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block">
              Team Readiness
            </span>
            <span className="text-xl font-black text-[#F6E8E2]">{teamHealth}%</span>
          </div>

          <div className="w-36 bg-[#281A21] h-3 rounded-full overflow-hidden p-0.5 border border-[#703344]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallCoverage >= 100
                  ? 'bg-[#5B8A68]'
                  : overallCoverage >= 60
                  ? 'bg-[#D99443]'
                  : 'bg-[#C04A4D]'
              }`}
              style={{ width: `${overallCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#5B8A68]/15 border border-[#5B8A68]/30 text-center">
          <span className="text-[10px] font-bold uppercase text-[#86B190] block">Covered</span>
          <span className="text-lg font-black text-[#86B190]">{coveredCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#D99443]/15 border border-[#D99443]/30 text-center">
          <span className="text-[10px] font-bold uppercase text-[#E5B079] block">Partially Covered</span>
          <span className="text-lg font-black text-[#E5B079]">{partialCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#C04A4D]/15 border border-[#C04A4D]/30 text-center">
          <span className="text-[10px] font-bold uppercase text-[#E07D82] block">Missing Gaps</span>
          <span className="text-lg font-black text-[#E07D82]">{missingCount || 0}</span>
        </div>
      </div>

      {/* Skills Matrix: Covered vs Partial vs Missing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#DDA081]">
            Skills Status Matrix
          </h4>
          <span className="text-[11px] text-[#DDA081]/70">
            {details.length} Required Competencies Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {details.map((item, idx) => {
            const isCovered = item.status === 'Covered';
            const isPartial = item.status === 'Partial';
            const isMissing = item.status === 'Missing';

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                  isCovered
                    ? 'bg-[#5B8A68]/10 border-[#5B8A68]/30 hover:border-[#5B8A68]/50'
                    : isPartial
                    ? 'bg-[#D99443]/10 border-[#D99443]/30 hover:border-[#D99443]/50'
                    : 'bg-[#C04A4D]/10 border-[#C04A4D]/30 hover:border-[#C04A4D]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCovered ? (
                      <CheckCircle2 className="w-4 h-4 text-[#86B190] flex-shrink-0" />
                    ) : isPartial ? (
                      <AlertTriangle className="w-4 h-4 text-[#E5B079] flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#E07D82] flex-shrink-0" />
                    )}
                    <span className="text-sm font-bold text-[#F6E8E2] truncate">{item.skill}</span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isCovered
                        ? 'bg-[#281A21] text-[#86B190] border-[#5B8A68]/40'
                        : isPartial
                        ? 'bg-[#281A21] text-[#E5B079] border-[#D99443]/40'
                        : 'bg-[#281A21] text-[#E07D82] border-[#C04A4D]/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Team member coverage details if present */}
                <div className="text-[11px] text-[#DDA081]">
                  {isCovered ? (
                    <span className="text-[#86B190]/90">
                      Covered by {(item.coveringMembers || []).map((m) => m.name).join(', ') || 'Team member'}
                    </span>
                  ) : isPartial ? (
                    <span className="text-[#E5B079]/90">
                      Foundational knowledge ({item.bestProficiency || 'Beginner'}) — needs reinforcement
                    </span>
                  ) : (
                    <span className="text-[#E07D82]/90">No current team member has this skill</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Students Who Fill Missing & Partial Skills */}
      {recommendedStudents && recommendedStudents.length > 0 && (
        <div className="pt-4 border-t border-[#703344] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#CB6B5A]">
                Students Recommended to Fill Skill Gaps
              </h4>
            </div>

            <Link
              to={`/projects/${projectId}/matches`}
              className="text-xs font-semibold text-[#CB6B5A] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Matches</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStudents.slice(0, 3).map((item, idx) => {
              const student = item.student || {};
              const isPending = item.invitationStatus === 'pending';

              return (
                <div
                  key={student._id || idx}
                  className="bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/60 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          student.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name || 'User'}`
                        }
                        alt={student.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#703344] bg-[#4A2A35]"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#F6E8E2] truncate">{student.name}</h5>
                        <p className="text-[11px] text-[#DDA081] truncate">{student.headline || student.course}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-[#86B190]">{item.matchScore}%</span>
                  </div>

                  {/* Fills Skills Tags */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] block mb-1">
                      Fills Gaps In:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(item.filledSkills || []).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40"
                        >
                          {s} ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-[#703344] flex items-center justify-between">
                    <a
                      href={`/profile?id=${student._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#DDA081] hover:text-[#F6E8E2] inline-flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E5B079] bg-[#D99443]/20 border border-[#D99443]/40 px-2.5 py-1 rounded-lg">
                        <UserCheck className="w-3 h-3" />
                        <span>Invited</span>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Mail}
                        onClick={() => handleOpenInvite(item)}
                        className="text-xs py-1"
                      >
                        Invite to Squad
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Invite ${selectedCandidate.student?.name} to Fill Skill Gaps`}
          subtitle={`Fills: ${(selectedCandidate.filledSkills || []).join(', ')}`}
        >
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Assigned Role</label>
              <input
                type="text"
                required
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:border-[#CB6B5A] focus:outline-none placeholder:text-[#DDA081]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Personalized Message</label>
              <textarea
                rows={3}
                required
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:border-[#CB6B5A] focus:outline-none resize-none placeholder:text-[#DDA081]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#703344]">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCandidate(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={invitingId === selectedCandidate.student?._id}
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
