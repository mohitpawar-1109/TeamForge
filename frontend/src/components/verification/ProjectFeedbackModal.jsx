import React, { useState } from 'react';
import {
  X,
  Star,
  FolderGit2,
  Send,
  ShieldCheck
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ProjectFeedbackModal = ({
  isOpen,
  onClose,
  project,
  onFeedbackSubmitted
}) => {
  const { error, success } = useToast();
  const [technicalQuality, setTechnicalQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [reliability, setReliability] = useState(5);
  const [contribution, setContribution] = useState(5);
  const [documentation, setDocumentation] = useState(5);
  const [problemSolving, setProblemSolving] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await verificationAPI.submitProjectFeedback(project._id, {
        technicalQuality,
        communication,
        reliability,
        contribution,
        documentation,
        problemSolving,
        writtenFeedback
      });

      if (res.data.success) {
        success('Project evaluation submitted successfully! ⭐');
        if (onFeedbackSubmitted) onFeedbackSubmitted(res.data.data);
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit project feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (label, value, setValue) => {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161616] border border-[#242424]">
        <span className="text-xs font-mono text-[#D0D0D0]">{label}</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue(star)}
              className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Star
                className={`w-4 h-4 ${
                  star <= value
                    ? 'fill-[#E50914] text-[#E50914]'
                    : 'text-[#383838]'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-mono font-bold text-white ml-2 w-4 text-right">
            {value}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111111] border border-[#242424] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F] bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#111111] border border-[#242424] text-[#E50914]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Evaluate Project: <span className="text-[#E50914]">{project.title}</span>
              </h3>
              <p className="text-xs font-mono text-[#888888]">
                Team execution and delivery quality evaluation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#202020] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {renderStarSelector('Technical Architecture & Code Quality', technicalQuality, setTechnicalQuality)}
          {renderStarSelector('Team Collaboration & Communication', communication, setCommunication)}
          {renderStarSelector('Delivery Speed & Reliability', reliability, setReliability)}
          {renderStarSelector('Individual Contribution Balance', contribution, setContribution)}
          {renderStarSelector('Project Documentation & Clarity', documentation, setDocumentation)}
          {renderStarSelector('Complex Problem Solving', problemSolving, setProblemSolving)}

          {/* Written Feedback */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
              Project Highlights & Retrospective Notes
            </label>
            <textarea
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              rows={3}
              placeholder="What worked well? What technical hurdles did the team overcome?..."
              className="w-full bg-[#161616] border border-[#242424] rounded-2xl p-3.5 text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E50914] transition-colors resize-none font-mono"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#242424] bg-[#111111] hover:bg-[#202020] text-xs font-mono text-[#A1A1A1] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-full bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Evaluation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
