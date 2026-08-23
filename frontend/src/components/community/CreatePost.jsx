import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Tag,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postAPI } from '../../services/api';
import { POST_TYPES, PostTypeSelector } from './PostTypeSelector';
import { Button } from '../common/Button';

export const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

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

  // Dedicated Media Upload State
  const [mediaItems, setMediaItems] = useState([]); // [{ file, previewUrl, type: 'image'|'video', name, size }]
  const [mediaMode, setMediaMode] = useState(null); // 'image' | 'video' | null
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const selectedTypeConfig = POST_TYPES.find((t) => t.id === type) || POST_TYPES[0];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaItems.forEach((m) => {
        if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
      });
    };
  }, [mediaItems]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Reset the input value so the same file can be picked again if needed
    e.target.value = '';

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxImageSize = 25 * 1024 * 1024; // 25MB
    const maxImagesTotal = 6;

    // If previously in video mode, clear video attachments
    let currentImages = mediaMode === 'image' ? [...mediaItems] : [];
    if (mediaMode === 'video' && mediaItems.length > 0) {
      mediaItems.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
      currentImages = [];
      info('Switched to image upload mode (video removed).');
    }

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('image/')) {
        error(`"${file.name}" is not a supported image format (JPG, PNG, WEBP, GIF).`);
        continue;
      }

      if (file.size > maxImageSize) {
        error(`"${file.name}" exceeds the 25MB size limit.`);
        continue;
      }

      if (currentImages.length >= maxImagesTotal) {
        error(`You can attach a maximum of ${maxImagesTotal} images per post.`);
        break;
      }

      const previewUrl = URL.createObjectURL(file);
      currentImages.push({
        file,
        previewUrl,
        type: 'image',
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2)
      });
    }

    setMediaItems(currentImages);
    setMediaMode(currentImages.length > 0 ? 'image' : null);
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    e.target.value = '';
    const file = files[0];

    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const maxVideoSize = 100 * 1024 * 1024; // 100MB

    if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('video/')) {
      error(`"${file.name}" is not a supported video format (MP4, WEBM, MOV).`);
      return;
    }

    if (file.size > maxVideoSize) {
      error(`Video exceeds the 100MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    // Clean up existing media
    mediaItems.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));

    const previewUrl = URL.createObjectURL(file);
    setMediaItems([
      {
        file,
        previewUrl,
        type: 'video',
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1)
      }
    ]);
    setMediaMode('video');
    info('Video attached (1 video per post).');
  };

  const handleRemoveMedia = (index) => {
    const itemToRemove = mediaItems[index];
    if (itemToRemove?.previewUrl) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    const updated = mediaItems.filter((_, idx) => idx !== index);
    setMediaItems(updated);
    if (updated.length === 0) {
      setMediaMode(null);
    }
  };

  const handleAddRole = (roleToAdd) => {
    const clean = (roleToAdd || roleInput).trim();
    if (clean && !requiredRoles.includes(clean) && requiredRoles.length < 6) {
      setRequiredRoles([...requiredRoles, clean]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setRequiredRoles(requiredRoles.filter((r) => r !== roleToRemove));
  };

  const handleAddSkill = (skillToAdd) => {
    const clean = (skillToAdd || skillInput).trim();
    if (clean && !requiredSkills.includes(clean) && requiredSkills.length < 8) {
      setRequiredSkills([...requiredSkills, clean]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skillToRemove));
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
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSuggestedTagClick = (sTag) => {
    const clean = sTag.replace(/^#/, '');
    if (!tags.includes(clean) && tags.length < 6) {
      setTags([...tags, clean]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasText = content.trim().length > 0;
    const hasMedia = mediaItems.length > 0;

    if (!hasText && !hasMedia) {
      error('Add some text or attach an image/video');
      return;
    }

    setLoading(true);
    try {
      let payload;

      if (mediaItems.length > 0) {
        const formData = new FormData();
        formData.append('content', content.trim());
        formData.append('type', type);
        if (title.trim()) formData.append('title', title.trim());
        if (projectLink.trim()) formData.append('projectLink', projectLink.trim());
        if (imageUrl.trim()) formData.append('image', imageUrl.trim());
        formData.append('teamSize', String(Number(teamSize) || 4));
        formData.append('currentMembers', String(Number(currentMembers) || 1));

        tags.forEach((t) => {
          if (t && t.trim()) formData.append('tags', t.trim());
        });

        requiredRoles.forEach((r) => {
          if (r && r.trim()) formData.append('requiredRoles', r.trim());
        });

        requiredSkills.forEach((s) => {
          if (s && s.trim()) formData.append('requiredSkills', s.trim());
        });

        mediaItems.forEach((item) => {
          if (item.file) {
            formData.append('media', item.file);
          }
        });

        payload = formData;
      } else {
        payload = {
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
        };
      }

      const res = await postAPI.createPost(payload);

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
        mediaItems.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
        setMediaItems([]);
        setMediaMode(null);
        setShowExtras(false);
        if (onPostCreated) {
          onPostCreated(res.data.data);
        }
      }
    } catch (err) {
      console.error('[Publish Post Failed]:', err);
      error(err.response?.data?.message || 'Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const popularTagSuggestions = ['hackathon', 'aiml', 'webdev', 'teammates', 'react', 'python', 'figma'];

  return (
    <div className="bg-[#18181B] rounded-3xl border border-[#27272A] p-5 sm:p-6 shadow-soft transition-all">
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        className="hidden"
        onChange={handleVideoSelect}
      />

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

        {/* Main Content Textarea */}
        <div className="relative">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            placeholder={
              mediaMode === 'image'
                ? 'Add a caption for your images (optional)...'
                : mediaMode === 'video'
                ? 'Add a description for your video (optional)...'
                : selectedTypeConfig.placeholder
            }
            className="w-full px-4 py-3 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-2xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-500 resize-y min-h-[90px]"
          />
        </div>

        {/* Selected Media Previews Section */}
        {mediaItems.length > 0 && (
          <div className="p-3.5 bg-[#111113] rounded-2xl border border-[#27272A] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                {mediaMode === 'image' ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>
                      Attached Images ({mediaItems.length}/6)
                    </span>
                  </>
                ) : (
                  <>
                    <VideoIcon className="w-4 h-4 text-purple-400" />
                    <span>Attached Video Demo</span>
                  </>
                )}
              </div>

              {mediaMode === 'image' && mediaItems.length < 6 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Add More
                </button>
              )}
            </div>

            {/* Images Grid Preview */}
            {mediaMode === 'image' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {mediaItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden aspect-video bg-black/40 border border-zinc-800"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-between">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-zinc-300 truncate">
                        <span className="font-semibold">{item.size} MB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Video Preview */}
            {mediaMode === 'video' && mediaItems[0] && (
              <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 max-h-64 flex flex-col items-center">
                <video
                  src={mediaItems[0].previewUrl}
                  controls
                  className="max-h-56 w-full object-contain"
                />
                <div className="w-full px-3 py-1.5 bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-300">
                  <span className="truncate max-w-xs">{mediaItems[0].name} ({mediaItems[0].size} MB)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(0)}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
            <span>{showExtras ? 'Hide URL Link' : '+ Add Project / Hackathon URL'}</span>
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
            </div>
          )}
        </div>

        {/* Footer Actions: Image, Video Buttons & Publish */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
          <div className="flex items-center gap-2">
            {/* 📷 Image Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                mediaMode === 'image'
                  ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/50'
                  : 'bg-[#111113] hover:bg-[#27272A] text-zinc-300 hover:text-indigo-400 border-[#27272A]'
              }`}
              title="Attach Images (JPG, PNG, WEBP, GIF up to 25MB, max 6 images)"
            >
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Image</span>
              {mediaMode === 'image' && mediaItems.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px]">
                  {mediaItems.length}
                </span>
              )}
            </button>

            {/* 🎥 Video Button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                mediaMode === 'video'
                  ? 'bg-purple-950/70 text-purple-300 border-purple-500/50'
                  : 'bg-[#111113] hover:bg-[#27272A] text-zinc-300 hover:text-purple-400 border-[#27272A]'
              }`}
              title="Attach Video (MP4, WEBM, MOV up to 100MB, 1 video per post)"
            >
              <VideoIcon className="w-4 h-4 text-purple-400" />
              <span>Video</span>
              {mediaMode === 'video' && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px]">
                  1
                </span>
              )}
            </button>

            <span className="text-[11px] text-zinc-500 hidden md:inline">
              Max 25MB image • 100MB video
            </span>
          </div>

          <Button
            variant="gradient"
            size="md"
            icon={loading ? Loader2 : Send}
            loading={loading}
            disabled={loading || (!content.trim() && mediaItems.length === 0)}
            type="submit"
            className="shadow-sm shadow-indigo-500/20"
          >
            {loading ? 'Uploading & Publishing...' : 'Post to Feed'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CreatePost;
