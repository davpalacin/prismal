import {
  BoxGeometry, BufferGeometry, Color, DirectionalLight, DoubleSide, Float32BufferAttribute,
  HemisphereLight, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer, Group,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HALF, MAX_H, MENU, PIECES, STEPS, geometryOf, inBounds, keyOf, place, worldPoint } from './pieces.js';
import { makeThumbs } from './thumbs.js';

// ------------------------------- Escena ------------------------------------
const canvas = document.getElementById('c');
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new Scene();
scene.background = new Color('#9fb7c4');
const camera = new PerspectiveCamera(45, 1, 0.1, 400);
camera.position.set(7, 6, 9);

scene.add(new HemisphereLight('#ffffff', '#8a7a5a', 1.6));
const sun = new DirectionalLight('#fff0d4', 1.9);
sun.position.set(3, 6, 2);
scene.add(sun);

// Un único material para todas las piezas (el color va por vértice).
const woodMat = new MeshLambertMaterial({ vertexColors: true });
const delMat = new MeshLambertMaterial({ color: '#d9453b' });
const ghostMat = new MeshBasicMaterial({ color: '#3fc060', transparent: true, opacity: 0.55, depthWrite: false });

// Terreno: bloque de 5×5 con la cara superior verde y los lados de tierra.
const soil = new MeshLambertMaterial({ color: '#6b4f3a' });
const grass = new MeshLambertMaterial({ color: '#5f9b4a' });
const ground = new Mesh(new BoxGeometry(2 * HALF, 0.3, 2 * HALF), [soil, soil, grass, soil, soil, soil]);
ground.position.y = -0.15;
scene.add(ground);

// Vegetación: grupos de matas (5 hojas triangulares) en un solo InstancedMesh.
{
  const pos = [], nor = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), h = 0.1 + (i % 3) * 0.04;
    const lean = 0.05 + (i % 2) * 0.03;
    pos.push(ca * 0.015 - sa * 0.02, 0, sa * 0.015 + ca * 0.02, ca * 0.015 + sa * 0.02, 0, sa * 0.015 - ca * 0.02,
      ca * (0.015 + lean), h, sa * (0.015 + lean));
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tufts = [];
  for (let c = 0; c < 400; c++) {
    const cx = (rnd() - 0.5) * (2 * HALF - 0.4), cz = (rnd() - 0.5) * (2 * HALF - 0.4);
    for (let k = 0, n = 4 + Math.floor(rnd() * 4); k < n; k++) {
      tufts.push([Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cx + (rnd() - 0.5) * 0.45)),
        Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cz + (rnd() - 0.5) * 0.45)), rnd()]);
    }
  }
  const mesh = new InstancedMesh(g, new MeshLambertMaterial({ side: DoubleSide }), tufts.length);
  const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), col = new Color();
  tufts.forEach(([x, z, r], i) => {
    const sc = 0.8 + r * 1.2;
    m.compose(new Vector3(x, 0, z), q.setFromAxisAngle(up, r * 20), new Vector3(sc, sc, sc));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.setHSL(0.27 + r * 0.05, 0.5, 0.3 + r * 0.14));
  });
  scene.add(mesh);
}

// Rejilla del plano de trabajo: 1 m (clara) y 0,5 m (tenue).
function gridLines(step) {
  const v = [];
  for (let u = 0; u <= 2 * HALF + 1e-6; u += step) {
    v.push(u - HALF, 0, -HALF, u - HALF, 0, HALF, -HALF, 0, u - HALF, HALF, 0, u - HALF);
  }
  return v;
}
const mkGrid = (step, opacity) => {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(gridLines(step), 3));
  const l = new LineSegments(g, new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity, depthWrite: false }));
  scene.add(l);
  return l;
};
const gridMain = mkGrid(1, 0.55), gridHalf = mkGrid(0.5, 0.22);
gridMain.position.y = gridHalf.position.y = 0.004;

// ------------------------------ Estado -------------------------------------
const st = { sel: 'floor1', rot: 0, anchor: 0, snap: 1, mode: 'build' };
const placed = new Map();      // clave geométrica -> { mesh, pts } (pts: anclajes en el mundo)
const pieces = new Group();
scene.add(pieces);
const ghost = new Mesh(geometryOf(st.sel), ghostMat);
ghost.visible = false;
scene.add(ghost);
const marker = new Mesh(new SphereGeometry(0.08, 10, 8), new MeshBasicMaterial({ color: '#ffd23f', depthTest: false }));
marker.renderOrder = 10;
marker.visible = false;
scene.add(marker);
let cur = null, curValid = false, hovered = null, havePointer = false, px = 0, py = 0;

let queued = false;
function invalidate() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; renderer.render(scene, camera); });
}

