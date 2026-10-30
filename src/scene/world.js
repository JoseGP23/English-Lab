import * as THREE from 'three';
import { createStage, BASE_CAM_Z } from './stage.js';
import { createRocket, materials, useLiteMaterials } from './rocket.js';
import { createFlame } from './flame.js';
import { createProps } from './props.js';
import { createTextRings } from './textRing.js';
import { createStars } from './stars.js';

// Inclinación base del cohete, como en el logo (punta hacia arriba a la derecha)
export const LOGO_TILT = -0.62;

/**
 * Estado animable de la escena. Las coordenadas x/y van de -1 a 1 sobre la pantalla;
 * los timelines de scroll escriben aquí y el loop lo suaviza cada frame.
 */
export function createState() {
  return {
    x: 0, y: 0, scale: 1,
    rx: 0, ry: 0, rz: LOGO_TILT, idle: 1,
    flame: 1,
    props: 1, spread: 1,
    ring: 0, turn: 0,
    camZ: BASE_CAM_Z, camY: 0,
    pedestal: 0,
    stars: 1,
  };
}

function pedestal() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 0.16, 64), materials.dark);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.04, 12, 96), materials.bronze);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.08;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.4, 64), materials.steel);
  base.position.y = -0.28;
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 1.0, 64),
    new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.085;
  g.add(base, top, rim, glow);
  return g;
}

export function createWorld(canvas, { mobile }) {
  const stage = createStage(canvas, { mobile });
  if (!stage) return null;
  const { root, camera, size, renderer } = stage;
  if (mobile) useLiteMaterials();

  const rocketPivot = new THREE.Group();
  const rocket = createRocket();
  const flame = createFlame({ count: mobile ? 260 : 520, pixelRatio: renderer.getPixelRatio() });
  flame.position.y = rocket.userData.nozzleY;
  rocket.add(flame);
  rocketPivot.add(rocket);

  const props = createProps({ mobile });
  const rings = createTextRings();
  const stand = pedestal();
  const stars = createStars({ count: mobile ? 380 : 900, pixelRatio: renderer.getPixelRatio() });

  root.add(stars, rocketPivot, props, rings, stand);

  const state = createState();
  const cur = createState();
  const launch = { y: 0, boost: 0 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  window.addEventListener('pointermove', (e) => {
    // Solo mouse: en táctil el dedo que hace scroll movería la escena sin querer
    if (e.pointerType !== 'mouse') return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  stage.onFrame((t, dt) => {
    // Suavizado exponencial hacia el estado objetivo
    const k = 1 - Math.exp(-dt * 7);
    for (const key in state) cur[key] += (state[key] - cur[key]) * k;
    pointer.sx += (pointer.x - pointer.sx) * k * 0.5;
    pointer.sy += (pointer.y - pointer.sy) * k * 0.5;

    const wx = cur.x * size.halfW;
    const wy = cur.y * size.halfH;

    rocketPivot.position.set(wx, wy + Math.sin(t * 1.3) * 0.06 + launch.y, 0);
    rocketPivot.scale.setScalar(cur.scale);
    rocketPivot.rotation.set(cur.rx, 0, cur.rz + Math.sin(t * 0.9) * 0.025);
    rocket.rotation.y = cur.ry + Math.sin(t * 0.45) * 0.6 * cur.idle;
    rocket.userData.gear.rotation.z = -t * 0.8;
    const pr = renderer.getPixelRatio();
    flame.userData.update(t, cur.flame + launch.boost, pr);
    stars.userData.update(t, cur.stars, window.scrollY * 0.0015, pr);

    props.position.set(wx, wy, 0);
    props.scale.setScalar(cur.scale);
    props.userData.update(t, dt, { visible: cur.props, spread: cur.spread });

    rings.position.set(wx, wy, 0);
    rings.userData.update(t, { visible: cur.ring, turn: cur.turn, scale: cur.scale });

    stand.visible = cur.pedestal > 0.01;
    stand.position.set(wx, wy - 1.72 * cur.scale - (1 - cur.pedestal) * 2, 0);
    stand.scale.setScalar(cur.scale);

    // Parallax sutil con el puntero
    root.rotation.y = pointer.sx * 0.08;
    root.rotation.x = pointer.sy * 0.05;

    camera.position.set(0, cur.camY, cur.camZ);

    // ¿Hay algo que dibujar? Con el cohete fuera de cuadro y sin estrellas/objetos, el canvas descansa.
    const rocketY = wy + launch.y;
    const reach = 2.2 * cur.scale;
    const rocketVisible = Math.abs(rocketY) < size.halfH + reach && Math.abs(wx) < size.halfW + reach && cur.scale > 0.02;
    stage.active = rocketVisible || cur.props > 0.01 || cur.ring > 0.01 || cur.stars > 0.01 || cur.pedestal > 0.01;
  });

  return { state, launch, size, rocket };
}
