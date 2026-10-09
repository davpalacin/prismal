import {
  BoxGeometry, BufferGeometry, CanvasTexture, Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide,
  Float32BufferAttribute, FogExp2, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Points, PointsMaterial, Quaternion, SphereGeometry, Sprite, SpriteMaterial, Vector3,
} from 'three';
import { HALF } from './pieces.js';

export const CLEARING = 9;   // radio del claro central sin árboles

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Noche con luna llena y niebla; terreno, hierba y bosque alrededor del claro.
export function buildWorld(scene, addCircle) {
  scene.background = new Color('#0a1224');
  scene.fog = new FogExp2('#0a1224', 0.024);

  scene.add(new HemisphereLight('#7f98d0', '#2a3040', 1.5));
  const moonDir = new Vector3(-0.5, 0.55, -0.7).normalize();
  const moonLight = new DirectionalLight('#a9bfee', 2.4);
  moonLight.position.copy(moonDir).multiplyScalar(60);
  scene.add(moonLight);

  // Terreno
  const soil = new MeshLambertMaterial({ color: '#4d3a2a' }), grass = new MeshLambertMaterial({ color: '#4f8a40' });
  const ground = new Mesh(new BoxGeometry(2 * HALF, 0.3, 2 * HALF), [soil, soil, grass, soil, soil, soil]);
  ground.position.y = -0.15;
  scene.add(ground);

  // Hierba: grupos de matas triangulares en un único InstancedMesh.
  {
    const pos = [], nor = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), h = 0.1 + (i % 3) * 0.04, lean = 0.05 + (i % 2) * 0.03;
      pos.push(ca * 0.015 - sa * 0.02, 0, sa * 0.015 + ca * 0.02, ca * 0.015 + sa * 0.02, 0, sa * 0.015 - ca * 0.02,
        ca * (0.015 + lean), h, sa * (0.015 + lean));
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
    const tufts = [];
    for (let c = 0; c < 260; c++) {
      const cx = (rnd() - 0.5) * (2 * HALF - 0.4), cz = (rnd() - 0.5) * (2 * HALF - 0.4);
      for (let k = 0, n = 4 + Math.floor(rnd() * 4); k < n; k++) {
        tufts.push([Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cx + (rnd() - 0.5) * 0.45)),
          Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cz + (rnd() - 0.5) * 0.45)), rnd()]);
      }
    }
    const mesh = new InstancedMesh(g, new MeshLambertMaterial({ side: DoubleSide }), tufts.length);
    const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), col = new Color();
    tufts.forEach(([x, z, r], i) => {
      const sc = 0.8 + r * 1.2;
      m.compose(new Vector3(x, 0, z), q.setFromAxisAngle(up, r * 20), new Vector3(sc, sc, sc));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.setHSL(0.27 + r * 0.05, 0.5, 0.28 + r * 0.14));
    });
    scene.add(mesh);
  }

  // Bosque: árboles aleatorios fuera del claro (tronco + dos conos, 3 InstancedMesh).
  {
    const trees = [];
    for (let tries = 0; tries < 4000 && trees.length < 230; tries++) {
      const x = (rnd() * 2 - 1) * (HALF - 0.8), z = (rnd() * 2 - 1) * (HALF - 0.8);
      if (Math.hypot(x, z) < CLEARING + rnd() * 3) continue;
      if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 1.6)) continue;
      trees.push([x, z, 1.2 + rnd() * 1.1, rnd()]);
    }
    const trunkG = new CylinderGeometry(0.1, 0.17, 1.4, 6).translate(0, 0.7, 0);
    const coneA = new ConeGeometry(1, 2, 7).translate(0, 1.9, 0), coneB = new ConeGeometry(0.7, 1.7, 7).translate(0, 3.0, 0);
    const mats = [new MeshLambertMaterial({ color: '#3b2a1b' }), new MeshLambertMaterial({ color: '#ffffff' }), new MeshLambertMaterial({ color: '#ffffff' })];
    const ms = [trunkG, coneA, coneB].map((g, i) => new InstancedMesh(g, mats[i], trees.length));
    const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), col = new Color();
    trees.forEach(([x, z, s, r], i) => {
      m.compose(new Vector3(x, 0, z), q.setFromAxisAngle(up, r * 6), new Vector3(s, s, s));
      ms.forEach((mesh, j) => {
        mesh.setMatrixAt(i, m);
        if (j) mesh.setColorAt(i, col.setHSL(0.36 + r * 0.06, 0.45, 0.13 + r * 0.07 + j * 0.02));
      });
      addCircle(x, z, 0.2 * s + 0.08);
    });
    ms.forEach((mesh) => scene.add(mesh));
  }

  // Cielo: luna llena con halo y estrellas, siempre a la misma distancia de la cámara.
  const sky = [];
  {
    const moon = new Mesh(new SphereGeometry(14, 20, 14), new MeshBasicMaterial({ color: '#f4f1dc', fog: false }));
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(235,240,255,.55)');
    gr.addColorStop(1, 'rgba(235,240,255,0)');
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 128, 128);
    const halo = new Sprite(new SpriteMaterial({ map: new CanvasTexture(cv), fog: false, depthWrite: false, transparent: true }));
    halo.scale.setScalar(90);
    const pos = [];
    for (let i = 0; i < 320; i++) {
      const v = new Vector3(rnd() * 2 - 1, rnd() * 0.9 + 0.08, rnd() * 2 - 1).normalize().multiplyScalar(250);
      pos.push(v.x, v.y, v.z);
    }
    const sg = new BufferGeometry();
    sg.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const stars = new Points(sg, new PointsMaterial({ color: '#dfe6ff', size: 1.6, sizeAttenuation: false, fog: false }));
    const p = moonDir.clone().multiplyScalar(240);
    moon.position.copy(p);
    halo.position.copy(p);
    sky.push(moon, halo, stars);
    sky.forEach((o) => scene.add(o));
    sky.base = [p, p, new Vector3()];
  }
  return {
    follow(cam) { sky.forEach((o, i) => o.position.copy(cam).add(sky.base[i])); },
  };
}
