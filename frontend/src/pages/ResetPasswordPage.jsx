import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

const calculateStrength = (pass = '') => {
  let score = 0;
  if (!pass) return { score: 0, label: 'None', color: 'bg-zinc-700' };
  if (pass.length >= 8) score += 30;
  if (pass.length >= 12) score += 20;
  if (/[0-9]/.test(pass)) score += 20;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 15;
  if (/[^A-Za-z0-9]/.test(pass)) score += 15;

  if (score < 40) return { score, label: 'Weak', color: 'bg-[#FF1F2D]' };
  if (score < 75) return { score, label: 'Good', color: 'bg-[#F2B705]' };
  return { score, label: 'Strong', color: 'bg-[#20D47A]' };
};

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const strength = calculateStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.resetPassword({
        email,
        resetToken,
        newPassword: password
      });

      if (res.data.success) {
        setIsSuccess(true);
        success('Your password has been successfully reset! 🎉');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please try again or request a new code.';
      error(msg);
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
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
            {isSuccess ? 'Password Reset Complete' : 'Create new password'}
          </h2>
          <p className="text-xs font-mono text-[#888888] mt-1.5 max-w-xs mx-auto">
            {isSuccess
              ? 'Your password has been securely updated in TeamForge.'
              : 'Choose a strong password with at least 8 characters.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
          {isSuccess ? (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#20D47A]/10 border border-[#20D47A]/30 flex items-center justify-center mx-auto text-[#20D47A]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#F5F5F5]">Password reset successful!</h3>
                <p className="text-xs font-mono text-[#888888] mt-1">
                  You can now sign in to TeamForge with your new password.
                </p>
              </div>

              <Link to="/login" className="block">
                <Button variant="primary" size="md" className="w-full justify-center">
                  <span>Go to Login</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#888888] hover:text-[#F5F5F5] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#888888]">
                      <span>Strength</span>
                      <span className="font-semibold text-[#F5F5F5]">{strength.label}</span>
                    </div>
                    <div className="w-full bg-[#161616] h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#888888] uppercase mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border text-[#F5F5F5] rounded-full focus:outline-none transition-all placeholder:text-[#555555] ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-[#FF1F2D]'
                        : 'border-[#242424] focus:border-[#E50914]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-[#888888] hover:text-[#F5F5F5] focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] font-mono text-[#FF1F2D] mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Reset Password Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={password.length < 8 || password !== confirmPassword}
                className="w-full justify-center mt-2"
              >
                <span>Reset Password</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
