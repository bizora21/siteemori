import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from '../extrudeText';
import { clamp01, easeIO, keyed, rng, sceneProgress } from '../rastreio/timing';

const DANGER = new THREE.Color('#ff4d4f');
const BLUE = new THREE.Color('#3b82f6');
const WHITE = '#f1f6ff';
const BOX = '#b98a4e';

// Rota entre duas estações (plano do chão), igual à do vídeo de clientes.
const ROUTE = new THREE.CatmullRomCurve3(
  [
    [-1.55, 0, 2.0],
    [-0.75, 0, 0.6],
    [0.2, 0, 1.0],
    [0.8, 0, -0.8],
    [1.6, 0, -2.3],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  'catmullrom',
  0.5,
);

// Câmara por cena: [gancho, problema, solução, funcionalidades, oferta, CTA]
const CAM_Y = [1.8, 1.7, 7.5, 8.2, 8.2, 8.2];
const CAM_Z = [10, 9.4, 11, 12, 12, 12];
const LOOK_Y = [1.7, 1.5, 0, 0, 0, 0];
const LOOK_Z = [0, 0, 2.5, 3.4, 3.4, 3.4];

function Rig({ t, starts }: { t: number; starts: number[] }) {
  const { camera } = useThree();
  const shake = keyed(t, starts, [0, 1, 0, 0, 0, 0], 0.3) * Math.sin(t * 38) * 0.035;
  camera.position.set(Math.sin(t * 0.32) * 0.7 + shake, keyed(t, starts, CAM_Y, 1.2), keyed(t, starts, CAM_Z, 1.2));
  camera.lookAt(0, keyed(t, starts, LOOK_Y, 1.2), keyed(t, starts, LOOK_Z, 1.2));
  camera.updateMatrixWorld();
  return null;
}

const N = 320;
function Particles({ t, color }: { t: number; color: THREE.Color }) {
  const { base, sp } = useMemo(() => {
    const r = rng(33);
    const base = new Float32Array(N * 3);
    const sp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 11;
      base[i * 3 + 1] = r() * 9;
      base[i * 3 + 2] = (r() - 0.5) * 12;
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
      <pointsMaterial color={color} size={0.06} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Parcel({ danger }: { danger: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={BOX} roughness={0.78} emissive="#ff2a2a" emissiveIntensity={danger * 0.55} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.915, 0.915]} />
        <meshStandardMaterial color="#e6d3a3" roughness={0.5} emissive="#ff2a2a" emissiveIntensity={danger * 0.3} />
      </mesh>
      <mesh position={[0, 0, 0.4552]}>
        <planeGeometry args={[0.46, 0.34]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.04, 0.4558]}>
        <planeGeometry args={[0.36, 0.1]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
}

function Station({ at, t, delay, color }: { at: number; t: number; delay: number; color: THREE.Color }) {
  const p = ROUTE.getPointAt(at);
  const ph = (t * 0.55 + delay) % 1;
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 40]} />
        <meshStandardMaterial color="#0d2a66" emissive="#1d4ed8" emissiveIntensity={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 32]} />
        <meshBasicMaterial color={WHITE} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={0.8 + ph * 1.8}>
        <ringGeometry args={[0.36, 0.4, 56]} />
        <meshBasicMaterial color={color} transparent opacity={(1 - ph) * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function AdWorld({
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
  const tube = useMemo(() => new THREE.TubeGeometry(ROUTE, 160, 0.05, 8, false), []);
  const tubeLit = useMemo(() => new THREE.TubeGeometry(ROUTE, 160, 0.075, 8, false), []);
  const tubeGlow = useMemo(() => new THREE.TubeGeometry(ROUTE, 160, 0.2, 8, false), []);

  const hookGeos = useMemo(
    () => [buildTextGeometry(fontSerif, 'ONDE ESTÁ', 0.66, 0.09, 3.1), buildTextGeometry(fontSerif, 'A ENCOMENDA?', 0.56, 0.09, 3.1)],
    [fontSerif],
  );

  // 1 = perigo (vermelho), 0 = solução (azul da marca)
  const danger = keyed(t, starts, [1, 1, 0, 0, 0, 0], 0.5);
  const col = useMemo(() => new THREE.Color(), []);
  col.copy(DANGER).lerp(BLUE, 1 - danger);

  const hookMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff1f1', metalness: 0.4, roughness: 0.3, emissive: '#c01818', emissiveIntensity: 0.7 }), []);

  // Progresso da encomenda na rota: devagar nas funcionalidades, chega na oferta.
  const p3 = sceneProgress(t, starts, 3, end);
  const p4 = sceneProgress(t, starts, 4, end);
  let prog = 0;
  if (t >= starts[2] && t < starts[3]) prog = 0.03;
  else if (t >= starts[3] && t < starts[4]) prog = 0.03 + 0.67 * easeIO(p3);
  else if (t >= starts[4] && t < starts[5]) prog = 0.7 + 0.3 * easeIO(p4);
  else if (t >= starts[5]) prog = 1;

  const hero = 1 - keyed(t, starts, [0, 0, 1, 1, 1, 1], 1.1);
  const pt = ROUTE.getPointAt(prog);
  const tan = ROUTE.getTangentAt(prog);
  const ang = Math.atan2(tan.x, tan.z);
  const wob = keyed(t, starts, [0, 1, 0, 0, 0, 0], 0.3) * Math.sin(t * 31) * 0.1;
  const px = pt.x * (1 - hero);
  const py = (0.65 + Math.sin(t * 2.2) * 0.04) * (1 - hero) + (1.15 + Math.sin(t * 1.4) * 0.12) * hero;
  const pz = pt.z * (1 - hero) + 2.4 * hero;
  const sc = 0.55 * (1 - hero) + 1.1 * hero;
  const spin = hero * (t * 0.9) + (1 - hero) * ang;

  const hookVis = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1], 0.6);
  const pop = (i: number) => easeIO(clamp01((frame - 3 - i * 8) / 18));

  const draw = (g: THREE.BufferGeometry, frac: number) => {
    const idx = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((idx * clamp01(frac)) / 6) * 6);
  };
  draw(tubeLit, prog);
  draw(tubeGlow, prog);

  // No CTA a rota recua: o texto manda.
  const routeVis = keyed(t, starts, [0, 0, 1, 1, 1, 1], 0.8) * (1 - 0.6 * keyed(t, starts, [0, 0, 0, 0, 0, 1], 0.8));

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 38, position: [0, 2, 10], near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Rig t={t} starts={starts} />
      <fog attach="fog" args={['#070b18', 14, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 7, 6]} intensity={2.2} color="#eef4ff" />
      <pointLight position={[0, 3, 3]} intensity={24} color={col} distance={14} />
      <pointLight position={[-4, 2, -2]} intensity={8} color="#6b8dff" distance={14} />

      <gridHelper args={[40, 40, danger > 0.5 ? '#8a2a2e' : '#2b5bd7', danger > 0.5 ? '#3a1216' : '#12275e']} position={[0, -0.01, 0]} />

      <group visible={routeVis > 0.05}>
        <mesh geometry={tube}>
          <meshStandardMaterial color="#1b3a85" emissive="#102a66" emissiveIntensity={0.8} roughness={0.5} transparent opacity={0.9 * routeVis} />
        </mesh>
        <mesh geometry={tubeLit}>
          <meshBasicMaterial color="#5b9bff" />
        </mesh>
        <mesh geometry={tubeGlow}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <Station at={0} t={t} delay={0} color={col} />
        <Station at={0.5} t={t} delay={0.33} color={col} />
        <Station at={1} t={t} delay={0.66} color={col} />
      </group>

      <group position={[px, py, pz]} rotation={[hero * 0.35 + wob, spin + wob, wob]} scale={sc}>
        <Parcel danger={danger} />
      </group>

      <group position={[0, 3.55, 0]} scale={Math.max(0.001, hookVis)} visible={hookVis > 0.01}>
        {hookGeos.map((g, i) => (
          <mesh
            key={i}
            geometry={g}
            material={hookMat}
            position={[0, i === 0 ? 0.55 : -0.2 - (1 - pop(i)) * 0.6, (1 - pop(i)) * -2.5]}
            scale={Math.max(0.001, pop(i))}
            rotation={[(1 - pop(i)) * 0.9, Math.sin((frame / fps) * 0.8) * 0.14, 0]}
          />
        ))}
      </group>

      <Particles t={t} color={col} />
    </ThreeCanvas>
  );
}
