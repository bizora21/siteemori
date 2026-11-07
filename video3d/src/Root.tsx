import { Composition } from 'remotion';
import { Verse3D } from './Verse3D';
import { Rastreio3D } from './Rastreio3D';
import { RastreioComboio3D } from './comboio/RastreioComboio3D';
import { Anuncio3D } from './Anuncio3D';
import { Anuncio3DB } from './Anuncio3DB';
import { Aprender3D } from './Aprender3D';
import type { AnuncioProps, AprenderProps, RastreioProps, VerseProps } from './types';

export const FPS = 30;

const defaults: VerseProps = {
  title: ['SALMO 46', 'LIDO ERRADO'],
  audio: 'audio/salmo-46.mp3',
  lines: [],
  durationInFrames: 30 * 20,
  leadSeconds: 0.5,
  voiceEndSeconds: 18,
  cta: 'Link na bio',
  site: 'aemori.com',
};

const rastreioDefaults: RastreioProps = {
  audio: 'audio/rastreio-clientes.mp3',
  lines: [],
  durationInFrames: 30 * 50,
  leadSeconds: 0.5,
  voiceEndSeconds: 48,
  sceneStarts: [0, 4.5, 12, 20, 29, 38, 44],
  cta: 'Rastreie agora',
  site: 'rastreio.movagomz.com',
};

const anuncioDefaults: AnuncioProps = {
  audio: 'audio/anuncio-transportadoras.mp3',
  music: 'lunatic-ideas.mp3',
  lines: [],
  durationInFrames: 30 * 40,
  leadSeconds: 0.5,
  voiceEndSeconds: 37,
  sceneStarts: [0, 4, 11, 21, 29, 34],
  cta: 'Saiba mais',
  site: 'movagomz.com/logistica',
};

const aprenderDefaults: AprenderProps = {
  audio: 'audio/aprender-biblia.mp3',
  music: 'spirit.mp3',
  lines: [],
  durationInFrames: 30 * 50,
  leadSeconds: 0.5,
  voiceEndSeconds: 48,
  sceneStarts: [0, 4.5, 11.9, 18, 25.2, 32.4, 38.8],
  tapRight: 21.6,
  tapWrong: 25.6,
  cta: 'Link na bio',
  site: 'Baixe a Emori',
};

export const Root = () => (
  <>
  <Composition
    id="Verse3D"
    component={Verse3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={defaults.durationInFrames}
    defaultProps={defaults}
    // A duração vem das props (comprimento real da voz).
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="Rastreio3D"
    component={Rastreio3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={rastreioDefaults.durationInFrames}
    defaultProps={rastreioDefaults}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="Anuncio3D"
    component={Anuncio3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={anuncioDefaults.durationInFrames}
    defaultProps={anuncioDefaults}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="Anuncio3DB"
    component={Anuncio3DB}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={30 * 45}
    defaultProps={{ ...anuncioDefaults, audio: 'audio/anuncio-b.mp3', sceneStarts: [0, 4, 11, 19, 27, 34, 39], musicStart: 30 }}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="Aprender3D"
    component={Aprender3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={aprenderDefaults.durationInFrames}
    defaultProps={aprenderDefaults}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  <Composition
    id="RastreioComboio3D"
    component={RastreioComboio3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={30 * 55}
    defaultProps={{ ...rastreioDefaults, audio: 'audio/rastreio-comboio.mp3', music: 'lunatic-ideas.mp3', musicStart: 20, sceneStarts: [0, 4.5, 12, 20, 29, 40, 48] }}
    calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
  />
  </>
);
