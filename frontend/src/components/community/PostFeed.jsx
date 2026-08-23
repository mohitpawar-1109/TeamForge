import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Users,
  Trophy,
  FolderGit2,
  HelpCircle,
  Award
} from 'lucide-react';
import { postAPI } from '../../services/api';
import { PostCard } from './PostCard';

const FEED_FILTERS = [
  { id: 'ALL', label: 'All Feed', icon: Sparkles },
  { id: 'LOOKING_FOR_TEAMMATES', label: 'Teammates Wanted', icon: Users },
  { id: 'PROJECT', label: 'Projects', icon: FolderGit2 },
  { id: 'HACKATHON', label: 'Hackathons', icon: Trophy },
  { id: 'QUESTION', label: 'Questions', icon: HelpCircle },
  { id: 'ACHIEVEMENT', label: 'Achievements', icon: Award }
];

export const PostFeed = ({ newPost, onResetNewPost }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (activeFilter !== 'ALL') {
        params.type = activeFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await postAPI.getPosts(params);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError('Could not load community feed. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeFilter]);

  useEffect(() => {
    if (newPost) {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      if (onResetNewPost) onResetNewPost();
    }
  }, [newPost]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handlePostDeleted = (deletedId) => {
    setPosts(prev => prev.filter(p => p._id !== deletedId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header Bar */}
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-4 sm:p-5 shadow-soft space-y-3.5">
        {/* Search Input and Refresh */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts by topic, tags, tech (#ai, #react)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:bg-[#161616] focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555]"
            />
          </form>

          <button
            type="button"
            onClick={fetchPosts}
            title="Refresh Feed"
            className="p-2 rounded-full border border-[#242424] bg-[#161616] text-[#A1A1A1] hover:text-white hover:border-[#333333] transition-colors flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50914]' : ''}`} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914] text-white border-[#E50914] font-bold shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                    : 'bg-[#161616] text-[#888888] border-[#242424] hover:border-[#333333] hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#888888]'}`} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed List or States */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111111] rounded-3xl border border-[#242424] p-6 space-y-4 shadow-soft animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#161616]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[#161616] rounded w-1/4" />
                  <div className="h-3 bg-[#161616]/60 rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-[#161616] rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#161616]/60 rounded w-full" />
                <div className="h-4 bg-[#161616]/60 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#111111] rounded-3xl border border-[#E50914]/40 p-8 text-center shadow-soft">
          <AlertCircle className="w-10 h-10 text-[#E50914] mx-auto mb-3" />
          <h3 className="font-bold text-[#F5F5F5] text-base">Unable to Load Feed</h3>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 text-xs font-mono font-bold text-white bg-[#E50914] rounded-full hover:bg-[#FF1F2D] transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-12 text-center shadow-soft">
          <div className="w-14 h-14 rounded-full bg-[#161616] text-[#888888] flex items-center justify-center mx-auto mb-4 border border-[#242424]">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#F5F5F5] text-base">No community posts found</h3>
          <p className="text-xs font-mono text-[#888888] mt-1 max-w-sm mx-auto">
            {activeFilter !== 'ALL' || searchQuery
              ? 'No posts matching the selected criteria. Try resetting filters.'
              : 'Be the first student builder to share an idea or request teammates!'}
          </p>
          {(activeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-mono font-bold text-white bg-[#161616] border border-[#242424] rounded-full hover:bg-[#222222] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};
