import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { STOPS } from './data.js';
import { sunShader, planetShader, cloudShader, atmosphereShader, ringShader, starShader, skyShader } from './shaders.js';

const $ = id => document.getElementById(id);
const isMobile = () => innerWidth < 760;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const deg = d => d * Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const OVERVIEW = STOPS.findIndex(s => s.overview);

// ---------- Renderer, scene, bloom ----------

const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 6000);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.6, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const time = { value: 0 };

// ---------- Sky: nebula, stars, shooting stars ----------

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(3000, 48, 24),
  new THREE.ShaderMaterial({ ...skyShader, side: THREE.BackSide, depthWrite: false }),
));

function makeStars(count) {
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const color = new Float32Array(count * 3);
  const palette = ['#9bb0ff', '#cad7ff', '#fff4ea', '#fff4ea', '#ffd2a1', '#ffb56c'].map(c => new THREE.Color(c));
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (v.lengthSq() > 1 || v.lengthSq() < 0.01) { i--; continue; }
    v.normalize().multiplyScalar(1400 + Math.random() * 1200);
    v.toArray(pos, i * 3);
    size[i] = Math.pow(Math.random(), 7) * 5 + 0.8;
    phase[i] = Math.random();
    palette[Math.floor(Math.random() * palette.length)].toArray(color, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  return new THREE.Points(g, new THREE.ShaderMaterial({
    ...starShader,
    uniforms: { uTime: time, uPixel: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}
scene.add(makeStars(isMobile() ? 4000 : 8000));

// Now and then a shooting star crosses the sky
const shooting = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([3, 3, 3.2, 0, 0, 0]), 3));
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  line.visible = false;
  line.frustumCulled = false;
  scene.add(line);
  const s = { line, life: 0, next: 3, head: new THREE.Vector3(), vel: new THREE.Vector3() };
  s.update = dt => {
    s.next -= dt;
    if (s.next <= 0 && !line.visible) {
      // Start somewhere in front of the camera, far away
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      s.head.copy(camera.position).addScaledVector(dir, 700)
        .add(new THREE.Vector3((Math.random() - 0.5) * 900, 150 + Math.random() * 250, (Math.random() - 0.5) * 900));
      s.vel.set(Math.random() - 0.5, -0.35 - Math.random() * 0.3, Math.random() - 0.5).normalize().multiplyScalar(650);
      s.life = 0.9;
      line.visible = true;
    }
    if (!line.visible) return;
    s.life -= dt;
    s.head.addScaledVector(s.vel, dt);
    const tail = s.head.clone().addScaledVector(s.vel, -0.18);
    const p = g.attributes.position.array;
    s.head.toArray(p, 0);
    tail.toArray(p, 3);
    g.attributes.position.needsUpdate = true;
    line.material.opacity = Math.min(1, s.life * 3);
    if (s.life <= 0) { line.visible = false; s.next = 4 + Math.random() * 7; }
  };
  return s;
})();

// ---------- The Sun ----------

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GLOW = glowTexture();

const SUN = STOPS[0];
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(SUN.size, 128, 64),
  new THREE.ShaderMaterial({ ...sunShader, uniforms: { uTime: time } }),
);
scene.add(sun);
for (const [scale, color, opacity] of [[4.5, '#ffb35c', 0.6], [11, '#ff7a2e', 0.22], [26, '#ff6a20', 0.07]]) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  sprite.scale.setScalar(SUN.size * scale);
  scene.add(sprite);
}
scene.add(new THREE.PointLight('#fff1dd', 2.4, 0, 0));
scene.add(new THREE.AmbientLight('#ffffff', 0.05));

// ---------- Planets ----------

const TILT = { aarde: 23.4, mars: 25.2, jupiter: 3.1, neptunus: 28.3 };
const SPIN = { mercurius: 0.02, venus: -0.01, aarde: 0.12, mars: 0.11, jupiter: 0.25, saturnus: 0.22, uranus: -0.15, neptunus: 0.16 };
const bodies = [];
const pickable = [sun];
sun.userData.index = 0;

