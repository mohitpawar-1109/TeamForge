import React from 'react';
import { SkillNetwork3D } from '../components/network/SkillNetwork3D';
import { Sparkles, Users, Network, Compass, ShieldCheck } from 'lucide-react';

export const SkillNetworkPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Network className="w-3.5 h-3.5 text-brand-600" />
            <span>Interactive Teammate & Skill Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Skill & Collaborator Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explore active students, developer skillsets, and hackathon domains visualized as a live 3D network.
          </p>
        </div>
      </div>

      {/* Main 3D Graph Component */}
      <SkillNetwork3D />
    </div>
  );
};
