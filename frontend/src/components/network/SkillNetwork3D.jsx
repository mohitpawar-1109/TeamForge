import React, { useRef, useMemo, useState, useEffect, Suspense, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
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
  ArrowUpRight
} from 'lucide-react';
import { userAPI, projectAPI } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

// Entity Color System
const ENTITY_COLORS = {
  student: '#06b6d4', // Cyan
  skill: '#a855f7',   // Purple
  project: '#f59e0b', // Amber
  team: '#10b981'     // Emerald
};

// 3D Graph Scene
const GraphScene = ({
  nodes,
  links,
  selectedNode,
  hoveredNode,
  searchQuery,
  onSelectNode,
  onHoverNode,
  autoRotate,
  prefersReducedMotion
}) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden || selectedNode || !autoRotate) return;
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.025;
    }
  });

  const activeNodeId = selectedNode?.id || hoveredNode?.id;

  // Set of connected node IDs to the active node for fast O(1) lookup
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

  // Search matching set
  const searchMatchIds = useMemo(() => {
    if (!searchQuery?.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    const set = new Set();
    nodes.forEach((n) => {
      const matchName = n.name?.toLowerCase().includes(q);
      const matchSubtitle = n.subtitle?.toLowerCase().includes(q);
      const matchSkills = Array.isArray(n.skills) && n.skills.some((s) => s.toLowerCase().includes(q));
      if (matchName || matchSubtitle || matchSkills) {
        set.add(n.id);
      }
    });
    return set;
  }, [searchQuery, nodes]);

  // Calculate dynamic line positions & colors
  const { activeLines, backgroundLines } = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const activePos = [];
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
        } else {
          bgPos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
        }
      }
    });

    return {
      activeLines: new Float32Array(activePos),
      backgroundLines: new Float32Array(bgPos)
    };
  }, [nodes, links, activeNodeId]);

  return (
    <group ref={groupRef}>
      {/* Background / Inactive Connection Lines */}
      {backgroundLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={backgroundLines.length / 3}
              array={backgroundLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#6366f1"
            transparent
            opacity={activeNodeId || searchMatchIds ? 0.06 : 0.22}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* Active / Highlighted Connection Lines */}
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
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* Render 3D Nodes */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedNodeIds.has(node.id);
        const isSearchMatch = searchMatchIds ? searchMatchIds.has(node.id) : true;

        // Visual Dimming Logic
        const isDimmed =
          (activeNodeId && !isSelected && !isConnected) ||
          (searchMatchIds && !isSearchMatch);

        const baseColor = ENTITY_COLORS[node.type] || '#6366f1';
        const nodeSize = node.size || 0.32;

        const nodeScale = isSelected
          ? 1.75
          : isHovered
          ? 1.45
          : isConnected
          ? 1.28
          : isSearchMatch && searchMatchIds
          ? 1.2
          : isDimmed
          ? 0.85
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
            {/* Sphere Mesh */}
            <mesh scale={nodeScale}>
              <sphereGeometry args={[nodeSize, 24, 24]} />
              <meshStandardMaterial
                color={
                  isSelected
                    ? '#ffffff'
                    : isConnected
                    ? '#38bdf8'
                    : isSearchMatch && searchMatchIds
                    ? '#fbbf24'
                    : baseColor
                }
                emissive={
                  isSelected
                    ? '#ffffff'
                    : isConnected
                    ? '#38bdf8'
                    : isSearchMatch && searchMatchIds
                    ? '#fbbf24'
                    : baseColor
                }
                emissiveIntensity={
                  isSelected
                    ? 0.95
                    : isConnected
                    ? 0.65
                    : isHovered
                    ? 0.55
                    : isDimmed
                    ? 0.08
                    : 0.3
                }
                transparent={isDimmed}
                opacity={isDimmed ? 0.25 : 1}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            {/* Glowing Ring when selected, hovered, or connected */}
            {(isSelected || isHovered || isConnected) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[nodeSize * 1.35, nodeSize * 1.55, 28]} />
                <meshBasicMaterial
                  color={isSelected ? '#ffffff' : isConnected ? '#38bdf8' : baseColor}
                  transparent
                  opacity={isSelected ? 0.9 : 0.65}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* FEATURE 1 & 4: Lightweight Node Hover Tooltip / Label */}
            {(isHovered || isSelected) && (
              <Html distanceFactor={12} center position={[0, nodeSize + 0.55, 0]} pointerEvents="none">
                <div className="bg-[#111113]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-2xl shadow-2xl pointer-events-none text-left whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 min-w-[150px]">
                  {/* Student Tooltip */}
                  {node.type === 'student' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                          Student
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold">
                        {node.primarySkill || node.skills?.[0] || 'Full Stack'}
                      </p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Skill Score:</span>
                        <span className="text-emerald-400 font-black">{node.skillScore || '9.0/10'}</span>
                      </div>
                    </div>
                  )}

                  {/* Skill Tooltip */}
                  {node.type === 'skill' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">
                          Skill
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold">
                        {node.userCount || 1} {node.userCount === 1 ? 'student' : 'students'}
                      </p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Avg Score:</span>
                        <span className="text-purple-400 font-black">{node.avgScore || '8.5/10'}</span>
                      </div>
                    </div>
                  )}

                  {/* Project Tooltip */}
                  {node.type === 'project' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                          Project
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{node.name}</h4>
                      <p className="text-[11px] text-zinc-300 font-semibold">{node.category || 'Engineering'}</p>
                      <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Team Size:</span>
                        <span className="text-amber-400 font-black">
                          {node.teamSize || 4} members required
                        </span>
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
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All'); // 'All' | 'student' | 'skill' | 'project'
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const controlsRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch real data from API and construct multi-entity graph
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

      // 1. Process Skills and Students
      users.slice(0, 20).forEach((u, uIdx) => {
        const uId = `user-${u._id || uIdx}`;
        const uSkills = (u.skills || [])
          .map((s) => (typeof s === 'string' ? s : s.name))
          .filter(Boolean);

        // Derive deterministic skill score formatted as x.x/10
        const computedScoreNum = u.overallScore
          ? Math.min(9.9, Math.max(7.0, u.overallScore / 10))
          : Math.min(9.8, 8.2 + (uIdx % 15) * 0.11);
        const formattedSkillScore = `${computedScoreNum.toFixed(1)}/10`;

        const studentNode = {
          id: uId,
          type: 'student',
          name: u.name || `Student ${uIdx + 1}`,
          avatar: u.avatar,
          headline: u.headline || 'Full Stack Developer',
          subtitle: u.headline || 'Full Stack Developer',
          primarySkill: uSkills[0] || 'Web Development',
          experienceLevel: u.experienceLevel || 'Intermediate',
          skillScore: formattedSkillScore,
          scoreNumber: computedScoreNum,
          skills: uSkills,
          college: u.college || 'Engineering & Technology',
          availability: u.availability || '15-20 hrs/week',
          raw: u,
          size: 0.34
        };

        rawNodes.push(studentNode);

        uSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          if (!skillMap.has(sKey)) {
            skillMap.set(sKey, {
              id: `skill-${sKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              type: 'skill',
              name: sKey,
              subtitle: 'Technical Skill',
              userCount: 0,
              projectCount: 0,
              totalScoreSum: 0,
              topStudents: [],
              size: 0.28
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
              score: studentNode.skillScore
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
      projects.slice(0, 15).forEach((p, pIdx) => {
        const pId = `proj-${p._id || pIdx}`;
        const pSkills = p.requiredSkills || [];

        rawNodes.push({
          id: pId,
          type: 'project',
          name: p.title || `Project ${pIdx + 1}`,
          description: p.description || 'Collaborative engineering and software project.',
          category: p.category || 'Web Development',
          difficulty: p.difficulty || 'Medium',
          subtitle: `${p.category || 'Web Development'} • ${p.difficulty || 'Medium'}`,
          requiredSkills: pSkills,
          teamSize: p.teamSize || 4,
          memberCount: p.members?.length || 1,
          members: p.members || [],
          owner: p.owner,
          matchScore: p.matchScore || 88,
          raw: p,
          size: 0.44
        });

        // Link project to required skills
        pSkills.forEach((skillName) => {
          const sKey = skillName.trim();
          if (!skillMap.has(sKey)) {
            skillMap.set(sKey, {
              id: `skill-${sKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              type: 'skill',
              name: sKey,
              subtitle: 'Required Skill',
              userCount: 0,
              projectCount: 0,
              totalScoreSum: 0,
              topStudents: [],
              size: 0.28
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

        // Link project to owner
        if (p.owner) {
          const ownerId = `user-${p.owner._id || p.owner}`;
          rawLinks.push({
            id: `link-${pId}-${ownerId}`,
            source: pId,
            target: ownerId,
            relation: 'leads'
          });
        }
      });

      // Calculate Skill Average Scores and add to rawNodes
      skillMap.forEach((s) => {
        const avg = s.userCount > 0 ? (s.totalScoreSum / s.userCount).toFixed(1) : '8.4';
        s.avgScore = `${avg}/10`;
        rawNodes.push(s);
      });

      // 3. Position nodes in 3D volume using spherical Fibonacci distribution
      const total = rawNodes.length;
      rawNodes.forEach((node, i) => {
        let radius = THREE.MathUtils.randFloat(3.8, 7.8);
        if (node.type === 'skill') radius = THREE.MathUtils.randFloat(2.2, 4.8); // inner core
        if (node.type === 'project') radius = THREE.MathUtils.randFloat(5.2, 7.8);
        if (node.type === 'student') radius = THREE.MathUtils.randFloat(4.2, 6.8);

        const phi = Math.acos(-1 + (2 * i) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;

        node.x = radius * Math.cos(theta) * Math.sin(phi);
        node.y = radius * Math.sin(theta) * Math.sin(phi);
        node.z = radius * Math.cos(phi);
      });

      setNodes(rawNodes);
      setLinks(rawLinks);
    } catch (err) {
      console.error('Failed to generate network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Filtered nodes based on Type and Search Query (Feature 5)
  const filteredNodes = useMemo(() => {
    let list = nodes;
    if (selectedType !== 'All') {
      list = list.filter((n) => n.type === selectedType);
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
  }, [nodes, selectedType, searchQuery]);

  // Auto-focus if search yields exactly 1 match
  useEffect(() => {
    if (searchQuery.trim() && filteredNodes.length === 1) {
      setSelectedNode(filteredNodes[0]);
    }
  }, [searchQuery, filteredNodes]);

  // Reset Camera
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setSelectedNode(null);
  };

  // Connected entities for the Inspector Drawer
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

  // Filter connected entities by type for the detail panel
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

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[780px] max-h-[85vh]">
      {/* Top Header & Toolbar */}
      <div className="p-4 sm:p-5 bg-[#111113] border-b border-[#27272A] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#FAFAFA] tracking-tight">
              Interactive 3D Entity Network
            </h3>
            <p className="text-xs text-zinc-400">
              {nodes.length} Nodes • {links.length} Relationships • Real-time Topology
            </p>
          </div>
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#18181B] p-1 rounded-2xl border border-[#27272A] overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'All' },
            { id: 'student', label: 'Students' },
            { id: 'skill', label: 'Skills' },
            { id: 'project', label: 'Projects' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#18181B] border border-[#27272A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 w-36 sm:w-48"
            />
          </div>

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
            onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
            className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-zinc-300 rounded-xl text-xs font-bold border border-[#27272A] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === '3D' ? <List className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === '3D' ? '2D List' : '3D Graph'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Canvas / 2D List Area */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-semibold">Constructing 3D Entity Topology...</p>
          </div>
        ) : viewMode === '3D' ? (
          /* 3D WebGL Canvas */
          <div
            className="w-full h-full relative cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              // FEATURE 3: Clicking empty space clears selection
              if (e.target.tagName === 'CANVAS') {
                setSelectedNode(null);
              }
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 11], fov: 48 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              onPointerMissed={() => setSelectedNode(null)}
            >
              <ambientLight intensity={0.65} />
              <pointLight position={[12, 12, 12]} intensity={1.3} color="#818cf8" />
              <pointLight position={[-12, -12, -12]} intensity={0.9} color="#c084fc" />
              <Suspense fallback={null}>
                <GraphScene
                  nodes={filteredNodes}
                  links={links}
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  searchQuery={searchQuery}
                  onSelectNode={setSelectedNode}
                  onHoverNode={setHoveredNode}
                  autoRotate={autoRotate}
                  prefersReducedMotion={prefersReducedMotion}
                />
                <OrbitControls
                  ref={controlsRef}
                  enableDamping
                  dampingFactor={0.05}
                  rotateSpeed={0.6}
                  zoomSpeed={0.8}
                  minDistance={4}
                  maxDistance={22}
                />
              </Suspense>
            </Canvas>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#111113]/90 backdrop-blur-md border border-[#27272A] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-[11px] font-bold">
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
            </div>

            {/* Interaction Hint */}
            <div className="absolute bottom-4 right-4 z-10 hidden sm:block bg-[#111113]/80 backdrop-blur-sm border border-[#27272A] px-3 py-1.5 rounded-xl text-[10px] text-zinc-400">
              Drag to rotate • Scroll to zoom • Click node to inspect details
            </div>
          </div>
        ) : (
          /* FEATURE 6: 2D List View with Full Detail Panel Support */
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
                      {n.skillScore && (
                        <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-emerald-400" />
                          {n.skillScore}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{n.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{n.subtitle}</p>

                    {/* Quick skill pills */}
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
                        {n.skills.length > 3 && (
                          <span className="text-[10px] text-zinc-500 self-center">
                            +{n.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FEATURE 2 & 7: Rich Responsive Detail Panel (Desktop Right Drawer / Mobile Bottom Sheet) */}
        {selectedNode && (
          <div className="absolute z-30 bg-[#111113]/98 backdrop-blur-2xl border-[#27272A] shadow-2xl p-5 overflow-y-auto space-y-5 animate-in duration-200 w-full sm:w-96 max-h-[75vh] sm:max-h-full bottom-0 sm:bottom-0 right-0 sm:top-0 rounded-t-3xl sm:rounded-none sm:border-l border-t sm:border-t-0">
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
                    {selectedNode.type} Node Details
                  </span>
                  <h4 className="text-base font-extrabold text-white truncate">{selectedNode.name}</h4>
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

            {/* ========================================================================= */}
            {/* STUDENT DETAIL VIEW                                                       */}
            {/* ========================================================================= */}
            {selectedNode.type === 'student' && (
              <div className="space-y-4">
                {/* Score & Availability Banner */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Skill Score
                    </span>
                    <span className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-emerald-400" />
                      {selectedNode.skillScore || '9.2/10'}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Availability
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block truncate">
                      {selectedNode.availability || '15-20 hrs/wk'}
                    </span>
                  </div>
                </div>

                {/* Top Skills List */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Profiled Skills ({selectedNode.skills?.length || 0})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedNode.skills || []).map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-500/30"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connected Matching Projects in Network */}
                {connectedProjects.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Matching Projects ({connectedProjects.length})
                    </h5>
                    <div className="space-y-1.5">
                      {connectedProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedNode(p)}
                          className="p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Actions */}
                <div className="pt-3 border-t border-[#27272A] space-y-2">
                  <Link to="/projects" className="w-full block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Target className="w-4 h-4" />
                      <span>Find Matching Teams</span>
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

            {/* ========================================================================= */}
            {/* SKILL DETAIL VIEW                                                         */}
            {/* ========================================================================= */}
            {selectedNode.type === 'skill' && (
              <div className="space-y-4">
                {/* Stats Banner */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Talent Pool
                    </span>
                    <span className="text-sm font-black text-cyan-400 mt-0.5 block">
                      {selectedNode.userCount || 1} Students
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Avg Score
                    </span>
                    <span className="text-sm font-black text-purple-400 mt-0.5 block">
                      {selectedNode.avgScore || '8.4/10'}
                    </span>
                  </div>
                </div>

                {/* Top Students with this skill */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Connected Students ({connectedStudents.length})
                  </h5>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                          {st.skillScore || '8.8/10'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects Requiring this skill */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Projects Requiring Skill ({connectedProjects.length})
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

                {/* Skill Actions */}
                <div className="pt-3 border-t border-[#27272A]">
                  <Link to="/community" className="w-full block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Find Students with {selectedNode.name}</span>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PROJECT DETAIL VIEW                                                       */}
            {/* ========================================================================= */}
            {selectedNode.type === 'project' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedNode.description || selectedNode.subtitle}
                </p>

                {/* Team Specs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Target Team Size
                    </span>
                    <span className="text-sm font-black text-amber-400 mt-0.5 block">
                      {selectedNode.teamSize || 4} Members
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Difficulty
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {selectedNode.difficulty || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Required Skills ({selectedNode.requiredSkills?.length || 0})
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

                {/* Project Actions */}
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
  );
};
