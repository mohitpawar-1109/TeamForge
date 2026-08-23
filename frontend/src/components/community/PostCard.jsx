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
    <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-5 sm:p-6 shadow-soft hover:border-[#A84A4D]/60 transition-all duration-300">
      {/* Header: Author info, Post Type Badge, Actions Menu */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile?id=${post.author?._id}`}>
            <img
              src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'Student'}`}
              alt={post.author?.name}
              className="w-11 h-11 rounded-2xl object-cover border border-[#703344] bg-[#281A21] flex-shrink-0 hover:ring-2 hover:ring-[#CB6B5A] transition-all"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile?id=${post.author?._id}`}
                className="font-bold text-[#F6E8E2] text-sm sm:text-base hover:text-[#CB6B5A] transition-colors truncate"
              >
                {post.author?.name || 'Student Developer'}
              </Link>
              {post.author?.year && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#281A21] text-[#DDA081] border border-[#703344]">
                  {post.author.year}
                </span>
              )}
            </div>

            <p className="text-xs text-[#DDA081] font-medium truncate">
              {post.author?.headline || 'Student Builder'}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-[#DDA081] mt-0.5">
              {post.author?.college && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <GraduationCap className="w-3 h-3 text-[#DDA081]" />
                  {post.author.college}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#DDA081]" />
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
                className="p-1.5 rounded-xl text-[#DDA081] hover:text-[#F6E8E2] hover:bg-[#703344] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-32 bg-[#281A21] rounded-xl shadow-xl border border-[#703344] py-1 z-20 text-xs font-semibold"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#DDA081] hover:bg-[#4A2A35] hover:text-[#F6E8E2] flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[#E07D82] hover:bg-[#703344]/50 flex items-center gap-2"
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
            className="w-full p-3 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-2xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#4A2A35] hover:bg-[#703344] text-[#DDA081]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#A84A4D] hover:bg-[#CB6B5A] text-[#F6E8E2] flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {post.title && post.type !== 'LOOKING_FOR_TEAMMATES' && (
            <h4 className="font-bold text-[#F6E8E2] text-sm sm:text-base">
              {post.title}
            </h4>
          )}
          <p className="text-sm text-[#F6E8E2]/90 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* LOOKING_FOR_TEAMMATES Specialized Recruitment Card */}
      {post.type === 'LOOKING_FOR_TEAMMATES' && (
        <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-[#281A21] border border-[#703344] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-[#703344] to-[#A84A4D] text-[#F6E8E2] shadow-xs tracking-wide">
              <span>🚀</span>
              <span>TEAM NEEDED</span>
            </span>

            {/* Capacity Counter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#DDA081] bg-[#4A2A35] border border-[#703344] px-3 py-1 rounded-xl shadow-xs">
              <Users className="w-3.5 h-3.5 text-[#CB6B5A]" />
              <span>
                {post.currentMembers || 1}/{post.teamSize || 4} members
              </span>
            </div>
          </div>

          {/* Project Title */}
          {post.title && (
            <h4 className="font-black text-[#F6E8E2] text-base sm:text-lg tracking-tight">
              {post.title}
            </h4>
          )}

          {/* Required Roles */}
          {post.requiredRoles && post.requiredRoles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#DDA081] block">
                Looking for:
              </span>
              <div className="flex flex-wrap gap-2">
                {post.requiredRoles.map((role, idx) => {
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border bg-[#703344] text-[#F6E8E2] border-[#A84A4D]/50 shadow-xs"
                    >
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
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#DDA081] block">
                Skills:
              </span>
              <p className="text-xs font-bold text-[#CB6B5A]">
                {post.requiredSkills.join(' • ')}
              </p>
            </div>
          )}

          {/* Join & AI Match Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#703344]">
            {/* Left Action / Match Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFindMatchesWithAi}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${showAiMatches
                    ? 'bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]'
                    : 'bg-[#4A2A35] text-[#DDA081] hover:bg-[#703344] hover:text-[#F6E8E2] border border-[#703344]'
                  }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${showAiMatches ? 'text-[#CB6B5A]' : 'text-[#DDA081]'}`} />
                <span>{showAiMatches ? 'Hide AI Matches' : 'Find Matches with AI'}</span>
                {showAiMatches ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Right Join / Status Action */}
            <div className="flex items-center gap-2">
              {isAuthor ? (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/50">
                  Post Owner
                </span>
              ) : isMember ? (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#5B8A68]/30 text-[#86B190] border border-[#5B8A68]/40 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#86B190]" />
                  <span>✓ You're part of this team.</span>
                </span>
              ) : joinRequested ? (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#4A2A35] text-[#DDA081] border border-[#703344] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#86B190]" />
                  <span>Join request sent ✓</span>
                </span>
              ) : (post.teamSize && (post.currentMembers || 1) >= post.teamSize) ? (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#4A2A35] text-[#DDA081] border border-[#703344]">
                  Team Full ({post.teamSize}/{post.teamSize})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestToJoin}
                  disabled={joinLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] hover:from-[#CB6B5A] hover:to-[#DDA081] active:scale-95 text-[#F6E8E2] flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{joinLoading ? 'Sending...' : 'Request to Join'}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI MATCHES EXPANDABLE CONTAINER */}
          {showAiMatches && (
            <div className="mt-3 pt-3 border-t border-[#703344] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#CB6B5A]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#CB6B5A]">
                    AI MATCHES {aiMatches.length > 0 && `(${aiMatches.length})`}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#A84A4D] text-[#F6E8E2] shadow-xs">
                    SMART RANKED
                  </span>
                </div>
                <span className="text-[11px] text-[#DDA081] font-medium">
                  Based on verified skills & interests
                </span>
              </div>

              {/* Scanning Animation State */}
              {aiLoading ? (
                <div className="p-5 rounded-2xl bg-[#4A2A35] border border-[#703344] space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#CB6B5A]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#CB6B5A]" />
                    <span>Analyzing student skillsets & calculating role compatibility...</span>
                  </div>
                  <div className="w-full bg-[#281A21] h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#A84A4D] via-[#CB6B5A] to-[#A84A4D] h-full rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              ) : aiMatches.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#4A2A35] border border-[#703344] text-center text-xs text-[#DDA081]">
                  No compatible student profiles found matching these specific requirements yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aiMatches.map((match, idx) => {
                    const candidate = match.user;
                    const isInvited = invitedUserIds.includes(candidate?._id);
                    const score = match.compatibilityScore || match.score || 85;

                    return (
                      <div
                        key={candidate?._id || idx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#4A2A35] border border-[#703344] hover:border-[#A84A4D]/60 shadow-xs hover:shadow-md transition-all space-y-2.5"
                      >
                        {/* Candidate Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                candidate?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.name || 'User'}`
                              }
                              alt={candidate?.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#703344] bg-[#281A21] flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-extrabold text-[#F6E8E2] text-xs sm:text-sm truncate">
                                  {candidate?.name}
                                </h5>
                                {match.suggestedRole && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#703344] text-[#F6E8E2] border border-[#A84A4D]/40">
                                    {match.suggestedRole}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#DDA081] truncate">
                                {candidate?.college ? `${candidate.college} • ` : ''}
                                {candidate?.course || candidate?.headline || 'Developer'}
                              </p>
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs border ${
                                score >= 85
                                  ? 'bg-[#5B8A68]/30 text-[#86B190] border-[#5B8A68]/40'
                                  : 'bg-[#703344] text-[#F6E8E2] border-[#A84A4D]/40'
                              }`}
                            >
                              {score}% MATCH
                            </span>
                          </div>
                        </div>

                        {/* Matching Skills */}
                        {match.matchingSkills && match.matchingSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#DDA081] mr-1">
                              Skills:
                            </span>
                            {match.matchingSkills.map((sk, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#281A21] text-[#86B190] border border-[#5B8A68]/40"
                              >
                                <Check className="w-3 h-3 text-[#86B190]" />
                                <span>{sk}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Why this match explanation */}
                        {match.reason && (
                          <p className="text-[11px] text-[#DDA081] italic bg-[#281A21] p-2.5 rounded-xl border border-[#703344]">
                            "{match.reason}"
                          </p>
                        )}

                        {/* Action Buttons: View Profile & Invite */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Link
                            to={`/profile?id=${candidate?._id}`}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#DDA081] hover:text-[#CB6B5A] hover:bg-[#281A21] transition-colors"
                          >
                            View Profile
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleInviteCandidate(match)}
                            disabled={isInvited}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all ${isInvited
                                ? 'bg-[#5B8A68]/30 text-[#86B190] border border-[#5B8A68]/40'
                                : 'bg-[#A84A4D] hover:bg-[#CB6B5A] active:scale-95 text-[#F6E8E2]'
                              }`}
                          >
                            {isInvited ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#86B190]" />
                                <span>Invited ✓</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Invite</span>
                              </>
                            )}
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
            className="group flex items-center justify-between p-3 rounded-2xl bg-[#281A21] border border-[#703344] hover:border-[#A84A4D]/60 transition-all text-xs font-semibold text-[#F6E8E2]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#A84A4D] text-[#F6E8E2] flex items-center justify-center flex-shrink-0 shadow-xs">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{post.projectLink}</span>
            </div>
            <span className="text-[11px] font-bold text-[#CB6B5A] group-hover:translate-x-0.5 transition-transform flex-shrink-0">
              Visit Resource →
            </span>
          </a>
        </div>
      )}

      {/* Attached Media (Images & Video with Lightbox & Player) */}
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
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-[#281A21] text-[#DDA081] border border-[#703344] hover:border-[#A84A4D] hover:text-[#F6E8E2] transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons: Like, Comment, Share */}
      <div className="pt-3 border-t border-[#703344] flex items-center justify-between text-xs text-[#DDA081] font-semibold">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${isLiked
                ? 'text-[#CB6B5A] bg-[#703344]/50 font-bold border border-[#A84A4D]/50 shadow-xs'
                : 'text-[#DDA081] hover:bg-[#703344]/30 hover:text-[#F6E8E2] border border-transparent'
              }`}
          >
            <span
              className={`inline-block transition-transform duration-200 text-sm select-none ${heartAnimated ? 'scale-125 text-[#CB6B5A]' : 'group-hover:scale-110'
                } ${isLiked ? 'text-[#CB6B5A]' : 'text-[#DDA081] group-hover:text-[#CB6B5A]'}`}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#DDA081] hover:bg-[#703344]/30 hover:text-[#F6E8E2] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#DDA081] group-hover:text-[#CB6B5A]" />
            <span>
              {localCommentsCount} {localCommentsCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#DDA081] hover:bg-[#703344]/30 hover:text-[#F6E8E2] transition-colors"
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