const orbitMaterials = [];
function orbitLine(radius) {
  const pts = [];
  for (let i = 0; i < 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
  const m = new THREE.LineBasicMaterial({ color: '#c9d4ff', transparent: true, opacity: 0.06, depthWrite: false });
  orbitMaterials.push(m);
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), m);
}

function planetMaterial(type, colors, atmosphere, seed) {
  const [a, b, c] = colors.map(x => new THREE.Color(x));
  return new THREE.ShaderMaterial({
    ...planetShader,
    uniforms: { uTime: time, uType: { value: type }, uA: { value: a }, uB: { value: b }, uC: { value: c }, uAtmo: { value: new THREE.Color(atmosphere || '#000000') }, uSeed: { value: seed } },
  });
}

STOPS.forEach((stop, index) => {
  if (!stop.orbit) return;
  const pivot = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = deg(stop.tilt ?? TILT[stop.id] ?? stop.rings?.tilt ?? 0);
  pivot.add(tilt);
  scene.add(pivot);
  scene.add(orbitLine(stop.orbit));

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(stop.size, 128, 64), planetMaterial(stop.type, stop.colors, stop.atmosphere, index * 3.7));
  mesh.userData.index = index;
  tilt.add(mesh);
  pickable.push(mesh);

  if (stop.atmosphere) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(stop.size * 1.13, 64, 32),
      new THREE.ShaderMaterial({
        ...atmosphereShader,
        uniforms: { uColor: { value: new THREE.Color(stop.atmosphere) }, uPower: { value: stop.type >= 4 ? 4.0 : 3.0 } },
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    pivot.add(glow);
  }

  let clouds = null;
  if (stop.type === 2) {
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(stop.size * 1.018, 96, 48),
      new THREE.ShaderMaterial({ ...cloudShader, uniforms: { uTime: time }, transparent: true, depthWrite: false }),
    );
    tilt.add(clouds);
  }

  let moon = null;
  if (stop.moon) {
    moon = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(stop.size * 0.27, 64, 32), planetMaterial(0, ['#a3a29d', '#6e6d69', '#cfcdc6'], null, 11));
    m.position.x = stop.size * 2.9;
    moon.add(m);
    moon.rotation.z = deg(5);
    pivot.add(moon);
  }

  if (stop.rings) {
    const r = stop.rings;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(stop.size * r.inner, stop.size * r.outer, 192, 1),
      new THREE.ShaderMaterial({
        ...ringShader,
        uniforms: {
          uColor: { value: new THREE.Color(r.color) }, uInner: { value: stop.size * r.inner }, uOuter: { value: stop.size * r.outer },
          uPlanet: { value: pivot.position }, uRadius: { value: stop.size }, uFaint: { value: r.faint ? 1 : 0 },
        },
        side: THREE.DoubleSide, transparent: true, depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    tilt.add(ring);
  }

  const body = { stop, index, pivot, mesh, clouds, moon, angle: deg(stop.angle), speed: 0.01 * Math.pow(16 / stop.orbit, 1.5), spin: SPIN[stop.id] || 0.1 };
  body.place = () => pivot.position.set(Math.cos(body.angle) * stop.orbit, 0, Math.sin(body.angle) * stop.orbit);
  body.place();
  bodies[index] = body;
});

// ---------- Asteroid belt between Mars and Jupiter ----------

const belt = (() => {
  const count = isMobile() ? 1400 : 2600;
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: '#8c8174', roughness: 1, flatShading: true }),
    count,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = 48 + (Math.random() + Math.random() + Math.random() - 1.5) * 3.2;
    const a = Math.random() * Math.PI * 2;
    p.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.6, Math.sin(a) * r);
    e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    q.setFromEuler(e);
    const k = 0.03 + Math.pow(Math.random(), 5) * 0.16;
    s.set(k, k * (0.6 + Math.random() * 0.5), k * (0.7 + Math.random() * 0.4));
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  }
  scene.add(mesh);
  return mesh;
})();

