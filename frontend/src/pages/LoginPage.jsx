import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowLeft } from 'lucide-react';
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#703344] bg-transparent text-xs font-semibold text-[#DDA081] hover:text-[#CB6B5A] hover:border-[#CB6B5A]/60 hover:bg-[#703344]/30 transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#DDA081] group-hover:text-[#CB6B5A] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Logo and title */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3" title="Return to TeamForge Home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] flex items-center justify-center text-[#F6E8E2] shadow-md shadow-[#A84A4D]/20 hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#F6E8E2] tracking-tight">Sign in to TeamForge</h2>
          <p className="text-xs text-[#DDA081] mt-1">Connect with student builders and collaborate</p>
        </div>

        {/* Standard Form */}
        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-6 sm:p-8 shadow-soft space-y-5">
          {/* Google OAuth Button */}
          <GoogleAuthButton text="Continue with Google" />

          {/* Elegant Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#703344]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#4A2A35] px-3 text-[#DDA081] font-bold tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#DDA081] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#DDA081] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none transition-all placeholder:text-[#DDA081]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#DDA081]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#CB6B5A] hover:text-[#DDA081] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#DDA081] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#281A21] border border-[#703344] text-[#F6E8E2] rounded-xl focus:bg-[#281A21] focus:border-[#CB6B5A] focus:outline-none transition-all placeholder:text-[#DDA081]"
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

        <div className="text-center mt-6 text-xs text-[#DDA081]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#CB6B5A] hover:text-[#DDA081]">
            Create a student profile
          </Link>
        </div>
      </div>
    </div>
  );
};
