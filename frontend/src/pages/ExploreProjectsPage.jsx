import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Sparkles, SlidersHorizontal, Network } from 'lucide-react';
import { projectAPI } from '../services/api';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const ExploreProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('best_match');

  const categories = ['All', 'AI / Machine Learning', 'Web Development', 'Mobile Development', 'FinTech', 'HealthTech', 'IoT / Sustainability', 'Blockchain / Web3', 'AR / VR'];
  const difficulties = ['All', 'Beginner', 'Medium', 'Advanced', 'Hard'];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortBy
      };
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await projectAPI.getProjects(params);
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error exploring projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, selectedDifficulty, selectedStatus, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">Explore Projects</h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1">
            Discover active projects, hackathon ideas, and teams recruiting for specific skill sets.
          </p>
        </div>

        <Link to="/network">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#161616] hover:bg-[#222222] border border-[#242424] text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-[#20D47A]" />
            <span>3D Skill Network</span>
          </button>
        </Link>
      </div>

      {/* Search & Main Filter Controls */}
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-4 sm:p-5 shadow-soft space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project title, keyword, or skill (e.g. React, Python, NLP)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#555555]"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1F1F1F]">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap border cursor-pointer ${
                    isActive
                      ? 'bg-[#E50914] text-white border-[#E50914] font-bold shadow-[0_0_10px_rgba(229,9,20,0.4)]'
                      : 'bg-[#161616] border-[#242424] text-[#888888] hover:border-[#333333] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort & Difficulty select */}
          <div className="flex items-center gap-2 self-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#E50914]"
            >
              <option value="best_match">Sort: Best Match</option>
              <option value="most_active">Sort: Most Active</option>
              <option value="almost_full">Sort: Almost Full</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs font-mono bg-[#161616] border border-[#242424] text-[#F5F5F5] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#E50914]"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Medium">Medium</option>
              <option value="Advanced">Advanced</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No projects found matching your criteria"
          description="Try adjusting your keywords, switching categories, or resetting filters to discover more teams."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('All');
            setSelectedDifficulty('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
