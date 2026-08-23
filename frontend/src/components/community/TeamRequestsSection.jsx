import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Clock,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { teamRequestAPI } from '../../services/api';

export const TeamRequestsSection = ({ title = 'Team Requests', maxItems = 10, isCompact = false }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await teamRequestAPI.getTeamRequests();
      if (res.data.success) {
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      }
    } catch (err) {
      console.error('Failed to load team requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleUpdateStatus = async (requestId, status) => {
    setActionLoadingId(requestId);
    try {
      const res = await teamRequestAPI.updateRequestStatus(requestId, status);
      if (res.data.success) {
        setIncoming(prev =>
          prev.map(r => (r._id === requestId ? { ...r, status } : r))
        );
        success(`Team request ${status}!`);
      }
    } catch (err) {
      error(err.response?.data?.message || `Failed to ${status} request.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingIncoming = incoming.filter(r => r.status === 'pending');
  const itemsToDisplay = (activeTab === 'incoming' ? incoming : outgoing).slice(0, maxItems);

  if (!user) return null;

  return (
    <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-5 sm:p-6 shadow-soft space-y-4">
      {/* Header with Title & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#703344]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#F6E8E2] text-base leading-tight">
              {title}
            </h3>
            <p className="text-xs text-[#DDA081] font-medium">
              Manage Community recruitment & team requests
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#281A21] border border-[#703344] rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'incoming'
                ? 'bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40 shadow-xs'
                : 'text-[#DDA081] hover:text-[#F6E8E2]'
            }`}
          >
            <span>Incoming</span>
            {pendingIncoming.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#A84A4D] text-[#F6E8E2] text-[10px] flex items-center justify-center font-bold">
                {pendingIncoming.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'outgoing'
                ? 'bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40 shadow-xs'
                : 'text-[#DDA081] hover:text-[#F6E8E2]'
            }`}
          >
            <span>My Sent</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#281A21] rounded-2xl animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-[#703344]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#703344] rounded w-1/3" />
                <div className="h-2.5 bg-[#703344]/60 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : itemsToDisplay.length === 0 ? (
        <div className="text-center py-6 text-xs text-[#DDA081]">
          {activeTab === 'incoming'
            ? 'No team join requests received yet.'
            : 'You have not sent any team join requests.'}
        </div>
      ) : (
        <div className="space-y-3">
          {itemsToDisplay.map((req) => {
            const isPending = req.status === 'pending';
            const isAccepted = req.status === 'accepted';
            const isRejected = req.status === 'rejected';

            if (activeTab === 'incoming') {
              return (
                <div
                  key={req._id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={
                        req.requester?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester?.name || 'User'}`
                      }
                      alt={req.requester?.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#703344] bg-[#4A2A35] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#F6E8E2] text-xs sm:text-sm">
                        <span className="text-[#CB6B5A]">{req.requester?.name}</span> wants to join:
                      </p>
                      <p className="font-extrabold text-[#F6E8E2] text-xs sm:text-sm truncate">
                        "{req.post?.title || req.post?.content || 'Team Project'}"
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-[#DDA081] mt-1 flex-wrap">
                        {req.requester?.college && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-[#DDA081]" />
                            {req.requester.college}
                          </span>
                        )}
                        {req.requester?.headline && (
                          <span>• {req.requester.headline}</span>
                        )}
                      </div>

                      {req.message && (
                        <p className="text-[11px] text-[#DDA081] italic bg-[#4A2A35] p-2 rounded-lg border border-[#703344] mt-1.5">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Incoming */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req._id, 'accepted')}
                          disabled={actionLoadingId === req._id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#5B8A68] hover:bg-[#6D9F7C] active:scale-95 text-white flex items-center gap-1 shadow-xs transition-all"
                        >
                          {actionLoadingId === req._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req._id, 'rejected')}
                          disabled={actionLoadingId === req._id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#4A2A35] hover:bg-[#703344] hover:text-[#E07D82] text-[#DDA081] border border-[#703344] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : isAccepted ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#5B8A68]/30 text-[#86B190] border border-[#5B8A68]/40 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#86B190]" />
                        <span>Accepted</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#C04A4D]/20 text-[#E07D82] border border-[#C04A4D]/30">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Outgoing Request Card
            return (
              <div
                key={req._id}
                className="p-3.5 rounded-2xl bg-[#281A21] border border-[#703344] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#DDA081]">You requested to join:</span>
                    <span className="font-bold text-[#F6E8E2] truncate max-w-[200px]">
                      {req.post?.title || req.post?.content || 'Team Project'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#DDA081] mt-0.5">
                    Created by {req.postAuthor?.name || 'Creator'}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isAccepted ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#5B8A68]/30 text-[#86B190] border border-[#5B8A68]/40 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#86B190]" />
                      <span>✓ You're part of this team.</span>
                    </span>
                  ) : isPending ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#D99443]/20 text-[#E5B079] border border-[#D99443]/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#E5B079]" />
                      <span>Pending Creator</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#C04A4D]/20 text-[#E07D82] border border-[#C04A4D]/30">
                      Not Accepted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
