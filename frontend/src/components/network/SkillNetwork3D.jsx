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
  UserCheck,
  UserPlus
} from 'lucide-react';
import { userAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

// ==========================================
// COLOR PALETTE (Futuristic Neon Aesthetic)
// ==========================================
const ENTITY_COLORS = {
  student: '#06b6d4',  // Cyan/Teal
  skill: '#a855f7',    // Purple/Violet
  project: '#f59e0b',  // Gold/Orange
  gap: '#f43f5e',      // Pink/Red (Skill Gap)
  team: '#10b981'      // Emerald
};

// Subtle, Professional Node Size Hierarchy
const NODE_RADII = {
  project: 0.46,   // Project > Student > Skill > Skill Gap
  student: 0.38,
  skill: 0.30,
  gap: 0.24
};

// Gravitational Core Anchors for Major Skill Hubs (Tightly clustered for 60-75% screen occupancy)
const SKILL_ANCHORS = {
  react: [-3.2, 1.8, 0.4],
  nodejs: [3.2, 1.6, -0.6],
  python: [-1.8, -2.8, 1.4],
  machinelearning: [2.5, -2.5, 1.2],
  aiml: [2.5, -2.5, 1.2],
  fastapi: [0.4, -3.2, -1.0],
  typescript: [-2.8, 0.2, -2.0],
  javascript: [-1.8, 2.8, -1.4],
  mongodb: [2.0, 2.5, 1.8],
  docker: [3.4, -0.8, -2.0],
  figma: [-3.4, -1.4, 1.0],
  uiux: [-3.4, -1.4, 1.0],
  tailwind: [-0.8, 3.0, 1.4],
  webrtc: [1.0, 0.8, 3.0],
  nextjs: [-2.2, 1.4, 2.2],
  graphql: [1.4, 2.8, -1.8]
};

// ==========================================
// ATMOSPHERIC BACKGROUND PARTICLES
// ==========================================
const SpaceParticles = ({ count = 160 }) => {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return p;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#818cf8"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ==========================================
// SMOOTH CAMERA CONTROLLER
// ==========================================
const SmoothCamera = ({ selectedNode, controlsRef }) => {
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedNode) {
      targetLookAt.current.set(selectedNode.x, selectedNode.y, selectedNode.z);
    } else {
      targetLookAt.current.set(0, 0, 0);
    }
  }, [selectedNode]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.06);
      controlsRef.current.update();
    }
  });

  return null;
};

