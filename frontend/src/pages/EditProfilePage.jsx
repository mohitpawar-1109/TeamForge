import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, User } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const EditProfilePage = () => {
  const { user, updateUserState } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    college: user?.college || '',
    course: user?.course || '',
    year: user?.year || '3rd Year',
    location: user?.location || '',
    bio: user?.bio || '',
    weeklyHours: user?.weeklyHours || 15
  });

  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('Intermediate');
  const [interests, setInterests] = useState(user?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      setSkills([...skills, { name: newSkillName.trim(), proficiency: newSkillProf, verified: true }]);
      setNewSkillName('');
    }
  };

  const handleRemoveSkill = (name) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (item) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills,
        interests
      };
      const res = await userAPI.updateProfile(payload);
      if (res.data.success) {
        updateUserState(res.data.data);
        success('Profile updated successfully! 🎉');
        navigate('/profile');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Profile</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Role</label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">College</label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Technical Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-800 rounded-xl border border-brand-200 text-xs font-semibold">
                {s.name} ({s.proficiency})
                <button type="button" onClick={() => handleRemoveSkill(s.name)}>
                  <X className="w-3 h-3 text-brand-600 hover:text-brand-900" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <select
              value={newSkillProf}
              onChange={(e) => setNewSkillProf(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link to="/profile">
            <Button variant="outline" size="md">Cancel</Button>
          </Link>
          <Button variant="primary" size="md" icon={Save} loading={saving} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
