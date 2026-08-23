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
    { name: 'uiux', count: '18 posts' },
    { name: 'smartindia', count: '15 posts' },
    { name: 'reactjs', count: '14 posts' },
    { name: 'aiml', count: '32 posts' },
    { name: 'lookingforteammates', count: '29 posts' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
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
          {/* Trending Topics Card */}
          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1F1F]">
              <div className="w-8 h-8 rounded-full bg-[#161616] text-[#E50914] border border-[#242424] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#E50914]" />
              </div>
              <div>
                <h3 className="font-bold text-[#F5F5F5] text-xs font-mono tracking-wider uppercase">Trending Discussions</h3>
                <p className="text-[11px] font-mono text-[#666666]">Popular topics in student hub</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {trendingTags.map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#161616] transition-colors text-xs font-mono"
                >
                  <span className="text-[#F5F5F5] hover:text-[#E50914] cursor-pointer">#{tag.name}</span>
                  <span className="text-[10px] text-[#666666]">{tag.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Guidelines / Collaboration Tips */}
          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#20D47A]" />
              <h3 className="font-bold text-[#F5F5F5] text-xs font-mono uppercase tracking-wider">Collaboration Etiquette</h3>
            </div>
            <ul className="space-y-2 text-xs text-[#888888] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#E50914] font-bold">•</span>
                <span><strong className="text-[#F5F5F5]">Be Specific:</strong> State required tech stack and weekly time commitments clearly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E50914] font-bold">•</span>
                <span><strong className="text-[#F5F5F5]">Include Demo Links:</strong> Share GitHub repos or live prototypes for faster feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E50914] font-bold">•</span>
                <span><strong className="text-[#F5F5F5]">Prompt Replies:</strong> Respond to team requests within 24 hours to secure teammates.</span>
              </li>
            </ul>
          </div>

          {/* Quick Explore Projects CTA */}
          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-5 sm:p-6 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424] flex items-center justify-center mx-auto">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] text-sm">Need a Ready-to-Join Team?</h4>
              <p className="text-xs text-[#888888] mt-1">
                Browse actively recruiting projects with AI skill matching.
              </p>
            </div>
            <Link to="/projects" className="block pt-2">
              <button
                type="button"
                className="w-full bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Browse Active Projects</span>
              </button>
            </Link>
          </div>

          {/* Team Recruitment Requests Panel */}
          <TeamRequestsSection isCompact={true} />
        </div>
      </div>
    </div>
  );
};
