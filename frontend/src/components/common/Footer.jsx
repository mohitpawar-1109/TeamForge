import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[#703344]/50 bg-[#281A21] text-[#F6E8E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#A84A4D] flex items-center justify-center text-[#F6E8E2]">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-[#F6E8E2]">TEAMFORGE</span>
            </div>
            <p className="text-sm text-[#DDA081] max-w-sm">
              Forge the right team. Build the right project. AI-driven student team formation and collaborative workspace.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F6E8E2] mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-[#DDA081]">
              <li><Link to="/projects" className="hover:text-[#CB6B5A] transition-colors">Explore Projects</Link></li>
              <li><Link to="/login" className="hover:text-[#CB6B5A] transition-colors">Candidate Matching</Link></li>
              <li><Link to="/register" className="hover:text-[#CB6B5A] transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F6E8E2] mb-3">Hackathon</h4>
            <ul className="space-y-2 text-sm text-[#DDA081]">
              <li><span className="text-[#B8826D]">Demo User: demo@teamforge.app</span></li>
              <li><span className="text-[#B8826D]">Password: Demo@123</span></li>
              <li><span className="text-[#86B190] font-medium">● 100% Full-Stack Ready</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#703344]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B8826D]">
          <p>© {new Date().getFullYear()} TeamForge. Crafted for ambitious builders.</p>
          <div className="flex items-center gap-4">
            <span>Built with React, Node.js & Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
