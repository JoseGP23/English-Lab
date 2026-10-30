import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { wireWhatsApp } from './whatsapp.js';
import { createWorld, createState } from './scene/world.js';
import { getPoses } from './scroll/poses.js';
import { buildChoreography } from './scroll/choreography.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const html = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 860px)').matches;

const preloader = document.querySelector('.preloader');
const countEl = document.querySelector('.preloader__count span');
const startBtn = document.querySelector('.preloader__start');

wireWhatsApp();
document.querySelector('.year').textContent = new Date().getFullYear();
html.classList.add(reduced ? 'reduced' : 'motion');
document.body.classList.add('is-loading');

/* ---------- Scroll suave ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView();
  });
});

/* ---------- Carga: fuentes (para las texturas 3D) + escena ---------- */
async function loadWorld() {
  await Promise.race([
    Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('italic 400 100px Fraunces'),
      document.fonts.load('600 40px Manrope'),
    ]),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
  try {
    const world = createWorld(document.querySelector('.stage'), { mobile });
    if (!world) html.classList.add('no-webgl');
    return world;
  } catch (err) {
    console.error(err);
    html.classList.add('no-webgl');
    return null;
  }
}

const progress = { v: 0 };
const fillEl = document.querySelector('.preloader__fill');
const render = () => {
  countEl.textContent = Math.round(progress.v);
  fillEl.style.transform = `translateY(${100 - progress.v}%)`;
};
const fakeLoad = gsap.to(progress, { v: 88, duration: 1.6, ease: 'power2.out', onUpdate: render });

const world = await loadWorld();
await fakeLoad;
await gsap.to(progress, { v: 100, duration: 0.5, ease: 'power1.inOut', onUpdate: render });
preloader.classList.add('is-ready');
startBtn.focus({ preventScroll: true });

/* ---------- Estado de la escena y coreografía ---------- */
const poses = getPoses(mobile);
const state = world ? world.state : createState();
Object.assign(state, poses.hero);

const heroWords = [...document.querySelectorAll('.hero__word')];
const split = new SplitText('.hero__word', { type: 'chars', charsClass: 'char' });
const heroChars = split.chars;

const choreo = reduced ? null : buildChoreography({ state, mobile, heroChars });
// El scroll toma el control del cohete cuando termina la intro
const followScroll = () => gsap.ticker.add(choreo.update);

/* ---------- Despegue: cierra el preloader y arranca la intro ---------- */
function start() {
  startBtn.disabled = true;
  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
      if (choreo) followScroll();
    },
  });

  if (reduced) {
    tl.to(preloader, { autoAlpha: 0, duration: 0.3 });
    return;
  }

  gsap.set('.hero__title', { perspective: 900 });
  gsap.set(heroChars, { yPercent: 115, rotationX: -80, opacity: 0, transformOrigin: '50% 100%' });
  gsap.set('.hero__kicker, .hero__bottom, .hero__scroll', { autoAlpha: 0, y: 30 });

  tl.to(preloader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
    .from(state, { y: -1.6, scale: state.scale * 0.5, rz: 0, flame: 2.6, duration: 2, ease: 'power3.out' }, 0.35)
    .to(heroChars, {
      yPercent: 0, rotationX: 0, opacity: 1, duration: 1.1, ease: 'expo.out',
      stagger: { each: 0.05, from: 'random' },
    }, 0.6)
    .add(() => glitch(), 1.3)
    .to('.hero__kicker, .hero__bottom, .hero__scroll', { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 1.2);
}

function glitch() {
  heroWords.forEach((w) => {
    w.classList.remove('is-glitching');
    void w.offsetWidth;
    w.classList.add('is-glitching');
  });
}

startBtn.addEventListener('click', start, { once: true });

// Glitch ocasional del título mientras el hero está en pantalla
if (!reduced) {
  setInterval(() => {
    if (window.scrollY < window.innerHeight * 0.5 && !document.hidden) glitch();
  }, 5200);
}

/* ---------- CTA: el cohete despega al escribir por WhatsApp ---------- */
if (world && !reduced) {
  document.querySelector('.cta__launch').addEventListener('click', () => {
    const { launch } = world;
    gsap.killTweensOf(launch);
    gsap.timeline()
      .to(launch, { boost: 2.4, duration: 0.35, ease: 'power2.out' })
      .to(launch, { y: 9, duration: 1.4, ease: 'power3.in' }, 0.2)
      .set(launch, { y: 9, boost: 0.6 })
      .to(launch, { y: 0, duration: 1.8, ease: 'power3.out' }, '+=0.6')
      .to(launch, { boost: 0, duration: 0.6 }, '-=0.4');
  });
}
