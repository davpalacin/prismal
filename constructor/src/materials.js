import { MeshBasicMaterial, MeshLambertMaterial, Vector2 } from 'three';
import { T } from './textures.js';

// Materiales compartidos. Madera y tejas llevan textura + mapa de normales
// (ambientCG, CC0) multiplicada por el color por vértice de cada pieza.
export const woodMat = new MeshLambertMaterial({ vertexColors: true, map: T.wood, normalMap: T.woodN, normalScale: new Vector2(0.8, 0.8) });
export const glassMat = new MeshLambertMaterial({ color: '#9fd4e8', transparent: true, opacity: 0.35, depthWrite: false });
export const flameMat = new MeshBasicMaterial({ vertexColors: true });
export const roofMat = new MeshLambertMaterial({ vertexColors: true, map: T.tiles, normalMap: T.tilesN, normalScale: new Vector2(1, 1) });
export const pieceMats = [woodMat, glassMat, flameMat, roofMat];
export const matFor = (g) => (g.groups.length ? pieceMats : woodMat);
