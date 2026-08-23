import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#242424] bg-[#111111] text-xs font-mono text-[#888888] hover:text-white hover:border-[#333333] transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#888888] group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Logo and title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#111111] border border-[#242424] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Sign in to TeamForge</h2>
          <p className="text-xs font-mono text-[#888888] mt-1">Connect with student builders and collaborate</p>
        </div>

        {/* Standard Form */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft space-y-5">
          {/* Google OAuth Button */}
          <GoogleAuthButton text="Continue with Google" />

          {/* Elegant Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#242424]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#111111] px-3 text-[#666666] font-mono font-bold tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-mono text-[#E50914] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555]"
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

        <div className="text-center mt-6 text-xs font-mono text-[#888888]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#E50914] hover:underline">
            Create a student profile
          </Link>
        </div>
      </div>
    </div>
  );
};
