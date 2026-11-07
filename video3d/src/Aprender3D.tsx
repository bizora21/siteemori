import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import opentype from 'opentype.js';
import { World } from './aprender/World';
import { Phone } from './aprender/Phone';
import { AppUI } from './aprender/AppUI';
import { AppUI2 } from './aprender/AppUI2';
import { keyed } from './rastreio/timing';
import type { AprenderProps } from './types';

const FONT_FILE = 'PTSerif-Bold.ttf';
const SANS = "'Segoe UI', Roboto, Arial, sans-serif";
const GOLD = '#ffd978';

// Legendas: linha inteira, palavra falada realçada. Zona segura: acima da UI das redes.
function Captions({ lines }: Pick<AprenderProps, 'lines'>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = -1;
  lines.forEach((l, i) => {
    if (t >= l.start) idx = i;
  });
  const line = idx >= 0 ? lines[idx] : undefined;
  if (!line || t > line.end + 0.6) return null;
  const pop = spring({ frame: frame - Math.floor(line.start * fps), fps, config: { damping: 16, stiffness: 170 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1536,
        textAlign: 'center',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 74,
        lineHeight: 1.12,
        color: '#ffffff',
        textShadow: '0 6px 26px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.95)',
        transform: `scale(${0.95 + pop * 0.05})`,
        opacity: Math.min(1, pop * 1.4),
      }}
    >
      {line.words.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.04;
        return (
          <span key={i} style={{ color: active ? GOLD : undefined, textShadow: active ? '0 0 30px rgba(255,200,80,.75), 0 6px 22px rgba(0,0,0,.7)' : undefined }}>
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

// Gancho-desafio: "VOCÊ ACERTA?" desde o primeiro quadro → contagem 3-2-1 → "É SALMOS!".
function HookText({ countFrom, reveal, until }: { countFrom: number; reveal: number; until: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const out = 1 - interpolate(t, [until, until + 0.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (out <= 0.01) return null;

  const counting = t >= countFrom && t < reveal;
  const revealed = t >= reveal;
  const span = Math.max(0.3, reveal - countFrom);
  const scaled = ((reveal - t) / span) * 3;
  const n = Math.max(1, Math.min(3, Math.ceil(scaled)));
  const beat = counting ? 1 - (scaled - Math.floor(scaled)) : 1;
  const pop = revealed ? spring({ frame: frame - Math.floor(reveal * fps), fps, config: { damping: 11, stiffness: 190 } }) : 1;

  const label = revealed ? 'É SALMOS!' : counting ? String(n) : 'VOCÊ ACERTA?';
  const size = counting ? 190 : revealed ? 118 : 112;
  const scale = counting ? 1.18 - beat * 0.18 : revealed ? 0.8 + pop * 0.2 : 1;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: counting ? 40 : 96, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: out, zIndex: 10 }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: 2,
          color: revealed ? '#9be0b0' : GOLD,
          textShadow: '0 8px 30px rgba(0,0,0,.8), 0 0 40px rgba(255,200,80,.5)',
          transform: `scale(${scale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Cta({ cta, site, from }: { cta: string; site: string; from: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from, fps, config: { damping: 13, stiffness: 110 } });
  const pulse = 1 + Math.sin((frame - from) / 7) * 0.025;
  if (frame < from) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `translateY(${(1 - s) * 70}px) scale(${0.9 + s * 0.1})`, opacity: s, fontFamily: SANS }}>
      <Img src={staticFile('emori-icon.png')} style={{ width: 160, height: 160, filter: 'drop-shadow(0 14px 30px rgba(0,0,0,.55)) drop-shadow(0 0 28px rgba(242,197,107,.45))' }} />
      <div style={{ color: '#fff', fontSize: 66, fontWeight: 800, textShadow: '0 4px 20px rgba(0,0,0,.6)' }}>{site}</div>
      <div style={{ color: '#e8f2ea', fontSize: 36, fontWeight: 600, marginTop: -6 }}>Aplicativo bíblico de fé e orações</div>
      <div
        style={{
          marginTop: 8,
          padding: '20px 70px',
          borderRadius: 999,
          background: 'linear-gradient(180deg,#8fbf9f,#4A6B57)',
          color: '#fff',
          fontSize: 56,
          fontWeight: 800,
          transform: `scale(${pulse})`,
          boxShadow: '0 12px 40px rgba(110,158,127,.55), inset 0 2px 0 rgba(255,255,255,.35)',
        }}
      >
        {cta}
      </div>
    </div>
  );
}

export const Aprender3D = (props: AprenderProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [handle] = useState(() => delayRender('a carregar a fonte'));
  const t = frame / fps;
  const end = durationInFrames / fps;
  const starts = props.sceneStarts;

  useEffect(() => {
    opentype
      .load(staticFile(FONT_FILE))
      .then((f) => {
        setFont(f);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);

  const glow = interpolate(frame, [0, 30, durationInFrames], [0.6, 1, 0.9]);
  const volume = interpolate(frame, [0, props.hook ? fps * 0.3 : fps * 1.2, durationInFrames - fps * 1.5, durationInFrames], [0, 0.17, 0.17, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 48%, rgba(74,107,87,${0.55 * glow}) 0%, #0d241a 48%, #040b07 100%)` }}>
      {font && <World font={font} t={t} frame={frame} fps={fps} starts={starts} width={width} height={height} title={props.title} hook={!!props.hook} />}

      <Phone t={t} starts={starts} hook={!!props.hook}>
        {props.version === 2 ? (
          <AppUI2 t={t} starts={starts} end={end} tapHint={props.tapHint ?? starts[3] + 2} tapRight={props.tapRight} badgesAt={props.badgesAt ?? starts[5] + 6} remindAt={props.remindAt ?? starts[5] + 9} hookAt={props.hook?.reveal} />
        ) : (
          <AppUI t={t} starts={starts} end={end} tapRight={props.tapRight} tapWrong={props.tapWrong} />
        )}
      </Phone>

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.5) 100%)' }} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1490, height: 440, background: 'linear-gradient(180deg, transparent, rgba(3,9,6,.82) 30%, rgba(3,9,6,.82) 82%, transparent)' }} />
      <Captions lines={props.lines} />
      {props.hook && <HookText countFrom={props.hook.countFrom} reveal={props.hook.reveal} until={starts[1]} />}
      <Cta cta={props.cta} site={props.site} from={Math.floor(starts[6] * fps) + 20} />

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      <Audio src={staticFile(props.music)} volume={volume} loop />
    </AbsoluteFill>
  );
};