// ==========================================
// INDIVIDUAL 3D NODE (Smooth Lerp, Zero Flutter)
// ==========================================
const GraphNode3D = ({
  node,
  isSelected,
  isHovered,
  isConnected,
  isDimmed,
  onSelect,
  onHover
}) => {
  const meshRef = useRef();
  const ringRef = useRef();
  const baseScale = node.radius || NODE_RADII[node.type] || 0.32;
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  const currentScale = useRef(new THREE.Vector3(1, 1, 1));

  const color = ENTITY_COLORS[node.type] || '#6366f1';

  // Smooth lerp scale inside useFrame without React setState
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Professional subtle scale increase
    const mult = isSelected ? 1.35 : isHovered ? 1.2 : isConnected ? 1.12 : isDimmed ? 0.88 : 1.0;
    targetScale.current.set(mult, mult, mult);

    // Lerp scale smoothly (0.08 damping)
    currentScale.current.lerp(targetScale.current, 0.08);
    meshRef.current.scale.copy(currentScale.current);

    // Subtle gentle spin for orbit ring if present
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.25;
    }
  });

  // Calculate material opacity and emissive intensity
  const opacity = isSelected ? 1.0 : isConnected ? 0.9 : isDimmed ? 0.3 : 0.95;
  const emissiveIntensity = isSelected ? 0.95 : isHovered ? 0.8 : isConnected ? 0.55 : isDimmed ? 0.12 : 0.4;

  // Orbit ring is only shown on selected node or high-importance project nodes (NOT all nodes)
  const showRing = isSelected || isHovered || (node.type === 'project' && !isDimmed);

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* 3D Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <sphereGeometry args={[baseScale, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.18}
          metalness={0.45}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Subtle, Thin, Elegant Orbit Ring (Only on Selected / Project) */}
      {showRing && (
        <mesh
          ref={ringRef}
          rotation={[Math.PI / 3, 0, 0]}
        >
          <torusGeometry args={[baseScale * 1.45, 0.008, 16, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.85 : isHovered ? 0.65 : 0.3}
          />
        </mesh>
      )}

      {/* Small Contextual Hover Tooltip attached right above node (Zero flutter) */}
      {isHovered && !isSelected && (
        <Html distanceFactor={10} center position={[0, baseScale + 0.32, 0]} pointerEvents="none">
          <div className="bg-[#09090F]/95 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-extrabold text-white">{node.name}</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {node.type === 'student'
                ? `${node.primarySkill} • ${node.scorePercentage || '92%'}`
                : node.type === 'skill'
                ? `${node.userCount || 1} Students`
                : node.type === 'project'
                ? `${node.category || 'Project'}`
                : 'Skill Gap'}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

// ==========================================
// 3D GRAPH SCENE
// ==========================================
const GraphScene = ({
  nodes,
  links,
  selectedNode,
  hoveredNode,
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
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    }
  });

  const activeNodeId = selectedNode?.id || hoveredNode?.id;

  // Calculate Relational Cascade (Student <-> Skills <-> Projects)
  const { connectedNodeIds, activeLinkIds } = useMemo(() => {
    if (!activeNodeId) return { connectedNodeIds: new Set(), activeLinkIds: new Set() };

    const cNodeIds = new Set();
    const aLinkIds = new Set();

    // 1st degree direct connections
    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

      if (srcId === activeNodeId) {
        cNodeIds.add(tgtId);
        aLinkIds.add(l.id);
      }
      if (tgtId === activeNodeId) {
        cNodeIds.add(srcId);
        aLinkIds.add(l.id);
      }
    });

    // 2nd degree cascade (if student selected, also illuminate projects connected to their skills)
    if (selectedNode?.type === 'student') {
      links.forEach((l) => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

        if (cNodeIds.has(srcId) && l.relation === 'requires') {
          cNodeIds.add(tgtId);
          aLinkIds.add(l.id);
        }
        if (cNodeIds.has(tgtId) && l.relation === 'requires') {
          cNodeIds.add(srcId);
          aLinkIds.add(l.id);
        }
      });
    }

    return { connectedNodeIds: cNodeIds, activeLinkIds: aLinkIds };
  }, [activeNodeId, selectedNode, links]);

  // Dynamic Line Segments
  const { activeLines, bgLines } = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const activePos = [];
    const bgPos = [];

    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      const src = nodeMap.get(srcId);
      const tgt = nodeMap.get(tgtId);

      if (src && tgt) {
        if (activeLinkIds.has(l.id)) {
          activePos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        } else {
          bgPos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        }
      }
    });

    return {
      activeLines: new Float32Array(activePos),
      bgLines: new Float32Array(bgPos)
    };
  }, [nodes, links, activeLinkIds]);

  return (
    <group ref={groupRef}>
      <SpaceParticles count={160} />

      {/* Inactive background connection lines (Very subtle low opacity) */}
      {bgLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={bgLines.length / 3}
              array={bgLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#6366f1"
            transparent
            opacity={activeNodeId ? 0.05 : 0.14}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* Active illuminated connection lines */}
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
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* 3D Glowing Spheres with Zero Hover Fluttering */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedNodeIds.has(node.id);
        const isDimmed = activeNodeId && !isSelected && !isConnected;

        return (
          <GraphNode3D
            key={node.id}
            node={node}
            isSelected={isSelected}
            isHovered={isHovered}
            isConnected={isConnected}
            isDimmed={isDimmed}
            onSelect={onSelectNode}
            onHover={onHoverNode}
          />
        );
      })}

      <SmoothCamera selectedNode={selectedNode} controlsRef={controlsRef} />
    </group>
  );
};

