import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { commentAPI } from '../../services/api';

export const CommentsDrawer = ({
  isOpen,
  onClose,
  post,
  onCommentsCountChange
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentUserId = user?._id?.toString();

  // Load comments when drawer opens
  useEffect(() => {
    if (isOpen && post?._id) {
      loadComments();
    }
  }, [isOpen, post?._id]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await commentAPI.getComments(post._id);
      if (res.data.success) {
        setComments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      error('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!user) {
      error('Please sign in to comment.');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    const contentToPost = newComment.trim();

    try {
      const res = await commentAPI.createComment(post._id, { content: contentToPost });
      if (res.data.success) {
        const addedComment = res.data.data;
        const updated = [...comments, addedComment];
        setComments(updated);
        setNewComment('');
        if (onCommentsCountChange) {
          onCommentsCountChange(updated.length);
        }
        success('Comment added!');
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      error('Comment cannot be empty.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await commentAPI.updateComment(commentId, { content: editContent.trim() });
      if (res.data.success) {
        const updatedComment = res.data.data;
        setComments(comments.map(c => c._id === commentId ? updatedComment : c));
        setEditingCommentId(null);
        setEditContent('');
        success('Comment updated.');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update comment.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        const res = await commentAPI.deleteComment(commentId);
        if (res.data.success) {
          const filtered = comments.filter(c => c._id !== commentId);
          setComments(filtered);
          if (onCommentsCountChange) {
            onCommentsCountChange(filtered.length);
          }
          success('Comment deleted.');
        }
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete comment.');
      }
    }
    setActiveMenuId(null);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer Container (Right side on Desktop, Bottom Sheet on Mobile) */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 w-full md:max-w-md bg-white shadow-2xl md:border-l border-slate-200 flex flex-col max-h-[85vh] md:max-h-full rounded-t-3xl md:rounded-none z-10 transition-transform duration-300 animate-slideUp md:animate-slideInRight">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Discussion
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Snippet Banner */}
        {post && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
              <span className="font-bold text-slate-700 truncate">{post.author?.name || 'Author'}</span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{formatRelativeTime(post.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-700 line-clamp-2 italic font-normal">
              "{post.content}"
            </p>
          </div>
        )}

        {/* Comments Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            /* Loading skeletons */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-3 bg-slate-100 rounded-md w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50/60 border border-brand-100 text-brand-500 flex items-center justify-center mb-3 shadow-soft">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">No comments yet</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Be the first to share your thoughts, ask questions, or offer team collaboration!
              </p>
            </div>
          ) : (
            /* Comments List */
            comments.map((comment) => {
              const isCommentAuthor = Boolean(
                currentUserId &&
                ((comment.author?._id || comment.author)?.toString() === currentUserId)
              );
              const isEditingThis = editingCommentId === comment._id;

              return (
                <div
                  key={comment._id}
                  className="group relative flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  {/* Author Avatar */}
                  <img
                    src={
                      comment.author?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.name || 'User'}`
                    }
                    alt={comment.author?.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 bg-white flex-shrink-0 mt-0.5"
                  />

                  {/* Comment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {comment.author?.name || 'Community Member'}
                        </span>
                        {comment.author?.headline && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            • {comment.author.headline}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(comment.createdAt)}
                        </span>

                        {/* Author action menu */}
                        {isCommentAuthor && !isEditingThis && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === comment._id ? null : comment._id)
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === comment._id && (
                              <div
                                className="absolute right-0 mt-1 w-24 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs font-semibold"
                                onMouseLeave={() => setActiveMenuId(null)}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(comment)}
                                  className="w-full px-2.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="w-full px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content or Edit Box */}
                    {isEditingThis ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-brand-300 rounded-xl focus:border-brand-500 focus:outline-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditContent('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(comment._id)}
                            disabled={savingEdit}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Bottom Sticky Comment Input Box */}
        <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
          {user ? (
            <form onSubmit={handleCreateComment} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-colors"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              Please <span className="font-bold text-brand-600">log in</span> to join the discussion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
