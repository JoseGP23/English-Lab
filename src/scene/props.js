import * as THREE from 'three';
import { materials } from './rocket.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
const paper = mat(0xf3ece0, { roughness: 0.9 });

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function book(color, w = 1.0, h = 0.17, d = 0.72) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.6 }));
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, h - 0.05, d - 0.04), paper);
  pages.position.x = 0.03;
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.02, h * 0.5, d * 0.9), materials.bronze);
  spine.position.x = -w / 2 - 0.005;
  g.add(cover, pages, spine);
  return g;
}

function bookStack() {
  const g = new THREE.Group();
  const colors = [0x7a2e2e, 0x1f3b5c, 0x2f5a3f];
  colors.forEach((c, i) => {
    const b = book(c, 1.0 - i * 0.08);
    b.position.y = i * 0.17;
    b.rotation.y = (i - 1) * 0.18;
    g.add(b);
  });
  return g;
}

function gradCap() {
  const g = new THREE.Group();
  const black = mat(0x1b1b1d, { roughness: 0.7 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.95), black);
  board.rotation.y = Math.PI / 4;
  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.28, 32), black);
  skull.position.y = -0.16;
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), materials.bronze);
  button.position.y = 0.04;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.52, 6), materials.bronze);
  cord.rotation.z = Math.PI / 2;
  cord.position.set(0.26, 0.04, 0);
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.26, 10), materials.bronze);
  tassel.position.set(0.52, -0.1, 0);
  g.add(board, skull, button, cord, tassel);
  return g;
}

function letterTile(letter) {
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f1e7d4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d1d1f';
    ctx.font = '400 170px Anton, Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, w / 2, h / 2 + 8);
    ctx.font = '600 34px Manrope, sans-serif';
    ctx.fillStyle = '#9a6a24';
    ctx.fillText(String(letter.charCodeAt(0) % 9 + 1), w - 34, h - 32);
  });
  const face = mat(0xffffff, { map: tex, roughness: 0.5 });
  const side = mat(0xe2d3b6, { roughness: 0.6 });
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  return new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.14), [side, side, side, side, face, face]);
}

function speechBubble(text) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  const w = 0.9, h = 0.55, r = 0.2;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(-0.1, -h / 2);
  s.lineTo(-0.28, -h / 2 - 0.2);
  s.lineTo(-0.22, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
  geo.translate(0, 0, -0.04);
  g.add(new THREE.Mesh(geo, mat(0xfaf6ee, { roughness: 0.4 })));

  const tex = canvasTexture(512, 256, (ctx, cw, ch) => {
    ctx.font = 'italic 400 150px Fraunces, Georgia, serif';
    ctx.fillStyle = '#9a6a24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2 + 6);
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.42), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  const back = label.clone();
  label.position.z = 0.08;
  back.position.z = -0.08;
  back.rotation.y = Math.PI;
  g.add(label, back);
  return g;
}

function pencil() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), mat(0xe8b33c, { roughness: 0.45 }));
  const wood = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 6), mat(0xe6c79a));
  wood.position.y = -0.65;
  wood.rotation.x = Math.PI;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 6), mat(0x222222));
  lead.position.y = -0.76;
  lead.rotation.x = Math.PI;
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.12, 12), materials.steel);
  ferrule.position.y = 0.6;
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), mat(0xd77a7a));
  eraser.position.y = 0.72;
  g.add(body, wood, lead, ferrule, eraser);
  return g;
}

/**
 * Objetos académicos que orbitan el cohete.
 * Cada item guarda su posición base; `update` aplica flotación, giro y dispersión.
 */
export function createProps({ mobile }) {
  const group = new THREE.Group();
  const defs = [
    { make: bookStack, pos: [-2.3, 1.2, -0.6], scale: 0.85, spin: [0.2, 0.35, 0.1] },
    { make: gradCap, pos: [2.2, 1.55, -0.4], scale: 0.9, spin: [0.4, 0.5, 0.2] },
    { make: () => letterTile('A'), pos: [-1.75, -1.25, 0.6], scale: 1, spin: [0.3, 0.6, 0.2] },
    { make: () => speechBubble('Hi!'), pos: [2.05, -0.9, 0.5], scale: 1, spin: [0.1, 0.4, 0.05] },
    { make: pencil, pos: [-2.7, -0.1, -1.2], scale: 0.9, spin: [0.5, 0.2, 0.6] },
    { make: () => letterTile('B'), pos: [1.05, 2.0, -1.4], scale: 0.85, spin: [0.5, 0.3, 0.3] },
    { make: () => letterTile('C'), pos: [2.9, 0.4, -1.6], scale: 0.8, spin: [0.2, 0.5, 0.4] },
    { make: () => speechBubble('Hello'), pos: [-1.0, 2.0, -1.8], scale: 0.85, spin: [0.1, 0.3, 0.05] },
  ];
  const used = mobile ? defs.slice(0, 5) : defs;

  const items = used.map((d, i) => {
    const obj = d.make();
    obj.userData.base = new THREE.Vector3(...d.pos);
    obj.userData.scale = d.scale;
    obj.userData.spin = d.spin;
    obj.userData.phase = i * 1.37;
    obj.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.4);
    group.add(obj);
    return obj;
  });

  group.userData.update = (t, dt, { visible, spread }) => {
    group.visible = visible > 0.01;
    for (const obj of items) {
      const { base, scale, spin, phase } = obj.userData;
      obj.position.set(
        base.x * spread,
        base.y * spread + Math.sin(t * 0.9 + phase) * 0.12,
        base.z
      );
      obj.scale.setScalar(scale * visible);
      obj.rotation.x += spin[0] * dt * 0.5;
      obj.rotation.y += spin[1] * dt * 0.5;
      obj.rotation.z += spin[2] * dt * 0.3;
    }
  };
  return group;
}
