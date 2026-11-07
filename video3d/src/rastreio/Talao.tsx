import { clamp01, easeIO, keyed, sceneProgress } from './timing';
import { DEMO, Ico } from './PhoneUI';

const FONT = "'Courier New', Consolas, monospace";

/** Pseudo-QR determinístico (não é um QR válido; é só ilustração do talão). */
function Qr() {
  const n = 17;
  const cells: boolean[] = [];
  let s = 11;
  for (let i = 0; i < n * n; i++) {
    s = (s * 16807) % 2147483647;
    cells.push(s % 100 < 52);
  }
  const finder = (x: number, y: number) => (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n},1fr)`, width: 150, height: 150, gap: 0 }}>
      {cells.map((c, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        const on = finder(x, y) ? (x % (n - 5) === 0 || y % (n - 5) === 0 || ((x === 2 || x === n - 3) && (y === 2 || y === n - 3)) || (x === 2 && y === 2)) : c;
        return <div key={i} style={{ background: on ? '#111' : '#fff' }} />;
      })}
    </div>
  );
}

/** Talão de envio em papel, a flutuar em 3D; o código é sublinhado a marcador. */
export function Talao({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const enter = keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 1.0);
  const exit = keyed(t, starts, [0, 0, 1, 1, 1, 1, 1], 0.9);
  if (enter <= 0.001 || exit >= 0.999) return null;

  const p2 = sceneProgress(t, starts, 1, end);
  const marker = easeIO(clamp01((p2 - 0.18) / 0.22));
  const chip1 = easeIO(clamp01((p2 - 0.52) / 0.12));
  const chip2 = easeIO(clamp01((p2 - 0.72) / 0.12));

  const ry = -14 + Math.sin(t * 0.9) * 9;
  const rx = 6 + Math.cos(t * 0.7) * 3;

  const tear = 'polygon(0 0,100% 0,100% 100%,' + Array.from({ length: 21 }, (_, i) => `${100 - i * 5}% ${i % 2 ? 97 : 100}%`).join(',') + ',0 100%)';

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, perspective: 2200, opacity: 1 - exit }}>
      <div
        style={{
          position: 'absolute',
          left: 540 - 250,
          top: 430,
          width: 500,
          transformStyle: 'preserve-3d',
          transform: `translateY(${(1 - enter) * 900 + exit * -500 + Math.sin(t * 1.2) * 10}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${-3 + (1 - enter) * 14}deg) scale(${0.9 + enter * 0.1})`,
          filter: 'drop-shadow(0 50px 60px rgba(0,0,0,.55))',
        }}
      >
        <div style={{ background: '#fbf8f1', clipPath: tear, padding: '44px 38px 70px', fontFamily: FONT, color: '#1a1a1a' }}>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 30, letterSpacing: 3 }}>TALÃO DE ENVIO</div>
          <div style={{ textAlign: 'center', fontSize: 20, color: '#666', marginBottom: 22 }}>Terminal de Maputo</div>
          <div style={{ borderTop: '3px dashed #bbb', margin: '6px 0 20px' }} />
          {[
            ['Origem', 'Maputo'],
            ['Destino', 'Beira'],
            ['Conteúdo', 'Caixa de peças'],
            ['Remetente', DEMO.remetente],
          ].map(([a, b]) => (
            <div key={a} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, marginBottom: 9 }}>
              <span style={{ color: '#777' }}>{a}</span>
              <span style={{ fontWeight: 700 }}>{b}</span>
            </div>
          ))}
          <div style={{ borderTop: '3px dashed #bbb', margin: '20px 0' }} />
          <div style={{ textAlign: 'center', fontSize: 20, color: '#555', letterSpacing: 2 }}>CÓDIGO DE RASTREIO</div>
          <div style={{ position: 'relative', textAlign: 'center', margin: '10px 0 22px' }}>
            <div style={{ position: 'absolute', left: 4, bottom: 3, height: 26, width: `${marker * 100}%`, maxWidth: 'calc(100% - 8px)', background: 'rgba(255,208,70,.85)', borderRadius: 3 }} />
            <div style={{ position: 'relative', fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>{DEMO.code}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Qr />
          </div>
        </div>

        {/* etiquetas a flutuar à frente do talão */}
        <div style={{ position: 'absolute', left: -150, top: 430, transform: `translateZ(90px) scale(${chip1}) rotate(-5deg)`, opacity: chip1 }}>
          <Chip text="Sem criar conta" />
        </div>
        <div style={{ position: 'absolute', right: -170, top: 560, transform: `translateZ(110px) scale(${chip2}) rotate(4deg)`, opacity: chip2 }}>
          <Chip text="Sem instalar nada" />
        </div>
      </div>
    </div>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 28px',
        borderRadius: 999,
        background: 'linear-gradient(180deg,#19c3f2,#0a93c0)',
        color: '#fff',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
        fontWeight: 700,
        fontSize: 34,
        whiteSpace: 'nowrap',
        boxShadow: '0 16px 40px rgba(1,186,239,.45), inset 0 2px 0 rgba(255,255,255,.35)',
      }}
    >
      <Ico n="check" size={34} color="#fff" sw={3} />
      {text}
    </div>
  );
}
