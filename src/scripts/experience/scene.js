import * as THREE from 'three';
import theatre from '@theatre/core';
import { createVehicle } from './vehicle.js';
import state from '../../data/ascent.theatre.json';

const { getProject } = theatre;

export async function mountScene(root, { gsap, ScrollTrigger, reduced }) {
  const host = root.querySelector('.scene-canvas');
  if (!host) return () => {};
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  host.parentElement.classList.add('has-webgl');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(0, .5, 16); camera.lookAt(0, .5, 0);
  scene.add(new THREE.HemisphereLight(0xdedbc9, 0x282621, 2.8));
  const key = new THREE.DirectionalLight(0xfff2d6, 5); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcbd4dd, 5); rim.position.set(5, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xeb743a, .9); fill.position.set(1, -4, 2); scene.add(fill);
  const model = createVehicle(); scene.add(model.vehicle);
  const project = getProject('Viswa — Ascent', { state });
  await project.ready;
  const sheet = project.sheet('Ascent');
  const object = sheet.object('Vehicle', { x: 2.6, y: .1, rotationZ: -.65, rotationY: .35, scale: 1.05, cameraZ: 16, flame: 0 });
  let pose = object.value;
  let paused = reduced.matches, dirty = true, visible = true, destroyed = false;
  const unsubscribe = object.onValuesChange(value => { pose = value; dirty = true; });
  let pointer = { x: 0, y: 0 };
  const wire = root.querySelector('[data-wireframe]');
  const motion = root.querySelector('.motion-switch');
  wire.hidden = false; motion.hidden = false;
  motion.textContent = paused ? 'Resume motion' : 'Pause motion';
  motion.setAttribute('aria-pressed', String(paused));
  const onWire = () => { const active = wire.getAttribute('aria-pressed') !== 'true'; wire.setAttribute('aria-pressed', String(active)); model.materials.forEach(material => { material.wireframe = active; }); dirty = true; };
  const onMotion = () => { paused = !paused; motion.setAttribute('aria-pressed', String(paused)); motion.textContent = paused ? 'Resume motion' : 'Pause motion'; dirty = true; };
  wire.addEventListener('click', onWire); motion.addEventListener('click', onMotion);
  const scroll = ScrollTrigger.create({ trigger: root.querySelector('.ascent'), start: 'top top', end: 'bottom bottom', onUpdate: self => { if (!paused) sheet.sequence.position = self.progress * 10; } });
  sheet.sequence.position = reduced.matches ? 0 : scroll.progress * 10;
  const onPointer = event => { if (event.pointerType === 'touch') return; pointer = { x: event.clientX / innerWidth - .5, y: event.clientY / innerHeight - .5 }; dirty = true; };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const resize = new ResizeObserver(() => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true;
  });
  resize.observe(host);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; dirty = true; }); observer.observe(host);
  let previous = 0;
  function render(time) {
    if (destroyed || !visible || document.hidden || (!dirty && paused)) return;
    if (time - previous < 1 / 40) return; previous = time;
    const mobile = host.clientWidth < 650;
    model.vehicle.position.set(pose.x * (mobile ? .5 : 1), pose.y + (mobile ? -1.7 : 0), 0);
    model.vehicle.rotation.set(0, pose.rotationY + (!paused ? pointer.x * .13 : 0), pose.rotationZ);
    model.vehicle.scale.setScalar(pose.scale * (mobile ? .7 : 1));
    camera.position.z = pose.cameraZ; camera.position.y = .5 + (!paused ? pointer.y * .15 : 0);
    camera.lookAt(0, .5, 0);
    model.exhaust.visible = pose.flame > .05;
    model.exhaust.scale.y = Math.max(.05, pose.flame * 2.3) * (!paused ? 1 + Math.sin(time * 22) * .025 : 1);
    fill.intensity = .9 + pose.flame * 3;
    renderer.render(scene, camera); dirty = false;
  }
  gsap.ticker.add(render);
  const onPreference = () => { paused = reduced.matches; motion.textContent = paused ? 'Resume motion' : 'Pause motion'; motion.setAttribute('aria-pressed', String(paused)); if (paused) sheet.sequence.position = 0; dirty = true; };
  reduced.addEventListener('change', onPreference);
  const lost = event => { event.preventDefault(); host.parentElement.classList.remove('has-webgl'); wire.hidden = true; motion.hidden = true; gsap.ticker.remove(render); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  return () => {
    destroyed = true; gsap.ticker.remove(render); scroll.kill(); unsubscribe(); sheet.detachObject('Vehicle');
    resize.disconnect(); observer.disconnect(); window.removeEventListener('pointermove', onPointer); reduced.removeEventListener('change', onPreference);
    wire.removeEventListener('click', onWire); motion.removeEventListener('click', onMotion);
    const geometries = new Set(); scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); }); geometries.forEach(g => g.dispose());
    [...model.materials, model.flameMaterial, model.coreMaterial].forEach(m => m.dispose()); model.labelTexture?.dispose(); renderer.dispose(); renderer.domElement.remove();
  };
}
