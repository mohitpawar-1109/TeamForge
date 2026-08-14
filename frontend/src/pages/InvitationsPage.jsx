import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, Clock, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { inviteAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const InvitationsPage = () => {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const { success, error } = useToast();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await inviteAPI.getInvitations();
      if (res.data.success) {
        setReceived(res.data.data.received || []);
        setSent(res.data.data.sent || []);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (inviteId, status) => {
    try {
      const res = await inviteAPI.respondInvitation(inviteId, status);
      if (res.data.success) {
        success(`Invitation ${status === 'accepted' ? 'accepted! You are now part of the team 🎉' : 'declined.'}`);
        fetchInvitations();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to respond to invitation.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Team Invitations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review incoming recruitment requests from team leads and track invitations you have dispatched.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'received'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Received Requests ({received.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'sent'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sent Invitations ({sent.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : activeTab === 'received' ? (
        received.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No invitations received</h3>
            <p className="text-xs text-slate-500 mt-1">When team leads discover your profile, invites will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {received.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={inv.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.sender?.name}`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{inv.project?.title}</h4>
                      <Badge variant={inv.status === 'accepted' ? 'success' : inv.status === 'declined' ? 'danger' : 'brand'}>
                        {inv.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      Invited by <span className="font-semibold">{inv.sender?.name}</span> ({inv.sender?.college}) as <span className="font-bold text-brand-700">{inv.role || 'Contributor'}</span>
                    </p>

                    {inv.message && (
                      <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{inv.message}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {inv.status === 'pending' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={XCircle}
                        onClick={() => handleRespond(inv._id, 'declined')}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleRespond(inv._id, 'accepted')}
                      >
                        Accept & Join
                      </Button>
                    </>
                  ) : inv.status === 'accepted' ? (
                    <Link to={`/projects/${inv.project?._id}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Open Workspace
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Declined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Sent Tab */
        sent.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <h3 className="font-bold text-slate-800 text-base">No invitations dispatched</h3>
            <p className="text-xs text-slate-500 mt-1">Navigate to your project matches to recruit candidate students.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sent.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={inv.receiver?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.receiver?.name}`}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Invited {inv.receiver?.name} to "{inv.project?.title}"
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Role: {inv.role || 'Member'} • Sent {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Badge variant={inv.status === 'accepted' ? 'success' : inv.status === 'declined' ? 'danger' : 'brand'}>
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
