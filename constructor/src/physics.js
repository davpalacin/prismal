import { HALF, rampHeight, worldPoint } from './pieces.js';
import { heightAt } from './terrain.js';

// Colisión mínima para caminar: cilindros contra cajas orientadas (OBB) y
// árboles circulares, más rampas (tejados y esquinas) como suelo caminable.
export const STEP = 0.5;               // desnivel que se sube andando
const GRAV = 18;
export const JUMP_V = Math.sqrt(2 * GRAV * 1.15);   // salto de 1,15 m: alcanza una pared de 1 m

const solids = [], ramps = [];

export function addColliders(owner, pl, def) {
  const ang = (pl.rot * Math.PI) / 4, c = Math.cos(ang), s = Math.sin(ang);
  for (const [x0, y0, z0, x1, y1, z1] of def.solid) {
    const [cx, , cz] = worldPoint(pl, [(x0 + x1) / 2, 0, (z0 + z1) / 2]);
    const hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
    solids.push({ owner, cx, cz, hx, hz, c, s, y0: pl.y + y0, y1: pl.y + y1, rad: Math.hypot(hx, hz) });
  }
  if (def.ramp) ramps.push({ owner, pl, c, s, r: def.ramp });
}

export function addCircle(x, z, r) {
  solids.push({ owner: null, cx: x, cz: z, r, y0: 0, y1: 99, rad: r });
}

export function removeColliders(owner) {
  for (const list of [solids, ramps]) {
    for (let i = list.length - 1; i >= 0; i--) if (list[i].owner === owner) list.splice(i, 1);
  }
}

// Empuja el círculo (a.x,a.z,r) fuera de la caja `s`.
function push(a, s, r) {
  if (s.r !== undefined) {
    const dx = a.x - s.cx, dz = a.z - s.cz, d = Math.hypot(dx, dz), m = s.r + r;
    if (d < m) { const k = d > 1e-6 ? (m - d) / d : 0; a.x += d > 1e-6 ? dx * k : m; a.z += dz * k; }
    return;
  }
  const dx = a.x - s.cx, dz = a.z - s.cz;
  const lx = dx * s.c - dz * s.s, lz = dx * s.s + dz * s.c;      // al marco local de la caja
  const qx = Math.max(-s.hx, Math.min(s.hx, lx)), qz = Math.max(-s.hz, Math.min(s.hz, lz));
  let ox = lx - qx, oz = lz - qz, d = Math.hypot(ox, oz);
  if (d >= r) return;
  if (d < 1e-6) {                                                 // centro dentro: salir por el lado más cercano
    if (s.hx - Math.abs(lx) < s.hz - Math.abs(lz)) { ox = Math.sign(lx || 1); oz = 0; d = -(s.hx - Math.abs(lx)); }
    else { ox = 0; oz = Math.sign(lz || 1); d = -(s.hz - Math.abs(lz)); }
  } else { ox /= d; oz /= d; }
  const m = r - d;
  a.x += (ox * s.c + oz * s.s) * m;
  a.z += (-ox * s.s + oz * s.c) * m;
}

function groundAt(x, z, y, step) {
  let best = heightAt(x, z);
  for (const s of solids) {
    if (s.r !== undefined || s.y1 > y + step + 1e-6 || s.y1 <= best) continue;
    const dx = x - s.cx, dz = z - s.cz;
    if (Math.abs(dx) > s.rad + 0.2 || Math.abs(dz) > s.rad + 0.2) continue;
    const lx = dx * s.c - dz * s.s, lz = dx * s.s + dz * s.c;
    if (Math.abs(lx) <= s.hx + 0.12 && Math.abs(lz) <= s.hz + 0.12) best = s.y1;
  }
  for (const q of ramps) {
    const dx = x - q.pl.x, dz = z - q.pl.z;
    const h = rampHeight(q.r, dx * q.c - dz * q.s, dx * q.s + dz * q.c);
    if (h !== null && q.pl.y + h + 0.01 <= y + step && q.pl.y + h + 0.01 > best) best = q.pl.y + h + 0.01;
  }
  return best;
}

// Mueve a = {x,y,z,vy,onGround} con colisiones y gravedad.
export function moveActor(a, dx, dz, dt, r, h, step = STEP) {
  const lim = HALF - 0.4;
  a.x += dx; a.z += dz;
  for (let it = 0; it < 3; it++) {
    for (const s of solids) {
      if (s.y1 <= a.y + step + 1e-6 || s.y0 >= a.y + h) continue;
      if (Math.abs(a.x - s.cx) > s.rad + r || Math.abs(a.z - s.cz) > s.rad + r) continue;
      push(a, s, r);
    }
  }
  a.x = Math.max(-lim, Math.min(lim, a.x));
  a.z = Math.max(-lim, Math.min(lim, a.z));
  const y0 = a.y;
  a.vy -= GRAV * dt;
  a.y += a.vy * dt;
  const g = groundAt(a.x, a.z, y0, step);
  if (a.vy <= 0 && a.y <= g + (a.onGround ? 0.35 : 0)) { a.y = g; a.vy = 0; a.onGround = true; }
  else a.onGround = false;
}
