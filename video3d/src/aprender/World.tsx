import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from '../extrudeText';
import { clamp01, easeIO, keyed, rng } from '../rastreio/timing';

const GOLD = '#f2c56b';
const CREAM = '#f3e8cf';

// Valores por cena: [gancho, app, níveis, pergunta, erro, próximo nível, fecho]
const HERO = [1, 0, 0, 0, 0, 0, 1];
const STARS = [0, 0, 0, 0, 0, 1, 0];

const HERO_HOOK = [0, 0, 0, 0, 0, 0, 1];

function Rig({ t, starts, hook }: { t: number; starts: number[]; hook?: boolean }) {
  const { camera } = useThree();
  const hero = keyed(t, starts, hook ? HERO_HOOK : HERO, 1.2);
  camera.position.set(Math.sin(t * 0.35) * 0.6, 2.4 + hero * 0.2, 10);
  camera.lookAt(0, 1.7 - hero * 0.6, 0);
  camera.updateMatrixWorld();
  return null;
}

// ── Pontos de luz dourados a subir ───────────────────────────────────────────
const N = 320;
function Motes({ t }: { t: number }) {
  const { base, sp } = useMemo(() => {
    const r = rng(77);
    const base = new Float32Array(N * 3);
    const sp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 11;
      base[i * 3 + 1] = r() * 9 - 2;
      base[i * 3 + 2] = (r() - 0.5) * 10 - 1;
      sp[i] = 0.1 + r() * 0.35;
    }
    return { base, sp };
  }, []);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = base[i * 3] + Math.sin(t * 0.5 + i) * 0.14;
    pos[i * 3 + 1] = ((base[i * 3 + 1] + 2 + t * sp[i]) % 9) - 2;
    pos[i * 3 + 2] = base[i * 3 + 2];
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={GOLD} size={0.07} sizeAttenuation transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ── Bíblia aberta ────────────────────────────────────────────────────────────
function Page({ t, k }: { t: number; k: number }) {
  // Uma página vira de cada vez (ciclo de 2,6 s, desfasado por página).
  const cyc = ((t * 0.38 + k * 0.34) % 1 + 1) % 1;
  const a = easeIO(clamp01(cyc / 0.55));
  const ang = a * Math.PI;
  const lift = Math.sin(a * Math.PI) * 0.0;
  const vis = cyc < 0.58;
  return (
    <group position={[0, 0.3 + lift, 0]} rotation={[0, 0, ang]} visible={vis}>
      <mesh position={[0.72, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.42, 1.9]} />
        <meshStandardMaterial color={CREAM} side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Book({ t }: { t: number }) {
  const lines = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8], []);
  return (
    <group>
      {/* capa */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.2, 0.14, 2.2]} />
        <meshStandardMaterial color="#3a2415" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.095, 1.095]}>
        <boxGeometry args={[3.2, 0.02, 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} emissive="#8a6420" emissiveIntensity={0.5} />
      </mesh>
      {/* blocos de páginas */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.76, 0.2, 0]} rotation={[0, 0, s * -0.045]}>
            <boxGeometry args={[1.5, 0.22, 1.96]} />
            <meshStandardMaterial color="#e6d8b8" roughness={0.9} emissive="#d9b56a" emissiveIntensity={0.04} />
          </mesh>
          {lines.map((i) => (
            <mesh key={i} position={[s * 0.8, 0.322, -0.78 + i * 0.195]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.05, 0.03]} />
              <meshBasicMaterial color="#b49a68" />
            </mesh>
          ))}
        </group>
      ))}
      <Page t={t} k={0} />
      <Page t={t} k={1} />
      <Page t={t} k={2} />
      {/* luz que sai do livro */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[1.7, 4.2, 40, 1, true]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} intensity={5} color={GOLD} distance={8} />
    </group>
  );
}

// ── Estrela 3D (recompensa) ──────────────────────────────────────────────────
function starGeometry() {
  const s = new THREE.Shape();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 1 : 0.46;
    const a = (i / (spikes * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 });
  g.center();
  return g;
}

const STAR_POS: [number, number, number, number][] = [
  [-1.45, 3.3, 0, 0.3],
  [1.5, 2.6, 0, 0.26],
  [-1.5, 0.7, 0, 0.22],
  [1.5, 0.3, 0, 0.3],
  [-1.3, -0.5, 0, 0.18],
  [1.35, 3.9, 0, 0.2],
];

