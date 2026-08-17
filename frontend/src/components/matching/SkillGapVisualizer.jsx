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
    <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-6 sm:p-8 shadow-soft space-y-6">
      {/* Header: Overview and Health Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-black text-[#FAFAFA] tracking-tight">
              Project Skill Gap Analysis
            </h3>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                overallCoverage >= 100
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                  : overallCoverage >= 60
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
              }`}
            >
              {overallCoverage}% Coverage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Comparing <span className="font-bold text-zinc-200">Required Project Skills</span> vs <span className="font-bold text-zinc-200">Current Team Skills</span>.
          </p>
        </div>

        {/* Health & Coverage Metrics */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Team Readiness
            </span>
            <span className="text-xl font-black text-white">{teamHealth}%</span>
          </div>

          <div className="w-36 bg-[#111113] h-3 rounded-full overflow-hidden p-0.5 border border-[#27272A]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallCoverage >= 100
                  ? 'bg-emerald-500'
                  : overallCoverage >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overallCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-400 block">Covered</span>
          <span className="text-lg font-black text-emerald-300">{coveredCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-center">
          <span className="text-[10px] font-bold uppercase text-amber-400 block">Partially Covered</span>
          <span className="text-lg font-black text-amber-300">{partialCount || 0}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-center">
          <span className="text-[10px] font-bold uppercase text-rose-400 block">Missing Gaps</span>
          <span className="text-lg font-black text-rose-300">{missingCount || 0}</span>
        </div>
      </div>

      {/* Skills Matrix: Covered vs Partial vs Missing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Skills Status Matrix
          </h4>
          <span className="text-[11px] text-zinc-500">
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
                    ? 'bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : isPartial
                    ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCovered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isPartial ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-bold text-white truncate">{item.skill}</span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isCovered
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : isPartial
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Team member coverage details if present */}
                <div className="text-[11px] text-zinc-400">
                  {isCovered ? (
                    <span className="text-emerald-300/80">
                      Covered by {(item.coveringMembers || []).map((m) => m.name).join(', ') || 'Team member'}
                    </span>
                  ) : isPartial ? (
                    <span className="text-amber-300/80">
                      Foundational knowledge ({item.bestProficiency || 'Beginner'}) — needs reinforcement
                    </span>
                  ) : (
                    <span className="text-rose-300/80">No current team member has this skill</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Students Who Fill Missing & Partial Skills */}
      {recommendedStudents && recommendedStudents.length > 0 && (
        <div className="pt-4 border-t border-[#27272A] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Students Recommended to Fill Skill Gaps
              </h4>
            </div>

            <Link
              to={`/projects/${projectId}/matches`}
              className="text-xs font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
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
                  className="bg-[#111113] border border-[#27272A] hover:border-indigo-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          student.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name || 'User'}`
                        }
                        alt={student.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#27272A] bg-[#18181B]"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{student.name}</h5>
                        <p className="text-[11px] text-zinc-400 truncate">{student.headline || student.course}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-400">{item.matchScore}%</span>
                  </div>

                  {/* Fills Skills Tags */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      Fills Gaps In:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(item.filledSkills || []).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30"
                        >
                          {s} ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between">
                    <a
                      href={`/profile?id=${student._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Assigned Role</label>
              <input
                type="text"
                required
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#111113] border border-[#27272A] text-white rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Personalized Message</label>
              <textarea
                rows={3}
                required
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#111113] border border-[#27272A] text-white rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCandidate(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
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
