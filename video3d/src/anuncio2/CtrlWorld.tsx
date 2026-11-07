import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from '../extrudeText';
import { clamp01, easeIO, keyed, rng } from '../rastreio/timing';

const RED = new THREE.Color('#ff4d4f');
const BLUE = new THREE.Color('#3b82f6');
const WHITE = '#f1f6ff';

const v = (pts: number[][]) => pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));

// Rota principal: 4 paragens, de Maputo à Beira (ilustrativa).
const MAIN = new THREE.CatmullRomCurve3(
  v([
    [-3, 0, 5],
    [-1.5, 0, 2.6],
    [0.6, 0, 3.0],
    [1.8, 0, 0.6],
    [0.3, 0, -1.6],
    [-1.6, 0, -3.6],
    [0.4, 0, -6.2],
    [3, 0, -8.2],
  ]),
  false,
  'catmullrom',
  0.5,
);
const STOPS = [0, 0.33, 0.66, 1];
const NAMES = ['MAPUTO', 'XAI-XAI', 'INHAMBANE', 'BEIRA'];

// Rotas secundárias (frota a trabalhar em segundo plano).
const SIDE = [
  new THREE.CatmullRomCurve3(v([[-3, 0, 5], [-5, 0, 2], [-7, 0, -2], [-6.5, 0, -7]]), false, 'catmullrom', 0.5),
  new THREE.CatmullRomCurve3(v([[-3, 0, 5], [1, 0, 6.5], [4.5, 0, 4], [6.5, 0, -0.5]]), false, 'catmullrom', 0.5),
];

// Câmara estática por cena: [gancho, perda, percurso, controlo, cliente, oferta, cta]
const POS_X = [0, 5, 5, 2, 2, 2, 2];
const POS_Y = [2.4, 13, 13, 14, 14, 14, 14];
const POS_Z = [9.5, 10, 10, 8.5, 8.5, 8.5, 8.5];
const LK_X = [0, 0, 0, 0, 0, 0, 0];
const LK_Y = [1.2, 0, 0, 0, 0, 0, 0];
const LK_Z = [2, -1.5, -1.5, -6.8, -6.8, -6.8, -6.8];

function Truck({ cab = '#f97316', ring = 0 }: { cab?: string; ring?: number }) {
  const wheel = (x: number, z: number) => (
    <mesh key={`${x}${z}`} position={[x, 0.14, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.15, 0.15, 0.12, 16]} />
      <meshStandardMaterial color="#0b0f1c" roughness={0.9} />
    </mesh>
  );
  return (
    <group>
      <mesh position={[0, 0.58, -0.25]}>
        <boxGeometry args={[0.8, 0.8, 1.5]} />
        <meshStandardMaterial color="#e8f0ff" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, -0.25]}>
        <boxGeometry args={[0.82, 0.16, 1.52]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} emissive="#1d4ed8" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0.85]}>
        <boxGeometry args={[0.76, 0.62, 0.55]} />
        <meshStandardMaterial color={cab} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.58, 1.13]}>
        <boxGeometry args={[0.66, 0.26, 0.04]} />
        <meshStandardMaterial color="#0a1230" emissive="#60a5fa" emissiveIntensity={0.5} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.22, 1.14]}>
          <boxGeometry args={[0.14, 0.08, 0.04]} />
          <meshBasicMaterial color="#fff6c8" />
        </mesh>
      ))}
      {wheel(-0.42, -0.8)}
      {wheel(0.42, -0.8)}
      {wheel(-0.42, 0.8)}
      {wheel(0.42, 0.8)}
      {ring > 0.01 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]} scale={1 + ring * 0.6}>
          <ringGeometry args={[0.9, 1.0, 40]} />
          <meshBasicMaterial color="#ff4d4f" transparent opacity={0.8 * (1 - ring * 0.5)} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}

