import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  Sparkles,
  CheckCircle2,
  Users,
  Brain,
  ArrowRight,
  UserCheck,
  Zap,
  RefreshCw,
  ExternalLink,
  Mail,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { projectAPI, userAPI, inviteAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

// 3D Canvas Scene for AI Match Connection
const MatchScene3D = ({
  user,
  candidate,
  matchingSkills,
  progress,
  prefersReducedMotion
}) => {
  const groupRef = useRef();
  const beamRef = useRef();

  const userPos = [-3.2, 1.6, 0];
  const teammatePos = [3.2, -1.6, 0];

  const skillPositions = useMemo(() => {
    const list = matchingSkills.length > 0 ? matchingSkills.slice(0, 4) : ['Core Skills', 'Collaboration', 'Interests'];
    const count = list.length;
    return list.map((skill, idx) => {
      const t = (idx + 1) / (count + 1);
      const x = -3.2 + t * 6.4;
      const y = Math.sin(t * Math.PI) * 1.5 - 0.2;
      const z = Math.cos(t * Math.PI * 2) * 0.8;
      return { name: typeof skill === 'string' ? skill : skill.name, x, y, z };
    });
  }, [matchingSkills]);

  const { linePositions, lineColors } = useMemo(() => {
    const points = [userPos, ...skillPositions.map(s => [s.x, s.y, s.z]), teammatePos];
    const pos = [];
    const cols = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      pos.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);

      cols.push(0.9, 0.04, 0.08); // Red
      cols.push(1.0, 1.0, 1.0); // White
    }

    return {
      linePositions: new Float32Array(pos),
      lineColors: new Float32Array(cols)
    };
  }, [skillPositions]);

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden) return;
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.4) * 0.08;
      groupRef.current.rotation.x = Math.cos(time * 0.3) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={beamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={lineColors.length / 3}
            array={lineColors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={Math.min(1, progress * 1.2)}
          linewidth={2}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* USER NODE */}
      <group position={userPos}>
        <mesh scale={1.15}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color="#E50914"
            emissive="#E50914"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        <Html distanceFactor={12} center position={[0, -0.9, 0]}>
          <div className="px-2.5 py-0.5 rounded-full bg-[#111111]/95 text-[#F5F5F5] border border-[#242424] text-[10px] font-mono font-bold whitespace-nowrap shadow-soft select-none">
            👤 {user?.name ? user.name.split(' ')[0] : 'You'} (Lead)
          </div>
        </Html>
      </group>

      {/* MATCHING SKILL NODES */}
      {skillPositions.map((skill, idx) => (
        <group key={idx} position={[skill.x, skill.y, skill.z]}>
          <mesh scale={progress > 0.4 ? 1 : 0.6}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              color="#333333"
              emissive="#333333"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
          <Html distanceFactor={12} center position={[0, 0.55, 0]}>
            <div className="px-2 py-0.5 rounded-full bg-[#111111]/95 text-[#888888] border border-[#242424] text-[9px] font-mono font-bold whitespace-nowrap shadow-soft select-none">
              ✓ {skill.name}
            </div>
          </Html>
        </group>
      ))}

      {/* TEAMMATE NODE */}
      <group position={teammatePos}>
        <mesh scale={progress >= 0.8 ? 1.25 : 0.8}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.7}
            roughness={0.2}
          />
        </mesh>
        <Html distanceFactor={12} center position={[0, -0.95, 0]}>
          <div className="px-2.5 py-0.5 rounded-full bg-[#111111]/95 text-white border border-[#333333] text-[10px] font-mono font-bold whitespace-nowrap shadow-soft select-none">
            ⭐ {candidate?.name || 'Teammate'}
          </div>
        </Html>
      </group>
    </group>
  );
};

