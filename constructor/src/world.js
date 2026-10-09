import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  InstancedMesh, Matrix4, Mesh, MeshLambertMaterial, PlaneGeometry, Quaternion, Vector2, Vector3,
} from 'three';
import { HALF } from './pieces.js';
import { T } from './textures.js';

export const CLEARING = 9;   // radio del claro central sin árboles

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Balanceo por viento en el vertex shader (hierba y árboles): desplaza según la
// altura del vértice y una fase por instancia. `windU` lo actualiza el clima.
function windify(mat, windU, k, pw) {
  mat.customProgramCacheKey = () => `wind${k}${pw}`;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, windU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind; uniform vec2 uDir;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = 0.0;
        #ifdef USE_INSTANCING
        ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
        #endif
        float sw = (sin(uTime * 1.8 + ph) + 0.5 * sin(uTime * 3.1 + ph * 1.7) + 0.35) * (0.15 + uWind) * ${k.toFixed(4)} * pow(max(position.y, 0.0), ${pw.toFixed(1)});
        transformed.x += sw * uDir.x; transformed.z += sw * uDir.y;`);
  };
}

// Terreno texturizado, hierba y bosque aleatorio alrededor de un claro.
export function buildWorld(scene, addCircle, windU) {
  // Terreno: plano con textura de hierba y colores por vértice (parches de tierra
  // en el claro, matices en el resto) sobre un bloque de tierra.
  const soil = new MeshLambertMaterial({ color: '#b59a7c', map: T.rock });
  const block = new Mesh(new BoxGeometry(2 * HALF, 0.3, 2 * HALF), soil);
  block.position.y = -0.16;
  scene.add(block);
  const seg = 100, pg = new PlaneGeometry(2 * HALF, 2 * HALF, seg, seg).rotateX(-Math.PI / 2);
  const pos = pg.attributes.position, col = new Float32Array(pos.count * 3), c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
    const n = Math.sin(x * 0.7) * Math.cos(z * 0.9) * 0.5 + Math.sin(x * 2.3 + z * 1.7) * 0.25;
    const dirt = Math.max(0, 1 - r / (CLEARING * 0.55)) * (0.55 + 0.25 * n);          // tierra pisada en el centro
    c.setRGB(1.25 + n * 0.2, 1.45 + n * 0.2, 0.95 + n * 0.15).lerp(new Color('#9a7a55'), Math.min(0.85, dirt));
    col.set([c.r, c.g, c.b], i * 3);
  }
  pg.setAttribute('color', new Float32BufferAttribute(col, 3));
  scene.add(new Mesh(pg, new MeshLambertMaterial({ map: T.grass, vertexColors: true })));

  // Hierba: grupos de matas triangulares en un único InstancedMesh.
  {
    const p = [], nor = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), h = 0.1 + (i % 3) * 0.04, lean = 0.05 + (i % 2) * 0.03;
      p.push(ca * 0.015 - sa * 0.02, 0, sa * 0.015 + ca * 0.02, ca * 0.015 + sa * 0.02, 0, sa * 0.015 - ca * 0.02,
        ca * (0.015 + lean), h, sa * (0.015 + lean));
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
    const tufts = [];
    for (let k = 0; k < 280; k++) {
      const cx = (rnd() - 0.5) * (2 * HALF - 0.4), cz = (rnd() - 0.5) * (2 * HALF - 0.4);
      for (let j = 0, n = 4 + Math.floor(rnd() * 4); j < n; j++) {
        tufts.push([Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cx + (rnd() - 0.5) * 0.45)),
          Math.max(-HALF + 0.05, Math.min(HALF - 0.05, cz + (rnd() - 0.5) * 0.45)), rnd()]);
      }
    }
    const mat = new MeshLambertMaterial({ side: DoubleSide });
    windify(mat, windU, 0.5, 1);
    const mesh = new InstancedMesh(g, mat, tufts.length);
    const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), cl = new Color();
    tufts.forEach(([x, z, r], i) => {
      const sc = 0.8 + r * 1.2;
      m.compose(new Vector3(x, 0, z), q.setFromAxisAngle(up, r * 20), new Vector3(sc, sc, sc));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, cl.setHSL(0.25 + r * 0.06, 0.55, 0.3 + r * 0.16));
    });
    scene.add(mesh);
  }

  // Bosque: tronco con textura de corteza + dos conos con textura de follaje.
  {
    const trees = [];
    for (let tries = 0; tries < 4000 && trees.length < 230; tries++) {
      const x = (rnd() * 2 - 1) * (HALF - 0.8), z = (rnd() * 2 - 1) * (HALF - 0.8);
      if (Math.hypot(x, z) < CLEARING + rnd() * 3) continue;
      if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 1.6)) continue;
      trees.push([x, z, 1.2 + rnd() * 1.1, rnd()]);
    }
    const trunkG = new CylinderGeometry(0.1, 0.17, 1.4, 7, 1).translate(0, 0.7, 0);
    const coneA = new ConeGeometry(1, 2, 8, 2).translate(0, 1.9, 0), coneB = new ConeGeometry(0.7, 1.7, 8, 2).translate(0, 3.0, 0);
    const leaf = () => new MeshLambertMaterial({ map: T.leaf });
    const matA = leaf(), matB = leaf();
    windify(matA, windU, 0.012, 2);
    windify(matB, windU, 0.012, 2);
    const mats = [new MeshLambertMaterial({ map: T.bark, color: '#c9a37a' }), matA, matB];
    const ms = [trunkG, coneA, coneB].map((g, i) => new InstancedMesh(g, mats[i], trees.length));
    const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), cl = new Color();
    trees.forEach(([x, z, s, r], i) => {
      m.compose(new Vector3(x, 0, z), q.setFromAxisAngle(up, r * 6), new Vector3(s, s, s));
      ms.forEach((mesh, j) => {
        mesh.setMatrixAt(i, m);
        if (j) mesh.setColorAt(i, cl.setHSL(0.34 + r * 0.06, 0.5, 0.2 + r * 0.1 + j * 0.03));
      });
      addCircle(x, z, 0.2 * s + 0.08);
    });
    ms.forEach((mesh) => scene.add(mesh));
  }
}