function Rig({ t, starts, chasePos, chaseLook }: { t: number; starts: number[]; chasePos: THREE.Vector3; chaseLook: THREE.Vector3 }) {
  const { camera } = useThree();
  const chase = keyed(t, starts, [0, 0, 1, 0, 0, 0, 0], 1.1);
  const px = keyed(t, starts, POS_X, 1.3);
  const py = keyed(t, starts, POS_Y, 1.3);
  const pz = keyed(t, starts, POS_Z, 1.3);
  const lx = keyed(t, starts, LK_X, 1.3);
  const ly = keyed(t, starts, LK_Y, 1.3);
  const lz = keyed(t, starts, LK_Z, 1.3);
  const sway = Math.sin(t * 0.35) * 0.5;
  camera.position.set(px + sway + (chasePos.x - px - sway) * chase, py + (chasePos.y - py) * chase, pz + (chasePos.z - pz) * chase);
  camera.lookAt(lx + (chaseLook.x - lx) * chase, ly + (chaseLook.y - ly) * chase, lz + (chaseLook.z - lz) * chase);
  camera.updateMatrixWorld();
  return null;
}

const N = 300;
function Particles({ t, color }: { t: number; color: THREE.Color }) {
  const { base, sp } = useMemo(() => {
    const r = rng(41);
    const base = new Float32Array(N * 3);
    const sp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 20;
      base[i * 3 + 1] = r() * 9;
      base[i * 3 + 2] = (r() - 0.5) * 24 - 2;
      sp[i] = 0.1 + r() * 0.3;
    }
    return { base, sp };
  }, []);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = base[i * 3] + Math.sin(t * 0.5 + i) * 0.12;
    pos[i * 3 + 1] = (base[i * 3 + 1] + t * sp[i]) % 9;
    pos[i * 3 + 2] = base[i * 3 + 2];
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.07} sizeAttenuation transparent opacity={0.65} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Station({ at, lit, t, delay, geo, danger }: { at: number; lit: number; t: number; delay: number; geo?: THREE.BufferGeometry; danger: number }) {
  const p = MAIN.getPointAt(at);
  const ph = (t * 0.55 + delay) % 1;
  const c = new THREE.Color().copy(BLUE).lerp(RED, danger * (1 - lit));
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.12, 40]} />
        <meshStandardMaterial color="#0d2a66" emissive={lit > 0.5 ? '#1d4ed8' : '#1a2a55'} emissiveIntensity={0.4 + lit * 0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 32]} />
        <meshBasicMaterial color={lit > 0.5 ? WHITE : '#5a6a95'} />
      </mesh>
      {lit > 0.5 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={0.8 + ph * 1.8}>
          <ringGeometry args={[0.38, 0.42, 56]} />
          <meshBasicMaterial color={c} transparent opacity={(1 - ph) * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {geo && (
        <mesh geometry={geo} position={[0, 1.15, 0.1]} rotation={[-0.9, 0, 0]}>
          <meshStandardMaterial color={WHITE} emissive={lit > 0.5 ? '#7fb0ff' : '#33406b'} emissiveIntensity={0.6} metalness={0.3} roughness={0.35} />
        </mesh>
      )}
    </group>
  );
}

