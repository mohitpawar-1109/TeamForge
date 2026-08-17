import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, Check, Users } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { userAPI, groupAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const InviteMemberModal = ({ isOpen, onClose, group, onMemberInvited }) => {
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existingMemberIds = new Set(
    (group?.members || []).map(m => (m.user?._id || m.user)?.toString())
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
      setSearch('');
      setRole('member');
      fetchUsers('');
    }
  }, [isOpen]);

  const fetchUsers = async (query) => {
    try {
      setLoading(true);
      const res = await userAPI.getUsers({ search: query, limit: 15 });
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchUsers(val);
  };

  const toggleSelectUser = (uId) => {
    if (selectedUserIds.includes(uId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== uId));
    } else {
      setSelectedUserIds([...selectedUserIds, uId]);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      error('Please select at least one student to invite.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await groupAPI.inviteMembers(group._id, {
        userIds: selectedUserIds,
        role
      });

      if (res.data.success) {
        success(res.data.message || 'Members added successfully!');
        if (onMemberInvited) onMemberInvited(res.data.data);
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to invite members.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite Teammates to "${group?.name || 'Group'}"`}
      subtitle="Search developers and add them to this collaboration squad."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleInvite} className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, skills, course or college..."
            className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Role Selection */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#111113] border border-[#27272A]">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Assigned Role:</span>
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-[#18181B] border border-[#27272A] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="member">Member (Regular)</option>
            <option value="lead">Team Lead</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-[#27272A]/40">
          {loading ? (
            <div className="text-center py-8 text-xs text-zinc-400">Loading developers...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">No matching students found.</div>
          ) : (
            users.map((u) => {
              const isAlreadyMember = existingMemberIds.has(u._id);
              const isSelected = selectedUserIds.includes(u._id);

              return (
                <div
                  key={u._id}
                  onClick={() => !isAlreadyMember && toggleSelectUser(u._id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    isAlreadyMember
                      ? 'opacity-50 bg-[#111113] cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-950/60 border border-indigo-500/50 cursor-pointer'
                      : 'bg-[#111113] hover:bg-[#27272A]/50 border border-transparent cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover border border-[#27272A] bg-[#18181B] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{u.headline || u.college}</p>
                    </div>
                  </div>

                  <div>
                    {isAlreadyMember ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        In Group
                      </span>
                    ) : isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
          <span className="text-xs text-zinc-400 font-medium">
            {selectedUserIds.length} student{selectedUserIds.length !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              loading={submitting}
              disabled={selectedUserIds.length === 0}
              icon={UserPlus}
            >
              Add to Group
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
