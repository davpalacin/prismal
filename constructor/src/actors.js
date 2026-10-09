import { BoxGeometry, Group, Mesh, MeshLambertMaterial } from 'three';

const M = (c, o = {}) => new MeshLambertMaterial({ color: c, ...o });
const part = (geo, mat, x, y, z, parent) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d) => new BoxGeometry(w, h, d);

// Perrito dorado con collar rojo: patas, orejas y cola que se mueve.
export function makeDog() {
  const coat = M('#c8965a'), cream = M('#efe0c4'), ear = M('#7b4a26'), nose = M('#15110e'), collar = M('#b32d2d'), tag = M('#d8b84a');
  const root = new Group();
  part(box(0.2, 0.2, 0.5), coat, 0, 0.3, 0, root);
  part(box(0.16, 0.12, 0.2), cream, 0, 0.26, 0.18, root);
  const leg = (x, z) => {
    const g = new Group(); g.position.set(x, 0.22, z); root.add(g);
    part(box(0.06, 0.22, 0.06), coat, 0, -0.11, 0, g);
    part(box(0.065, 0.04, 0.075), cream, 0, -0.2, 0.005, g);
    return g;
  };
  const legs = [leg(-0.07, 0.19), leg(0.07, 0.19), leg(-0.07, -0.19), leg(0.07, -0.19)];
  const head = new Group(); head.position.set(0, 0.43, 0.27); root.add(head);
  part(box(0.15, 0.15, 0.16), coat, 0, 0, 0.03, head);
  part(box(0.09, 0.07, 0.1), cream, 0, -0.03, 0.14, head);
  part(box(0.04, 0.035, 0.03), nose, 0, -0.005, 0.2, head);
  part(box(0.02, 0.02, 0.02), nose, -0.04, 0.04, 0.115, head);
  part(box(0.02, 0.02, 0.02), nose, 0.04, 0.04, 0.115, head);
  const ears = [-1, 1].map((sx) => {
    const g = new Group(); g.position.set(sx * 0.075, 0.07, 0); head.add(g);
    part(new BoxGeometry(0.04, 0.1, 0.07).translate(0, -0.05, 0), ear, sx * 0.01, 0, 0, g);
    return g;
  });
  part(box(0.17, 0.035, 0.17), collar, 0, 0.375, 0.2, root);
  part(box(0.025, 0.035, 0.01), tag, 0, 0.335, 0.285, root);
  const tail = new Group(); tail.position.set(0, 0.37, -0.25); tail.rotation.x = -0.9; root.add(tail);
  part(box(0.045, 0.045, 0.2), coat, 0, 0, -0.1, tail);
  part(box(0.05, 0.05, 0.06), cream, 0, 0, -0.2, tail);
  let ph = 0, t = 0;
  return {
    group: root, head,
    // speed (m/s); pet: acariciándolo; w: viento local
    update(dt, speed, pet, w) {
      t += dt;
      ph += dt * (6 + speed * 2.5);
      const s = speed > 0.1 ? Math.sin(ph) * 0.8 : 0;
      legs[0].rotation.x = s; legs[3].rotation.x = s; legs[1].rotation.x = -s; legs[2].rotation.x = -s;
      tail.rotation.y = Math.sin(t * (pet ? 24 : 12)) * (pet ? 0.9 : 0.55) + w.x * w.s * 0.3;
      head.rotation.x = pet ? 0.35 + Math.sin(t * 9) * 0.08 : Math.sin(t * 2) * 0.04;
      ears.forEach((g, i) => { g.rotation.x = 0.15 + speed * 0.12 + Math.sin(t * 9 + i) * 0.05 * (0.4 + w.s); g.rotation.z = (i ? -1 : 1) * (0.15 + w.s * 0.2); });
    },
  };
}
