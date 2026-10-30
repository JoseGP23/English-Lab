import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPoses } from './poses.js';
import { HALF_H } from '../scene/stage.js';

// Deben coincidir con --graphite, --cream y el tono base de --burnished en main.css
const COLORS = {
  graphite: '#0e0c0a',
  cream: '#efe6d5',
  bronze: '#2a1a0b',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/**
 * Coreografía de scroll completa. Cada sección tiene:
 *  - una "entrada" (desde que asoma hasta que llega arriba) que lleva al cohete de la pose anterior a la nueva
 *  - y, si aplica, un tramo fijado (pin) con su propia animación interna.
 *
 * El cohete y el color de fondo los comparten todas las secciones, así que no se animan con
 * tweens (varios timelines pisarían el mismo objeto). Se registran como "segmentos" ubicados
 * dentro del timeline de cada sección y, en cada frame, solo el segmento activo escribe el estado.
 * Los elementos del DOM, que pertenecen a una sola sección, sí usan tweens normales.
 */
export function buildChoreography({ state, mobile, heroChars }) {
  const P = getPoses(mobile);
  const bg = $('.bg-layer');
  const moves = [];
  const paints = [];

  const record = (list, tl, from, to, at, duration, ease) => {
    tl.to({}, { duration }, at); // reserva el tramo para que el timeline tenga la duración correcta
    list.push({ tl, from, to, at, duration, ease: gsap.parseEase(ease) });
  };
  const move = (tl, from, to, at = 0, duration = 1, ease = 'none') => record(moves, tl, from, to, at, duration, ease);
  const paint = (tl, from, to, at = 0, duration = 1) =>
    record(paints, tl, gsap.utils.splitColor(from), gsap.utils.splitColor(to), at, duration, 'none');
  const entry = (trigger) =>
    gsap.timeline({ scrollTrigger: { trigger, start: 'top bottom', end: 'top top', scrub: true } });
  const pinned = (trigger, length) =>
    gsap.timeline({ scrollTrigger: { trigger, start: 'top top', end: `+=${length}%`, pin: true, scrub: true, anticipatePin: 1 } });

  /* ---------- 1 → 2: Hero se rompe, entra el manifiesto ---------- */
  const manifesto = $('.manifesto');
  {
    const tl = entry(manifesto);
    move(tl, P.hero, P.manifestoA);
    tl.fromTo(heroChars, { x: 0, y: 0, rotation: 0, opacity: 1 }, {
      x: () => gsap.utils.random(-400, 400),
      y: () => gsap.utils.random(-260, 120),
      rotation: () => gsap.utils.random(-70, 70),
      opacity: 0,
      stagger: { each: 0.02, from: 'center' },
      duration: 0.8,
      ease: 'power1.in',
      immediateRender: false,
    }, 0);
    tl.fromTo('.hero__kicker, .hero__bottom, .hero__scroll', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 0);
  }
  {
    const tl = pinned(manifesto, 200);
    const back = $('.manifesto__track--back');
    const front = $('.manifesto__track--front');
    tl.fromTo(back, { x: () => -(back.scrollWidth - window.innerWidth) }, { x: 0, duration: 1, ease: 'none', immediateRender: false }, 0);
    tl.fromTo(front, { x: 0 }, { x: () => -(front.scrollWidth - window.innerWidth * 0.55), duration: 1, ease: 'none', immediateRender: false }, 0);
    tl.fromTo('.manifesto__copy', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, 0.15);
    move(tl, P.manifestoA, P.manifestoB);
  }

  /* ---------- 3: Programas 01–04 ---------- */
  const programs = $('.programs');
  const panels = $$('.program', programs);
  const parts = panels.map((p) => [...p.children]);
  gsap.set(panels, { autoAlpha: 1 });
  gsap.set(parts.slice(1).flat(), { autoAlpha: 0 });

  // Celular: el cohete se ajusta al hueco real entre el encabezado y la ficha más alta,
  // así nunca tapa texto aunque cambie el largo de los textos o el alto de la pantalla
  if (mobile) {
    const head = $('.programs__head', programs);
    const fit = () => {
      const top0 = programs.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const top = head.getBoundingClientRect().bottom - top0 + 14;
      const bottom = Math.min(...panels.map((p) => p.getBoundingClientRect().top - top0)) - 10;
      const h = Math.max(0, bottom - top);
      const worldH = (h / vh) * 2 * HALF_H;
      // ~4 unidades: cohete inclinado + un poco de la llama
      const scale = gsap.utils.clamp(0.2, 0.42, worldH / 4);
      // El centro visual del cohete está ~0.18 unidades por encima de su pivote
      const y = 1 - (2 * (top + h / 2)) / vh - (0.18 * scale) / HALF_H;
      for (const p of P.programs) Object.assign(p, { y, scale });
    };
    fit();
    ScrollTrigger.addEventListener('refreshInit', fit);
  }
  {
    const tl = entry(programs);
    move(tl, P.manifestoB, P.programs[0]);
    paint(tl, COLORS.graphite, COLORS.cream, 0.35, 0.5);
    tl.fromTo(parts[0], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.4, immediateRender: false }, 0.5);
  }
  {
    const current = $('.programs__current');
    const bars = $$('.programs__progress span');
    const steps = panels.length;
    const tl = pinned(programs, steps * 90);
    for (let i = 1; i < steps; i++) {
      const at = i - 0.5;
      tl.fromTo(parts[i - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, stagger: 0.03, duration: 0.25, immediateRender: false }, at);
      tl.fromTo(parts[i], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.3, immediateRender: false }, at + 0.25);
      move(tl, P.programs[i - 1], P.programs[i], at, 0.55, 'power1.inOut');
    }
    tl.to({}, { duration: 0.5 }, steps - 1);
    let last = -1;
    ScrollTrigger.create({
      trigger: programs,
      start: 'top top',
      end: `+=${steps * 90}%`,
      onUpdate: (self) => {
        const idx = Math.min(steps - 1, Math.floor(self.progress * (steps - 0.5) + 0.25));
        if (idx === last) return;
        last = idx;
        current.textContent = String(idx + 1).padStart(2, '0');
        bars.forEach((b, i) => b.classList.toggle('is-on', i <= idx));
      },
    });
  }

  /* ---------- 4: The Lab Method (zoom al ojo de buey) ---------- */
  const method = $('.method');
  gsap.set('.method__intro', { autoAlpha: 0 });
  {
    const tl = entry(method);
    // La ficha 04 se despide antes de que el cohete cruce hacia el centro
    tl.fromTo([...parts.at(-1), $('.programs__progress')], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, stagger: 0.03, duration: 0.25, immediateRender: false }, 0);
    move(tl, P.programs.at(-1), P.methodA, 0.2, 0.8, 'power1.inOut');
    paint(tl, COLORS.cream, COLORS.graphite, 0.1, 0.35);
    // El título aparece casi en su sitio, cuando ya no tiene que cruzarse con el cohete
    tl.fromTo('.method__intro', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.22, immediateRender: false }, 0.78);
  }
  {
    const tl = pinned(method, 220);
    move(tl, P.methodA, P.methodZoom, 0, 1, 'power2.inOut');
    tl.fromTo('.method__intro', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.3, immediateRender: false }, 0.45);
    tl.fromTo('.callout', { autoAlpha: 0, scale: 0.85, y: 20 }, {
      autoAlpha: 1, scale: 1, y: 0, stagger: 0.14, duration: 0.3, ease: 'back.out(2)', immediateRender: false,
    }, 0.75);
    tl.to({}, { duration: 0.6 }, 1.6);
  }

  /* ---------- 5: Ruta de vuelo A1 → C2 ---------- */
  const route = $('.route');
  const path = $('.route__path');
  path.setAttribute('pathLength', '1');
  gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set('.route__head > *, .route__path-bg, .level', { autoAlpha: 0 });
  {
    const tl = entry(route);
    move(tl, P.methodZoom, P.routeStart);
  }
  {
    const tl = pinned(route, 220);
    tl.fromTo('.route__curtain', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut', immediateRender: false }, 0);
    paint(tl, COLORS.graphite, COLORS.bronze, 0.5, 0.01);
    tl.fromTo('.route__head > *', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.3, immediateRender: false }, 0.3);
    tl.fromTo('.route__path-bg', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, immediateRender: false }, 0.55);
    tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'none', immediateRender: false }, 0.65);
    tl.fromTo('.level', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, stagger: 0.24, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, 0.65);
    move(tl, P.routeStart, P.routeEnd, 0.65, 1.3);
    tl.to({}, { duration: 0.3 }, 1.95);
  }

  /* ---------- 6: Lab rules ---------- */
  const rules = $('.rules');
  const ruleEls = $$('.rule', rules);
  const dots = $$('.rules__dots span');
  gsap.set(ruleEls[0], { autoAlpha: 1 });
  {
    const tl = entry(rules);
    move(tl, P.routeEnd, P.hidden);
    paint(tl, COLORS.bronze, COLORS.cream, 0.2, 0.6);
  }
  {
    const steps = ruleEls.length;
    const tl = pinned(rules, steps * 70);
    for (let i = 1; i < steps; i++) {
      const at = i - 0.5;
      tl.fromTo(ruleEls[i - 1], { autoAlpha: 1, y: 0, scale: 1 }, { autoAlpha: 0, y: -80, scale: 0.96, duration: 0.3, immediateRender: false }, at);
      tl.fromTo(ruleEls[i], { autoAlpha: 0, y: 80, scale: 1.04 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, immediateRender: false }, at + 0.2);
    }
    tl.to({}, { duration: 0.5 }, steps - 1);
    let last = -1;
    ScrollTrigger.create({
      trigger: rules,
      start: 'top top',
      end: `+=${steps * 70}%`,
      onUpdate: (self) => {
        const idx = Math.min(steps - 1, Math.floor(self.progress * (steps - 0.5) + 0.25));
        if (idx === last) return;
        last = idx;
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      },
    });
    dots[0]?.classList.add('is-active');
  }

  /* ---------- 7: Órbita de textos ---------- */
  const orbit = $('.orbit');
  {
    const tl = entry(orbit);
    move(tl, P.hidden, P.orbitA);
    paint(tl, COLORS.cream, COLORS.graphite, 0, 0.5);
    tl.fromTo('.orbit__title', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, 0.5);
  }
  {
    const tl = pinned(orbit, mobile ? 55 : 65);
    move(tl, P.orbitA, P.orbitB);
  }

  /* ---------- 8: CTA final ---------- */
  const cta = $('.cta');
  {
    const tl = entry(cta);
    move(tl, P.orbitB, P.cta);
    tl.fromTo('.cta > *:not(.cta__glow)', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.4, immediateRender: false }, 0.55);
  }
  {
    // Cuando entra el footer la sección sube; el cohete y su pedestal suben con ella
    const footer = $('.footer');
    const tl = gsap.timeline({ scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    const lift = (2 * footer.offsetHeight) / window.innerHeight;
    move(tl, P.cta, { ...P.cta, y: P.cta.y + lift });
  }

  /* ---------- Evaluación de segmentos compartidos ---------- */
  // Rango en píxeles de scroll de un segmento, según la posición de su ScrollTrigger
  const range = (s) => {
    const st = s.tl.scrollTrigger;
    const span = st.end - st.start;
    const total = s.tl.duration() || 1;
    const start = st.start + (span * s.at) / total;
    return [start, start + (span * s.duration) / total];
  };
  // Último segmento que ya empezó; su progreso decide el valor (antes del primero, su "from")
  const evaluate = (list, scroll) => {
    let active = list[0];
    let p = 0;
    for (const s of list) {
      const [a, b] = range(s);
      if (scroll < a) continue;
      if (!active || a >= range(active)[0]) {
        active = s;
        p = b > a ? Math.min(1, (scroll - a) / (b - a)) : 1;
      }
    }
    return { s: active, p: active.ease(p) };
  };

  const darkLayer = $('.bg-dark');
  const lightLayer = $('.bg-light');
  const bar = $('.progress span');
  // Últimos valores escritos: el DOM solo se toca cuando algo cambia (evita recalcular estilos en cada frame)
  let lastScroll = -1;
  let lastColor = '';
  let lastLight = -1;
  let lastTone = '';

  const update = () => {
    const scroll = window.scrollY;
    if (scroll === lastScroll) return;
    lastScroll = scroll;

    const m = evaluate(moves, scroll);
    for (const key in m.s.to) state[key] = m.s.from[key] + (m.s.to[key] - m.s.from[key]) * m.p;

    const c = evaluate(paints, scroll);
    const [r, g, b] = c.s.from.map((v, i) => Math.round(v + (c.s.to[i] - v) * c.p));
    const color = `rgb(${r},${g},${b})`;
    if (color !== lastColor) {
      lastColor = color;
      bg.style.backgroundColor = color;
      // Luminancia del fondo → qué capa de textura se ve y en qué tono va el menú
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const light = Math.round(Math.min(1, Math.max(0, (lum - 0.25) / 0.6)) * 100) / 100;
      if (light !== lastLight) {
        lastLight = light;
        darkLayer.style.opacity = 1 - light;
        lightLayer.style.opacity = light;
      }
      const tone = lum > 0.5 ? 'light' : 'dark';
      if (tone !== lastTone) {
        lastTone = tone;
        document.body.dataset.tone = tone;
      }
    }

    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scroll / max : 0})`;
  };

  // Al recalcular posiciones (resize) hay que reevaluar aunque el scroll no haya cambiado
  ScrollTrigger.addEventListener('refresh', () => (lastScroll = -1));

  return { update };
}
