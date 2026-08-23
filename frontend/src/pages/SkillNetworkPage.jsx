import React from 'react';
import { SkillNetwork3D } from '../components/network/SkillNetwork3D';
import { Sparkles, Users, Network, Compass, ShieldCheck } from 'lucide-react';

export const SkillNetworkPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#703344] border border-[#A84A4D]/40 text-[#F6E8E2] text-xs font-bold uppercase tracking-wider mb-2">
            <Network className="w-3.5 h-3.5 text-[#CB6B5A]" />
            <span>Interactive Teammate & Skill Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F6E8E2] tracking-tight">
            Skill & Collaborator Network
          </h1>
          <p className="text-xs sm:text-sm text-[#DDA081] mt-1 max-w-2xl">
            Explore active students, developer skillsets, and hackathon domains visualized as a live 3D network.
          </p>
        </div>
      </div>

      {/* Main 3D Graph Component */}
      <SkillNetwork3D />
    </div>
  );
};
