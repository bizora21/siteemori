import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type opentype from 'opentype.js';
import { buildTextGeometry } from '../extrudeText';
import { clamp01, easeIO, keyed, rng, sceneProgress } from './timing';

const CYAN = '#2fd0ff';
const WHITE = '#eaf8ff';
const BOX = '#b98a4e';

// Rota entre as duas estações (plano do chão). Curva suave em S, vista de cima.
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

// Valores da câmara por cena: [gancho, talão, escreve, foto, passos, privacidade, fecho]
const CAM_Y = [1.8, 7.5, 7.5, 7.5, 10.2, 7.5, 7.5];
const CAM_Z = [10, 11, 11, 11, 13.2, 11, 11];
const LOOK_Y = [1.7, 0, 0, 0, 0, 0, 0];
const LOOK_Z = [0, 2.5, 2.5, 2.5, 3.6, 2.5, 2.5];

function Rig({ t, starts }: { t: number; starts: number[] }) {
  const { camera } = useThree();
  const x = Math.sin(t * 0.32) * 0.7;
  camera.position.set(x, keyed(t, starts, CAM_Y, 1.4), keyed(t, starts, CAM_Z, 1.4));
  camera.lookAt(0, keyed(t, starts, LOOK_Y, 1.4), keyed(t, starts, LOOK_Z, 1.4));
  camera.updateMatrixWorld();
  return null;
}

// ── Partículas ciano a subir ─────────────────────────────────────────────────
const N = 360;
function Particles({ t }: { t: number }) {
  const { base, sp } = useMemo(() => {
    const r = rng(21);
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
      <pointsMaterial color={CYAN} size={0.06} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ── Encomenda (caixa de cartão com fita e etiqueta) ──────────────────────────
function Parcel() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={BOX} roughness={0.78} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.915, 0.915]} />
        <meshStandardMaterial color="#e6d3a3" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0, 0.4552]}>
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

function Station({ at, t, delay, geo, label, vis = 1 }: { at: number; t: number; delay: number; geo?: THREE.BufferGeometry; label?: boolean; vis?: number }) {
  const p = ROUTE.getPointAt(at);
  const ph = (t * 0.55 + delay) % 1;
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 40]} />
        <meshStandardMaterial color="#0d3b52" emissive="#0a6f96" emissiveIntensity={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 32]} />
        <meshBasicMaterial color={WHITE} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={0.8 + ph * 1.8}>
        <ringGeometry args={[0.36, 0.4, 56]} />
        <meshBasicMaterial color={CYAN} transparent opacity={(1 - ph) * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {label && geo && vis > 0.02 && <mesh geometry={geo} position={[0, 1.2, 0.2]} rotation={[-0.55, 0, 0]} scale={vis}>
        <meshStandardMaterial color={WHITE} emissive="#7fdcff" emissiveIntensity={0.55} metalness={0.3} roughness={0.35} />
      </mesh>}
    </group>
  );
}

export function World({
  font,
  t,
  frame,
  fps,
  starts,
  end,
  width,
  height,
}: {
  font: opentype.Font;
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

  const titleGeos = useMemo(
    () => [
      buildTextGeometry(font, 'ONDE ESTÁ A', 0.62, 0.09, 3.1),
      buildTextGeometry(font, 'MINHA ENCOMENDA?', 0.5, 0.09, 3.1),
    ],
    [font],
  );
  const lblA = useMemo(() => buildTextGeometry(font, 'MAPUTO', 0.3, 0.06, 1.4), [font]);
  const lblB = useMemo(() => buildTextGeometry(font, 'BEIRA', 0.3, 0.06, 1.4), [font]);
  const titleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dff6ff', metalness: 0.5, roughness: 0.25, emissive: '#0a7fa8', emissiveIntensity: 0.55 }),
    [],
  );

  // Progresso da encomenda na rota, por cena.
  const p5 = sceneProgress(t, starts, 4, end);
  // Na cena dos passos (5) avança ao ritmo da narração.
  const prog = t < starts[4] ? keyed(t, starts, [0, 0, 0.04, 0.3, 0.3], 1.2) : 0.3 + 0.7 * easeIO(clamp01((p5 - 0.35) / 0.55));
  const pr = Math.max(0, Math.min(1, t >= starts[5] ? 1 : prog));

  // Gancho: a caixa grande à frente → depois segue a rota.
  const hero = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 1.2);
  const pt = ROUTE.getPointAt(pr);
  const tan = ROUTE.getTangentAt(pr);
  const ang = Math.atan2(tan.x, tan.z);
  const bob = Math.sin(t * 2.2) * 0.04;
  const px = pt.x * (1 - hero) + 0 * hero;
  const py = (0.65 + bob) * (1 - hero) + (1.15 + Math.sin(t * 1.4) * 0.12) * hero;
  const pz = pt.z * (1 - hero) + 2.4 * hero;
  const sc = 0.55 * (1 - hero) + 1.15 * hero;
  const spin = hero * (t * 0.9) + (1 - hero) * ang;

  // Título 3D só no gancho.
  const titleVis = 1 - keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 0.9);
  const pop = (i: number) => easeIO(clamp01((frame - 3 - i * 8) / 18));

  const draw = (g: THREE.BufferGeometry, frac: number) => {
    const idx = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((idx * clamp01(frac)) / 6) * 6);
  };
  draw(tubeLit, pr);
  draw(tubeGlow, pr);

  const routeVis = 1 - hero * 0.85;
  // Rótulos das estações só quando o telemóvel não os tapa.
  const labelVis = keyed(t, starts, [1, 1, 0, 0, 1, 0, 1], 0.7);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 38, position: [0, 2, 10], near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Rig t={t} starts={starts} />
      <fog attach="fog" args={['#06121c', 14, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 7, 6]} intensity={2.2} color="#e8f7ff" />
      <pointLight position={[0, 3, 3]} intensity={22} color={CYAN} distance={14} />
      <pointLight position={[-4, 2, -2]} intensity={8} color="#6b8dff" distance={14} />

      <gridHelper args={[40, 40, '#1d7fa6', '#0e3a50']} position={[0, -0.01, 0]} />

      <group visible={routeVis > 0.05}>
        <mesh geometry={tube}>
          <meshStandardMaterial color="#17506b" emissive="#0b3a52" emissiveIntensity={0.8} roughness={0.5} transparent opacity={0.9 * routeVis} />
        </mesh>
        <mesh geometry={tubeLit}>
          <meshBasicMaterial color={CYAN} />
        </mesh>
        <mesh geometry={tubeGlow}>
          <meshBasicMaterial color={CYAN} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <Station at={0} t={t} delay={0} geo={lblA} label vis={labelVis} />
        <Station at={0.5} t={t} delay={0.33} />
        <Station at={1} t={t} delay={0.66} geo={lblB} label vis={labelVis} />
      </group>

      <group position={[px, py, pz]} rotation={[hero * 0.35, spin, 0]} scale={sc}>
        <Parcel />
      </group>

      <group position={[0, 3.55, 0]} scale={Math.max(0.001, titleVis)} visible={titleVis > 0.01}>
        {titleGeos.map((g, i) => (
          <mesh
            key={i}
            geometry={g}
            material={titleMat}
            position={[0, i === 0 ? 0.55 : -0.2 - (1 - pop(i)) * 0.6, (1 - pop(i)) * -2.5]}
            scale={Math.max(0.001, pop(i))}
            rotation={[(1 - pop(i)) * 0.9, Math.sin((frame / fps) * 0.8) * 0.14, 0]}
          />
        ))}
      </group>

      <Particles t={t} />
    </ThreeCanvas>
  );
}