// ---------- Warp streaks: lines around the camera that show up while flying ----------

const warp = (() => {
  const n = reduced ? 0 : 500;
  const pos = new Float32Array(n * 6);
  const col = new Float32Array(n * 6);
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.pow(Math.random(), 0.7) * 30;
    items.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 320 });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.frustumCulled = false;
  camera.add(lines);
  return {
    amount: 0,
    update(dt) {
      lines.visible = this.amount > 0.02;
      if (!lines.visible) return;
      const len = 2 + this.amount * 45;
      const bright = this.amount * 1.6;
      items.forEach((it, i) => {
        it.z += dt * (40 + this.amount * 700);
        if (it.z > -2) it.z -= 320;
        pos.set([it.x, it.y, it.z, it.x, it.y, it.z - len], i * 6);
        col.set([bright * 0.8, bright * 0.9, bright, 0, 0, 0], i * 6);
      });
      g.attributes.position.needsUpdate = true;
      g.attributes.color.needsUpdate = true;
    },
  };
})();

// ---------- Where the camera goes for each stop ----------

function viewFor(index) {
  const stop = STOPS[index];
  const mobile = isMobile();
  const center = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let dist;
  if (index < 0) {
    // The intro: the whole system from far away, slowly turning
    const a = time.value * 0.02;
    return { pos: new THREE.Vector3(Math.sin(a) * 260, 95, Math.cos(a) * 260), target: new THREE.Vector3(0, -12, 0), dist: 280 };
  }
  if (stop.overview) {
    dist = mobile ? 380 : 285;
    pos.set(0, dist * 0.78, dist * 0.62);
  } else if (index === 0) {
    dist = SUN.size * (mobile ? 6 : 4.3);
    pos.set(0.35, 0.12, 1).normalize().multiplyScalar(dist);
  } else {
    const b = bodies[index];
    center.copy(b.pivot.position);
    const u = center.clone().normalize();
    const side = new THREE.Vector3().crossVectors(u, UP).normalize();
    const dir = u.clone().multiplyScalar(-0.55).addScaledVector(side, 0.8).addScaledVector(UP, 0.2).normalize();
    dist = stop.size * (stop.rings && !stop.rings.faint ? 6.4 : 4.8) * (mobile ? 1.45 : 1);
    pos.copy(center).addScaledVector(dir, dist);
  }
  // Shift the view so the planet sits next to the text (desktop) or above it (phone)
  const forward = center.clone().sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward);
  const target = center.clone();
  if (mobile) target.addScaledVector(up, -dist * 0.16);
  else target.addScaledVector(right, -dist * (stop.overview ? 0.1 : 0.24));
  return { pos, target, dist, right, up };
}

// ---------- Travelling ----------

const nf = new Intl.NumberFormat('nl-NL');
let current = -1;
let travel = null;
const look = new THREE.Vector3(0, 0, 0);
let shownKm = 0;
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function go(index) {
  index = Math.max(0, Math.min(STOPS.length - 1, index));
  if (travel || index === current) return;
  document.body.classList.remove('intro');
  const dest = viewFor(index);
  const span = camera.position.distanceTo(dest.pos);
  travel = {
    index,
    start: performance.now(),
    dur: reduced ? 700 : Math.min(4200, 1500 + span * 9),
    fromPos: camera.position.clone(),
    fromLook: look.clone(),
    fromKm: shownKm,
    toKm: STOPS[index].km ?? shownKm,
    span,
    prev: camera.position.clone(),
  };
  hideInfo();
  setTimeline(index);
}

function step(dir) {
  if (current < 0) return go(0);
  go(current + dir);
}