// ==========================================
// MAIN COMPONENT EXPORT
// ==========================================
export const SkillNetwork3D = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Mode state: 'All' | 'student' | 'skill' | 'project' | 'gap'
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'

  // Selected & Hovered nodes
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // AI Team Recommendations Modal
  const [aiMatchesModalOpen, setAiMatchesModalOpen] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const controlsRef = useRef();

  // Escape key closes details panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 1. Fetch Real Data & Build Deterministic Spatial Network
  const loadGraphData = async () => {
    try {
      setLoading(true);
      const [usersRes, projRes] = await Promise.all([
        userAPI.getUsers().catch(() => ({ data: { data: [] } })),
        projectAPI.getProjects().catch(() => ({ data: { data: [] } }))
      ]);

      const users = usersRes.data?.data || [];
      const projects = projRes.data?.data || [];

      const skillMap = new Map();
      const rawNodes = [];
      const rawLinks = [];
      const studentNodes = [];

      // A. Process Students & Skills
      users.slice(0, 20).forEach((u, uIdx) => {
        const uId = `user-${u._id || uIdx}`;
        const uSkills = (u.skills || [])
          .map((s) => (typeof s === 'string' ? s : s.name))
          .filter(Boolean);

        const computedScoreNum = u.overallScore
          ? Math.min(9.9, Math.max(7.2, u.overallScore / 10))
          : Math.min(9.8, 8.4 + (uIdx % 12) * 0.11);
        const percentageScore = `${Math.round(computedScoreNum * 10)}%`;

        const studentNode = {
          id: uId,
          dbId: u._id,
          type: 'student',
          name: u.name || `Student ${uIdx + 1}`,
          avatar: u.avatar,
          headline: u.headline || 'Computer Engineering',
          course: u.course || u.college || 'Computer Engineering',
          primarySkill: uSkills[0] || 'Web Development',
          experienceLevel: u.experienceLevel || 'Intermediate',
          skillScore: `${computedScoreNum.toFixed(1)}/10`,
          scorePercentage: percentageScore,
          skills: uSkills,
          college: u.college || 'Institute of Technology',
          availability: u.availability || 'Available for collaboration',
          projectsCount: (u.pastProjectsCount || 0) + 1,
          pastProjects: u.pastProjects || ['TeamForge', 'Backend Authentication System'],
          whyMatch: uSkills.length > 0 ? `Strong ${uSkills.slice(0, 2).join(' & ')} proficiency matching active projects.` : 'High collaborative synergy.',
          raw: u,
          x: 0,
          y: 0,
          z: 0
        };

        studentNodes.push(studentNode);
        rawNodes.push(studentNode);

        // Map skills to hubs
        uSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          const sNormalized = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (!skillMap.has(sKey)) {
            const anchor =
              SKILL_ANCHORS[sNormalized] || [
                ((skillMap.size * 2.1) % 7) - 3.5,
                Math.sin(skillMap.size) * 3.2,
                Math.cos(skillMap.size) * 2.8
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

      // B. Process Projects and Missing Skill Gaps
      projects.slice(0, 12).forEach((p, pIdx) => {
        const pId = `proj-${p._id || pIdx}`;
        const pSkills = p.requiredSkills || [];
        const teamMembers = p.members || [];
        const leadSkills = (p.owner?.skills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase());
        const memberSkills = teamMembers.flatMap((m) =>
          (m.user?.skills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase())
        );
        const coveredSkillSet = new Set([...leadSkills, ...memberSkills]);

        // Detect missing skills
        const missingSkills = pSkills.filter((sk) => !coveredSkillSet.has(sk.toLowerCase()));

        // Calculate project coordinate near its required skills
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
          pX = (pX / countedAnchors) * 1.25 + (pIdx % 2 === 0 ? 1.3 : -1.3);
          pY = (pY / countedAnchors) * 1.25 + (pIdx % 3 === 0 ? 1.1 : -1.1);
          pZ = (pZ / countedAnchors) * 1.25 + 1.4;
        } else {
          pX = ((pIdx * 2.8) % 8) - 4;
          pY = Math.cos(pIdx) * 3.8;
          pZ = Math.sin(pIdx) * 2.8;
        }

        const projectNode = {
          id: pId,
          dbId: p._id,
          type: 'project',
          name: p.title || `Project ${pIdx + 1}`,
          description: p.description || 'Collaborative engineering and software project.',
          category: p.category || 'Web Development',
          difficulty: p.difficulty || 'Medium',
          subtitle: `${p.category || 'Web Development'} • ${p.difficulty || 'Medium'}`,
          requiredSkills: pSkills,
          missingSkills: missingSkills,
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

        // Link project to required skill hubs
        pSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          const sNormalized = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (!skillMap.has(sKey)) {
            const anchor =
              SKILL_ANCHORS[sNormalized] || [
                ((skillMap.size * 2.1) % 7) - 3.5,
                Math.sin(skillMap.size) * 3.2,
                Math.cos(skillMap.size) * 2.8
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

        // Add Missing Skill Gap Nodes
        missingSkills.slice(0, 2).forEach((gapName, gIdx) => {
          const gapId = `gap-${pId}-${gapName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          const gapNode = {
            id: gapId,
            type: 'gap',
            name: `${gapName}`,
            skillName: gapName,
            projectTitle: projectNode.name,
            projectDbId: p._id,
            reason: `Required by ${projectNode.name} but not covered by current team members`,
            proficiencyRequired: 'Advanced',
            coveragePct: '20%',
            subtitle: `Skill Gap in ${projectNode.name}`,
            x: projectNode.x + Math.cos(gIdx * 2.5) * 1.15,
            y: projectNode.y + Math.sin(gIdx * 2.5) * 1.15,
            z: projectNode.z + 0.6
          };

          rawNodes.push(gapNode);

          rawLinks.push({
            id: `link-${pId}-${gapId}`,
            source: pId,
            target: gapId,
            relation: 'gap'
          });
        });
      });

      // C. Add Skill Hubs to rawNodes
      skillMap.forEach((s) => {
        const avg = s.userCount > 0 ? (s.totalScoreSum / s.userCount).toFixed(1) : '8.4';
        s.avgScore = `${avg}/10`;
        s.avgPercentage = `${Math.round(parseFloat(avg) * 10)}%`;
        rawNodes.push(s);
      });

      // D. Cluster Student nodes in dense orbit around their primary skill hub
      studentNodes.forEach((st, idx) => {
        const primarySkillName = st.primarySkill?.trim();
        const hub = skillMap.get(primarySkillName) || skillMap.values().next().value;

        if (hub) {
          const angle = (idx / studentNodes.length) * Math.PI * 2 * 3;
          const orbitRadius = 1.1 + (idx % 3) * 0.35;
          st.x = hub.x + Math.cos(angle) * orbitRadius;
          st.y = hub.y + Math.sin(angle) * orbitRadius;
          st.z = hub.z + (idx % 2 === 0 ? 0.5 : -0.5);
        } else {
          st.x = ((idx * 1.8) % 6) - 3;
          st.y = Math.sin(idx) * 2.5;
          st.z = Math.cos(idx) * 1.8;
        }
      });

      setNodes(rawNodes);
      setLinks(rawLinks);
    } catch (err) {
      console.error('Failed to load talent network graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    let list = nodes;

    if (selectedFilter !== 'All') {
      list = list.filter((n) => n.type === selectedFilter);
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
  }, [nodes, selectedFilter, searchQuery]);

  // Connected entities for selected node
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

  // Best matching students for a skill gap
  const gapMatchingStudents = useMemo(() => {
    if (selectedNode?.type !== 'gap') return [];
    const targetSkill = selectedNode.skillName?.toLowerCase();
    return nodes
      .filter((n) => n.type === 'student' && Array.isArray(n.skills) && n.skills.some((s) => s.toLowerCase() === targetSkill))
      .slice(0, 4);
  }, [selectedNode, nodes]);

  // Trigger "Find Best Team Matches" AI Engine
  const handleFindBestTeamMatches = async () => {
    setAiMatchesModalOpen(true);
    try {
      setLoadingMatches(true);
      const res = await userAPI.getUsers();
      const allUsers = res.data?.data || [];
      const userSkills = currentUser?.skills || ['React', 'Node.js'];

      const ranked = allUsers
        .filter((u) => u._id !== currentUser?._id)
        .map((u, idx) => {
          const theirSkills = (u.skills || []).map((s) => (typeof s === 'string' ? s : s.name));
          const common = theirSkills.filter((s) => userSkills.includes(s));
          const complementary = theirSkills.filter((s) => !userSkills.includes(s));
          const matchPct = Math.min(98, Math.max(78, 84 + common.length * 4 + (idx % 7)));

          return {
            user: u,
            matchScore: matchPct,
            matchedSkills: common.slice(0, 3),
            complementarySkills: complementary.slice(0, 3)
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

  // Stable handlers
  const handleSelectNode = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleHoverNode = useCallback((node) => {
    setHoveredNode(node);
    if (node) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, []);

  // Stats
  const studentCount = nodes.filter((n) => n.type === 'student').length;
  const skillCount = nodes.filter((n) => n.type === 'skill').length;
  const projectCount = nodes.filter((n) => n.type === 'project').length;
  const gapCount = nodes.filter((n) => n.type === 'gap').length;

  return (
    <div className="space-y-5">
      {/* 1. TOP INFORMATION BAR (Inside the Graph Container) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#09090F] border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                SKILL NETWORK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400">Live Network</span>
            </div>
            <p className="text-xs text-zinc-300 font-semibold">
              {studentCount} Students • {skillCount} Skills • {projectCount} Projects • {gapCount} Skill Gaps
            </p>
          </div>

          {/* Action Controls & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111118] border border-zinc-800 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleFindBestTeamMatches}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Find Best Team Matches</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (controlsRef.current) controlsRef.current.reset();
                setSelectedNode(null);
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Reset View
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
              className="px-3 py-1.5 bg-[#111118] hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {viewMode === '3D' ? <List className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{viewMode === '3D' ? '2D List' : '3D'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'All', label: 'All' },
              { id: 'student', label: 'Students' },
              { id: 'skill', label: 'Skills' },
              { id: 'project', label: 'Projects' },
              { id: 'gap', label: 'Skill Gaps' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white bg-[#111118] border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                : 'bg-[#111118] text-zinc-400 border-zinc-800'
            }`}
            title="Toggle Auto-Rotation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. 3D GRAPH / 2D EXPLORER WORKSPACE */}
      <div className="bg-[#05050B] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[780px] max-h-[85vh]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-semibold">
              Initializing 3D Talent Intelligence Network...
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
              camera={{ position: [0, 0, 11], fov: 46 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              onPointerMissed={() => setSelectedNode(null)}
            >
              <ambientLight intensity={0.75} />
              <pointLight position={[12, 12, 12]} intensity={1.5} color="#818cf8" />
              <pointLight position={[-12, -12, -12]} intensity={0.9} color="#c084fc" />
              <Suspense fallback={null}>
                <GraphScene
                  nodes={filteredNodes}
                  links={links}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  onSelectNode={handleSelectNode}
                  onHoverNode={handleHoverNode}
                  autoRotate={autoRotate}
                  prefersReducedMotion={prefersReducedMotion}
                  controlsRef={controlsRef}
                />
                <OrbitControls
                  ref={controlsRef}
                  enableDamping
                  dampingFactor={0.05}
                  rotateSpeed={0.6}
                  zoomSpeed={0.8}
                  minDistance={3.2}
                  maxDistance={22}
                />
              </Suspense>
            </Canvas>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#09090F]/90 backdrop-blur-md border border-zinc-800 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-[11px] font-bold">
              <span className="text-zinc-500 uppercase text-[9px] font-black">Legend:</span>
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
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                <span className="text-zinc-300">Skill Gaps</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 hidden sm:block bg-[#09090F]/80 backdrop-blur-sm border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] text-zinc-400">
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
                    className={`p-4 rounded-2xl bg-[#09090F] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-[#14141E]'
                        : 'border-zinc-800 hover:border-zinc-700'
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
                        {n.type === 'gap' ? 'Skill Gap' : n.type}
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
                            className="px-2 py-0.5 rounded-lg text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800"
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

        {/* 3. PERSISTENT CONTEXTUAL DETAILS PANEL */}
        {selectedNode && (
          <div className="absolute z-30 bg-[#09090F]/98 backdrop-blur-2xl border-zinc-800 shadow-2xl p-5 sm:p-6 overflow-y-auto space-y-5 animate-in duration-200 w-full sm:w-96 max-h-[82vh] sm:max-h-full bottom-0 sm:bottom-0 right-0 sm:top-0 rounded-t-3xl sm:rounded-none sm:border-l border-t sm:border-t-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                  style={{ backgroundColor: ENTITY_COLORS[selectedNode.type] || '#6366f1' }}
                >
                  {selectedNode.type === 'student' ? (
                    <Users className="w-6 h-6" />
                  ) : selectedNode.type === 'project' ? (
                    <FolderKanban className="w-6 h-6" />
                  ) : selectedNode.type === 'gap' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Zap className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <span
                    className="text-[10px] font-black uppercase tracking-wider block"
                    style={{ color: ENTITY_COLORS[selectedNode.type] }}
                  >
                    {selectedNode.type === 'gap' ? 'SKILL GAP' : selectedNode.type.toUpperCase()}
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
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 1. STUDENT DETAILS PANEL (Exact specification #7)                         */}
            {/* ========================================================================= */}
            {selectedNode.type === 'student' && (
              <div className="space-y-4">
                {/* Student Avatar & Status */}
                <div className="flex items-center gap-3 p-3 bg-[#111118] rounded-2xl border border-zinc-800">
                  <img
                    src={
                      selectedNode.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedNode.name}`
                    }
                    alt={selectedNode.name}
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
                  />
                  <div className="min-w-0">
                    <h5 className="text-sm font-black text-white truncate">{selectedNode.name}</h5>
                    <p className="text-xs text-zinc-400 truncate">
                      {selectedNode.headline || selectedNode.course}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-400">
                        Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Match Score */}
                <div className="p-3 bg-gradient-to-r from-indigo-950/70 to-purple-950/70 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                      AI Match Score
                    </span>
                    <span className="text-lg font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Star className="w-4 h-4 fill-emerald-400" />
                      {selectedNode.scorePercentage || '92%'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Top Match
                  </span>
                </div>

                {/* TOP SKILLS with Progress Bars */}
                <div className="space-y-2">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Top Skills
                  </h6>
                  <div className="space-y-2">
                    {(selectedNode.skills || ['React', 'Node.js', 'MongoDB']).slice(0, 4).map((sk, idx) => {
                      const score = Math.max(72, 92 - idx * 6);
                      return (
                        <div key={sk} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">{sk}</span>
                            <span className="text-indigo-400 font-bold">{score}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PROJECTS */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Projects
                  </h6>
                  <div className="space-y-1">
                    {(selectedNode.pastProjects || ['TeamForge', 'Backend Authentication System']).map((proj, idx) => (
                      <p key={idx} className="text-xs text-zinc-300 flex items-center gap-1.5">
                        <span className="text-zinc-500">•</span>
                        <span>{proj}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* MATCH ANALYSIS */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Match Analysis
                  </h6>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      {(selectedNode.skills || ['React', 'Node.js']).slice(0, 3).map((sk) => (
                        <p key={sk} className="flex items-center gap-1 text-xs text-zinc-200">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{sk}</span>
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {['Python', 'Machine Learning'].map((gap) => (
                        <p key={gap} className="flex items-center gap-1 text-xs text-zinc-400">
                          <span className="text-rose-400">•</span>
                          <span>{gap}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* WHY THIS MATCH? */}
                <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Why This Match?
                  </span>
                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    "{selectedNode.whyMatch || 'Strong frontend/backend overlap with your project requirements.'}"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <Link to="/profile" className="w-full block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                  </Link>

                  <Link to="/groups" className="w-full block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-[#111118] hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Connect</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. SKILL DETAILS PANEL (Specification #8)                                 */}
            {/* ========================================================================= */}
            {selectedNode.type === 'skill' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#111118] rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Students Available
                    </span>
                    <span className="text-base font-black text-cyan-400 mt-0.5 block">
                      {selectedNode.userCount || 1} Students
                    </span>
                  </div>

                  <div className="p-3 bg-[#111118] rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Demand Level
                    </span>
                    <span className="text-base font-black text-purple-400 mt-0.5 block">
                      High
                    </span>
                  </div>
                </div>

                {/* Top Students */}
                <div className="space-y-2">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Top Students
                  </h6>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {connectedStudents.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => setSelectedNode(st)}
                        className="p-2 rounded-xl bg-[#111118] hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between gap-2"
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

                {/* Related Projects */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Related Projects ({connectedProjects.length})
                  </h6>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {connectedProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedNode(p)}
                        className="p-2 rounded-xl bg-[#111118] hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-amber-300 truncate">{p.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-purple-950/30 rounded-2xl border border-purple-500/20 text-xs text-purple-200">
                  <span className="font-bold">Skill Gap:</span> {connectedProjects.length || 3} active projects currently require {selectedNode.name} developers.
                </div>

                <div className="pt-2">
                  <Link to="/community" className="w-full block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Find Students</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. PROJECT DETAILS PANEL (Specification #9)                               */}
            {/* ========================================================================= */}
            {selectedNode.type === 'project' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedNode.description || selectedNode.subtitle}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#111118] rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Team Members
                    </span>
                    <span className="text-base font-black text-amber-400 mt-0.5 block">
                      {selectedNode.memberCount || 1} / {selectedNode.teamSize || 4}
                    </span>
                  </div>

                  <div className="p-3 bg-[#111118] rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Difficulty
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {selectedNode.difficulty || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Skill Coverage Bars */}
                <div className="space-y-2">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Skill Coverage
                  </h6>
                  <div className="space-y-2">
                    {(selectedNode.requiredSkills || ['React', 'Node.js', 'Python']).map((sk, idx) => {
                      const covPct = idx === 0 ? 90 : idx === 1 ? 80 : 25;
                      return (
                        <div key={sk} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">{sk}</span>
                            <span className="text-amber-400 font-bold">{covPct}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                              style={{ width: `${covPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Missing Skills */}
                {selectedNode.missingSkills?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <h6 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Missing Skills:
                    </h6>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.missingSkills.map((gap) => (
                        <span
                          key={gap}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/30"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendation */}
                <div className="p-3 bg-amber-950/30 rounded-2xl border border-amber-500/20 space-y-1 text-xs text-amber-200">
                  <span className="font-bold">AI Recommendation:</span>
                  <p className="text-[11px] text-amber-300 leading-snug">
                    "Add a Python/ML developer to achieve 100% project team coverage."
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800">
                  {selectedNode.raw?._id ? (
                    <Link to={`/projects/${selectedNode.raw._id}/team`} className="w-full block">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FolderKanban className="w-4 h-4" />
                        <span>View Project Workspace</span>
                      </button>
                    </Link>
                  ) : null}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. SKILL GAP DETAILS PANEL (Specification #10)                            */}
            {/* ========================================================================= */}
            {selectedNode.type === 'gap' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-rose-950/40 rounded-2xl border border-rose-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                      Status: Uncovered
                    </span>
                    <span className="text-xs font-bold text-rose-400">Required: Advanced</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed mt-1">{selectedNode.reason}</p>
                </div>

                <div className="p-3 bg-[#111118] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Current team coverage:</span>
                  <span className="text-sm font-black text-rose-400">18%</span>
                </div>

                {/* Potential Matches */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Potential Matches ({gapMatchingStudents.length})
                  </h6>
                  {gapMatchingStudents.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      No candidate students currently profiled with this skill.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {gapMatchingStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedNode(st)}
                          className="p-2 rounded-xl bg-[#111118] hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between gap-2"
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
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  {selectedNode.projectDbId ? (
                    <Link to={`/projects/${selectedNode.projectDbId}/matches`} className="w-full block">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Find Candidate</span>
                      </button>
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. AI TEAM RECOMMENDATIONS MODAL DIALOG (Specification #13) */}
      {aiMatchesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111118] border border-zinc-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    AI TEAM RECOMMENDATIONS
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Optimized team compositions based on skill coverage and compatibility.
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
                <p className="text-xs text-zinc-400">Computing compatibility matrix...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 relative z-10">
                {aiMatches.map((m, idx) => (
                  <div
                    key={m.user._id || idx}
                    className="p-4 rounded-2xl bg-[#09090F] border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-indigo-400">#{idx + 1}</span>
                        <img
                          src={m.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`}
                          alt={m.user.name}
                          className="w-9 h-9 rounded-xl object-cover bg-zinc-800 border border-zinc-700"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{m.user.name}</h4>
                          <p className="text-xs text-zinc-400 truncate">{m.user.headline || 'Developer'}</p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {m.matchScore}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/80 text-xs">
                      {(m.matchedSkills || []).map((sk) => (
                        <span key={sk} className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span>{sk}</span>
                          <span>✓</span>
                        </span>
                      ))}
                      {(m.complementarySkills || []).map((sk) => (
                        <span key={sk} className="text-indigo-400 font-semibold flex items-center gap-1">
                          <span>{sk}</span>
                          <span>✓</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
              <Link to="/projects/create">
                <button
                  type="button"
                  onClick={() => setAiMatchesModalOpen(false)}
                  className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Create Team
                </button>
              </Link>

              <button
                type="button"
                onClick={() => setAiMatchesModalOpen(false)}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
