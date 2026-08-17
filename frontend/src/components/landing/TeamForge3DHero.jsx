import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Users,
  Brain,
  Code2,
  Layers,
  Zap,
  CheckCircle2,
  Trophy,
  ExternalLink
} from 'lucide-react';
import { Button } from '../common/Button';

// Pre-defined interactive sample entities in the 3D network
const SAMPLE_HERO_NODES = [
  { id: 'n1', label: 'Mohit (Lead Dev)', type: 'student', color: '#06b6d4', size: 0.35, role: 'Full Stack & ML' },
  { id: 'n2', label: 'Priya (UI/UX)', type: 'student', color: '#ec4899', size: 0.32, role: 'Design Lead' },
  { id: 'n3', label: 'Aarav (Backend)', type: 'student', color: '#3b82f6', size: 0.32, role: 'Cloud & Node.js' },
  { id: 'n4', label: 'AI Resume Scanner', type: 'project', color: '#f59e0b', size: 0.42, category: 'AI / ML Project' },
  { id: 'n5', label: 'Campus Eco-Forge', type: 'project', color: '#10b981', size: 0.38, category: 'Sustainability' },
  { id: 'n6', label: 'React.js', type: 'skill', color: '#6366f1', size: 0.28, category: 'Frontend' },
  { id: 'n7', label: 'Python & FastAPI', type: 'skill', color: '#8b5cf6', size: 0.28, category: 'Backend' },
  { id: 'n8', label: 'Machine Learning', type: 'skill', color: '#a855f7', size: 0.3, category: 'AI' },
  { id: 'n9', label: 'Cloud Squad Alpha', type: 'team', color: '#10b981', size: 0.4, members: '4 Formed' },
  { id: 'n10', label: 'Global AI Hackathon', type: 'hackathon', color: '#f43f5e', size: 0.42, prize: '$45,000' },
  { id: 'n11', label: 'DevOps & Docker', type: 'skill', color: '#06b6d4', size: 0.26, category: 'Cloud' },
  { id: 'n12', label: 'Ananya (Frontend)', type: 'student', color: '#06b6d4', size: 0.3, role: 'React Engineer' }
];

