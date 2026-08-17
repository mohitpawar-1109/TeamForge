import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  Search,
  Filter,
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
  MessageSquare
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

  // Calculate dynamic line positions
  const linePositions = useMemo(() => {
    const pos = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    links.forEach((l) => {
      const src = nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source);
      const tgt = nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target);

      if (src && tgt) {
        pos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
      }
    });

    return new Float32Array(pos);
  }, [nodes, links]);

  // Check if a link is active based on selection or hover
  const activeNodeId = selectedNode?.id || hoveredNode?.id;

  return (
    <group ref={groupRef}>
      {/* Network Connection Lines */}
      {linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={linePositions.length / 3}
              array={linePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#6366f1"
            transparent
            opacity={activeNodeId ? 0.15 : 0.25}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* Render 3D Nodes */}
      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        // Relationship highlighting: check if connected to active node
        let isConnected = false;
        if (activeNodeId) {
          isConnected = links.some((l) => {
            const srcId = typeof l.source === 'object' ? l.source.id : l.source;
            const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
            return (
              (srcId === activeNodeId && tgtId === node.id) ||
              (tgtId === activeNodeId && srcId === node.id)
            );
          });
        }

        const baseColor = ENTITY_COLORS[node.type] || '#6366f1';
        const nodeSize = node.size || 0.32;

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
            <mesh scale={isSelected ? 1.6 : isHovered ? 1.4 : isConnected ? 1.25 : 1}>
              <sphereGeometry args={[nodeSize, 22, 22]} />
              <meshStandardMaterial
                color={isSelected ? '#ffffff' : isConnected ? '#38bdf8' : baseColor}
                emissive={isSelected ? '#ffffff' : isConnected ? '#38bdf8' : baseColor}
                emissiveIntensity={isSelected ? 0.9 : isConnected ? 0.6 : isHovered ? 0.5 : 0.25}
                roughness={0.2}
                metalness={0.4}
              />
            </mesh>

            {/* Glowing Ring when selected or hovered */}
            {(isSelected || isHovered || isConnected) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[nodeSize * 1.3, nodeSize * 1.5, 24]} />
                <meshBasicMaterial
                  color={isSelected ? '#ffffff' : baseColor}
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* HTML Label on hover / selection */}
            {(isHovered || isSelected) && (
              <Html distanceFactor={13} center position={[0, nodeSize + 0.45, 0]}>
                <div className="bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none text-center whitespace-nowrap animate-in fade-in zoom-in-95">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider block"
                    style={{ color: baseColor }}
                  >
                    {node.type}
                  </span>
                  <p className="text-xs font-extrabold text-white">{node.name}</p>
                  {node.subtitle && (
                    <p className="text-[10px] text-zinc-400">{node.subtitle}</p>
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
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All'); // 'All' | 'student' | 'skill' | 'project' | 'team'
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

      // Fallback mock seeds if API has sparse items
      const skillMap = new Map();
      const rawNodes = [];
      const rawLinks = [];

      // 1. Process Skills and Students
      users.slice(0, 16).forEach((u, uIdx) => {
        const uId = `user-${u._id || uIdx}`;
        const uSkills = (u.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);

        rawNodes.push({
          id: uId,
          type: 'student',
          name: u.name || `Student ${uIdx + 1}`,
          subtitle: u.headline || 'Software Developer',
          experienceLevel: u.experienceLevel || 'Intermediate',
          skills: uSkills,
          raw: u,
          size: 0.32
        });

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
              size: 0.28
            });
          }
          const sObj = skillMap.get(sKey);
          sObj.userCount += 1;

          rawLinks.push({
            id: `link-${uId}-${sObj.id}`,
            source: uId,
            target: sObj.id,
            relation: 'possesses'
          });
        });
      });

      // 2. Process Projects
      projects.slice(0, 12).forEach((p, pIdx) => {
        const pId = `proj-${p._id || pIdx}`;
        const pSkills = p.requiredSkills || [];

        rawNodes.push({
          id: pId,
          type: 'project',
          name: p.title || `Project ${pIdx + 1}`,
          subtitle: `${p.category || 'Engineering'} • ${p.difficulty || 'Medium'}`,
          requiredSkills: pSkills,
          teamSize: p.teamSize || 4,
          memberCount: p.members?.length || 1,
          raw: p,
          size: 0.42
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

        // Link project to owner/members
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

      // Add all skills as nodes
      skillMap.forEach((s) => rawNodes.push(s));

      // 3. Position nodes in 3D volume using spherical clustering
      const total = rawNodes.length;
      rawNodes.forEach((node, i) => {
        let radius = THREE.MathUtils.randFloat(3.5, 7.5);
        if (node.type === 'skill') radius = THREE.MathUtils.randFloat(2.0, 4.5); // inner core
        if (node.type === 'project') radius = THREE.MathUtils.randFloat(5.0, 7.0);
        if (node.type === 'student') radius = THREE.MathUtils.randFloat(4.0, 6.5);

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

  // Filtered nodes based on Type and Search Query
  const filteredNodes = useMemo(() => {
    let list = nodes;
    if (selectedType !== 'All') {
      list = list.filter((n) => n.type === selectedType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.subtitle && n.subtitle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [nodes, selectedType, searchQuery]);

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

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[780px] max-h-[85vh]">
      {/* Top Header & Toolbar */}
      <div className="p-4 sm:p-5 bg-[#111113] border-b border-[#27272A] flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#FAFAFA] tracking-tight">
              Interactive 3D Entity Network
            </h3>
            <p className="text-xs text-zinc-400">
              {nodes.length} Nodes • {links.length} Relationships • Real-time Graph
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
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
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
            className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-zinc-300 rounded-xl text-xs font-bold border border-[#27272A] transition-all flex items-center gap-1.5"
          >
            {viewMode === '3D' ? <List className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === '3D' ? '2D List' : '3D Graph'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-200 rounded-xl text-xs font-bold transition-all"
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
          <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <Canvas
              camera={{ position: [0, 0, 11], fov: 48 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
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
              Drag to rotate • Scroll to zoom • Click node to inspect
            </div>
          </div>
        ) : (
          /* 2D List View */
          <div className="p-6 overflow-y-auto h-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-4 rounded-2xl bg-[#111113] border transition-all cursor-pointer ${
                    selectedNode?.id === n.id
                      ? 'border-indigo-500 shadow-md'
                      : 'border-[#27272A] hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase"
                      style={{
                        backgroundColor: `${ENTITY_COLORS[n.type]}20`,
                        color: ENTITY_COLORS[n.type]
                      }}
                    >
                      {n.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{n.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{n.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Relationship Inspector Drawer (When node is clicked) */}
        {selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#111113]/98 backdrop-blur-xl border-l border-[#27272A] p-5 overflow-y-auto space-y-5 shadow-2xl z-20 animate-in slide-in-from-right-8 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#27272A]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: ENTITY_COLORS[selectedNode.type] || '#6366f1' }}
                >
                  {selectedNode.type === 'student' ? (
                    <Users className="w-5 h-5" />
                  ) : selectedNode.type === 'project' ? (
                    <FolderKanban className="w-5 h-5" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider"
                    style={{ color: ENTITY_COLORS[selectedNode.type] }}
                  >
                    {selectedNode.type} Details
                  </span>
                  <h4 className="text-base font-extrabold text-white">{selectedNode.name}</h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-[#27272A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entity Stats & Subtitle */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">{selectedNode.subtitle}</p>
              {selectedNode.experienceLevel && (
                <Badge variant="brand">{selectedNode.experienceLevel} Level</Badge>
              )}
            </div>

            {/* Connected Relationships */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Connected Entities ({connectedEntities.length})</span>
              </h5>

              {connectedEntities.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No direct connections discovered.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {connectedEntities.map((conn) => (
                    <div
                      key={conn.id}
                      onClick={() => setSelectedNode(conn)}
                      className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ENTITY_COLORS[conn.type] }}
                          />
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {conn.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 capitalize">{conn.type}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-[#27272A] space-y-2">
              {selectedNode.type === 'project' && (
                <Link
                  to={`/projects/${selectedNode.raw?._id || ''}`}
                  className="w-full block"
                >
                  <button
                    type="button"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all text-center"
                  >
                    View Project Workspace
                  </button>
                </Link>
              )}

              {selectedNode.type === 'student' && (
                <Link to="/groups" className="w-full block">
                  <button
                    type="button"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Student</span>
                  </button>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-full py-2 bg-[#27272A] hover:bg-[#3F3F46] text-zinc-300 rounded-xl text-xs font-semibold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
