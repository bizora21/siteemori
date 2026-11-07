import type { CSSProperties, ReactNode } from 'react';
import { clamp01, easeIO, keyed, sceneProgress } from './timing';

// Interface do rastreio público, desenhada como no produto real (cores do AppTheme:
// primária #0B4F6C, secundária #01BAEF, fundo #F5F7F9). Os dados são FICTÍCIOS.

export const DEMO = {
  code: 'TR-2026-10-00384',
  conteudo: 'Caixa de peças (12 kg)',
  remetente: 'Casa das Peças',
  destinatario: 'João M',
  origem: 'Terminal de Maputo (Maputo)',
  destino: 'Terminal da Beira (Beira)',
  registada: '27 out. 2026, 08:15',
  estimada: '29 out. 2026',
};

const PRIM = '#0B4F6C';
const SEC = '#01BAEF';
const TXT = '#16222b';
const MUTE = '#5b6b76';
const FONT = "'Segoe UI', Roboto, Arial, sans-serif";

const ICONS: Record<string, string> = {
  pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3.3 7.5L12 12.5l8.7-5 M12 22V12.5',
  send: 'M4 12h15 M13 6l6 6-6 6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 3.6-6 8-6s8 2 8 6',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  train: 'M7 3h10a2 2 0 012 2v10a3 3 0 01-3 3H8a3 3 0 01-3-3V5a2 2 0 012-2z M5 11h14 M8.5 15h.01 M15.5 15h.01 M9 21l2-3 M15 21l-2-3',
  truck: 'M2 6h12v10H2z M14 10h4l3 3v3h-7 M6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 118 0v3',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14z M20 20l-4.2-4.2',
  qr: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h3v3h-3z M19 14v6 M14 20h3',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2',
  camera: 'M4 8h3l2-3h6l2 3h3v12H4z M12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
};

export function Ico({ n, size = 30, color = MUTE, sw = 2 }: { n: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[n]} />
    </svg>
  );
}

function Campo({ ico, label, value, glow }: { ico: string; label: string; value: string; glow?: number }) {
  const g = glow ?? 0;
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: '10px 12px',
        margin: '0 -12px 2px',
        borderRadius: 16,
        background: g > 0 ? `rgba(1,186,239,${0.14 * g})` : 'transparent',
        boxShadow: g > 0 ? `0 0 0 ${3 * g}px rgba(1,186,239,${0.75 * g})` : 'none',
      }}
    >
      <div style={{ paddingTop: 4 }}>
        <Ico n={ico} size={30} />
      </div>
      <div>
        <div style={{ fontSize: 22, color: MUTE }}>{label}</div>
        <div style={{ fontSize: 29, color: TXT, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 26, padding: 26, boxShadow: '0 4px 18px rgba(11,79,108,.10)', ...style }}>
      {children}
    </div>
  );
}