export function CtrlWorld({
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
  const tubeMain = useMemo(() => new THREE.TubeGeometry(MAIN, 220, 0.06, 8, false), []);
  const tubeLit = useMemo(() => new THREE.TubeGeometry(MAIN, 220, 0.09, 8, false), []);
  const tubeGlow = useMemo(() => new THREE.TubeGeometry(MAIN, 220, 0.24, 8, false), []);
  const tubeGap = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 28; i++) pts.push(MAIN.getPointAt(STOPS[1] + ((STOPS[2] - STOPS[1]) * i) / 28));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.13, 8, false);
  }, []);
  const tubeSides = useMemo(() => SIDE.map((c) => new THREE.TubeGeometry(c, 100, 0.045, 6, false)), []);

  const hookGeos = useMemo(
    () => [buildTextGeometry(fontSerif, 'ONDE ESTÁ', 0.7, 0.09, 3.1), buildTextGeometry(fontSerif, 'A SUA CARGA?', 0.56, 0.09, 3.1)],
    [fontSerif],
  );
  const qGeo = useMemo(() => buildTextGeometry(fontSerif, '?', 1.5, 0.12, 2), [fontSerif]);
  const labelGeos = useMemo(() => NAMES.map((n) => buildTextGeometry(fontSans, n, 0.3, 0.06, 1.6)), [fontSans]);
  const hookMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eaf2ff', metalness: 0.5, roughness: 0.25, emissive: '#1d4ed8', emissiveIntensity: 0.7 }), []);
  const qMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffd9d9', metalness: 0.3, roughness: 0.3, emissive: '#e11d2a', emissiveIntensity: 0.9 }), []);

  const sc = (i: number) => starts[i];
  const danger = keyed(t, starts, [0, 1, 0, 0, 0, 0, 0], 0.5);
  const col = useMemo(() => new THREE.Color(), []);
  col.copy(BLUE).lerp(RED, danger);

  // ── progresso do camião principal ─────────────────────────────────────────
  const inPain = t >= sc(1) && t < sc(2);
  const inRoute = t >= sc(2) && t < sc(3);
  const painP = clamp01((t - sc(1)) / Math.max(0.5, sc(2) - sc(1)));
  const chaseP = clamp01((t - sc(2) - 0.5) / Math.max(1, sc(3) - sc(2) - 1.2));
  let prog = 0;
  if (inPain) prog = 0.33 * easeIO(clamp01(painP / 0.7));
  else if (inRoute) prog = chaseP;
  else if (t >= sc(3)) prog = 1;

  // o camião "some" no trecho sem controlo e reaparece quando a Movago entra
  const vanish = inPain ? 1 - clamp01((painP - 0.7) / 0.25) : 1;
  const reappear = t >= sc(2) ? easeIO(clamp01((t - sc(2)) / 0.5)) : t >= sc(1) ? vanish : 1;
  const hero = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 1.0);

  const pt = MAIN.getPointAt(clamp01(prog));
  const tan = MAIN.getTangentAt(clamp01(prog));
  const ang = Math.atan2(tan.x, tan.z);
  const tx = pt.x * (1 - hero);
  const tz = pt.z * (1 - hero) + 3.2 * hero;
  const ty = 0.02 * (1 - hero) + 0.55 * hero;
  const tscale = (0.62 * (1 - hero) + 0.8 * hero) * Math.max(0.001, hero > 0.5 ? 1 : reappear);
  const tyaw = hero * (0.7 + Math.sin(t * 0.6) * 0.5) + (1 - hero) * ang;
  const painRing = inPain && painP > 0.7 ? (t * 2.5) % 1 : 0;

  // câmara de perseguição (atrás e acima do camião)
  const chasePos = new THREE.Vector3(pt.x - tan.x * 6.8, 3.7, pt.z - tan.z * 6.8);
  const ahead = MAIN.getPointAt(clamp01(prog + 0.06));
  const chaseLook = new THREE.Vector3(ahead.x, 0.5, ahead.z);

  // paragens acesas
  const lit = (i: number) => (t >= sc(3) ? 1 : t >= sc(2) ? (prog >= STOPS[i] - 0.004 ? 1 : 0) : i === 0 ? 1 : 0);

  const draw = (g: THREE.BufferGeometry, frac: number) => {
    const idx = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((idx * clamp01(frac)) / 6) * 6);
  };
  draw(tubeLit, t >= sc(2) ? prog : 0);
  draw(tubeGlow, t >= sc(2) ? prog : 0);

  const gapVis = keyed(t, starts, [0, 1, 0, 0, 0, 0, 0], 0.4) * (0.65 + 0.35 * Math.sin(t * 7));
  const routeVis = keyed(t, starts, [0.25, 1, 1, 0.45, 0.45, 0.4, 0.3], 0.9);
  const hookVis = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 0.6);
  const pop = (i: number) => easeIO(clamp01((frame - 3 - i * 8) / 18));
  const qVis = keyed(t, starts, [0, 1, 0, 0, 0, 0, 0], 0.5);
  const labelVis = keyed(t, starts, [0, 1, 0, 0, 0, 0, 0], 0.6);

  // frota de fundo
  const side = SIDE.map((c, i) => {
    const u = (t * (0.045 + i * 0.02) + i * 0.4) % 1;
    const p = c.getPointAt(u);
    const tg = c.getTangentAt(u);
    return { p, yaw: Math.atan2(tg.x, tg.z) };
  });

  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 40, position: [0, 2, 10], near: 0.1, far: 80 }} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
      <Rig t={t} starts={starts} chasePos={chasePos} chaseLook={chaseLook} />
      <fog attach="fog" args={['#070b18', 16, 46]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 8, 6]} intensity={2.3} color="#eef4ff" />
      <pointLight position={[0, 3, 3]} intensity={26} color={col} distance={16} />
      <pointLight position={[-4, 2, -2]} intensity={8} color="#6b8dff" distance={14} />

      <gridHelper args={[60, 60, danger > 0.5 ? '#8a2a2e' : '#2b5bd7', danger > 0.5 ? '#3a1216' : '#12275e']} position={[0, -0.01, 0]} />

      <group visible={routeVis > 0.05}>
        <mesh geometry={tubeMain}>
          <meshStandardMaterial color="#1b3a85" emissive="#102a66" emissiveIntensity={0.8} roughness={0.5} transparent opacity={0.9 * routeVis} />
        </mesh>
        <mesh geometry={tubeLit}>
          <meshBasicMaterial color="#5b9bff" transparent opacity={routeVis} />
        </mesh>
        <mesh geometry={tubeGlow}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.2 * routeVis} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh geometry={tubeGap} visible={gapVis > 0.02}>
          <meshBasicMaterial color="#ff4d4f" transparent opacity={Math.max(0, gapVis)} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {SIDE.map((_, i) => (
          <mesh key={i} geometry={tubeSides[i]}>
            <meshBasicMaterial color="#2a5bd9" transparent opacity={0.55} />
          </mesh>
        ))}
        {STOPS.map((s, i) => (
          <Station key={i} at={s} lit={lit(i)} t={t} delay={i * 0.25} geo={labelVis > 0.3 ? labelGeos[i] : undefined} danger={danger} />
        ))}
      </group>

      {side.map((s, i) => (
        <group key={i} position={[s.p.x, 0.02, s.p.z]} rotation={[0, s.yaw, 0]} scale={0.5} visible={t >= sc(1) || hero < 0.5}>
          <Truck cab={i ? '#60a5fa' : '#fb923c'} />
        </group>
      ))}

      <group position={[tx, ty, tz]} rotation={[0, tyaw, 0]} scale={tscale} visible={tscale > 0.01}>
        <Truck ring={painRing} />
      </group>

      <group position={[0, 3.3, 1.2]} scale={Math.max(0.001, hookVis * 0.62)} visible={hookVis > 0.01}>
        {hookGeos.map((g, i) => (
          <mesh
            key={i}
            geometry={g}
            material={hookMat}
            position={[0, i === 0 ? 0.55 : -0.25 - (1 - pop(i)) * 0.6, (1 - pop(i)) * -2.5]}
            scale={Math.max(0.001, pop(i))}
            rotation={[(1 - pop(i)) * 0.9, Math.sin((frame / fps) * 0.8) * 0.14, 0]}
          />
        ))}
      </group>

      <group position={[MAIN.getPointAt(0.495).x, 1.7 + Math.sin(t * 3) * 0.12, MAIN.getPointAt(0.495).z]} rotation={[-0.6, 0, 0]} scale={Math.max(0.001, qVis)} visible={qVis > 0.02}>
        <mesh geometry={qGeo} material={qMat} />
      </group>

      <Particles t={t} color={col} />
    </ThreeCanvas>
  );
}
