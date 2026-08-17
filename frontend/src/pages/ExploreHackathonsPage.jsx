import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  Filter,
  Flame,
  Globe,
  MapPin,
  Sparkles,
  Bookmark,
  Heart,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  Award
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HackathonCard } from '../components/hackathons/HackathonCard';

const POPULAR_TECHS = [
  'All',
  'React',
  'Python',
  'Machine Learning',
  'Node.js',
  'FastAPI',
  'TypeScript',
  'UI/UX',
  'PostgreSQL',
  'Docker'
];

const MODES = ['All', 'Online', 'Offline', 'Hybrid'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export const ExploreHackathonsPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [interestedOnly, setInterestedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('deadline'); // 'deadline' | 'match' | 'prize'

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedMode !== 'All') params.mode = selectedMode;
      if (selectedTech !== 'All') params.technology = selectedTech;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
      if (savedOnly) params.savedOnly = true;
      if (interestedOnly) params.interestedOnly = true;

      const res = await hackathonAPI.getHackathons(params);
      if (res.data?.success) {
        let list = res.data.data || [];

        // Sorting
        if (sortBy === 'match') {
          list.sort((a, b) => (b.skillMatch?.matchPercentage || 0) - (a.skillMatch?.matchPercentage || 0));
        } else if (sortBy === 'deadline') {
          list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        }

        setHackathons(list);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
      error('Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, [selectedMode, selectedTech, selectedDifficulty, savedOnly, interestedOnly, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHackathons();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toggle Save
  const handleToggleSave = async (id) => {
    try {
      const res = await hackathonAPI.toggleSave(id);
      if (res.data?.success) {
        setHackathons((prev) =>
          prev.map((h) =>
            h._id === id
              ? { ...h, isSaved: res.data.saved, savedCount: res.data.savedCount }
              : h
          )
        );
        success(res.data.message);
      }
    } catch (err) {
      error('Failed to update bookmark.');
    }
  };

  // Toggle Interest
  const handleToggleInterest = async (id) => {
    try {
      const res = await hackathonAPI.toggleInterest(id);
      if (res.data?.success) {
        setHackathons((prev) =>
          prev.map((h) =>
            h._id === id
              ? { ...h, isInterested: res.data.interested, interestedCount: res.data.interestedCount }
              : h
          )
        );
        success(res.data.message);
      }
    } catch (err) {
      error('Failed to update interest.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-[#18181B] to-purple-950/60 border border-[#27272A] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Hackathon Discovery Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#FAFAFA] tracking-tight">
            Find High-Impact Hackathons & Build Your Winning Squad
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Explore curated global and collegiate hackathons matched directly to your TeamForge skill profile. Form teams, cover skill gaps, and compete for massive prize pools.
          </p>

          {/* Quick Stats Bar */}
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-zinc-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-[#27272A]">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-200 font-bold">$150,000+</span> in Active Prizes
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-[#27272A]">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-zinc-200 font-bold">{hackathons.length}</span> Active Hackathons
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-[#27272A]">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Skill-Matched Recommendations</span>
            </div>
          </div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-5 sm:p-6 space-y-5 shadow-soft">
        {/* Top Controls: Search + Mode + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, theme, required technology, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111113] border border-[#27272A] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#FAFAFA] placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 transition-colors shadow-inner"
            />
          </div>

          {/* Mode Tabs */}
          <div className="md:col-span-4 flex items-center bg-[#111113] p-1 rounded-2xl border border-[#27272A] overflow-x-auto no-scrollbar">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`flex-1 min-w-[64px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMode === mode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Difficulty & Sort Dropdowns */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="flex-1 bg-[#111113] border border-[#27272A] text-zinc-300 text-xs font-semibold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-indigo-500/80"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 bg-[#111113] border border-[#27272A] text-zinc-300 text-xs font-semibold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-indigo-500/80"
            >
              <option value="deadline">⏳ Deadline</option>
              <option value="match">✨ Best Match</option>
            </select>
          </div>
        </div>

        {/* Technology Filter Chips */}
        <div className="space-y-2 pt-2 border-t border-[#27272A]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" /> Filter by Required Technology
            </span>

            {/* Quick Toggle: Bookmarked & Interested */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly(!savedOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  savedOnly
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50'
                    : 'bg-[#111113] text-zinc-400 border-[#27272A] hover:text-zinc-200'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${savedOnly ? 'fill-indigo-400' : ''}`} />
                <span>Saved Only</span>
              </button>

              <button
                type="button"
                onClick={() => setInterestedOnly(!interestedOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  interestedOnly
                    ? 'bg-pink-950/80 text-pink-300 border-pink-500/50'
                    : 'bg-[#111113] text-zinc-400 border-[#27272A] hover:text-zinc-200'
                }`}
              >
                <Heart className={`w-3 h-3 ${interestedOnly ? 'fill-pink-400' : ''}`} />
                <span>Interested Only</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {POPULAR_TECHS.map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedTech === tech
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-[#111113] text-zinc-400 border-[#27272A] hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-96 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse"
            />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-[#FAFAFA]">No Hackathons Found</h3>
          <p className="text-xs text-zinc-400">
            Try adjusting your search query, technology filters, or mode settings.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedMode('All');
              setSelectedTech('All');
              setSelectedDifficulty('All');
              setSavedOnly(false);
              setInterestedOnly(false);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => (
            <HackathonCard
              key={h._id}
              hackathon={h}
              onToggleSave={handleToggleSave}
              onToggleInterest={handleToggleInterest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
