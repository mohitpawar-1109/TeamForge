import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Brain,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Code,
  Target,
  BarChart3,
  Layers,
  Search
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TeamForge3DHero } from '../components/landing/TeamForge3DHero';

export const LandingPage = () => {
  return (
    <div className="overflow-hidden">
      {/* THREE.JS 3D HERO SECTION */}
      <TeamForge3DHero />

      {/* ABSTRACT TEAM-MATCHING PROCESS & STATS */}
      <section className="relative -mt-12 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 text-center">
            {/* Step 1: Student */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 mx-auto rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-2 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-slate-900">Student Profile</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Skills, availability & past work</p>
            </div>

            {/* Plus Icon */}
            <div className="text-slate-400 font-bold text-xl hidden md:block">+</div>

            {/* Step 2: Project Idea */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 font-bold">
                <Code className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-slate-900">Project Idea</div>
              <p className="text-[11px] text-slate-500 mt-0.5">AI analyzed requirements</p>
            </div>

            {/* Arrow */}
            <div className="text-slate-400 font-bold text-xl hidden md:block">→</div>

            {/* Step 3: Perfect Team Formed */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-600 text-white shadow-md shadow-brand-500/20">
              <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 text-white flex items-center justify-center mb-2 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">Perfect Team</div>
              <p className="text-[11px] text-brand-100 mt-0.5">100% Skill Coverage</p>
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 text-center">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">1,200+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Active Students</div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-600">300+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Hackathon Projects</div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">180+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">Teams Formed</div>
          </div>
        </div>
      </section>

      {/* 6 KEY FEATURES SECTION */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for seamless collaboration
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              Everything student builders and hackathon organizers need to assemble winning teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">1. Smart Team Matching</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-factor weighted algorithm comparing technical skills, domain interests, schedule overlaps, and project experience.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">2. AI Project Analysis</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extracts required technical stacks, difficulty levels, suggested team roles, and architectural challenges from plain text descriptions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">3. Skill Gap Detection</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time visual comparison of your current roster skills against project benchmarks, highlighting precisely who you still need to recruit.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">4. Compatibility Scores</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clear 0-100% compatibility scores with explicit "Why this match?" justifications so team leads can make informed decisions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">5. Team Collaboration</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Integrated Kanban workspace with TODO, IN PROGRESS, and DONE columns to track project execution and sprint velocity.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">6. Verified Student Profiles</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Portfolio profiles showcasing verified skills, weekly availability hours, completed projects, and GitHub/portfolio credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Workflow</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How TeamForge Works
          </h3>
          <p className="text-sm text-slate-600 mt-3">
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
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft text-left relative">
              <span className="text-2xl font-black text-brand-600/30 mb-2 block">{item.step}</span>
              <h4 className="text-base font-bold text-slate-900 mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-violet-800 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready to build something great?
            </h3>
            <p className="text-brand-100 text-sm sm:text-base mb-8">
              Join hundreds of students finding teammates and building hackathon-winning projects right now.
            </p>
            <Link to="/register">
              <Button variant="secondary" size="lg" className="bg-white text-brand-700 hover:bg-slate-50 border-transparent shadow-lg">
                Start Building Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
