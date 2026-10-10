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

// Tintes que multiplican la textura de madera / tejas (ambientCG, CC0).
const WOOD = ['#ffffff', '#d9bf9f', '#ecd5b6'];
const DARK = '#6b5039';
const IRON = '#34373c';
const SHINGLE = ['#a85a3a', '#8f4a2f', '#bd6c42'];
const STEP = 0.25; // ancho de tabla/tablilla

const floor = (L) => (b) => {
  b.grain = [0, 0, 1];
  b.box(0, 0, 0, L, 0.07, L, DARK);
  for (let i = 0; i < L / STEP; i++) b.box(i * STEP + 0.006, 0, 0.006, (i + 1) * STEP - 0.006, 0.1, L - 0.006, WOOD[i % 3]);
};

const nail = (b, x, y, z) => b.box(x - 0.012, y - 0.012, z - 0.006, x + 0.012, y + 0.012, z + 0.006, IRON);

const wall = (W) => (b) => {
  b.grain = [0, 1, 0];
  b.box(0, 0, -0.03, W, 1, 0.03, DARK);
  for (let i = 0; i < W / STEP; i++) {
    const t = i % 2 ? 0.045 : 0.05;
    b.box(i * STEP + 0.004, 0, -t, (i + 1) * STEP - 0.004, 1, t, WOOD[i % 3]);
  }
  b.grain = [1, 0, 0];
  b.box(0, 0.14, -0.058, W, 0.26, 0.058, DARK);
  b.box(0, 0.74, -0.058, W, 0.86, 0.058, DARK);
  for (let i = 0; i < W / STEP; i++) for (const y of [0.2, 0.8]) for (const s of [-1, 1]) nail(b, i * STEP + STEP / 2, y, s * 0.058);
};

const column = (L) => (b) => { b.grain = [0, 1, 0]; b.box(-0.06, 0, -0.06, 0.06, L, 0.06, WOOD[1]); b.box(-0.075, L - 0.04, -0.075, 0.075, L, 0.075, DARK); };
const beam = (L) => (b) => b.box(0, -0.06, -0.06, L, 0.06, 0.06, WOOD[0]);
const plankH = (L) => (b) => b.box(0, -0.1, -0.02, L, 0.1, 0.02, WOOD[2]);
const plankV = (L) => (b) => { b.grain = [0, 1, 0]; b.box(-0.1, 0, -0.02, 0.1, L, 0.02, WOOD[2]); };

// Refuerzo: varilla de (0,0) a (L,L) en el plano x-y.
const diag = (L) => (b) => {
  const r = Math.SQRT1_2, len = L * Math.SQRT2;
  b.grain = [r, r, 0];
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
  b.layer = 3;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      b.obox(at(i * du, -0.045 + (i % 2) * 0.012, j * STEP + 0.006),
        [s[0] * (du - 0.006), s[1] * (du - 0.006), 0], [n[0] * 0.05, n[1] * 0.05, 0], [0, 0, STEP - 0.012],
        SHINGLE[(i + 2 * j) % 3]);
    }
  }
  b.layer = 0;
};


// Pared con el borde superior cortado en diagonal (pendiente k = tan del tejado).
// Altura total 1 m: 1 − k·W en x=0 y 1 m en x=W; la diagonal coincide con la
// línea del tejado (alero en la esquina baja, cumbrera en la alta).
const gable = (k, W) => (b) => {
  b.grain = [0, 1, 0];
  const H = (x) => 1 - k * W + k * x - 0.04;
  const poly = (x0, x1, t) => [[x0, 0, t], [x1, 0, t], [x1, H(x1), t], [x0, H(x0), t]];
  b.prism(poly(0, W, 0.03), [0, 0, 1], 0.06, DARK);
  for (let i = 0; i < W / STEP; i++) {
    const t = i % 2 ? 0.045 : 0.05;
    b.prism(poly(i * STEP + 0.004, (i + 1) * STEP - 0.004, t), [0, 0, 1], 2 * t, WOOD[i % 3]);
  }
  b.grain = [1, 0, 0];
  b.box(0, 0.14, -0.058, W, 0.26, 0.058, DARK);
  for (let i = 0; i < W / STEP; i++) for (const s of [-1, 1]) nail(b, i * STEP + STEP / 2, 0.2, s * 0.058);
};

