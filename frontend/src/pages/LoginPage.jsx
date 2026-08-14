import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickSwitchDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setLoading(true);
    const res = await quickSwitchDemoUser(demoEmail);
    setLoading(false);
    if (res?.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to TeamForge</h2>
          <p className="text-xs text-slate-500 mt-1">Connect with student builders and collaborate</p>
        </div>

        {/* 1-Click Quick Demo Switcher Card for Hackathon Judges */}
        <div className="bg-gradient-to-br from-brand-50 to-indigo-50/50 rounded-2xl p-4 border border-brand-200 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 mb-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>1-Click Hackathon Demo Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('mohit@teamforge.app')}
              className="p-2 rounded-xl bg-white text-left border border-brand-200 hover:border-brand-400 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-slate-900">Mohit (Lead)</div>
              <div className="text-[10px] text-slate-500 truncate">React & Node Dev</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('aarav@teamforge.app')}
              className="p-2 rounded-xl bg-white text-left border border-brand-200 hover:border-brand-400 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-slate-900">Aarav (Candidate)</div>
              <div className="text-[10px] text-slate-500 truncate">Python / ML Engineer</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya@teamforge.app')}
              className="p-2 rounded-xl bg-white text-left border border-brand-200 hover:border-brand-400 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-slate-900">Priya (Designer)</div>
              <div className="text-[10px] text-slate-500 truncate">UI/UX & Figma</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('demo@teamforge.app')}
              className="p-2 rounded-xl bg-white text-left border border-brand-200 hover:border-brand-400 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-slate-900">Demo Account</div>
              <div className="text-[10px] text-slate-500 truncate">demo@teamforge.app</div>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center mt-2"
            >
              Sign In
            </Button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            Create a student profile
          </Link>
        </div>
      </div>
    </div>
  );
};
