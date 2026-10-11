import { BackSide, DataTexture, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RGBAFormat, SkinnedMesh, Uniform } from 'three';

// Aspecto ilustrado para personajes: sombreado por bandas (cel-shading) y
// contorno de tinta con el método del casco invertido.
const ramp = new DataTexture(new Uint8Array([120, 120, 120, 255, 185, 185, 185, 255, 255, 255, 255, 255]), 3, 1, RGBAFormat);
ramp.minFilter = ramp.magFilter = NearestFilter;
ramp.needsUpdate = true;

export const toon = (color, o = {}) => new MeshToonMaterial({ color, gradientMap: ramp, ...o });

// Espesor del contorno (unidades del objeto): un uniform por personaje, que se
// actualiza cada fotograma según la distancia a la cámara.
export const outlineU = new Uniform(0.01);       // perro
export const outlineHumanU = new Uniform(0.01);  // personaje (modelo escalado)
const inkFor = (u) => {
  const m = new MeshBasicMaterial({ color: '#17120e', side: BackSide });
  m.customProgramCacheKey = () => 'ink';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOutline = u;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uOutline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uOutline;');
  };
  return m;
};
const inkFlat = new MeshBasicMaterial({ color: '#17120e', side: BackSide });

// Añade contorno a todas las mallas de `root`. Las cajas (aristas vivas) usan una
// copia ligeramente más grande; el resto empuja los vértices por la normal.
export function addOutlines(root, u = outlineU, skip = () => false) {
  const inkMat = inkFor(u);
  const list = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.ink && !skip(o)) list.push(o); });
  for (const o of list) {
    let ink;
    if (o.isSkinnedMesh) {
      ink = new SkinnedMesh(o.geometry, inkMat);
      ink.bind(o.skeleton, o.bindMatrix);
      ink.frustumCulled = false;
      ink.userData.ink = true;
      o.parent.add(ink);
      continue;
    }
    if (o.geometry.type === 'BoxGeometry') { ink = new Mesh(o.geometry, inkFlat); ink.scale.setScalar(1.09); }
    else ink = new Mesh(o.geometry, inkMat);
    ink.userData.ink = true;
    o.add(ink);
  }
}
