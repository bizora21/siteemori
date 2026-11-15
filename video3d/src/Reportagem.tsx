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
import type { ReportagemProps, SceneMediaProps } from './types';

const SERIF = "'PT Serif Rep', Georgia, 'Times New Roman', serif";
const SANS = "Roboto, 'Helvetica Neue', Arial, sans-serif";

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Mídia em ecrã inteiro: apresentador, vídeo (em ciclo) ou imagem com movimento lento. */
const FullMedia = ({ m, fadeFrames = 7 }: { m: SceneMediaProps; fadeFrames?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(2, Math.round(m.duration * fps));
  const fade = interpolate(frame, [0, fadeFrames, total - fadeFrames, total], [0, 1, 1, 0], clamp);
  const fill = { width: '100%', height: '100%', objectFit: 'cover' } as const;
  let body;
  if (m.type === 'image') {
    // Movimento lento (Ken Burns): a imagem parada ganha vida sem distrair.
    const zoom = interpolate(frame, [0, total], [1.02, 1.1], clamp);
    const drift = interpolate(frame, [0, total], [0, -18], clamp);
    body = <Img src={staticFile(m.src)} style={{ ...fill, transform: `scale(${zoom}) translateX(${drift}px)` }} />;
  } else if (m.type === 'video') {
    const clip = Math.max(1, Math.round((m.clipSeconds ?? m.duration) * fps));
    body = (
      <Loop durationInFrames={clip}>
        <OffthreadVideo src={staticFile(m.src)} muted style={fill} />
      </Loop>
    );
  } else {
    // Apresentador: o rosto costuma estar no terço superior, por isso o corte favorece-o.
    body = <OffthreadVideo src={staticFile(m.src)} muted style={{ ...fill, objectPosition: '50% 30%' }} />;
  }
  return <AbsoluteFill style={{ opacity: fade, background: '#000' }}>{body}</AbsoluteFill>;
};

/** O rosto num círculo (sem recorte da pessoa: o fundo da gravação fica escondido pela forma). */
const FaceBubble = ({ m, size, left, bottom, accent }: { m: SceneMediaProps; size: number; left: number; bottom: number; accent: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(2, Math.round(m.duration * fps));
  const pop = interpolate(frame, [0, 9], [0.7, 1], clamp);
  const fade = interpolate(frame, [0, 6, total - 6, total], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom,
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `${Math.max(4, size * 0.02)}px solid ${accent}`,
        boxShadow: '0 12px 44px rgba(0,0,0,.6)',
        background: '#000',
        opacity: fade,
        transform: `scale(${pop})`,
        transformOrigin: 'left bottom',
      }}
    >
      {/* O rosto costuma estar no terço superior do quadro: o corte favorece-o */}
      <OffthreadVideo src={staticFile(m.src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%' }} />
    </div>
  );
};

/** A cena tem cenário (fundo ou cortes)? Então o rosto passa a bolha. */
const hasScenery = (s: ReportagemProps['scenes'][number]) => Boolean(s.media) || (s.cutaways?.length ?? 0) > 0;

const BUBBLE = 380; // diâmetro da bolha (unidades u)
const BUBBLE_BOTTOM = 560;

const Pin = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
  </svg>
);

export const Reportagem = (props: ReportagemProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [handle] = useState(() => delayRender('a carregar a fonte'));
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const portrait = height > width * 1.2;
  const { bg, accent, text } = props.colors;
  const pad = 56 * u;

  useEffect(() => {
    const face = new FontFace('PT Serif Rep', `url(${staticFile('PTSerif-Bold.ttf')})`, { weight: '700' });
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
  const bubbleNow = Boolean(scene?.face) && hasScenery(scene);
  const sceneT = t - sceneStart;

  // Legenda atual (karaoke discreto: a palavra em voz leva a cor da marca).
  let li = -1;
  props.lines.forEach((l, i) => {
    if (t >= l.start) li = i;
  });
  const line = li >= 0 ? props.lines[li] : undefined;
  const showLine = line && t <= line.end + 0.45;

  const fadeOut = interpolate(t, [end - 0.6, end], [1, 0], clamp);
  const progress = Math.min(1, t / end);

  // Etiqueta de nome: aparece no início do vídeo e sai ao fim de ~3,4 s.
  const nameIn = interpolate(t, [props.leadSeconds + 0.5, props.leadSeconds + 1.0], [0, 1], clamp);
  const nameOut = interpolate(t, [props.leadSeconds + 3.4, props.leadSeconds + 3.9], [1, 0], clamp);
  const nameVis = Math.min(nameIn, nameOut);

  const locIn = interpolate(sceneT, [0.15, 0.6], [0, 1], clamp);
  const ctaIn = interpolate(sceneT, [0.4, 0.9], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${bg} 0%, #000 100%)`, fontFamily: SANS, color: text, opacity: fadeOut }}>
      {/* Cenário de cada cena (imagem ou vídeo de fundo) */}
      {props.scenes.map((s, i) =>
        s.media ? (
          <Sequence key={`m${i}`} from={Math.round(s.media.from * fps)} durationInFrames={Math.max(2, Math.round(s.media.duration * fps))} layout="none">
            <FullMedia m={s.media} fadeFrames={s.media.type === 'presenter' ? 4 : 8} />
          </Sequence>
        ) : null,
      )}

      {/* Rosto em ecrã inteiro: só nas cenas SEM cenário (com cenário passa a bolha) */}
      {props.scenes.map((s, i) =>
        s.face && !hasScenery(s) ? (
          <Sequence key={`f${i}`} from={Math.round(s.face.from * fps)} durationInFrames={Math.max(2, Math.round(s.face.duration * fps))} layout="none">
            <FullMedia m={s.face} fadeFrames={4} />
          </Sequence>
        ) : null,
      )}

      {/* Cena sem nada para mostrar: cartão de título */}
      {!scene?.media && !scene?.face && !(scene?.cutaways?.length) && scene?.title && (
        <div style={{ position: 'absolute', left: pad, right: pad, top: '34%', fontFamily: SERIF, fontWeight: 700, fontSize: (portrait ? 96 : 84) * u, lineHeight: 1.1, opacity: interpolate(sceneT, [0.1, 0.6], [0, 1], clamp) }}>
          {scene.title}
          <div style={{ width: 150 * u, height: 8 * u, background: accent, marginTop: 28 * u }} />
        </div>
      )}

      {/* Cortes para imagens/vídeos do local, enquanto a voz continua */}
      {props.scenes.flatMap((s, i) =>
        (s.cutaways ?? []).map((c, k) => (
          <Sequence key={`c${i}-${k}`} from={Math.round(c.from * fps)} durationInFrames={Math.max(2, Math.round(c.duration * fps))} layout="none">
            <FullMedia m={c} fadeFrames={7} />
          </Sequence>
        )),
      )}

      {/* O rosto em bolha, por cima do cenário e dos cortes */}
      {props.scenes.map((s, i) =>
        s.face && hasScenery(s) ? (
          <Sequence key={`b${i}`} from={Math.round(s.face.from * fps)} durationInFrames={Math.max(2, Math.round(s.face.duration * fps))} layout="none">
            <FaceBubble m={s.face} size={BUBBLE * u} left={pad} bottom={BUBBLE_BOTTOM * u} accent={accent} />
          </Sequence>
        ) : null,
      )}

      {/* Sombras para o texto ler-se sobre qualquer imagem */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,.72) 100%)', pointerEvents: 'none' }} />

      {/* Progresso */}
      <div style={{ position: 'absolute', left: 0, top: 0, height: 6 * u, width: `${progress * 100}%`, background: accent }} />

      {/* Marca d'água */}
      {props.logo && <Img src={staticFile(props.logo)} style={{ position: 'absolute', right: pad, top: (portrait ? 118 : 40) * u, height: 64 * u, width: 'auto', opacity: 0.92 }} />}

      {/* Local */}
      {scene?.location && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: (portrait ? 118 : 40) * u,
            display: 'flex',
            alignItems: 'center',
            gap: 12 * u,
            background: 'rgba(0,0,0,.55)',
            border: `${2 * u}px solid ${accent}`,
            borderRadius: 99 * u,
            padding: `${10 * u}px ${24 * u}px ${10 * u}px ${16 * u}px`,
            fontSize: 32 * u,
            fontWeight: 700,
            opacity: locIn,
            transform: `translateX(${(1 - locIn) * -30}px)`,
          }}
        >
          <Pin color={accent} size={36 * u} />
          {scene.location}
        </div>
      )}

      {/* Etiqueta de nome (início do vídeo) */}
      {props.host?.name && nameVis > 0 && (
        <div
          style={{
            position: 'absolute',
            // com o rosto em bolha, o nome fica ao lado dela
            left: bubbleNow ? pad + (BUBBLE + 28) * u : pad,
            bottom: bubbleNow ? (BUBBLE_BOTTOM + BUBBLE / 2 - 50) * u : (portrait ? 560 : 250) * u,
            opacity: nameVis,
            transform: `translateX(${(1 - nameVis) * -60}px)`,
            borderLeft: `${8 * u}px solid ${accent}`,
            paddingLeft: 22 * u,
            textShadow: '0 3px 16px rgba(0,0,0,.7)',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64 * u, lineHeight: 1.05 }}>{props.host.name}</div>
          {props.host.role && <div style={{ fontSize: 34 * u, opacity: 0.92, marginTop: 6 * u }}>{props.host.role}</div>}
        </div>
      )}

      {/* Última cena: chamada para a ação */}
      {isLast && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad,
            bottom: (portrait ? 560 : 250) * u,
            display: 'flex',
            justifyContent: 'center',
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 40}px)`,
          }}
        >
          <div style={{ background: accent, color: bg, fontWeight: 800, fontSize: 54 * u, padding: `${20 * u}px ${40 * u}px`, borderRadius: 18 * u, textAlign: 'center', lineHeight: 1.15, boxShadow: '0 10px 40px rgba(0,0,0,.45)' }}>
            {props.cta}
            <div style={{ fontSize: 34 * u, fontWeight: 700, marginTop: 6 * u, opacity: 0.85 }}>{props.site}</div>
          </div>
        </div>
      )}

      {/* Legenda: dentro da zona segura (a interface das redes cobre a base e a direita) */}
      {showLine && line && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad + (portrait ? 90 * u : 0),
            bottom: (portrait ? 330 : 110) * u,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: (portrait ? 74 : 60) * u,
            lineHeight: 1.12,
            textShadow: `0 0 ${8 * u}px rgba(0,0,0,.95), 0 ${4 * u}px ${22 * u}px rgba(0,0,0,.8)`,
            WebkitTextStroke: `${2.5 * u}px rgba(0,0,0,.85)`,
            paintOrder: 'stroke fill',
          }}
        >
          {line.words.map((w, i) => {
            const active = t >= w.start && t < w.end + 0.04;
            return (
              <span key={i} style={{ color: active ? accent : text }}>
                {w.text}{' '}
              </span>
            );
          })}
        </div>
      )}

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      {props.music && <Audio src={staticFile(props.music)} volume={0.09} />}
    </AbsoluteFill>
  );
};
