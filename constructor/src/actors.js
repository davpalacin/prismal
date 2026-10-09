import { BoxGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry } from 'three';

const M = (c) => new MeshLambertMaterial({ color: c });
const part = (geo, mat, x, y, z, parent) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d) => new BoxGeometry(w, h, d);

// Constructor medieval anciano de 1,5 m, pelo y barba blancos.
export function makeHuman() {
  const skin = M('#dcae88'), tunic = M('#7d5a36'), pants = M('#4a3c2c'), boot = M('#2a1b10'), white = M('#f1efe9'),
    leather = M('#a67c45'), belt = M('#2b1b0e'), iron = M('#8b8f96');
  const root = new Group();
  const leg = (x) => {
    const g = new Group(); g.position.set(x, 0.72, 0); root.add(g);
    part(box(0.14, 0.54, 0.15), pants, 0, -0.27, 0, g);
    part(box(0.16, 0.2, 0.23), boot, 0, -0.62, 0.02, g);
    return g;
  };
  const legs = [leg(-0.09), leg(0.09)];
  const torso = new Group(); torso.position.y = 0.72; root.add(torso);
  part(box(0.4, 0.52, 0.24), tunic, 0, 0.26, 0, torso);
  part(box(0.42, 0.07, 0.26), belt, 0, 0.06, 0, torso);
  part(box(0.3, 0.42, 0.02), leather, 0, 0.24, 0.13, torso);
  part(box(0.03, 0.22, 0.03), leather, 0.22, 0.02, 0.05, torso);          // martillo al cinto
  part(box(0.11, 0.06, 0.05), iron, 0.22, 0.14, 0.05, torso);
  const arm = (x) => {
    const g = new Group(); g.position.set(x, 1.2, 0); root.add(g);
    part(box(0.1, 0.32, 0.1), tunic, 0, -0.16, 0, g);
    part(box(0.085, 0.2, 0.085), skin, 0, -0.42, 0, g);
    return g;
  };
  const arms = [arm(-0.26), arm(0.26)];
  const head = new Group(); head.position.y = 1.24; root.add(head);
  part(new SphereGeometry(0.115, 10, 8), skin, 0, 0.11, 0, head);
  part(new SphereGeometry(0.128, 10, 8), white, 0, 0.145, -0.02, head).scale.y = 0.88;   // pelo
  part(box(0.26, 0.2, 0.1), white, 0, 0.05, -0.1, head);                                   // melena
  part(box(0.15, 0.16, 0.07), white, 0, -0.02, 0.09, head);                                // barba
  part(box(0.1, 0.03, 0.05), white, 0, 0.065, 0.12, head);                                 // bigote
  part(box(0.035, 0.045, 0.045), skin, 0, 0.1, 0.125, head);                               // nariz
  for (const x of [-0.045, 0.045]) { part(box(0.02, 0.02, 0.02), belt, x, 0.14, 0.108, head); part(box(0.05, 0.015, 0.02), white, x, 0.165, 0.11, head); }
  let ph = 0, amt = 0;
  // speed (m/s), jumping, petting: anima piernas y brazos.
  return {
    group: root,
    update(dt, speed, air, pet) {
      amt += ((speed > 0.1 ? 1 : 0) - amt) * Math.min(1, dt * 10);
      ph += dt * (4 + speed * 1.6);
      const s = Math.sin(ph) * 0.75 * amt * (air ? 0.2 : 1);
      legs[0].rotation.x = s + (air ? 0.5 : 0); legs[1].rotation.x = -s - (air ? 0.2 : 0);
      arms[0].rotation.x = -s * 0.8 + (air ? -0.8 : 0); arms[1].rotation.x = s * 0.8 + (air ? -0.8 : 0);
      if (pet) { arms[1].rotation.x = -0.9 + Math.sin(ph * 3) * 0.2; torso.rotation.x = 0.35; head.rotation.x = 0.2; }
      else { torso.rotation.x = 0; head.rotation.x = 0; }
    },
  };
}

// Perrito dorado: patas, cabeza, orejas y cola que se mueve.
export function makeDog() {
  const coat = M('#c8965a'), cream = M('#efe0c4'), ear = M('#7b4a26'), nose = M('#15110e');
  const root = new Group();
  part(box(0.2, 0.2, 0.5), coat, 0, 0.3, 0, root);
  part(box(0.16, 0.12, 0.2), cream, 0, 0.26, 0.18, root);
  const leg = (x, z) => { const g = new Group(); g.position.set(x, 0.22, z); root.add(g); part(box(0.06, 0.22, 0.06), coat, 0, -0.11, 0, g); return g; };
  const legs = [leg(-0.07, 0.19), leg(0.07, 0.19), leg(-0.07, -0.19), leg(0.07, -0.19)];
  const head = new Group(); head.position.set(0, 0.43, 0.27); root.add(head);
  part(box(0.15, 0.15, 0.16), coat, 0, 0, 0.03, head);
  part(box(0.09, 0.07, 0.1), cream, 0, -0.03, 0.14, head);
  part(box(0.04, 0.035, 0.03), nose, 0, -0.005, 0.2, head);
  part(box(0.04, 0.09, 0.07), ear, -0.085, 0.02, 0.01, head);
  part(box(0.04, 0.09, 0.07), ear, 0.085, 0.02, 0.01, head);
  part(box(0.02, 0.02, 0.02), nose, -0.04, 0.04, 0.115, head);
  part(box(0.02, 0.02, 0.02), nose, 0.04, 0.04, 0.115, head);
  const tail = new Group(); tail.position.set(0, 0.37, -0.25); tail.rotation.x = -0.9; root.add(tail);
  part(box(0.045, 0.045, 0.2), coat, 0, 0, -0.1, tail);
  let ph = 0, t = 0;
  return {
    group: root, head,
    // speed (m/s); pet: acariciándolo → cola más rápida y cabeza gacha
    update(dt, speed, pet) {
      t += dt;
      ph += dt * (6 + speed * 2.5);
      const s = speed > 0.1 ? Math.sin(ph) * 0.8 : 0;
      legs[0].rotation.x = s; legs[3].rotation.x = s; legs[1].rotation.x = -s; legs[2].rotation.x = -s;
      tail.rotation.y = Math.sin(t * (pet ? 24 : 12)) * (pet ? 0.9 : 0.55);
      head.rotation.x = pet ? 0.35 + Math.sin(t * 9) * 0.08 : Math.sin(t * 2) * 0.04;
    },
  };
}
