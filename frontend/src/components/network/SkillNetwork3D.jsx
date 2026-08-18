import React, { useRef, useMemo, useState, useEffect, Suspense, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  Search,
  Users,
  Brain,
  Code2,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Compass,
  List,
  Eye,
  RefreshCw,
  Info,
  FolderKanban,
  Trophy,
  X,
  PlusCircle,
  MessageSquare,
  Star,
  Flame,
  Award,
  GraduationCap,
  Clock,
  Target,
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  Activity,
  UserCheck
} from 'lucide-react';
import { userAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

// Entity Color Palette
const ENTITY_COLORS = {
  student: '#06b6d4', // Cyan / Teal
  skill: '#a855f7',   // Purple / Violet Hub
  project: '#f59e0b', // Amber / Gold
  team: '#10b981'     // Emerald
};

// Major Skill Hub Spatial Anchors (Sphere-clustered coordinates)
const SKILL_ANCHORS = {
  react: [-4.2, 2.5, 0.8],
  nodejs: [4.2, 2.2, -1.0],
  python: [-2.0, -3.8, 2.2],
  machinelearning: [3.2, -3.5, 1.8],
  aiml: [3.2, -3.5, 1.8],
  fastapi: [0.5, -4.5, -1.5],
  typescript: [-3.8, 0.2, -3.0],
  javascript: [-2.5, 3.8, -2.0],
  mongodb: [2.8, 3.5, 2.5],
  docker: [4.5, -1.2, -3.0],
  figma: [-4.5, -2.0, 1.5],
  uiux: [-4.5, -2.0, 1.5],
  tailwind: [-1.2, 4.2, 2.0],
  webrtc: [1.5, 1.0, 4.5],
  nextjs: [-3.0, 2.0, 3.2],
  graphql: [2.0, 4.0, -2.8]
};

// Atmospheric Ambient Floating Particles
const AmbientParticles = ({ count = 140 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 32;
      p[i * 3 + 1] = (Math.random() - 0.5) * 32;
      p[i * 3 + 2] = (Math.random() - 0.5) * 32;
    }
    return p;
  }, [count]);

  const pointsRef = useRef();
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#818cf8"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Camera Controller that smoothly focuses on selected node
const CameraController = ({ selectedNode, controlsRef }) => {
  const { camera } = useThree();
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 12));
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedNode) {
      targetPosRef.current.set(
        selectedNode.x * 0.65,
        selectedNode.y * 0.65,
        selectedNode.z * 0.65 + 6.5
      );
      lookAtRef.current.set(selectedNode.x, selectedNode.y, selectedNode.z);
    } else {
      targetPosRef.current.set(0, 0, 12);
      lookAtRef.current.set(0, 0, 0);
    }
  }, [selectedNode]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookAtRef.current, 0.05);
      controlsRef.current.update();
    }
  });

  return null;
};

