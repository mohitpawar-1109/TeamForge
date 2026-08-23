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
  ShieldCheck
} from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StudentSkillAnalyticsCard } from '../components/profile/StudentSkillAnalyticsCard';

export const ProfilePage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        if (targetId && targetId !== currentUser?._id) {
          const res = await userAPI.getUserById(targetId);
          if (res.data.success) setProfile(res.data.data);
        } else {
          setProfile(currentUser);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetId, currentUser]);

  if (loading) return <div className="h-96 rounded-3xl bg-[#4A2A35] border border-[#703344] animate-pulse" />;
  if (!profile) return <div className="text-[#DDA081]">Profile not found</div>;

  const isSelf = !targetId || targetId === currentUser?._id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Portfolio Header Banner */}
      <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#703344]">
          <div className="flex items-start gap-4">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover border border-[#703344] bg-[#281A21] shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#F6E8E2] tracking-tight">{profile.name}</h1>
                <Badge variant="brand">{profile.year || 'Student'}</Badge>
              </div>
              <p className="text-sm font-semibold text-[#CB6B5A] mt-0.5">{profile.headline || 'Student Developer'}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#DDA081] mt-2 font-medium">
                <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-[#CB6B5A]" /> {profile.college}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#CB6B5A]" /> {profile.location || 'Campus'}</span>
              </div>
            </div>
          </div>

          {isSelf && (
            <Link to="/profile/edit">
              <Button variant="outline" size="md" icon={Edit2}>
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Bio */}
        <div className="py-6 border-b border-[#703344]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#DDA081] mb-2">About & Background</h3>
          <p className="text-sm text-[#F6E8E2]/90 leading-relaxed max-w-3xl">
            {profile.bio || 'Passionate student builder looking to form impactful teams for hackathons and software projects.'}
          </p>
        </div>

        {/* Portfolio Quick Stats */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-[#281A21] rounded-2xl p-3 border border-[#703344]">
            <div className="text-xs text-[#DDA081] font-medium">Projects Built</div>
            <div className="text-xl font-extrabold text-[#F6E8E2] mt-0.5">{profile.pastProjectsCount || 3}</div>
          </div>
          <div className="bg-[#281A21] rounded-2xl p-3 border border-[#703344]">
            <div className="text-xs text-[#DDA081] font-medium">Teams Joined</div>
            <div className="text-xl font-extrabold text-[#CB6B5A] mt-0.5">{profile.teamsJoinedCount || 2}</div>
          </div>
          <div className="bg-[#281A21] rounded-2xl p-3 border border-[#703344]">
            <div className="text-xs text-[#DDA081] font-medium">Verified Skills</div>
            <div className="text-xl font-extrabold text-[#86B190] mt-0.5">{(profile.skills || []).length}</div>
          </div>
          <div className="bg-[#281A21] rounded-2xl p-3 border border-[#703344]">
            <div className="text-xs text-[#DDA081] font-medium">Weekly Hours</div>
            <div className="text-xl font-extrabold text-[#DDA081] mt-0.5">{profile.weeklyHours || 15} hrs</div>
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
        <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#F6E8E2]">Technical Portfolio Skills</h3>
            <span className="text-[11px] font-bold text-[#DDA081] uppercase tracking-wider">Proficiency</span>
          </div>

          <div className="space-y-2.5">
            {(profile.skills || []).map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#281A21] border border-[#703344]">
                <div className="flex items-center gap-2">
                  {skill.verified && <CheckCircle2 className="w-4 h-4 text-[#86B190]" />}
                  <span className="text-sm font-semibold text-[#F6E8E2]">{skill.name}</span>
                </div>
                <Badge variant={skill.proficiency === 'Expert' ? 'terracotta' : skill.proficiency === 'Advanced' ? 'brand' : 'default'}>
                  {skill.proficiency || 'Intermediate'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Interests & Schedule */}
        <div className="space-y-6">
          <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 shadow-soft">
            <h3 className="text-base font-bold text-[#F6E8E2] mb-3">Domain Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.interests || []).map((int, idx) => (
                <Badge key={idx} variant="brand" size="md">
                  {int}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] p-6 shadow-soft">
            <h3 className="text-base font-bold text-[#F6E8E2] mb-3">Availability Schedule</h3>
            <div className="space-y-2">
              {(profile.availability || []).map((avail, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#F6E8E2] bg-[#281A21] p-2.5 rounded-xl border border-[#703344] font-medium">
                  <Clock className="w-4 h-4 text-[#CB6B5A] flex-shrink-0" />
                  <span>{avail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

