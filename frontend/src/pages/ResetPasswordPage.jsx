import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

// Calculate password strength score (0 to 100)
const calculateStrength = (pass = '') => {
  let score = 0;
  if (!pass) return { score: 0, label: 'None', color: 'bg-zinc-700' };
  if (pass.length >= 8) score += 30;
  if (pass.length >= 12) score += 20;
  if (/[0-9]/.test(pass)) score += 20;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 15;
  if (/[^A-Za-z0-9]/.test(pass)) score += 15;

  if (score < 40) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score < 75) return { score, label: 'Good', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
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

  // Redirect if missing credentials
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
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
            {isSuccess ? 'Password Reset Complete' : 'Create new password'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
            {isSuccess
              ? 'Your password has been securely updated in TeamForge.'
              : 'Choose a strong password with at least 8 characters.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 sm:p-8 shadow-soft">
          {isSuccess ? (
            /* STEP 5: SUCCESS STATE */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#FAFAFA]">Password reset successful!</h3>
                <p className="text-xs text-zinc-400 mt-1">
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
            /* STEP 4: RESET PASSWORD FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#111113] border border-[#27272A] text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Strength</span>
                      <span className="font-semibold text-zinc-300">{strength.label}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
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
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-10 py-2.5 text-sm bg-[#111113] border text-[#FAFAFA] rounded-xl focus:bg-[#09090B] focus:outline-none transition-all placeholder:text-zinc-500 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-[#27272A] focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
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
