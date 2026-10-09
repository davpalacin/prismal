import {
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, PointLight, Raycaster, Scene, SphereGeometry,
  Vector2, Vector3, WebGLRenderer, Group, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments,
} from 'three';
import { HALF, MENU, PIECES, STEPS, geometryOf, inBounds, keyOf, place, worldPoint } from './pieces.js';
import { makeThumbs } from './thumbs.js';
import { buildWorld } from './world.js';
import { makeDog, makeHuman } from './actors.js';
import * as phys from './physics.js';

// ------------------------------- Escena ------------------------------------
const canvas = document.getElementById('c');
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new Scene();
const camera = new PerspectiveCamera(60, 1, 0.1, 500);
const world = buildWorld(scene, phys.addCircle);

// Materiales compartidos: 0 madera (color por vértice), 1 vidrio, 2 llama.
const woodMat = new MeshLambertMaterial({ vertexColors: true });
const glassMat = new MeshLambertMaterial({ color: '#9fd4e8', transparent: true, opacity: 0.35, depthWrite: false });
const flameMat = new MeshBasicMaterial({ vertexColors: true });
const mats = [woodMat, glassMat, flameMat];
const matFor = (g) => (g.groups.length ? mats : woodMat);
const delMat = new MeshLambertMaterial({ color: '#d9453b' });
const ghostMat = new MeshBasicMaterial({ color: '#3fc060', transparent: true, opacity: 0.55, depthWrite: false });

// Rejilla del suelo: 1 m (clara) y 0,5 m (tenue).
function mkGrid(step, opacity) {
  const v = [];
  for (let u = 0; u <= 2 * HALF + 1e-6; u += step) v.push(u - HALF, 0, -HALF, u - HALF, 0, HALF, -HALF, 0, u - HALF, HALF, 0, u - HALF);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  const l = new LineSegments(g, new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity, depthWrite: false }));
  l.position.y = 0.004;
  scene.add(l);
  return l;
}
const gridMain = mkGrid(1, 0.22), gridHalf = mkGrid(0.5, 0.1);

// ------------------------------ Estado -------------------------------------
const st = { sel: 'floor1', rot: 0, anchor: 0, snap: 1, mode: 'build' };
const placed = new Map();      // clave geométrica -> { mesh, pts, torch }
const pieces = new Group();
scene.add(pieces);
const ghost = new Mesh(geometryOf(st.sel), ghostMat);
ghost.visible = false;
scene.add(ghost);
const marker = new Mesh(new SphereGeometry(0.08, 10, 8), new MeshBasicMaterial({ color: '#ffd23f', depthTest: false, fog: false }));
marker.renderOrder = 10;
marker.visible = false;
scene.add(marker);
let cur = null, curValid = false, hovered = null, havePointer = false, px = 0, py = 0, dirty = true;

// Antorchas: 8 luces puntuales fijas (el número no cambia, así no se recompilan
// los shaders) que se asignan a las antorchas más cercanas.
const torches = [];
const lights = Array.from({ length: 8 }, () => { const l = new PointLight('#ff9a3c', 0, 11, 2); scene.add(l); return l; });

// ------------------------- Personaje, perro y cámara -----------------------
const P = { x: 0, y: 0, z: 6, vy: 0, onGround: true, face: Math.PI };
const D = { x: 1.2, y: 0, z: 7.2, vy: 0, onGround: true, face: Math.PI };
const human = makeHuman(), dog = makeDog();
scene.add(human.group, dog.group);
const cam = { yaw: Math.PI, pitch: 0.3, dist: 5, first: false };
const keys = {};
let petT = 0, heartT = 0, stuck = 0, lightT = 0;

