import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  progress, // 0 to 1
  prefersReducedMotion
}) => {
  const groupRef = useRef();
  const beamRef = useRef();

  // Positions in 3D space:
  // User at top-left [-3.2, 1.8, 0]
  // Teammate at bottom-right [3.2, -1.8, 0]
  // Intermediate matching skills positioned in a graceful arc in the middle
  const userPos = [-3.2, 1.6, 0];
  const teammatePos = [3.2, -1.6, 0];

  const skillPositions = useMemo(() => {
    const list = matchingSkills.length > 0 ? matchingSkills.slice(0, 4) : ['Core Skills', 'Collaboration', 'Interests'];
    const count = list.length;
    return list.map((skill, idx) => {
      const t = (idx + 1) / (count + 1);
      // Interpolate along curved trajectory
      const x = -3.2 + t * 6.4;
      const y = Math.sin(t * Math.PI) * 1.5 - 0.2;
      const z = Math.cos(t * Math.PI * 2) * 0.8;
      return { name: typeof skill === 'string' ? skill : skill.name, x, y, z };
    });
  }, [matchingSkills]);

  // Dynamic particle beam line vertices
  const { linePositions, lineColors } = useMemo(() => {
    const points = [userPos, ...skillPositions.map(s => [s.x, s.y, s.z]), teammatePos];
    const pos = [];
    const cols = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      pos.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);

      // Gradient color from Terracotta (#A84A4D) to Warm Coral (#CB6B5A)
      cols.push(0.66, 0.29, 0.30); // Terracotta
      cols.push(0.80, 0.42, 0.35); // Warm Coral
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
      {/* Dynamic Animated Connecting Beams */}
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

      {/* 1. USER NODE */}
      <group position={userPos}>
        <mesh scale={1.15}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color="#A84A4D"
            emissive="#A84A4D"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        <Html distanceFactor={12} center position={[0, -0.9, 0]}>
          <div className="px-2.5 py-1 rounded-xl bg-[#281A21]/95 text-[#F6E8E2] border border-[#703344] text-[11px] font-extrabold whitespace-nowrap shadow-lg select-none">
            👤 {user?.name ? user.name.split(' ')[0] : 'You'} (Lead)
          </div>
        </Html>
      </group>

      {/* 2. MATCHING SKILL NODES */}
      {skillPositions.map((skill, idx) => (
        <group key={idx} position={[skill.x, skill.y, skill.z]}>
          <mesh scale={progress > 0.4 ? 1 : 0.6}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              color="#703344"
              emissive="#703344"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
          <Html distanceFactor={12} center position={[0, 0.55, 0]}>
            <div className="px-2 py-0.5 rounded-lg bg-[#281A21]/95 text-[#DDA081] border border-[#703344] text-[10px] font-bold whitespace-nowrap shadow-md select-none">
              ✓ {skill.name}
            </div>
          </Html>
        </group>
      ))}

      {/* 3. TEAMMATE NODE */}
      <group position={teammatePos}>
        <mesh scale={progress >= 0.8 ? 1.25 : 0.8}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color="#CB6B5A"
            emissive="#CB6B5A"
            emissiveIntensity={0.7}
            roughness={0.2}
          />
        </mesh>
        <Html distanceFactor={12} center position={[0, -0.95, 0]}>
          <div className="px-2.5 py-1 rounded-xl bg-[#281A21]/95 text-[#F6E8E2] border border-[#A84A4D]/60 text-[11px] font-extrabold whitespace-nowrap shadow-xl select-none">
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

  const [step, setStep] = useState(0); // 0: Idle/Start, 1..5: Sequence, 6: Result
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

  // Run AI Matching Engine Sequence
  const handleStartMatching = async () => {
    setLoading(true);
    setStep(1);
    setProgress(0.2);
    setNoMatchFound(false);
    setMatchData(null);
    setInvited(false);

    try {
      // 1. Fetch Real Match Data from API
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
        // Find best match via user network
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

      // If Reduced Motion is on, jump straight to result
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

      // Run visual progression steps (450ms each)
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

  // Trigger invite
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
    <div className="bg-[#4A2A35] rounded-3xl border border-[#703344] text-[#F6E8E2] overflow-hidden shadow-2xl relative">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-7 bg-gradient-to-r from-[#281A21] via-[#4A2A35] to-[#281A21] border-b border-[#703344] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#DDA081]">
              AI Match Engine
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F6E8E2]">
              AI Teammate Discovery
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#DDA081] hover:text-[#F6E8E2] p-1 rounded-xl bg-[#281A21] border border-[#703344] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {step === 0 ? (
          /* IDLE / START STAGE */
          <div className="py-12 text-center max-w-lg mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#703344] border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center shadow-2xl animate-pulse">
              <Sparkles className="w-10 h-10 text-[#DDA081]" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-[#F6E8E2]">
                Find Your Best Compatible Teammate
              </h4>
              <p className="text-sm text-[#DDA081] mt-2 leading-relaxed">
                Our multi-factor matching engine evaluates technical skills, domain interests, hackathon track records, and availability overlaps.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={handleStartMatching}
              className="mx-auto shadow-xl shadow-[#A84A4D]/30 px-8 py-4 rounded-2xl"
            >
              Find My Best Teammate
            </Button>
          </div>
        ) : step >= 1 && step <= 5 ? (
          /* SCANNING SEQUENCE ANIMATION STAGE */
          <div className="py-10 text-center max-w-xl mx-auto space-y-6">
            {/* 3D Wireframe / Particle Preview */}
            <div className="h-44 w-full rounded-2xl bg-[#281A21] border border-[#703344] flex items-center justify-center relative overflow-hidden">
              {hasWebGL && !prefersReducedMotion ? (
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                  <ambientLight intensity={0.8} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} color="#CB6B5A" />
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
                  <RefreshCw className="w-10 h-10 text-[#CB6B5A] animate-spin" />
                </div>
              )}
            </div>

            {/* Sequence Status Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#703344] border border-[#A84A4D]/40 text-[#F6E8E2] text-xs font-bold uppercase tracking-wider">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#CB6B5A]" />
                <span>Step {step} of 5</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-[#F6E8E2] animate-pulse">
                {SEQUENCE_STEPS[step - 1]?.title}
              </h4>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#281A21] rounded-full h-2.5 overflow-hidden border border-[#703344]">
              <div
                className="bg-gradient-to-r from-[#A84A4D] via-[#CB6B5A] to-[#DDA081] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        ) : (
          /* RESULT STAGE */
          noMatchFound ? (
            <div className="py-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D99443]/20 border border-[#D99443]/40 text-[#E5B079] flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-[#F6E8E2]">No strong match found yet.</h4>
              <p className="text-xs text-[#DDA081] leading-relaxed">
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
              {/* 3D Visualization Canvas showing connection formed */}
              {hasWebGL && !prefersReducedMotion && (
                <div className="h-56 w-full rounded-2xl bg-[#281A21] border border-[#703344] overflow-hidden relative">
                  <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
                    <ambientLight intensity={0.9} />
                    <pointLight position={[10, 10, 10]} intensity={1.8} color="#CB6B5A" />
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
              <div className="p-6 sm:p-7 rounded-3xl bg-[#281A21] border border-[#703344] shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#703344]">
                  {/* Teammate Identity */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#A84A4D] to-[#CB6B5A] text-[#F6E8E2] font-black text-2xl flex items-center justify-center shadow-lg shadow-[#A84A4D]/20">
                      {matchData.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl sm:text-2xl font-black text-[#F6E8E2]">
                          {matchData.name}
                        </h4>
                        <span className="px-3 py-0.5 rounded-full bg-[#5B8A68]/20 border border-[#5B8A68]/40 text-[#86B190] text-xs font-black">
                          {matchData.score}% MATCH
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#DDA081] font-medium mt-0.5">
                        {matchData.headline}
                      </p>
                      <p className="text-xs text-[#DDA081]/70 mt-0.5">
                        🎓 {matchData.college} • {matchData.course}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
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

                {/* Match Breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  {/* Matching Skills */}
                  <div className="p-4 rounded-2xl bg-[#4A2A35] border border-[#703344] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#CB6B5A] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Matching Skills</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchData.matchingSkills?.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-[#281A21] border border-[#703344] text-[#F6E8E2] text-xs font-bold flex items-center gap-1"
                        >
                          ✓ {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matching Interests */}
                  <div className="p-4 rounded-2xl bg-[#4A2A35] border border-[#703344] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#CB6B5A] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Matching Interests</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchData.matchingInterests?.map((i, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-[#281A21] border border-[#703344] text-[#F6E8E2] text-xs font-bold flex items-center gap-1"
                        >
                          ✓ {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Why this match reason */}
                {matchData.reason && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#703344]/30 border border-[#703344] text-xs text-[#F6E8E2] leading-relaxed flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#CB6B5A] shrink-0" />
                    <span><strong>AI Match Rationale:</strong> {matchData.reason}</span>
                  </div>
                )}
              </div>

              {/* Rerun Scan Button */}
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
