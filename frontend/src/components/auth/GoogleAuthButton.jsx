import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const GoogleAuthButton = ({ text = 'Continue with Google', className = '' }) => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { error, info } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      error('No credential received from Google.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginWithGoogle({ credential: response.credential });
      if (res?.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      error(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no client ID provided in env, we still provide a developer-friendly fallback click handler
    if (!clientId) return;

    // Load Google Identity Services script
    const loadGsiScript = () => {
      if (document.getElementById('google-gsi-client')) return;
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      };
      document.body.appendChild(script);
    };

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } else {
      loadGsiScript();
    }
  }, [clientId]);

  const handleCustomButtonClick = () => {
    if (!clientId) {
      info('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to .env file.');
      return;
    }

    if (window.google?.accounts?.id) {
      // Trigger Google Identity prompt/popup
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google Prompt dismissed or skipped');
        }
      });
    } else {
      error('Google Sign-In is initializing. Please try again in a moment.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCustomButtonClick}
      disabled={loading}
      className={`w-full py-2.5 px-4 rounded-xl bg-[#111113] hover:bg-[#18181B] border border-[#27272A] hover:border-zinc-600 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        /* Official Google 'G' Logo SVG */
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{loading ? 'Authenticating with Google...' : text}</span>
    </button>
  );
};
