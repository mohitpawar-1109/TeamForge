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
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postAPI, teamRequestAPI } from '../../services/api';
import { POST_TYPES } from './PostTypeSelector';
import { CommentsDrawer } from './CommentsDrawer';
import { Badge } from '../common/Badge';

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

    // Snapshot state for potential rollback
    const previousLikes = [...likes];
    const previousCount = likeCount;
    const nextIsLiked = !isLiked;

    // Optimistic UI updates
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
        // Rollback
        setLikes(previousLikes);
        setLikeCount(previousCount);
        error(res.data.message || 'Failed to update like.');
      }
    } catch (err) {
      // Rollback on network or server failure
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

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/community?post=${post._id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        success('Post link copied to clipboard! 📋');
      } else {
        success('Share link: ' + shareUrl);
      }
    } catch (err) {
      success('Link copied to clipboard!');
    }
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
      {/* Header: Author info, Post Type Badge, Actions Menu */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile?id=${post.author?._id}`}>
            <img
              src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'Student'}`}
              alt={post.author?.name}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0 hover:ring-2 hover:ring-brand-500 transition-all"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile?id=${post.author?._id}`}
                className="font-bold text-slate-900 text-sm sm:text-base hover:text-brand-600 transition-colors truncate"
              >
                {post.author?.name || 'Student Developer'}
              </Link>
              {post.author?.year && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {post.author.year}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium truncate">
              {post.author?.headline || 'Student Builder'}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              {post.author?.college && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  {post.author.college}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Post Type Badge & Author Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${typeConfig.color}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{typeConfig.label}</span>
          </span>

          {isAuthor && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs font-semibold"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
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
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {post.title && post.type !== 'LOOKING_FOR_TEAMMATES' && (
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              {post.title}
            </h4>
          )}
          <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* LOOKING_FOR_TEAMMATES Specialized Recruitment Card */}
      {post.type === 'LOOKING_FOR_TEAMMATES' && (
        <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-blue-50/40 border border-indigo-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs tracking-wide">
              <span>🚀</span>
              <span>TEAM NEEDED</span>
            </span>

            {/* Capacity Counter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-white/90 border border-indigo-200 px-3 py-1 rounded-xl shadow-xs">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {post.currentMembers || 1}/{post.teamSize || 4} members
              </span>
            </div>
          </div>

          {/* Project Title */}
          {post.title && (
            <h4 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
              {post.title}
            </h4>
          )}

          {/* Required Roles */}
          {post.requiredRoles && post.requiredRoles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Looking for:
              </span>
              <div className="flex flex-wrap gap-2">
                {post.requiredRoles.map((role, idx) => {
                  const roleEmoticons = ['🟣', '🔵', '🟢', '🟠', '🟡'];
                  const roleColors = [
                    'bg-purple-100/90 text-purple-900 border-purple-200',
                    'bg-blue-100/90 text-blue-900 border-blue-200',
                    'bg-emerald-100/90 text-emerald-900 border-emerald-200',
                    'bg-amber-100/90 text-amber-900 border-amber-200',
                    'bg-rose-100/90 text-rose-900 border-rose-200'
                  ];
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border shadow-xs ${
                        roleColors[idx % roleColors.length]
                      }`}
                    >
                      <span>{roleEmoticons[idx % roleEmoticons.length]}</span>
                      <span>{role}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {post.requiredSkills && post.requiredSkills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Skills:
              </span>
              <p className="text-xs font-bold text-indigo-950">
                {post.requiredSkills.join(' • ')}
              </p>
            </div>
          )}

          {/* Join / Status Action Row */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-indigo-200/60">
            <div className="text-[11px] text-slate-500 font-medium truncate">
              {isAuthor
                ? 'You created this team post'
                : isMember
                ? "✓ You're part of this team."
                : joinRequested
                ? 'Join request sent ✓'
                : 'Direct team recruitment'}
            </div>

            {isAuthor ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Post Owner
              </span>
            ) : isMember ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>✓ You're part of this team.</span>
              </span>
            ) : joinRequested ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Join request sent ✓</span>
              </span>
            ) : (post.teamSize && (post.currentMembers || 1) >= post.teamSize) ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500">
                Team Full ({post.teamSize}/{post.teamSize})
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestToJoin}
                disabled={joinLoading}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{joinLoading ? 'Sending...' : 'Request to Join'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Optional Project Link Box */}
      {post.projectLink && (
        <div className="mb-4">
          <a
            href={post.projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-brand-50/70 to-indigo-50/50 border border-brand-200/80 hover:border-brand-300 transition-all text-xs font-semibold text-brand-900"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{post.projectLink}</span>
            </div>
            <span className="text-[11px] font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
              Visit Resource →
            </span>
          </a>
        </div>
      )}

      {/* Optional Attached Image */}
      {post.image && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 max-h-96 bg-slate-100 flex items-center justify-center">
          <img
            src={post.image}
            alt="Post attachment"
            className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Post Tags Chips */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons: Like, Comment, Share */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isLiked
                ? 'text-rose-600 bg-rose-50 font-bold border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <span
              className={`inline-block transition-transform duration-200 text-sm select-none ${
                heartAnimated ? 'scale-125 text-rose-600' : 'group-hover:scale-110'
              } ${isLiked ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500'}`}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
            <span>
              {localCommentsCount} {localCommentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Share2 className="w-4 h-4" />
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
