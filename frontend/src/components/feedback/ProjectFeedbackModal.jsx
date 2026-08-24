import React, { useState } from 'react';
import { Star, X, AlertTriangle, Send } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ProjectFeedbackModal = ({ isOpen, onClose, project, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    codeQuality: 0,
    management: 0,
    impact: 0,
    teamCollaboration: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('error', 'Please select an overall rating.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/feedback/project/${project._id}`, {
        type: 'project',
        project: project._id,
        rating,
        categories,
        comment
      });
      addToast('success', 'Project feedback submitted successfully.');
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
                  ? 'fill-[#20D47A] text-[#20D47A]' 
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
      <div className="bg-[#050505] border border-[#1F1F1F] rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]">
          <h2 className="text-sm font-bold font-mono tracking-wider text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-[#20D47A]" />
            RATE COMPLETED PROJECT
          </h2>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-center bg-[#111111] p-4 rounded-2xl border border-[#1F1F1F]">
            <div className="text-center space-y-1">
              <div className="text-sm font-bold text-white uppercase tracking-wider">{project.title}</div>
              <div className="text-[10px] font-mono text-[#888888] tracking-wider">Leave feedback for this project's execution and outcome</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-[#1F1F1F]">
              <span className="text-[10px] font-mono font-bold text-[#A1A1A1] uppercase tracking-widest">Overall Project Rating</span>
              <div className="scale-125">
                {renderStars(rating, setRating, true)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">CODE QUALITY</span>
                {renderStars(categories.codeQuality, (v) => updateCategory('codeQuality', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">MANAGEMENT</span>
                {renderStars(categories.management, (v) => updateCategory('management', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">IMPACT</span>
                {renderStars(categories.impact, (v) => updateCategory('impact', v))}
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-[#888888]">TEAM COLLABORATION</span>
                {renderStars(categories.teamCollaboration, (v) => updateCategory('teamCollaboration', v))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-widest block">
              Additional Thoughts (Optional)
            </label>
            <textarea
              className="w-full bg-[#111111] border border-[#242424] rounded-xl p-3 text-xs font-mono text-white placeholder-[#555555] focus:border-[#20D47A] focus:outline-none transition-all resize-none h-24"
              placeholder="What went well? What could be improved in future projects?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <div className="text-right text-[10px] font-mono text-[#666666]">
              {comment.length}/500
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#20D47A]/10 border border-[#20D47A]/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-[#20D47A] flex-shrink-0" />
            <p className="text-[10px] font-mono text-[#A1A1A1] leading-tight">
              This feedback builds the project's reputation and contributes to the portfolio strength of all involved members.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full font-mono text-xs font-bold text-[#888888] hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#20D47A] hover:bg-[#1BA862] text-black px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