// "Fotografia" do volume na recepção — ilustração (a real vem do bucket privado).
function FotoVolume() {
  return (
    <div
      style={{
        position: 'relative',
        height: 330,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#cdbfa8 0%,#b3a287 55%,#9a8a70 100%)',
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.22))' }} />
      {/* caixa */}
      <div style={{ position: 'absolute', left: 120, top: 70, width: 270, height: 200, background: 'linear-gradient(180deg,#c89a5c,#b48443)', borderRadius: 6, boxShadow: '0 30px 40px rgba(0,0,0,.35)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 56, background: 'linear-gradient(180deg,#d8ad70,#c89a5c)', borderRadius: '6px 6px 0 0' }} />
        <div style={{ position: 'absolute', left: 112, top: 0, width: 46, height: 200, background: 'rgba(226,206,160,.78)' }} />
        <div style={{ position: 'absolute', left: 24, top: 108, width: 74, height: 64, background: '#fff', borderRadius: 4, padding: 8 }}>
          <div style={{ height: 6, background: '#222', marginBottom: 5, width: '90%' }} />
          <div style={{ height: 6, background: '#222', marginBottom: 5, width: '60%' }} />
          <div style={{ height: 20, background: 'repeating-linear-gradient(90deg,#111 0 3px,#fff 3px 5px)' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 12, padding: '6px 14px', borderRadius: 999, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Ico n="camera" size={20} color="#fff" /> Recepção · Maputo
      </div>
    </div>
  );
}

const PASSOS = [
  { t: 'Recebida', local: 'Terminal de Maputo (Maputo)', obs: 'Registada e código emitido.', hora: '27 out., 08:15', ico: 'box' },
  { t: 'A caminho', local: 'Terminal de Maputo (Maputo)', obs: 'Segue para o Terminal da Beira.', hora: '27 out., 17:40', ico: 'truck' },
  { t: 'Chegou ao destino', local: 'Terminal da Beira (Beira)', obs: 'Chegou e pode ser levantada.', hora: '28 out., 22:05', ico: 'pin' },
  { t: 'Entregue', local: 'Terminal da Beira (Beira)', obs: 'Entregue ao destinatário.', hora: '29 out., 09:30', ico: 'check' },
];

function Passo({ p, k, show, pulse, last }: { p: (typeof PASSOS)[number]; k: number; show: number; pulse: number; last: boolean }) {
  const done = k === 3;
  const cor = done ? '#2E7D32' : k === 2 ? '#EF6C00' : PRIM;
  return (
    <div style={{ display: 'flex', gap: 20, opacity: show, transform: `translateX(${(1 - show) * 40}px)` }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            background: cor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: pulse > 0 ? `0 0 0 ${10 * pulse}px ${cor}33, 0 0 30px ${cor}88` : 'none',
          }}
        >
          <Ico n={p.ico} size={30} color="#fff" />
        </div>
        {!last && <div style={{ width: 4, flex: 1, minHeight: 56, background: '#d3dde3' }} />}
      </div>
      <div style={{ paddingBottom: 26 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: TXT }}>{p.t}</div>
        <div style={{ fontSize: 23, color: MUTE }}>{p.local}</div>
        <div style={{ fontSize: 23, color: TXT, marginTop: 2 }}>{p.obs}</div>
        <div style={{ fontSize: 21, color: MUTE, marginTop: 2 }}>{p.hora}</div>
      </div>
    </div>
  );
}

/** Quanto a página sobe em cada cena (px do ecrã do telemóvel). */
export const SCROLL = [0, 0, 0, 615, 1646, 560, 0];

export function PhoneUI({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const s3 = starts[2];
  const lt = t - s3; // tempo local da cena 3
  const scroll = keyed(t, starts, SCROLL, 1.1);

  // Cena 3: escreve o código, carrega em Consultar, o resultado aparece.
  const chars = Math.floor(clamp01((lt - 0.7) / 1.7) * DEMO.code.length);
  const typed = DEMO.code.slice(0, Math.max(0, chars));
  const caret = Math.floor(t * 2.4) % 2 === 0;
  const press = clamp01(1 - Math.abs(lt - 2.75) / 0.18);
  const resultado = easeIO(clamp01((lt - 3.0) / 0.7));

  // Cena 5: os passos aparecem à medida que são ditos.
  const p5 = sceneProgress(t, starts, 4, end);
  const showStep = (k: number) => (k < 2 ? 1 : easeIO(clamp01((p5 - (0.34 + (k - 2) * 0.17)) / 0.11)));
  const pulseStep = (k: number) => clamp01(1 - Math.abs(p5 - [0.1, 0.24, 0.4, 0.56][k]) / 0.09) * (t >= starts[4] ? 1 : 0);
  const entregue = showStep(3) > 0.6;

  // Destaques por cena
  const s4 = sceneProgress(t, starts, 3, end);
  const glowRem = clamp01(Math.sin(Math.min(1, s4 * 1.3) * Math.PI) * 1.4) * (t >= starts[3] ? 1 : 0);
  const glowFoto = clamp01((s4 - 0.28) * 4) * clamp01((1 - s4) * 6 + 0.4);
  const s6 = sceneProgress(t, starts, 5, end);
  const glowDest = clamp01(Math.sin(clamp01(s6 * 1.1) * Math.PI) * 1.5) * (t >= starts[5] ? 1 : 0);

  const badge = entregue ? { c: '#2E7D32', txt: 'Entregue' } : { c: '#EF6C00', txt: 'Em trânsito' };

  return (
    <div style={{ width: 560, height: 1180, background: '#F5F7F9', fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
      {/* cabeçalho FIXO: o conteúdo desliza por baixo dele */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5, background: PRIM, boxShadow: '0 2px 10px rgba(0,0,0,.25)' }}>
        <div style={{ height: 52, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', fontSize: 22, fontWeight: 600 }}>
          <span>9:41</span>
          <span style={{ letterSpacing: 3 }}>●●● ▮</span>
        </div>
        <div style={{ height: 82, color: '#fff', display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 31, fontWeight: 600 }}>
          Rastrear encomenda
        </div>
      </div>

      <div style={{ transform: `translateY(${-scroll}px)`, padding: 26, paddingTop: 160 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: TXT }}>Escreva o código de rastreio</div>
        <div style={{ fontSize: 22, color: MUTE, margin: '6px 0 20px' }}>
          Está no talão que recebeu ao enviar, no formato TR‑2026‑10‑00001.
        </div>

        <div style={{ border: `2.5px solid ${typed ? PRIM : '#b8c4cc'}`, borderRadius: 14, height: 84, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', background: '#fff' }}>
          <Ico n="qr" size={34} color={MUTE} />
          <div style={{ fontSize: 31, color: typed ? TXT : '#9aa8b1', letterSpacing: 1.5, fontWeight: 500 }}>
            {typed || 'TR-2026-10-00001'}
            {typed && caret && chars < DEMO.code.length ? <span style={{ color: SEC }}>|</span> : null}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            height: 80,
            borderRadius: 40,
            background: PRIM,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            fontSize: 30,
            fontWeight: 600,
            transform: `scale(${1 - press * 0.06})`,
            boxShadow: press > 0 ? `0 0 0 ${14 * press}px rgba(1,186,239,${0.35 * press})` : 'none',
          }}
        >
          <Ico n="search" size={32} color="#fff" /> Consultar
        </div>

        <div style={{ marginTop: 30, opacity: resultado, transform: `translateY(${(1 - resultado) * 50}px)` }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 31, fontWeight: 800, letterSpacing: 0.6, color: TXT }}>{DEMO.code}</div>
              <div style={{ background: badge.c, color: '#fff', borderRadius: 999, padding: '7px 18px', fontSize: 22, fontWeight: 600 }}>{badge.txt}</div>
            </div>
            <Campo ico="send" label="Percurso" value={`${DEMO.origem}  →  ${DEMO.destino}`} />
            <Campo ico="box" label="Conteúdo" value={DEMO.conteudo} />
            <Campo ico="send" label="Remetente" value={DEMO.remetente} glow={glowRem} />
            <Campo ico="user" label="Destinatário" value={DEMO.destinatario} glow={glowDest} />
            <Campo ico="cal" label="Registada em" value={DEMO.registada} />
            <Campo ico={entregue ? 'check' : 'clock'} label={entregue ? 'Entregue em' : 'Entrega estimada'} value={entregue ? '29 out. 2026, 09:30' : DEMO.estimada} />
          </Card>

          <Card style={{ marginTop: 22, boxShadow: glowFoto > 0 ? `0 0 0 ${4 * glowFoto}px rgba(1,186,239,${0.85 * glowFoto}), 0 4px 18px rgba(11,79,108,.10)` : undefined }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: TXT, marginBottom: 14 }}>Foto da encomenda na recepção</div>
            <FotoVolume />
          </Card>

          <div style={{ marginTop: 22, padding: 20, borderRadius: 18, background: 'rgba(239,108,0,.10)', display: 'flex', gap: 16, alignItems: 'center' }}>
            <Ico n="pin" size={34} color={entregue ? '#2E7D32' : '#EF6C00'} />
            <div>
              <div style={{ fontSize: 21, color: MUTE }}>Última localização conhecida</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: TXT }}>{entregue ? 'Terminal da Beira, Beira' : 'Terminal de Maputo, Maputo'}</div>
            </div>
          </div>

          <div style={{ fontSize: 32, fontWeight: 700, color: TXT, margin: '30px 0 18px' }}>Histórico</div>
          <div>
            {PASSOS.map((p, k) => (
              <Passo key={k} p={p} k={k} show={showStep(k)} pulse={pulseStep(k)} last={k === PASSOS.length - 1} />
            ))}
          </div>
          <div style={{ height: 120 }} />
        </div>
      </div>
    </div>
  );
}