// ------------------------------ Cámara -------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.5, 0);
controls.enableDamping = false;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 90;
controls.maxPolarAngle = Math.PI * 0.495;
controls.update();
controls.addEventListener('change', () => {
  const t = controls.target, d = new Vector3(
    Math.max(-HALF - 1, Math.min(HALF + 1, t.x)) - t.x, Math.max(0, Math.min(MAX_H, t.y)) - t.y, Math.max(-HALF - 1, Math.min(HALF + 1, t.z)) - t.z);
  if (d.lengthSq()) { t.add(d); camera.position.add(d); }
  refresh();
});

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  invalidate();
}
addEventListener('resize', resize);

// ----------------------------- Interacción ---------------------------------
const ndc = new Vector2(), ray = new Raycaster();

function setHover(mesh) {
  if (hovered && hovered !== mesh) hovered.material = woodMat;
  hovered = mesh;
  if (mesh) mesh.material = delMat;
}

// Punto de anclaje objetivo: el anclaje de una pieza colocada más cercano al
// puntero en pantalla (radio 26 px) o, si no hay ninguno, el vértice de la
// rejilla del suelo bajo el puntero.
const tmp = new Vector3();
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
  if (!havePointer) { ghost.visible = marker.visible = false; setHover(null); invalidate(); return; }
  ray.setFromCamera(ndc, camera);
  if (st.mode === 'delete') {
    ghost.visible = marker.visible = false;
    setHover(ray.intersectObjects(pieces.children, false)[0]?.object ?? null);
  } else {
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
  invalidate();
}

function act() {
  if (st.mode === 'delete') {
    if (!hovered) return;
    for (const [k, e] of placed) if (e.mesh === hovered) placed.delete(k);
    pieces.remove(hovered);
    hovered = null;
  } else {
    if (!cur || !curValid) return;
    const m = new Mesh(geometryOf(cur.id), woodMat);
    m.position.set(cur.x, cur.y, cur.z);
    m.rotation.y = cur.rot * Math.PI / 4;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    pieces.add(m);
    placed.set(keyOf(cur), { mesh: m, pts: PIECES[cur.id].anchors.flatMap((a) => worldPoint(cur, a)) });
  }
  refresh();
}

function point(e) {
  px = e.clientX; py = e.clientY;
  ndc.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
  havePointer = true;
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, b: e.button }; });
canvas.addEventListener('pointermove', (e) => {
  point(e);
  refresh();
});
canvas.addEventListener('pointerup', (e) => {
  if (down && down.b === 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
    point(e);
    refresh();
    act();
  }
  down = null;
});
canvas.addEventListener('pointerleave', () => { havePointer = false; refresh(); });

// --------------------------------- Menú ------------------------------------
const $ = (id) => document.getElementById(id);
const pieceBtns = {};
const list = $('pieces');
const ids = MENU.flatMap(([, items]) => items.map((i) => i[0]));
const thumbs = makeThumbs(ids, geometryOf, woodMat);
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
  gridHalf.visible = st.snap === 0.5;
}

function select(id) { st.sel = id; st.anchor = 0; st.mode = 'build'; ghost.geometry = geometryOf(id); syncUI(); refresh(); }
function setMode(m) { st.mode = m; syncUI(); refresh(); }
function setSnap(s) { st.snap = s; syncUI(); refresh(); }
function rotate(d) { st.rot = (st.rot + d + STEPS) % STEPS; syncUI(); refresh(); }
function anchor(d) {
  const n = PIECES[st.sel].anchors.length;
  st.anchor = (st.anchor + d + n) % n;
  syncUI(); refresh();
}
function zoom(f) {
  camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);
  controls.update();
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

// Rueda: gira la pieza en 8 pasos de 45° (con Ctrl, o en modo eliminar, hace zoom).
let wheelAcc = 0;
addEventListener('wheel', (e) => {
  if (e.target !== canvas || st.mode !== 'build' || e.ctrlKey) return;
  e.preventDefault();
  e.stopPropagation();
  wheelAcc += e.deltaY * (e.deltaMode === 1 ? 33 : 1);
  if (Math.abs(wheelAcc) >= 50) { rotate(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
}, { capture: true, passive: false });

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.code) {
    case 'KeyR': rotate(e.shiftKey ? -1 : 1); break;
    case 'KeyQ': anchor(e.shiftKey ? -1 : 1); break;
    case 'KeyG': setSnap(st.snap === 1 ? 0.5 : 1); break;
    case 'KeyX': case 'Delete': setMode(st.mode === 'delete' ? 'build' : 'delete'); break;
    case 'Escape': setMode('build'); break;
    case 'Equal': case 'NumpadAdd': zoom(0.8); break;
    case 'Minus': case 'NumpadSubtract': zoom(1.25); break;
    default: return;
  }
  e.preventDefault();
});

syncUI();
resize();
