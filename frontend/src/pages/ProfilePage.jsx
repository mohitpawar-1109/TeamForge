import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle2,
  Edit2,
  FolderGit2,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  ShieldCheck,
  Crown,
  Star,
  Quote
} from 'lucide-react';
import { userAPI, feedbackAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StudentSkillAnalyticsCard } from '../components/profile/StudentSkillAnalyticsCard';
import { FeedbackModal } from '../components/feedback/FeedbackModal';

export const ProfilePage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');

  const [profile, setProfile] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (targetId && targetId !== currentUser?._id) {
        const res = await userAPI.getUserById(targetId);
        if (res.data.success) {
          setProfile(res.data.data);
          const feedbackRes = await feedbackAPI.getUserFeedback(targetId);
          setFeedbacks(feedbackRes.data.data || []);
        }
      } else {
        setProfile(currentUser);
        const feedbackRes = await feedbackAPI.getUserFeedback(currentUser._id);
        setFeedbacks(feedbackRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId, currentUser]);

  if (loading) return <div className="h-96 rounded-3xl bg-[#111111] border border-[#242424] animate-pulse" />;
  if (!profile) return <div className="text-[#888888]">Profile not found</div>;

  const isSelf = !targetId || targetId === currentUser?._id;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Portfolio Header Banner */}
      <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#1F1F1F]">
          <div className="flex items-start gap-4">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border border-[#242424] bg-[#161616] shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">{profile.name}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                  {profile.year || 'Student'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-[#E50914] mt-0.5">{profile.headline || 'Student Developer'}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#888888] mt-2">
                <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-[#666666]" /> {profile.college}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#666666]" /> {profile.location || 'Campus'}</span>
              </div>
            </div>
          </div>

          {isSelf && (
            <Link to="/profile/edit">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#A1A1A1]" />
                <span>Edit Profile</span>
              </button>
            </Link>
          )}
        </div>

        {/* Bio */}
        <div className="py-6 border-b border-[#1F1F1F]">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-2">About & Background</h3>
          <p className="text-xs sm:text-sm text-[#D0D0D0] leading-relaxed max-w-3xl">
            {profile.bio || 'Passionate student builder looking to form impactful teams for hackathons and software projects.'}
          </p>
        </div>

        {/* Portfolio Quick Stats */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-[#161616] rounded-2xl p-3.5 border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase">Projects Built</div>
            <div className="text-xl font-bold text-[#F5F5F5] mt-0.5">{profile.pastProjectsCount || 3}</div>
          </div>
          <div className="bg-[#161616] rounded-2xl p-3.5 border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase">Teams Joined</div>
            <div className="text-xl font-bold text-[#E50914] mt-0.5">{profile.teamsJoinedCount || 2}</div>
          </div>
          <div className="bg-[#161616] rounded-2xl p-3.5 border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase">Verified Skills</div>
            <div className="text-xl font-bold text-[#20D47A] mt-0.5">{(profile.skills || []).length}</div>
          </div>
          <div className="bg-[#161616] rounded-2xl p-3.5 border border-[#242424]">
            <div className="text-[10px] font-mono text-[#888888] uppercase">Weekly Hours</div>
            <div className="text-xl font-bold text-[#F5F5F5] mt-0.5">{profile.weeklyHours || 15} hrs</div>
          </div>
        </div>

        {/* Reputation Score Card */}
        <div className="pt-6 mt-6 border-t border-[#1F1F1F]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666]">Reputation Score</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20 uppercase font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> {profile.reputationLevel || 'New'}
              </span>
            </div>
            {!isSelf ? (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-xs font-mono font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                + Add Feedback
              </button>
            ) : (
              <a href="#reviews" className="px-3 py-1.5 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[10px] font-mono text-[#A1A1A1] flex items-center gap-2 transition-all cursor-pointer shadow-sm">
                View Your Feedback
              </a>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#F5F5F5] to-[#E50914]" 
                  style={{ width: `${profile.reputationScore || 0}%` }}
                />
              </div>
            </div>
            <span className="font-mono font-bold text-2xl text-white">{profile.reputationScore || 0}</span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-[#888888]">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#E50914] fill-current" /> {profile.averageRating?.toFixed(1) || '0.0'} Avg Rating</span>
            <span>{profile.verifiedFeedbackCount || 0} Verified Reviews</span>
          </div>
        </div>
      </div>

      {/* Verified Student Skill Scoring & Analytics */}
      <StudentSkillAnalyticsCard
        userId={targetId || profile._id}
        initialUser={profile}
      />

      {/* Skills & Experience Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-wider">Technical Portfolio Skills</h3>
            <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">Proficiency</span>
          </div>

          <div className="space-y-2">
            {(profile.skills || []).map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#161616] border border-[#242424]">
                <div className="flex items-center gap-2">
                  {skill.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#20D47A]" />}
                  <span className="text-xs font-mono font-semibold text-[#F5F5F5]">{skill.name}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111111] text-[#A1A1A1] border border-[#242424]">
                  {skill.proficiency || 'Intermediate'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interests & Schedule */}
        <div className="space-y-6">
          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
            <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-wider mb-3">Domain Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {(profile.interests || []).map((int, idx) => (
                <span key={idx} className="text-xs font-mono px-3 py-1 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                  {int}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
            <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-wider mb-3">Availability Schedule</h3>
            <div className="space-y-2">
              {(profile.availability || []).map((avail, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-mono text-[#F5F5F5] bg-[#161616] p-2.5 rounded-2xl border border-[#242424]">
                  <Clock className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                  <span>{avail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="bg-[#111111] rounded-3xl border border-[#242424] p-6 shadow-soft">
        <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <Quote className="w-4 h-4 text-[#E50914]" />
          Peer Feedback & Reviews
        </h3>
        
        {feedbacks.length === 0 ? (
          <p className="text-xs font-mono text-[#888888]">No feedback received yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feedbacks.map((f, i) => (
              <div key={i} className="bg-[#161616] border border-[#242424] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={f.reviewer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.reviewer.name}`}
                      alt={f.reviewer.name}
                      className="w-8 h-8 rounded-full border border-[#242424]"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{f.reviewer.name}</div>
                      <div className="text-[9px] font-mono text-[#888888]">{f.project?.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#050505] px-2 py-1 rounded-md border border-[#242424]">
                    <Star className="w-3 h-3 text-[#E50914] fill-current" />
                    <span className="text-xs font-mono font-bold text-white">{f.rating.toFixed(1)}</span>
                  </div>
                </div>
                {f.comment && (
                  <p className="text-[11px] font-mono text-[#A1A1A1] italic leading-relaxed">
                    "{f.comment}"
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-[#1F1F1F] flex flex-wrap gap-2">
                  {Object.entries(f.categories || {}).map(([key, val]) => (
                    val > 0 && (
                      <span key={key} className="text-[9px] font-mono uppercase tracking-wider bg-[#050505] text-[#888888] px-2 py-0.5 rounded border border-[#242424]">
                        {key}: {val}
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        targetUser={profile}
        onSuccess={() => {
          // Re-fetch profile to show new score/reviews
          fetchProfile();
        }}
      />
    </div>
  );
};
