import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import opentype from 'opentype.js';
import { World } from './rastreio/World';
import { Phone } from './rastreio/Phone';
import { PhoneUI } from './rastreio/PhoneUI';
import { Talao } from './rastreio/Talao';
import { keyed } from './rastreio/timing';
import type { RastreioProps } from './types';

const FONT_FILE = 'PTSerif-Bold.ttf';
const SANS = "'Segoe UI', Roboto, Arial, sans-serif";

// Legendas: linha inteira, palavra falada realçada. Zona segura: acima da UI das redes.
function Captions({ lines }: Pick<RastreioProps, 'lines'>) {
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
          <span
            key={i}
            style={{
              color: active ? '#ffd166' : undefined,
              textShadow: active ? '0 0 30px rgba(255,200,80,.75), 0 6px 22px rgba(0,0,0,.7)' : undefined,
            }}
          >
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

function Cta({ cta, site, from }: { cta: string; site: string; from: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from, fps, config: { damping: 13, stiffness: 110 } });
  if (frame < from) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1708,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + s * 0.1})`,
        opacity: s,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          padding: '20px 62px',
          borderRadius: 999,
          background: 'linear-gradient(180deg,#27cdfc,#0a93c0)',
          color: '#fff',
          fontSize: 56,
          fontWeight: 800,
          boxShadow: '0 12px 40px rgba(1,186,239,.5), inset 0 2px 0 rgba(255,255,255,.35)',
        }}
      >
        {cta}
      </div>
      <div style={{ color: '#eaf8ff', fontSize: 44, fontWeight: 700, letterSpacing: 1 }}>{site}</div>
    </div>
  );
}

export const Rastreio3D = (props: RastreioProps) => {
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
  const volume = interpolate(frame, [0, fps, durationInFrames - fps, durationInFrames], [0, 0.09, 0.09, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // O rótulo do topo entra depois do gancho (no gancho manda o título 3D).
  const tag = keyed(t, starts, [0, 1, 1, 1, 1, 1, 1], 0.8) - keyed(t, starts, [0, 0, 0, 0, 1, 1, 1], 0.6) + keyed(t, starts, [0, 0, 0, 0, 0, 1, 1], 0.6);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 55% at 50% 48%, rgba(1,150,200,${0.42 * glow}) 0%, #082233 48%, #040c14 100%)`,
      }}
    >
      {font && <World font={font} t={t} frame={frame} fps={fps} starts={starts} end={end} width={width} height={height} />}

      <Talao t={t} starts={starts} end={end} />
      <Phone t={t} starts={starts}>
        <PhoneUI t={t} starts={starts} end={end} />
      </Phone>

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.5) 100%)' }} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 78,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 8,
          color: '#9fe3ff',
          opacity: tag * 0.9,
        }}
      >
        RASTREIO DE ENCOMENDAS
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1490,
          height: 440,
          background: 'linear-gradient(180deg, transparent, rgba(3,9,15,.82) 30%, rgba(3,9,15,.82) 82%, transparent)',
        }}
      />
      <Captions lines={props.lines} />
      <Cta cta={props.cta} site={props.site} from={Math.floor(props.voiceEndSeconds * fps) - 10} />

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      <Audio src={staticFile('music.mp3')} volume={volume} loop />
    </AbsoluteFill>
  );
};
