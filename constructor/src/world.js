import {
  Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, InstancedMesh,
  Matrix4, Mesh, MeshLambertMaterial, PlaneGeometry, Quaternion, BufferGeometry, Euler, Vector2, Vector3,
  CircleGeometry, CanvasTexture, OctahedronGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { T } from './textures.js';
import { CLEAR_R, POND, fbm, heightAt, pondK } from './terrain.js';

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
    c.setRGB(1.55 + m * 0.4, 1.7 + m * 0.3 - m2 * 0.2, 0.95 + m2 * 0.25).lerp(new Color('#9a7a55'), Math.min(0.8, dirt));
    c.lerp(new Color('#8d7b57'), pondK(x, z) * 0.8);
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
  const terrain = new Mesh(pg, mat);
  terrain.receiveShadow = true;
  scene.add(terrain);
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
    const g = new IcosahedronGeometry(1, 1);
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
    const mat = new MeshLambertMaterial({ map: T.rockMap, normalMap: T.rockN, normalScale: new Vector2(1.2, 1.2), flatShading: true });
    const mesh = new InstancedMesh(g, mat, rocks.length);
    mesh.castShadow = mesh.receiveShadow = true;
    const e = new Euler();
    rocks.forEach(([x, z, s, r], i) => {
      m4.compose(new Vector3(x, heightAt(x, z) - s * 0.25, z), q.setFromEuler(e.set(r * 0.4, r * 20, r * 0.3)), new Vector3(s * (1 + r * 0.5), s * (0.55 + r * 0.4), s * (1.2 - r * 0.3)));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, cl.setHSL(0.1 + r * 0.06, 0.07, 0.62 + r * 0.25));
      if (s > 0.5 && Math.abs(x) < BUILD + 1 && Math.abs(z) < BUILD + 1) addCircle(x, z, s * 0.85);
    });
    scene.add(mesh);
  }

  // Bosque de baja poligonalización: pinos y árboles frondosos de copas agrupadas en
  // lóbulos, con degradado pintado (más claro arriba) y sombreado facetado.
  {
    const variants = [treeVariant(0), treeVariant(1), treeVariant(2), treeVariant(3)];
    const trees = [];
    for (let tries = 0; tries < 9000 && trees.length < 560; tries++) {
      const x = (rnd() * 2 - 1) * (SIZE - 1), z = (rnd() * 2 - 1) * (SIZE - 1);
      if (Math.hypot(x, z) < CLEARING + rnd() * 3) continue;
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r * 1.5) continue;
      if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 2.0)) continue;
      trees.push([x, z, 1.0 + rnd() * 1.1, rnd(), Math.floor(rnd() * 4)]);
    }
    const bark = new MeshLambertMaterial({ map: T.bark, color: '#bfa384' });
    const groups = variants.map((v, k) => {
      const list = trees.filter((t) => t[4] === k);
      const leafMat = new MeshLambertMaterial({ map: T.leaf, vertexColors: true, flatShading: true });
      windify(leafMat, windU, 0.012, 2);
      const trunk = new InstancedMesh(v.trunk, bark, list.length), crown = new InstancedMesh(v.crown, leafMat, list.length);
      for (const m of [trunk, crown]) m.castShadow = m.receiveShadow = true;
      return { list, trunk, crown };
    });
    const e = new Euler();
    for (const g of groups) {
      g.list.forEach(([x, z, s, r], i) => {
        const sx = s * (0.85 + ((r * 7) % 1) * 0.3), sz = s * (0.85 + ((r * 13) % 1) * 0.3);
        m4.compose(new Vector3(x, heightAt(x, z) - 0.1, z), q.setFromEuler(e.set((r - 0.5) * 0.1, r * 6.28, ((r * 5) % 1 - 0.5) * 0.1)), new Vector3(sx, s * (0.9 + ((r * 3) % 1) * 0.25), sz));
        g.trunk.setMatrixAt(i, m4);
        g.crown.setMatrixAt(i, m4);
        g.crown.setColorAt(i, cl.setHSL(0.23 + r * 0.1, 0.5, 0.66 + r * 0.2));
        if (Math.abs(x) < BUILD + 2 && Math.abs(z) < BUILD + 2) addCircle(x, z, 0.2 * s + 0.08);
      });
      scene.add(g.trunk, g.crown);
    }
  }

  // Arbustos y flores silvestres repartidos por el prado.
  {
    const lump = (r, x, y, z) => new IcosahedronGeometry(r, 1).translate(x, y, z);
    const bg = mergeFlat([lump(0.5, 0, 0.32, 0), lump(0.38, 0.4, 0.24, 0.1), lump(0.34, -0.36, 0.22, -0.12), lump(0.3, 0.05, 0.2, 0.38)].map((g) => warpBlob(g, 0.2)), 0.75, 1.7);
    const bm = new MeshLambertMaterial({ map: T.leaf, vertexColors: true, flatShading: true });
    windify(bm, windU, 0.03, 2);
    const spots = [];
    for (let i = 0; i < 340; i++) {
      const a = rnd() * Math.PI * 2, r = (i < 120 ? CLEAR_R * 0.55 : CLEARING) + rnd() * (SIZE - 4 - CLEARING);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r * 1.3) continue;
      spots.push([x, z, 0.5 + rnd() * 0.9, rnd()]);
    }
    const bushes = new InstancedMesh(bg, bm, spots.length);
    bushes.castShadow = bushes.receiveShadow = true;
    spots.forEach(([x, z, s, r], i) => {
      m4.compose(new Vector3(x, heightAt(x, z) - 0.05, z), q.setFromAxisAngle(up, r * 6.28), new Vector3(s, s * (0.8 + r * 0.4), s));
      bushes.setMatrixAt(i, m4);
      bushes.setColorAt(i, cl.setHSL(0.22 + r * 0.08, 0.5, 0.62 + r * 0.22));
    });
    scene.add(bushes);

    // flores: tallo + capullo en una sola malla
    const stem = new CylinderGeometry(0.005, 0.007, 0.12, 4).translate(0, 0.06, 0), bloom = new OctahedronGeometry(0.05, 0).translate(0, 0.13, 0).scale(1, 0.7, 1);
    const fg = mergeFlat([stem, bloom], 1, 1);
    { const p = fg.attributes.position, c = fg.attributes.color; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.105) c.setXYZ(i, 0.45, 0.75, 0.3); }
    const flowers = [];
    for (let i = 0; i < 1500; i++) {
      const cx = (rnd() - 0.5) * 2 * (SIZE - 4), cz = (rnd() - 0.5) * 2 * (SIZE - 4);
      if (i % 3 === 0) for (let k = 0; k < 6; k++) flowers.push([cx + (rnd() - 0.5) * 1.2, cz + (rnd() - 0.5) * 1.2, rnd()]);
      else flowers.push([cx, cz, rnd()]);
    }
    const fm = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
    windify(fm, windU, 0.5, 1);
    const fl = new InstancedMesh(fg, fm, flowers.length);
    const palette = ['#f2d94a', '#f7f2e6', '#e9c43a', '#b9a3e6', '#ffffff', '#f09a52'];
    flowers.forEach(([x, z, r], i) => {
      const sc = 0.9 + r * 0.9;
      m4.compose(new Vector3(x, heightAt(x, z), z), q.setFromAxisAngle(up, r * 20), new Vector3(sc, sc, sc));
      fl.setMatrixAt(i, m4);
      fl.setColorAt(i, cl.set(palette[Math.floor(r * 97) % palette.length]));
    });
    scene.add(fl);
  }

  // Estanque: disco de agua translúcido con borde difuminado sobre la hondonada.
  {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const c2 = cv.getContext('2d'), gr = c2.createRadialGradient(64, 64, 20, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.75, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c2.fillStyle = gr;
    c2.fillRect(0, 0, 128, 128);
    const water = new Mesh(new CircleGeometry(POND.r * 1.55, 48).rotateX(-Math.PI / 2),
      new MeshLambertMaterial({ color: '#8fcfd0', emissive: '#2c5f66', transparent: true, opacity: 0.8, alphaMap: new CanvasTexture(cv), depthWrite: false }));
    water.position.set(POND.x, -0.12, POND.z);
    scene.add(water);
  }
}

