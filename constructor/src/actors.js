import { CapsuleGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry, TorusGeometry } from 'three';

const M = (c, o = {}) => new MeshLambertMaterial({ color: c, ...o });

// Perrito dorado con collar rojo, de formas suaves: cuerpo, cabeza, orejas caídas,
// patas articuladas y una cola que se mueve.
export function makeDog() {
  const coat = M('#c9985c'), back = M('#b07b44'), cream = M('#f0e2c8'), ear = M('#85532b'), nose = M('#18120f'), eye = M('#120d0a'), collar = M('#b32d2d'), tag = M('#d8b84a');
  const root = new Group();
  const blob = (geo, mat, x, y, z, sx, sy, sz, parent = root) => {
    const m = new Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
  };
  const sph = (r) => new SphereGeometry(r, 20, 14), cap = (r, l) => new CapsuleGeometry(r, l, 6, 16);
  blob(cap(0.1, 0.24).rotateX(Math.PI / 2), back, 0, 0.3, -0.02, 1, 0.95, 1);              // cuerpo
  blob(sph(0.108), coat, 0, 0.31, 0.145, 1, 1.03, 1);                                      // pecho
  blob(sph(0.1), back, 0, 0.3, -0.17, 1, 1, 1.05);                                         // grupa
  blob(sph(0.1), cream, 0, 0.255, 0.05, 0.85, 0.55, 2.0);                                  // vientre
  blob(cap(0.056, 0.07).rotateX(0.5), coat, 0, 0.385, 0.2, 1, 1, 1);                       // cuello
  const leg = (x, z, front) => {
    const g = new Group(); g.position.set(x, 0.27, z); root.add(g);
    blob(cap(0.037, 0.09), front ? coat : back, 0, -0.07, 0, 1, 1, 1, g);
    blob(cap(0.027, 0.09), coat, 0, -0.17, front ? 0.01 : -0.012, 1, 1, 1, g);
    blob(sph(0.034), cream, 0, -0.245, 0.016, 1, 0.7, 1.35, g);                            // pata
    return g;
  };
  const legs = [leg(-0.068, 0.15, true), leg(0.068, 0.15, true), leg(-0.07, -0.17, false), leg(0.07, -0.17, false)];
  const head = new Group(); head.position.set(0, 0.45, 0.265); root.add(head);
  blob(sph(0.078), coat, 0, 0, 0.02, 1, 0.96, 1.04, head);                                  // cráneo
  blob(cap(0.042, 0.04).rotateX(Math.PI / 2), cream, 0, -0.022, 0.095, 1, 0.85, 1, head);   // hocico
  blob(sph(0.019), nose, 0, -0.002, 0.152, 1.2, 0.9, 1, head);                              // nariz
  for (const s of [-1, 1]) {
    blob(sph(0.012), eye, s * 0.042, 0.022, 0.07, 1, 1.2, 0.8, head);                       // ojos
    blob(sph(0.04), cream, s * 0.035, -0.03, 0.08, 1, 0.8, 1.1, head);                      // mejillas
  }
  const ears = [-1, 1].map((s) => {
    const g = new Group(); g.position.set(s * 0.06, 0.05, -0.005); head.add(g);
    blob(sph(0.05), ear, s * 0.012, -0.045, 0, 0.38, 1, 0.75, g);                           // oreja caída
    return g;
  });
  blob(new TorusGeometry(0.062, 0.012, 8, 20).rotateX(Math.PI / 2 - 0.4), collar, 0, 0.385, 0.195, 1, 1, 1);
  blob(sph(0.014), tag, 0, 0.335, 0.245, 1, 1, 0.5);
  const tail = new Group(); tail.position.set(0, 0.34, -0.26); root.add(tail);
  const seg = (r, l, rx, y, z, parent, mat) => { const g = new Group(); g.position.set(0, y, z); g.rotation.x = rx; parent.add(g); blob(cap(r, l).rotateX(Math.PI / 2), mat, 0, 0, -l / 2, 1, 1, 1, g); return g; };
  const t1 = seg(0.03, 0.06, -0.9, 0, 0, tail, back), t2 = seg(0.025, 0.06, 0.4, 0.0, -0.1, t1, coat), t3 = seg(0.02, 0.05, 0.5, 0.0, -0.1, t2, cream);
  void t3;
  let ph = 0, t = 0;
  return {
    group: root, head,
    // speed (m/s); pet: acariciándolo; w: viento local
    update(dt, speed, pet, w) {
      t += dt;
      ph += dt * (6 + speed * 2.5);
      const s = speed > 0.1 ? Math.sin(ph) * 0.8 : 0;
      legs[0].rotation.x = s; legs[3].rotation.x = s; legs[1].rotation.x = -s; legs[2].rotation.x = -s;
      root.children[0].rotation.z = 0;
      tail.rotation.y = Math.sin(t * (pet ? 24 : 12)) * (pet ? 0.9 : 0.55) + w.x * w.s * 0.3;
      head.rotation.x = pet ? 0.35 + Math.sin(t * 9) * 0.08 : Math.sin(t * 2) * 0.04;
      ears.forEach((g, i) => { g.rotation.x = 0.1 + speed * 0.12 + Math.sin(t * 9 + i) * 0.05 * (0.4 + w.s); g.rotation.z = (i ? -1 : 1) * (0.25 + w.s * 0.2); });
    },
  };
}
