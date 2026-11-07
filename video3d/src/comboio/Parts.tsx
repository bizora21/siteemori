import { useMemo } from 'react';
import * as THREE from 'three';
import { rng } from '../rastreio/timing';

// Peças 3D do comboio de passageiros: locomotiva, carruagem, via (carris e travessas)
// e partículas. Partilhadas pelas composições de vídeo do comboio.

export function Bogie({ z }: { z: number }) {
  return (
    <group position={[0, 0.16, z]}>
      <mesh>
        <boxGeometry args={[0.66, 0.1, 0.5]} />
        <meshStandardMaterial color="#0b0f1c" roughness={0.9} />
      </mesh>
      {[-0.34, 0.34].map((x) =>
        [-0.17, 0.17].map((zz) => (
          <mesh key={`${x}${zz}`} position={[x, -0.03, zz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 14]} />
            <meshStandardMaterial color="#1a2036" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Loco({ ring }: { ring: number }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.78, 0.12, 1.7]} />
        <meshStandardMaterial color="#10162b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, -0.05]}>
        <boxGeometry args={[0.76, 0.56, 1.55]} />
        <meshStandardMaterial color="#2563eb" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0.8]}>
        <boxGeometry args={[0.76, 0.42, 0.3]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.0, -0.35]}>
        <boxGeometry args={[0.7, 0.32, 0.7]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.0, 0.0]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#0a1230" emissive="#9cc3ff" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0.96]}>
        <boxGeometry args={[0.22, 0.1, 0.02]} />
        <meshBasicMaterial color="#fff6c8" />
      </mesh>
      <mesh position={[0, 0.55, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.62, 2.5, 20, 1, true]} />
        <meshBasicMaterial color="#fff3c0" transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <Bogie z={-0.5} />
      <Bogie z={0.5} />
      {ring > 0.01 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={1 + ring * 0.7}>
          <ringGeometry args={[1.1, 1.2, 40]} />
          <meshBasicMaterial color="#ff4d4f" transparent opacity={0.8 * (1 - ring * 0.5)} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}

export function Coach() {
  return (
    <group>
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[0.76, 0.62, 1.9]} />
        <meshStandardMaterial color="#cfd8ee" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.78, 0.12, 1.92]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} emissive="#1d4ed8" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.7, 0.07, 1.84]} />
        <meshStandardMaterial color="#8ea2d3" roughness={0.6} />
      </mesh>
      {[-1, 1].map((side) =>
        [0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`${side}${i}`} position={[side * 0.385, 0.78, -0.8 + i * 0.32]}>
            <boxGeometry args={[0.02, 0.2, 0.2]} />
            <meshStandardMaterial color="#ffe9a8" emissive="#ffd36a" emissiveIntensity={0.9} />
          </mesh>
        )),
      )}
      <Bogie z={-0.6} />
      <Bogie z={0.6} />
    </group>
  );
}

const N = 320;
export function Particles({ t, color }: { t: number; color: THREE.Color }) {
  const { base, sp } = useMemo(() => {
    const r = rng(57);
    const base = new Float32Array(N * 3);
    const sp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      base[i * 3] = (r() - 0.5) * 22;
      base[i * 3 + 1] = r() * 9;
      base[i * 3 + 2] = (r() - 0.5) * 34 - 4;
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
      <pointsMaterial color={color} size={0.07} sizeAttenuation transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function railTube(curve: THREE.CatmullRomCurve3, off: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 400; i++) {
    const u = i / 400;
    const p = curve.getPointAt(u);
    const tg = curve.getTangentAt(u);
    pts.push(new THREE.Vector3(p.x - tg.z * off, 0.05, p.z + tg.x * off));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 520, 0.022, 6, false);
}

export function sleepers(curve: THREE.CatmullRomCurve3) {
  const n = Math.floor(curve.getLength() / 0.17);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.52, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: '#2b3760', roughness: 0.9 }), n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const p = curve.getPointAt(u);
    const tg = curve.getTangentAt(u);
    d.position.set(p.x, 0.02, p.z);
    d.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return im;
}

