import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
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
  { id: 'ACHIEVEMENT', label: 'Achievements', icon: Award },
  { id: 'TEXT', label: 'Discussions', icon: MessageSquare }
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

  // Handle live prepending of newly created post
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
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-soft space-y-3.5">
        {/* Search Input and Refresh */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts by topic, tags, tech (#ai, #react)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </form>

          <button
            type="button"
            onClick={fetchPosts}
            title="Refresh Feed"
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FEED_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
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
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-soft animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
              </div>
              <div className="h-8 bg-slate-50 rounded-xl w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-soft">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Unable to Load Feed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No community posts found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
              className="mt-4 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
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
