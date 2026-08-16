import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  Trophy,
  Flame,
  HelpCircle,
  FolderGit2,
  Compass,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Tag
} from 'lucide-react';
import { CreatePost } from '../components/community/CreatePost';
import { PostFeed } from '../components/community/PostFeed';
import { TeamRequestsSection } from '../components/community/TeamRequestsSection';
import { Button } from '../components/common/Button';

export const CommunityPage = () => {
  const [newlyCreatedPost, setNewlyCreatedPost] = useState(null);

  const handlePostCreated = (post) => {
    setNewlyCreatedPost(post);
  };

  const trendingTags = [
    { name: 'hackathon2026', count: '48 posts' },
    { name: 'aiml', count: '32 posts' },
    { name: 'lookingforteammates', count: '29 posts' },
    { name: 'fullstack', count: '21 posts' },
    { name: 'uiux', count: '18 posts' },
    { name: 'smartindia', count: '15 posts' },
    { name: 'reactjs', count: '14 posts' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>TeamForge Community Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Community
          </h1>
          <p className="text-sm text-brand-100 mt-1 max-w-xl">
            Share ideas. Find teammates. Build together. Connect with passionate student creators across universities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link to="/projects/create">
            <Button
              variant="secondary"
              size="md"
              icon={PlusCircle}
              className="bg-white text-brand-700 hover:bg-slate-50 border-transparent shadow-md font-bold"
            >
              Post Project
            </Button>
          </Link>
          <Link to="/projects">
            <Button
              variant="outline"
              size="md"
              icon={Compass}
              className="text-white border-white/40 hover:bg-white/10"
            >
              Explore Teams
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed Column (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Component */}
          <CreatePost onPostCreated={handlePostCreated} />

          {/* Post Feed Component */}
          <PostFeed
            newPost={newlyCreatedPost}
            onResetNewPost={() => setNewlyCreatedPost(null)}
          />
        </div>

        {/* Sidebar Information Column */}
        <div className="space-y-6">
          {/* Team Recruitment Requests Panel */}
          <TeamRequestsSection isCompact={true} />

          {/* Trending Topics Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Trending Discussions</h3>
                <p className="text-[11px] text-slate-400">Popular topics in the student hub</p>
              </div>
            </div>

            <div className="space-y-2">
              {trendingTags.map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold"
                >
                  <span className="text-brand-700 hover:underline">#{tag.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{tag.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Guidelines / Collaboration Tips */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 rounded-3xl border border-indigo-200/80 p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Collaboration Etiquette</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span><strong>Be Specific:</strong> State required tech stack and weekly time commitments clearly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span><strong>Include Demo Links:</strong> Share GitHub repos or live prototypes for faster feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span><strong>Prompt Replies:</strong> Respond to team requests within 24 hours to secure teammates.</span>
              </li>
            </ul>
          </div>

          {/* Quick Explore Projects CTA */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Need a Ready-to-Join Team?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Browse actively recruiting projects with AI skill matching.
            </p>
            <Link to="/projects">
              <Button variant="primary" size="sm" icon={ArrowRight} className="w-full justify-center text-xs">
                Browse Active Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
