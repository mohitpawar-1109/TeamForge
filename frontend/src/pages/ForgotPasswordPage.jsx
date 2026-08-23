import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setGoogleNotice(false);

    try {
      const res = await authAPI.forgotPassword({ email: email.trim() });
      if (res.data.success) {
        success('Verification code has been dispatched to your email.');
        navigate('/verify-otp', { state: { email: email.trim() } });
      }
    } catch (err) {
      if (err.response?.data?.isGoogleUser) {
        setGoogleNotice(true);
      } else {
        const msg = err.response?.data?.message || 'Failed to send verification code. Please try again.';
        error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#111111] border border-[#242424] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Forgot your password?</h2>
          <p className="text-xs font-mono text-[#888888] mt-1.5 max-w-xs mx-auto">
            Enter your registered email address and we'll send you a 6-digit verification code to reset it.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
          {googleNotice ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] text-left">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#E50914] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[#F5F5F5]">Google Account Detected</h4>
                    <p className="text-xs font-mono text-[#888888] mt-1">
                      This account uses Google Sign-In and does not require a local password. Please use Google Sign-In.
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/login" className="block">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5 pointer-events-none" />
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

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full justify-center"
              >
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#1F1F1F] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-[#E50914] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
