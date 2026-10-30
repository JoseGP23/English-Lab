import { createState, LOGO_TILT } from '../scene/world.js';

const TAU = Math.PI * 2;
const pose = (o) => ({ ...createState(), ...o });

/**
 * Poses del cohete por sección. Cada transición de scroll va de una pose a la siguiente,
 * así saltar con el menú o volver atrás siempre deja la escena coherente.
 */
export function getPoses(mobile) {
  if (mobile) {
    // En celular el cohete vive en el hueco libre de cada sección (entre título y textos),
    // por eso las poses dependen del layout móvil de main.css.
    const prog = (i, o) => pose({ stars: 0, x: 0, y: 0.5, scale: 0.4, ry: TAU + i * (Math.PI / 2), spread: 0.75, props: 0.55, ...o });
    return {
      hero: pose({ y: -0.07, scale: 0.52, spread: 0.85, props: 0.6 }),
      manifestoA: pose({ x: 0, y: -0.04, scale: 0.48, rz: -1.5, props: 0.35, spread: 1, flame: 1.3 }),
      manifestoB: pose({ x: 0.04, y: -0.04, scale: 0.48, rz: -1.5, ry: TAU, props: 0.25, spread: 1.1, flame: 1.3 }),
      programs: [
        prog(0, { rz: -0.3 }),
        prog(1, { rz: 0.25, rx: 0.15 }),
        prog(2, { rz: -0.5, rx: -0.1 }),
        prog(3, { rz: 0.1 }),
      ],
      // Título arriba → el cohete crece y sube para dejar abajo la cuadrícula de callouts
      methodA: pose({ x: 0, y: -0.2, scale: 0.5, rz: 0, ry: 2 * TAU, idle: 0, props: 0, flame: 0.5 }),
      methodZoom: pose({ x: 0, y: 0.36, scale: 0.64, rz: 0, ry: 2 * TAU, idle: 0, props: 0, flame: 0.3 }),
      // Recorre el mapa de niveles (mitad inferior) sin pisar el título
      routeStart: pose({ stars: 0.35, x: -0.82, y: -0.38, scale: 0.15, rz: -0.75, ry: 2 * TAU, props: 0 }),
      routeEnd: pose({ stars: 0.35, x: 0.72, y: 0.14, scale: 0.15, rz: -0.75, ry: 2 * TAU, props: 0 }),
      hidden: pose({ stars: 0, x: 0.3, y: 1.9, scale: 0.4, rz: 0, ry: 2 * TAU, props: 0, flame: 0.4 }),
      orbitA: pose({ x: 0, y: -0.12, scale: 0.55, rz: 0, ry: 2 * TAU, props: 0, ring: 1, flame: 0.8 }),
      orbitB: pose({ x: 0, y: -0.12, scale: 0.55, rz: 0, ry: 2 * TAU + Math.PI, props: 0, ring: 1, turn: Math.PI * 0.6, flame: 0.8 }),
      cta: pose({ x: 0, y: -0.55, scale: 0.42, rz: 0, ry: 3 * TAU, props: 0, flame: 0.35, pedestal: 1 }),
    };
  }

  const prog = (i, o) => pose({ stars: 0, x: 0.45, y: -0.02, scale: 1.05, ry: TAU + i * (Math.PI / 2), props: 1, ...o });
  return {
    hero: pose({ y: 0, scale: 0.86, rz: LOGO_TILT }),
    manifestoA: pose({ x: -0.05, y: 0.02, scale: 0.95, rz: -1.5, props: 0.6, spread: 1.5, flame: 1.3 }),
    manifestoB: pose({ x: 0.08, y: 0, scale: 0.95, rz: -1.5, ry: TAU, props: 0.4, spread: 1.8, flame: 1.3 }),
    programs: [
      prog(0, { rz: -0.3, spread: 0.95 }),
      prog(1, { rz: 0.25, rx: 0.15, spread: 1.1 }),
      prog(2, { rz: -0.5, rx: -0.1, spread: 0.9 }),
      prog(3, { rz: 0.1, spread: 1.2 }),
    ],
    // Más abajo y más pequeño: la punta queda debajo del título "English you can almost feel."
    methodA: pose({ x: 0, y: -0.26, scale: 0.78, rz: 0, ry: 2 * TAU, idle: 0, props: 0, flame: 0.5 }),
    // Zoom moderado: el cuerpo deja libres las columnas de callouts a los lados
    methodZoom: pose({ x: 0, y: 0, scale: 1.05, rz: 0, ry: 2 * TAU, idle: 0, props: 0, flame: 0.5, camZ: 5.6, camY: 0.315 }),
    routeStart: pose({ stars: 0.35, x: -0.78, y: -0.55, scale: 0.3, rz: -0.85, ry: 2 * TAU, props: 0 }),
    routeEnd: pose({ stars: 0.35, x: 0.8, y: 0.55, scale: 0.3, rz: -0.85, ry: 2 * TAU, props: 0 }),
    hidden: pose({ stars: 0, x: 0.3, y: 1.9, scale: 0.6, rz: 0, ry: 2 * TAU, props: 0, flame: 0.4 }),
    orbitA: pose({ x: 0, y: -0.15, scale: 0.95, rz: 0, ry: 2 * TAU, props: 0, ring: 1, flame: 0.8 }),
    orbitB: pose({ x: 0, y: -0.15, scale: 0.95, rz: 0, ry: 2 * TAU + Math.PI, props: 0, ring: 1, turn: Math.PI * 0.6, flame: 0.8 }),
    cta: pose({ x: 0.5, y: 0.02, scale: 0.78, rz: 0, ry: 3 * TAU, props: 0, flame: 0.35, pedestal: 1 }),
  };
}
