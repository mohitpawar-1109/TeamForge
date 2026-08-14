import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Users, Mail, CheckCircle2 } from 'lucide-react';
import { projectAPI, inviteAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CandidateCard } from '../components/cards/CandidateCard';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export const ProjectMatchesPage = () => {
  const { id } = useParams();
  const { success, error } = useToast();

  const [matches, setMatches] = useState([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);

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
      </div>

      {/* Match Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-600">No candidate matches found at the moment.</p>
          <p className="text-xs text-slate-400 mt-1">Try updating required project skills to broaden match criteria.</p>
        </div>
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