function updateCamera(dt) {
  if (travel) {
    const t = Math.min(1, (performance.now() - travel.start) / travel.dur);
    const e = ease(t);
    const dest = viewFor(travel.index);
    camera.position.lerpVectors(travel.fromPos, dest.pos, e).addScaledVector(UP, Math.sin(e * Math.PI) * travel.span * 0.16);
    look.lerpVectors(travel.fromLook, dest.target, e);
    const speed = camera.position.distanceTo(travel.prev) / Math.max(dt, 0.001);
    travel.prev.copy(camera.position);
    warp.amount += (Math.min(1, speed / 90) - warp.amount) * Math.min(1, dt * 6);
    shownKm = travel.fromKm + (travel.toKm - travel.fromKm) * e;
    renderMeter();
    if (t >= 1) {
      current = travel.index;
      travel = null;
      showInfo(current);
    }
  } else {
    warp.amount += (0 - warp.amount) * Math.min(1, dt * 4);
    const dest = viewFor(current);
    // A little parallax with the mouse
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 2.5);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 2.5);
    if (dest.right) dest.pos.addScaledVector(dest.right, pointer.sx * dest.dist * 0.06).addScaledVector(dest.up, -pointer.sy * dest.dist * 0.04);
    const k = 1 - Math.exp(-dt * 2.5);
    camera.position.lerp(dest.pos, k);
    look.lerp(dest.target, k);
  }
  camera.lookAt(look);
  const fov = 45 + warp.amount * 22;
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

// ---------- Text panel ----------

const info = $('info');

// Every letter in its own span (for the rise animation), grouped per word so words never break
function letters(text) {
  let i = 0;
  return text.split(' ').map(word => `<span class="word">${[...word].map(ch => `<span style="--d:${(i++ * 0.035).toFixed(3)}s">${ch}</span>`).join('')}</span>`).join(' ');
}

function showInfo(index) {
  const s = STOPS[index];
  $('i-nr').textContent = String(index + 1).padStart(2, '0');
  $('i-kind').textContent = s.kind;
  $('i-name').innerHTML = letters(s.name);
  $('i-name').classList.toggle('long', s.name.length > 10);
  $('i-name').setAttribute('aria-label', s.name);
  $('i-intro').textContent = s.intro;
  $('i-stats').innerHTML = s.stats.map(([k, v], i) => `<div class="reveal" style="--d:${0.35 + i * 0.07}s"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('i-fact').textContent = s.fact;
  info.classList.remove('in');
  void info.offsetWidth;
  info.classList.add('in');
  document.body.classList.toggle('overview', !!s.overview);
  history.replaceState(null, '', '#' + s.id);
  renderMeter();
}

function hideInfo() {
  info.classList.remove('in');
  document.body.classList.remove('overview');
}

function renderMeter() {
  const stop = STOPS[travel ? travel.index : Math.max(current, 0)];
  $('dist').textContent = nf.format(Math.round(shownKm / 1e5) * 1e5) + ' km';
  $('light').textContent = stop.light && !travel ? stop.light : stop.km === 0 && !travel ? 'hier begint het licht' : '…';
}

// ---------- Timeline ----------

const timeline = $('timeline');
timeline.innerHTML = STOPS.map((s, i) => `<button data-i="${i}" style="--i:${i}"><i></i><span>${s.overview ? 'Overzicht' : s.name.replace(/^De /, '')}</span></button>`).join('');
timeline.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) go(+b.dataset.i);
});
function setTimeline(index) {
  timeline.querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('on', i === index);
    b.classList.toggle('past', i < index);
  });
  timeline.style.setProperty('--progress', index / (STOPS.length - 1));
}

// ---------- Labels in the overview ----------

const labels = $('labels');
labels.innerHTML = STOPS.map((s, i) => (s.overview ? '' : `<button class="label" data-i="${i}">${s.name.replace(/^De /, '')}</button>`)).join('');
labels.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) go(+b.dataset.i);
});
const labelEls = [...labels.querySelectorAll('.label')];
function updateLabels() {
  if (current !== OVERVIEW || travel) return;
  const v = new THREE.Vector3();
  labelEls.forEach(el => {
    const i = +el.dataset.i;
    if (i === 0) v.set(0, 0, 0); else v.copy(bodies[i].pivot.position);
    v.y += (STOPS[i].size || 1) * 1.4 + 1.5;
    v.project(camera);
    el.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%, -100%)`;
  });
}

