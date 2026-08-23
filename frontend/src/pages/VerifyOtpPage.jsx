import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

// Mask email for privacy (e.g. mohitpawar@gmail.com -> m***r@gmail.com)
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

  // Redirect if no email was passed in navigation state
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Cooldown countdown timer for Resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus the first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow single digit numeric input
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-advance to next input if digit entered
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

    // Focus last filled digit or the 6th input
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
        // Navigate to Reset Password page with email and resetToken
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
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] flex items-center justify-center text-[#F6E8E2] shadow-md shadow-[#A84A4D]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#F6E8E2] tracking-tight">Verify your email</h2>
          <p className="text-xs text-[#DDA081] mt-1.5">
            We sent a 6-digit verification code to:{' '}
            <span className="font-semibold text-[#CB6B5A]">{maskEmail(email)}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#4A2A35] rounded-2xl border border-[#703344] p-6 sm:p-8 shadow-soft">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Inputs */}
            <div>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border transition-all focus:outline-none ${
                      errorMessage
                        ? 'border-[#C04A4D] bg-[#C04A4D]/20 text-[#E07D82] focus:border-[#C04A4D]'
                        : digit
                        ? 'border-[#A84A4D] bg-[#703344]/40 text-[#F6E8E2]'
                        : 'border-[#703344] bg-[#281A21] text-[#F6E8E2] focus:border-[#CB6B5A] focus:bg-[#281A21]'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#E07D82]">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Expiration and Resend Info */}
            <div className="flex items-center justify-between text-xs text-[#DDA081] bg-[#281A21] p-3 rounded-xl border border-[#703344]">
              <div className="flex items-center gap-1.5 text-[#DDA081]">
                <Clock className="w-3.5 h-3.5 text-[#CB6B5A]" />
                <span>Expires in 10 mins</span>
              </div>

              <div>
                {cooldown > 0 ? (
                  <span className="text-[#DDA081]/70 font-medium">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#CB6B5A] hover:text-[#DDA081] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
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

          <div className="mt-6 pt-5 border-t border-[#703344] text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs text-[#DDA081] hover:text-[#CB6B5A] transition-colors"
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
