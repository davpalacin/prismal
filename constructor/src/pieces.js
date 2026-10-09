import { Builder } from './geom.js';

// ---------------------------------------------------------------------------
// Convenciones (metros, Y hacia arriba)
//  - Cada pieza se define en un marco local con el origen en un VÉRTICE de la
//    cuadrícula y se extiende hacia +x, +y, +z según `size` (su "luz" nominal).
//  - Los grosores se centran sobre las líneas de la cuadrícula, de modo que
//    paredes, vigas, columnas, tablones y diagonales se unen por sus ejes.
//  - Los pisos tienen su cara inferior en el nivel y 10 cm de espesor; las
//    paredes, columnas y tejados arrancan en el nivel (empotrando 10 cm).
//  - Todos los extremos de las piezas caen en vértices de la cuadrícula de
//    0,5 m: la longitud nominal es 1 o 0,5 y las alturas de tejado también.
// ---------------------------------------------------------------------------

export const HALF = 25;    // el terreno (50 × 50 m) es [-25, 25] en x y z
export const MAX_H = 10;   // altura máxima de construcción

const WOOD = ['#8d5d34', '#7d5130', '#966a3f'];
const DARK = '#563719';
const SHINGLE = ['#6a4a36', '#7b563e', '#5b3f2e'];
const STEP = 0.25; // ancho de tabla/tablilla

const floor = (L) => (b) => {
  b.box(0, 0, 0, L, 0.07, L, DARK);
  for (let i = 0; i < L / STEP; i++) b.box(i * STEP + 0.006, 0, 0.006, (i + 1) * STEP - 0.006, 0.1, L - 0.006, WOOD[i % 3]);
};

const wall = (W) => (b) => {
  b.box(0, 0, -0.03, W, 1, 0.03, DARK);
  for (let i = 0; i < W / STEP; i++) {
    const t = i % 2 ? 0.045 : 0.05;
    b.box(i * STEP + 0.004, 0, -t, (i + 1) * STEP - 0.004, 1, t, WOOD[i % 3]);
  }
  b.box(0, 0.14, -0.058, W, 0.26, 0.058, DARK);
  b.box(0, 0.74, -0.058, W, 0.86, 0.058, DARK);
};

const column = (L) => (b) => b.box(-0.06, 0, -0.06, 0.06, L, 0.06, WOOD[1]);
const beam = (L) => (b) => b.box(0, -0.06, -0.06, L, 0.06, 0.06, WOOD[0]);
const plankH = (L) => (b) => b.box(0, -0.1, -0.02, L, 0.1, 0.02, WOOD[2]);
const plankV = (L) => (b) => b.box(-0.1, 0, -0.02, 0.1, L, 0.02, WOOD[2]);

// Refuerzo: varilla de (0,0) a (L,L) en el plano x-y.
const diag = (L) => (b) => {
  const r = Math.SQRT1_2, len = L * Math.SQRT2;
  b.obox([0.05 * r, -0.05 * r, -0.04], [r * len, r * len, 0], [-r * 0.1, r * 0.1, 0], [0, 0, 0.08], WOOD[1]);
};

// Tejado de una vertiente: alero en x=0,y=0; cumbrera en x=RUN, y=rise.
// Tamaño dado por la proyección horizontal (RUN = 1 m): la altura es
// RUN·tan(ángulo), redondeada a la cuadrícula. 26° ≈ atan(0,5)=26,57° → 0,5 m;
// 45° → 1 m.
const RUN = 1;
const roof = (rise, Wd) => (b) => {
  const Ls = Math.hypot(RUN, rise);
  const s = [RUN / Ls, rise / Ls, 0], n = [-rise / Ls, RUN / Ls, 0];
  const at = (u, v, z) => [s[0] * u + n[0] * v, s[1] * u + n[1] * v, z];
  b.obox(at(0, -0.085, 0), [s[0] * Ls, s[1] * Ls, 0], [n[0] * 0.05, n[1] * 0.05, 0], [0, 0, Wd], DARK);
  const rows = Math.round(Ls / 0.22), cols = Math.round(Wd / STEP), du = Ls / rows;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      b.obox(at(i * du, -0.045 + (i % 2) * 0.012, j * STEP + 0.006),
        [s[0] * (du - 0.006), s[1] * (du - 0.006), 0], [n[0] * 0.05, n[1] * 0.05, 0], [0, 0, STEP - 0.012],
        SHINGLE[(i + 2 * j) % 3]);
    }
  }
};

export const PIECES = {};
const corners = ([x, y, z]) => [0, x].flatMap((a) => [0, y].flatMap((c) => [0, z].map((d) => [a, c, d])));

// Puntos de anclaje: todos los puntos de la rejilla de 0,5 m dentro de la
// caja nominal de la pieza (esquinas, bordes, caras), ordenados de abajo arriba.
function grid(size) {
  const ax = (n) => { const r = []; for (let v = 0; v <= n + 1e-9; v += 0.5) r.push(v); return r; };
  const pts = [];
  for (const y of ax(size[1])) for (const x of ax(size[0])) for (const z of ax(size[2])) pts.push([x, y, z]);
  return pts;
}

