import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  ArrowLeft,
  Heart,
  Award,
  Globe,
  Share2,
  UserPlus,
  PlusCircle,
  Code2,
  FileText,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { hackathonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const HackathonDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const res = await hackathonAPI.getHackathonById(id);
      if (res.data?.success) {
        setHackathon(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hackathon:', err);
      error('Failed to load hackathon details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchHackathon();
  }, [id]);

  const handleToggleSave = async () => {
    try {
      const res = await hackathonAPI.toggleSave(id);
      if (res.data?.success) {
        setHackathon((prev) => ({
          ...prev,
          isSaved: res.data.saved,
          savedCount: res.data.savedCount
        }));
        success(res.data.message);
      }
    } catch (err) {
      error('Failed to update bookmark.');
    }
  };

  const handleToggleInterest = async () => {
    try {
      const res = await hackathonAPI.toggleInterest(id);
      if (res.data?.success) {
        setHackathon((prev) => ({
          ...prev,
          isInterested: res.data.interested,
          interestedCount: res.data.interestedCount
        }));
        success(res.data.message);
      }
    } catch (err) {
      error('Failed to update interest.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="h-64 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />
        <div className="h-96 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="text-center py-16">
        <p className="text-[#888888]">Hackathon not found.</p>
        <Link to="/hackathons" className="text-[#E50914] font-bold mt-2 inline-block font-mono">
          Back to Hackathons
        </Link>
      </div>
    );
  }

  const {
    title,
    tagline,
    description,
    bannerImage,
    organizer,
    mode,
    location,
    difficulty,
    teamSize,
    requiredSkills = [],
    themes = [],
    prizePool,
    prizes = [],
    startDate,
    deadline,
    daysLeft,
    websiteUrl,
    rules = [],
    isSaved,
    isInterested,
    interestedCount = 0,
    skillMatch = {},
    recommendedTeammates = []
  } = hackathon;

  const { matchPercentage = 0, matchedSkills = [], missingSkills = [] } = skillMatch;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/hackathons"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-[#888888] hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Hackathons</span>
        </Link>

        <div className="flex items-center gap-2">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-[#E50914] hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#111111] border border-[#242424] shadow-soft">
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#0A0A0A]">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={title}
              className="w-full h-full object-cover opacity-70"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-black via-[#111111] to-[#161616] flex items-center justify-center">
              <Trophy className="w-16 h-16 text-[#333333]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/60" />

          {/* Top Floating Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#20D47A]/10 text-[#20D47A] border border-[#20D47A]/30">
              {mode}
            </span>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#161616] text-[#A1A1A1] border border-[#242424]">
              {difficulty}
            </span>
          </div>

          {/* Save & Interest Floating Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
                isSaved
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#161616]/80 hover:bg-[#161616] text-[#888888] hover:text-white border border-[#242424]'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save Hackathon'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleInterest}
              className={`px-3.5 py-1.5 rounded-full backdrop-blur-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                isInterested
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#161616]/80 hover:bg-[#161616] text-[#888888] hover:text-white border border-[#242424]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isInterested ? 'fill-white' : ''}`} />
              <span>{isInterested ? 'Interested' : "I'm Interested"}</span>
            </button>
          </div>
        </div>

        {/* Header Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1F1F1F]">
            <div>
              <p className="text-[10px] font-mono text-[#E50914] font-bold uppercase tracking-wider mb-1">
                Organized by {organizer?.name || 'TechForge'} • {location}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-[#888888] mt-2 leading-relaxed max-w-3xl">
                {tagline}
              </p>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/projects/create?hackathon=${encodeURIComponent(title)}`}>
                <button
                  type="button"
                  className="px-4 py-2 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(229,9,20,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Project Squad</span>
                </button>
              </Link>

              <Link to={`/groups`}>
                <button
                  type="button"
                  className="px-4 py-2 bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[#F5F5F5] rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join Discussion</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#888888] block mb-1">Total Prize Pool</span>
              <span className="text-sm font-mono font-bold text-[#F2B705] flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {prizePool}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#888888] block mb-1">Deadline</span>
              <span className="text-xs font-mono font-bold text-[#F5F5F5] flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                {daysLeft > 0 ? `${daysLeft} Days Left` : 'Ending Today'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#888888] block mb-1">Team Size</span>
              <span className="text-xs font-mono font-bold text-[#F5F5F5] flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#888888]" />
                {teamSize?.min === teamSize?.max
                  ? `${teamSize.min} members`
                  : `${teamSize?.min || 1} - ${teamSize?.max || 4} members`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#242424]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#888888] block mb-1">Interested Peers</span>
              <span className="text-xs font-mono font-bold text-[#FF1F2D] flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-[#FF1F2D]" /> {interestedCount} Students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Match & Teammate Gap Filler Section */}
      <div className="rounded-3xl bg-[#111111] border border-[#242424] p-6 sm:p-8 space-y-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">
                Skill Compatibility Analysis
              </h3>
              <p className="text-xs font-mono text-[#888888]">
                Connected directly with your verified TeamForge skill credentials
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-[#161616] border border-[#242424] text-[#F5F5F5] text-xs font-mono font-bold flex items-center gap-2">
            <span>You match {matchPercentage}% of the required skills</span>
          </div>
        </div>

        {/* Covered vs Missing Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] space-y-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#20D47A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Covered Skills ({matchedSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-[#20D47A]/10 border border-[#20D47A]/30 text-xs font-mono font-bold text-[#20D47A]"
                  >
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs font-mono text-[#888888]">None of your listed skills directly match this hackathon yet.</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161616] border border-[#242424] space-y-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2B705] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Missing / Desired Skills ({missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.length > 0 ? (
                missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-[#F2B705]/10 border border-[#F2B705]/30 text-xs font-mono font-bold text-[#F2B705]"
                  >
                    + {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs font-mono text-[#20D47A] font-bold">You cover 100% of this hackathon's required tech!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Teammates */}
        {missingSkills.length > 0 && recommendedTeammates.length > 0 && (
          <div className="pt-4 border-t border-[#1F1F1F] space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E50914]" /> Recommended Peers to Fill Your Missing Skills:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedTeammates.map((cand) => (
                <div
                  key={cand._id}
                  className="p-3 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#242424] text-[#E50914] font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {cand.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{cand.name}</h5>
                      <p className="text-[10px] font-mono text-[#888888] truncate">{cand.headline || 'Student Developer'}</p>
                    </div>
                  </div>

                  <Link to={`/groups`}>
                    <button
                      type="button"
                      className="px-3 py-1 bg-[#111111] hover:bg-[#202020] border border-[#242424] text-white rounded-full text-xs font-mono font-bold transition-all flex-shrink-0 cursor-pointer"
                    >
                      Connect
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hackathon Description & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-[#242424] rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E50914]" />
              <span>About the Hackathon</span>
            </h3>

            <div className="text-xs sm:text-sm font-mono text-[#D0D0D0] leading-relaxed whitespace-pre-line space-y-2">
              {description}
            </div>
          </div>

          {/* Prizes Breakdown */}
          {prizes && prizes.length > 0 && (
            <div className="bg-[#111111] border border-[#242424] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F2B705]" />
                <span>Prizes & Awards</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prizes.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#161616] border border-[#242424] space-y-1"
                  >
                    <span className="text-xs font-mono font-bold text-[#F2B705]">{p.amount}</span>
                    <h5 className="text-xs font-bold text-[#F5F5F5]">{p.title}</h5>
                    <p className="text-[11px] font-mono text-[#888888] leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Themes / Tracks */}
          <div className="bg-[#111111] border border-[#242424] rounded-3xl p-6 space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">Themes & Categories</h4>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-xs font-mono text-[#F5F5F5]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Rules */}
          {rules && rules.length > 0 && (
            <div className="bg-[#111111] border border-[#242424] rounded-3xl p-6 space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20D47A]" /> Rules & Guidelines
              </h4>
              <ul className="space-y-2 text-xs font-mono text-[#888888]">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#E50914] font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
