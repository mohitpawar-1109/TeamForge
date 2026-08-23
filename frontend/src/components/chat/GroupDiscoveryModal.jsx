import React, { useState, useEffect } from 'react';
import { Compass, Search, Users, Globe, ArrowRight, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { groupAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'All',
  'AI & Machine Learning',
  'Web Development',
  'Mobile & Flutter',
  'Blockchain & Web3',
  'Competitive Coding',
  'UI/UX Design',
  'Cloud & DevOps',
  'Hackathons',
  'General'
];

export const GroupDiscoveryModal = ({ isOpen, onClose, onSelectGroup }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchPublicGroups = async () => {
    try {
      setLoading(true);
      const res = await groupAPI.getGroups({
        type: 'public',
        scope: 'discover',
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined
      });

      if (res.data.success) {
        setGroups(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPublicGroups();
    }
  }, [isOpen, category, search]);

  const handleJoin = async (group) => {
    try {
      setJoiningId(group._id);
      const res = await groupAPI.joinGroup(group._id);
      if (res.data.success) {
        success(`You joined "${group.name}"!`);
        onSelectGroup(res.data.data);
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to join group.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discover Public Communities & Groups"
      subtitle="Explore open squads, interest clubs, and hackathon groups across campus."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#DDA081] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search public groups by keyword, technology, or tag..."
              className="w-full bg-[#281A21] border border-[#703344] focus:border-[#CB6B5A] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F6E8E2] placeholder-[#DDA081]/60 focus:outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#281A21] border border-[#703344] focus:border-[#CB6B5A] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#F6E8E2] focus:outline-none"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-[#281A21] text-[#F6E8E2]">{cat}</option>
            ))}
          </select>
        </div>

        {/* Group Cards Grid */}
        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#DDA081] gap-2">
              <div className="w-6 h-6 border-2 border-[#A84A4D] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Discovering open communities...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-[#281A21] border border-[#703344]">
              <Compass className="w-10 h-10 text-[#DDA081] mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-[#F6E8E2]">No public groups found</h4>
              <p className="text-xs text-[#DDA081] mt-1 max-w-sm mx-auto">
                No open community groups matched your current query. Be the first to create one!
              </p>
            </div>
          ) : (
            groups.map((group) => {
              const isMember = group.members?.some(
                m => (m.user?._id || m.user)?.toString() === user?._id?.toString()
              );

              return (
                <div
                  key={group._id}
                  className="bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/50 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center flex-shrink-0 font-bold text-base">
                      {group.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-[#F6E8E2] truncate">{group.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5B8A68]/20 text-[#86B190] border border-[#5B8A68]/40">
                          {group.category || 'General'}
                        </span>
                        <span className="text-[10px] text-[#DDA081] flex items-center gap-1 font-medium">
                          <Users className="w-3 h-3 text-[#DDA081]" />
                          {group.members?.length || 1} member{group.members?.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <p className="text-xs text-[#DDA081] line-clamp-2 leading-relaxed mb-2">
                        {group.description || 'A collaborative space for developers to connect and build.'}
                      </p>

                      {/* Tags */}
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {group.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#4A2A35] text-[#DDA081] border border-[#703344]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#703344]">
                    {isMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSelectGroup(group);
                          onClose();
                        }}
                        icon={ArrowRight}
                      >
                        Open Chat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={joiningId === group._id}
                        onClick={() => handleJoin(group)}
                        icon={Plus}
                      >
                        Join Group
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