// Esquinas de tejado de 1 × 1 m con los aleros en x=0 y z=0 (misma pendiente y
// planos que el tejado normal, así las aristas inclinadas encajan con él).
//  - exterior (cumbrera diagonal): altura = r·mín(x,z), vértice alto en (1,r,1)
//  - interior (valle diagonal):    altura = r·máx(x,z)
const UP = [0, 1, 0];
const cornerRoof = (r, outer) => (b) => {
  const N = 5, g = 0.006, sh = -0.025, h = (v) => r * v;
  const tri = outer
    ? [[[0, sh, 0], [0, sh, 1], [1, r + sh, 1]], [[0, sh, 0], [1, sh, 0], [1, r + sh, 1]]]
    : [[[0, sh, 0], [1, r + sh, 0], [1, r + sh, 1]], [[0, sh, 0], [0, r + sh, 1], [1, r + sh, 1]]];
  tri.forEach((t) => b.prism(t, UP, 0.04, DARK));
  b.layer = 3;
  for (let i = 0; i < N; i++) {
    const a = i / N + g, c = (i + 1) / N - g;
    const rows = outer
      ? [[[a, h(a), a], [a, h(a), 1], [c, h(c), 1], [c, h(c), c]], [[a, h(a), a], [1, h(a), a], [1, h(c), c], [c, h(c), c]]]
      : [[[a, h(a), 0], [a, h(a), a], [c, h(c), c], [c, h(c), 0]], [[0, h(a), a], [a, h(a), a], [c, h(c), c], [0, h(c), c]]];
    rows.forEach((p, j) => b.prism(p, UP, 0.05, SHINGLE[(i + j) % 3]));
  }
  b.layer = 0;
  if (outer) b.obox([0.028, 0, -0.028], [1, r, 1], [-0.057, 0, 0.057], [0, 0.045, 0], DARK);
};

// Puerta de 1 × 1 m: el marco es la pieza y la hoja es un objeto aparte que
// gira sobre la bisagra (origen en x=0,08) al abrir y cerrar.
const doorFrame = (b) => {
  b.grain = [0, 1, 0];
  b.box(0, 0, -0.07, 0.08, 1, 0.07, WOOD[1]);
  b.box(0.92, 0, -0.07, 1, 1, 0.07, WOOD[1]);
  b.grain = [1, 0, 0];
  b.box(0, 0.93, -0.07, 1, 1, 0.07, WOOD[0]);
  for (const y of [0.2, 0.7]) b.box(0.07, y, -0.085, 0.12, y + 0.07, 0.085, IRON);          // goznes
};
const doorLeaf = (b) => {
  b.grain = [0, 1, 0];
  const w = 0.84;
  for (let i = 0; i < 3; i++) b.box((i * w) / 3 + 0.004, 0, -0.025, ((i + 1) * w) / 3 - 0.004, 0.93, 0.025, WOOD[(i + 1) % 3]);
  b.grain = [1, 0, 0];
  for (const y of [0.16, 0.7]) b.box(0, y, -0.032, w, y + 0.08, 0.032, IRON);             // herrajes
  for (const s of [-1, 1]) {                                                              // manilla
    b.box(0.7, 0.45, s * 0.032, 0.78, 0.5, s * 0.058, IRON);
    b.box(0.7, 0.45, s * 0.058, 0.725, 0.55, s * 0.085, IRON);
  }
};

// Pared de vidrio de 0,5 × 1 m con marco de madera.
const glass = (b) => {
  b.box(0, 0, -0.05, 0.05, 1, 0.05, WOOD[1]);
  b.box(0.45, 0, -0.05, 0.5, 1, 0.05, WOOD[1]);
  b.box(0.05, 0, -0.05, 0.45, 0.06, 0.05, WOOD[0]);
  b.box(0.05, 0.94, -0.05, 0.45, 1, 0.05, WOOD[0]);
  b.layer = 1;
  b.box(0.05, 0.06, -0.012, 0.45, 0.94, 0.012, '#ffffff');
  b.layer = 0;
};

// Antorcha: palo con la cabeza de trapo y una llama (capa 2, sin sombreado).
const torch = (b) => {
  b.grain = [0, 1, 0];
  b.box(-0.025, 0, -0.025, 0.025, 0.55, 0.025, WOOD[1]);
  b.box(-0.05, 0.5, -0.05, 0.05, 0.62, 0.05, DARK);
  b.box(-0.055, 0.46, -0.055, 0.055, 0.49, 0.055, IRON);
  b.layer = 2;
  const pyr = (h, w, c) => b.pyramid([[-w, 0.62, -w], [w, 0.62, -w], [w, 0.62, w], [-w, 0.62, w]], [0, 0.62 + h, 0], c);
  pyr(0.27, 0.07, '#ff7a1a');
  pyr(0.17, 0.04, '#ffd45a');
  b.layer = 0;
};

