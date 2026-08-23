import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Mail, Lock, GraduationCap, Sparkles, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';

export const RegisterPage = () => {
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

  const [skills, setSkills] = useState(['React', 'Node.js', 'Python']);
  const [newSkill, setNewSkill] = useState('');
  const [interests, setInterests] = useState(['Web Development', 'AI / ML']);
  const [newInterest, setNewInterest] = useState('');
  const [availability, setAvailability] = useState(['Weekdays', 'Weekends']);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...formData,
      skills: skills.map(s => ({ name: s, proficiency: 'Intermediate' })),
      interests,
      availability
    };
    const res = await register(payload);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-10 shadow-soft">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Create Student Profile</h2>
          <p className="text-xs font-mono text-[#888888] mt-1">Join TeamForge to form hackathon teams and collaborate</p>
        </div>

        {/* Google One-Click Registration */}
        <div className="space-y-4 mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
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

          {/* Academic Info */}
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

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Bio / Past Experience</label>
            <textarea
              rows={2}
              placeholder="Tell teammates what you love building..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-2xl focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
            />
          </div>

          {/* Skills Management */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">Technical Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
                >
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)}>
                    <X className="w-3 h-3 text-[#888888] hover:text-white" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker, Figma, PyTorch)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-4 py-1.5 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono text-white cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Interests & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">Interests / Focus</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {interests.map((int, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]"
                  >
                    {int}
                    <button type="button" onClick={() => handleRemoveInterest(int)}>
                      <X className="w-3 h-3 text-[#888888] hover:text-white" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. FinTech, Robotics"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 px-4 py-1.5 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono text-white cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">Weekly Availability (Hours)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.weeklyHours}
                onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                className="w-full px-4 py-2 text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none placeholder:text-[#555555]"
              />
              <p className="text-[10px] font-mono text-[#666666] mt-1">Average hours you can commit to hackathons/projects.</p>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full justify-center mt-4"
          >
            Create Profile & Start Matching
          </Button>
        </form>

        <div className="text-center mt-6 text-xs font-mono text-[#888888]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#E50914] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
