import { BufferGeometry, Color, Float32BufferAttribute } from 'three';

// Constructor mínimo de geometría con color por vértice y normales planas.
// Tres capas = tres materiales: 0 madera, 1 vidrio, 2 llama. Todas las piezas
// de un mismo tipo comparten un único BufferGeometry.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mean = (ps) => [0, 1, 2].map((i) => ps.reduce((s, p) => s + p[i], 0) / ps.length);

export class Builder {
  constructor() {
    this.layers = [0, 1, 2].map(() => ({ pos: [], nor: [], col: [] }));
    this.layer = 0;
  }

  // Caja alineada a los ejes entre dos esquinas.
  box(x0, y0, z0, x1, y1, z1, color) {
    this.obox([x0, y0, z0], [x1 - x0, 0, 0], [0, y1 - y0, 0], [0, 0, z1 - z0], color);
  }

  // Caja orientada: esquina `o` y tres vectores de arista a, b, c.
  obox(o, a, b, c, color) {
    const P = (i, j, k) => [0, 1, 2].map((n) => o[n] + a[n] * i + b[n] * j + c[n] * k);
    const mid = P(0.5, 0.5, 0.5);
    for (const q of [
      [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)],
      [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)],
      [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)],
    ]) this.poly(q, mid, color);
  }

  // Polígono convexo plano; la cara mira hacia fuera del punto `inside`.
  poly(pts, inside, color) {
    let n = [0, 0, 0];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      n[0] += (p[1] - q[1]) * (p[2] + q[2]);
      n[1] += (p[2] - q[2]) * (p[0] + q[0]);
      n[2] += (p[0] - q[0]) * (p[1] + q[1]);
    });
    const l = Math.hypot(...n);
    if (l < 1e-9) return;
    n = n.map((v) => v / l);
    if (dot(n, sub(pts[0], inside)) < 0) n = n.map((v) => -v);
    const rgb = new Color(color), L = this.layers[this.layer];
    for (let i = 1; i < pts.length - 1; i++) {
      let [a, b, c] = [pts[0], pts[i], pts[i + 1]];
      const cn = cross(sub(b, a), sub(c, a));
      if (Math.hypot(...cn) < 1e-9) continue;
      if (dot(cn, n) < 0) [b, c] = [c, b];
      for (const v of [a, b, c]) { L.pos.push(...v); L.nor.push(...n); L.col.push(rgb.r, rgb.g, rgb.b); }
    }
  }

  // Prisma: polígono `pts` extruido `t` en sentido contrario a `up`.
  prism(pts, up, t, color) {
    let n = [0, 0, 0];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      n[0] += (p[1] - q[1]) * (p[2] + q[2]);
      n[1] += (p[2] - q[2]) * (p[0] + q[0]);
      n[2] += (p[0] - q[0]) * (p[1] + q[1]);
    });
    const l = Math.hypot(...n) || 1;
    n = n.map((v) => (dot(n, up) < 0 ? -v : v) / l);
    const bot = pts.map((p) => [p[0] - n[0] * t, p[1] - n[1] * t, p[2] - n[2] * t]), c = mean([...pts, ...bot]);
    this.poly(pts, c, color);
    this.poly(bot, c, color);
    pts.forEach((p, i) => { const j = (i + 1) % pts.length; this.poly([p, pts[j], bot[j], bot[i]], c, color); });
  }

  pyramid(base, apex, color) {
    const c = mean([...base, apex]);
    this.poly(base, c, color);
    base.forEach((p, i) => this.poly([p, base[(i + 1) % base.length], apex], c, color));
  }

  geometry() {
    const g = new BufferGeometry(), pos = [], nor = [], col = [];
    let start = 0;
    this.layers.forEach((L, i) => {
      if (!L.pos.length) return;
      pos.push(...L.pos); nor.push(...L.nor); col.push(...L.col);
      g.addGroup(start, L.pos.length / 3, i);
      start += L.pos.length / 3;
    });
    if (g.groups.length === 1 && g.groups[0].materialIndex === 0) g.clearGroups();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new Float32BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return g;
  }
}
