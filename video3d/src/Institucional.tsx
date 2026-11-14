import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { InstitucionalProps, SceneMediaProps } from './types';

const SERIF = "'PT Serif Inst', Georgia, 'Times New Roman', serif";
const SANS = "Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Fade + subida curta a partir de um instante. */
function enter(t: number, at: number, dur = 0.5): { opacity: number; y: number } {
  const p = interpolate(t, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return { opacity: p, y: (1 - p) * 24 };
}

/** Um elemento de mídia, dentro da sua Sequence (o frame é relativo ao início dele). */
const MediaItem = ({ m, accent, u }: { m: SceneMediaProps; accent: string; u: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(1, Math.round(m.duration * fps));
  const fade = interpolate(frame, [0, 9, total - 9, total], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fill = { width: '100%', height: '100%', objectFit: 'cover' } as const;
  let body;
  if (m.type === 'image') {
    // Movimento lento (Ken Burns) para a imagem parada não parecer um diapositivo.
    const zoom = interpolate(frame, [0, total], [1, 1.07], { extrapolateRight: 'clamp' });
    body = <Img src={staticFile(m.src)} style={{ ...fill, transform: `scale(${zoom})` }} />;
  } else if (m.type === 'video') {
    const clip = Math.max(1, Math.round((m.clipSeconds ?? m.duration) * fps));
    body = (
      <Loop durationInFrames={clip}>
        <OffthreadVideo src={staticFile(m.src)} muted style={fill} />
      </Loop>
    );
  } else {
    body = <OffthreadVideo src={staticFile(m.src)} muted style={fill} />;
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 18 * u, border: `${4 * u}px solid ${accent}`, opacity: fade, background: '#000' }}>
      {body}
    </div>
  );
};

export const Institucional = (props: InstitucionalProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [handle] = useState(() => delayRender('a carregar a fonte'));
  const t = frame / fps;
  const end = durationInFrames / fps;
  // Unidade relativa: o mesmo desenho serve para 16:9, 9:16 e 1:1.
  const u = Math.min(width, height) / 1080;
  const landscape = width > height * 1.2;
  const portrait = height > width * 1.2;

  useEffect(() => {
    const face = new FontFace('PT Serif Inst', `url(${staticFile('PTSerif-Bold.ttf')})`, { weight: '700' });
    face
      .load()
      .then((f) => {
        document.fonts.add(f);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  let sceneIdx = 0;
  props.sceneStarts.forEach((s, i) => {
    if (t >= s) sceneIdx = i;
  });
  const scene = props.scenes[sceneIdx];
  const sceneStart = props.sceneStarts[sceneIdx] ?? 0;
  const isLast = sceneIdx === props.scenes.length - 1;
  const title = enter(t, sceneStart + 0.05);
  const fadeOut = interpolate(t, [end - 0.8, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hasMedia = Boolean(scene?.media);

  // Legenda atual, com a palavra em voz realçada de forma discreta.
  let li = -1;
  props.lines.forEach((l, i) => {
    if (t >= l.start) li = i;
  });
  const line = li >= 0 ? props.lines[li] : undefined;
  const showLine = line && t <= line.end + 0.5;

  const pad = 72 * u;
  const { bg, accent, text } = props.colors;

  // Em 16:9 com mídia, o texto fica na coluna da esquerda e a mídia na da direita.
  const textRight = landscape && hasMedia ? width * 0.5 : pad;
  const panel = landscape
    ? { left: width * 0.54, right: pad, top: 190 * u, bottom: 130 * u }
    : portrait
      ? { left: pad, right: pad, top: 640 * u, bottom: 640 * u }
      : { left: pad, right: pad, top: 400 * u, bottom: 360 * u };

  return (
    <AbsoluteFill style={{ backgroundColor: bg, backgroundImage: `linear-gradient(160deg, transparent 55%, ${accent}29 100%)`, fontFamily: SANS, color: text, opacity: fadeOut }}>
      {/* Cabeçalho: quem assina o vídeo */}
      <div style={{ position: 'absolute', left: pad, right: pad, top: 56 * u, display: 'flex', alignItems: 'center', gap: 22 * u, paddingBottom: 22 * u, borderBottom: `${3 * u}px solid ${accent}` }}>
        {props.logo && <Img src={staticFile(props.logo)} style={{ height: 76 * u, width: 'auto' }} />}
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 38 * u, fontWeight: 700, lineHeight: 1.1 }}>{props.entity}</div>
          {props.department && <div style={{ fontSize: 26 * u, opacity: 0.8, marginTop: 4 * u }}>{props.department}</div>}
        </div>
      </div>

      {/* Mídia das cenas: cada uma na sua Sequence */}
      <div style={{ position: 'absolute', ...panel }}>
        {props.scenes.map((s, i) =>
          s.media ? (
            <Sequence key={i} from={Math.round(s.media.from * fps)} durationInFrames={Math.max(1, Math.round(s.media.duration * fps))} layout="none">
              <MediaItem m={s.media} accent={accent} u={u} />
            </Sequence>
          ) : null,
        )}
      </div>

      {/* Título da cena */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          right: textRight,
          top: portrait ? 300 * u : landscape ? 250 * u : 190 * u,
          opacity: title.opacity,
          transform: `translateY(${title.y}px)`,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: (portrait ? 84 : landscape && hasMedia ? 64 : 76) * u,
          lineHeight: 1.12,
        }}
      >
        {scene?.title}
        <div style={{ width: 140 * u, height: 6 * u, background: accent, marginTop: 26 * u }} />
      </div>

      {/* Legenda */}
      {showLine && line && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: textRight,
            bottom: (portrait ? 330 : 210) * u,
            fontSize: (portrait ? 56 : landscape && hasMedia ? 42 : 48) * u,
            fontWeight: 600,
            lineHeight: 1.25,
            textShadow: '0 2px 12px rgba(0,0,0,.45)',
          }}
        >
          {line.words.map((w, i) => {
            const active = t >= w.start && t < w.end + 0.05;
            return (
              <span key={i} style={{ borderBottom: active ? `${5 * u}px solid ${accent}` : `${5 * u}px solid transparent` }}>
                {w.text}{' '}
              </span>
            );
          })}
        </div>
      )}

      {/* Fonte do dado da cena */}
      {scene?.source && (
        <div style={{ position: 'absolute', left: pad, right: textRight, bottom: (portrait ? 250 : 140) * u, fontSize: 26 * u, opacity: 0.85 }}>
          Fonte: {scene.source}
        </div>
      )}

      {/* Última cena: chamada para a ação */}
      {isLast && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: portrait ? 900 * u : 560 * u,
            background: accent,
            color: bg,
            fontWeight: 800,
            fontSize: 46 * u,
            padding: `${18 * u}px ${34 * u}px`,
            borderRadius: 12 * u,
            opacity: enter(t, sceneStart + 0.6).opacity,
          }}
        >
          {props.cta} · {props.site}
        </div>
      )}

      {/* Rodapé permanente: aviso legal e endereço */}
      <div style={{ position: 'absolute', left: pad, right: pad, bottom: 52 * u, display: 'flex', justifyContent: 'space-between', gap: 24 * u, fontSize: 24 * u, opacity: 0.75, borderTop: `${2 * u}px solid ${text}33`, paddingTop: 16 * u }}>
        <span>{props.disclaimer ?? ''}</span>
        <span>{props.site}</span>
      </div>

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      {props.music && <Audio src={staticFile(props.music)} volume={0.08} />}
    </AbsoluteFill>
  );
};