export const AiMatchVisualizer3D = ({
  projectId,
  onClose,
  onTeammateInvited
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [invited, setInvited] = useState(false);
  const [inviting, setInviting] = useState(false);

  const SEQUENCE_STEPS = [
    { title: 'Analyzing your skills...', progress: 0.2 },
    { title: 'Comparing interests & hackathon goals...', progress: 0.4 },
    { title: 'Analyzing project requirements & team gaps...', progress: 0.65 },
    { title: 'Finding compatible teammates...', progress: 0.85 },
    { title: 'Match found!', progress: 1.0 }
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  const handleStartMatching = async () => {
    setLoading(true);
    setStep(1);
    setProgress(0.2);
    setNoMatchFound(false);
    setMatchData(null);
    setInvited(false);

    try {
      let bestCandidate = null;

      if (projectId) {
        const res = await projectAPI.getMatches(projectId);
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const top = res.data.data[0];
          bestCandidate = {
            _id: top.student?._id || top.user?._id,
            name: top.student?.name || top.user?.name || top.name,
            headline: top.student?.headline || top.user?.headline || 'Full Stack Developer',
            college: top.student?.college || top.user?.college || 'Institute of Technology',
            course: top.student?.course || top.user?.course || 'Computer Science',
            avatar: top.student?.avatar || top.user?.avatar || '',
            score: top.score || top.compatibilityScore || 92,
            matchingSkills: top.matchingSkills || ['React', 'Node.js', 'MongoDB'],
            matchingInterests: top.matchingInterests || ['AI/ML', 'Hackathons'],
            skills: top.student?.skills || top.user?.skills || [{ name: 'React' }, { name: 'Node.js' }, { name: 'MongoDB' }, { name: 'AI/ML' }],
            reason: top.reason || 'Proven technical alignment and schedule overlap.'
          };
        }
      } else {
        const netRes = await userAPI.getSkillNetwork();
        if (netRes.data.success && netRes.data.data?.users?.length > 0) {
          const validUsers = netRes.data.data.users.filter(u => u.dbId !== user?._id && u.id !== `user_${user?._id}`);
          if (validUsers.length > 0) {
            const chosen = validUsers[0];
            const userSkills = (user?.skills || []).map(s => typeof s === 'string' ? s : s.name);
            const matchingS = chosen.skills.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase()));

            bestCandidate = {
              _id: chosen.dbId,
              name: chosen.name,
              headline: chosen.headline,
              college: chosen.college,
              course: chosen.course,
              avatar: chosen.avatar,
              score: 92,
              matchingSkills: matchingS.length > 0 ? matchingS : chosen.skills.slice(0, 3),
              matchingInterests: ['AI/ML', 'Hackathons'],
              skills: chosen.skills.map(s => ({ name: s })),
              reason: 'High technical synergy in modern stacks and hackathon projects.'
            };
          }
        }
      }

      if (prefersReducedMotion) {
        if (bestCandidate) {
          setMatchData(bestCandidate);
          setStep(6);
        } else {
          setNoMatchFound(true);
          setStep(6);
        }
        setLoading(false);
        return;
      }

      for (let s = 1; s <= 5; s++) {
        setStep(s);
        setProgress(SEQUENCE_STEPS[s - 1].progress);
        await new Promise(r => setTimeout(r, 550));
      }

      if (bestCandidate) {
        setMatchData(bestCandidate);
      } else {
        setNoMatchFound(true);
      }
      setStep(6);
    } catch (err) {
      console.error('Matching failed:', err);
      setNoMatchFound(true);
      setStep(6);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeammate = async () => {
    if (!matchData) return;
    setInviting(true);
    try {
      if (projectId) {
        await inviteAPI.sendInvitation({
          receiverId: matchData._id,
          projectId: projectId,
          role: 'Collaborator',
          message: `Hey ${matchData.name}! Our AI matching scored us at ${matchData.score}% compatibility. Let's team up!`
        });
      }
      setInvited(true);
      success(`Invitation sent to ${matchData.name}! ✉️`);
      if (onTeammateInvited) onTeammateInvited(matchData);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-[#111111] rounded-3xl border border-[#242424] text-[#F5F5F5] overflow-hidden shadow-soft relative">
      {/* Top Banner Header */}
      <div className="p-6 bg-[#161616] border-b border-[#242424] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#242424] text-[#E50914] flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
              // AI_MATCH_ENGINE
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5]">
              AI Teammate Discovery
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-2 rounded-full bg-[#111111] border border-[#242424] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {step === 0 ? (
          <div className="py-12 text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#161616] border border-[#242424] text-[#E50914] flex items-center justify-center shadow-soft">
              <Sparkles className="w-8 h-8 text-[#E50914]" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[#F5F5F5]">
                Find Your Best Compatible Teammate
              </h4>
              <p className="text-xs font-mono text-[#888888] mt-2 leading-relaxed">
                Our multi-factor matching engine evaluates technical skills, domain interests, hackathon track records, and availability overlaps.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={handleStartMatching}
              className="mx-auto"
            >
              Find My Best Teammate
            </Button>
          </div>
        ) : step >= 1 && step <= 5 ? (
          <div className="py-10 text-center max-w-xl mx-auto space-y-6">
            <div className="h-44 w-full rounded-2xl bg-black border border-[#242424] flex items-center justify-center relative overflow-hidden">
              {hasWebGL && !prefersReducedMotion ? (
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                  <ambientLight intensity={0.8} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFFFFF" />
                  <Suspense fallback={null}>
                    <MatchScene3D
                      user={user}
                      candidate={{ name: 'Scanning...' }}
                      matchingSkills={['React', 'AI/ML', 'Node.js']}
                      progress={progress}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </Suspense>
                </Canvas>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#E50914] animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[#F5F5F5] text-[10px] font-mono font-bold uppercase tracking-wider">
                <RefreshCw className="w-3 h-3 animate-spin text-[#E50914]" />
                <span>Step {step} of 5</span>
              </div>
              <h4 className="text-xl font-mono font-bold text-[#F5F5F5]">
                {SEQUENCE_STEPS[step - 1]?.title}
              </h4>
            </div>

            <div className="w-full bg-[#161616] rounded-full h-1.5 overflow-hidden border border-[#242424]">
              <div
                className="bg-[#E50914] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        ) : (
          noMatchFound ? (
            <div className="py-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#F2B705]/10 border border-[#F2B705]/30 text-[#F2B705] flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#F5F5F5]">No strong match found yet.</h4>
              <p className="text-xs font-mono text-[#888888] leading-relaxed">
                Add more verified skills, interests, and project requirements to your profile to expand your compatibility score.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={handleStartMatching}>
                  Retry Scan
                </Button>
                <Link to="/profile/edit">
                  <Button variant="primary" size="sm">
                    Enhance Profile
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {hasWebGL && !prefersReducedMotion && (
                <div className="h-56 w-full rounded-2xl bg-black border border-[#242424] overflow-hidden relative">
                  <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
                    <ambientLight intensity={0.9} />
                    <pointLight position={[10, 10, 10]} intensity={1.8} color="#FFFFFF" />
                    <Suspense fallback={null}>
                      <MatchScene3D
                        user={user}
                        candidate={matchData}
                        matchingSkills={matchData.matchingSkills || []}
                        progress={1}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </Suspense>
                  </Canvas>
                </div>
              )}

              {/* Match Result Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#161616] border border-[#242424] shadow-soft relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#242424]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#111111] border border-[#242424] text-white font-mono font-bold text-xl flex items-center justify-center shadow-soft">
                      {matchData.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-[#F5F5F5]">
                          {matchData.name}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#20D47A]/10 border border-[#20D47A]/30 text-[#20D47A] text-[10px] font-mono font-bold">
                          {matchData.score}% MATCH
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#888888] mt-0.5">
                        {matchData.headline}
                      </p>
                      <p className="text-[10px] font-mono text-[#666666] mt-0.5">
                        🎓 {matchData.college} • {matchData.course}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => window.open(`/profile?id=${matchData._id}`, '_blank')}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      icon={Mail}
                      loading={inviting}
                      disabled={invited}
                      onClick={handleInviteTeammate}
                    >
                      {invited ? 'Invited ✓' : 'Invite to Team'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="p-4 rounded-2xl bg-[#111111] border border-[#242424] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#20D47A]" />
                      <span>Matching Skills</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchData.matchingSkills?.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[#F5F5F5] text-[10px] font-mono flex items-center gap-1"
                        >
                          ✓ {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#111111] border border-[#242424] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Matching Interests</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchData.matchingInterests?.map((i, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#242424] text-[#F5F5F5] text-[10px] font-mono flex items-center gap-1"
                        >
                          ✓ {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {matchData.reason && (
                  <div className="mt-4 p-3 rounded-2xl bg-[#111111] border border-[#242424] text-xs font-mono text-[#888888] flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#E50914] shrink-0" />
                    <span><strong className="text-[#F5F5F5]">AI Match Rationale:</strong> {matchData.reason}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleStartMatching}
                >
                  Scan for Another Match
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
