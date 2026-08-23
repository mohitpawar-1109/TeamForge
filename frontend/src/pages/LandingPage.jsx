import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Brain,
  ShieldCheck,
  Zap,
  Code,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { TeamForge3DHero } from '../components/landing/TeamForge3DHero';

export const LandingPage = () => {
  return (
    <div className="overflow-hidden bg-black text-[#F5F5F5] font-sans">
      {/* THREE.JS 3D HERO SECTION */}
      <TeamForge3DHero />

      {/* ABSTRACT TEAM-MATCHING PROCESS & STATS */}
      <section className="relative -mt-12 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative max-w-4xl mx-auto bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 text-center">
            {/* Step 1: Student */}
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424]">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#111111] text-[#E50914] flex items-center justify-center mb-2 font-bold border border-[#242424]">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono font-bold text-[#F5F5F5]">Student Profile</div>
              <p className="text-[10px] font-mono text-[#888888] mt-0.5">Skills & availability</p>
            </div>

            <div className="text-[#666666] font-mono font-bold text-lg hidden md:block">+</div>

            {/* Step 2: Project Idea */}
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424]">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#111111] text-[#2AA8FF] flex items-center justify-center mb-2 font-bold border border-[#242424]">
                <Code className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono font-bold text-[#F5F5F5]">Project Scope</div>
              <p className="text-[10px] font-mono text-[#888888] mt-0.5">AI analyzed stack</p>
            </div>

            <div className="text-[#666666] font-mono font-bold text-lg hidden md:block">→</div>

            {/* Step 3: Perfect Team Formed */}
            <div className="p-4 rounded-2xl bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/20 text-white flex items-center justify-center mb-2 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono font-bold text-white">Matched Team</div>
              <p className="text-[10px] font-mono text-white/80 mt-0.5">100% Skill Coverage</p>
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12 text-center">
          <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft">
            <div className="text-3xl font-bold text-[#F5F5F5]">1,200+</div>
            <div className="text-xs font-mono text-[#888888] mt-1 uppercase">Active Students</div>
          </div>
          <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft">
            <div className="text-3xl font-bold text-[#E50914]">300+</div>
            <div className="text-xs font-mono text-[#888888] mt-1 uppercase">Hackathon Projects</div>
          </div>
          <div className="p-6 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft">
            <div className="text-3xl font-bold text-[#20D47A]">180+</div>
            <div className="text-xs font-mono text-[#888888] mt-1 uppercase">Teams Formed</div>
          </div>
        </div>
      </section>

      {/* 6 KEY FEATURES SECTION */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E50914] mb-2">// CAPABILITIES</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
            Engineered for seamless collaboration
          </h3>
          <p className="text-xs sm:text-sm font-mono text-[#888888] mt-3">
            Everything student builders and hackathon organizers need to assemble winning teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, color: 'text-[#E50914]', title: '1. Smart Team Matching', desc: 'Multi-factor weighted algorithm comparing technical skills, domain interests, schedule overlaps, and project experience.' },
            { icon: Brain, color: 'text-[#2AA8FF]', title: '2. AI Project Analysis', desc: 'Extracts required technical stacks, difficulty levels, suggested team roles, and architectural challenges from plain text descriptions.' },
            { icon: Target, color: 'text-[#20D47A]', title: '3. Skill Gap Detection', desc: 'Real-time visual comparison of your current roster skills against project benchmarks, highlighting precisely who you still need to recruit.' },
            { icon: BarChart3, color: 'text-[#F2B705]', title: '4. Compatibility Scores', desc: 'Clear 0-100% compatibility scores with explicit "Why this match?" justifications so team leads can make informed decisions.' },
            { icon: Zap, color: 'text-[#E50914]', title: '5. Team Collaboration', desc: 'Integrated Kanban workspace with TODO, IN PROGRESS, and DONE columns to track project execution and sprint velocity.' },
            { icon: ShieldCheck, color: 'text-[#20D47A]', title: '6. Verified Student Profiles', desc: 'Portfolio profiles showcasing verified skills, weekly availability hours, completed projects, and GitHub/portfolio credentials.' }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-6 rounded-3xl bg-[#111111] border border-[#242424] hover:border-[#333333] transition-all">
                <div className={`w-10 h-10 rounded-full bg-[#161616] ${feat.color} flex items-center justify-center mb-4 border border-[#242424]`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F5F5F5] mb-2">{feat.title}</h4>
                <p className="text-xs font-mono text-[#888888] leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#1F1F1F]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E50914] mb-2">// WORKFLOW</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
            How TeamForge Works
          </h3>
          <p className="text-xs sm:text-sm font-mono text-[#888888] mt-3">
            From idea to fully recruited team in under 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Create Profile', desc: 'Add skills, university, interests & availability schedule' },
            { step: '02', title: 'Create Project', desc: 'Outline project scope, category, duration & team size' },
            { step: '03', title: 'AI Analysis', desc: 'AI scans project scope and extracts necessary tech requirements' },
            { step: '04', title: 'Find Teammates', desc: 'Review ranked compatible students with transparent match breakdowns' },
            { step: '05', title: 'Build Your Team', desc: 'Send invites, collaborate on Kanban tasks, and ship your project' }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-[#111111] border border-[#242424] shadow-soft text-left relative">
              <span className="text-xl font-mono font-bold text-[#E50914] mb-2 block">{item.step}</span>
              <h4 className="text-sm font-bold text-[#F5F5F5] mb-1">{item.title}</h4>
              <p className="text-xs font-mono text-[#888888] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#111111] border border-[#242424] p-8 sm:p-14 text-center text-[#F5F5F5] relative overflow-hidden shadow-soft">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-[#F5F5F5]">
              Ready to build something great?
            </h3>
            <p className="text-[#888888] font-mono text-xs sm:text-sm mb-8">
              Join hundreds of students finding teammates and building hackathon-winning projects right now.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start Building Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