function updateCamera() {
  const cp = Math.cos(cam.pitch), d = new Vector3(Math.sin(cam.yaw) * cp, -Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  if (cam.first) {
    camera.position.set(P.x, P.y + 1.4, P.z);
    camera.lookAt(camera.position.clone().add(d));
  } else {
    const t = new Vector3(P.x, P.y + 1.25, P.z);
    camera.position.copy(t).addScaledVector(d, -cam.dist);
    camera.position.y = Math.max(0.3, camera.position.y);
    camera.lookAt(t);
  }
  camera.updateMatrixWorld();
}

const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

function step(dt, t) {
  // --- Jugador ---
  const f = [Math.sin(cam.yaw), Math.cos(cam.yaw)], r = [-Math.cos(cam.yaw), Math.sin(cam.yaw)];
  let mx = 0, mz = 0;
  if (petT <= 0) {
    const fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const rt = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    mx = f[0] * fw + r[0] * rt; mz = f[1] * fw + r[1] * rt;
  }
  const len = Math.hypot(mx, mz), speed = len ? (keys.ShiftLeft || keys.ShiftRight ? 5.2 : 3.2) : 0;
  if (len) {
    mx /= len; mz /= len;
    if (!cam.first) P.face = lerpAngle(P.face, Math.atan2(mx, mz), 1 - Math.exp(-12 * dt));
  }
  if (cam.first) P.face = cam.yaw;
  if (keys.Space && P.onGround && petT <= 0) { P.vy = phys.JUMP_V; P.onGround = false; }
  phys.moveActor(P, mx * speed * dt, mz * speed * dt, dt, 0.28, 1.5);
  human.group.position.set(P.x, P.y, P.z);
  human.group.rotation.y = P.face;
  human.group.visible = !cam.first;
  human.update(dt, speed, !P.onGround, petT > 0);

  // --- Perro: se coloca detrás y a la derecha, sin cruzarse en el camino ---
  const pf = [Math.sin(P.face), Math.cos(P.face)], pr = [-Math.cos(P.face), Math.sin(P.face)];
  const sx = P.x - pf[0] * 1.5 + pr[0] * 1.0, sz = P.z - pf[1] * 1.5 + pr[1] * 1.0;
  let dx = sx - D.x, dz = sz - D.z, ds = Math.hypot(dx, dz), dspeed = 0, want = D.face;
  const dp = Math.hypot(P.x - D.x, P.z - D.z);
  if (petT > 0) {
    petT -= dt;
    want = Math.atan2(P.x - D.x, P.z - D.z);
    heartT -= dt;
    if (heartT <= 0) { heartT = 0.35; heart(); }
  } else {
    if (dp > 18 || stuck > 2.5) { D.x = sx; D.z = sz; D.y = P.y + 0.2; D.vy = 0; stuck = 0; ds = 0; }
    if (dp < 0.9) { dx = D.x - P.x; dz = D.z - P.z; ds = Math.hypot(dx, dz) || 1; dspeed = 3; }   // despeja el paso
    else if (ds > 0.3) dspeed = Math.min(5.5, 1 + ds * 2.2);
    if (dspeed) {
      want = Math.atan2(dx, dz);
      const px0 = D.x, pz0 = D.z;
      phys.moveActor(D, (dx / ds) * dspeed * dt, (dz / ds) * dspeed * dt, dt, 0.18, 0.45, 0.3);
      stuck = ds > 1.5 && Math.hypot(D.x - px0, D.z - pz0) < dspeed * dt * 0.2 ? stuck + dt : 0;
    } else { phys.moveActor(D, 0, 0, dt, 0.18, 0.45, 0.3); want = Math.atan2(P.x - D.x, P.z - D.z); }
  }
  if (petT > 0) phys.moveActor(D, 0, 0, dt, 0.18, 0.45, 0.3);
  D.face = lerpAngle(D.face, want, 1 - Math.exp(-10 * dt));
  dog.group.position.set(D.x, D.y, D.z);
  dog.group.rotation.y = D.face;
  dog.update(dt, dspeed, petT > 0);
  $('hint').style.display = dp < 2.3 && petT <= 0 ? 'block' : 'none';

  // --- Luces de antorchas ---
  lightT -= dt;
  if (lightT <= 0) {
    lightT = 0.3;
    const c = camera.position;
    torches.sort((a, b) => (a.x - c.x) ** 2 + (a.y - c.y) ** 2 + (a.z - c.z) ** 2 - ((b.x - c.x) ** 2 + (b.y - c.y) ** 2 + (b.z - c.z) ** 2));
    lights.forEach((l, i) => { l.visible = !!torches[i]; if (torches[i]) l.position.set(torches[i].x, torches[i].y, torches[i].z); });
  }
  lights.forEach((l, i) => { l.intensity = torches[i] ? 14 * (0.82 + 0.18 * Math.sin(t * 17 + i * 3) * Math.sin(t * 7.3 + i)) : 0; });
}

function heart() {
  const v = new Vector3(D.x, D.y + 0.7, D.z).project(camera);
  if (v.z > 1) return;
  const e = document.createElement('div');
  e.className = 'heart';
  e.textContent = '❤';
  e.style.left = `${(v.x * 0.5 + 0.5) * innerWidth + (Math.random() - 0.5) * 20}px`;
  e.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
  e.onanimationend = () => e.remove();
  document.body.append(e);
}

// ----------------------------- Interacción ---------------------------------
const ndc = new Vector2(), ray = new Raycaster(), tmp = new Vector3();

function setHover(mesh) {
  if (hovered && hovered !== mesh) hovered.material = hovered.userData.m;
  hovered = mesh;
  if (mesh) mesh.material = delMat;
}

// Punto de anclaje objetivo: el anclaje de una pieza colocada más cercano al
// puntero en pantalla (radio 26 px) o, si no hay ninguno, el vértice de la
// rejilla del suelo bajo el puntero.
function target() {
  let best = null, bd = 26 * 26;
  const w = innerWidth / 2, h = innerHeight / 2;
  for (const { pts } of placed.values()) {
    for (let i = 0; i < pts.length; i += 3) {
      tmp.set(pts[i], pts[i + 1], pts[i + 2]).project(camera);
      if (tmp.z > 1) continue;
      const d = (tmp.x * w + w - px) ** 2 + (-tmp.y * h + h - py) ** 2;
      if (d < bd) { bd = d; best = [pts[i], pts[i + 1], pts[i + 2]]; }
    }
  }
  if (best) return best;
  const o = ray.ray.origin, d = ray.ray.direction, t = -o.y / d.y;
  if (!(t > 0)) return null;
  const sn = (v) => Math.round(v / st.snap) * st.snap;
  return [sn(o.x + d.x * t) + 0, 0, sn(o.z + d.z * t) + 0];
}

// Recalcula la vista previa (o el resaltado en modo eliminar).
function refresh() {
  dirty = false;
  if (!havePointer) { ghost.visible = marker.visible = false; setHover(null); return; }
  ray.setFromCamera(ndc, camera);
  if (st.mode === 'delete') {
    ghost.visible = marker.visible = false;
    setHover(ray.intersectObjects(pieces.children, false)[0]?.object ?? null);
    return;
  }
  setHover(null);
  const t = target();
  cur = null;
  if (t) {
    cur = place(PIECES[st.sel], st.rot, st.anchor, t);
    curValid = inBounds(cur) && !placed.has(keyOf(cur));
    ghost.position.set(cur.x, cur.y, cur.z);
    ghost.rotation.y = cur.rot * Math.PI / 4;
    ghostMat.color.set(curValid ? '#3fc060' : '#e04848');
    marker.position.set(...t);
    marker.scale.setScalar(Math.max(0.5, camera.position.distanceTo(marker.position) * 0.02));
  }
  ghost.visible = marker.visible = !!cur;
}

function act() {
  if (st.mode === 'delete') {
    if (!hovered) return;
    for (const [k, e] of placed) {
      if (e.mesh !== hovered) continue;
      placed.delete(k);
      phys.removeColliders(e);
      if (e.torch) torches.splice(torches.indexOf(e.torch), 1);
    }
    pieces.remove(hovered);
    hovered = null;
  } else {
    if (!cur || !curValid) return;
    const def = PIECES[cur.id], g = geometryOf(cur.id);
    const m = new Mesh(g, matFor(g));
    m.userData.m = m.material;
    m.position.set(cur.x, cur.y, cur.z);
    m.rotation.y = cur.rot * Math.PI / 4;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    pieces.add(m);
    const e = { mesh: m, pts: def.anchors.flatMap((a) => worldPoint(cur, a)), torch: null };
    if (def.light) { const [x, y, z] = worldPoint(cur, def.light); e.torch = { x, y, z }; torches.push(e.torch); lightT = 0; }
    phys.addColliders(e, cur, def);
    placed.set(keyOf(cur), e);
  }
  dirty = true;
}

function point(e) {
  px = e.clientX; py = e.clientY;
  ndc.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
  havePointer = true;
}
// Arrastrar (>5 px) gira la vista; un clic corto coloca / elimina.
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, b: e.button, drag: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (down && (down.drag || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5)) {
    if (down.drag) {
      cam.yaw -= (e.movementX || 0) * 0.005;
      cam.pitch = Math.max(cam.first ? -1.4 : -0.1, Math.min(1.4, cam.pitch + (e.movementY || 0) * 0.005));
    }
    down.drag = true;
  }
  point(e);
  dirty = true;
});
canvas.addEventListener('pointerup', (e) => {
  if (down && down.b === 0 && !down.drag) { point(e); updateCamera(); refresh(); act(); }
  down = null;
});
canvas.addEventListener('pointerleave', () => { if (!down) { havePointer = false; dirty = true; } });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --------------------------------- Menú ------------------------------------
const $ = (id) => document.getElementById(id);
const pieceBtns = {};
const list = $('pieces');
const ids = MENU.flatMap(([, items]) => items.map((i) => i[0]));
const thumbs = makeThumbs(ids, geometryOf, matFor);
for (const [name, items] of MENU) {
  for (const [id, label] of items) {
    const b = document.createElement('button');
    b.title = `${name} ${label}`;
    b.innerHTML = `<img src="${thumbs[id]}" alt=""><b>${name}</b><small>${label}</small>`;
    b.onclick = () => select(id);
    pieceBtns[id] = b;
    list.append(b);
  }
}

