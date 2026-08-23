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
  const [sortBy, setSortBy] = useState('deadline');

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHackathons();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Header with Atmospheric Dark-Red Glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111111] via-[#1a0a0d] to-[#250d12] border border-[#242424] p-6 sm:p-10 shadow-soft">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-[#242424] text-[#F5F5F5] text-xs font-mono uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[#F2B705]" />
            <span>HACKATHON DISCOVERY HUB</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Find High-Impact Hackathons & Build Your Winning Squad
          </h1>

          <p className="text-xs sm:text-sm text-[#888888] leading-relaxed max-w-2xl">
            Explore curated global and collegiate hackathons matched directly to your TeamForge skill profile. Form teams, cover skill gaps, and compete for massive prize pools.
          </p>

          {/* Quick Stats Bar */}
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono text-[#888888]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] border border-[#242424]">
              <Award className="w-4 h-4 text-[#F2B705]" />
              <span className="text-white font-bold">$150,000+</span> in Active Prizes
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] border border-[#242424]">
              <Globe className="w-4 h-4 text-[#2AA8FF]" />
              <span className="text-white font-bold">{hackathons.length}</span> Active Hackathons
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] border border-[#242424]">
              <Sparkles className="w-4 h-4 text-[#20D47A]" />
              <span>Skill-Matched Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111111] border border-[#242424] rounded-3xl p-5 sm:p-6 space-y-5 shadow-soft">
        {/* Top Controls: Search + Mode + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, theme, required technology, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-[#242424] focus:border-[#E50914] rounded-full pl-9 pr-4 py-2 text-xs font-mono text-[#F5F5F5] placeholder-[#555555] focus:outline-none transition-colors"
            />
          </div>

          {/* Mode Tabs */}
          <div className="md:col-span-4 flex items-center bg-[#161616] p-1 rounded-full border border-[#242424] overflow-x-auto no-scrollbar">
            {MODES.map((mode) => {
              const isActive = selectedMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`flex-1 min-w-[60px] py-1.5 px-3 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white font-bold shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Difficulty & Sort Dropdowns */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="flex-1 bg-[#161616] border border-[#242424] text-[#F5F5F5] text-xs font-mono rounded-full px-3 py-2 focus:outline-none focus:border-[#E50914]"
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
              className="flex-1 bg-[#161616] border border-[#242424] text-[#F5F5F5] text-xs font-mono rounded-full px-3 py-2 focus:outline-none focus:border-[#E50914]"
            >
              <option value="deadline">⏳ Deadline</option>
              <option value="match">✨ Best Match</option>
            </select>
          </div>
        </div>

        {/* Technology Filter Chips */}
        <div className="space-y-2 pt-2 border-t border-[#1F1F1F]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" /> FILTER BY REQUIRED TECHNOLOGY
            </span>

            {/* Quick Toggle: Bookmarked & Interested */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly(!savedOnly)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                  savedOnly
                    ? 'bg-[#161616] text-white border-[#333333]'
                    : 'bg-[#111111] text-[#888888] border-[#242424] hover:text-white'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${savedOnly ? 'fill-white' : ''}`} />
                <span>Saved Only</span>
              </button>

              <button
                type="button"
                onClick={() => setInterestedOnly(!interestedOnly)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                  interestedOnly
                    ? 'bg-[#E50914]/20 text-[#FF1F2D] border-[#E50914]/50'
                    : 'bg-[#111111] text-[#888888] border-[#242424] hover:text-white'
                }`}
              >
                <Heart className={`w-3 h-3 ${interestedOnly ? 'fill-[#FF1F2D] text-[#FF1F2D]' : ''}`} />
                <span>Interested Only</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {POPULAR_TECHS.map((tech) => {
              const isActive = selectedTech === tech;
              return (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.4)]'
                      : 'bg-[#161616] text-[#A1A1A1] border border-[#242424] hover:border-[#333333] hover:text-white'
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-96 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse"
            />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="bg-[#111111] border border-[#242424] rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-soft">
          <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-[#888888] flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5]">No Hackathons Found</h3>
          <p className="text-xs text-[#888888]">
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
            className="px-5 py-2 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(229,9,20,0.4)]"
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
