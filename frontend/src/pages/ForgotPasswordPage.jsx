import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
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
        // Navigate to OTP verification page with email state
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
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Forgot your password?</h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
            Enter your registered email address and we'll send you a 6-digit verification code to reset it.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 sm:p-8 shadow-soft">
          {googleNotice ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-left">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#FAFAFA]">Google Account Detected</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      This account uses Google Sign-In and does not require a local password. Please use the Google sign-in button to access your account.
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
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
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

          <div className="mt-6 pt-5 border-t border-[#27272A] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors"
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