// Altura de la superficie caminable de piezas en rampa (coordenadas locales).
export function rampHeight(r, lx, lz) {
  const e = 1e-6;
  if (r.kind === 'roof') return lx >= -e && lx <= RUN + e && lz >= -e && lz <= r.w + e ? (r.rise / RUN) * lx : null;
  if (lx < -e || lx > 1 + e || lz < -e || lz > 1 + e) return null;
  return r.kind === 'hip' ? r.rise * Math.min(lx, lz) : r.rise * Math.max(lx, lz);
}

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

function add(id, label, size, build, o = {}) {
  PIECES[id] = { id, label, size, build, keys: o.keys || corners(size), anchors: o.anchors || grid(size),
    solid: o.solid || [], ramp: o.ramp || null, light: o.light || null, leaf: o.leaf || null, door: o.door || null };
}
// Tejado: los cuatro bordes paralelos al ancho (alero, cumbrera y sus bases).
const roofAnchors = (rise, W) => [[0, 0], [RUN, 0], [0, rise], [RUN, rise]]
  .flatMap(([x, y]) => grid([0, 0, W]).map(([, , z]) => [x, y, z]));
const roofKeys = (rise, W) => [[0, 0, 0], [0, 0, W], [RUN, rise, 0], [RUN, rise, W]];
// Pared con corte diagonal: bordes de la silueta.
const gableAnchors = (k, W) => {
  const h0 = 1 - k * W, pts = [];
  for (let x = 0; x <= W + 1e-9; x += 0.5) pts.push([x, 0, 0]);
  for (let y = 0.5; y < h0 - 1e-9; y += 0.5) pts.push([0, y, 0]);
  for (let y = 0.5; y < 1 - 1e-9; y += 0.5) pts.push([W, y, 0]);
  return pts.concat([[0, h0, 0], [W, 1, 0], [W / 2, h0 + (k * W) / 2, 0]]);
};
const cornerAnchors = (r, outer) => grid([1, 0, 1]).concat(outer
  ? [[1, r, 1], [0.5, r / 2, 1], [1, r / 2, 0.5], [0.5, r / 2, 0.5]]
  : [[1, r, 0], [0, r, 1], [1, r, 1], [1, r, 0.5], [0.5, r, 1]]);
const cornerKeys = (r, outer) => (outer ? [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, r, 1]] : [[0, 0, 0], [1, r, 0], [0, r, 1], [1, r, 1]]);

// Cajas macizas locales [x0,y0,z0,x1,y1,z1] para colisión al caminar.
const slab = (W, H, T = 0.05) => [[0, 0, -T, W, H, T]];

// Filas del menú: [nombre, [[id, etiqueta, size, build, opciones], ...]]
const rise26 = 0.5, rise45 = 1;
const roofItem = (id, label, rise, W) => [id, label, [RUN, rise, W], roof(rise, W),
  { keys: roofKeys(rise, W), anchors: roofAnchors(rise, W), ramp: { kind: 'roof', rise, w: W } }];
const gableItem = (id, label, k, W) => [id, label, [W, 1, 0], gable(k, W),
  { keys: [[0, 0, 0], [W, 0, 0], [W, 1, 0], [0, 1 - k * W, 0]], anchors: gableAnchors(k, W), solid: slab(W, Math.max(0.06, 1 - k * W)) }];
const cornerItem = (id, label, r, outer) => [id, label, [1, r, 1], cornerRoof(r, outer),
  { keys: cornerKeys(r, outer), anchors: cornerAnchors(r, outer), ramp: { kind: outer ? 'hip' : 'valley', rise: r } }];
const diagItem = (id, label, L) => [id, label, [L, L, 0], diag(L),
  { keys: [[0, 0, 0], [L, L, 0]], anchors: [[0, 0, 0], [L, 0, 0], [0, L, 0], [L, L, 0], [L / 2, L / 2, 0]] }];

