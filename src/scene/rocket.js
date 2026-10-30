import * as THREE from 'three';

// Paleta del logo: acero pulido, bronce y punta de pavonado oscuro
export const materials = {
  steel: new THREE.MeshPhysicalMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.26, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x3b3f46, metalness: 0.9, roughness: 0.32, clearcoat: 0.6 }),
  bronze: new THREE.MeshPhysicalMaterial({ color: 0xc9963f, metalness: 1, roughness: 0.28, clearcoat: 0.3 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x3a2208, emissive: 0xff8a2a, emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.15, clearcoat: 1 }),
};

/** Celular: sin clearcoat (segunda capa especular por píxel), visualmente casi igual y bastante más barato. */
export function useLiteMaterials() {
  for (const m of Object.values(materials)) {
    m.clearcoat = 0;
    m.needsUpdate = true;
  }
}

const BODY_PROFILE = [
  [0.3, -1.25], [0.42, -1.1], [0.52, -0.8], [0.58, -0.4], [0.6, 0], [0.585, 0.4], [0.53, 0.8], [0.47, 1.0],
];
const NOSE_PROFILE = [[0.47, 1.0], [0.41, 1.3], [0.29, 1.6], [0.13, 1.86], [0, 1.96]];
const NOZZLE_PROFILE = [[0.22, -1.2], [0.25, -1.38], [0.36, -1.58]];

function lathe(profile, material, segments = 72) {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  const geo = new THREE.LatheGeometry(curve.getPoints(40), segments);
  return new THREE.Mesh(geo, material);
}

function band(y, radius, tube = 0.045) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 96), materials.bronze);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

function fin() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.3, -0.05, 0.62, -0.4, 0.78, -1.0);
  shape.lineTo(0.5, -0.82);
  shape.quadraticCurveTo(0.2, -0.7, 0, -0.62);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
  geo.translate(0, 0, -0.03);
  return new THREE.Mesh(geo, materials.dark);
}

function porthole() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 48), materials.bronze);
  base.rotation.x = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 20, 64), materials.bronze);
  ring.position.z = 0.07;
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.235, 48), materials.glass);
  glass.position.z = 0.065;

  // Engranaje interior (como el ojo de buey del logo)
  const gear = new THREE.Group();
  gear.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 12, 40), materials.bronze));
  for (let i = 0; i < 10; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.03), materials.bronze);
    const a = (i / 10) * Math.PI * 2;
    tooth.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
    tooth.rotation.z = a;
    gear.add(tooth);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20), materials.bronze);
  hub.rotation.x = Math.PI / 2;
  gear.add(hub);
  gear.position.z = 0.09;

  g.add(base, ring, glass, gear);
  g.userData.gear = gear;
  return g;
}

function pipe(points) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.04, 12, false), materials.bronze);
}

function rivets() {
  const geo = new THREE.SphereGeometry(0.022, 10, 8);
  const spots = [];
  // Anillo de remaches en las bandas
  for (const [y, r, n] of [[0.86, 0.5, 26], [-0.42, 0.585, 30]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      spots.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
  }
  const mesh = new THREE.InstancedMesh(geo, materials.bronze, spots.length);
  const m = new THREE.Matrix4();
  spots.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(...p)));
  return mesh;
}

/** Cohete steampunk procedural. Su eje es +Y (punta hacia arriba). */
export function createRocket() {
  const rocket = new THREE.Group();

  rocket.add(lathe(BODY_PROFILE, materials.steel));
  rocket.add(lathe(NOSE_PROFILE, materials.dark));
  const nozzle = lathe(NOZZLE_PROFILE, materials.bronze, 48);
  nozzle.material = materials.bronze.clone();
  nozzle.material.side = THREE.DoubleSide;
  rocket.add(nozzle);

  rocket.add(band(1.0, 0.475, 0.05), band(-0.55, 0.565), band(-1.17, 0.375, 0.05));
  rocket.add(rivets());

  const port = porthole();
  port.position.set(0, 0.3, 0.55);
  rocket.add(port);

  // Ojo de buey pequeño trasero
  const port2 = porthole();
  port2.scale.setScalar(0.55);
  port2.position.set(0, 0.55, -0.55);
  port2.rotation.y = Math.PI;
  rocket.add(port2);

  for (let i = 0; i < 3; i++) {
    const f = fin();
    // Una aleta atrás y dos a los lados: ninguna apunta a la cámara (de canto se veía como una franja rota)
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const holder = new THREE.Group();
    f.position.set(0.44, -0.55, 0);
    holder.add(f);
    holder.rotation.y = a;
    rocket.add(holder);
  }

  rocket.add(
    pipe([[0.42, -1.02, 0.28], [0.62, -0.7, 0.36], [0.64, -0.2, 0.3], [0.5, 0.15, 0.3]]),
    pipe([[-0.42, -1.02, 0.28], [-0.6, -0.6, 0.3], [-0.6, -0.1, 0.22], [-0.5, 0.2, 0.26]])
  );

  rocket.userData.gear = port.userData.gear;
  rocket.userData.nozzleY = -1.5;
  rocket.userData.portholeY = 0.3;
  return rocket;
}
