import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  FolderGit2,
  Compass,
  ArrowRight,
  ShieldCheck,
  PlusCircle
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
      <div className="bg-gradient-to-r from-[#4A2A35] via-[#703344] to-[#A84A4D] rounded-3xl p-6 sm:p-8 text-[#F6E8E2] shadow-soft relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-[#703344]">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#CB6B5A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#281A21]/60 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3 text-[#DDA081] border border-[#703344]">
            <Sparkles className="w-3.5 h-3.5 text-[#CB6B5A]" />
            <span>TeamForge Community Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F6E8E2]">
            Community
          </h1>
          <p className="text-sm text-[#F6E8E2]/85 mt-1 max-w-xl">
            Share ideas. Find teammates. Build together. Connect with passionate student creators across universities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link to="/projects/create">
            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
            >
              Post Project
            </Button>
          </Link>
          <Link to="/projects">
            <Button
              variant="outline"
              size="md"
              icon={Compass}
              className="text-[#F6E8E2] border-[#F6E8E2]/30 hover:bg-[#703344]/40"
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
          <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#703344]">
              <div className="w-8 h-8 rounded-xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#F6E8E2] text-sm">Trending Discussions</h3>
                <p className="text-[11px] text-[#DDA081]">Popular topics in the student hub</p>
              </div>
            </div>

            <div className="space-y-2">
              {trendingTags.map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#281A21] transition-colors text-xs font-semibold"
                >
                  <span className="text-[#CB6B5A] hover:underline">#{tag.name}</span>
                  <span className="text-[10px] text-[#DDA081] font-medium">{tag.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Guidelines / Collaboration Tips */}
          <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#CB6B5A]" />
              <h3 className="font-bold text-[#F6E8E2] text-sm">Collaboration Etiquette</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#DDA081] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#CB6B5A] font-bold">•</span>
                <span><strong className="text-[#F6E8E2]">Be Specific:</strong> State required tech stack and weekly time commitments clearly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#CB6B5A] font-bold">•</span>
                <span><strong className="text-[#F6E8E2]">Include Demo Links:</strong> Share GitHub repos or live prototypes for faster feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#CB6B5A] font-bold">•</span>
                <span><strong className="text-[#F6E8E2]">Prompt Replies:</strong> Respond to team requests within 24 hours to secure teammates.</span>
              </li>
            </ul>
          </div>

          {/* Quick Explore Projects CTA */}
          <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-5 sm:p-6 shadow-soft text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#703344] text-[#CB6B5A] border border-[#A84A4D]/40 flex items-center justify-center mx-auto mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#F6E8E2] text-sm">Need a Ready-to-Join Team?</h4>
            <p className="text-xs text-[#DDA081] mt-1 mb-4">
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
