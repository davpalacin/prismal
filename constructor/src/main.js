import {
  BoxGeometry, BufferGeometry, Color, DirectionalLight, DoubleSide, Float32BufferAttribute,
  HemisphereLight, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, PerspectiveCamera, Quaternion, Raycaster, Scene, Vector2, Vector3, WebGLRenderer, Group,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HALF, MAX_H, MENU, PIECES, geometryOf, inBounds, keyOf, place } from './pieces.js';

// ------------------------------- Escena ------------------------------------
const canvas = document.getElementById('c');
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new Scene();
scene.background = new Color('#9fb7c4');
const camera = new PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(4.2, 3.6, 5);

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
const ground = new Mesh(new BoxGeometry(5, 0.3, 5), [soil, soil, grass, soil, soil, soil]);
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
  for (let c = 0; c < 16; c++) {
    const cx = (rnd() - 0.5) * 4.6, cz = (rnd() - 0.5) * 4.6;
    for (let k = 0, n = 4 + Math.floor(rnd() * 4); k < n; k++) {
      tufts.push([Math.max(-2.45, Math.min(2.45, cx + (rnd() - 0.5) * 0.45)),
        Math.max(-2.45, Math.min(2.45, cz + (rnd() - 0.5) * 0.45)), rnd()]);
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
  for (let u = 0; u <= 5 + 1e-6; u += step) {
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

// ------------------------------ Estado -------------------------------------
const st = { sel: 'floor1', rot: 0, snap: 1, lift: 0, mode: 'build' };
const placed = new Map();      // clave geométrica -> Mesh
const pieces = new Group();
scene.add(pieces);
const ghost = new Mesh(geometryOf(st.sel), ghostMat);
ghost.visible = false;
scene.add(ghost);
let cur = null, curValid = false, hovered = null, havePointer = false;

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
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI * 0.495;
controls.update();
controls.addEventListener('change', () => {
  const t = controls.target, d = new Vector3(
    Math.max(-3, Math.min(3, t.x)) - t.x, Math.max(0, Math.min(MAX_H, t.y)) - t.y, Math.max(-3, Math.min(3, t.z)) - t.z);
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

// Recalcula la vista previa (o el resaltado en modo eliminar).
function refresh() {
  if (!havePointer) { ghost.visible = false; setHover(null); invalidate(); return; }
  ray.setFromCamera(ndc, camera);
  if (st.mode === 'delete') {
    ghost.visible = false;
    setHover(ray.intersectObjects(pieces.children, false)[0]?.object ?? null);
  } else {
    setHover(null);
    const o = ray.ray.origin, d = ray.ray.direction, t = (st.lift - o.y) / d.y;   // plano de trabajo y = lift
    cur = null;
    if (t > 0) {
      cur = place(PIECES[st.sel], st.rot, o.x + d.x * t, o.z + d.z * t, st.lift, st.snap);
      curValid = inBounds(cur) && !placed.has(keyOf(cur));
      ghost.position.set(cur.x, cur.y, cur.z);
      ghost.rotation.y = cur.rot * Math.PI / 2;
      ghostMat.color.set(curValid ? '#3fc060' : '#e04848');
    }
    ghost.visible = !!cur;
  }
  invalidate();
}

function act() {
  if (st.mode === 'delete') {
    if (!hovered) return;
    for (const [k, m] of placed) if (m === hovered) placed.delete(k);
    pieces.remove(hovered);
    hovered = null;
  } else {
    if (!cur || !curValid) return;
    const m = new Mesh(geometryOf(cur.id), woodMat);
    m.position.set(cur.x, cur.y, cur.z);
    m.rotation.y = cur.rot * Math.PI / 2;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    pieces.add(m);
    placed.set(keyOf(cur), m);
  }
  refresh();
}

let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, b: e.button }; });
canvas.addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  havePointer = true;
  refresh();
});
canvas.addEventListener('pointerup', (e) => {
  if (down && down.b === 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    havePointer = true;
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
for (const [name, items] of MENU) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<span>${name}</span>`;
  for (const [id, label] of items) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => select(id);
    pieceBtns[id] = b;
    row.append(b);
  }
  list.append(row);
}

function syncUI() {
  for (const id in pieceBtns) pieceBtns[id].classList.toggle('on', st.mode === 'build' && id === st.sel);
  $('m-build').classList.toggle('on', st.mode === 'build');
  $('m-del').classList.toggle('on', st.mode === 'delete');
  $('s1').classList.toggle('on', st.snap === 1);
  $('s05').classList.toggle('on', st.snap === 0.5);
  $('lvl').textContent = st.lift.toString().replace('.', ',') + ' m';
  gridHalf.visible = st.snap === 0.5;
  gridMain.position.y = gridHalf.position.y = st.lift + 0.004;
}

function select(id) { st.sel = id; st.mode = 'build'; ghost.geometry = geometryOf(id); syncUI(); refresh(); }
function setMode(m) { st.mode = m; syncUI(); refresh(); }
function setSnap(s) { st.snap = s; st.lift = Math.round(st.lift / s) * s; syncUI(); refresh(); }
function rotate(d) { st.rot = (st.rot + d + 4) % 4; refresh(); }
function level(d) {
  st.lift = Math.max(0, Math.min(MAX_H - PIECES[st.sel].size[1], st.lift + d * st.snap));
  syncUI(); refresh();
}

$('m-build').onclick = () => setMode('build');
$('m-del').onclick = () => setMode('delete');
$('s1').onclick = () => setSnap(1);
$('s05').onclick = () => setSnap(0.5);
$('rot').onclick = () => rotate(1);
$('up').onclick = () => level(1);
$('down').onclick = () => level(-1);

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.code) {
    case 'KeyR': rotate(e.shiftKey ? -1 : 1); break;
    case 'KeyG': setSnap(st.snap === 1 ? 0.5 : 1); break;
    case 'KeyQ': case 'PageDown': level(-1); break;
    case 'KeyE': case 'PageUp': level(1); break;
    case 'KeyX': case 'Delete': setMode(st.mode === 'delete' ? 'build' : 'delete'); break;
    case 'Escape': setMode('build'); break;
    default: return;
  }
  e.preventDefault();
});

syncUI();
resize();
