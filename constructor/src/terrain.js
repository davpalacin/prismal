// Relieve del terreno: un claro llano central (donde se construye) que se
// eleva en colinas hacia el bosque. `heightAt` lo comparten el mundo visual, la
// física del personaje y la colocación de piezas.
export const CLEAR_R = 11;      // radio del claro completamente plano
const BLEND = 9;                // anchura de la transición a las colinas

const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y) {
  let s = 0, a = 0.5;
  for (let i = 0; i < 4; i++) { s += a * vnoise(x, y); x *= 2.03; y *= 2.03; a *= 0.5; }
  return s;
}

export function heightAt(x, z) {
  const r = Math.hypot(x, z);
  let t = Math.min(1, Math.max(0, (r - CLEAR_R) / BLEND));
  t = t * t * (3 - 2 * t);
  if (t === 0) return 0;
  return t * (0.2 + fbm(x * 0.06 + 11, z * 0.06 + 3) * 6 + fbm(x * 0.7, z * 0.7) * 0.4);
}

// Primer punto donde el rayo toca el terreno (marcha + bisección).
export function raycastTerrain(o, d, max = 140) {
  let t0 = 0, p = (t) => [o.x + d.x * t, o.y + d.y * t, o.z + d.z * t];
  let [x, y, z] = p(0);
  if (y < heightAt(x, z)) return null;
  for (let t = 0.5; t <= max; t += 0.5) {
    [x, y, z] = p(t);
    if (y < heightAt(x, z)) {
      let a = t0, b = t;
      for (let i = 0; i < 12; i++) {
        const m = (a + b) / 2, [mx, my, mz] = p(m);
        if (my < heightAt(mx, mz)) b = m; else a = m;
      }
      [x, y, z] = p(b);
      return [x, heightAt(x, z), z];
    }
    t0 = t;
  }
  return null;
}