function syncUI() {
  for (const id in pieceBtns) pieceBtns[id].classList.toggle('on', st.mode === 'build' && id === st.sel);
  $('m-build').classList.toggle('on', st.mode === 'build');
  $('m-del').classList.toggle('on', st.mode === 'delete');
  $('s1').classList.toggle('on', st.snap === 1);
  $('s05').classList.toggle('on', st.snap === 0.5);
  $('anc').textContent = `${st.anchor + 1} / ${PIECES[st.sel].anchors.length}`;
  $('ang').textContent = `${st.rot * 45}°`;
  $('view').textContent = cam.first ? '1ª persona' : '3ª persona';
  gridHalf.visible = st.snap === 0.5;
  dirty = true;
}

function select(id) { st.sel = id; st.anchor = 0; st.mode = 'build'; ghost.geometry = geometryOf(id); syncUI(); }
function setMode(m) { st.mode = m; syncUI(); }
function setSnap(s) { st.snap = s; syncUI(); }
function rotate(d) { st.rot = (st.rot + d + STEPS) % STEPS; syncUI(); }
function anchor(d) { const n = PIECES[st.sel].anchors.length; st.anchor = (st.anchor + d + n) % n; syncUI(); }
function zoom(f) { cam.dist = Math.max(2, Math.min(30, cam.dist * f)); dirty = true; }
function toggleView() { cam.first = !cam.first; cam.pitch = cam.first ? 0 : 0.3; syncUI(); }
function pet() {
  if (petT > 0 || Math.hypot(P.x - D.x, P.z - D.z) > 2.3) return;
  petT = 1.8; heartT = 0;
  P.face = Math.atan2(D.x - P.x, D.z - P.z);
}

