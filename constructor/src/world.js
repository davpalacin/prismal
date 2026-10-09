import {
  Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, InstancedMesh,
  Matrix4, Mesh, MeshLambertMaterial, PlaneGeometry, Quaternion, BufferGeometry, Euler, Vector2, Vector3,
} from 'three';
import { T } from './textures.js';
import { CLEAR_R, fbm, heightAt } from './terrain.js';

export const CLEARING = CLEAR_R + 1;   // radio del claro sin árboles
const SIZE = 55;                        // el terreno visible llega a ±55 m (se construye en ±25)
const BUILD = 25;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Balanceo por viento en el vertex shader (hierba y árboles).
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

// Terreno con relieve: hierba + roca según la pendiente (mezcla en el shader),
// detalle a dos escalas y normal map; tierra pisada en el claro.
function buildTerrain(scene) {
  const seg = 220, pg = new PlaneGeometry(2 * SIZE, 2 * SIZE, seg, seg).rotateX(-Math.PI / 2);
  const pos = pg.attributes.position, n = pos.count, col = new Float32Array(n * 3), splat = new Float32Array(n), c = new Color();
  for (let i = 0; i < n; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  pg.computeVertexNormals();
  const nor = pg.attributes.normal;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z), h = pos.getY(i);
    const m = fbm(x * 0.45, z * 0.45), m2 = fbm(x * 0.09 + 5, z * 0.09);
    const slope = 1 - nor.getY(i);
    splat[i] = Math.min(1, smooth(0.07, 0.2, slope + (m - 0.5) * 0.12) + smooth(2.8, 5.2, h + m2 * 1.5) * 0.4);
    const dirt = Math.max(0, 1 - r / (CLEAR_R * 0.62)) * (0.5 + 0.5 * m);                    // tierra pisada del claro
    c.setRGB(1.15 + m * 0.35, 1.3 + m * 0.3 - m2 * 0.15, 0.85 + m2 * 0.2).lerp(new Color('#9a7a55'), Math.min(0.8, dirt));
    col.set([c.r, c.g, c.b], i * 3);
  }
  pg.setAttribute('color', new Float32BufferAttribute(col, 3));
  pg.setAttribute('aSplat', new Float32BufferAttribute(splat, 1));
  const mat = new MeshLambertMaterial({ map: T.grass, normalMap: T.grassN, normalScale: new Vector2(1.1, 1.1), vertexColors: true });
  mat.customProgramCacheKey = () => 'terrain';
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRock = { value: T.rockMap };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSplat; varying float vSplat;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = aSplat;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uRock; varying float vSplat;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec3 g1 = texture2D(map, vMapUv).rgb;
          vec3 g2 = texture2D(map, vMapUv * 7.3).rgb;
          vec3 rk = texture2D(uRock, vMapUv * 0.8).rgb;
          vec3 base = g1 * mix(0.7, 1.35, g2.g);
          diffuseColor.rgb *= mix(base, rk * 1.25, vSplat);
        #endif`);
  };
  scene.add(new Mesh(pg, mat));
}