export const MENU = [
  ['Suelo', [['floor1', '1×1', [1, 0, 1], floor(1), { solid: [[0, 0, 0, 1, 0.1, 1]] }],
             ['floor05', '0,5×0,5', [0.5, 0, 0.5], floor(0.5), { solid: [[0, 0, 0, 0.5, 0.1, 0.5]] }]]],
  ['Pared', [['wall1', '1×1', [1, 1, 0], wall(1), { solid: slab(1, 1) }],
             ['wall05', '0,5×1', [0.5, 1, 0], wall(0.5), { solid: slab(0.5, 1) }]]],
  ['Pared corte 26°', [gableItem('g26a', '1 m', 0.5, 1), gableItem('g26b', '0,5 m', 0.5, 0.5)]],
  ['Pared corte 45°', [gableItem('g45a', '1 m', 1, 1), gableItem('g45b', '0,5 m', 1, 0.5)]],
  ['Puerta', [['door', '1×1', [1, 1, 0], doorFrame,
               { solid: [[0, 0, -0.07, 0.08, 1, 0.07], [0.92, 0, -0.07, 1, 1, 0.07]], leaf: doorLeaf,
                 door: { pivot: [0.08, 0, 0], handle: [0.74, 0.5, 0], leafSolid: [0.08, 0, -0.03, 0.92, 0.93, 0.03] } }]]],
  ['Pared vidrio', [['gl05', '0,5×1', [0.5, 1, 0], glass, { solid: slab(0.5, 1) }]]],
  ['Columna', [['col1', '1 m', [0, 1, 0], column(1), { solid: [[-0.06, 0, -0.06, 0.06, 1, 0.06]] }],
               ['col05', '0,5 m', [0, 0.5, 0], column(0.5), { solid: [[-0.06, 0, -0.06, 0.06, 0.5, 0.06]] }]]],
  ['Viga', [['beam1', '1 m', [1, 0, 0], beam(1), { solid: [[0, -0.06, -0.06, 1, 0.06, 0.06]] }],
            ['beam05', '0,5 m', [0.5, 0, 0], beam(0.5), { solid: [[0, -0.06, -0.06, 0.5, 0.06, 0.06]] }]]],
  ['Tablón horiz.', [['ph1', '1 m', [1, 0, 0], plankH(1), { solid: [[0, -0.1, -0.03, 1, 0.1, 0.03]] }],
                     ['ph05', '0,5 m', [0.5, 0, 0], plankH(0.5), { solid: [[0, -0.1, -0.03, 0.5, 0.1, 0.03]] }]]],
  ['Tablón vert.', [['pv1', '1 m', [0, 1, 0], plankV(1), { solid: [[-0.1, 0, -0.03, 0.1, 1, 0.03]] }],
                    ['pv05', '0,5 m', [0, 0.5, 0], plankV(0.5), { solid: [[-0.1, 0, -0.03, 0.1, 0.5, 0.03]] }]]],
  ['Diagonal', [diagItem('dg1', '1 m', 1), diagItem('dg05', '0,5 m', 0.5)]],
  ['Tejado 26°', [roofItem('r26a', '1 m', rise26, 1), roofItem('r26b', '0,5 m', rise26, 0.5)]],
  ['Tejado 45°', [roofItem('r45a', '1 m', rise45, 1), roofItem('r45b', '0,5 m', rise45, 0.5)]],
  ['Esquina ext. 26°', [cornerItem('h26', '1×1', rise26, true)]],
  ['Esquina int. 26°', [cornerItem('v26', '1×1', rise26, false)]],
  ['Esquina ext. 45°', [cornerItem('h45', '1×1', rise45, true)]],
  ['Esquina int. 45°', [cornerItem('v45', '1×1', rise45, false)]],
  ['Antorcha', [['torch', '0,9 m', [0, 0.9, 0], torch, { light: [0, 0.75, 0] }]]],
];
for (const [name, items] of MENU) for (const [id, label, size, build, o] of items) add(id, name + ' ' + label, size, build, o);

const geoms = {};
export function geometryOf(id) {
  if (!geoms[id]) { const b = new Builder(); PIECES[id].build(b); geoms[id] = b.geometry(); }
  return geoms[id];
}
const leafGeoms = {};
export function leafGeometryOf(id) {
  if (!PIECES[id].leaf) return null;
  if (!leafGeoms[id]) { const b = new Builder(); PIECES[id].leaf(b); leafGeoms[id] = b.geometry(); }
  return leafGeoms[id];
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
