import {
  AnimationMixer, BoxGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, Euler, Group, Mesh, MeshLambertMaterial,
  Quaternion, SphereGeometry, TorusGeometry, Vector2, Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import manUrl from './tex/man.glb';
import { T } from './textures.js';

// Cuerpo y animaciones (idle / walk / run, captura de movimiento) del maniquí
// "Xbot" de Mixamo, tomado del repositorio de ejemplos de three.js. Sobre el
// esqueleto se viste al constructor medieval: túnica, calzas, botas, mandil,
// bufanda, barba y melena (mechones que ondean con el viento) y martillo.
const SCALE = 1.2 / 1.77;                 // 1,77 m del modelo → 1,2 m
const V = (x, y, z) => new Vector3(x, y, z);
const M = (c, o = {}) => new MeshLambertMaterial({ color: c, ...o });

export function makeHuman() {
  const root = new Group(), wrap = new Group();
  wrap.scale.setScalar(SCALE);
  root.add(wrap);
  const S = { mixer: null, act: {}, B: {}, ready: false, strands: [], hammer: null };
  const qs = new Quaternion(), eu = new Euler();

  // El GLB va incrustado como data URL: se decodifica a mano y se usa parse()
  // (fetch de data: puede estar bloqueado por la política de seguridad de la página).
  const bin = atob(manUrl.slice(manUrl.indexOf(',') + 1)), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  new GLTFLoader().parse(buf.buffer, '', (g) => {
    const model = g.scene;
    wrap.add(model);
    const B = S.B;
    const skin = M('#dba784'), skinJ = M('#c58f6c');
    model.traverse((o) => {
      if (o.isBone) B[o.name.replace('mixamorig', '')] = o;
      if (o.isSkinnedMesh) { o.material = o.name.includes('Joints') ? skinJ : skin; o.frustumCulled = false; }
    });
    model.updateMatrixWorld(true);

    // --- materiales ---
    const wool = M('#7a6141'), wool2 = M('#6b543a'), hose = M('#4a3d30'), cloth = M('#8a3b2d'), white = M('#f2f0ea'), grey = M('#d6d4cc');
    const leather = (c) => M(c, { map: T.wood, normalMap: T.woodN, normalScale: new Vector2(0.6, 0.6) });
    const boot = leather('#6b4a2f'), belt = leather('#4a3020'), apron = leather('#b58a5a'), steel = M('#8b8f96'), black = M('#14100d');

    // Las piezas se construyen en coordenadas del modelo (pose de referencia) y
    // se cuelgan del hueso con attach(), que conserva su posición en el mundo.
    const hang = (mesh, bone) => { model.add(mesh); mesh.updateMatrixWorld(true); B[bone].attach(mesh); return mesh; };
    const part = (geo, mat, p, bone, sc) => {
      const m = new Mesh(geo, mat); m.position.copy(p); if (sc) m.scale.set(...sc);
      return hang(m, bone);
    };
    const limb = (a, b, ra, rb, mat, bone) => {
      const d = b.clone().sub(a), len = d.length(), m = new Mesh(new CylinderGeometry(rb, ra, len, 18, 1), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
      return hang(m, bone);
    };
    const P = {};                                   // posiciones de referencia de los huesos
    for (const k in B) P[k] = model.worldToLocal(B[k].getWorldPosition(new Vector3()));

    // Torso: túnica de lana con yugo en los hombros, cinto, mandil y peto.
    part(new CylinderGeometry(0.19, 0.22, 0.5, 14), wool, V(0, 1.22, 0), 'Spine1', [1.08, 1, 0.7]);
    part(new CylinderGeometry(0.1, 0.1, 0.4, 10).rotateZ(Math.PI / 2), wool, V(0, 1.42, 0), 'Spine2');
    for (const s of [-1, 1]) part(new SphereGeometry(0.1, 10, 8), wool, V(s * 0.085, 1.45, -0.03), 'Spine2', [1.05, 0.75, 1]);   // cuello de la túnica
    part(new CylinderGeometry(0.2, 0.31, 0.38, 16, 1, true), wool, V(0, 0.79, 0), 'Hips', [1, 1, 0.82]);   // falda de la túnica
    part(new CylinderGeometry(0.205, 0.205, 0.06, 16), belt, V(0, 1.0, 0), 'Hips', [1.04, 1, 0.74]);
    part(new BoxGeometry(0.05, 0.05, 0.02), steel, V(0, 1.0, 0.16), 'Hips');
    part(new BoxGeometry(0.28, 0.36, 0.02), apron, V(0, 0.8, 0.205), 'Hips');
    part(new BoxGeometry(0.22, 0.3, 0.02), apron, V(0, 1.24, 0.15), 'Spine1');
    part(new BoxGeometry(0.09, 0.1, 0.06), belt, V(-0.2, 0.93, 0.02), 'Hips');                          // bolsa

    // Brazos: manga hasta la muñeca con puño de cuero y hombrera redondeada.
    for (const [s, L] of [[1, 'Left'], [-1, 'Right']]) {
      part(new SphereGeometry(0.092, 10, 8), wool, P[L + 'Arm'], L + 'Arm');
      limb(P[L + 'Arm'], P[L + 'ForeArm'], 0.066, 0.055, wool2, L + 'Arm');
      limb(P[L + 'ForeArm'], P[L + 'Hand'].clone().lerp(P[L + 'ForeArm'], 0.12), 0.055, 0.043, wool2, L + 'ForeArm');
      limb(P[L + 'Hand'].clone().lerp(P[L + 'ForeArm'], 0.2), P[L + 'Hand'].clone().lerp(P[L + 'ForeArm'], 0.1), 0.05, 0.05, belt, L + 'ForeArm');
      // Piernas: calzas de lana, caña de la bota y pie con puntera.
      limb(P[L + 'UpLeg'], P[L + 'Leg'], 0.1, 0.07, hose, L + 'UpLeg');
      limb(P[L + 'Leg'], V(s * 0.08, 0.34, 0.01), 0.07, 0.06, hose, L + 'Leg');
      limb(V(s * 0.08, 0.38, 0.01), V(s * 0.08, 0.075, -0.01), 0.07, 0.057, boot, L + 'Leg');
      part(new BoxGeometry(0.1, 0.07, 0.28), boot, V(s * 0.08, 0.04, 0.06), L + 'Foot');
      part(new SphereGeometry(0.05, 8, 6), boot, V(s * 0.08, 0.035, 0.19), L + 'Foot', [1, 0.7, 0.9]);
    }

    // Cabeza (malla: x ±0,088, y 1,54–1,81, z −0,12…+0,127): facciones y pelo/barba blancos.
    part(new ConeGeometry(0.02, 0.05, 6).rotateX(Math.PI / 2), skin, V(0, 1.655, 0.133), 'Head');         // nariz
    for (const s of [-1, 1]) {
      part(new SphereGeometry(0.014, 6, 5), black, V(s * 0.036, 1.69, 0.112), 'Head');                    // ojos
      part(new CapsuleGeometry(0.009, 0.04, 3, 6).rotateZ(Math.PI / 2), white, V(s * 0.037, 1.716, 0.108), 'Head', [1, 1, 1]);   // cejas
      part(new SphereGeometry(0.022, 6, 5), skin, V(s * 0.09, 1.665, 0.0), 'Head', [0.5, 1.1, 1]);        // orejas
    }
    part(new CapsuleGeometry(0.013, 0.08, 3, 6).rotateZ(Math.PI / 2), white, V(0, 1.617, 0.118), 'Head');   // bigote
    // Pelo: casquete que cubre la coronilla y la nuca y deja libre la cara.
    part(new SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, 1.8).rotateX(-0.62), white, V(0, 1.69, -0.01), 'Head', [0.1, 0.142, 0.138]);
    part(new SphereGeometry(1, 12, 8), white, V(0, 1.585, 0.062), 'Head', [0.078, 0.05, 0.06]);               // base de la barba
    part(new TorusGeometry(0.075, 0.026, 6, 14).rotateX(Math.PI / 2), cloth, V(0, 1.515, -0.005), 'Neck');   // bufanda

    // Mechones colgantes (pivote arriba): barba, melena y colas de la bufanda.
    const strand = (len, w, mat, pos, bone, flex, rest, ph) => {
      const g = new Group(); g.position.copy(pos);
      g.add(new Mesh(new CylinderGeometry(w, w * 0.2, len, 5).translate(0, -len / 2, 0), mat));
      hang(g, bone);
      S.strands.push({ g, q0: g.quaternion.clone(), flex, rest, ph });
    };
    for (let i = 0; i < 15; i++) {
      const a = ((i / 14) - 0.5) * 2.6, row = i % 2;
      strand((0.15 + 0.07 * Math.cos(a)) + row * 0.04, 0.017, i % 3 ? white : grey,
        V(Math.sin(a) * 0.08, 1.58 - row * 0.012, Math.cos(a) * 0.1 - 0.012), 'Head', 0.5 + 0.12 * (i % 4), -0.08, i * 1.7);
    }
    for (let i = 0; i < 9; i++) {
      strand(0.22 + (i % 3) * 0.05, 0.02, i % 2 ? white : grey, V(((i + 0.5) / 9 - 0.5) * 0.15, 1.7, -0.118), 'Head', 0.8 + 0.1 * (i % 3), 0.08, i * 2.1);
    }
    for (const x of [-0.035, 0.05]) strand(0.34, 0.034, cloth, V(x, 1.5, -0.1), 'Spine2', 1.3, 0.12, x * 40);

    // Martillo (se ve con la herramienta equipada): mango hacia delante.
    const h = new Group();
    h.add(new Mesh(new CylinderGeometry(0.014, 0.016, 0.34, 6).rotateX(Math.PI / 2), boot));
    const head = new Mesh(new BoxGeometry(0.05, 0.05, 0.11), steel);
    head.position.set(0, 0, 0.17);
    h.add(head);
    h.position.copy(P.RightHand).add(V(-0.025, 0, 0.01));
    S.hammer = hang(h, 'RightHand');

    // Animaciones
    S.mixer = new AnimationMixer(model);
    for (const c of g.animations) { const a = S.mixer.clipAction(c); a.play(); a.setEffectiveWeight(0); S.act[c.name] = a; }
    S.ready = true;
    S.hammer.visible = S.tool !== false;
  }, (err) => console.error('No se pudo cargar el personaje', err));

  let petBlend = 0;
  return {
    group: root,
    setTool(on) { S.tool = on; if (S.hammer) S.hammer.visible = on; },
    // speed (m/s), air, pet, w = viento en el marco del personaje {x,z,s}, t, run
    update(dt, speed, air, pet, w, t) {
      if (!S.ready) return;
      const A = S.act;
      let wi = Math.max(0, 1 - speed / 0.5), wr = Math.min(1, Math.max(0, (speed - 2.6) / 1.4)), ww = Math.max(0, 1 - wi - wr);
      if (air) { wi = 0; ww = 0.2; wr = 0.8; }
      A.idle.setEffectiveWeight(wi); A.walk.setEffectiveWeight(ww); A.run.setEffectiveWeight(wr);
      A.walk.timeScale = Math.max(0.3, speed / 0.95);
      A.run.timeScale = air ? 0.3 : Math.max(0.5, speed / 2.5);
      S.mixer.update(dt);
      // acariciar: se inclina hacia delante y baja la cabeza
      petBlend += ((pet ? 1 : 0) - petBlend) * Math.min(1, dt * 6);
      if (petBlend > 0.01) {
        S.B.Spine1.rotateX(0.5 * petBlend);
        S.B.Head.rotateX(0.2 * petBlend);
      }
      // viento: el aire relativo incluye el avance (la barba vuela hacia atrás al correr)
      const wz = w.z - speed * 0.12, ws = Math.min(1.4, w.s + speed * 0.1);
      for (const s of S.strands) {
        const rx = s.rest - wz * 0.5 * s.flex + Math.sin(t * 7 + s.ph) * 0.07 * ws * s.flex;
        const rz = w.x * 0.5 * s.flex + Math.sin(t * 5.3 + s.ph * 1.3) * 0.09 * ws * s.flex;
        s.g.quaternion.copy(s.q0).multiply(qs.setFromEuler(eu.set(rx, 0, rz)));
      }
    },
  };
}
