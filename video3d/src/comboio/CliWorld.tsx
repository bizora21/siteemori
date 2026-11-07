import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from '../extrudeText';
import { clamp01, easeIO, keyed, sceneProgress } from '../rastreio/timing';
import { Coach, Loco, Particles, railTube, sleepers } from './Parts';

const CYAN = '#2fd0ff';
const WHITE = '#eaf8ff';
const CYAN_C = new THREE.Color(CYAN);

// Linha do Sena (ilustrativa): Beira → Dondo → Cheringoma → Caia → Mutarara → Moatize.
const MAIN = new THREE.CatmullRomCurve3(
  [
    [-2.0, 0, 2.6],
    [-1.2, 0, 1.2],
    [-0.2, 0, 1.5],
    [0.9, 0, 0.2],
    [1.3, 0, -1.2],
    [0.4, 0, -2.4],
    [-0.6, 0, -3.6],
    [0.6, 0, -4.8],
    [1.8, 0, -5.8],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  'catmullrom',
  0.5,
);
const L = MAIN.getLength();
const STOPS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const NAMES = ['BEIRA', 'DONDO', 'CHERINGOMA', 'CAIA', 'MUTARARA', 'MOATIZE'];

// Locomotiva + 3 carruagens; distância (modelo) do centro de cada uma à locomotiva.
const CAR_DIST = [0, 1.95, 3.95, 5.95];
const SCALE = 0.32;

// A locomotiva arranca com as carruagens já na via: as paragens ficam entre o ponto de
// arranque da frente e o fim, para acenderem quando a locomotiva passa por elas.
const TAIL = (CAR_DIST[CAR_DIST.length - 1] * SCALE) / L;
const STOPU = STOPS.map((s) => TAIL + s * (1 - TAIL));

// Câmara por cena: [gancho, talão, escreve, foto, passos, privacidade, fecho]
const POS_Y = [2.4, 10, 10, 10, 17.5, 10, 10];
const POS_Z = [9.5, 13, 13, 13, 22, 13, 13];
const LK_Y = [1.2, 0, 0, 0, 0, 0, 0];
const LK_Z = [2, 0.3, 0.3, 0.3, 5.4, 0.3, 0.3];

function Rig({ t, starts }: { t: number; starts: number[] }) {
  const { camera } = useThree();
  const x = Math.sin(t * 0.32) * 0.7;
  camera.position.set(x, keyed(t, starts, POS_Y, 1.4), keyed(t, starts, POS_Z, 1.4));
  camera.lookAt(0, keyed(t, starts, LK_Y, 1.4), keyed(t, starts, LK_Z, 1.4));
  camera.updateMatrixWorld();
  return null;
}

function Station({ at, lit, t, delay, geo }: { at: number; /* índice da paragem */ lit: boolean; t: number; delay: number; geo?: THREE.BufferGeometry }) {
  const p = MAIN.getPointAt(STOPU[at]);
  const tg = MAIN.getTangentAt(STOPU[at]);
  const yaw = Math.atan2(tg.x, tg.z);
  const ph = (t * 0.55 + delay) % 1;
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, yaw, 0]}>
      <mesh position={[0.5, 0.05, 0]}>
        <boxGeometry args={[0.45, 0.08, 1.5]} />
        <meshStandardMaterial color="#0d3b52" emissive={lit ? '#0a6f96' : '#0a2433'} emissiveIntensity={lit ? 0.9 : 0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.62, 0.26, 0]}>
        <boxGeometry args={[0.24, 0.34, 0.62]} />
        <meshStandardMaterial color="#dff3ff" roughness={0.6} emissive={lit ? '#7fdcff' : '#17323f'} emissiveIntensity={lit ? 0.4 : 0.1} />
      </mesh>
      <mesh position={[0.6, 0.47, 0]}>
        <boxGeometry args={[0.38, 0.04, 0.76]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
      {lit && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={0.6 + ph * 1.7}>
          <ringGeometry args={[0.32, 0.36, 56]} />
          <meshBasicMaterial color={CYAN} transparent opacity={(1 - ph) * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {geo && (
        <group rotation={[0, -yaw, 0]}>
          <mesh geometry={geo} position={[0, 0.95, 0.1]} rotation={[-0.9, 0, 0]}>
            <meshStandardMaterial color={WHITE} emissive={lit ? '#7fdcff' : '#26414f'} emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function CliWorld({
  fontSerif,
  fontSans,
  t,
  frame,
  fps,
  starts,
  end,
  width,
  height,
}: {
  fontSerif: opentype.Font;
  fontSans: opentype.Font;
  t: number;
  frame: number;
  fps: number;
  starts: number[];
  end: number;
  width: number;
  height: number;
}) {
  const tubeLit = useMemo(() => new THREE.TubeGeometry(MAIN, 300, 0.05, 8, false), []);
  const tubeGlow = useMemo(() => new THREE.TubeGeometry(MAIN, 300, 0.26, 8, false), []);
  const rails = useMemo(() => [railTube(MAIN, 0.14), railTube(MAIN, -0.14)], []);
  const sleep = useMemo(() => sleepers(MAIN), []);
  const railMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8c4d8', metalness: 0.7, roughness: 0.35 }), []);

  const titleGeos = useMemo(
    () => [buildTextGeometry(fontSerif, 'ONDE ESTÁ A', 0.62, 0.09, 3.1), buildTextGeometry(fontSerif, 'MINHA ENCOMENDA?', 0.5, 0.09, 3.1)],
    [fontSerif],
  );
  const labelGeos = useMemo(() => NAMES.map((n) => buildTextGeometry(fontSans, n, 0.26, 0.05, 1.5)), [fontSans]);
  const titleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dff6ff', metalness: 0.5, roughness: 0.25, emissive: '#0a7fa8', emissiveIntensity: 0.55 }),
    [],
  );

  // Progresso: devagar enquanto o telemóvel manda; na cena dos passos percorre a linha
  // ao ritmo da narração.
  const p4 = sceneProgress(t, starts, 4, end);
  let frac = 0;
  if (t >= starts[1] && t < starts[4]) frac = 0.08 * clamp01((t - starts[1]) / Math.max(1, starts[4] - starts[1]));
  else if (t >= starts[4] && t < starts[5]) frac = 0.08 + 0.92 * clamp01((p4 - 0.1) / 0.55);
  else if (t >= starts[5]) frac = 1;

  const U = TAIL + clamp01(frac) * (1 - TAIL);

  const hero = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 1.1);
  const HS = 0.62;
  const hd = new THREE.Vector3(-0.3, 0, 0.954);
  const hHead = new THREE.Vector3(-0.35, 0.15, 3.8);
  const cars = CAR_DIST.map((d, k) => {
    const u = clamp01(U - (d * SCALE) / L);
    const p = MAIN.getPointAt(u);
    const tg = MAIN.getTangentAt(u);
    const cYaw = Math.atan2(tg.x, tg.z);
    const hx = hHead.x - hd.x * d * HS;
    const hz = hHead.z - hd.z * d * HS;
    const hYaw = Math.atan2(hd.x, hd.z) + Math.sin(t * 0.5) * 0.12;
    return {
      k,
      x: p.x * (1 - hero) + hx * hero,
      y: 0.05 * (1 - hero) + hHead.y * hero,
      z: p.z * (1 - hero) + hz * hero,
      yaw: cYaw * (1 - hero) + hYaw * hero,
      s: SCALE * (1 - hero) + HS * hero,
    };
  });

  const lit = (i: number) => (t >= starts[5] ? true : t >= starts[4] ? U >= STOPU[i] - 0.004 : i === 0);

  const draw = (g: THREE.BufferGeometry, f: number) => {
    const idx = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((idx * clamp01(f)) / 6) * 6);
  };
  draw(tubeLit, t >= starts[1] ? U : 0);
  draw(tubeGlow, t >= starts[1] ? U : 0);

  const titleVis = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 0.9);
  const pop = (i: number) => easeIO(clamp01((frame - 3 - i * 8) / 18));
  const routeVis = keyed(t, starts, [0.35, 1, 1, 1, 1, 1, 0.3], 0.9);
  const labelVis = keyed(t, starts, [0, 0, 0, 0, 1, 0, 0], 0.7);

  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 38, position: [0, 2, 10], near: 0.1, far: 70 }} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
      <Rig t={t} starts={starts} />
      <fog attach="fog" args={['#06121c', 16, 42]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 7, 6]} intensity={2.2} color="#e8f7ff" />
      <pointLight position={[0, 3, 3]} intensity={22} color={CYAN} distance={16} />
      <pointLight position={[-4, 2, -2]} intensity={8} color="#6b8dff" distance={14} />

      <gridHelper args={[50, 50, '#1d7fa6', '#0e3a50']} position={[0, -0.01, 0]} />

      <group visible={routeVis > 0.05}>
        <primitive object={sleep} />
        {rails.map((g, i) => (
          <mesh key={i} geometry={g} material={railMat} />
        ))}
        <mesh geometry={tubeLit}>
          <meshBasicMaterial color={CYAN} transparent opacity={0.9 * routeVis} />
        </mesh>
        <mesh geometry={tubeGlow}>
          <meshBasicMaterial color={CYAN} transparent opacity={0.16 * routeVis} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {STOPS.map((_, i) => (
          <Station key={i} at={i} lit={lit(i)} t={t} delay={i * 0.17} geo={labelVis > 0.3 ? labelGeos[i] : undefined} />
        ))}
      </group>

      {cars.map((c) => (
        <group key={c.k} position={[c.x, c.y, c.z]} rotation={[0, c.yaw, 0]} scale={c.s}>
          {c.k === 0 ? <Loco ring={0} /> : <Coach />}
        </group>
      ))}

      <group position={[0, 2.95, 1.2]} scale={Math.max(0.001, titleVis * 0.6)} visible={titleVis > 0.01}>
        {titleGeos.map((g, i) => (
          <mesh
            key={i}
            geometry={g}
            material={titleMat}
            position={[0, i === 0 ? 0.55 : -0.25 - (1 - pop(i)) * 0.6, (1 - pop(i)) * -2.5]}
            scale={Math.max(0.001, pop(i))}
            rotation={[(1 - pop(i)) * 0.9, Math.sin((frame / fps) * 0.8) * 0.14, 0]}
          />
        ))}
      </group>

      <Particles t={t} color={CYAN_C} />
    </ThreeCanvas>
  );
}
