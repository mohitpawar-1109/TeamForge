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

// Entity Color System for Nothing OS
const ENTITY_COLORS = {
  student: '#E50914', // Nothing Red
  skill: '#20D47A',   // Green
  project: '#2AA8FF', // Electric Blue
  team: '#F2B705'     // Amber
};

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

  const activeNodeId = selectedNode?.id || hoveredNode?.id;

  return (
    <group ref={groupRef}>
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
            color="#E50914"
            transparent
            opacity={activeNodeId ? 0.15 : 0.25}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

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

        const baseColor = ENTITY_COLORS[node.type] || '#E50914';
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
            <mesh scale={isSelected ? 1.6 : isHovered ? 1.4 : isConnected ? 1.25 : 1}>
              <sphereGeometry args={[nodeSize, 22, 22]} />
              <meshStandardMaterial
                color={isSelected ? '#FFFFFF' : isConnected ? '#FF1F2D' : baseColor}
                emissive={isSelected ? '#FFFFFF' : isConnected ? '#FF1F2D' : baseColor}
                emissiveIntensity={isSelected ? 0.9 : isConnected ? 0.6 : isHovered ? 0.5 : 0.3}
                roughness={0.2}
                metalness={0.4}
              />
            </mesh>

            {(isSelected || isHovered || isConnected) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[nodeSize * 1.3, nodeSize * 1.5, 24]} />
                <meshBasicMaterial
                  color={isSelected ? '#FFFFFF' : baseColor}
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            <Html
              distanceFactor={13}
              center
              position={[0, nodeSize + 0.45, 0]}
              zIndexRange={[2, 5]}
            >
              <div
                className={`bg-[#111111]/95 backdrop-blur-md px-3 py-1 rounded-full shadow-2xl pointer-events-none text-center whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110'
                    : isHovered
                    ? 'border border-[#E50914] shadow-lg scale-105'
                    : isConnected
                    ? 'border border-[#E50914]/60 shadow-md'
                    : 'border border-[#242424]'
                }`}
              >
                <span
                  className="text-[8px] font-mono font-bold uppercase tracking-wider block"
                  style={{ color: baseColor }}
                >
                  {node.type}
                </span>
                <p className="text-[11px] font-mono font-bold text-[#F5F5F5]">{node.name}</p>
              </div>
            </Html>
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState('3D');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const controlsRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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

      skillMap.forEach((s) => rawNodes.push(s));

      const total = rawNodes.length;
      rawNodes.forEach((node, i) => {
        let radius = THREE.MathUtils.randFloat(3.5, 7.5);
        if (node.type === 'skill') radius = THREE.MathUtils.randFloat(2.0, 4.5);
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

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setSelectedNode(null);
  };

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
    <div className="bg-[#111111] border border-[#242424] rounded-3xl overflow-hidden shadow-soft relative flex flex-col h-[780px] max-h-[85vh]">
      {/* Top Header & Toolbar - z-10 */}
      <div className="p-4 sm:p-5 bg-[#161616] border-b border-[#242424] flex flex-wrap items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#242424] text-[#E50914] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">
              Interactive 3D Entity Network
            </h3>
            <p className="text-xs font-mono text-[#888888]">
              {nodes.length} Nodes • {links.length} Relationships • Real-time Graph
            </p>
          </div>
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-full border border-[#242424] overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'All' },
            { id: 'student', label: 'Students' },
            { id: 'skill', label: 'Skills' },
            { id: 'project', label: 'Projects' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111111] border border-[#242424] rounded-full pl-8 pr-3 py-1.5 text-xs font-mono text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E50914] w-36 sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-[#111111] text-white border-[#333333]'
                : 'bg-[#111111] text-[#888888] border-[#242424]'
            }`}
            title="Toggle Auto-Rotation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin-slow text-[#E50914]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3D' ? '2D' : '3D')}
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#202020] text-[#F5F5F5] rounded-full text-xs font-mono font-bold border border-[#242424] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === '3D' ? <List className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === '3D' ? '2D List' : '3D Graph'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="px-3 py-1.5 bg-[#161616] hover:bg-[#202020] border border-[#242424] text-[#F5F5F5] rounded-full text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Canvas / 2D List Area - z-1 */}
      <div className="flex-1 relative overflow-hidden bg-[#050505] z-[1]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#888888]">Constructing 3D Entity Topology...</p>
          </div>
        ) : viewMode === '3D' ? (
          <div className="w-full h-full relative cursor-grab active:cursor-grabbing z-[1]">
            <Canvas
              camera={{ position: [0, 0, 11], fov: 48 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              className="z-[1]"
            >
              <ambientLight intensity={0.65} />
              <pointLight position={[12, 12, 12]} intensity={1.3} color="#E50914" />
              <pointLight position={[-12, -12, -12]} intensity={0.9} color="#FFFFFF" />
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

            {/* Bottom Legend - z-10 */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#111111]/90 backdrop-blur-md border border-[#242424] px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-3 text-[10px] font-mono font-bold">
              <span className="text-[#666666] uppercase text-[9px]">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                <span className="text-[#F5F5F5]">Students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#20D47A]" />
                <span className="text-[#F5F5F5]">Skills</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2AA8FF]" />
                <span className="text-[#F5F5F5]">Projects</span>
              </div>
            </div>

            {/* Interaction Hint - z-10 */}
            <div className="absolute bottom-4 right-4 z-10 hidden sm:block bg-[#111111]/80 backdrop-blur-sm border border-[#242424] px-3 py-1 rounded-full text-[10px] font-mono text-[#666666]">
              Drag to rotate • Scroll to zoom • Click node to inspect
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto h-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-4 rounded-3xl bg-[#111111] border transition-all cursor-pointer ${
                    selectedNode?.id === n.id
                      ? 'border-[#E50914] shadow-md'
                      : 'border-[#242424] hover:border-[#333333]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
                      style={{
                        backgroundColor: `${ENTITY_COLORS[n.type]}20`,
                        color: ENTITY_COLORS[n.type]
                      }}
                    >
                      {n.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F5F5]">{n.name}</h4>
                  <p className="text-xs font-mono text-[#888888] mt-0.5 truncate">{n.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Relationship Inspector / Project Details Drawer - z-index: 1100 */}
        {selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#111111]/98 backdrop-blur-xl border-l border-[#242424] p-5 overflow-y-auto space-y-5 shadow-2xl z-[1100]">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                  style={{ backgroundColor: ENTITY_COLORS[selectedNode.type] || '#E50914' }}
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
                    className="text-[9px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: ENTITY_COLORS[selectedNode.type] }}
                  >
                    {selectedNode.type} DETAILS
                  </span>
                  <h4 className="text-base font-bold text-[#F5F5F5]">{selectedNode.name}</h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-[#888888] hover:text-white rounded-full hover:bg-[#161616] cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono text-[#D0D0D0] leading-relaxed">{selectedNode.subtitle}</p>
              {selectedNode.experienceLevel && (
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#161616] text-[#A1A1A1] border border-[#242424]">
                  {selectedNode.experienceLevel} Level
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Connected Entities ({connectedEntities.length})</span>
              </h5>

              {connectedEntities.length === 0 ? (
                <p className="text-xs font-mono text-[#666666] italic">No direct connections discovered.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {connectedEntities.map((conn) => (
                    <div
                      key={conn.id}
                      onClick={() => setSelectedNode(conn)}
                      className="p-2.5 rounded-2xl bg-[#161616] hover:bg-[#202020] border border-[#242424] transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ENTITY_COLORS[conn.type] }}
                          />
                          <span className="text-xs font-mono font-bold text-[#F5F5F5] truncate">
                            {conn.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#888888] capitalize">{conn.type}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#888888] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#1F1F1F] space-y-2">
              {selectedNode.type === 'project' && (
                <Link
                  to={`/projects/${selectedNode.raw?._id || ''}`}
                  className="w-full block"
                >
                  <button
                    type="button"
                    className="w-full py-2.5 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all text-center cursor-pointer shadow-[0_0_12px_rgba(229,9,20,0.4)]"
                  >
                    View Project Workspace
                  </button>
                </Link>
              )}

              {selectedNode.type === 'student' && (
                <Link to="/groups" className="w-full block">
                  <button
                    type="button"
                    className="w-full py-2.5 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(229,9,20,0.4)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Student</span>
                  </button>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-full py-2 bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white rounded-full text-xs font-mono transition-all cursor-pointer border border-[#242424]"
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
