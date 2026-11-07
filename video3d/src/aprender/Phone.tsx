import type { ReactNode } from 'react';
import { keyed } from '../rastreio/timing';

const W = 604;
const H = 1224;

// Valores por cena: [gancho, app, níveis, pergunta, erro, próximo nível, fecho]
const Y = [2300, 40, 40, 40, 40, 40, 2300];
const SCALE = [1, 0.98, 1, 1, 1, 1, 1];
const ROT_Y = [-28, -12, 9, -7, 7, -8, -28];
const ROT_X = [10, 5, 3, 3, 3, 3, 10];

/** Telemóvel em 3D por CSS: perspectiva, inclinação e espessura (camadas em Z). */
export function Phone({ t, starts, children, hook }: { t: number; starts: number[]; children: ReactNode; hook?: boolean }) {
  // No gancho em formato desafio o telemóvel já está no ecrã no primeiro quadro.
  const y = keyed(t, starts, hook ? [40, ...Y.slice(1)] : Y, 1.1);
  const sc = keyed(t, starts, SCALE, 1.1);
  const ry = keyed(t, starts, hook ? [-8, ...ROT_Y.slice(1)] : ROT_Y, 1.2) + Math.sin(t * 0.8) * 2.6;
  const rx = keyed(t, starts, hook ? [3, ...ROT_X.slice(1)] : ROT_X, 1.2) + Math.cos(t * 0.7) * 1.2;
  const bob = Math.sin(t * 1.3) * 8;

  const frame = (z: number, bg: string, extra = {}) => ({
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 96,
    background: bg,
    transform: `translateZ(${z}px)`,
    ...extra,
  });

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, perspective: 2400, perspectiveOrigin: '50% 45%', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 540 - W / 2,
          top: 820 - H / 2,
          width: W,
          height: H,
          transformStyle: 'preserve-3d',
          transform: `translateY(${y + bob}px) scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {[-34, -26, -18, -10, -4].map((z, i) => (
          <div key={z} style={frame(z, i % 2 ? '#0a0f0c' : '#18201b')} />
        ))}
        <div style={{ position: 'absolute', inset: 40, borderRadius: 96, transform: 'translateZ(-60px)', boxShadow: '0 90px 160px rgba(0,0,0,.65), 0 0 130px rgba(242,197,107,.26)' }} />
        <div style={frame(0, 'linear-gradient(145deg,#38423b 0%,#101612 45%,#222b25 100%)', { boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.18), inset 0 0 40px rgba(0,0,0,.6)' })} />
        <div style={{ position: 'absolute', left: 22, top: 22, width: W - 44, height: H - 44, borderRadius: 78, overflow: 'hidden', background: '#000', transform: 'translateZ(2px)' }}>
          {children}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.06) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', top: 14, width: 150, height: 38, marginLeft: -75, borderRadius: 19, background: '#05070a' }} />
        </div>
      </div>
    </div>
  );
}
