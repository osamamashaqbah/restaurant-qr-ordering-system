"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";

const BUN_TOP = "#d99a4e";
const BUN_BOTTOM = "#c98640";
const PATTY = "#5b3a29";
const CHEESE = "#e8b23d";
const LETTUCE = "#7a9a4f";
const TOMATO = "#b4432f";
const SEED = "#f4e4c1";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Fixed (not random) so re-renders stay deterministic — jitter comes from
// varying the seeded index arithmetic instead of Math.random().
const SEED_TRANSFORMS: { position: [number, number, number]; rotation: [number, number, number] }[] =
  Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (i % 2) * 0.15;
    const radius = 0.35 + (i % 3) * 0.15;
    return {
      position: [Math.cos(angle) * radius, 0.395, Math.sin(angle) * radius],
      rotation: [(i * 0.73) % Math.PI, (i * 1.31) % Math.PI, 0],
    };
  });

function Burger() {
  const group = useRef<THREE.Group>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (!reduced) group.current.rotation.y += delta * 0.3;
    group.current.rotation.x += (pointer.y * 0.2 - group.current.rotation.x) * 0.06;
    group.current.rotation.z += (-pointer.x * 0.1 - group.current.rotation.z) * 0.06;
  });

  return (
    <group ref={group} onPointerMove={(e) => setPointer({ x: e.pointer.x, y: e.pointer.y })}>
      {/* bottom bun */}
      <mesh position={[0, -0.42, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <sphereGeometry args={[1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={BUN_BOTTOM} roughness={0.85} />
      </mesh>

      {/* patty */}
      <mesh position={[0, -0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 0.98, 0.24, 40]} />
        <meshStandardMaterial color={PATTY} roughness={0.9} />
      </mesh>

      {/* cheese (slightly rotated square-ish drape) */}
      <mesh position={[0, 0.03, 0]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 1.5]} />
        <meshStandardMaterial color={CHEESE} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* lettuce (wavy ring peeking out) */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.98, 0.14, 12, 48]} />
        <meshStandardMaterial color={LETTUCE} roughness={0.75} flatShading />
      </mesh>

      {/* tomato slice */}
      <mesh position={[0.15, 0.19, 0.55]} rotation={[Math.PI / 2, 0, 0.3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 32]} />
        <meshStandardMaterial color={TOMATO} roughness={0.5} />
      </mesh>

      {/* top bun (dome) */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
        <meshStandardMaterial color={BUN_TOP} roughness={0.8} />
      </mesh>

      {/* sesame seeds */}
      {SEED_TRANSFORMS.map((t, i) => (
        <mesh key={i} position={t.position} rotation={t.rotation}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={SEED} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="relative h-56 w-full select-none sm:h-64" aria-hidden="true">
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        resize={{ scroll: false }}
        camera={{ position: [0, 1.7, 4.2], fov: 38 }}
        dpr={1}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        shadows
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2.5, 4, 2]} intensity={1.4} castShadow shadow-mapSize={[512, 512]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#fff4e0" />
        <pointLight position={[0, 1.5, 2.5]} intensity={0.4} color="#ffe9c7" />
        <Float speed={1.4} rotationIntensity={0} floatIntensity={0.5}>
          <Burger />
        </Float>
        <ContactShadows position={[0, -0.75, 0]} opacity={0.35} scale={4} blur={2.2} far={2} />
      </Canvas>
    </div>
  );
}
