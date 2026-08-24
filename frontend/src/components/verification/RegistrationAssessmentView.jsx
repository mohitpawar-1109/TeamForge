import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  Code2,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Sparkles,
  RefreshCw,
  HelpCircle,
  SkipForward
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const RegistrationAssessmentView = ({
  skillsWithLevels = [],
  assessmentData,
  onAssessmentCompleted,
  onSkipAssessment
}) => {
  const { error, success } = useToast();
  const [session, setSession] = useState(assessmentData);
  const [loading, setLoading] = useState(!assessmentData);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tf_onboarding_answers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const startTimeRef = useRef(Date.now());

  // Save answers to sessionStorage to prevent accidental loss on refresh
  useEffect(() => {
    try {
      sessionStorage.setItem('tf_onboarding_answers', JSON.stringify(userAnswers));
    } catch {}
  }, [userAnswers]);

  // Generate assessment if not provided
  useEffect(() => {
    if (session) return;

    let mounted = true;
    const initGen = async () => {
      try {
        setLoading(true);
        console.log('[SKILL-ASSESSMENT] REQUEST PAYLOAD:', skillsWithLevels);
        const res = await verificationAPI.generateAssessment({
          skills: skillsWithLevels
        });
        console.log('[SKILL-ASSESSMENT] RESPONSE:', res);
        if (mounted && res.data.success) {
          setSession(res.data.data);
        }
      } catch (err) {
        console.error('[SKILL-ASSESSMENT] ERROR:', err);
        console.error('[SKILL-ASSESSMENT] ERROR RESPONSE:', err.response);
        if (mounted) {
          error(err.response?.data?.message || err.message || 'Failed to generate skill assessment questions.');
          setSession({ error: err.response?.data?.message || err.message || 'Unknown error', fullError: JSON.stringify(err.response?.data || err.message) });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initGen();
    return () => {
      mounted = false;
    };
  }, [skillsWithLevels]);

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (submitting || !session) return;

    const questions = session.questions || [];
    const formattedAnswers = questions.map((q) => ({
      questionId: q.questionId,
      selectedAnswer: userAnswers[q.questionId] !== undefined ? userAnswers[q.questionId] : -1
    }));

    const durationSeconds = Math.max(
      3,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    try {
      setSubmitting(true);
      const res = await verificationAPI.submitAssessment(session.assessmentId, {
        userAnswers: formattedAnswers,
        durationSeconds
      });

      if (res.data.success) {
        sessionStorage.removeItem('tf_onboarding_answers');
        success('Assessment evaluated successfully!');
        if (onAssessmentCompleted) {
          onAssessmentCompleted(res.data.data);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to evaluate skill test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white font-mono">
            AI Skill Authenticity Engine
          </h3>
          <p className="text-xs font-mono text-[#888888]">
            Synthesizing personalized technical questions for {skillsWithLevels.map((s) => s.name).join(', ')}...
          </p>
        </div>
      </div>
    );
  }

  const questions = session?.questions || [];
  const totalQ = questions.length;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  if (session?.error || totalQ === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#F2B705] mx-auto" />
        <p className="text-xs font-mono text-[#888888]">
          We couldn't generate your skill assessment right now.
        </p>
        {session?.error && (
          <div className="mt-4 p-4 bg-[#2A0000] border border-[#E50914] text-left text-xs font-mono text-[#FF8888] rounded whitespace-pre-wrap overflow-auto max-h-40">
            <strong>Assessment generation failed.</strong><br/>
            Endpoint: POST /api/skill-assessment/generate<br/>
            Reason: {session.error}<br/>
            Details: {session.fullError}
          </div>
        )}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          {onSkipAssessment && (
            <button
              type="button"
              onClick={onSkipAssessment}
              className="px-4 py-2 rounded-full bg-[#E50914] text-white text-xs font-mono font-bold cursor-pointer"
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Assessment Header Strip */}
      <div className="bg-[#161616] rounded-2xl p-4 border border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#111111] border border-[#242424] text-[#E50914]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-white">
                Skill Verification: <strong className="text-[#E50914]">{currentQ.skill}</strong>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#A1A1A1] border border-[#242424]">
                {currentQ.difficulty} Level
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#888888] mt-0.5">
              Testing concept: {currentQ.concept || 'Practical Application'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#888888]">
            Question <strong className="text-white">{currentIndex + 1}</strong> of {totalQ}
          </span>
          {onSkipAssessment && (
            <button
              type="button"
              onClick={onSkipAssessment}
              className="text-[10px] font-mono text-[#888888] hover:text-[#E50914] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Take Test Later</span>
              <SkipForward className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden border border-[#242424]">
        <div
          className="h-full bg-[#E50914] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-[#161616] rounded-3xl border border-[#242424] p-6 space-y-5">
        <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F5] leading-relaxed">
          {currentQ.question}
        </h3>

        {/* Code snippet if present */}
        {currentQ.codeSnippet && (
          <div className="rounded-2xl bg-[#090909] border border-[#242424] p-4 font-mono text-xs text-[#E5E5E5] overflow-x-auto relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A1A1A] text-[10px] text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Code Scenario Inspector</span>
              </span>
            </div>
            <pre className="leading-5 whitespace-pre">{currentQ.codeSnippet}</pre>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = userAnswers[currentQ.questionId] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(currentQ.questionId, optIdx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#E50914]/10 border-[#E50914] text-white shadow-sm'
                    : 'bg-[#111111] border-[#242424] hover:border-[#383838] text-[#D0D0D0]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 border ${
                    isSelected
                      ? 'bg-[#E50914] border-[#E50914] text-white'
                      : 'bg-[#161616] border-[#333333] text-[#888888]'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span className="text-xs sm:text-sm leading-relaxed">{optionText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0 || submitting}
          className="px-4 py-2 rounded-full border border-[#242424] bg-[#161616] hover:bg-[#202020] text-xs font-mono text-[#A1A1A1] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="text-[11px] font-mono text-[#666666]">
          {answeredCount}/{totalQ} Answered
        </div>

        {currentIndex < totalQ - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
            disabled={submitting}
            className="px-5 py-2 rounded-full border border-[#242424] bg-[#161616] hover:bg-[#202020] text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Authenticity...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Complete Assessment</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
