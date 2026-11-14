// Verificação do roteiro ANTES de gastar tempo a gerar voz e a renderizar.
// Duas portas: expressões proibidas da marca (bloqueiam) e, em vídeos
// institucionais, dados numéricos sem fonte (bloqueiam).

import type { Brand, Issue, Project } from './types';

const HAS_NUMBER = /\d/;

export function lintProject(project: Project, brand: Brand): Issue[] {
  const issues: Issue[] = [];

  for (const scene of project.scenes) {
    const text = `${scene.title ?? ''} ${scene.narration}`;
    for (const rule of brand.claims.forbidden) {
      if (new RegExp(rule.pattern, 'iu').test(text)) {
        issues.push({ level: 'error', scene: scene.id, message: `proibido pela marca (${rule.pattern}): ${rule.reason}` });
      }
    }
    if (project.template === 'institucional' && HAS_NUMBER.test(text) && !scene.source) {
      issues.push({
        level: 'error',
        scene: scene.id,
        message: 'a cena tem números/dados mas não indica "source" — vídeo institucional não pode citar dados sem fonte',
      });
    }
  }

  if (project.template === 'institucional') {
    const ent = project.institutional?.entity ?? '';
    if (/^(nome da entidade|entidade exemplo|\[.*\])/i.test(ent.trim())) {
      issues.push({ level: 'error', message: 'institutional.entity ainda é um texto de exemplo — preencha com a entidade real' });
    }
    if (!project.approval) {
      issues.push({
        level: 'warn',
        message: 'sem "approval" (quem autorizou o conteúdo): serve para rascunho, mas o render final de vídeos institucionais é bloqueado',
      });
    }
  }

  if (project.template === 'anuncio3d' && !project.music) {
    issues.push({ level: 'warn', message: 'sem música: o anúncio sai só com voz (recomendado até haver faixa com licença documentada)' });
  }
  return issues;
}