$('m-build').onclick = () => setMode('build');
$('m-del').onclick = () => setMode('delete');
$('s1').onclick = () => setSnap(1);
$('s05').onclick = () => setSnap(0.5);
$('rot').onclick = () => rotate(1);
$('ancp').onclick = () => anchor(-1);
$('ancn').onclick = () => anchor(1);
$('zin').onclick = () => zoom(0.8);
$('zout').onclick = () => zoom(1.25);
$('view').onclick = toggleView;

// Rueda: gira la pieza en 8 pasos de 45° (con Ctrl, o en modo eliminar, hace zoom).
let wheelAcc = 0;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (st.mode !== 'build' || e.ctrlKey) { zoom(Math.exp(e.deltaY * 0.0015)); return; }
  wheelAcc += e.deltaY * (e.deltaMode === 1 ? 33 : 1);
  if (Math.abs(wheelAcc) >= 50) { rotate(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
}, { passive: false });

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  keys[e.code] = true;
  switch (e.code) {
    case 'KeyR': rotate(e.shiftKey ? -1 : 1); break;
    case 'KeyQ': anchor(e.shiftKey ? -1 : 1); break;
    case 'KeyG': setSnap(st.snap === 1 ? 0.5 : 1); break;
    case 'KeyX': case 'Delete': setMode(st.mode === 'delete' ? 'build' : 'delete'); break;
    case 'Escape': setMode('build'); break;
    case 'KeyV': toggleView(); break;
    case 'KeyE': pet(); break;
    case 'Equal': case 'NumpadAdd': zoom(0.8); break;
    case 'Minus': case 'NumpadSubtract': zoom(1.25); break;
    case 'Space': case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': break;
    default: return;
  }
  e.preventDefault();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  dirty = true;
}
addEventListener('resize', resize);

// ------------------------------- Bucle -------------------------------------
let last = performance.now(), sig = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt, now / 1000);
  updateCamera();
  const s = camera.matrixWorld.elements.join();
  if (s !== sig) { sig = s; dirty = true; }
  if (dirty) refresh();
  world.follow(camera.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

syncUI();
resize();
requestAnimationFrame(frame);
