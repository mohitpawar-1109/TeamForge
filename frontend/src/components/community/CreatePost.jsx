import React, { useState } from 'react';
import {
  Send,
  Link as LinkIcon,
  Image as ImageIcon,
  Tag,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postAPI } from '../../services/api';
import { POST_TYPES, PostTypeSelector } from './PostTypeSelector';
import { Button } from '../common/Button';

export const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [content, setContent] = useState('');
  const [type, setType] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [requiredRoles, setRequiredRoles] = useState([]);
  const [roleInput, setRoleInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [currentMembers, setCurrentMembers] = useState(1);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedTypeConfig = POST_TYPES.find(t => t.id === type) || POST_TYPES[0];

  const handleAddRole = (roleToAdd) => {
    const clean = (roleToAdd || roleInput).trim();
    if (clean && !requiredRoles.includes(clean) && requiredRoles.length < 6) {
      setRequiredRoles([...requiredRoles, clean]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setRequiredRoles(requiredRoles.filter(r => r !== roleToRemove));
  };

  const handleAddSkill = (skillToAdd) => {
    const clean = (skillToAdd || skillInput).trim();
    if (clean && !requiredSkills.includes(clean) && requiredSkills.length < 8) {
      setRequiredSkills([...requiredSkills, clean]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
  };

  const handleAddTag = (e) => {
    e?.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 6) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSuggestedTagClick = (sTag) => {
    const clean = sTag.replace(/^#/, '');
    if (!tags.includes(clean) && tags.length < 6) {
      setTags([...tags, clean]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      error('Please write something in your post.');
      return;
    }

    setLoading(true);
    try {
      const res = await postAPI.createPost({
        content: content.trim(),
        type,
        tags,
        projectLink: projectLink.trim(),
        image: imageUrl.trim(),
        title: title.trim(),
        requiredRoles,
        requiredSkills,
        teamSize: Number(teamSize) || 4,
        currentMembers: Number(currentMembers) || 1
      });

      if (res.data.success) {
        success('Post published to Community feed! 🎉');
        setContent('');
        setTitle('');
        setRequiredRoles([]);
        setRequiredSkills([]);
        setTeamSize(4);
        setCurrentMembers(1);
        setTags([]);
        setTagInput('');
        setProjectLink('');
        setImageUrl('');
        setShowExtras(false);
        if (onPostCreated) {
          onPostCreated(res.data.data);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const popularTagSuggestions = ['hackathon', 'aiml', 'webdev', 'teammates', 'react', 'python', 'figma'];

  return (
    <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-5 sm:p-6 shadow-soft transition-all">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Author Header & Post Type Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#27272A] bg-[#111113] flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#FAFAFA] text-sm">{user?.name || 'Student'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                    {user?.college || 'Campus Builder'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">Publishing to Community</p>
              </div>
            </div>

            <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">
              {content.length}/1000
            </span>
          </div>

          {/* Post Type Selector Pills */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Category:
            </span>
            <PostTypeSelector selectedType={type} onSelectType={setType} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            placeholder={selectedTypeConfig.placeholder}
            className="w-full px-4 py-3 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-2xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-500 resize-y min-h-[90px]"
          />
        </div>

        {/* Team Builder Panel for LOOKING_FOR_TEAMMATES */}
        {type === 'LOOKING_FOR_TEAMMATES' && (
          <div className="p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/30 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <span className="text-base">🚀</span>
              <span>Team Recruitment Details</span>
            </div>

            {/* Project / Team Title */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Project / Team Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Resume Analyzer or SIH Smart Mobility"
                className="w-full px-3 py-2 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Required Roles */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Looking for Roles:
              </label>
              {requiredRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {requiredRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-500/40"
                    >
                      <span>🟣 {role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="hover:text-white focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRole();
                    }
                  }}
                  placeholder="e.g. ML Developer, UI/UX Designer..."
                  className="flex-1 px-3 py-1.5 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddRole()}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
                >
                  + Add Role
                </button>
              </div>

              {/* Quick preset roles */}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-zinc-500 font-medium mr-1 self-center">Presets:</span>
                {['ML Developer', 'UI/UX Designer', 'Backend Developer', 'Frontend Developer', 'App Developer'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleAddRole(r)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#111113] border border-[#27272A] hover:bg-indigo-950/50 text-zinc-400 hover:text-indigo-300 transition-colors"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Required Skills & Tech Stack:
              </label>
              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-950/70 text-purple-300 border border-purple-500/40"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-white focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Python, React, Gemini..."
                  className="flex-1 px-3 py-1.5 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
                >
                  + Add Skill
                </button>
              </div>

              {/* Quick preset skills */}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-zinc-500 font-medium mr-1 self-center">Presets:</span>
                {['Python', 'React', 'Gemini', 'Node.js', 'Figma', 'PyTorch', 'Tailwind'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#111113] border border-[#27272A] hover:bg-purple-950/50 text-zinc-400 hover:text-purple-300 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Size & Current Members */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Target Team Size
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                  <option value={5}>5 Members</option>
                  <option value={6}>6 Members</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Current Members
                </label>
                <select
                  value={currentMembers}
                  onChange={(e) => setCurrentMembers(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value={1}>1 (Only you)</option>
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                  <option value={5}>5 Members</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tags Container */}
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white focus:outline-none"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input Field & Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#111113] border border-[#27272A] rounded-xl px-2.5 py-1 text-xs">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (Press Enter)..."
                className="bg-transparent text-xs focus:outline-none text-[#FAFAFA] w-36 placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
              >
                +Add
              </button>
            </div>

            {/* Suggested quick tag pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[10px] text-zinc-500 font-medium">Suggestions:</span>
              {popularTagSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestedTagClick(s)}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#111113] hover:bg-indigo-950/50 hover:text-indigo-300 text-zinc-400 border border-[#27272A] transition-colors"
                >
                  #{s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Additional Links / Image Details */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{showExtras ? 'Hide Links & Media' : '+ Add Project URL or Image'}</span>
            {showExtras ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showExtras && (
            <div className="mt-3 p-3.5 bg-[#111113] rounded-2xl border border-[#27272A] space-y-2.5 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-zinc-400" />
                  <span>Project / Repo / Hackathon URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#18181B] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-zinc-400" />
                  <span>Image URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or screenshot URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#18181B] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#27272A]">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Connect with campus innovators</span>
          </div>

          <Button
            variant="gradient"
            size="md"
            icon={Send}
            loading={loading}
            disabled={!content.trim()}
            type="submit"
            className="shadow-sm shadow-indigo-500/20"
          >
            Post to Feed
          </Button>
        </div>
      </form>
    </div>
  );
};
