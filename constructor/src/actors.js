import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry, Vector2 } from 'three';
import { T } from './textures.js';

const M = (c, o = {}) => new MeshLambertMaterial({ color: c, ...o });
const part = (geo, mat, x, y, z, parent) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d) => new BoxGeometry(w, h, d);
// Mechón colgante: cono truncado cuyo pivote está arriba.
const lock = (len, w) => new CylinderGeometry(w, w * 0.25, len, 5).translate(0, -len / 2, 0);
const leatherMat = (c) => M(c, { map: T.wood, normalMap: T.woodN, normalScale: new Vector2(0.6, 0.6) });

// Inclina un grupo colgante según el viento local (x,z) con flexibilidad `flex`.
function sway(g, w, t, flex, ph, rest = 0) {
  g.rotation.x = rest - w.z * 0.9 * flex + Math.sin(t * 7 + ph) * 0.07 * w.s * flex;
  g.rotation.z = w.x * 0.9 * flex + Math.sin(t * 5.3 + ph * 1.3) * 0.09 * w.s * flex;
}

// Constructor medieval anciano de 1,5 m: pelo, barba y bufanda que ondean con el viento.
export function makeHuman() {
  const skin = M('#d9a581'), tunic = M('#85694a'), tunic2 = M('#8a3b2d'), pants = M('#43382b'), white = M('#f4f2ec'),
    grey = M('#d9d7d0'), iron = M('#8b8f96'), eye = M('#1b1410'), pink = M('#c98270');
  const boot = leatherMat('#4a3220'), belt = leatherMat('#3a2616'), apron = leatherMat('#a6794a');
  const root = new Group();
  const leg = (x) => {
    const g = new Group(); g.position.set(x, 0.72, 0); root.add(g);
    part(box(0.14, 0.54, 0.15), pants, 0, -0.27, 0, g);
    part(box(0.16, 0.2, 0.23), boot, 0, -0.62, 0.02, g);
    part(box(0.17, 0.04, 0.24), belt, 0, -0.71, 0.02, g);
    return g;
  };
  const legs = [leg(-0.09), leg(0.09)];
  const torso = new Group(); torso.position.y = 0.72; root.add(torso);
  const chest = part(box(0.4, 0.52, 0.24), tunic, 0, 0.26, 0, torso);
  part(box(0.42, 0.06, 0.26), tunic, 0, -0.01, 0, torso);                  // dobladillo
  part(box(0.43, 0.07, 0.27), belt, 0, 0.06, 0, torso);
  part(box(0.05, 0.06, 0.02), iron, 0, 0.06, 0.145, torso);                // hebilla
  part(box(0.3, 0.42, 0.02), apron, 0, 0.24, 0.13, torso);                 // mandil de cuero
  part(box(0.1, 0.12, 0.03), belt, -0.1, 0.3, 0.15, torso);                // bolsillo del mandil
  part(box(0.1, 0.1, 0.07), belt, -0.24, 0.0, 0.0, torso);                 // bolsa al cinto
  part(box(0.03, 0.22, 0.03), boot, 0.22, 0.02, 0.05, torso);              // martillo
  part(box(0.11, 0.06, 0.05), iron, 0.22, 0.14, 0.05, torso);
  part(box(0.14, 0.04, 0.02), tunic2, 0.0, 0.5, 0.125, torso);             // cuello
  const arm = (x) => {
    const g = new Group(); g.position.set(x, 1.2, 0); root.add(g);
    part(box(0.1, 0.32, 0.1), tunic, 0, -0.16, 0, g);
    part(box(0.11, 0.05, 0.11), belt, 0, -0.3, 0, g);                      // puño
    part(box(0.085, 0.2, 0.085), skin, 0, -0.42, 0, g);
    part(new SphereGeometry(0.05, 8, 6), skin, 0, -0.54, 0, g);            // mano
    return g;
  };
  const arms = [arm(-0.26), arm(0.26)];
  const head = new Group(); head.position.y = 1.24; root.add(head);
  part(new SphereGeometry(0.115, 12, 10), skin, 0, 0.11, 0, head);
  part(new SphereGeometry(0.128, 12, 10), white, 0, 0.145, -0.02, head).scale.y = 0.88;
  part(box(0.26, 0.17, 0.08), white, 0, 0.06, -0.1, head);
  part(new SphereGeometry(0.03, 6, 5), skin, -0.112, 0.1, 0, head);        // orejas
  part(new SphereGeometry(0.03, 6, 5), skin, 0.112, 0.1, 0, head);
  part(box(0.035, 0.05, 0.05), pink, 0, 0.095, 0.12, head);                // nariz
  for (const x of [-0.045, 0.045]) {
    part(box(0.022, 0.022, 0.02), eye, x, 0.135, 0.105, head);
    part(box(0.06, 0.02, 0.025), grey, x, 0.165, 0.108, head);             // ceja poblada
  }
  part(box(0.11, 0.035, 0.04), white, 0, 0.065, 0.118, head);              // bigote
  // Barba: mechones colgantes (pivote en el mentón) que reaccionan al viento.
  const beard = [], hair = [];
  for (let i = 0; i < 13; i++) {
    const row = i < 7 ? 0 : 1, k = row ? i - 7 : i, n = row ? 6 : 7, x = ((k + 0.5) / n - 0.5) * 0.17;
    const g = new Group(); g.position.set(x, row ? 0.015 : 0.035, 0.085 + row * 0.02 - Math.abs(x) * 0.5); head.add(g);
    const len = (row ? 0.17 : 0.12) + (k % 3) * 0.025;
    part(lock(len, 0.024), i % 2 ? white : grey, 0, 0, 0, g);
    g.userData = { ph: i * 1.7, flex: 0.45 + 0.1 * (i % 4) + row * 0.15, rest: -0.1 };
    beard.push(g);
  }
  for (let i = 0; i < 8; i++) {          // melena larga a la espalda
    const x = ((i + 0.5) / 8 - 0.5) * 0.22;
    const g = new Group(); g.position.set(x, 0.1, -0.1); head.add(g);
    part(lock(0.2 + (i % 3) * 0.04, 0.03), i % 2 ? white : grey, 0, 0, 0, g);
    g.userData = { ph: i * 2.1, flex: 0.7 + 0.1 * (i % 3), rest: 0.08 };
    hair.push(g);
  }
  // Bufanda: dos colas que ondean
  const scarfTails = [];
  part(box(0.26, 0.07, 0.2), tunic2, 0, 1.2, 0, root);
  for (const x of [0.06, -0.04]) {
    const g = new Group(); g.position.set(x, 1.19, -0.11); root.add(g);
    part(new BoxGeometry(0.07, 0.3, 0.02).translate(0, -0.15, 0), tunic2, 0, 0, 0, g);
    g.userData = { ph: x * 30, flex: 1.2, rest: 0.1 };
    scarfTails.push(g);
  }
  let ph = 0, amt = 0, breath = 0;
  return {
    group: root,
    // w = viento en el marco del personaje {x,z,s}
    update(dt, speed, air, pet, w, t) {
      amt += ((speed > 0.1 ? 1 : 0) - amt) * Math.min(1, dt * 10);
      ph += dt * (4 + speed * 1.6);
      breath += dt * 1.6;
      const s = Math.sin(ph) * 0.75 * amt * (air ? 0.2 : 1);
      legs[0].rotation.x = s + (air ? 0.5 : 0); legs[1].rotation.x = -s - (air ? 0.2 : 0);
      arms[0].rotation.x = -s * 0.8 + (air ? -0.8 : 0); arms[1].rotation.x = s * 0.8 + (air ? -0.8 : 0);
      if (pet) { arms[1].rotation.x = -0.9 + Math.sin(ph * 3) * 0.2; torso.rotation.x = 0.35; head.rotation.x = 0.25; }
      else { torso.rotation.x = 0; head.rotation.x = 0; }
      chest.scale.set(1 + Math.sin(breath) * 0.015, 1, 1 + Math.sin(breath) * 0.02);
      // el aire relativo incluye el avance (la barba vuela hacia atrás al correr)
      const ww = { x: w.x, z: w.z - speed * 0.14, s: Math.min(1.4, w.s + speed * 0.1) };
      for (const g of beard) sway(g, ww, t, g.userData.flex, g.userData.ph, g.userData.rest);
      for (const g of hair) sway(g, ww, t, g.userData.flex, g.userData.ph, g.userData.rest);
      for (const g of scarfTails) sway(g, { ...ww, z: ww.z + 0.15 }, t, g.userData.flex, g.userData.ph, g.userData.rest);
    },
  };
}

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
