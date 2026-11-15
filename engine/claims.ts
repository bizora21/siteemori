// Verificação do roteiro ANTES de gastar tempo a gerar voz e a renderizar.
// Duas portas: expressões proibidas da marca (bloqueiam) e, em vídeos
// institucionais, dados numéricos sem fonte (bloqueiam).

import { TEMPLATES } from './templates';
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

  if (project.template === 'reportagem') {
    const n = project.host?.name?.trim() ?? '';
    if (/^(seu nome|nome)$/i.test(n)) {
      issues.push({ level: 'error', message: 'host.name ainda é o texto de exemplo — preencha com quem aparece no vídeo' });
    }
    for (const s of project.scenes) {
      if (/^local \d+$/i.test(s.location?.trim() ?? '')) {
        issues.push({ level: 'error', scene: s.id, message: 'a etiqueta de local ainda é o texto de exemplo — indique o local verdadeiro ou apague o campo' });
      }
    }
  }

  if (TEMPLATES[project.template].music && !project.music) {
    issues.push({ level: 'warn', message: 'sem música: o vídeo sai só com voz (recomendado até haver faixa com licença documentada)' });
  }
  return issues;
}
