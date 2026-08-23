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
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaMode, setMediaMode] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const selectedTypeConfig = POST_TYPES.find((t) => t.id === type) || POST_TYPES[0];

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

    e.target.value = '';
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxImageSize = 25 * 1024 * 1024;
    const maxImagesTotal = 6;

    let currentImages = mediaMode === 'image' ? [...mediaItems] : [];
    if (mediaMode === 'video' && mediaItems.length > 0) {
      mediaItems.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
      currentImages = [];
      info('Switched to image upload mode (video removed).');
    }

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('image/')) {
        error(`"${file.name}" is not a supported image format.`);
        continue;
      }

      if (file.size > maxImageSize) {
        error(`"${file.name}" exceeds the 25MB size limit.`);
        continue;
      }

      if (currentImages.length >= maxImagesTotal) {
        error(`You can attach a maximum of ${maxImagesTotal} images.`);
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
    const maxVideoSize = 100 * 1024 * 1024;

    if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('video/')) {
      error(`"${file.name}" is not a supported video format.`);
      return;
    }

    if (file.size > maxVideoSize) {
      error(`Video exceeds the 100MB size limit.`);
      return;
    }

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

        for (const item of mediaItems) {
          if (!item.file || !(item.file instanceof File)) {
            error(`Invalid file selected: ${item.name || 'Unknown'}`);
            setLoading(false);
            return;
          }
          formData.append('media', item.file, item.file.name);
        }

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
          onPostCreated(res.data.data || res.data.post);
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
    <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 shadow-soft transition-all">
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
                className="w-9 h-9 rounded-full object-cover border border-[#242424] bg-[#161616] flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#F5F5F5] text-xs sm:text-sm">{user?.name || 'Student'}</span>
                  <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                    {user?.college || 'Campus Builder'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#666666]">Publishing to Community</p>
              </div>
            </div>

            <span className="text-xs font-mono text-[#666666] hidden sm:inline-block">
              {content.length}/1000
            </span>
          </div>

          {/* Post Type Selector Pills */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block mb-1.5">
              CATEGORY:
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
            className="w-full px-4 py-3 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-2xl focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555] resize-y min-h-[90px]"
          />
        </div>

        {/* Selected Media Previews Section */}
        {mediaItems.length > 0 && (
          <div className="p-3.5 bg-[#161616] rounded-2xl border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F5F5F5]">
                {mediaMode === 'image' ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-[#20D47A]" />
                    <span>Attached Images ({mediaItems.length}/6)</span>
                  </>
                ) : (
                  <>
                    <VideoIcon className="w-4 h-4 text-[#2AA8FF]" />
                    <span>Attached Video Demo</span>
                  </>
                )}
              </div>

              {mediaMode === 'image' && mediaItems.length < 6 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-xs font-mono font-bold text-[#E50914] hover:text-white transition-colors cursor-pointer"
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
                    className="relative group rounded-xl overflow-hidden aspect-video bg-black/40 border border-[#242424]"
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
                          className="p-1 rounded-lg bg-black/70 hover:bg-[#E50914] text-white transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-[#A1A1A1] truncate">
                        <span className="font-semibold">{item.size} MB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Video Preview */}
            {mediaMode === 'video' && mediaItems[0] && (
              <div className="relative rounded-xl overflow-hidden bg-black border border-[#242424] max-h-64 flex flex-col items-center">
                <video
                  src={mediaItems[0].previewUrl}
                  controls
                  className="max-h-56 w-full object-contain"
                />
                <div className="w-full px-3 py-1.5 bg-[#111111] border-t border-[#242424] flex items-center justify-between text-xs font-mono text-[#A1A1A1]">
                  <span className="truncate max-w-xs">{mediaItems[0].name} ({mediaItems[0].size} MB)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(0)}
                    className="text-xs font-bold text-[#FF1F2D] hover:text-white"
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
          <div className="p-4 bg-[#161616] rounded-2xl border border-[#242424] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E50914]">
              <span>TEAM RECRUITMENT DETAILS</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1">
                PROJECT / TEAM TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Resume Analyzer or SIH Smart Mobility"
                className="w-full px-3 py-2 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] placeholder:text-[#555555] rounded-xl focus:border-[#E50914] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1">
                LOOKING FOR ROLES:
              </label>
              {requiredRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {requiredRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#111111] text-[#F5F5F5] border border-[#242424]"
                    >
                      <span>{role}</span>
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
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] placeholder:text-[#555555] rounded-full focus:border-[#E50914] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddRole()}
                  className="px-3.5 py-1.5 text-xs font-mono font-bold bg-[#161616] hover:bg-[#222222] border border-[#242424] text-white rounded-full transition-colors cursor-pointer"
                >
                  + Add Role
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1">
                REQUIRED SKILLS & TECH STACK:
              </label>
              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#111111] text-[#F5F5F5] border border-[#242424]"
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
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] placeholder:text-[#555555] rounded-full focus:border-[#E50914] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3.5 py-1.5 text-xs font-mono font-bold bg-[#161616] hover:bg-[#222222] border border-[#242424] text-white rounded-full transition-colors cursor-pointer"
                >
                  + Add Skill
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1">
                  TARGET TEAM SIZE
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none"
                >
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                  <option value={5}>5 Members</option>
                  <option value={6}>6 Members</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1">
                  CURRENT MEMBERS
                </label>
                <select
                  value={currentMembers}
                  onChange={(e) => setCurrentMembers(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none"
                >
                  <option value={1}>1 (Only you)</option>
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
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
                  className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#161616] border border-[#242424] rounded-full px-3 py-1 text-xs">
              <Tag className="w-3.5 h-3.5 text-[#666666]" />
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
                className="bg-transparent text-xs font-mono focus:outline-none text-[#F5F5F5] w-36 placeholder:text-[#555555]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="text-[11px] font-mono font-bold text-[#E50914] hover:text-white"
              >
                +Add
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-mono text-[#666666]">Suggestions:</span>
              {popularTagSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestedTagClick(s)}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#161616] hover:bg-[#222222] hover:text-white text-[#888888] border border-[#242424] transition-colors"
                >
                  #{s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Additional Links */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="inline-flex items-center gap-1 text-xs font-mono text-[#888888] hover:text-white transition-colors cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{showExtras ? 'Hide URL Link' : '+ Add Project / Hackathon URL'}</span>
            {showExtras ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showExtras && (
            <div className="mt-3 p-3.5 bg-[#161616] rounded-2xl border border-[#242424] space-y-2.5">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-[#888888]" />
                  <span>Project / Repo / Hackathon URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#111111] border border-[#242424] text-[#F5F5F5] placeholder:text-[#555555] rounded-full focus:border-[#E50914] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Image, Video Buttons & Publish */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F1F1F]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
                mediaMode === 'image'
                  ? 'bg-[#161616] text-white border-[#333333]'
                  : 'bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white border-[#242424]'
              }`}
              title="Attach Images"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#20D47A]" />
              <span>Image</span>
              {mediaMode === 'image' && mediaItems.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#E50914] text-white text-[9px] font-bold">
                  {mediaItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
                mediaMode === 'video'
                  ? 'bg-[#161616] text-white border-[#333333]'
                  : 'bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white border-[#242424]'
              }`}
              title="Attach Video"
            >
              <VideoIcon className="w-3.5 h-3.5 text-[#2AA8FF]" />
              <span>Video</span>
              {mediaMode === 'video' && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#E50914] text-white text-[9px] font-bold">
                  1
                </span>
              )}
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={loading ? Loader2 : Send}
            loading={loading}
            disabled={loading || (!content.trim() && mediaItems.length === 0)}
            type="submit"
          >
            {loading ? 'Publishing...' : 'Post to Feed'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CreatePost;
