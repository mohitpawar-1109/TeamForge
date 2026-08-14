import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Users,
  Brain,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { projectAPI, aiAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { AIAnalysisModal } from '../components/ai/AIAnalysisModal';

export const CreateProjectPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'AI / Machine Learning',
    difficulty: 'Medium',
    duration: '4-6 Weeks',
    teamSize: 4,
    availabilityNeeded: ['Weekdays', 'Weekends']
  });

  const [requiredSkills, setRequiredSkills] = useState(['React', 'Python', 'Machine Learning']);
  const [newSkill, setNewSkill] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleAddSkill = (e) => {
    e?.preventDefault();
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
  };

  const handleAnalyzeWithAI = async () => {
    if (!formData.description || formData.description.trim().length < 10) {
      error('Please write a brief description of your project before analyzing with AI.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiAPI.analyzeProject({
        description: formData.description,
        category: formData.category
      });

      if (res.data.success) {
        setAiAnalysisResult(res.data.data);
        setIsModalOpen(true);
        success('AI Project Analysis completed! 🎉');
      }
    } catch (err) {
      error('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIRecommendations = () => {
    if (aiAnalysisResult) {
      if (aiAnalysisResult.requiredSkills?.length) {
        setRequiredSkills(aiAnalysisResult.requiredSkills);
      }
      if (aiAnalysisResult.difficulty) {
        setFormData(prev => ({ ...prev, difficulty: aiAnalysisResult.difficulty }));
      }
      if (aiAnalysisResult.recommendedTeamSize) {
        setFormData(prev => ({ ...prev, teamSize: aiAnalysisResult.recommendedTeamSize }));
      }
      setIsModalOpen(false);
      success('AI recommendations applied to your project requirements!');
    }
  };

  const handleFinalSubmit = async () => {
    if (!formData.title || !formData.description) {
      error('Please fill in title and description.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...formData,
        requiredSkills,
        aiAnalysis: aiAnalysisResult ? { analyzed: true, ...aiAnalysisResult } : { analyzed: false }
      };

      const res = await projectAPI.createProject(payload);
      if (res.data.success) {
        success('Project created successfully! 🎉');
        navigate(`/projects/${res.data.data._id}`);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Stepper Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create New Project</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Set up project scope, analyze required skills with AI, and start recruiting teammates.
        </p>

        {/* Steps Progress */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: 'Project Info' },
            { num: 2, label: 'Skills Required' },
            { num: 3, label: 'Availability' },
            { num: 4, label: 'AI Review & Launch' }
          ].map((s) => (
            <div
              key={s.num}
              className={`p-3 rounded-xl border transition-all text-center ${
                step === s.num
                  ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-xs">Step {s.num}</div>
              <div className="text-[11px] truncate hidden sm:block">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-soft">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Step 1: Project Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI Resume Analyzer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Describe what your project does, problem it solves, and target architecture..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="AI / Machine Learning">AI / Machine Learning</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="FinTech">FinTech</option>
                  <option value="HealthTech">HealthTech</option>
                  <option value="IoT / Sustainability">IoT / Sustainability</option>
                  <option value="Blockchain / Web3">Blockchain / Web3</option>
                  <option value="AR / VR">AR / VR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Team Size</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Medium">Medium</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Hackathon (24-48h)">Hackathon (24-48h)</option>
                  <option value="2-3 Weeks">2-3 Weeks</option>
                  <option value="4-6 Weeks">4-6 Weeks</option>
                  <option value="Full Semester (3-4 Months)">Full Semester (3-4 Months)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                onClick={() => {
                  if (!formData.title || !formData.description) {
                    error('Please enter title and description before proceeding.');
                    return;
                  }
                  setStep(2);
                }}
              >
                Next: Required Skills
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Required Skills */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Step 2: Technical Skills Needed
            </h2>
            <p className="text-xs text-slate-500">
              Add technical skills required for this project. Our matching engine compares these against candidate profiles.
            </p>

            {/* Chips Container */}
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[80px] items-center">
              {requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-600 text-white shadow-xs"
                >
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)}>
                    <X className="w-3.5 h-3.5 hover:text-brand-200" />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Add Custom Skill */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type skill name (e.g. React, Node.js, NLP, Docker, Figma)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none"
              />
              <Button variant="secondary" size="md" onClick={handleAddSkill}>
                Add Skill
              </Button>
            </div>

            {/* Suggested skill presets */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {['React', 'Node.js', 'Python', 'Machine Learning', 'NLP', 'UI/UX', 'Figma', 'MongoDB', 'PostgreSQL', 'Docker', 'React Native'].map(ps => (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => {
                      if (!requiredSkills.includes(ps)) setRequiredSkills([...requiredSkills, ps]);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 border border-slate-200 transition-colors"
                  >
                    + {ps}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setStep(3)}>
                Next: Availability
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Availability & Work Style */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Step 3: Schedule & Collaboration Needs
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred Team Meeting Times</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Weekdays (Evening)', 'Weekends (Full Day)', 'Flexible / Async'].map((timeOption) => {
                  const selected = formData.availabilityNeeded.includes(timeOption);
                  return (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setFormData({ ...formData, availabilityNeeded: formData.availabilityNeeded.filter(t => t !== timeOption) });
                        } else {
                          setFormData({ ...formData, availabilityNeeded: [...formData.availabilityNeeded, timeOption] });
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-center text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-brand-50 border-brand-400 text-brand-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {timeOption}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setStep(4)}>
                Next: AI Analysis & Launch
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: AI Analysis & Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Step 4: AI Project Requirements Analysis
            </h2>

            {/* AI Callout Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-50 via-indigo-50/70 to-violet-50 border border-brand-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Analyze Project Scope with AI</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Our AI scans your project overview, extracts exact skill dependencies, estimates team balance, and flags potential technical bottlenecks before you begin recruitment.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="gradient"
                      size="md"
                      icon={Sparkles}
                      loading={aiLoading}
                      onClick={handleAnalyzeWithAI}
                    >
                      {aiLoading ? 'Analyzing Project Architecture...' : 'Analyze Project with AI'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100/60 px-2 py-0.5 rounded">
                    {formData.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{formData.title}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                  {formData.teamSize} Members Required
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{formData.description}</p>

              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Target Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {requiredSkills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={creating}
                icon={Check}
                onClick={handleFinalSubmit}
              >
                Launch Project & Find Teammates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysisData={aiAnalysisResult}
        onApply={handleApplyAIRecommendations}
      />
    </div>
  );
};
