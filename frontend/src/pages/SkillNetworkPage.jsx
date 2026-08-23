import React from 'react';
import { SkillNetwork3D } from '../components/network/SkillNetwork3D';
import { Sparkles, Users, Network, Compass, ShieldCheck } from 'lucide-react';

export const SkillNetworkPage = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[#A1A1A1] text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
            <Network className="w-3 h-3 text-[#20D47A]" />
            <span>Interactive Teammate & Skill Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
            Skill & Collaborator Network
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 max-w-2xl">
            Explore active students, developer skillsets, and hackathon domains visualized as a live 3D network.
          </p>
        </div>
      </div>

      {/* Main 3D Graph Component */}
      <SkillNetwork3D />
    </div>
  );
};
