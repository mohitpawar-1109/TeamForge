import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  GraduationCap,
  Sparkles,
  Tag,
  Check,
  X,
  Users,
  UserPlus,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postAPI, teamRequestAPI } from '../../services/api';
import { POST_TYPES } from './PostTypeSelector';
import { CommentsDrawer } from './CommentsDrawer';
import { Badge } from '../common/Badge';
import { PostMedia } from './PostMedia';

export const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [likes, setLikes] = useState(post.likes || []);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [heartAnimated, setHeartAnimated] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount || 0);

  // AI Teammate Discovery State
  const [showAiMatches, setShowAiMatches] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState([]);

  const currentUserId = user?._id?.toString();
  const isLiked = Boolean(
    currentUserId &&
    likes.some(id => (id?._id || id)?.toString() === currentUserId)
  );
  const isAuthor = Boolean(
    currentUserId &&
    ((post.author?._id || post.author)?.toString() === currentUserId)
  );
  const isMember = Boolean(
    currentUserId &&
    post.members?.some(m => (m?._id || m)?.toString() === currentUserId)
  );

  const typeConfig = POST_TYPES.find(t => t.id === post.type) || POST_TYPES[0];
  const TypeIcon = typeConfig.icon;

  const handleToggleLike = async () => {
    if (!user) {
      error('Please log in to like posts.');
      return;
    }

    if (likeLoading) return;

    const previousLikes = [...likes];
    const previousCount = likeCount;
    const nextIsLiked = !isLiked;

    if (nextIsLiked) {
      setLikes([...likes, user._id]);
      setLikeCount(prev => prev + 1);
      setHeartAnimated(true);
      setTimeout(() => setHeartAnimated(false), 400);
    } else {
      setLikes(likes.filter(id => (id?._id || id)?.toString() !== currentUserId));
      setLikeCount(prev => Math.max(0, prev - 1));
    }

    setLikeLoading(true);

    try {
      let res;
      if (nextIsLiked) {
        res = await postAPI.likePost(post._id);
      } else {
        res = await postAPI.unlikePost(post._id);
      }

      if (res.data.success) {
        if (typeof res.data.likeCount === 'number') {
          setLikeCount(res.data.likeCount);
        }
      } else {
        setLikes(previousLikes);
        setLikeCount(previousCount);
        error(res.data.message || 'Failed to update like.');
      }
    } catch (err) {
      setLikes(previousLikes);
      setLikeCount(previousCount);
      error(err.response?.data?.message || 'Network error. Could not update like.');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postAPI.deletePost(post._id);
        success('Post deleted.');
        if (onPostDeleted) onPostDeleted(post._id);
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete post.');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      error('Content cannot be empty.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await postAPI.updatePost(post._id, { content: editContent.trim() });
      if (res.data.success) {
        success('Post updated!');
        setIsEditing(false);
        if (onPostUpdated) onPostUpdated(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!user) {
      error('Please sign in to request joining a team.');
      return;
    }
    if (isAuthor) {
      error('You are the creator of this team post.');
      return;
    }
    if (isMember) {
      success("You're already part of this team.");
      return;
    }
    if (joinRequested) {
      return;
    }

    setJoinLoading(true);
    try {
      const res = await teamRequestAPI.joinTeamPost(post._id);
      if (res.data.success) {
        setJoinRequested(true);
        success('Join request sent ✓');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send join request.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleFindMatchesWithAi = async () => {
    if (!showAiMatches && aiMatches.length === 0) {
      setAiLoading(true);
      setShowAiMatches(true);
      try {
        const res = await postAPI.getPostMatches(post._id);
        if (res.data.success) {
          setAiMatches(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load AI matches:', err);
        error('Could not fetch matches at this time.');
      } finally {
        setAiLoading(false);
      }
    } else {
      setShowAiMatches(!showAiMatches);
    }
  };

  const handleInviteCandidate = (candidate) => {
    const candidateId = candidate.user?._id || candidate.user;
    const candidateName = candidate.user?.name || 'Teammate';
    setInvitedUserIds(prev => [...prev, candidateId]);
    success(`Invitation sent to ${candidateName}! ✨`);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: post?.title || 'TeamForge Post',
        text: post?.content || 'Check out this post on TeamForge!',
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        success('Post link copied to clipboard!');
      } else {
        success('Post link: ' + window.location.href);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 shadow-soft hover:border-[#333333] transition-all duration-200">
      {/* Header: Author info, Post Type Badge, Actions Menu */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile?id=${post.author?._id}`}>
            <img
              src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'Student'}`}
              alt={post.author?.name}
              className="w-10 h-10 rounded-full object-cover border border-[#242424] bg-[#161616] flex-shrink-0"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile?id=${post.author?._id}`}
                className="font-bold text-[#F5F5F5] text-xs sm:text-sm hover:text-[#E50914] transition-colors truncate"
              >
                {post.author?.name || 'Student Developer'}
              </Link>
              {post.author?.year && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                  {post.author.year}
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-[#888888] truncate">
              {post.author?.headline || 'Student Builder'}
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-[#666666] mt-0.5">
              {post.author?.college && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <GraduationCap className="w-3 h-3 text-[#666666]" />
                  {post.author.college}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#666666]" />
                {formatTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Post Type Badge & Author Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#161616] text-[#A1A1A1] border border-[#242424]"
          >
            <TypeIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{typeConfig.label}</span>
          </span>

          {isAuthor && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#161616] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-32 bg-[#111111] rounded-2xl shadow-xl border border-[#242424] py-1 z-20 text-xs font-mono"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#A1A1A1] hover:bg-[#161616] hover:text-white flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#FF1F2D] hover:bg-[#E50914]/15 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content Body */}
      {isEditing ? (
        <div className="space-y-3 mb-4">
          <textarea
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-2xl focus:border-[#E50914] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-mono rounded-full bg-[#161616] hover:bg-[#202020] text-[#A1A1A1]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded-full bg-[#E50914] hover:bg-[#FF1F2D] text-white flex items-center gap-1 shadow-[0_0_10px_rgba(229,9,20,0.4)]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {post.title && post.type !== 'LOOKING_FOR_TEAMMATES' && (
            <h4 className="font-bold text-[#F5F5F5] text-sm sm:text-base">
              {post.title}
            </h4>
          )}
          <p className="text-xs sm:text-sm text-[#D0D0D0] whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* LOOKING_FOR_TEAMMATES Specialized Recruitment Card */}
      {post.type === 'LOOKING_FOR_TEAMMATES' && (
        <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-[#161616] border border-[#242424] space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)] tracking-wide">
              <span>TEAM NEEDED</span>
            </span>

            {/* Capacity Counter */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#A1A1A1] bg-[#111111] border border-[#242424] px-3 py-0.5 rounded-full">
              <Users className="w-3 h-3 text-[#A1A1A1]" />
              <span>
                {post.currentMembers || 1}/{post.teamSize || 4} members
              </span>
            </div>
          </div>

          {/* Project Title */}
          {post.title && (
            <h4 className="font-bold text-[#F5F5F5] text-sm sm:text-base">
              {post.title}
            </h4>
          )}

          {/* Required Roles */}
          {post.requiredRoles && post.requiredRoles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block">
                Looking for:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {post.requiredRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#111111] text-[#F5F5F5] border border-[#242424]"
                  >
                    <span>{role}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {post.requiredSkills && post.requiredSkills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block">
                Skills:
              </span>
              <p className="text-xs font-mono text-[#A1A1A1]">
                {post.requiredSkills.join(' • ')}
              </p>
            </div>
          )}

          {/* Join & AI Match Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFindMatchesWithAi}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  showAiMatches
                    ? 'bg-[#111111] text-white border border-[#333333]'
                    : 'bg-[#111111] text-[#A1A1A1] hover:text-white border border-[#242424]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${showAiMatches ? 'text-[#E50914]' : 'text-[#888888]'}`} />
                <span>{showAiMatches ? 'Hide AI Matches' : 'Find Matches with AI'}</span>
                {showAiMatches ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isAuthor ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono text-[#A1A1A1] bg-[#111111] border border-[#242424]">
                  Post Owner
                </span>
              ) : isMember ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono text-[#20D47A] bg-[#20D47A]/10 border border-[#20D47A]/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#20D47A]" />
                  <span>✓ You're in this team</span>
                </span>
              ) : joinRequested ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono text-[#20D47A] bg-[#20D47A]/10 border border-[#20D47A]/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#20D47A]" />
                  <span>Join request sent ✓</span>
                </span>
              ) : (post.teamSize && (post.currentMembers || 1) >= post.teamSize) ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono text-[#888888] bg-[#111111] border border-[#242424]">
                  Team Full ({post.teamSize}/{post.teamSize})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestToJoin}
                  disabled={joinLoading}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-[#E50914] hover:bg-[#FF1F2D] active:scale-95 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{joinLoading ? 'Sending...' : 'Request to Join'}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI MATCHES EXPANDABLE CONTAINER */}
          {showAiMatches && (
            <div className="mt-3 pt-3 border-t border-[#1F1F1F] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#E50914]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E50914]">
                    AI MATCHES {aiMatches.length > 0 && `(${aiMatches.length})`}
                  </span>
                </div>
              </div>

              {aiLoading ? (
                <div className="p-5 rounded-2xl bg-[#111111] border border-[#242424] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
                    <span>Analyzing student skillsets...</span>
                  </div>
                </div>
              ) : aiMatches.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#111111] border border-[#242424] text-center text-xs font-mono text-[#888888]">
                  No compatible student profiles found matching these specific requirements yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {aiMatches.map((match, idx) => {
                    const candidate = match.user;
                    const isInvited = invitedUserIds.includes(candidate?._id);
                    const score = match.compatibilityScore || match.score || 85;

                    return (
                      <div
                        key={candidate?._id || idx}
                        className="p-3.5 rounded-2xl bg-[#111111] border border-[#242424] hover:border-[#333333] transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                candidate?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.name || 'User'}`
                              }
                              alt={candidate?.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#242424] bg-[#161616]"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-[#F5F5F5] text-xs truncate">
                                {candidate?.name}
                              </h5>
                              <p className="text-[10px] font-mono text-[#666666] truncate">
                                {candidate?.course || candidate?.headline || 'Developer'}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30">
                            {score}% MATCH
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Link
                            to={`/profile?id=${candidate?._id}`}
                            className="px-3 py-1 rounded-full text-xs font-mono text-[#888888] hover:text-white"
                          >
                            View Profile
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleInviteCandidate(match)}
                            disabled={isInvited}
                            className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                              isInvited
                                ? 'bg-[#20D47A]/20 text-[#20D47A]'
                                : 'bg-[#E50914] hover:bg-[#FF1F2D] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)]'
                            }`}
                          >
                            {isInvited ? 'Invited ✓' : 'Invite'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional Project Link Box */}
      {post.projectLink && (
        <div className="mb-4">
          <a
            href={post.projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3 rounded-2xl bg-[#161616] border border-[#242424] hover:border-[#333333] transition-all text-xs font-mono text-[#F5F5F5]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#111111] text-[#E50914] flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-3 h-3" />
              </div>
              <span className="truncate">{post.projectLink}</span>
            </div>
            <span className="text-[11px] font-mono text-[#E50914] group-hover:underline flex-shrink-0">
              Visit Resource →
            </span>
          </a>
        </div>
      )}

      {/* Attached Media */}
      <PostMedia
        media={post.media || post.attachments || post.mediaItems}
        singleImageUrl={post.image || post.imageUrl || post.mediaUrl}
      />

      {/* Post Tags Chips */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons: Like, Comment, Share */}
      <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-xs font-mono text-[#888888]">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-150 cursor-pointer ${
              isLiked
                ? 'text-[#FF1F2D] bg-[#E50914]/15 font-bold border border-[#E50914]/40'
                : 'text-[#888888] hover:bg-[#161616] hover:text-white border border-transparent'
            }`}
          >
            <span
              className={`inline-block transition-transform duration-150 text-sm select-none ${heartAnimated ? 'scale-125' : 'group-hover:scale-110'} ${isLiked ? 'text-[#FF1F2D]' : 'text-[#888888]'}`}
            >
              {isLiked ? '♥' : '♡'}
            </span>
            <span>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-[#888888] hover:bg-[#161616] hover:text-white transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#888888]" />
            <span>
              {localCommentsCount} {localCommentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-[#888888] hover:bg-[#161616] hover:text-white transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Interactive Comments Drawer */}
      <CommentsDrawer
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
        onCommentsCountChange={(newCount) => setLocalCommentsCount(newCount)}
      />
    </div>
  );
};
