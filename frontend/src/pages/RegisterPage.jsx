import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Mail, Lock, GraduationCap, Sparkles, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

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
      <div className="w-full max-w-2xl bg-[#18181B] rounded-3xl border border-[#27272A] p-6 sm:p-10 shadow-soft">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">Create Student Profile</h2>
          <p className="text-xs text-zinc-400 mt-1">Join TeamForge to form hackathon teams and collaborate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mohit Pawar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Headline / Primary Role</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer / ML Researcher"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Academic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">College / University</label>
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Course / Major</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-zinc-300 rounded-xl focus:outline-none focus:border-indigo-500"
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Bio / Past Experience</label>
            <textarea
              rows={2}
              placeholder="Tell teammates what you love building..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
            />
          </div>

          {/* Skills Management */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Technical Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                >
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)}>
                    <X className="w-3 h-3 text-indigo-400 hover:text-white" />
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
                className="flex-1 px-3 py-1.5 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
          </div>

          {/* Interests & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Interests / Focus Areas</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {interests.map((int, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  >
                    {int}
                    <button type="button" onClick={() => handleRemoveInterest(int)}>
                      <X className="w-3 h-3" />
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
                  className="flex-1 px-3 py-1.5 text-xs bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddInterest}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Weekly Availability (Hours)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.weeklyHours}
                onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Average hours you can commit to hackathons/projects.</p>
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            loading={loading}
            className="w-full justify-center mt-4"
          >
            Create Profile & Start Matching
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-zinc-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
