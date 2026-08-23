import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  ArrowRight,
  Compass
} from 'lucide-react';
import { Button } from '../common/Button';

// Pre-defined interactive sample entities in Nothing OS palette
const SAMPLE_HERO_NODES = [
  { id: 'n1', label: 'Mohit (Lead Dev)', type: 'student', color: '#E50914', size: 0.35, role: 'Full Stack & ML' },
  { id: 'n2', label: 'Priya (UI/UX)', type: 'student', color: '#FFFFFF', size: 0.32, role: 'Design Lead' },
  { id: 'n3', label: 'Aarav (Backend)', type: 'student', color: '#E50914', size: 0.32, role: 'Cloud & Node.js' },
  { id: 'n4', label: 'AI Resume Scanner', type: 'project', color: '#2AA8FF', size: 0.42, category: 'AI / ML Project' },
  { id: 'n5', label: 'Campus Eco-Forge', type: 'project', color: '#20D47A', size: 0.38, category: 'Sustainability' },
  { id: 'n6', label: 'React.js', type: 'skill', color: '#FFFFFF', size: 0.28, category: 'Frontend' },
  { id: 'n7', label: 'Python & FastAPI', type: 'skill', color: '#E50914', size: 0.28, category: 'Backend' },
  { id: 'n8', label: 'Machine Learning', type: 'skill', color: '#20D47A', size: 0.3, category: 'AI' },
  { id: 'n9', label: 'Cloud Squad Alpha', type: 'team', color: '#F2B705', size: 0.4, members: '4 Formed' },
  { id: 'n10', label: 'Global AI Hackathon', type: 'hackathon', color: '#E50914', size: 0.42, prize: '$45,000' },
  { id: 'n11', label: 'DevOps & Docker', type: 'skill', color: '#2AA8FF', size: 0.26, category: 'Cloud' },
  { id: 'n12', label: 'Ananya (Frontend)', type: 'student', color: '#FFFFFF', size: 0.3, role: 'React Engineer' }
];

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
          emissiveIntensity={isHovered ? 0.9 : 0.3}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {isHovered && (
        <Html distanceFactor={14} center position={[0, node.size + 0.4, 0]}>
          <div className="bg-[#111111]/95 backdrop-blur-md border border-[#E50914] px-3 py-1.5 rounded-full shadow-2xl pointer-events-none text-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs font-mono font-bold text-[#F5F5F5]">{node.label}</p>
            <p className="text-[9px] font-mono text-[#888888] uppercase tracking-wider">
              {node.role || node.category || node.prize || node.type}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

const NetworkScene = ({ prefersReducedMotion, hoveredNode, setHoveredNode, setSelectedNode }) => {
  const groupRef = useRef();
  const linesRef = useRef();

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
      {nodes.map((node) => (
        <HeroNodeMesh
          key={node.id}
          node={node}
          isHovered={hoveredNode?.id === node.id}
          onHover={setHoveredNode}
          onClick={setSelectedNode}
        />
      ))}

      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#E50914"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

const FallbackNetworkBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#E50914]/10 via-transparent to-transparent rounded-full blur-3xl" />
  </div>
);

export const TeamForge3DHero = () => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

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
    <section className="relative min-h-[660px] md:min-h-[740px] flex items-center justify-center overflow-hidden bg-black text-[#F5F5F5] pt-20 pb-24 px-4 sm:px-6 lg:px-8">
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
            <pointLight position={[10, 10, 10]} intensity={1.4} color="#E50914" />
            <pointLight position={[-10, -10, -10]} intensity={0.9} color="#FFFFFF" />
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(229,9,20,0.1),transparent_75%)] pointer-events-none -z-0" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111]/80 backdrop-blur-md border border-[#242424] text-[#A1A1A1] text-[10px] font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
          <span>Interactive 3D Student & Skill Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
          Build the right team. <br />
          <span className="text-[#E50914]">
            Build something great.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#888888] font-mono max-w-2xl mx-auto leading-relaxed">
          AI-powered collaboration for students, developers and builders. Connect through verified skills, hackathon goals, and shared project vision in an interactive graph.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/projects">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
            >
              Explore Projects
            </Button>
          </Link>

          <Link to="/network">
            <Button
              variant="outline"
              size="lg"
              icon={Compass}
            >
              Explore 3D Network
            </Button>
          </Link>
        </div>

        <p className="text-[10px] font-mono text-[#666666] pt-2 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
          <span>Click and drag on the background to rotate the live 3D student network</span>
        </p>
      </div>

      {selectedNode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[#111111]/95 backdrop-blur-md border border-[#242424] p-4 rounded-3xl shadow-2xl flex items-center gap-4 max-w-md w-full animate-in slide-in-from-bottom-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
            style={{ backgroundColor: selectedNode.color }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-mono font-bold text-[#F5F5F5] truncate">{selectedNode.label}</h4>
            <p className="text-[10px] font-mono text-[#888888] capitalize">{selectedNode.role || selectedNode.category || selectedNode.type}</p>
          </div>
          <Link to={selectedNode.type === 'project' ? '/projects' : '/network'}>
            <button
              type="button"
              className="px-3 py-1 bg-[#E50914] hover:bg-[#FF1F2D] text-white rounded-full text-xs font-mono font-bold transition-all"
            >
              View
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="p-1 text-[#888888] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
};
