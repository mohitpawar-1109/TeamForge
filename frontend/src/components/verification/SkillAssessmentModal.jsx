import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const SkillAssessmentModal = ({
  skillName,
  claimedLevel = 'Intermediate',
  isOpen,
  onClose,
  onCompleted
}) => {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [timeLeft, setTimeLeft] = useState(180);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !skillName) return;

    let mounted = true;
    const initTest = async () => {
      try {
        setLoading(true);
        setCurrentIndex(0);
        setUserAnswers({});
        startTimeRef.current = Date.now();

        const res = await verificationAPI.startSkillTest(skillName, { claimedLevel });
        if (mounted && res.data.success) {
          setSession(res.data.data);
          setTimeLeft(res.data.data.timeLimitSeconds || 180);
        }
      } catch (err) {
        if (mounted) {
          error(err.response?.data?.message || 'Failed to start skill assessment.');
          onClose();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initTest();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, skillName, claimedLevel]);

  // Timer countdown
  useEffect(() => {
    if (!session || loading || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, loading, submitting]);

  const handleAutoSubmit = () => {
    error('Time expired! Submitting your answers automatically...');
    handleSubmit();
  };

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
      questionId: q.id,
      selectedOptionIndex: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1
    }));

    const durationSeconds = Math.max(
      3,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await verificationAPI.submitSkillTest(skillName, {
        userAnswers: formattedAnswers,
        claimedLevel,
        durationSeconds
      });

      if (res.data.success) {
        success(res.data.message || 'Assessment completed successfully!');
        if (onCompleted) {
          onCompleted(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit skill test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const questions = session?.questions || [];
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111111] border border-[#242424] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F1F1F] bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#111111] border border-[#242424] text-[#E50914]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Skill Assessment: <span className="text-[#E50914]">{skillName}</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#A1A1A1] border border-[#242424]">
                  Target: {claimedLevel}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#888888]">
                Adaptive questions • Anti-cheat integrity active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs font-bold ${
                timeLeft < 45
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                  : 'bg-[#111111] text-[#D0D0D0] border-[#242424]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#202020] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-[#888888]">
                Generating adaptive question set for {skillName} ({claimedLevel})...
              </p>
            </div>
          ) : currentQ ? (
            <div className="space-y-5">
              {/* Progress & Metadata */}
              <div className="flex items-center justify-between text-xs font-mono text-[#888888]">
                <span>
                  Question <strong className="text-white">{currentIndex + 1}</strong> of {totalQ}
                </span>
                <span className="capitalize px-2 py-0.5 rounded-md bg-[#161616] border border-[#242424] text-[#A1A1A1]">
                  {currentQ.type.replace('_', ' ')} • {currentQ.difficulty}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                <div
                  className="h-full bg-[#E50914] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F5] leading-relaxed">
                  {currentQ.question}
                </h4>

                {/* Code Snippet Box */}
                {currentQ.codeSnippet && (
                  <div className="rounded-2xl bg-[#090909] border border-[#242424] p-4 font-mono text-xs text-[#E5E5E5] overflow-x-auto relative">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A1A1A] text-[10px] text-[#666666]">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-[#E50914]" />
                        <span>Snippet Inspector</span>
                      </span>
                    </div>
                    <pre className="leading-5 whitespace-pre">{currentQ.codeSnippet}</pre>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-[#E50914]/10 border-[#E50914] text-white shadow-sm'
                          : 'bg-[#161616] border-[#242424] hover:border-[#383838] text-[#D0D0D0]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'bg-[#E50914] border-[#E50914] text-white'
                            : 'bg-[#111111] border-[#333333] text-[#888888]'
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
          ) : (
            <div className="py-12 text-center text-xs font-mono text-[#888888]">
              No questions found.
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1F1F1F] bg-[#161616]">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || submitting}
            className="px-4 py-2 rounded-full border border-[#242424] bg-[#111111] hover:bg-[#202020] text-xs font-mono text-[#A1A1A1] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
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
              className="px-4 py-2 rounded-full border border-[#242424] bg-[#111111] hover:bg-[#202020] text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-full bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Assessment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