// Terreno, hierba, rocas y bosque aleatorio alrededor del claro.
export function buildWorld(scene, addCircle, windU) {
  buildTerrain(scene);
  const m4 = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), cl = new Color();

  // Hierba: grupos de matas en un único InstancedMesh, sobre el relieve.
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
    for (let k = 0; k < 900; k++) {
      const cx = (rnd() - 0.5) * 2 * (SIZE - 1), cz = (rnd() - 0.5) * 2 * (SIZE - 1);
      for (let j = 0, nn = 4 + Math.floor(rnd() * 5); j < nn; j++) tufts.push([cx + (rnd() - 0.5) * 0.5, cz + (rnd() - 0.5) * 0.5, rnd()]);
    }
    const mat = new MeshLambertMaterial({ side: DoubleSide });
    windify(mat, windU, 0.5, 1);
    const mesh = new InstancedMesh(g, mat, tufts.length);
    tufts.forEach(([x, z, r], i) => {
      const sc = 0.9 + r * 1.5;
      m4.compose(new Vector3(x, heightAt(x, z), z), q.setFromAxisAngle(up, r * 20), new Vector3(sc, sc, sc));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, cl.setHSL(0.24 + r * 0.07, 0.55, 0.28 + r * 0.17));
    });
    scene.add(mesh);
  }

  // Rocas y guijarros: icosaedros deformados con textura y normal map de roca.
  {
    const g = new IcosahedronGeometry(1, 2);
    const p = g.attributes.position, v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 0.8 + fbm(v.x * 2.1 + 3, v.z * 2.1 + v.y) * 0.55;
      p.setXYZ(i, v.x * k, v.y * k * (v.y < 0 ? 0.5 : 1), v.z * k);
    }
    g.computeVertexNormals();
    const rocks = [];
    for (let i = 0; i < 170; i++) {
      const a = rnd() * Math.PI * 2, r = i < 70 ? 3 + rnd() * 20 : 10 + rnd() * (SIZE - 12);
      rocks.push([Math.cos(a) * r, Math.sin(a) * r, (i % 5 === 0 ? 0.6 + rnd() * 0.9 : 0.15 + rnd() * 0.45), rnd()]);
    }
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * (SIZE - 4);
      rocks.push([Math.cos(a) * r, Math.sin(a) * r, 0.04 + rnd() * 0.09, rnd()]);
    }
    const mat = new MeshLambertMaterial({ map: T.rockMap, normalMap: T.rockN, normalScale: new Vector2(1.4, 1.4) });
    const mesh = new InstancedMesh(g, mat, rocks.length);
    const e = new Euler();
    rocks.forEach(([x, z, s, r], i) => {
      m4.compose(new Vector3(x, heightAt(x, z) - s * 0.25, z), q.setFromEuler(e.set(r * 0.4, r * 20, r * 0.3)), new Vector3(s * (1 + r * 0.5), s * (0.55 + r * 0.4), s * (1.2 - r * 0.3)));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, cl.setHSL(0.09 + r * 0.05, 0.12, 0.5 + r * 0.22));
      if (s > 0.5 && Math.abs(x) < BUILD + 1 && Math.abs(z) < BUILD + 1) addCircle(x, z, s * 0.85);
    });
    scene.add(mesh);
  }

  // Bosque: tronco con corteza + dos conos con follaje, sobre el relieve.
  {
    const trees = [];
    for (let tries = 0; tries < 9000 && trees.length < 650; tries++) {
      const x = (rnd() * 2 - 1) * (SIZE - 1), z = (rnd() * 2 - 1) * (SIZE - 1);
      if (Math.hypot(x, z) < CLEARING + rnd() * 3) continue;
      if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 1.6)) continue;
      trees.push([x, z, 1.2 + rnd() * 1.2, rnd()]);
    }
    const trunkG = new CylinderGeometry(0.1, 0.17, 1.4, 7, 1).translate(0, 0.7, 0);
    const coneA = new ConeGeometry(1, 2, 8, 2).translate(0, 1.9, 0), coneB = new ConeGeometry(0.7, 1.7, 8, 2).translate(0, 3.0, 0);
    const leaf = () => new MeshLambertMaterial({ map: T.leaf });
    const matA = leaf(), matB = leaf();
    windify(matA, windU, 0.012, 2);
    windify(matB, windU, 0.012, 2);
    const mats = [new MeshLambertMaterial({ map: T.bark, color: '#c9a37a' }), matA, matB];
    const ms = [trunkG, coneA, coneB].map((g, i) => new InstancedMesh(g, mats[i], trees.length));
    trees.forEach(([x, z, s, r], i) => {
      m4.compose(new Vector3(x, heightAt(x, z) - 0.1, z), q.setFromAxisAngle(up, r * 6), new Vector3(s, s, s));
      ms.forEach((mesh, j) => {
        mesh.setMatrixAt(i, m4);
        if (j) mesh.setColorAt(i, cl.setHSL(0.34 + r * 0.06, 0.5, 0.2 + r * 0.1 + j * 0.03));
      });
      if (Math.abs(x) < BUILD + 2 && Math.abs(z) < BUILD + 2) addCircle(x, z, 0.2 * s + 0.08);
    });
    ms.forEach((mesh) => scene.add(mesh));
  }
}
