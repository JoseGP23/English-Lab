import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const BASE_CAM_Z = 10;
const FOV = 35;
// Medio alto visible en z = 0 (unidades de mundo), igual en cualquier pantalla
export const HALF_H = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * BASE_CAM_Z;

/** Renderer, cámara, luces y loop. Devuelve null si no hay WebGL. */
export function createStage(canvas, { mobile }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      // MSAA siempre: en celular (GPU por mosaicos) es barato y sin él los bordes metálicos se ven dentados
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.warn('WebGL no disponible', err);
    return null;
  }

  const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(maxPixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, BASE_CAM_Z);

  const key = new THREE.DirectionalLight(0xffe2b0, 2.4);
  key.position.set(-4, 5, 6);
  const rim = new THREE.DirectionalLight(0x9fb4ff, 1.6);
  rim.position.set(5, 2, -4);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

  const root = new THREE.Group();
  scene.add(root);

  const size = { w: 1, h: 1, halfW: 1, halfH: 1 };
  function resize() {
    size.w = window.innerWidth;
    size.h = window.innerHeight;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    // Medio alto/ancho visible en z = 0 con la cámara en su distancia base
    size.halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * BASE_CAM_Z;
    size.halfW = size.halfH * camera.aspect;
  }
  resize();
  window.addEventListener('resize', resize);

  // Calidad adaptativa: si el promedio de frames pasa de ~21ms (≈48fps), baja la resolución
  // interna un paso. Solo baja: subir y bajar alternadamente se notaría como parpadeo.
  // En pantallas densas por debajo de 1.25 el cohete ya se ve pixelado
  const MIN_PIXEL_RATIO = Math.min(maxPixelRatio, mobile ? 1.25 : 1);
  let frameSum = 0;
  let frameCount = 0;
  let warmup = 120; // los primeros frames incluyen compilación de shaders
  function adaptQuality(dt) {
    if (warmup > 0) return void warmup--;
    if (dt > 0.25) return; // pestaña en segundo plano o pausa puntual: no es rendimiento real
    frameSum += dt;
    frameCount++;
    if (frameCount < 90) return;
    const avg = frameSum / frameCount;
    frameSum = 0;
    frameCount = 0;
    const pr = renderer.getPixelRatio();
    if (avg > 1 / 48 && pr > MIN_PIXEL_RATIO) {
      renderer.setPixelRatio(Math.max(MIN_PIXEL_RATIO, pr - 0.25));
      renderer.setSize(size.w, size.h, false);
    }
  }

  const callbacks = [];
  const timer = new THREE.Timer();
  // `active` lo decide la escena: si no hay nada visible se deja de dibujar (tras un último frame vacío)
  const stage = { renderer, scene, camera, root, size, active: true, onFrame: (cb) => callbacks.push(cb) };
  let drewInactive = false;
  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp);
    const rawDt = timer.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const t = timer.getElapsed();
    for (const cb of callbacks) cb(t, dt);
    if (stage.active) {
      drewInactive = false;
      renderer.render(scene, camera);
      adaptQuality(rawDt);
    } else if (!drewInactive) {
      drewInactive = true;
      renderer.render(scene, camera);
    }
  });

  return stage;
}
