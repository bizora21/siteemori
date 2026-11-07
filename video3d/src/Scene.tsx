import { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from './extrudeText';
import type { VerseProps } from './types';

// Aleatório determinístico (os frames têm de ser reproduzíveis).
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const GOLD = '#f0c05a';
const PAGE = '#f4ead2';
const COVER = '#4a2a1c';

// ── Pó dourado a subir ────────────────────────────────────────────────────────
const DUST_COUNT = 420;
function Dust({ t }: { t: number }) {
  const { base, speeds } = useMemo(() => {
    const r = rng(7);
    const base = new Float32Array(DUST_COUNT * 3);
    const speeds = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      base[i * 3] = (r() - 0.5) * 9;
      base[i * 3 + 1] = r() * 14 - 5;
      base[i * 3 + 2] = (r() - 0.5) * 7 - 1;
      speeds[i] = 0.12 + r() * 0.35;
    }
    return { base, speeds };
  }, []);

  const positions = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    const y = ((base[i * 3 + 1] + t * speeds[i] + 5) % 14) - 5;
    positions[i * 3] = base[i * 3] + Math.sin(t * 0.6 + i) * 0.12;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = base[i * 3 + 2];
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Raios de luz que saem do livro ────────────────────────────────────────────
function LightBeam({ strength }: { strength: number }) {
  return (
    <group position={[0, 1.25, 0]}>
      {[0.7, 1.15, 1.7].map((r, i) => (
        <mesh key={r} position={[0, 4.2, 0]}>
          <cylinderGeometry args={[r, 0.3, 8.4, 40, 1, true]} />
          <meshBasicMaterial
            color={i === 0 ? '#fff1c2' : GOLD}
            transparent
            opacity={strength * (0.16 - i * 0.04)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Livro aberto, com páginas que viram ───────────────────────────────────────
function Book({ frame, fps }: { frame: number; fps: number }) {
  const open = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 60 } });
  const a = THREE.MathUtils.lerp(0.02, 0.34, open); // ângulo do "V"

  // Páginas viram em cadência, em arco sobre a lombada (repete a cada 4 s).
  const cycle = fps * 4;
  const flips = [0.4, 1.4, 2.4, 3.2].map((startSec, i) => {
    const f = (frame % cycle) - startSec * fps;
    const p = interpolate(f, [0, fps * 0.9], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });
    return { i, angle: THREE.MathUtils.lerp(a, Math.PI - a, p), visible: p > 0 && p < 1 };
  });

  return (
    <group rotation={[0.55, 0, 0]} position={[0, 0.85, 0]} scale={0.66}>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[4.9, 0.1, 3.5]} />
        <meshStandardMaterial color={COVER} roughness={0.6} />
      </mesh>
      <group rotation={[0, 0, -a]}>
        <mesh position={[-1.2, 0.02, 0]}>
          <boxGeometry args={[2.4, 0.22, 3.2]} />
          <meshStandardMaterial color={PAGE} roughness={0.85} />
        </mesh>
      </group>
      <group rotation={[0, 0, a]}>
        <mesh position={[1.2, 0.02, 0]}>
          <boxGeometry args={[2.4, 0.22, 3.2]} />
          <meshStandardMaterial color={PAGE} roughness={0.85} />
        </mesh>
      </group>
      {flips.map(
        (f) =>
          f.visible && (
            <group key={f.i} rotation={[0, 0, f.angle]}>
              <mesh position={[1.2, 0.16, 0]}>
                <boxGeometry args={[2.35, 0.012, 3.1]} />
                <meshStandardMaterial
                  color="#fff7e0"
                  roughness={0.8}
                  emissive="#ffd27a"
                  emissiveIntensity={0.25}
                />
              </mesh>
            </group>
          ),
      )}
    </group>
  );
}

// ── Título extrudido em ouro ──────────────────────────────────────────────────
function Title({
  font,
  lines,
  frame,
  fps,
}: {
  font: opentype.Font;
  lines: string[];
  frame: number;
  fps: number;
}) {
  const geos = useMemo(
    () => lines.map((l, i) => buildTextGeometry(font, l, i === 0 ? 1.05 : 0.74, 0.07, 3.5)),
    [font, lines],
  );
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.55,
        roughness: 0.28,
        emissive: '#5a3a00',
        emissiveIntensity: 0.6,
      }),
    [],
  );

  const sway = Math.sin((frame / fps) * 0.9) * 0.22;
  return (
    <group position={[0, 3.35, 0]} rotation={[0, sway, 0]}>
      {geos.map((g, i) => {
        const pop = spring({ frame: frame - 2 - i * 7, fps, config: { damping: 11, stiffness: 90 } });
        const y = i === 0 ? 0.55 : -0.7;
        return (
          <mesh
            key={i}
            geometry={g}
            material={mat}
            position={[0, y + (1 - pop) * 1.2, (1 - pop) * -3]}
            scale={Math.max(0.001, pop)}
            rotation={[(1 - pop) * 0.9, 0, 0]}
          />
        );
      })}
    </group>
  );
}

export function Scene({ font, props }: { font: opentype.Font; props: VerseProps }) {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // Câmara: aproxima-se devagar e faz um arco leve (sensação de profundidade).
  const dolly = interpolate(frame, [0, durationInFrames], [11.5, 9.2], { easing: Easing.inOut(Easing.sin) });
  const orbit = Math.sin(t * 0.5) * 0.9;
  const lift = interpolate(frame, [0, durationInFrames], [0.6, 1.0]);

  // Ganchos curtos: a animação de entrada já vem feita no primeiro quadro (nos 2 primeiros segundos decide-se se a pessoa fica).
  const settled = props.skipIntro ? frame + 45 : frame;
  const beam = spring({ frame: settled - 14, fps, config: { damping: 20, stiffness: 40 } });
  const pulse = 0.88 + Math.sin(t * 2.2) * 0.12;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 38, position: [orbit, lift, dolly], near: 0.1, far: 60 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.3, 0)}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 6]} intensity={2.2} color="#fff0d0" />
      <pointLight position={[0, 2.6, 1.8]} intensity={26 * beam * pulse} color="#ffcf70" distance={14} />
      <pointLight position={[-4, 2, 3]} intensity={6} color="#8aa4ff" distance={14} />

      <Title font={font} lines={props.title} frame={settled} fps={fps} />
      <Book frame={settled} fps={fps} />
      <LightBeam strength={beam * pulse} />
      <Dust t={t} />
    </ThreeCanvas>
  );
}