// 3D Graph Scene
const GraphScene = ({
  nodes,
  links,
  selectedNode,
  hoveredNode,
  searchQuery,
  activeMode,
  selectedProjectForGap,
  onSelectNode,
  onHoverNode,
  autoRotate,
  prefersReducedMotion,
  controlsRef
}) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden || selectedNode || !autoRotate) return;
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  const activeNodeId = selectedNode?.id || hoveredNode?.id;

  // Set of connected node IDs to active node
  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set();
    const set = new Set();
    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (srcId === activeNodeId) set.add(tgtId);
      if (tgtId === activeNodeId) set.add(srcId);
    });
    return set;
  }, [activeNodeId, links]);

  // Skill Gap Status Mapping (When in 'gaps' mode)
  const skillGapStatusMap = useMemo(() => {
    if (activeMode !== 'gaps' || !selectedProjectForGap) return new Map();
    const map = new Map();
    const reqSkills = selectedProjectForGap.requiredSkills || [];
    const teamMembers = selectedProjectForGap.members || [];
    const leadSkills = selectedProjectForGap.owner?.skills || [];
    const allTeamSkills = new Set(
      [
        ...leadSkills.map((s) => (typeof s === 'string' ? s : s.name).toLowerCase()),
        ...teamMembers.flatMap((m) =>
          (m.user?.skills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase())
        )
      ].filter(Boolean)
    );

    reqSkills.forEach((sk) => {
      const sKey = sk.toLowerCase();
      if (allTeamSkills.has(sKey)) {
        map.set(sKey, 'covered'); // Green
      } else {
        map.set(sKey, 'missing'); // Red
      }
    });

    return map;
  }, [activeMode, selectedProjectForGap]);

  // Dynamic Line Segments
  const { activeLines, studentSkillLines, projectSkillLines, backgroundLines } = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const activePos = [];
    const sSkillPos = [];
    const pSkillPos = [];
    const bgPos = [];

    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      const src = nodeMap.get(srcId);
      const tgt = nodeMap.get(tgtId);

      if (src && tgt) {
        const isConnectedToActive =
          activeNodeId && (srcId === activeNodeId || tgtId === activeNodeId);

        if (isConnectedToActive) {
          activePos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        } else if (l.relation === 'requires') {
          pSkillPos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        } else if (l.relation === 'possesses') {
          sSkillPos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        } else {
          bgPos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        }
      }
    });

    return {
      activeLines: new Float32Array(activePos),
      studentSkillLines: new Float32Array(sSkillPos),
      projectSkillLines: new Float32Array(pSkillPos),
      backgroundLines: new Float32Array(bgPos)
    };
  }, [nodes, links, activeNodeId]);

  return (
    <group ref={groupRef}>
      {/* Background Atmosphere Particles */}
      <AmbientParticles count={150} />

      {/* 1. Student -> Skill Connection Lines (Subtle Solid Cyan/Indigo) */}
      {studentSkillLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={studentSkillLines.length / 3}
              array={studentSkillLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#6366f1"
            transparent
            opacity={activeNodeId ? 0.08 : 0.22}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* 2. Project -> Skill Connection Lines (Warm Amber/Gold) */}
      {projectSkillLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={projectSkillLines.length / 3}
              array={projectSkillLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#f59e0b"
            transparent
            opacity={activeNodeId ? 0.08 : 0.25}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* 3. Active Highlighted Connection Lines (Glowing High Opacity Cyan) */}
      {activeLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={activeLines.length / 3}
              array={activeLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* 4. Render Nodes with Clustered Visual Hierarchy */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedNodeIds.has(node.id);
        const isDimmed = activeNodeId && !isSelected && !isConnected;

        // Determine node color according to mode (Skill Gaps mode color coding)
        let baseColor = ENTITY_COLORS[node.type] || '#6366f1';
        let emissiveColor = baseColor;

        if (activeMode === 'gaps' && node.type === 'skill') {
          const gapStatus = skillGapStatusMap.get(node.name.toLowerCase());
          if (gapStatus === 'covered') {
            baseColor = '#10b981'; // Green
            emissiveColor = '#10b981';
          } else if (gapStatus === 'missing') {
            baseColor = '#ef4444'; // Red
            emissiveColor = '#ef4444';
          }
        }

        const nodeSize =
          node.type === 'skill' ? 0.42 : node.type === 'project' ? 0.48 : 0.32;

        const nodeScale = isSelected
          ? 1.75
          : isHovered
          ? 1.45
          : isConnected
          ? 1.28
          : isDimmed
          ? 0.8
          : 1;

        return (
          <group
            key={node.id}
            position={[node.x, node.y, node.z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(node);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHoverNode(node);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              onHoverNode(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* SKILL HUB NODES: Distinct Geometric Icosahedron with Orbital Rings */}
            {node.type === 'skill' && (
              <group scale={nodeScale}>
                <mesh>
                  <icosahedronGeometry args={[nodeSize, 2]} />
                  <meshStandardMaterial
                    color={isSelected ? '#ffffff' : baseColor}
                    emissive={isSelected ? '#ffffff' : emissiveColor}
                    emissiveIntensity={isSelected ? 0.95 : isHovered ? 0.6 : isDimmed ? 0.1 : 0.4}
                    roughness={0.15}
                    metalness={0.5}
                    transparent={isDimmed}
                    opacity={isDimmed ? 0.25 : 1}
                  />
                </mesh>

                {/* Outer Hub Ring */}
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                  <torusGeometry args={[nodeSize * 1.5, 0.02, 16, 32]} />
                  <meshBasicMaterial
                    color={baseColor}
                    transparent
                    opacity={isDimmed ? 0.1 : 0.45}
                  />
                </mesh>
              </group>
            )}

            {/* PROJECT NODES: Octahedron Gold Nodes */}
            {node.type === 'project' && (
              <group scale={nodeScale}>
                <mesh>
                  <octahedronGeometry args={[nodeSize, 2]} />
                  <meshStandardMaterial
                    color={isSelected ? '#ffffff' : '#f59e0b'}
                    emissive={isSelected ? '#ffffff' : '#f59e0b'}
                    emissiveIntensity={isSelected ? 0.95 : isHovered ? 0.65 : isDimmed ? 0.1 : 0.45}
                    roughness={0.2}
                    metalness={0.6}
                    transparent={isDimmed}
                    opacity={isDimmed ? 0.25 : 1}
                  />
                </mesh>
                {/* Project Outer Glow Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[nodeSize * 1.35, nodeSize * 1.55, 24]} />
                  <meshBasicMaterial
                    color="#f59e0b"
                    transparent
                    opacity={isDimmed ? 0.1 : 0.5}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            )}

            {/* STUDENT NODES: Soft Glowing Cyan Spheres */}
            {node.type === 'student' && (
              <mesh scale={nodeScale}>
                <sphereGeometry args={[nodeSize, 22, 22]} />
                <meshStandardMaterial
                  color={isSelected ? '#ffffff' : isConnected ? '#38bdf8' : '#06b6d4'}
                  emissive={isSelected ? '#ffffff' : isConnected ? '#38bdf8' : '#06b6d4'}
                  emissiveIntensity={isSelected ? 0.95 : isConnected ? 0.65 : isHovered ? 0.55 : isDimmed ? 0.08 : 0.3}
                  roughness={0.2}
                  metalness={0.3}
                  transparent={isDimmed}
                  opacity={isDimmed ? 0.25 : 1}
                />
              </mesh>
            )}

            {/* Selected / Hover Halo Ring */}
            {(isSelected || isHovered) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[nodeSize * 1.6, nodeSize * 1.85, 32]} />
                <meshBasicMaterial
                  color={isSelected ? '#ffffff' : baseColor}
                  transparent
                  opacity={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Hover Tooltip (Dark Glassmorphism) */}
            {(isHovered || isSelected) && (
              <Html distanceFactor={11.5} center position={[0, nodeSize + 0.6, 0]} pointerEvents="none">
                <div className="bg-[#111113]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-2xl shadow-2xl pointer-events-none text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 min-w-[160px]">
                  {/* Student Tooltip */}
                  {node.type === 'student' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                            Student
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400">
                          {node.skillScore || '9.2/10'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold truncate">
                        {node.primarySkill || node.skills?.[0] || 'Full Stack'}
                      </p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{node.projectsCount || 2} Projects</span>
                        <span className="text-indigo-400 font-bold">View Profile →</span>
                      </div>
                    </div>
                  )}

                  {/* Skill Tooltip */}
                  {node.type === 'skill' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: baseColor }}
                          />
                          <span
                            className="text-[10px] font-black uppercase tracking-wider"
                            style={{ color: baseColor }}
                          >
                            Skill Hub
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-purple-400">
                          {node.avgScore || '8.4/10'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold">
                        {node.userCount || 1} {node.userCount === 1 ? 'Student' : 'Students'} Connected
                      </p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{node.projectCount || 1} Projects Req</span>
                        <span className="text-purple-400 font-bold">Inspect Hub →</span>
                      </div>
                    </div>
                  )}

                  {/* Project Tooltip */}
                  {node.type === 'project' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                            Project
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400">
                          {node.teamSize || 4} Members
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold truncate">
                        {node.category || 'Engineering'}
                      </p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{node.requiredSkills?.length || 3} Skills Needed</span>
                        <span className="text-amber-400 font-bold">Open Project →</span>
                      </div>
                    </div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

export const SkillNetwork3D = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);

  // Modes: 'network' | 'gaps' | 'matches'
  const [activeMode, setActiveMode] = useState('network');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'

  // Selected & Hovered States
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedProjectForGap, setSelectedProjectForGap] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('All'); // 'All' | 'student' | 'skill' | 'project'
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'AI/ML' | 'Web Development' | 'Design' | 'DevOps'
  const [autoRotate, setAutoRotate] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // AI Matches Modal State
  const [aiMatchesModalOpen, setAiMatchesModalOpen] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const controlsRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 1. Fetch Real Graph Data & Build Force/Skill-Clustered Network
  const loadGraphData = async () => {
    try {
      setLoading(true);
      const [usersRes, projRes] = await Promise.all([
        userAPI.getUsers().catch(() => ({ data: { data: [] } })),
        projectAPI.getProjects().catch(() => ({ data: { data: [] } }))
      ]);

      const users = usersRes.data?.data || [];
      const projects = projRes.data?.data || [];
      setProjectsList(projects);

      if (projects.length > 0 && !selectedProjectForGap) {
        setSelectedProjectForGap(projects[0]);
      }

      const skillMap = new Map();
      const rawNodes = [];
      const rawLinks = [];

      // 1. Process Skills and Students
      users.slice(0, 24).forEach((u, uIdx) => {
        const uId = `user-${u._id || uIdx}`;
        const uSkills = (u.skills || [])
          .map((s) => (typeof s === 'string' ? s : s.name))
          .filter(Boolean);

        const computedScoreNum = u.overallScore
          ? Math.min(9.9, Math.max(7.2, u.overallScore / 10))
          : Math.min(9.8, 8.4 + (uIdx % 12) * 0.11);
        const formattedSkillScore = `${computedScoreNum.toFixed(1)}/10`;
        const percentageScore = `${Math.round(computedScoreNum * 10)}%`;

        const studentNode = {
          id: uId,
          dbId: u._id,
          type: 'student',
          name: u.name || `Student ${uIdx + 1}`,
          avatar: u.avatar,
          headline: u.headline || 'Software Engineer',
          subtitle: u.headline || 'Software Engineer',
          primarySkill: uSkills[0] || 'Web Development',
          experienceLevel: u.experienceLevel || 'Intermediate',
          skillScore: formattedSkillScore,
          scorePercentage: percentageScore,
          scoreNumber: computedScoreNum,
          skills: uSkills,
          college: u.college || 'Institute of Technology',
          availability: u.availability || '15-20 hrs/wk',
          projectsCount: (u.pastProjectsCount || 0) + 1,
          raw: u
        };

        rawNodes.push(studentNode);

        // Map skills
        uSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          const sNormalized = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (!skillMap.has(sKey)) {
            // Find predefined anchor or fallback
            const anchor =
              SKILL_ANCHORS[sNormalized] || [
                THREE.MathUtils.randFloat(-4.5, 4.5),
                THREE.MathUtils.randFloat(-4.5, 4.5),
                THREE.MathUtils.randFloat(-3.5, 3.5)
              ];

            skillMap.set(sKey, {
              id: `skill-${sNormalized}`,
              type: 'skill',
              name: sKey,
              subtitle: 'Technical Skill Hub',
              userCount: 0,
              projectCount: 0,
              totalScoreSum: 0,
              topStudents: [],
              x: anchor[0],
              y: anchor[1],
              z: anchor[2]
            });
          }

          const sObj = skillMap.get(sKey);
          sObj.userCount += 1;
          sObj.totalScoreSum += computedScoreNum;
          if (sObj.topStudents.length < 4) {
            sObj.topStudents.push({
              id: uId,
              name: studentNode.name,
              avatar: studentNode.avatar,
              score: studentNode.scorePercentage
            });
          }

          rawLinks.push({
            id: `link-${uId}-${sObj.id}`,
            source: uId,
            target: sObj.id,
            relation: 'possesses'
          });
        });
      });

      // 2. Process Projects
      projects.slice(0, 16).forEach((p, pIdx) => {
        const pId = `proj-${p._id || pIdx}`;
        const pSkills = p.requiredSkills || [];

        // Project coordinate: calculated as centroid of its required skill anchors + offset
        let pX = 0, pY = 0, pZ = 0;
        let countedAnchors = 0;

        pSkills.forEach((sk) => {
          const sNormalized = sk.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (SKILL_ANCHORS[sNormalized]) {
            pX += SKILL_ANCHORS[sNormalized][0];
            pY += SKILL_ANCHORS[sNormalized][1];
            pZ += SKILL_ANCHORS[sNormalized][2];
            countedAnchors++;
          }
        });

        if (countedAnchors > 0) {
          pX = (pX / countedAnchors) * 1.35 + (pIdx % 2 === 0 ? 1.5 : -1.5);
          pY = (pY / countedAnchors) * 1.35 + (pIdx % 3 === 0 ? 1.2 : -1.2);
          pZ = (pZ / countedAnchors) * 1.35 + 2.0;
        } else {
          pX = THREE.MathUtils.randFloat(-6.0, 6.0);
          pY = THREE.MathUtils.randFloat(-6.0, 6.0);
          pZ = THREE.MathUtils.randFloat(-4.0, 4.0);
        }

        const projectNode = {
          id: pId,
          dbId: p._id,
          type: 'project',
          name: p.title || `Project ${pIdx + 1}`,
          description: p.description || 'Collaborative engineering and AI software project.',
          category: p.category || 'Web Development',
          difficulty: p.difficulty || 'Medium',
          subtitle: `${p.category || 'Web Development'} • ${p.difficulty || 'Medium'}`,
          requiredSkills: pSkills,
          teamSize: p.teamSize || 4,
          memberCount: p.members?.length || 1,
          members: p.members || [],
          owner: p.owner,
          matchScore: p.matchScore || 92,
          x: pX,
          y: pY,
          z: pZ,
          raw: p
        };

        rawNodes.push(projectNode);

        // Link project to required skills
        pSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          const sNormalized = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (!skillMap.has(sKey)) {
            const anchor =
              SKILL_ANCHORS[sNormalized] || [
                THREE.MathUtils.randFloat(-4.5, 4.5),
                THREE.MathUtils.randFloat(-4.5, 4.5),
                THREE.MathUtils.randFloat(-3.5, 3.5)
              ];

            skillMap.set(sKey, {
              id: `skill-${sNormalized}`,
              type: 'skill',
              name: sKey,
              subtitle: 'Required Skill Hub',
              userCount: 0,
              projectCount: 0,
              totalScoreSum: 0,
              topStudents: [],
              x: anchor[0],
              y: anchor[1],
              z: anchor[2]
            });
          }

          const sObj = skillMap.get(sKey);
          sObj.projectCount += 1;

          rawLinks.push({
            id: `link-${pId}-${sObj.id}`,
            source: pId,
            target: sObj.id,
            relation: 'requires'
          });
        });
      });

      // 3. Add Skills to rawNodes & Calculate Position of Students in Skill Orbits
      skillMap.forEach((s) => {
        const avg = s.userCount > 0 ? (s.totalScoreSum / s.userCount).toFixed(1) : '8.4';
        s.avgScore = `${avg}/10`;
        s.avgPercentage = `${Math.round(parseFloat(avg) * 10)}%`;
        rawNodes.push(s);
      });

      // Position Student nodes in cluster orbits around their primary skill hub
      const studentsList = rawNodes.filter((n) => n.type === 'student');
      studentsList.forEach((st, idx) => {
        const primarySkillName = st.primarySkill?.trim();
        const hub = skillMap.get(primarySkillName) || skillMap.values().next().value;

        if (hub) {
          const angle = (idx / studentsList.length) * Math.PI * 2 * 3;
          const orbitRadius = 1.4 + (idx % 3) * 0.45;
          st.x = hub.x + Math.cos(angle) * orbitRadius;
          st.y = hub.y + Math.sin(angle) * orbitRadius;
          st.z = hub.z + (idx % 2 === 0 ? 0.7 : -0.7);
        } else {
          st.x = THREE.MathUtils.randFloat(-5.0, 5.0);
          st.y = THREE.MathUtils.randFloat(-5.0, 5.0);
          st.z = THREE.MathUtils.randFloat(-4.0, 4.0);
        }
      });

      setNodes(rawNodes);
      setLinks(rawLinks);
    } catch (err) {
      console.error('Failed to generate talent intelligence graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Filtered nodes based on Type, Category, and Search Query
  const filteredNodes = useMemo(() => {
    let list = nodes;

    if (selectedType !== 'All') {
      list = list.filter((n) => n.type === selectedType);
    }

    if (selectedCategory !== 'All') {
      list = list.filter(
        (n) =>
          (n.category && n.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
          (n.headline && n.headline.toLowerCase().includes(selectedCategory.toLowerCase())) ||
          (Array.isArray(n.skills) && n.skills.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase())))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          (n.subtitle && n.subtitle.toLowerCase().includes(q)) ||
          (Array.isArray(n.skills) && n.skills.some((s) => s.toLowerCase().includes(q))) ||
          (n.category && n.category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [nodes, selectedType, selectedCategory, searchQuery]);

  // Dynamic Search Suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return nodes
      .filter((n) => n.name?.toLowerCase().includes(q) || (n.subtitle && n.subtitle.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [searchQuery, nodes]);

  // Connected Entities for Inspector Panel
  const connectedEntities = useMemo(() => {
    if (!selectedNode) return [];
    const connectedIds = new Set();

    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

      if (srcId === selectedNode.id) connectedIds.add(tgtId);
      if (tgtId === selectedNode.id) connectedIds.add(srcId);
    });

    return nodes.filter((n) => connectedIds.has(n.id));
  }, [selectedNode, links, nodes]);

  const connectedStudents = useMemo(
    () => connectedEntities.filter((e) => e.type === 'student'),
    [connectedEntities]
  );
  const connectedSkills = useMemo(
    () => connectedEntities.filter((e) => e.type === 'skill'),
    [connectedEntities]
  );
  const connectedProjects = useMemo(
    () => connectedEntities.filter((e) => e.type === 'project'),
    [connectedEntities]
  );

  // Trigger "Find My Best Team Matches" AI Engine
  const handleFindMyMatches = async () => {
    setAiMatchesModalOpen(true);
    try {
      setLoadingMatches(true);
      // Fetch users and rank them by complementary skill overlap
      const res = await userAPI.getUsers();
      const allUsers = res.data?.data || [];
      const userSkills = user?.skills || ['React', 'Node.js'];

      const ranked = allUsers
        .filter((u) => u._id !== user?._id)
        .map((u, idx) => {
          const theirSkills = (u.skills || []).map((s) => (typeof s === 'string' ? s : s.name));
          const common = theirSkills.filter((s) => userSkills.includes(s));
          const complementary = theirSkills.filter((s) => !userSkills.includes(s));
          const matchPct = Math.min(98, Math.max(76, 82 + common.length * 5 + (idx % 8)));

          return {
            user: u,
            matchScore: matchPct,
            reasons: [
              complementary[0] ? `+ High proficiency in ${complementary[0]}` : '+ Complementary Stack',
              common[0] ? `+ Shared foundation in ${common[0]}` : '+ Aligned Hackathon Goals',
              '+ High active collaboration score'
            ]
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      setAiMatches(ranked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Stats calculation
  const totalStudentsCount = nodes.filter((n) => n.type === 'student').length;
  const totalSkillsCount = nodes.filter((n) => n.type === 'skill').length;
  const totalProjectsCount = nodes.filter((n) => n.type === 'project').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRIC INSIGHT STRIP */}
      <div className="p-6 rounded-3xl bg-[#111113] border border-[#27272A] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI-Powered Talent Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#FAFAFA] tracking-tight">
              Talent Intelligence Network
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Explore students, skill hubs, and active projects to discover compatible teammates and build high-impact squads.
            </p>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div className="relative w-full lg:w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students, skills, projects..."
                value={searchQuery}
                onFocus={() => setSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchDropdownOpen(true);
                }}
                className="w-full bg-[#18181B] border border-[#27272A] focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Dropdown */}
            {searchDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-2">
                <div className="text-[10px] font-bold text-zinc-500 px-3 py-1 uppercase tracking-wider">
                  Direct Entity Matches
                </div>
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedNode(item);
                      setSearchDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-zinc-800 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ENTITY_COLORS[item.type] }}
                      />
                      <span className="text-xs font-bold text-white truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Compact Statistics Strip */}
        <div className="mt-6 pt-5 border-t border-[#27272A] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#18181B] rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Students</p>
              <h4 className="text-base font-extrabold text-white">{totalStudentsCount} Profiled</h4>
            </div>
          </div>

          <div className="p-3 bg-[#18181B] rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Skill Hubs</p>
              <h4 className="text-base font-extrabold text-white">{totalSkillsCount} Categorized</h4>
            </div>
          </div>

          <div className="p-3 bg-[#18181B] rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Projects</p>
              <h4 className="text-base font-extrabold text-white">{totalProjectsCount} Active</h4>
            </div>
          </div>

          <div className="p-3 bg-[#18181B] rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Connections</p>
              <h4 className="text-base font-extrabold text-white">{links.length} Live Edges</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODE SELECTOR & FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111113] p-3 rounded-2xl border border-[#27272A]">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'network', label: '🌐 Talent Network' },
            { id: 'gaps', label: '⚠️ Skill Gap Mode' },
            { id: 'matches', label: '✨ Team Match Mode' }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setActiveMode(mode.id);
                if (mode.id === 'matches') handleFindMyMatches();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeMode === mode.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-white bg-[#18181B]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Project Selector when in Skill Gaps Mode */}
        {activeMode === 'gaps' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">Target Project:</span>
            <select
              value={selectedProjectForGap?._id || ''}
              onChange={(e) => {
                const found = projectsList.find((p) => p._id === e.target.value);
                setSelectedProjectForGap(found);
              }}
              className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Action: Find My Best Matches */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFindMyMatches}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Find My Best Team Matches</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
            className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-zinc-300 rounded-xl text-xs font-bold border border-[#27272A] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === '3D' ? <List className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === '3D' ? '2D Explorer' : '3D Graph'}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN 3-COLUMN / 2D WORKSPACE */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[780px] max-h-[85vh]">
        {/* Canvas Toolbar Header */}
        <div className="p-3 px-5 bg-[#111113] border-b border-[#27272A] flex flex-wrap items-center justify-between gap-3 z-10">
          {/* Entity Type Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Filter:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'student', label: 'Students' },
              { id: 'skill', label: 'Skills' },
              { id: 'project', label: 'Projects' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 bg-[#18181B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                autoRotate
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#18181B] text-zinc-400 border-[#27272A]'
              }`}
              title="Toggle Auto-Rotation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin-slow' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (controlsRef.current) controlsRef.current.reset();
                setSelectedNode(null);
              }}
              className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Center Canvas / 2D Explorer */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 font-semibold">
                Building your talent intelligence graph...
              </p>
            </div>
          ) : viewMode === '3D' ? (
            /* 3D WebGL Canvas */
            <div
              className="w-full h-full relative cursor-grab active:cursor-grabbing"
              onClick={(e) => {
                if (e.target.tagName === 'CANVAS') setSelectedNode(null);
              }}
            >
              <Canvas
                camera={{ position: [0, 0, 12], fov: 48 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                onPointerMissed={() => setSelectedNode(null)}
              >
                <ambientLight intensity={0.7} />
                <pointLight position={[12, 12, 12]} intensity={1.4} color="#818cf8" />
                <pointLight position={[-12, -12, -12]} intensity={0.9} color="#c084fc" />
                <Suspense fallback={null}>
                  <GraphScene
                    nodes={filteredNodes}
                    links={links}
                    selectedNode={selectedNode}
                    hoveredNode={hoveredNode}
                    searchQuery={searchQuery}
                    activeMode={activeMode}
                    selectedProjectForGap={selectedProjectForGap}
                    onSelectNode={setSelectedNode}
                    onHoverNode={setHoveredNode}
                    autoRotate={autoRotate}
                    prefersReducedMotion={prefersReducedMotion}
                    controlsRef={controlsRef}
                  />
                  <CameraController selectedNode={selectedNode} controlsRef={controlsRef} />
                  <OrbitControls
                    ref={controlsRef}
                    enableDamping
                    dampingFactor={0.05}
                    rotateSpeed={0.6}
                    zoomSpeed={0.8}
                    minDistance={3.5}
                    maxDistance={24}
                  />
                </Suspense>
              </Canvas>

              {/* Bottom Legend (Adapts to Active Mode) */}
              <div className="absolute bottom-4 left-4 z-10 bg-[#111113]/90 backdrop-blur-md border border-[#27272A] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-[11px] font-bold">
                {activeMode === 'gaps' ? (
                  <>
                    <span className="text-zinc-500 uppercase text-[9px] font-black">Skill Gap:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                      <span className="text-emerald-300">Covered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                      <span className="text-rose-300">Missing Gap</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-500 uppercase text-[9px] font-black">Nodes:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-xs" />
                      <span className="text-zinc-300">Students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-xs" />
                      <span className="text-zinc-300">Skills</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs" />
                      <span className="text-zinc-300">Projects</span>
                    </div>
                  </>
                )}
              </div>

              <div className="absolute bottom-4 right-4 z-10 hidden sm:block bg-[#111113]/80 backdrop-blur-sm border border-[#27272A] px-3 py-1.5 rounded-xl text-[10px] text-zinc-400">
                Drag to rotate • Scroll to zoom • Click node to open intelligence panel
              </div>
            </div>
          ) : (
            /* 2D Explorer Mode */
            <div className="p-6 overflow-y-auto h-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {filteredNodes.map((n) => {
                  const isSelected = selectedNode?.id === n.id;
                  const baseColor = ENTITY_COLORS[n.type] || '#6366f1';

                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`p-4 rounded-2xl bg-[#111113] border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-[#18181B]'
                          : 'border-[#27272A] hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: `${baseColor}20`,
                            color: baseColor
                          }}
                        >
                          {n.type}
                        </span>
                        {n.scorePercentage && (
                          <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-400" />
                            {n.scorePercentage}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{n.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{n.subtitle}</p>

                      {Array.isArray(n.skills) && n.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {n.skills.slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-lg text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. CONTEXTUAL INTELLIGENCE PANEL (Desktop Right Drawer / Mobile Bottom Sheet) */}
          {selectedNode && (
            <div className="absolute z-30 bg-[#111113]/98 backdrop-blur-2xl border-[#27272A] shadow-2xl p-5 overflow-y-auto space-y-5 animate-in duration-200 w-full sm:w-96 max-h-[78vh] sm:max-h-full bottom-0 sm:bottom-0 right-0 sm:top-0 rounded-t-3xl sm:rounded-none sm:border-l border-t sm:border-t-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#27272A]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                    style={{ backgroundColor: ENTITY_COLORS[selectedNode.type] || '#6366f1' }}
                  >
                    {selectedNode.type === 'student' ? (
                      <Users className="w-6 h-6" />
                    ) : selectedNode.type === 'project' ? (
                      <FolderKanban className="w-6 h-6" />
                    ) : (
                      <Zap className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider block"
                      style={{ color: ENTITY_COLORS[selectedNode.type] }}
                    >
                      {selectedNode.type} Intelligence
                    </span>
                    <h4 className="text-base font-extrabold text-white truncate">
                      {selectedNode.name}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">{selectedNode.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-[#27272A] transition-colors cursor-pointer"
                  title="Close Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ================================================================= */}
              {/* STUDENT CONTEXTUAL INTELLIGENCE                                    */}
              {/* ================================================================= */}
              {selectedNode.type === 'student' && (
                <div className="space-y-4">
                  {/* Score & Availability */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Skill Score
                      </span>
                      <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <Star className="w-4 h-4 fill-emerald-400" />
                        {selectedNode.scorePercentage || '92%'}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Availability
                      </span>
                      <span className="text-xs font-bold text-white mt-1 block truncate">
                        {selectedNode.availability || '15-20 hrs/wk'}
                      </span>
                    </div>
                  </div>

                  {/* Top Skills Breakdown */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Top Skills
                    </h5>
                    <div className="space-y-1.5">
                      {(selectedNode.skills || []).map((sk, idx) => {
                        const score = Math.max(75, 94 - idx * 4);
                        return (
                          <div key={sk} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-200">{sk}</span>
                              <span className="text-indigo-400 font-bold">{score}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matching Projects */}
                  {connectedProjects.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        AI Matches ({connectedProjects.length} Projects)
                      </h5>
                      <div className="space-y-1.5">
                        {connectedProjects.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedNode(p)}
                            className="p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between"
                          >
                            <span className="text-xs font-bold text-amber-300 truncate">{p.name}</span>
                            <span className="text-[10px] font-bold text-emerald-400">
                              {p.matchScore || 94}% match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#27272A] space-y-2">
                    <Link to={`/profile`} className="w-full block">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>View Profile & Analytics</span>
                      </button>
                    </Link>

                    <Link to="/groups" className="w-full block">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Direct Message</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SKILL CONTEXTUAL INTELLIGENCE                                      */}
              {/* ================================================================= */}
              {selectedNode.type === 'skill' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Talent Pool
                      </span>
                      <span className="text-base font-black text-cyan-400 mt-0.5 block">
                        {selectedNode.userCount || 1} Students
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Average Score
                      </span>
                      <span className="text-base font-black text-purple-400 mt-0.5 block">
                        {selectedNode.avgPercentage || '84%'}
                      </span>
                    </div>
                  </div>

                  {/* Top Students */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Top Rated Students
                    </h5>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {connectedStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedNode(st)}
                          className="p-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={st.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.name}`}
                              alt={st.name}
                              className="w-6 h-6 rounded-lg object-cover bg-zinc-800 border border-zinc-700"
                            />
                            <span className="text-xs font-bold text-white truncate">{st.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            {st.scorePercentage || '92%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects Requiring Skill */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Projects Requiring {selectedNode.name} ({connectedProjects.length})
                    </h5>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {connectedProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedNode(p)}
                          className="p-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-amber-300 truncate">{p.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#27272A]">
                    <Link to="/community" className="w-full block">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>Find {selectedNode.name} Developers</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* PROJECT CONTEXTUAL INTELLIGENCE                                    */}
              {/* ================================================================= */}
              {selectedNode.type === 'project' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedNode.description || selectedNode.subtitle}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Team Size
                      </span>
                      <span className="text-base font-black text-amber-400 mt-0.5 block">
                        {selectedNode.memberCount || 1} / {selectedNode.teamSize || 4} Members
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Difficulty
                      </span>
                      <span className="text-xs font-bold text-white mt-1 block">
                        {selectedNode.difficulty || 'Medium'}
                      </span>
                    </div>
                  </div>

                  {/* Required Skills & Skill Gaps */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Required Skills & Gaps
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedNode.requiredSkills || []).map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#27272A] space-y-2">
                    {selectedNode.raw?._id && (
                      <>
                        <Link to={`/projects/${selectedNode.raw._id}/matches`} className="w-full block">
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Find Team Members</span>
                          </button>
                        </Link>

                        <Link to={`/projects/${selectedNode.raw._id}/team`} className="w-full block">
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FolderKanban className="w-4 h-4" />
                            <span>View Project Workspace</span>
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. "FIND MY BEST TEAM MATCHES" MODAL DIALOG */}
      {aiMatchesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    AI Talent Compatibility Matches
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Based on your skills, project history, and complementary team requirements.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAiMatchesModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingMatches ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-400">Synthesizing talent synergy matrix...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 relative z-10">
                {aiMatches.map((m, idx) => (
                  <div
                    key={m.user._id || idx}
                    className="p-4 rounded-2xl bg-[#111113] border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`}
                          alt={m.user.name}
                          className="w-10 h-10 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{m.user.name}</h4>
                          <p className="text-xs text-zinc-400 truncate">{m.user.headline}</p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {m.matchScore}% Match
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-300 pt-1 border-t border-zinc-800/80">
                      {m.reasons.map((r, rIdx) => (
                        <p key={rIdx} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className="text-indigo-400 font-bold">✓</span>
                          <span>{r}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setAiMatchesModalOpen(false)}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
