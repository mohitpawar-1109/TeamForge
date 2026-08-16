import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Github, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-[#27272A] bg-[#09090B] text-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-[#FAFAFA]">TEAMFORGE</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm">
              Forge the right team. Build the right project. AI-driven student team formation and collaborative workspace.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/projects" className="hover:text-indigo-400 transition-colors">Explore Projects</Link></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Candidate Matching</Link></li>
              <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">Hackathon</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><span className="text-zinc-500">Demo User: demo@teamforge.app</span></li>
              <li><span className="text-zinc-500">Password: Demo@123</span></li>
              <li><span className="text-emerald-400 font-medium">● 100% Full-Stack Ready</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TeamForge. Crafted for ambitious builders.</p>
          <div className="flex items-center gap-4">
            <span>Built with React, Node.js & Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
