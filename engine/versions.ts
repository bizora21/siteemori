// Versões de um mesmo vídeo. Uma versão é o projeto com algumas alterações (como mostrar a
// pessoa, o formato…), gerada à parte: tem o seu próprio rascunho, aprovação e ficheiro final
// (video3d/out/<id>--<versão>.mp4). O texto, as gravações e os cenários são partilhados.

import type { Project, VersionOverrides } from './types';

export interface VersionInfo extends VersionOverrides {
  id: string;
  label: string;
  hint: string;
}

/** Versões que existem em qualquer projeto de reportagem. */
export const PRESET_VERSIONS: Record<string, Omit<VersionInfo, 'id'>> = {
  rosto: { label: 'Rosto em vídeo', hint: 'O rosto gravado (bolha sobre os cenários, ou ecrã inteiro).', faceMode: 'video' },
  foto: { label: 'Foto animada pela voz', hint: 'A sua foto numa bolha que pulsa com a voz. Só precisa de gravar a voz.', faceMode: 'photo' },
  voz: { label: 'Só a voz sobre os cenários', hint: 'Sem rosto nem foto: a voz e as legendas sobre os cenários.', faceMode: 'none' },
  semlegendas: { label: 'Sem legendas', hint: 'O mesmo vídeo sem legendas (o ficheiro .srt continua disponível).', captions: false },
  horizontal: { label: 'Horizontal 16:9 (YouTube)', hint: 'O mesmo vídeo em formato horizontal.', aspect: '16:9' },
};

/** Predefinidas + as que o projeto define (estas sobrepõem as predefinidas com o mesmo nome). */
export function listVersions(project: Pick<Project, 'versions'>): VersionInfo[] {
  const all: Record<string, Omit<VersionInfo, 'id'>> = { ...PRESET_VERSIONS };
  for (const [k, v] of Object.entries(project.versions ?? {})) {
    const base = PRESET_VERSIONS[k];
    all[k] = { ...base, ...v, label: v.label ?? base?.label ?? k, hint: base?.hint ?? 'Versão definida no projeto.' };
  }
  return Object.entries(all).map(([id, v]) => ({ id, ...v }));
}

/**
 * O projeto com a versão aplicada. O id ganha o sufixo "--<versão>", por isso as props, o áudio,
 * os ficheiros de saída e o pacote de publicação ficam separados dos da versão base.
 */
export function applyVersion(project: Project, version?: string): Project {
  if (!version) return project;
  const v = listVersions(project).find((x) => x.id === version);
  if (!v) throw new Error(`versão "${version}" não existe. Disponíveis: ${listVersions(project).map((x) => x.id).join(', ')}`);
  const { id: _id, label: _label, hint: _hint, ...overrides } = v;
  const style = { ...project.style, ...overrides.style };
  return { ...project, ...overrides, ...(Object.keys(style).length ? { style } : {}), id: `${project.id}--${version}` };
}