// ---------- Input: scroll, keys, swipe, click on a planet ----------

let wheelSum = 0;
let wheelLock = 0;
addEventListener('wheel', e => {
  if (e.target.closest('.info')) return;
  wheelSum += e.deltaY;
  if (Math.abs(wheelSum) > 50 && performance.now() > wheelLock) {
    step(Math.sign(wheelSum));
    wheelLock = performance.now() + 1200;
    wheelSum = 0;
  }
  clearTimeout(addEventListener.wheelTimer);
  addEventListener.wheelTimer = setTimeout(() => { wheelSum = 0; }, 200);
}, { passive: true });

addEventListener('keydown', e => {
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
  if (e.key === 'Home') go(0);
  if (e.key === 'End') go(STOPS.length - 1);
});

let touch = null;
addEventListener('touchstart', e => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x;
  const dy = e.changedTouches[0].clientY - touch.y;
  touch = null;
  if (e.target.closest('.info, #timeline')) return;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 50) step(Math.abs(dx) > Math.abs(dy) ? -Math.sign(dx) : -Math.sign(dy));
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = $('tip');
function hit(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const h = raycaster.intersectObjects(pickable, false)[0];
  return h ? h.object.userData.index : null;
}
addEventListener('pointermove', e => {
  pointer.x = e.clientX / innerWidth * 2 - 1;
  pointer.y = e.clientY / innerHeight * 2 - 1;
  if (e.pointerType !== 'mouse' || e.target !== canvas || travel || current < 0) { tip.classList.remove('on'); canvas.style.cursor = ''; return; }
  const i = hit(e);
  const show = i !== null && i !== current;
  canvas.style.cursor = show ? 'pointer' : '';
  tip.classList.toggle('on', show);
  if (show) {
    tip.textContent = 'Vlieg naar ' + STOPS[i].name.replace(/^De /, '');
    tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 14}px)`;
  }
});
canvas.addEventListener('click', e => {
  if (current < 0) return;
  const i = hit(e);
  if (i !== null) { tip.classList.remove('on'); go(i); }
});

$('start').addEventListener('click', () => go(0));
$('overview-btn').addEventListener('click', () => go(current === OVERVIEW ? 0 : OVERVIEW));

// ---------- Resize and the frame loop ----------

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let first = true;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time.value += dt;
  sun.rotation.y += dt * 0.03;
  bodies.forEach(b => {
    if (!b) return;
    b.angle += b.speed * dt;
    b.place();
    b.mesh.rotation.y += b.spin * dt;
    if (b.clouds) b.clouds.rotation.y += b.spin * 1.2 * dt;
    if (b.moon) b.moon.rotation.y += dt * 0.25;
  });
  belt.rotation.y += dt * 0.004;
  const orbitTarget = current === OVERVIEW && !travel ? 0.3 : 0.06;
  orbitMaterials.forEach(m => { m.opacity += (orbitTarget - m.opacity) * Math.min(1, dt * 3); });
  updateCamera(dt);
  warp.update(dt);
  shooting.update(dt);
  composer.render();
  updateLabels();
  if (first) { first = false; document.body.classList.remove('loading'); }
  requestAnimationFrame(frame);
}

// Start: from the intro, or straight at a planet when the link has one (#mars)
camera.position.copy(viewFor(-1).pos);
const start = STOPS.findIndex(s => '#' + s.id === location.hash);
if (start >= 0) {
  document.body.classList.remove('intro');
  current = start;
  shownKm = STOPS[start].km ?? 0;
  const v = viewFor(start);
  camera.position.copy(v.pos);
  look.copy(v.target);
  setTimeline(start);
  showInfo(start);
}
frame();