// Interactive 3D Node Mesh with Hover & Click
const HeroNodeMesh = ({ node, isHovered, onHover, onClick }) => {
  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        scale={isHovered ? 1.45 : 1}
      >
        <sphereGeometry args={[node.size, 20, 20]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isHovered ? 0.9 : 0.35}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>

      {/* Floating Tag over hovered or featured nodes */}
      {isHovered && (
        <Html distanceFactor={14} center position={[0, node.size + 0.4, 0]}>
          <div className="bg-[#18181B]/95 backdrop-blur-md border border-indigo-500/60 px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none text-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs font-black text-white">{node.label}</p>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
              {node.role || node.category || node.prize || node.type}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Network Graph Scene (Floating Interactive Nodes & Connection Lines)
const NetworkScene = ({ prefersReducedMotion, hoveredNode, setHoveredNode, setSelectedNode }) => {
  const groupRef = useRef();
  const linesRef = useRef();

  // Generate initial node distribution
  const nodes = useMemo(() => {
    return SAMPLE_HERO_NODES.map((n, i) => {
      const radius = THREE.MathUtils.randFloat(3.2, 7.5);
      const theta = (i / SAMPLE_HERO_NODES.length) * Math.PI * 2 + THREE.MathUtils.randFloat(-0.2, 0.2);
      const phi = THREE.MathUtils.randFloat(-0.4, 0.5);

      return {
        ...n,
        x: radius * Math.cos(phi) * Math.sin(theta),
        y: radius * Math.sin(phi),
        z: radius * Math.cos(phi) * Math.cos(theta) - 1,
        vx: THREE.MathUtils.randFloatSpread(0.003),
        vy: THREE.MathUtils.randFloatSpread(0.002),
        vz: THREE.MathUtils.randFloatSpread(0.003)
      };
    });
  }, []);

  const nodePositions = useRef(nodes);

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden) return;

    const time = state.clock.getElapsedTime();
    const curNodes = nodePositions.current;

    // Gentle floating motion
    curNodes.forEach((node, i) => {
      node.x += node.vx;
      node.y += Math.sin(time * 0.7 + i) * 0.0025;
      node.z += node.vz;

      const dist = Math.sqrt(node.x ** 2 + node.y ** 2 + node.z ** 2);
      if (dist > 8.5) {
        node.vx *= -1;
        node.vz *= -1;
      }
    });

    // Dynamic proximity connection lines
    const linePos = [];
    const maxDist = 4.2;

    for (let i = 0; i < curNodes.length; i++) {
      for (let j = i + 1; j < curNodes.length; j++) {
        const ni = curNodes[i];
        const nj = curNodes[j];

        const dx = ni.x - nj.x;
        const dy = ni.y - nj.y;
        const dz = ni.z - nj.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (d < maxDist) {
          linePos.push(ni.x, ni.y, ni.z, nj.x, nj.y, nj.z);
        }
      }
    }

    if (linesRef.current) {
      linesRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePos, 3)
      );
    }

    if (groupRef.current && !hoveredNode) {
      groupRef.current.rotation.y = time * 0.04;
      groupRef.current.rotation.x = Math.sin(time * 0.02) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Interactive Node Spheres */}
      {nodes.map((node) => (
        <HeroNodeMesh
          key={node.id}
          node={node}
          isHovered={hoveredNode?.id === node.id}
          onHover={setHoveredNode}
          onClick={setSelectedNode}
        />
      ))}

      {/* Dynamic Network Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

// Fallback background for devices without WebGL
const FallbackNetworkBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-purple-500/15 to-pink-600/15 rounded-full blur-3xl" />
    <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.5" fill="#6366f1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  </div>
);

export const TeamForge3DHero = () => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <section className="relative min-h-[660px] md:min-h-[740px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#09090B] via-[#0D0F18] to-[#09090B] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      {/* 3D WebGL Canvas Layer */}
      {hasWebGL && !prefersReducedMotion ? (
        <div className="absolute inset-0 z-0">
          <Canvas
            camera={{ position: [0, 0, 9.5], fov: 48 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            frameloop="always"
          >
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1.4} color="#818cf8" />
            <pointLight position={[-10, -10, -10]} intensity={0.9} color="#c084fc" />
            <Suspense fallback={null}>
              <NetworkScene
                prefersReducedMotion={prefersReducedMotion}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                setSelectedNode={setSelectedNode}
              />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                rotateSpeed={0.5}
                dampingFactor={0.05}
              />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <FallbackNetworkBackground />
      )}

      {/* Ambient Radial Gradient Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(99,102,241,0.2),transparent_75%)] pointer-events-none -z-0" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pointer-events-auto">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs font-bold tracking-wider uppercase shadow-inner">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Interactive 3D Student & Skill Network</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
          Build the right team. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-teal-300 bg-clip-text text-transparent">
            Build something great.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          AI-powered collaboration for students, developers and builders. Connect through verified skills, hackathon goals, and shared project vision in an interactive graph.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/projects">
            <Button
              variant="gradient"
              size="lg"
              icon={ArrowRight}
              className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold shadow-lg shadow-indigo-500/25 px-8 py-3.5 rounded-2xl border-0"
            >
              Explore Projects
            </Button>
          </Link>

          <Link to="/network">
            <Button
              variant="outline"
              size="lg"
              icon={Compass}
              className="text-white border-white/25 hover:bg-white/10 backdrop-blur-sm px-7 py-3.5 rounded-2xl font-bold"
            >
              Explore 3D Network
            </Button>
          </Link>
        </div>

        {/* Live Interaction Hint */}
        <p className="text-[11px] font-semibold text-zinc-400 pt-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Click and drag on the background to rotate the live 3D student network</span>
        </p>
      </div>

      {/* Selected Node Modal / Slideup if user clicks on a node in hero */}
      {selectedNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#18181B]/95 backdrop-blur-md border border-indigo-500/60 p-4 rounded-3xl shadow-2xl flex items-center gap-4 max-w-md w-full animate-in slide-in-from-bottom-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
            style={{ backgroundColor: selectedNode.color }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-white truncate">{selectedNode.label}</h4>
            <p className="text-xs text-zinc-400 capitalize">{selectedNode.role || selectedNode.category || selectedNode.type}</p>
          </div>
          <Link to={selectedNode.type === 'project' ? '/projects' : '/network'}>
            <button
              type="button"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              View
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
};
