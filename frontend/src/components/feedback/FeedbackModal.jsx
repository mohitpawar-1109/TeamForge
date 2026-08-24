import React, { useState } from 'react';
import { Star, X, AlertTriangle, Send } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

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
  const { addToast } = useToast();

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('error', 'Please select an overall rating.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/feedback/user/${targetUser._id}`, {
        type: 'user',
        project: projectId,
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
      <div className="bg-[#050505] border border-[#1F1F1F] rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0A0A0A]">
          <h2 className="text-sm font-bold font-mono tracking-wider text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-[#E50914]" />
            RATE COLLABORATOR
          </h2>
          <button onClick={onClose} className="text-[#666666] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              Additional Comments (Optional)
            </label>
            <textarea
              className="w-full bg-[#111111] border border-[#242424] rounded-xl p-3 text-xs font-mono text-white placeholder-[#555555] focus:border-[#E50914] focus:outline-none transition-all resize-none h-24"
              placeholder="How was it working with them? What are their strengths?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <div className="text-right text-[10px] font-mono text-[#666666]">
              {comment.length}/500
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#E50914]/10 border border-[#E50914]/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-[#E50914] flex-shrink-0" />
            <p className="text-[10px] font-mono text-[#A1A1A1] leading-tight">
              Feedback becomes part of the user's permanent algorithmic reputation. Please be constructive, fair, and professional.
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