function add(id, label, size, build, keys = corners(size), anchors = grid(size)) {
  PIECES[id] = { id, label, size, build, keys, anchors };
}
// Tejado: los cuatro bordes paralelos al ancho (alero, cumbrera y sus bases).
const roofAnchors = (rise, W) => [[0, 0], [RUN, 0], [0, rise], [RUN, rise]]
  .flatMap(([x, y]) => grid([0, 0, W]).map(([, , z]) => [x, y, z]));
// Diagonal: las cuatro esquinas del módulo y el centro del refuerzo.
const diagAnchors = (L) => [[0, 0, 0], [L, 0, 0], [0, L, 0], [L, L, 0], [L / 2, L / 2, 0]];

// Filas del menú: [nombre, [[id, etiqueta, size, build, keys?], ...]]
const rise26 = 0.5, rise45 = 1;
export const MENU = [
  ['Suelo', [['floor1', '1×1', [1, 0, 1], floor(1)], ['floor05', '0,5×0,5', [0.5, 0, 0.5], floor(0.5)]]],
  ['Pared', [['wall1', '1×1', [1, 1, 0], wall(1)], ['wall05', '0,5×1', [0.5, 1, 0], wall(0.5)]]],
  ['Columna', [['col1', '1 m', [0, 1, 0], column(1)], ['col05', '0,5 m', [0, 0.5, 0], column(0.5)]]],
  ['Viga', [['beam1', '1 m', [1, 0, 0], beam(1)], ['beam05', '0,5 m', [0.5, 0, 0], beam(0.5)]]],
  ['Tablón horiz.', [['ph1', '1 m', [1, 0, 0], plankH(1)], ['ph05', '0,5 m', [0.5, 0, 0], plankH(0.5)]]],
  ['Tablón vert.', [['pv1', '1 m', [0, 1, 0], plankV(1)], ['pv05', '0,5 m', [0, 0.5, 0], plankV(0.5)]]],
  ['Diagonal', [['dg1', '1 m', [1, 1, 0], diag(1), [[0, 0, 0], [1, 1, 0]]],
                ['dg05', '0,5 m', [0.5, 0.5, 0], diag(0.5), [[0, 0, 0], [0.5, 0.5, 0]]]]],
  ['Tejado 26°', [['r26a', '1 m', [RUN, rise26, 1], roof(rise26, 1), [[0, 0, 0], [0, 0, 1], [RUN, rise26, 0], [RUN, rise26, 1]]],
                  ['r26b', '0,5 m', [RUN, rise26, 0.5], roof(rise26, 0.5), [[0, 0, 0], [0, 0, 0.5], [RUN, rise26, 0], [RUN, rise26, 0.5]]]]],
  ['Tejado 45°', [['r45a', '1 m', [RUN, rise45, 1], roof(rise45, 1), [[0, 0, 0], [0, 0, 1], [RUN, rise45, 0], [RUN, rise45, 1]]],
                  ['r45b', '0,5 m', [RUN, rise45, 0.5], roof(rise45, 0.5), [[0, 0, 0], [0, 0, 0.5], [RUN, rise45, 0], [RUN, rise45, 0.5]]]]],
];
for (const [name, items] of MENU) for (const [id, label, size, build, keys] of items) add(id, name + ' ' + label, size, build, keys);
for (const L of [1, 0.5]) PIECES[L === 1 ? 'dg1' : 'dg05'].anchors = diagAnchors(L);
for (const [id, rise, W] of [['r26a', rise26, 1], ['r26b', rise26, 0.5], ['r45a', rise45, 1], ['r45b', rise45, 0.5]]) PIECES[id].anchors = roofAnchors(rise, W);

const geoms = {};
export function geometryOf(id) {
  if (!geoms[id]) { const b = new Builder(); PIECES[id].build(b); geoms[id] = b.geometry(); }
  return geoms[id];
}

// ------------------------------ Colocación ---------------------------------
export const STEPS = 8;    // giros posibles: 8 × 45°
// Giro de k·45° alrededor de Y (igual que Object3D.rotation.y).
export const rotXZ = (x, z, k) => {
  const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, -x * s + z * c];
};

// Coloca la pieza de modo que su anclaje `ai` coincida con el punto `t`.
export function place(p, rot, ai, t) {
  const a = p.anchors[ai], [rx, rz] = rotXZ(a[0], a[2], rot);
  return { id: p.id, rot, x: t[0] - rx, y: t[1] - a[1], z: t[2] - rz };
}

export const worldPoint = (pl, [x, y, z]) => {
  const [rx, rz] = rotXZ(x, z, pl.rot);
  return [pl.x + rx, pl.y + y, pl.z + rz];
};
const world = worldPoint;

// Válida si cabe en el terreno y bajo la altura máxima.
export function inBounds(pl) {
  const p = PIECES[pl.id], e = 1e-6;
  return p.keys.concat(corners(p.size)).every((k) => {
    const [x, y, z] = world(pl, k);
    return Math.abs(x) <= HALF + e && Math.abs(z) <= HALF + e && y >= -e && y <= MAX_H + e;
  });
}

// Identidad geométrica: mismo tipo y mismos puntos definitorios en el mundo
// (así un giro de 180° de una pieza simétrica cuenta como duplicado).
export function keyOf(pl) {
  const pts = PIECES[pl.id].keys.map((k) => world(pl, k).map((v) => Math.round(v * 100) + 0).join(','));
  return pl.id + '|' + pts.sort().join(';');
}
