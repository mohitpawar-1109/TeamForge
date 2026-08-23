import React from 'react';
import { Settings, Shield, User, Database, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const SettingsPage = () => {
  const { user, quickSwitchDemoUser } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2] tracking-tight">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-[#DDA081] mt-1">
          Review environment parameters, demo account access, and authentication sessions.
        </p>
      </div>

      <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 sm:p-8 shadow-soft space-y-6">
        <div className="pb-4 border-b border-[#703344]">
          <h3 className="text-base font-bold text-[#F6E8E2] flex items-center gap-2">
            <User className="w-4 h-4 text-[#CB6B5A]" />
            <span>Active Student Account</span>
          </h3>
          <p className="text-xs text-[#DDA081] mt-1">
            Logged in as <span className="font-semibold text-[#F6E8E2]">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Demo Switcher for Judges */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#DDA081] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#CB6B5A]" />
            <span>Hackathon Instant Switcher</span>
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
                className="p-3 rounded-2xl bg-[#281A21] border border-[#703344] text-left hover:border-[#CB6B5A]/50 hover:bg-[#703344]/40 transition-all text-xs cursor-pointer"
              >
                <div className="font-bold text-[#F6E8E2]">{acc.name}</div>
                <div className="text-[#DDA081]">{acc.email}</div>
                <div className="text-[10px] text-[#CB6B5A] font-semibold mt-1">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack Details */}
        <div className="pt-4 border-t border-[#703344] text-xs text-[#DDA081] space-y-1">
          <div className="font-bold text-[#F6E8E2]">TeamForge Engine Info:</div>
          <div>• Frontend: React 18 + Vite + Tailwind CSS + Lucide Icons</div>
          <div>• Backend: Node.js + Express.js + Mongoose (MongoDB)</div>
          <div>• AI Engine: Isolated Google Gemini API + Deterministic Fallback</div>
          <div>• Matching Algorithm: Weighted Multi-factor Scoring (Skills 50%, Interests 20%, Availability 20%, Experience 10%)</div>
        </div>
      </div>
    </div>
  );
};
