// Registo de templates. Cada template aponta para uma composição Remotion JÁ
// EXISTENTE (os 3D não são tocados: a qualidade visual é a mesma de sempre) e
// declara o que o motor precisa de saber: quantas cenas, margens e legendas.

export type TemplateId = 'anuncio3d' | 'anuncio3db' | 'rastreio3d' | 'comboio3d' | 'aprender3d' | 'verse3d' | 'institucional';

export interface TemplateDef {
  id: TemplateId;
  composition: string;
  label: string;
  /** 3D (WebGL, pesado) ou 2D. Só informa o dashboard sobre o custo do render. */
  kind: '3d' | '2d';
  aspect: '9:16' | 'multi';
  /** Número exato de cenas, se a composição o exige (ordem fixa de cenas). */
  scenes?: number;
  /** Papel de cada cena, para guiar quem escreve o roteiro. */
  sceneRoles?: string[];
  /** Segundos antes da 1ª palavra e depois da última. */
  lead: number;
  tail: number;
  /** Legendas: máx. palavras e caracteres por linha. */
  captions: [number, number];
  /** A composição toca música (sem faixa licenciada o motor passa silêncio). */
  music: boolean;
  /** A composição usa sceneStarts. */
  usesSceneStarts: boolean;
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  anuncio3d: {
    id: 'anuncio3d',
    composition: 'Anuncio3D',
    label: 'Anúncio 3D (6 cenas)',
    kind: '3d',
    aspect: '9:16',
    scenes: 6,
    sceneRoles: ['gancho', 'problema', 'solução', 'funcionalidades', 'oferta', 'chamada para ação'],
    lead: 0.4,
    tail: 2.6,
    captions: [4, 22],
    music: true,
    usesSceneStarts: true,
  },
  anuncio3db: {
    id: 'anuncio3db',
    composition: 'Anuncio3DB',
    label: 'Anúncio 3D B (7 cenas, percurso e painel)',
    kind: '3d',
    aspect: '9:16',
    scenes: 7,
    sceneRoles: ['gancho', 'problema', 'solução', 'painel', 'cliente e prova', 'oferta', 'chamada para ação'],
    lead: 0.4,
    tail: 2.6,
    captions: [4, 22],
    music: true,
    usesSceneStarts: true,
  },
  rastreio3d: {
    id: 'rastreio3d',
    composition: 'Rastreio3D',
    label: 'Rastreio 3D para clientes finais (7 cenas)',
    kind: '3d',
    aspect: '9:16',
    scenes: 7,
    sceneRoles: ['gancho', 'código', 'site', 'foto do volume', 'etapas', 'privacidade', 'chamada para ação'],
    lead: 0.5,
    tail: 2.2,
    captions: [4, 22],
    music: true,
    usesSceneStarts: true,
  },
  comboio3d: {
    id: 'comboio3d',
    composition: 'RastreioComboio3D',
    label: 'Rastreio por comboio 3D (7 cenas)',
    kind: '3d',
    aspect: '9:16',
    scenes: 7,
    sceneRoles: ['gancho', 'serviço', 'site', 'foto', 'viagem de comboio', 'privacidade', 'chamada para ação'],
    lead: 0.5,
    tail: 2.2,
    captions: [4, 22],
    music: true,
    usesSceneStarts: true,
  },
  aprender3d: {
    id: 'aprender3d',
    composition: 'Aprender3D',
    label: 'Produto 3D "Aprender a Bíblia" (7 cenas)',
    kind: '3d',
    aspect: '9:16',
    scenes: 7,
    sceneRoles: ['gancho', 'app', 'níveis', 'pergunta', 'erro', 'próximo nível', 'chamada para ação'],
    lead: 0.5,
    tail: 2.6,
    captions: [4, 22],
    music: true,
    usesSceneStarts: true,
  },
  verse3d: {
    id: 'verse3d',
    composition: 'Verse3D',
    label: 'Versículo 3D (uma narração contínua)',
    kind: '3d',
    aspect: '9:16',
    lead: 0.5,
    tail: 1.6,
    captions: [4, 24],
    music: false,
    usesSceneStarts: false,
  },
  institucional: {
    id: 'institucional',
    composition: 'Institucional',
    label: 'Institucional (entidades e organizações)',
    kind: '2d',
    aspect: 'multi',
    lead: 0.4,
    tail: 2.2,
    captions: [6, 38],
    music: false,
    usesSceneStarts: true,
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[];
