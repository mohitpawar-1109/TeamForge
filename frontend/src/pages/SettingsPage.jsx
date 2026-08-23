import React from 'react';
import { Settings, Shield, User, Database, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const SettingsPage = () => {
  const { user, quickSwitchDemoUser } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Platform Settings</h1>
        <p className="text-xs sm:text-sm font-mono text-[#888888] mt-1">
          Review environment parameters, demo account access, and authentication sessions.
        </p>
      </div>

      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft space-y-6">
        <div className="pb-4 border-b border-[#1F1F1F]">
          <h3 className="text-xs font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#E50914]" />
            <span>Active Student Account</span>
          </h3>
          <p className="text-xs font-mono text-[#888888] mt-1">
            Logged in as <span className="font-semibold text-[#F5F5F5]">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Demo Switcher */}
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Instant Demo Switcher</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Mohit', email: 'mohit@teamforge.app', role: 'Full Stack Developer' },
              { name: 'Aarav', email: 'aarav@teamforge.app', role: 'ML / NLP Engineer' },
              { name: 'Priya', email: 'priya@teamforge.app', role: 'UI/UX Designer' },
              { name: 'Demo Lead', email: 'demo@teamforge.app', role: 'Platform Demo Account' }
            ].map((acc) => (
              <button
                key={acc.email}
                onClick={() => quickSwitchDemoUser(acc.email)}
                className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424] text-left hover:border-[#333333] hover:bg-[#202020] transition-all text-xs font-mono cursor-pointer"
              >
                <div className="font-bold text-[#F5F5F5]">{acc.name}</div>
                <div className="text-[#888888] text-[11px]">{acc.email}</div>
                <div className="text-[10px] text-[#E50914] font-semibold mt-1">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack Details */}
        <div className="pt-4 border-t border-[#1F1F1F] text-xs font-mono text-[#888888] space-y-1.5">
          <div className="font-bold text-[#F5F5F5]">ENGINE SPECIFICATIONS:</div>
          <div>• Frontend: React 18 + Vite + Tailwind CSS + Nothing OS Tokens</div>
          <div>• Backend: Node.js + Express.js + Mongoose (MongoDB)</div>
          <div>• AI Engine: Google Gemini API + Deterministic Fallback</div>
          <div>• Realtime: WebRTC Mesh Video Calling + Socket.io Messaging</div>
        </div>
      </div>
    </div>
  );
};