export function World({
  font,
  t,
  frame,
  fps,
  starts,
  width,
  height,
  title = ['POR ONDE', 'COMEÇAR?'],
  hook,
}: {
  title?: [string, string];
  hook?: boolean;
  font: opentype.Font;
  t: number;
  frame: number;
  fps: number;
  starts: number[];
  width: number;
  height: number;
}) {
  const titleGeos = useMemo(() => [buildTextGeometry(font, title[0], 0.62, 0.09, 3.3), buildTextGeometry(font, title[1], 0.62, 0.09, 3.3)], [font, title[0], title[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const brandGeo = useMemo(() => buildTextGeometry(font, 'EMORI', 0.8, 0.1, 3.3), [font]);
  const star = useMemo(() => starGeometry(), []);
  const titleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff3d2', metalness: 0.55, roughness: 0.25, emissive: '#b8842a', emissiveIntensity: 0.5 }), []);

  const hero = keyed(t, starts, hook ? HERO_HOOK : HERO, 1.2);
  const starsIn = keyed(t, starts, STARS, 0.9);
  // Título do gancho: só enquanto a pergunta é feita (no gancho-desafio o título é 2D, por cima).
  const titleVis = hook ? 0 : 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 0.8);
  const brandVis = keyed(t, starts, [0, 0, 0, 0, 0, 0, 1], 1.0);
  const pop = (i: number) => easeIO(clamp01((frame - 3 - i * 8) / 18));

  // O livro: grande ao centro no gancho e no fecho; pequeno e a pairar por cima do telemóvel nas demos.
  const by = keyed(t, starts, [hook ? 4.55 : 0.9, 4.55, 4.55, 4.55, 4.55, 4.55, 1.95], 1.2);
  const bs = keyed(t, starts, [hook ? 0.001 : 0.8, 0.3, 0.3, 0.3, 0.3, 0.3, 0.66], 1.2);
  const bob = Math.sin(t * 1.4) * 0.07;

  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2.4, 10], near: 0.1, far: 60 }} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
      <Rig t={t} starts={starts} hook={hook} />
      <fog attach="fog" args={['#06120c', 14, 34]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 7, 6]} intensity={1.3} color="#fff1d6" />
      <pointLight position={[0, 3, 3]} intensity={9} color={GOLD} distance={14} />
      <pointLight position={[-4, 2, -2]} intensity={7} color="#7fc9a0" distance={14} />

      <group position={[0, by + bob, 0]} rotation={[0.52 - (1 - hero) * 0.18, Math.sin(t * 0.5) * 0.28, 0]} scale={bs}>
        <Book t={t} />
      </group>

      <group position={[0, 3.3, 0]} scale={Math.max(0.001, titleVis)} visible={titleVis > 0.01}>
        {titleGeos.map((g, i) => (
          <mesh
            key={i}
            geometry={g}
            material={titleMat}
            position={[0, i === 0 ? 0.5 : -0.3 - (1 - pop(i)) * 0.6, (1 - pop(i)) * -2.5]}
            scale={Math.max(0.001, pop(i))}
            rotation={[(1 - pop(i)) * 0.9, Math.sin((frame / fps) * 0.8) * 0.12, 0]}
          />
        ))}
      </group>

      <group position={[0, 3.7, 0]} scale={Math.max(0.001, brandVis)} visible={brandVis > 0.01}>
        <mesh geometry={brandGeo} material={titleMat} rotation={[0, Math.sin((frame / fps) * 0.8) * 0.12, 0]} />
      </group>

      {STAR_POS.map(([x, y, z, s], i) => {
        const sIn = easeIO(clamp01(starsIn * 1.4 - i * 0.12));
        return (
          <mesh key={i} geometry={star} position={[x, y + Math.sin(t * 1.6 + i) * 0.1, z]} rotation={[0.2, t * 0.9 + i, 0.1]} scale={Math.max(0.001, s * sIn)} visible={sIn > 0.01}>
            <meshStandardMaterial color="#ffd978" metalness={0.7} roughness={0.25} emissive="#c98a1d" emissiveIntensity={0.7} />
          </mesh>
        );
      })}

      <Motes t={t} />
    </ThreeCanvas>
  );
}
