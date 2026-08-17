import React, { useState, useEffect } from 'react';
import { Users, Globe, Lock, MessageSquare, Search, Check, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { groupAPI, userAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'General',
  'AI & Machine Learning',
  'Web Development',
  'Mobile & Flutter',
  'Blockchain & Web3',
  'Competitive Coding',
  'UI/UX Design',
  'Cloud & DevOps',
  'Hackathons'
];

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState('group'); // 'group' | 'dm'
  const [groupType, setGroupType] = useState('public'); // 'public' | 'private'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // DM search state
  const [userSearch, setUserSearch] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCategory('General');
      setTags([]);
      setTagInput('');
      setGroupType('public');
      setMode('group');
      setSelectedUser(null);
      setUserSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'dm' && isOpen) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const res = await userAPI.getUsers({ search: userSearch, limit: 10 });
          if (res.data.success) {
            // Exclude current user
            const filtered = (res.data.data || []).filter(u => u._id !== user?._id);
            setUsersList(filtered);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingUsers(false);
        }
      };

      const delayDebounce = setTimeout(() => {
        fetchUsers();
      }, 250);

      return () => clearTimeout(delayDebounce);
    }
  }, [mode, userSearch, isOpen, user?._id]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'dm') {
      if (!selectedUser) {
        error('Please select a student to start a direct message.');
        return;
      }
      try {
        setLoading(true);
        const res = await groupAPI.getOrCreateDM(selectedUser._id);
        if (res.data.success) {
          success(`Started conversation with ${selectedUser.name}!`);
          onGroupCreated(res.data.data);
          onClose();
        }
      } catch (err) {
        error(err.response?.data?.message || 'Failed to start direct message.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Group Creation Mode
    if (!name.trim()) {
      error('Please provide a group name.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type: groupType,
        category,
        tags
      };

      const res = await groupAPI.createGroup(payload);
      if (res.data.success) {
        success(`Group "${res.data.data.name}" created successfully!`);
        onGroupCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'group' ? 'Create a New Collaboration Group' : 'Start a Direct Message'}
      subtitle="Connect, chat, and organize real-time project squads with fellow developers."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode Selector (Group vs Direct Message) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#111113] rounded-xl border border-[#27272A]">
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'group'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community or Team Group</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('dm')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'dm'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Message (1-on-1)</span>
          </button>
        </div>

        {mode === 'group' ? (
          <>
            {/* Group Type Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Privacy & Access
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setGroupType('public')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    groupType === 'public'
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-[#111113] border-[#27272A] hover:border-zinc-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Public Community</span>
                      {groupType === 'public' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Anyone on TeamForge can discover, join, and participate.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setGroupType('private')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    groupType === 'private'
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-[#111113] border-[#27272A] hover:border-zinc-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Private Group</span>
                      {groupType === 'private' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Members can only join via direct invite from group admins.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Group Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Next.js Hackathon Enthusiasts or ML Research Squad"
                className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Topic & Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What is the goal or focus of this group? e.g. Discussing project architectures, finding hackathon teammates, sharing resources."
                className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Tags ({tags.length}/5)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag & press Enter"
                  className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tags Pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Direct Message (DM) Student Selector */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Search Students
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, course, college or skills..."
                  className="w-full bg-[#111113] border border-[#27272A] focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-[#27272A]/40">
              {loadingUsers ? (
                <div className="p-4 text-center text-xs text-zinc-400">Searching developers...</div>
              ) : usersList.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No other students found matching query.
                </div>
              ) : (
                usersList.map((u) => {
                  const isSelected = selectedUser?._id === u._id;
                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelectedUser(u)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/60 border border-indigo-500/50'
                          : 'bg-[#111113] hover:bg-[#27272A]/50 border border-transparent'
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

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272A]">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="md"
            loading={loading}
            icon={Sparkles}
          >
            {mode === 'group' ? 'Create Group' : 'Start Chat'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
