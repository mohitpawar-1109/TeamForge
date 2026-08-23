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
    <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header: Overview and Health Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F1F1F]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
              Project Skill Gap Analysis
            </h3>
            <span
              className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                overallCoverage >= 100
                  ? 'bg-[#20D47A]/10 text-[#20D47A] border-[#20D47A]/30'
                  : overallCoverage >= 60
                  ? 'bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/30'
                  : 'bg-[#FF1F2D]/10 text-[#FF1F2D] border-[#FF1F2D]/30'
              }`}
            >
              {overallCoverage}% Coverage
            </span>
          </div>
          <p className="text-xs font-mono text-[#888888] mt-1">
            Comparing <span className="font-bold text-[#F5F5F5]">Required Project Skills</span> vs <span className="font-bold text-[#F5F5F5]">Current Team Skills</span>.
          </p>
        </div>

        {/* Health & Coverage Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] block">
              Team Readiness
            </span>
            <span className="text-lg font-mono font-bold text-[#F5F5F5]">{teamHealth}%</span>
          </div>

          <div className="w-36 bg-[#161616] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#242424]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallCoverage >= 100
                  ? 'bg-[#20D47A]'
                  : overallCoverage >= 60
                  ? 'bg-[#F2B705]'
                  : 'bg-[#FF1F2D]'
              }`}
              style={{ width: `${overallCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424] text-center">
          <span className="text-[9px] font-mono font-bold uppercase text-[#20D47A] block">Covered</span>
          <span className="text-base font-mono font-bold text-[#20D47A]">{coveredCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424] text-center">
          <span className="text-[9px] font-mono font-bold uppercase text-[#F2B705] block">Partially Covered</span>
          <span className="text-base font-mono font-bold text-[#F2B705]">{partialCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424] text-center">
          <span className="text-[9px] font-mono font-bold uppercase text-[#FF1F2D] block">Missing Gaps</span>
          <span className="text-base font-mono font-bold text-[#FF1F2D]">{missingCount || 0}</span>
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
            // SKILLS_MATRIX
          </h4>
          <span className="text-[10px] font-mono text-[#666666]">
            {details.length} Required Competencies Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {details.map((item, idx) => {
            const isCovered = item.status === 'Covered';
            const isPartial = item.status === 'Partial';

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#161616] border border-[#242424] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCovered ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#20D47A] flex-shrink-0" />
                    ) : isPartial ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F2B705] flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#FF1F2D] flex-shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{item.skill}</span>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isCovered
                        ? 'bg-[#111111] text-[#20D47A] border-[#20D47A]/30'
                        : isPartial
                        ? 'bg-[#111111] text-[#F2B705] border-[#F2B705]/30'
                        : 'bg-[#111111] text-[#FF1F2D] border-[#FF1F2D]/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#888888]">
                  {isCovered ? (
                    <span className="text-[#20D47A]">
                      Covered by {(item.coveringMembers || []).map((m) => m.name).join(', ') || 'Team member'}
                    </span>
                  ) : isPartial ? (
                    <span className="text-[#F2B705]">
                      Foundational knowledge ({item.bestProficiency || 'Beginner'})
                    </span>
                  ) : (
                    <span className="text-[#FF1F2D]">No current team member has this skill</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Students */}
      {recommendedStudents && recommendedStudents.length > 0 && (
        <div className="pt-4 border-t border-[#1F1F1F] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-full bg-[#161616] text-[#E50914] border border-[#242424]">
                <Sparkles className="w-3 h-3" />
              </span>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E50914]">
                Students Recommended to Fill Skill Gaps
              </h4>
            </div>

            <Link
              to={`/projects/${projectId}/matches`}
              className="text-xs font-mono font-bold text-[#E50914] hover:underline inline-flex items-center gap-1"
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
                  className="bg-[#161616] border border-[#242424] rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          student.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name || 'User'}`
                        }
                        alt={student.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#242424] bg-[#111111]"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{student.name}</h5>
                        <p className="text-[10px] font-mono text-[#888888] truncate">{student.headline || student.course}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#20D47A]">{item.matchScore}%</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888888] block mb-1">
                      Fills Gaps In:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(item.filledSkills || []).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#F5F5F5] border border-[#242424]"
                        >
                          {s} ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#242424] flex items-center justify-between">
                    <a
                      href={`/profile?id=${student._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-[#888888] hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#F2B705] bg-[#F2B705]/10 border border-[#F2B705]/30 px-2.5 py-0.5 rounded-full">
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
                        Invite
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
              <label className="block text-[10px] font-mono font-bold uppercase text-[#888888] mb-1.5">Assigned Role</label>
              <input
                type="text"
                required
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#888888] mb-1.5">Personalized Message</label>
              <textarea
                rows={3}
                required
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-4 py-3 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-2xl focus:border-[#E50914] focus:outline-none resize-none placeholder:text-[#555555]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
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
