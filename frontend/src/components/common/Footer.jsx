import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-[#242424] bg-black text-[#F5F5F5] font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#E50914]" />
              <span className="text-sm font-bold tracking-widest text-[#F5F5F5]">TEAM (FORGE)</span>
            </div>
            <p className="text-xs font-mono text-[#888888] max-w-sm leading-relaxed">
              Forge the right team. Build the right project. AI-driven student team formation and collaborative workspace.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-3">// PLATFORM</h4>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li><Link to="/projects" className="hover:text-white transition-colors">Explore Projects</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Candidate Matching</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-3">// HACKATHON_DEMO</h4>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li><span>Demo User: demo@teamforge.app</span></li>
              <li><span>Password: Demo@123</span></li>
              <li><span className="text-[#20D47A] font-medium">● System Operational</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1F1F1F] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#666666]">
          <p>© {new Date().getFullYear()} TeamForge. Crafted for ambitious builders.</p>
          <div className="flex items-center gap-4">
            <span>React 18 • Node.js • Gemini AI • WebRTC</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
