import React, { useState, useEffect } from 'react';
import { Star, X, AlertTriangle, Send } from 'lucide-react';
import api, { feedbackAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const FeedbackModal = ({ isOpen, onClose, targetUser, projectId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    communication: 0,
    reliability: 0,
    teamwork: 0,
    professionalism: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [sharedProjects, setSharedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(!projectId);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && !projectId && targetUser && currentUser) {
      const fetchSharedProjects = async () => {
        try {
          setLoadingProjects(true);
          const res = await api.get('/projects', { params: { member: targetUser._id } });
          if (res.data.success) {
            const projects = res.data.data.filter(p => 
              p.status === 'Completed' && 
              p.members.some(m => m.user._id === currentUser._id || m.user === currentUser._id)
            );
            setSharedProjects(projects);
            if (projects.length === 1) setSelectedProject(projects[0]._id);
          }
        } catch (err) {
          console.error('Failed to fetch shared projects', err);
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchSharedProjects();
    } else if (projectId) {
      setSelectedProject(projectId);
    }
  }, [isOpen, projectId, targetUser, currentUser]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('error', 'Please select an overall rating.');
      return;
    }

    if (!selectedProject) {
      addToast('error', 'Please select a shared project.');
      return;
    }

    if (!comment || comment.trim().length < 10) {
      addToast('error', 'Please provide a comment of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackAPI.submitUserFeedback(targetUser._id, {
        type: 'user',
        project: selectedProject,
        rating,
        categories,
        comment
      });
      addToast('success', 'Feedback submitted successfully.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('error', err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCategory = (cat, val) => {
    setCategories(prev => ({ ...prev, [cat]: val }));
  };

  const renderStars = (currentVal, onChange, isHoverable = false) => {
    return (
      <div className="flex gap-1" onMouseLeave={() => isHoverable && setHoveredRating(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => isHoverable && setHoveredRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star 
              className={`w-5 h-5 ${
                (isHoverable ? (hoveredRating || currentVal) : currentVal) >= star 
                  ? 'fill-[#E50914] text-[#E50914]' 
                  : 'text-[#333333]'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#050505] border border-[#1F1F1F] rounded-3xl w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]">
          <h2 className="text-sm font-bold font-mono tracking-wider text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-[#E50914]" />
            RATE COLLABORATOR
          </h2>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto min-h-0">
            <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-[#1F1F1F]">
            <img 
              src={targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.name}`}
              alt={targetUser.name}
              className="w-12 h-12 rounded-full border border-[#242424]"
            />
            <div>
              <div className="text-sm font-bold text-white">{targetUser.name}</div>
              <div className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Leave feedback for this teammate</div>
            </div>
          </div>

          <div className="space-y-4">
            {!projectId && (
              <div className="pb-4 border-b border-[#1F1F1F]">
                <label className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-widest block mb-2">
                  Select Project Context *
                </label>
                {loadingProjects ? (
                  <div className="text-xs text-[#666666] font-mono">Loading projects...</div>
                ) : sharedProjects.length > 0 ? (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-[#111111] border border-[#242424] rounded-lg p-2.5 text-xs font-mono text-white focus:border-[#E50914] focus:outline-none transition-all"
                  >
                    <option value="">-- Select a Completed Project --</option>
                    {sharedProjects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-[#E50914] font-mono bg-[#E50914]/10 p-2.5 rounded-lg border border-[#E50914]/20">
                    You must share a completed project with {targetUser.name} to leave feedback.
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-[#1F1F1F]">
              <span className="text-[10px] font-mono font-bold text-[#A1A1A1] uppercase tracking-widest">Overall Experience</span>
              <div className="scale-125">
                {renderStars(rating, setRating, true)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">COMMUNICATION</span>
                {renderStars(categories.communication, (v) => updateCategory('communication', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">RELIABILITY</span>
                {renderStars(categories.reliability, (v) => updateCategory('reliability', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">TEAMWORK</span>
                {renderStars(categories.teamwork, (v) => updateCategory('teamwork', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">PROFESSIONALISM</span>
                {renderStars(categories.professionalism, (v) => updateCategory('professionalism', v))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-widest block">
              Additional Comments *
            </label>
            <textarea
              className="w-full box-border bg-[#111111] border border-[#242424] rounded-xl p-3 text-xs font-mono text-white placeholder-[#555555] focus:border-[#E50914] focus:outline-none transition-all resize-y min-h-[96px] max-h-[240px]"
              placeholder="How was it working with them? What are their strengths? (Min 10 characters)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              required
            />
            <div className={`text-right text-[10px] font-mono ${comment.length < 10 ? 'text-[#E50914]' : 'text-[#666666]'}`}>
              {comment.length}/1000 {comment.length < 10 && '(Min 10)'}
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#E50914]/10 border border-[#E50914]/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-[#E50914] flex-shrink-0" />
            <p className="text-[10px] font-mono text-[#A1A1A1] leading-tight">
              Feedback becomes part of the user's permanent algorithmic reputation. Please be constructive, fair, and professional.
            </p>
          </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 bg-[#050505] p-6 pt-4 border-t border-[#1F1F1F] flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full font-mono text-xs font-bold text-[#888888] hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || (!projectId && !selectedProject)}
              className="bg-[#E50914] hover:bg-[#C40812] text-white px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
