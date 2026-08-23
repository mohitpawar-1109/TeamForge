import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, Clock, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { inviteAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

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
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Team Invitations</h1>
        <p className="text-xs sm:text-sm text-[#888888] mt-1">
          Review incoming recruitment requests from team leads and track invitations you have dispatched.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-2">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          Received Requests ({received.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          Sent Invitations ({sent.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-[#111111] border border-[#242424] rounded-3xl animate-pulse" />)}
        </div>
      ) : activeTab === 'received' ? (
        received.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No invitations received yet"
            description="When project creators discover your skills and match criteria, team invitations will appear here."
            actionLabel="Explore Active Projects"
            actionLink="/projects"
          />
        ) : (
          <div className="space-y-4">
            {received.map((inv) => (
              <div
                key={inv._id}
                className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={inv.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.sender?.name}`}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-[#242424] bg-[#161616] flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F5F5] text-sm sm:text-base">{inv.project?.title}</h4>
                      <Badge variant={inv.status === 'accepted' ? 'success' : inv.status === 'declined' ? 'danger' : 'brand'}>
                        {inv.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-mono text-[#888888] mt-1">
                      Invited by <span className="font-semibold text-[#F5F5F5]">{inv.sender?.name}</span> ({inv.sender?.college}) as <span className="font-bold text-[#E50914]">{inv.role || 'Contributor'}</span>
                    </p>

                    {inv.message && (
                      <p className="text-xs text-[#D0D0D0] mt-2 italic bg-[#161616] p-2.5 rounded-2xl border border-[#242424]">
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
                        className="hover:text-[#FF1F2D] hover:border-[#FF1F2D]/40"
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
                    <span className="text-xs font-mono text-[#666666]">Declined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        sent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No invitations dispatched yet"
            description="Navigate to your project recommended teammates to invite matched students to collaborate."
            actionLabel="View My Projects"
            actionLink="/my-projects"
          />
        ) : (
          <div className="space-y-4">
            {sent.map((inv) => (
              <div
                key={inv._id}
                className="bg-[#111111] rounded-3xl border border-[#242424] p-5 shadow-soft flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={inv.receiver?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.receiver?.name}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-[#242424] bg-[#161616]"
                  />
                  <div>
                    <h4 className="font-bold text-[#F5F5F5] text-sm">
                      Invited {inv.receiver?.name} to "{inv.project?.title}"
                    </h4>
                    <p className="text-xs font-mono text-[#888888] mt-0.5">
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
