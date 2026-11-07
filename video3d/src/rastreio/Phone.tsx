import type { ReactNode } from 'react';
import { keyed } from './timing';

const W = 604;
const H = 1224;

// Valores por cena: [gancho, talão, escreve, foto, passos, privacidade, fecho]
const Y = [2300, 2300, 0, 0, 215, 15, -10];
const SCALE = [1, 1, 1, 1, 0.72, 0.96, 0.9];
const ROT_Y = [-28, -28, -10, 7, 0, -7, 0];
const ROT_X = [10, 10, 4, 2, 5, 2, 4];

/** Telemóvel em 3D por CSS: perspectiva, inclinação e espessura (camadas em Z). */
export function Phone({ t, starts, children }: { t: number; starts: number[]; children: ReactNode }) {
  const y = keyed(t, starts, Y, 1.1);
  const sc = keyed(t, starts, SCALE, 1.1);
  const ry = keyed(t, starts, ROT_Y, 1.3) + Math.sin(t * 0.8) * 3.2;
  const rx = keyed(t, starts, ROT_X, 1.3) + Math.cos(t * 0.7) * 1.4;
  const bob = Math.sin(t * 1.3) * 9;

  const frame = (z: number, bg: string, extra = {}) => ({
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 96,
    background: bg,
    transform: `translateZ(${z}px)`,
    ...extra,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        perspective: 2400,
        perspectiveOrigin: '50% 45%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 540 - W / 2,
          top: 860 - H / 2,
          width: W,
          height: H,
          transformStyle: 'preserve-3d',
          transform: `translateY(${y + bob}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {/* espessura: camadas atrás */}
        {[-34, -26, -18, -10, -4].map((z, i) => (
          <div key={z} style={frame(z, i % 2 ? '#0a0d12' : '#151a22')} />
        ))}
        {/* sombra projectada */}
        <div
          style={{
            position: 'absolute',
            inset: 40,
            borderRadius: 96,
            transform: 'translateZ(-60px)',
            boxShadow: '0 90px 160px rgba(0,0,0,.65), 0 0 120px rgba(1,186,239,.22)',
          }}
        />
        {/* corpo */}
        <div
          style={frame(0, 'linear-gradient(145deg,#2a3340 0%,#0f141b 45%,#1b222c 100%)', {
            boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.18), inset 0 0 40px rgba(0,0,0,.6)',
          })}
        />
        {/* ecrã */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 22,
            width: W - 44,
            height: H - 44,
            borderRadius: 78,
            overflow: 'hidden',
            background: '#000',
            transform: 'translateZ(2px)',
          }}
        >
          {children}
          {/* reflexo de vidro */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.06) 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* ilha da câmara */}
          <div style={{ position: 'absolute', left: '50%', top: 14, width: 150, height: 38, marginLeft: -75, borderRadius: 19, background: '#05070a' }} />
        </div>
      </div>
    </div>
  );
}
