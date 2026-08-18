import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';

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
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Sign in to TeamForge</h2>
          <p className="text-xs text-zinc-400 mt-1">Connect with student builders and collaborate</p>
        </div>

        {/* 1-Click Quick Demo Switcher Card for Hackathon Judges */}
        <div className="bg-indigo-950/30 rounded-2xl p-4 border border-indigo-500/30 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>1-Click Hackathon Demo Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('mohit@teamforge.app')}
              className="p-2 rounded-xl bg-[#18181B] text-left border border-[#27272A] hover:border-indigo-500/40 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-[#FAFAFA]">Mohit (Lead)</div>
              <div className="text-[10px] text-zinc-400 truncate">React & Node Dev</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('aarav@teamforge.app')}
              className="p-2 rounded-xl bg-[#18181B] text-left border border-[#27272A] hover:border-indigo-500/40 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-[#FAFAFA]">Aarav (Candidate)</div>
              <div className="text-[10px] text-zinc-400 truncate">Python / ML Engineer</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya@teamforge.app')}
              className="p-2 rounded-xl bg-[#18181B] text-left border border-[#27272A] hover:border-indigo-500/40 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-[#FAFAFA]">Priya (Designer)</div>
              <div className="text-[10px] text-zinc-400 truncate">UI/UX & Figma</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('demo@teamforge.app')}
              className="p-2 rounded-xl bg-[#18181B] text-left border border-[#27272A] hover:border-indigo-500/40 hover:shadow-xs transition-all text-xs"
            >
              <div className="font-bold text-[#FAFAFA]">Demo Account</div>
              <div className="text-[10px] text-zinc-400 truncate">demo@teamforge.app</div>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 sm:p-8 shadow-soft space-y-5">
          {/* Google OAuth Button */}
          <GoogleAuthButton text="Continue with Google" />

          {/* Elegant Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27272A]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#18181B] px-3 text-zinc-500 font-bold tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-500"
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

        <div className="text-center mt-6 text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300">
            Create a student profile
          </Link>
        </div>
      </div>
    </div>
  );
};
