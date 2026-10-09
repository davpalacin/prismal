import { BufferGeometry, Color, Float32BufferAttribute } from 'three';

// Constructor mínimo de geometría: cajas orientadas con color por vértice y
// normales planas. Todas las piezas de una misma clase comparten un único
// BufferGeometry y un único material.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export class Builder {
  constructor() { this.pos = []; this.nor = []; this.col = []; }

  // Caja alineada a los ejes entre dos esquinas.
  box(x0, y0, z0, x1, y1, z1, color) {
    this.obox([x0, y0, z0], [x1 - x0, 0, 0], [0, y1 - y0, 0], [0, 0, z1 - z0], color);
  }

  // Caja orientada: esquina `o` y tres vectores de arista a, b, c.
  obox(o, a, b, c, color) {
    const rgb = new Color(color);
    const P = (i, j, k) => [0, 1, 2].map((n) => o[n] + a[n] * i + b[n] * j + c[n] * k);
    const mid = P(0.5, 0.5, 0.5);
    const faces = [
      [P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)],
      [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)],
      [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)],
    ];
    for (let q of faces) {
      let n = cross(sub(q[1], q[0]), sub(q[3], q[0]));
      if (dot(n, sub(q[0], mid)) < 0) { q = [q[0], q[3], q[2], q[1]]; n = n.map((v) => -v); }
      const l = Math.hypot(...n) || 1;
      for (const v of [q[0], q[1], q[2], q[0], q[2], q[3]]) {
        this.pos.push(...v);
        this.nor.push(n[0] / l, n[1] / l, n[2] / l);
        this.col.push(rgb.r, rgb.g, rgb.b);
      }
    }
  }

  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}
