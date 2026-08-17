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

  // Toggle Save
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

  // Toggle Interest
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
        <div className="h-64 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse" />
        <div className="h-96 rounded-3xl bg-[#18181B] border border-[#27272A] animate-pulse" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400">Hackathon not found.</p>
        <Link to="/hackathons" className="text-indigo-400 font-bold mt-2 inline-block">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-zinc-300 hover:text-white transition-all"
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
              className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1.5"
            >
              <span>Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-2xl">
        {/* Banner Image */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-[#111113]">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-indigo-950 via-purple-950 to-zinc-900 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-indigo-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-transparent to-black/60" />

          {/* Top Floating Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                mode === 'Online'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                  : mode === 'Hybrid'
                  ? 'bg-purple-950/90 text-purple-300 border border-purple-500/50'
                  : 'bg-blue-950/90 text-blue-300 border border-blue-500/50'
              }`}
            >
              {mode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900/90 text-zinc-300 border border-zinc-700/60">
              {difficulty}
            </span>
          </div>

          {/* Save & Interest Floating Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-md ${
                isSaved
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save Hackathon'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleInterest}
              className={`px-3 py-2 rounded-xl backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                isInterested
                  ? 'bg-pink-600 text-white'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInterested ? 'fill-white' : ''}`} />
              <span>{isInterested ? 'Interested' : "I'm Interested"}</span>
            </button>
          </div>
        </div>

        {/* Header Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#27272A]">
            <div>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">
                Organized by {organizer?.name || 'TechForge'} • {location}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed max-w-3xl">
                {tagline}
              </p>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/projects/create?hackathon=${encodeURIComponent(title)}`}>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Project Squad</span>
                </button>
              </Link>

              <Link to={`/groups`}>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Join Discussion</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-[#111113] border border-[#27272A]">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Total Prize Pool</span>
              <span className="text-base font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> {prizePool}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#111113] border border-[#27272A]">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Deadline</span>
              <span className="text-sm font-bold text-zinc-200 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                {daysLeft > 0 ? `${daysLeft} Days Left` : 'Ending Today'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#111113] border border-[#27272A]">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Team Size</span>
              <span className="text-sm font-bold text-zinc-200 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-purple-400" />
                {teamSize?.min === teamSize?.max
                  ? `${teamSize.min} members`
                  : `${teamSize?.min || 1} - ${teamSize?.max || 4} members`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#111113] border border-[#27272A]">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Interested Peers</span>
              <span className="text-sm font-bold text-pink-400 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4 fill-pink-400" /> {interestedCount} Students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TeamForge Skill Match & Teammate Gap Filler Section */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#18181B] to-purple-950/40 border border-indigo-500/30 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#FAFAFA]">
                Your Skill Compatibility Analysis
              </h3>
              <p className="text-xs text-zinc-400">
                Connected directly with your verified TeamForge skill credentials
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-sm font-black flex items-center gap-2">
            <span>You match {matchPercentage}% of the required skills</span>
          </div>
        </div>

        {/* Covered vs Missing Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Covered Skills ({matchedSkills.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300"
                  >
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-zinc-500">None of your listed skills directly match this hackathon yet.</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Missing / Desired Skills ({missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? (
                missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-amber-950/40 border border-dashed border-amber-500/40 text-xs font-bold text-amber-300"
                  >
                    + {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-emerald-400 font-bold">You cover 100% of this hackathon's required tech!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Teammates who fill the missing skills */}
        {missingSkills.length > 0 && recommendedTeammates.length > 0 && (
          <div className="pt-4 border-t border-[#27272A] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Recommended Peers to Fill Your Missing Skills:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedTeammates.map((cand) => (
                <div
                  key={cand._id}
                  className="p-3 rounded-2xl bg-[#111113] border border-[#27272A] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {cand.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-zinc-200 truncate">{cand.name}</h5>
                      <p className="text-[11px] text-zinc-400 truncate">{cand.headline || 'Student Developer'}</p>
                    </div>
                  </div>

                  <Link to={`/groups`}>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-xl text-[11px] font-bold transition-all flex-shrink-0"
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
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-extrabold text-[#FAFAFA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>About the Hackathon</span>
            </h3>

            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line space-y-2">
              {description}
            </div>
          </div>

          {/* Prizes Breakdown */}
          {prizes && prizes.length > 0 && (
            <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-extrabold text-[#FAFAFA] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Prizes & Awards</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prizes.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#111113] border border-[#27272A] space-y-1"
                  >
                    <span className="text-xs font-black text-amber-400">{p.amount}</span>
                    <h5 className="text-sm font-bold text-zinc-200">{p.title}</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Themes / Tracks */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Themes & Categories</h4>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-semibold text-purple-300"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Rules */}
          {rules && rules.length > 0 && (
            <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Rules & Guidelines
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
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
