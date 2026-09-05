import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import barba from '@barba/core';
import { animate as anime, spring } from 'animejs';
import { animate, hover } from 'motion';

gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cleanupPage = () => {};
let lenis;
let generation = 0;
const scrollPositions = new Map();

// The visual editor is deliberately development-only and never loaded for normal visitors.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('studio')) {
  const { default: studio } = await import('@theatre/studio');
  studio.initialize();
}

function mountPage(container) {
  const ownGeneration = ++generation;
  const cleanups = [];
  if (!reduced.matches) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const ticker = time => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
    const instance = lenis;
    cleanups.push(() => { gsap.ticker.remove(ticker); instance.destroy(); if (lenis === instance) lenis = undefined; });
  }
  const context = gsap.context(() => {
    if (!reduced.matches) {
      gsap.from(container.querySelectorAll('.opening .title-line'), { yPercent: 35, opacity: 0, duration: 1.3, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from(container.querySelectorAll('.opening .exp-kicker,.opening-bottom'), { opacity: 0, y: 12, duration: 1, delay: .3, clearProps: 'transform,opacity' });
      container.querySelectorAll('.chapter-copy,.departure h2,[data-reveal]').forEach(element => {
        gsap.from(element, { y: 65, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true }, clearProps: 'transform,opacity' });
      });
      const image = container.querySelector('.interlude>img');
      if (image) gsap.fromTo(image, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    gsap.to(document.querySelector('.exp-progress span'), { scaleY: 1, ease: 'none', scrollTrigger: { trigger: container, start: 'top top', end: 'bottom bottom', scrub: true } });
  }, container);
  cleanups.push(() => context.revert());

  // Motion owns gesture feedback. It never writes to the cinematic camera or scroll timeline.
  const unhover = hover(container.querySelectorAll('.flight-row,.round-link,.contact-title,.archive-end>a'), element => {
    if (reduced.matches) return;
    const arrow = element.querySelector('.flight-row-arrow,span');
    if (!arrow) return;
    animate(arrow, { x: 5, y: -5, rotate: 6 }, { type: 'spring', stiffness: 280, damping: 20 });
    return () => animate(arrow, { x: 0, y: 0, rotate: 0 }, { type: 'spring', stiffness: 280, damping: 22 });
  });
  cleanups.push(unhover);
  container.querySelectorAll('details').forEach(details => {
    let height = details.offsetHeight;
    let animation;
    const onToggle = () => {
      animation?.stop(); details.style.height = 'auto';
      const nextHeight = details.offsetHeight;
      if (!reduced.matches) {
        details.style.overflow = 'hidden';
        animation = animate(details, { height: [height, nextHeight] }, { duration: .3, ease: [.22,1,.36,1] });
        animation.then(() => { details.style.height = ''; details.style.overflow = ''; });
      }
      height = nextHeight;
      lenis?.resize(); ScrollTrigger.refresh();
    };
    details.addEventListener('toggle', onToggle);
    cleanups.push(() => { details.removeEventListener('toggle', onToggle); animation?.stop(); });
  });
  if (container.querySelector('.scene-canvas')) {
    import('./scene.js').then(async ({ mountScene }) => {
      if (ownGeneration !== generation) return;
      const dispose = await mountScene(container, { gsap, ScrollTrigger, reduced });
      if (ownGeneration !== generation) dispose(); else cleanups.push(dispose);
    }).catch(error => { console.warn('The cinematic vehicle is unavailable; the photo fallback remains visible.', error); });
  }
  cleanupPage = () => { generation++; cleanups.reverse().forEach(dispose => dispose()); };
  document.fonts.ready.then(() => { if (ownGeneration === generation) { lenis?.resize(); ScrollTrigger.refresh(); } });
}

const dialog = document.getElementById('exp-index');
const toggle = document.querySelector('.index-toggle');
let menuAnimation;
function closeIndex() { menuAnimation?.cancel(); dialog.close(); toggle.setAttribute('aria-expanded', 'false'); lenis?.start(); }
function openIndex() {
  dialog.showModal(); toggle.setAttribute('aria-expanded', 'true'); lenis?.stop();
  if (!reduced.matches) menuAnimation = anime(dialog.querySelectorAll('nav a'), { translateY: [35, 0], opacity: [0, 1], delay: (_, i) => i * 55, ease: spring({ stiffness: 160, damping: 22 }) });
}
toggle.addEventListener('click', openIndex);
document.querySelector('.index-close').addEventListener('click', closeIndex);
dialog.addEventListener('cancel', () => { toggle.setAttribute('aria-expanded', 'false'); lenis?.start(); });
dialog.addEventListener('click', event => { if (event.target.closest('a')) closeIndex(); });

const initialContainer = document.querySelector('[data-barba="container"]');
mountPage(initialContainer);
history.scrollRestoration = 'manual';
gsap.set('.page-shutter', { yPercent: 101, y: 0 });
barba.init({
  preventRunning: true,
  timeout: 10000,
  prevent: ({ el, href }) => !el.hasAttribute('data-cinematic') || (new URL(href, location.href).pathname === location.pathname),
  transitions: [{
    name: 'orbital-cut',
    async leave(data) {
      scrollPositions.set(data.current.url.path, scrollY);
      lenis?.stop();
      await gsap.to('.page-shutter', { yPercent: 0, y: 0, duration: reduced.matches ? 0 : .55, ease: 'power3.inOut' });
      cleanupPage();
    },
    beforeEnter(data) {
      const nextDocument = new DOMParser().parseFromString(data.next.html, 'text/html');
      document.title = nextDocument.title;
      for (const selector of ['meta[name="description"]','link[rel="canonical"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[name="twitter:title"]','meta[name="twitter:description"]']) {
        const current = document.head.querySelector(selector), next = nextDocument.head.querySelector(selector);
        if (current && next) current.replaceWith(next.cloneNode(true));
      }
      window.scrollTo(0, 0);
    },
    async enter(data) {
      mountPage(data.next.container);
      const isHistory = data.trigger === 'back' || data.trigger === 'forward' || data.trigger === 'popstate';
      const fragment = data.next.url.hash;
      const target = fragment ? document.getElementById(decodeURIComponent(fragment)) : null;
      if (target) target.scrollIntoView();
      else if (isHistory) window.scrollTo(0, scrollPositions.get(data.next.url.path) ?? 0);
      lenis?.resize(); ScrollTrigger.refresh();
      await gsap.to('.page-shutter', { yPercent: -101, duration: reduced.matches ? 0 : .65, ease: 'power3.inOut' });
      gsap.set('.page-shutter', { yPercent: 101, y: 0 });
      data.next.container.focus({ preventScroll: true });
    },
  }],
  requestError: (_trigger, _action, url) => { window.location.assign(url); return false; },
});
const onPreference = () => { cleanupPage(); mountPage(document.querySelector('[data-barba="container"]')); };
reduced.addEventListener('change', onPreference);
if (import.meta.hot) import.meta.hot.dispose(() => { cleanupPage(); barba.destroy(); reduced.removeEventListener('change', onPreference); });
