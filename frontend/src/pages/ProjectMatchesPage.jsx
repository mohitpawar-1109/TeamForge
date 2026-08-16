import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Users, Mail, CheckCircle2, Brain } from 'lucide-react';
import { projectAPI, inviteAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CandidateCard } from '../components/cards/CandidateCard';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { AiMatchVisualizer3D } from '../components/matching/AiMatchVisualizer3D';

export const ProjectMatchesPage = () => {
  const { id } = useParams();
  const { success, error } = useToast();

  const [matches, setMatches] = useState([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [show3DVisualizer, setShow3DVisualizer] = useState(false);

  // Invite Modal state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [inviteRole, setInviteRole] = useState('Contributor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getMatches(id);
      if (res.data.success) {
        setMatches(res.data.data);
        setProjectTitle(res.data.projectTitle);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const handleOpenInvite = (candidate) => {
    setSelectedCandidate(candidate);
    setInviteRole('Team Contributor');
    setInviteMessage(`Hey ${candidate.name}! We saw your verified profile and would love to have you build "${projectTitle}" with us!`);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setSendingInvite(true);
    try {
      const res = await inviteAPI.sendInvitation({
        receiverId: selectedCandidate._id,
        projectId: id,
        role: inviteRole,
        message: inviteMessage
      });

      if (res.data.success) {
        success(`Invitation sent to ${selectedCandidate.name}! ✉️`);
        setSelectedCandidate(null);
        fetchMatches(); // refresh status
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recommended Teammates
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              SMART MATCH
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ranked candidates for <span className="font-bold text-slate-700">"{projectTitle}"</span> calculated from skill coverage, interests, and schedule compatibility.
          </p>
        </div>

        <Button
          variant={show3DVisualizer ? 'secondary' : 'gradient'}
          size="md"
          icon={Brain}
          onClick={() => setShow3DVisualizer(!show3DVisualizer)}
          className={!show3DVisualizer ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-extrabold shadow-md' : ''}
        >
          {show3DVisualizer ? 'Close 3D Match' : '✨ 3D AI Match Flow'}
        </Button>
      </div>

      {/* 3D AI Match Visualizer Section */}
      {show3DVisualizer && (
        <AiMatchVisualizer3D
          projectId={id}
          onClose={() => setShow3DVisualizer(false)}
          onTeammateInvited={() => fetchMatches()}
        />
      )}

      {/* Match Results Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidate matches found yet"
          description="Try updating your required project skills or team roles to expand the AI matching criteria."
          actionLabel="Edit Project Roles"
          actionLink={`/projects/${id}`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((item) => (
            <CandidateCard
              key={item.student._id}
              candidateData={item}
              onInvite={handleOpenInvite}
              onViewProfile={(sid) => window.open(`/profile?id=${sid}`, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={`Invite ${selectedCandidate?.name} to Team`}
        subtitle={`Project: ${projectTitle}`}
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role in Project</label>
            <input
              type="text"
              required
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              placeholder="e.g. ML Engineer, UI/UX Lead, Backend Developer"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Personalized Message</label>
            <textarea
              rows={3}
              required
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setSelectedCandidate(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" loading={sendingInvite} icon={Mail} type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
