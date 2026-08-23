import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Users,
  Code2,
  FolderKanban,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { Badge } from '../common/Badge';

// 3D Team Topology Scene
const TeamScene = ({
  projectTitle,
  members = [],
  requiredSkills = [],
  hoveredNode,
  setHoveredNode,
  selectedNode,
  setSelectedNode,
  autoRotate,
  prefersReducedMotion
}) => {
  const groupRef = useRef();

  const { nodes, links } = useMemo(() => {
    const nList = [];
    const lList = [];

    // 1. Center Node: Project
    const centerNode = {
      id: 'project-center',
      type: 'project',
      label: projectTitle || 'Project Core',
      x: 0,
      y: 0,
      z: 0,
      size: 0.55,
      color: '#E50914' // Nothing Red
    };
    nList.push(centerNode);

    // 2. Member Nodes (Inner Ring, radius ~3.2)
    const mCount = Math.max(1, members.length);
    members.forEach((m, idx) => {
      const theta = (idx / mCount) * Math.PI * 2;
      const x = 3.2 * Math.cos(theta);
      const y = (idx % 2 === 0 ? 0.6 : -0.6);
      const z = 3.2 * Math.sin(theta);

      const mId = `member-${m.user?._id || idx}`;
      const mName = m.user?.name || `Member ${idx + 1}`;
      const mSkills = (m.user?.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);

      const memberNode = {
        id: mId,
        type: 'member',
        label: mName,
        role: m.role || 'Contributor',
        skills: mSkills,
        x,
        y,
        z,
        size: 0.38,
        color: '#FFFFFF' // White
      };
      nList.push(memberNode);

      lList.push({
        source: mId,
        target: 'project-center',
        color: '#FFFFFF'
      });
    });

    // 3. Skill Nodes (Outer Ring, radius ~5.5)
    const sCount = Math.max(1, requiredSkills.length);
    requiredSkills.forEach((skill, idx) => {
      const theta = (idx / sCount) * Math.PI * 2 + 0.3;
      const x = 5.5 * Math.cos(theta);
      const y = (idx % 2 === 0 ? -0.8 : 0.8);
      const z = 5.5 * Math.sin(theta);

      const sId = `skill-${idx}`;
      const isCovered = members.some((m) =>
        (m.user?.skills || []).some((s) => {
          const sName = typeof s === 'string' ? s : s.name;
          return sName?.toLowerCase() === skill.toLowerCase();
        })
      );

      const skillNode = {
        id: sId,
        type: 'skill',
        label: skill,
        isCovered,
        x,
        y,
        z,
        size: 0.3,
        color: isCovered ? '#20D47A' : '#FF1F2D' // Green (covered) or Red (missing)
      };
      nList.push(skillNode);

      members.forEach((m, mIdx) => {
        const hasSkill = (m.user?.skills || []).some((s) => {
          const sName = typeof s === 'string' ? s : s.name;
          return sName?.toLowerCase() === skill.toLowerCase();
        });
        if (hasSkill) {
          lList.push({
            source: `member-${m.user?._id || mIdx}`,
            target: sId,
            color: '#20D47A'
          });
        }
      });
    });

    return { nodes: nList, links: lList };
  }, [projectTitle, members, requiredSkills]);

  useFrame((state) => {
    if (prefersReducedMotion || document.hidden || selectedNode || !autoRotate) return;
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  const linePositions = useMemo(() => {
    const pos = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    links.forEach((l) => {
      const src = nodeMap.get(l.source);
      const tgt = nodeMap.get(l.target);
      if (src && tgt) {
        pos.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z);
      }
    });

    return new Float32Array(pos);
  }, [nodes, links]);

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
            color="#333333"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {nodes.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        return (
          <group
            key={node.id}
            position={[node.x, node.y, node.z]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNode(node);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredNode(node);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredNode(null);
              document.body.style.cursor = 'auto';
            }}
          >
            <mesh scale={isSelected ? 1.5 : isHovered ? 1.3 : 1}>
              <sphereGeometry args={[node.size, 20, 20]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.6 : 0.3}
                roughness={0.2}
                metalness={0.4}
              />
            </mesh>

            {(isHovered || isSelected || node.type === 'project') && (
              <Html distanceFactor={12} center position={[0, node.size + 0.35, 0]}>
                <div className="bg-[#111111]/95 backdrop-blur-md border border-[#242424] px-2.5 py-1 rounded-full shadow-soft pointer-events-none text-center whitespace-nowrap">
                  <p className="text-[10px] font-mono font-bold text-[#F5F5F5]">{node.label}</p>
                  {node.role && <p className="text-[9px] font-mono text-[#888888] uppercase">{node.role}</p>}
                  {node.type === 'skill' && (
                    <p
                      className={`text-[9px] font-mono font-bold uppercase ${
                        node.isCovered ? 'text-[#20D47A]' : 'text-[#FF1F2D]'
                      }`}
                    >
                      {node.isCovered ? 'Covered' : 'Missing'}
                    </p>
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

export const TeamTopology3D = ({ project }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const controlsRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
  }, []);

  if (!project) return null;

  return (
    <div className="bg-[#111111] border border-[#242424] rounded-3xl overflow-hidden shadow-soft relative flex flex-col h-[620px]">
      {/* Top Header */}
      <div className="p-4 bg-[#161616] border-b border-[#242424] flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#242424] text-[#E50914] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-[#F5F5F5] uppercase tracking-wider">
              // 3D_TEAM_TOPOLOGY
            </h4>
            <p className="text-[10px] font-mono text-[#888888]">
              Spatial view of team roles and required skills coverage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-[#111111] text-white border-[#333333]'
                : 'bg-[#161616] text-[#888888] border-[#242424]'
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
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#202020] text-[#F5F5F5] border border-[#242424] rounded-full text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-black">
        <Canvas
          camera={{ position: [0, 2, 9], fov: 46 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#FFFFFF" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#E50914" />
          <Suspense fallback={null}>
            <TeamScene
              projectTitle={project.title}
              members={project.members || []}
              requiredSkills={project.requiredSkills || []}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              autoRotate={autoRotate}
              prefersReducedMotion={prefersReducedMotion}
            />
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.6}
              minDistance={3.5}
              maxDistance={18}
            />
          </Suspense>
        </Canvas>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-[#111111]/90 backdrop-blur-md border border-[#242424] px-3 py-1.5 rounded-full flex items-center gap-3 text-[10px] font-mono font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span className="text-[#F5F5F5]">Project Core</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[#F5F5F5]">Members</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#20D47A]" />
            <span className="text-[#F5F5F5]">Covered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF1F2D]" />
            <span className="text-[#F5F5F5]">Missing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