// Deforma los vértices de una malla con ruido para romper formas perfectas.
function warpBlob(g, amp) {
  const p = g.attributes.position, v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const f = 1 + (fbm(v.x * 3 + 4.1, v.z * 3 + v.y * 2) - 0.47) * amp * 3;
    p.setXYZ(i, v.x * f, v.y * (0.9 + (f - 1) * 0.5), v.z * f);
  }
  return g;
}

// Une geometrías sin índice y hornea un degradado de color vertical (oscuro abajo,
// claro arriba) como pintado a mano: `lo`/`hi` son los brillos extremos.
function mergeFlat(list, lo, hi) {
  const parts = list.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; });
  const m = mergeGeometries(parts);
  m.computeBoundingBox();
  const bb = m.boundingBox, p = m.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) - bb.min.y) / Math.max(1e-6, bb.max.y - bb.min.y), k = lo + (hi - lo) * Math.pow(t, 0.8);
    col.set([k, k, k], i * 3);
  }
  m.setAttribute('color', new Float32BufferAttribute(col, 3));
  return m;
}

// Geometría orgánica de árboles: copas en lóbulos, ruido radial y troncos curvados.
function treeVariant(kind) {
  const off = kind * 17.3;
  const warp = (g, amp, droop) => {
    const p = g.attributes.position, v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const r = Math.hypot(v.x, v.z), a = Math.atan2(v.z, v.x);
      const f = 1 + (fbm(Math.cos(a) * 1.6 + off + v.y * 0.7, Math.sin(a) * 1.6 + v.y * 0.5) - 0.47) * amp * 2;
      v.x *= f; v.z *= f;
      v.y -= droop * r * r + (fbm(v.x * 3 + off, v.z * 3) - 0.47) * 0.14;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  };
  const trunk = new CylinderGeometry(0.075, 0.18, 2.4, 7, 6);
  {
    const p = trunk.attributes.position, v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const y = v.y + 1.2, flare = 1 + Math.max(0, 0.4 - y) * 1.8;
      const n = 1 + (fbm(v.x * 6 + off, v.y * 3 + v.z * 6) - 0.47) * 0.4;
      p.setXYZ(i, v.x * flare * n + Math.sin(y * 1.7 + off) * 0.06 * y, y, v.z * flare * n + Math.cos(y * 1.3 + off) * 0.05 * y);
    }
    trunk.computeVertexNormals();
  }
  let parts;
  if (kind < 2) {                        // pinos de copas apiladas e irregulares
    const tiers = kind ? [[1.0, 1.35, 1.5], [0.85, 1.3, 2.2], [0.68, 1.2, 2.9], [0.5, 1.1, 3.55], [0.3, 0.9, 4.1]]
      : [[1.2, 1.7, 1.45], [0.95, 1.5, 2.45], [0.68, 1.35, 3.35]];
    parts = tiers.map(([r, h, y], i) => warp(new ConeGeometry(r, h, 9, 3).translate(0, y, 0), 0.2, 0.1 / r).rotateY(i * 1.3));
  } else {                               // frondoso: racimos de lóbulos en varios pisos
    const blobs = kind === 2
      ? [[0, 2.7, 0, 1.0], [0.75, 2.35, 0.2, 0.72], [-0.7, 2.4, -0.3, 0.75], [0.15, 3.35, 0.35, 0.65], [-0.25, 2.2, 0.8, 0.66], [0.3, 2.1, -0.75, 0.62], [-0.15, 3.0, -0.45, 0.6]]
      : [[0.1, 2.9, 0, 1.1], [0.95, 2.5, 0.3, 0.78], [-0.9, 2.55, 0.1, 0.8], [0.2, 3.6, -0.1, 0.7], [0.0, 2.35, 0.95, 0.68], [-0.4, 2.3, -0.9, 0.7], [0.6, 3.2, 0.7, 0.55], [-0.6, 3.25, -0.5, 0.58]];
    parts = blobs.map(([x, y, z, r], i) => warp(new IcosahedronGeometry(r, 1).translate(x, y, z), 0.3, 0).rotateY(i));
  }
  return { trunk, crown: mergeFlat(parts, 0.8, 2.0) };
}
