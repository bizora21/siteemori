import * as THREE from 'three';
import type opentype from 'opentype.js';

// Converte texto em geometria 3D extrudida (com bisel), a partir de um TTF.
// Centrado em X/Y; a escala é uniforme entre linhas (em), limitada pela largura máxima.
export function buildTextGeometry(
  font: opentype.Font,
  text: string,
  /** altura de 1 em (unidades 3D) */
  em: number,
  /** profundidade da extrusão, em ems */
  depth: number,
  /** largura máxima (unidades 3D); reduz a escala se o texto for mais largo */
  maxWidth: number,
): THREE.ExtrudeGeometry {
  const size = 100;
  const path = font.getPath(text, 0, 0, size);
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    // opentype usa y para baixo; o three usa y para cima.
    switch (c.type) {
      case 'M':
        sp.moveTo(c.x, -c.y);
        break;
      case 'L':
        sp.lineTo(c.x, -c.y);
        break;
      case 'Q':
        sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
        break;
      case 'C':
        sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
        break;
      case 'Z':
        break;
    }
  }
  const shapes = sp.toShapes(false);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: depth * size,
    bevelEnabled: true,
    bevelThickness: depth * size * 0.18,
    bevelSize: size * 0.012,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const raw = bb.max.x - bb.min.x;
  const scale = Math.min(em / size, maxWidth / raw);
  geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2);
  geo.scale(scale, scale, scale);
  geo.computeVertexNormals();
  return geo;
}
