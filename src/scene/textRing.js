import * as THREE from 'three';

function ringTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = 4096;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.font = '400 190px Anton, Impact, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  // Repite la frase hasta llenar todo el ancho para que el anillo cierre sin costura
  const unit = ctx.measureText(text).width;
  const reps = Math.max(1, Math.round(c.width / unit));
  ctx.save();
  ctx.scale(c.width / (unit * reps), 1);
  for (let i = 0; i < reps; i++) ctx.fillText(text, i * unit, c.height / 2 + 8);
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function ring(text, radius, height, color) {
  const tex = ringTexture(text, color);
  const geo = new THREE.CylinderGeometry(radius, radius, height, 160, 1, true);
  const front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false }));
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, opacity: 0.28 }));
  back.renderOrder = -1;
  const g = new THREE.Group();
  g.add(back, front);
  g.userData.materials = [front.material, back.material];
  return g;
}

/** Dos anillos de texto en 3D que giran en sentidos opuestos alrededor del cohete. */
export function createTextRings() {
  const group = new THREE.Group();
  const a = ring('IELTS · TOEFL · CAMBRIDGE · BUSINESS · TRAVEL · TECH · ', 2.5, 0.62, '#e7c27a');
  const b = ring('SPEAK · LISTEN · READ · WRITE · THINK IN ENGLISH · ', 2.05, 0.4, '#f4efe6');
  a.position.y = 0.25;
  b.position.y = -0.55;
  group.add(a, b);
  group.rotation.x = 0.22;
  group.rotation.z = -0.06;

  const baseOpacity = [[1, 0.28], [1, 0.28]];
  group.userData.update = (t, { visible, turn, scale }) => {
    group.visible = visible > 0.01;
    [a, b].forEach((r, i) => {
      r.userData.materials.forEach((m, j) => (m.opacity = baseOpacity[i][j] * visible));
    });
    a.rotation.y = turn + t * 0.12;
    b.rotation.y = -turn * 1.3 - t * 0.16;
    group.scale.setScalar((0.85 + visible * 0.15) * scale);
  };
  return group;
}
