import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

const maskEmail = (email = '') => {
  if (!email || !email.includes('@')) return 'your email';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, success, info } = useToast();

  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setOtp(newOtp);
    setErrorMessage('');

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (pastedData[i]) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    setErrorMessage('');

    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authAPI.verifyOtp({
        email,
        otp: fullOtp
      });

      if (res.data.success) {
        success('Verification successful! Set your new password.');
        navigate('/reset-password', {
          state: {
            email,
            resetToken: res.data.resetToken
          }
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage('');

    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data.success) {
        success('A new verification code has been sent to your email.');
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#111111] border border-[#242424] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Verify your email</h2>
          <p className="text-xs font-mono text-[#888888] mt-1.5">
            We sent a 6-digit verification code to:{' '}
            <span className="font-semibold text-[#E50914]">{maskEmail(email)}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Inputs */}
            <div>
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-2xl border transition-all focus:outline-none ${
                      errorMessage
                        ? 'border-[#FF1F2D] bg-[#E50914]/15 text-[#FF1F2D] focus:border-[#FF1F2D]'
                        : digit
                        ? 'border-[#E50914] bg-[#161616] text-[#F5F5F5]'
                        : 'border-[#242424] bg-[#161616] text-[#F5F5F5] focus:border-[#E50914]'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs font-mono text-[#FF1F2D]">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Expiration and Resend Info */}
            <div className="flex items-center justify-between text-xs font-mono text-[#888888] bg-[#161616] p-3 rounded-2xl border border-[#242424]">
              <div className="flex items-center gap-1.5 text-[#888888]">
                <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Expires in 10 mins</span>
              </div>

              <div>
                {cooldown > 0 ? (
                  <span className="text-[#666666]">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#E50914] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center"
            >
              <span>Verify OTP</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1F1F1F] text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-[#E50914] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Use a different email</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
