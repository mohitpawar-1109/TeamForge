import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
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
  CheckCircle2
} from 'lucide-react';
import { Button } from '../common/Button';

// 3D Network Graph Scene (Floating Nodes & Interconnected Lines)
const NetworkScene = ({ prefersReducedMotion }) => {
  const groupRef = useRef();
  const linesMeshRef = useRef();

  // Generate 32 nodes representing students, skills, and hackathon teams
  const { initialPositions, velocities, colors } = useMemo(() => {
    const count = 32;
    const pos = new Float32Array(count * 3);
    const vels = [];
    const cols = [];

    const palette = [
      new THREE.Color('#6366f1'), // Brand Indigo
      new THREE.Color('#8b5cf6'), // Violet
      new THREE.Color('#38bdf8'), // Sky Blue
      new THREE.Color('#10b981'), // Emerald
      new THREE.Color('#f43f5e'), // Rose Accent
      new THREE.Color('#a855f7')  // Purple
    ];

    for (let i = 0; i < count; i++) {
      // Spread nodes in a rounded 3D volume
      const radius = THREE.MathUtils.randFloat(3, 8.5);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(-Math.PI / 3, Math.PI / 3);

      pos[i * 3] = radius * Math.cos(phi) * Math.sin(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.cos(theta);

      vels.push({
        x: THREE.MathUtils.randFloatSpread(0.004),
        y: THREE.MathUtils.randFloatSpread(0.003),
        z: THREE.MathUtils.randFloatSpread(0.004)
      });

      const chosenColor = palette[i % palette.length];
      cols.push(chosenColor.r, chosenColor.g, chosenColor.b);
    }

    return { initialPositions: pos, velocities: vels, colors: cols };
  }, []);

  const nodePositions = useRef(new Float32Array(initialPositions));

  // Update positions & connection lines on each frame
  useFrame((state, delta) => {
    if (prefersReducedMotion || document.hidden) return;

    const time = state.clock.getElapsedTime();
    const count = velocities.length;
    const positions = nodePositions.current;

    // Gentle floating motion for each node
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] += velocities[i].x;
      positions[idx + 1] += Math.sin(time * 0.8 + i) * 0.003;
      positions[idx + 2] += velocities[i].z;

      // Bound within sphere
      const dist = Math.sqrt(
        positions[idx] ** 2 + positions[idx + 1] ** 2 + positions[idx + 2] ** 2
      );
      if (dist > 9.5) {
        velocities[i].x *= -1;
        velocities[i].z *= -1;
      }
    }

    // Connect nodes within proximity threshold
    const linePositions = [];
    const maxDistance = 3.6;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const iIdx = i * 3;
        const jIdx = j * 3;

        const dx = positions[iIdx] - positions[jIdx];
        const dy = positions[iIdx + 1] - positions[jIdx + 1];
        const dz = positions[iIdx + 2] - positions[jIdx + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (d < maxDistance) {
          linePositions.push(
            positions[iIdx],
            positions[iIdx + 1],
            positions[iIdx + 2],
            positions[jIdx],
            positions[jIdx + 1],
            positions[jIdx + 2]
          );
        }
      }
    }

    if (linesMeshRef.current) {
      linesMeshRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
    }

    // Subtle group rotation for cinematic depth
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
      groupRef.current.rotation.x = Math.sin(time * 0.03) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      {/* Node Spheres */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={initialPositions.length / 3}
            array={initialPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={new Float32Array(colors)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.24}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* Dynamic Network Connection Lines */}
      <lineSegments ref={linesMeshRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

// Fallback background for devices without WebGL or with reduced motion
const FallbackNetworkBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-brand-600/15 via-indigo-500/15 to-violet-600/15 rounded-full blur-3xl" />
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

  const floatingBadges = [
    { label: '🟣 ML Developer', delay: '0s', pos: 'top-12 left-4 sm:left-10' },
    { label: '🔵 UI/UX Designer', delay: '1s', pos: 'top-20 right-4 sm:right-12' },
    { label: '🟢 Backend Architect', delay: '2s', pos: 'bottom-24 left-6 sm:left-16' },
    { label: '🎯 94% Skill Match', delay: '1.5s', pos: 'bottom-20 right-6 sm:right-20' },
    { label: '⚡ Smart India Hackathon', delay: '0.5s', pos: 'top-1/2 left-2 sm:left-6' }
  ];

  return (
    <section className="relative min-h-[640px] md:min-h-[720px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      {/* 3D WebGL Canvas Layer */}
      {hasWebGL && !prefersReducedMotion ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 9], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            frameloop="always"
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#818cf8" />
            <pointLight position={[-10, -10, -10]} intensity={0.8} color="#c084fc" />
            <Suspense fallback={null}>
              <NetworkScene prefersReducedMotion={prefersReducedMotion} />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <FallbackNetworkBackground />
      )}

      {/* Ambient Radial Gradient Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(99,102,241,0.22),transparent_70%)] pointer-events-none -z-0" />

      {/* Floating Semantic Micro-Badges */}
      {floatingBadges.map((badge, idx) => (
        <div
          key={idx}
          className={`hidden lg:inline-flex absolute ${badge.pos} items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-slate-200 shadow-xl pointer-events-none animate-float-slow select-none`}
          style={{ animationDelay: badge.delay }}
        >
          <span>{badge.label}</span>
        </div>
      ))}

      {/* Hero Content (Clean, Accessible, SEO-Friendly HTML) */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs font-bold tracking-wider uppercase shadow-inner">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>AI-Powered Student Teammate & Project Network</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
          Build the right team. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-teal-300 bg-clip-text text-transparent">
            Build something great.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          AI-powered collaboration for students, developers and builders. Connect through verified skills, hackathon goals, and shared project vision.
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
              Find Teammates
            </Button>
          </Link>

          <Link to="/community">
            <Button
              variant="outline"
              size="lg"
              icon={Compass}
              className="text-white border-white/25 hover:bg-white/10 backdrop-blur-sm px-7 py-3.5 rounded-2xl font-bold"
            >
              Explore Community
            </Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AI Resume & Skill Gap Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Transparent Compatibility Scores</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Integrated Project Workspaces</span>
          </div>
        </div>
      </div>
    </section>
  );
};
