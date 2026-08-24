import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  User,
  Mail,
  Lock,
  GraduationCap,
  Sparkles,
  Plus,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { RegistrationAssessmentView } from '../components/verification/RegistrationAssessmentView';
import { RegistrationSkillSummaryView } from '../components/verification/RegistrationSkillSummaryView';
import { useToast } from '../context/ToastContext';

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'JavaScript',
  'TypeScript',
  'MongoDB',
  'SQL',
  'Machine Learning',
  'Java',
  'C++',
  'UI/UX',
  'Flutter',
  'Docker',
  'Next.js',
  'FastAPI'
];

export const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Skills & Proficiency, 3: AI Assessment, 4: Summary
  const { error, success } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1: Basic & Academic Info
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    headline: '',
    college: '',
    course: '',
    year: '3rd Year',
    bio: '',
    weeklyHours: 15
  });

  // Step 2: Skills & Claimed Proficiency
  const [selectedSkills, setSelectedSkills] = useState([
    { name: 'React', claimedLevel: 'Intermediate' },
    { name: 'Node.js', claimedLevel: 'Intermediate' },
    { name: 'Python', claimedLevel: 'Beginner' }
  ]);
  const [customSkill, setCustomSkill] = useState('');
  const [interests, setInterests] = useState(['Web Development', 'AI / ML']);
  const [newInterest, setNewInterest] = useState('');
  const [availability, setAvailability] = useState(['Weekdays', 'Weekends']);

  // Step 3 & 4: Assessment & Summary State
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Skill Management
  const handleTogglePopularSkill = (skillName) => {
    const exists = selectedSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (exists) {
      setSelectedSkills(selectedSkills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
    } else {
      setSelectedSkills([...selectedSkills, { name: skillName, claimedLevel: 'Intermediate' }]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (!selectedSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills([...selectedSkills, { name: trimmed, claimedLevel: 'Intermediate' }]);
      setCustomSkill('');
    }
  };

  const handleRemoveSkill = (skillNameToRemove) => {
    setSelectedSkills(selectedSkills.filter((s) => s.name !== skillNameToRemove));
  };

  const handleUpdateProficiency = (skillName, newLevel) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.name === skillName ? { ...s, claimedLevel: newLevel } : s))
    );
  };

  // Step 1 Validation & Proceed
  const handleProceedToSkills = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      error('Please fill in your name, email, and password.');
      return;
    }
    setStep(2);
  };

  // Skip assessment and directly create account with self-reported skills
  const handleCreateAccountWithoutAssessment = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        skills: selectedSkills.map((s) => ({
          name: s.name,
          proficiency: s.claimedLevel,
          verified: false
        })),
        interests,
        availability
      };

      const res = await register(payload);
      if (res.success) {
        success('Account created! Skills marked as Self-Reported.');
        navigate('/dashboard');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // Start Assessment
  const handleProceedToAssessment = () => {
    if (selectedSkills.length === 0) {
      error('Please select at least one technical skill to verify.');
      return;
    }
    setStep(3);
  };

  // On Assessment Completed
  const handleAssessmentCompleted = async (evalData) => {
    try {
      setLoading(true);
      setAssessmentResults(evalData);

      // Register the account with verified skills metadata
      const verifiedSkillMap = {};
      (evalData.skillResults || []).forEach((sr) => {
        verifiedSkillMap[sr.skill.toLowerCase()] = sr;
      });

      const payloadSkills = selectedSkills.map((s) => {
        const vResult = verifiedSkillMap[s.name.toLowerCase()];
        return {
          name: s.name,
          proficiency: vResult?.verified ? vResult.verifiedLevel : s.claimedLevel,
          verified: vResult ? vResult.verified : false
        };
      });

      const payload = {
        ...formData,
        skills: payloadSkills,
        interests,
        availability
      };

      const res = await register(payload);
      if (res.success) {
        setStep(4);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to finalize verified account.');
      setStep(4); // Still display results summary
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-10 shadow-soft">
        {/* Step Indicator Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
          </div>

          {step === 1 && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Create Student Account</h2>
              <p className="text-xs font-mono text-[#888888] mt-1">Step 1 of 4 • Account Credentials & Background</p>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Select Technical Skills</h2>
              <p className="text-xs font-mono text-[#888888] mt-1">Step 2 of 4 • Select skills & claimed proficiency levels</p>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">AI Skill Verification</h2>
              <p className="text-xs font-mono text-[#888888] mt-1">Step 3 of 4 • Demonstrate your practical proficiency</p>
            </>
          )}

          {step === 4 && (
            <p className="text-xs font-mono text-[#888888]">Step 4 of 4 • Onboarding Complete</p>
          )}
        </div>

        {/* ============================================================ */}
        {/* STEP 1: ACCOUNT DETAILS                                      */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-4 mb-4">
              <GoogleAuthButton text="Sign up with Google" />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#242424]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#111111] px-3 text-[#666666] font-mono font-bold tracking-wider">
                    Or register with email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleProceedToSkills} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohit Pawar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Headline / Primary Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer / ML"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">College</label>
                  <input
                    type="text"
                    placeholder="e.g. Stanford University"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Major / Course</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Masters / Postgrad">Masters / Postgrad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Bio / Background</label>
                <textarea
                  rows={2}
                  placeholder="Tell teammates what you love building..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-2xl focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#E50914] hover:bg-[#C40812] text-white text-xs sm:text-sm font-mono font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue: Select Skills</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center mt-6 text-xs font-mono text-[#888888]">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#E50914] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: SKILL SELECTION & CLAIMED PROFICIENCY                */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Skills Picker */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                Popular Technical Skills (Click to Add)
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((skill, idx) => {
                  const isSelected = selectedSkills.some(
                    (s) => s.name.toLowerCase() === skill.toLowerCase()
                  );
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTogglePopularSkill(skill)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E50914] text-white border-[#E50914] shadow-sm font-bold'
                          : 'bg-[#161616] text-[#A1A1A1] border-[#242424] hover:border-[#383838]'
                      }`}
                    >
                      {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleAddCustomSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom skill (e.g. PyTorch, Rust, Solidity)"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                className="flex-1 px-4 py-2 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-white cursor-pointer"
              >
                Add Skill
              </button>
            </form>

            {/* Configured Skills & Claimed Proficiency List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                  Your Claimed Proficiency Levels
                </label>
                <span className="text-[10px] font-mono text-[#666666]">
                  {selectedSkills.length} skills selected
                </span>
              </div>

              {selectedSkills.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#161616] border border-[#242424] text-center text-xs font-mono text-[#888888]">
                  Select at least one skill above to configure your technical profile.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#161616] border border-[#242424] gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-white">{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="p-1 text-[#666666] hover:text-[#E50914] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Proficiency Selector */}
                      <div className="flex items-center gap-1.5">
                        {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleUpdateProficiency(skill.name, level)}
                            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              skill.claimedLevel === level
                                ? 'bg-[#111111] text-white border-[#E50914] font-bold shadow-sm'
                                : 'bg-[#111111] text-[#777777] border-[#242424] hover:text-[#D0D0D0]'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424] text-[11px] font-mono text-[#888888] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#E50914] flex-shrink-0 mt-0.5" />
              <span>
                Claimed proficiency informs AI question difficulty. Complete the test now to earn <strong>Verified</strong> badges and 2x matching priority.
              </span>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-[#242424] bg-[#161616] hover:bg-[#202020] text-xs font-mono text-[#A1A1A1] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCreateAccountWithoutAssessment}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-[#242424] bg-[#161616] hover:bg-[#202020] text-xs font-mono text-[#888888] hover:text-white transition-all cursor-pointer text-center"
                >
                  Take Test Later
                </button>

                <button
                  type="button"
                  onClick={handleProceedToAssessment}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify with AI Assessment</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: AI SKILL ASSESSMENT                                  */}
        {/* ============================================================ */}
        {step === 3 && (
          <RegistrationAssessmentView
            skillsWithLevels={selectedSkills}
            onAssessmentCompleted={handleAssessmentCompleted}
            onSkipAssessment={handleCreateAccountWithoutAssessment}
          />
        )}

        {/* ============================================================ */}
        {/* STEP 4: VERIFICATION SUMMARY & FINISH                        */}
        {/* ============================================================ */}
        {step === 4 && (
          <RegistrationSkillSummaryView
            results={assessmentResults}
            userName={formData.name || 'Developer'}
            onFinish={() => navigate('/dashboard')}
          />
        )}
      </div>
    </div>
  );
};
