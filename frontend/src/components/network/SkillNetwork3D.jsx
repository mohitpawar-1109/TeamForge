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
  UserCheck,
  Compass,
  List,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

// Category color mappings
const CATEGORY_COLORS = {
  Frontend: '#06b6d4', // Cyan
  Backend: '#6366f1',  // Indigo
  'AI/ML': '#a855f7',   // Purple/Violet
  Design: '#ec4899',   // Pink/Rose
  DevOps: '#10b981',   // Emerald
  General: '#f59e0b'   // Amber
};

// 3D Graph Canvas Component
const GraphScene = ({
  nodes,
  links,
  selectedNode,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  prefersReducedMotion
}) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden || selectedNode) return;
    if (groupRef.current) {
      // Gentle subtle ambient rotation
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  // Calculate link lines
  const linePositions = useMemo(() => {
    const pos = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    links.forEach(l => {
      const src = nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source);
      const tgt = nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target);

      if (src && tgt) {
        pos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
      }
    });

    return new Float32Array(pos);
  }, [nodes, links]);

  return (
    <group ref={groupRef}>
      {/* Dynamic Network Connection Lines */}
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
            color="#64748b"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* Render 3D Nodes */}
      {nodes.map((node) => {
        const isSkill = node.type === 'skill';
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        // Is this node highlighted due to selected skill or user?
        let isHighlighted = false;
        if (selectedNode) {
          if (selectedNode.type === 'skill' && node.type === 'user') {
            isHighlighted = selectedNode.userIds?.includes(node.id);
          } else if (selectedNode.type === 'user' && node.type === 'skill') {
            isHighlighted = selectedNode.skills?.map(s => s.toLowerCase()).includes(node.name.toLowerCase());
          }
        }

        const baseColor = isSkill
          ? (CATEGORY_COLORS[node.category] || '#6366f1')
          : '#3b82f6';

        const size = isSkill ? Math.min(0.55, 0.28 + (node.userCount || 1) * 0.05) : 0.22;

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
            <mesh scale={isSelected || isHovered ? 1.35 : isHighlighted ? 1.2 : 1}>
              <sphereGeometry args={[size, 24, 24]} />
              <meshStandardMaterial
                color={isSelected ? '#ffffff' : isHighlighted ? '#38bdf8' : baseColor}
                emissive={isSelected ? '#ffffff' : isHighlighted ? '#38bdf8' : baseColor}
                emissiveIntensity={isSelected ? 0.8 : isHighlighted ? 0.6 : isHovered ? 0.4 : 0.2}
                roughness={0.2}
                metalness={0.5}
              />
            </mesh>

            {/* Glowing Ring when selected or highlighted */}
            {(isSelected || isHighlighted) && (
              <mesh scale={1.8}>
                <ringGeometry args={[size * 1.1, size * 1.3, 32]} />
                <meshBasicMaterial
                  color={isSelected ? '#38bdf8' : '#a855f7'}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}

            {/* 3D HTML Label */}
            <Html
              distanceFactor={15}
              center
              position={[0, size + 0.35, 0]}
              className="pointer-events-none select-none"
            >
              <div
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-slate-950 shadow-lg scale-110 border border-brand-400'
                    : isHighlighted
                    ? 'bg-indigo-900/90 text-indigo-100 border border-indigo-400/80 shadow-md'
                    : isHovered
                    ? 'bg-slate-900/90 text-white border border-slate-700 shadow-md'
                    : isSkill
                    ? 'bg-slate-950/70 text-slate-300 border border-slate-800/80'
                    : 'hidden'
                }`}
              >
                {isSkill ? node.name : node.name.split(' ')[0]}
                {isSkill && node.userCount > 1 && (
                  <span className="ml-1 text-[9px] opacity-75">({node.userCount})</span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

export const SkillNetwork3D = ({ initialData }) => {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'list'
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const categories = ['All', 'Frontend', 'Backend', 'AI/ML', 'Design', 'DevOps'];

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch real data from backend
  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:5000/api/users/skill-network?category=${selectedCategory}&search=${encodeURIComponent(search)}`);
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Failed to load skill network');
      }
    } catch (err) {
      console.warn('Backend skill-network endpoint fetch failed, falling back to mock graph data:', err);
      // Generate realistic deterministic fallback if server is offline
      generateFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    const mockSkills = [
      { id: 'skill_react', name: 'React', type: 'skill', category: 'Frontend', userCount: 4, userIds: ['user_1', 'user_2', 'user_4'] },
      { id: 'skill_python', name: 'Python', type: 'skill', category: 'AI/ML', userCount: 5, userIds: ['user_1', 'user_3', 'user_5'] },
      { id: 'skill_node', name: 'Node.js', type: 'skill', category: 'Backend', userCount: 3, userIds: ['user_1', 'user_2'] },
      { id: 'skill_figma', name: 'Figma', type: 'skill', category: 'Design', userCount: 2, userIds: ['user_4'] },
      { id: 'skill_docker', name: 'Docker', type: 'skill', category: 'DevOps', userCount: 3, userIds: ['user_3', 'user_5'] },
      { id: 'skill_ml', name: 'Machine Learning', type: 'skill', category: 'AI/ML', userCount: 3, userIds: ['user_1', 'user_3'] },
      { id: 'skill_tailwind', name: 'Tailwind CSS', type: 'skill', category: 'Frontend', userCount: 4, userIds: ['user_2', 'user_4'] },
      { id: 'skill_mongo', name: 'MongoDB', type: 'skill', category: 'Backend', userCount: 3, userIds: ['user_1', 'user_2'] },
      { id: 'skill_uiux', name: 'UI / UX', type: 'skill', category: 'Design', userCount: 3, userIds: ['user_4'] },
      { id: 'skill_aws', name: 'AWS', type: 'skill', category: 'DevOps', userCount: 2, userIds: ['user_5'] }
    ];

    const mockUsers = [
      { id: 'user_1', type: 'user', name: 'Rahul Sharma', headline: 'Full Stack & AI Engineer', college: 'IIT Bombay', course: 'Computer Science', experienceLevel: 'Experienced', skills: ['React', 'Node.js', 'Python', 'MongoDB', 'Machine Learning'] },
      { id: 'user_2', type: 'user', name: 'Aman Gupta', headline: 'Frontend Craftsman', college: 'BITS Pilani', course: 'Information Systems', experienceLevel: 'Intermediate', skills: ['React', 'Node.js', 'Tailwind CSS', 'MongoDB'] },
      { id: 'user_3', type: 'user', name: 'Kavya Rao', headline: 'AI/ML Researcher', college: 'IIT Delhi', course: 'Data Science', experienceLevel: 'Experienced', skills: ['Python', 'Machine Learning', 'Docker'] },
      { id: 'user_4', type: 'user', name: 'Priya Patel', headline: 'Product & UI/UX Designer', college: 'NID Ahmedabad', course: 'Interaction Design', experienceLevel: 'Intermediate', skills: ['Figma', 'UI / UX', 'Tailwind CSS', 'React'] },
      { id: 'user_5', type: 'user', name: 'Arjun Varma', headline: 'Cloud & DevOps Architect', college: 'NIT Trichy', course: 'Computer Engineering', experienceLevel: 'Experienced', skills: ['Python', 'Docker', 'AWS'] }
    ];

    const mockLinks = [];
    mockUsers.forEach(u => {
      u.skills.forEach(sName => {
        const foundSkill = mockSkills.find(s => s.name.toLowerCase() === sName.toLowerCase());
        if (foundSkill) {
          mockLinks.push({ source: u.id, target: foundSkill.id, type: 'user_skill' });
        }
      });
    });

    setData({
      skills: mockSkills,
      users: mockUsers,
      links: mockLinks,
      totalSkills: mockSkills.length,
      totalUsers: mockUsers.length
    });
  };

  useEffect(() => {
    fetchNetworkData();
  }, [selectedCategory]);

  // Compute 3D node coordinates with spherical layout
  const positionedNodes = useMemo(() => {
    if (!data) return [];
    const skillList = data.skills || [];
    const userList = data.users || [];

    const nodes = [];

    // Place Skill Nodes on an inner sphere
    const skillRadius = 4.2;
    skillList.forEach((skill, idx) => {
      const phi = Math.acos(-1 + (2 * idx) / Math.max(1, skillList.length));
      const theta = Math.sqrt(skillList.length * Math.PI) * phi;

      nodes.push({
        ...skill,
        x: skillRadius * Math.cos(theta) * Math.sin(phi),
        y: skillRadius * Math.sin(theta) * Math.sin(phi),
        z: skillRadius * Math.cos(phi)
      });
    });

    // Place User Nodes on an outer sphere
    const userRadius = 6.8;
    userList.forEach((user, idx) => {
      const phi = Math.acos(-1 + (2 * idx) / Math.max(1, userList.length));
      const theta = Math.sqrt(userList.length * Math.PI) * phi + 0.5;

      nodes.push({
        ...user,
        x: userRadius * Math.cos(theta) * Math.sin(phi),
        y: userRadius * Math.sin(theta) * Math.sin(phi),
        z: userRadius * Math.cos(phi)
      });
    });

    return nodes;
  }, [data]);

  // Filter nodes for search
  const filteredNodes = useMemo(() => {
    if (!search) return positionedNodes;
    const q = search.toLowerCase();
    return positionedNodes.filter(n =>
      n.name.toLowerCase().includes(q) ||
      (n.skills && n.skills.some(s => s.toLowerCase().includes(q)))
    );
  }, [positionedNodes, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNetworkData();
  };

  return (
    <div className="bg-slate-950 rounded-3xl border border-slate-800 text-white overflow-hidden shadow-2xl space-y-0 relative">
      {/* Top Header Section */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>3D Graph Visualizer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Explore the TeamForge Skill Network
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Discover people connected by skills, interests and projects. Click any skill or student node to explore collaborative connections.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start lg:self-auto">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>3D Network</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search skills or students (e.g. React, Python, Figma)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative min-h-[520px] w-full bg-slate-950 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading TeamForge skill network...</p>
          </div>
        ) : viewMode === '3d' ? (
          <>
            {/* 3D WebGL Canvas */}
            <div className="w-full h-[520px] cursor-grab active:cursor-grabbing">
              <Canvas
                camera={{ position: [0, 0, 14], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
              >
                <ambientLight intensity={0.7} />
                <pointLight position={[15, 15, 15]} intensity={1.5} color="#818cf8" />
                <pointLight position={[-15, -15, -15]} intensity={1} color="#c084fc" />

                <Suspense fallback={null}>
                  <GraphScene
                    nodes={filteredNodes}
                    links={data?.links || []}
                    selectedNode={selectedNode}
                    hoveredNode={hoveredNode}
                    onSelectNode={setSelectedNode}
                    onHoverNode={setHoveredNode}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </Suspense>
                <OrbitControls
                  enablePan={false}
                  enableZoom={true}
                  minDistance={7}
                  maxDistance={22}
                  rotateSpeed={0.6}
                  dampingFactor={0.05}
                />
              </Canvas>
            </div>

            {/* Interactive Legend Box */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-xl text-xs space-y-2 select-none pointer-events-auto">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Legend</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{cat}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Student Node</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-500 rounded" />
                  <span>Skill Link</span>
                </div>
              </div>
            </div>

            {/* Instructions Prompt */}
            {!selectedNode && (
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 pointer-events-none">
                💡 <span className="font-semibold text-slate-300">Drag</span> to rotate • <span className="font-semibold text-slate-300">Scroll</span> to zoom • <span className="font-semibold text-slate-300">Click</span> any node to inspect
              </div>
            )}
          </>
        ) : (
          /* Accessible 2D Grid / List View */
          <div className="p-6 max-h-[520px] overflow-y-auto space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
                Skills Catalog ({data?.skills?.length || 0})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {data?.skills?.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedNode(skill)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedNode?.id === skill.id
                        ? 'bg-indigo-600/30 border-indigo-400 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[skill.category] || '#6366f1' }}
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{skill.category}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{skill.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{skill.userCount} student{skill.userCount !== 1 ? 's' : ''}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
                Connected Students ({data?.users?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data?.users?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedNode(user)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedNode?.id === user.id
                        ? 'bg-indigo-600/30 border-indigo-400 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{user.name}</div>
                        <p className="text-xs text-slate-400 line-clamp-1">{user.headline}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {user.skills?.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-medium text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Node Detail Popup Drawer / Card */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-3xl p-5 shadow-2xl animate-fade-in text-white space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    backgroundColor: selectedNode.type === 'skill'
                      ? (CATEGORY_COLORS[selectedNode.category] || '#6366f1')
                      : '#3b82f6'
                  }}
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedNode.type === 'skill' ? `${selectedNode.category} Skill` : 'Student Profile'}
                  </span>
                  <h4 className="text-base font-extrabold text-white leading-tight">
                    {selectedNode.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {selectedNode.type === 'skill' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 mb-1 font-medium">Students proficient in {selectedNode.name}:</div>
                  <div className="text-lg font-black text-indigo-400">
                    {selectedNode.userCount || selectedNode.userIds?.length || 0} Builder{selectedNode.userCount !== 1 ? 's' : ''}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold mb-2">Connected Students:</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(data?.users || [])
                      .filter(u => selectedNode.userIds?.includes(u.id) || u.skills?.some(s => s.toLowerCase() === selectedNode.name.toLowerCase()))
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedNode(u)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/60"
                        >
                          <span className="font-bold text-slate-200">{u.name}</span>
                          <span className="text-[10px] text-indigo-300 font-semibold">{u.experienceLevel}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">{selectedNode.headline}</p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">University</span>
                    <span className="font-bold text-slate-200 line-clamp-1">{selectedNode.college}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">Experience</span>
                    <span className="font-bold text-indigo-400">{selectedNode.experienceLevel}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1.5">Skills ({selectedNode.skills?.length || 0}):</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.skills?.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link to={`/projects`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs font-bold py-2">
                      Invite to Project
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
