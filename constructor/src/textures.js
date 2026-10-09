import { RepeatWrapping, SRGBColorSpace, TextureLoader, LinearSRGBColorSpace } from 'three';
import woodUrl from './tex/wood.jpg';
import woodNUrl from './tex/woodN.jpg';
import tilesUrl from './tex/tiles.jpg';
import tilesNUrl from './tex/tilesN.jpg';
import grassUrl from './tex/grass.jpg';
import rockUrl from './tex/rock.jpg';

// Texturas CC0 de ambientCG (WoodFloor043, Tiles036, Grass001, Rock020),
// tomadas de la biblioteca pmndrs/market-assets y reducidas a ≤1024 px.
// Van incrustadas como data URL: no hay peticiones externas.
const loader = new TextureLoader();
const pending = [];

function tex(url, repeat, srgb = true) {
  let done;
  pending.push(new Promise((ok) => { done = ok; }));
  const t = loader.load(url, () => done());
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// 1 unidad de UV = 1 m: `repeat` = repeticiones por metro.
export const T = {
  wood: tex(woodUrl, [0.5, 1]),
  woodN: tex(woodNUrl, [0.5, 1], false),
  tiles: tex(tilesUrl, [1.5, 1.5]),
  tilesN: tex(tilesNUrl, [1.5, 1.5], false),
  grass: tex(grassUrl, [25, 25]),
  rock: tex(rockUrl, [12, 1]),
  bark: tex(rockUrl, [1, 1]),
  leaf: tex(grassUrl, [1, 1]),
};
export const texturesReady = () => Promise.all(pending);
