# Constructor modular (prototipo)

Construcción modular 3D minimalista en un terreno de 5 × 5 m. Three.js sin más dependencias en ejecución.

## Ejecutar
Abre `constructor/index.html` en el navegador (funciona con doble clic, sin servidor).

Para recompilar tras editar `src/` (opcional): `npm install && npm run build` → `dist/app.js`.

## Controles
| Acción | Control |
|---|---|
| Elegir pieza | Menú con miniatura de cada pieza (suelo, pared, columna, viga, tablón, diagonal, tejado 26°/45°; en 1 m y 0,5 m) |
| Colocar | Clic izquierdo (verde = válida, rojo = inválida) |
| Anclaje de la pieza | `Q` (siguiente), `Mayús+Q` (anterior) o ◀ ▶ |
| Girar (8 pasos de 45°) | Rueda del ratón, `R` / `Mayús+R` o botón |
| Ajuste 1 m / 0,5 m (rejilla del suelo) | `G` o botones |
| Eliminar | `X` o botón; clic sobre la pieza resaltada en rojo; `Esc` vuelve a colocar |
| Orbitar / desplazar | Arrastrar izq. / clic der. o `Mayús`+arrastrar |
| Zoom | `Ctrl`+rueda, botón central arrastrando, `+` / `−` o botones (en modo eliminar, la rueda hace zoom) |

## Anclajes y encaje
- Mapa de 50 × 50 m, altura máxima 10 m.
- Cada pieza tiene varios puntos de anclaje en la rejilla de 0,5 m (esquinas, bordes, caras; el tejado, sus 4 bordes; la diagonal, las 4 esquinas y el centro).
- El ratón elige el anclaje de una pieza ya colocada más cercano (radio 26 px, punto amarillo); si no hay ninguno, el vértice de la rejilla del suelo.
- La pieza en vista previa se coloca de modo que **su** anclaje (`Q`) coincida con ese punto, y gira sobre él. Así un tejado se une a la parte alta de una pared o columna, una viga a un lado de un suelo, etc.
- Medidas: piezas de 1 y 0,5 m; tejados con proyección horizontal de 1 m (26° → 0,5 m de altura, 26,57°; 45° → 1 m).
- No se admiten duplicados (misma pieza con los mismos puntos de definición), ni piezas fuera del terreno o por debajo del suelo.

## Rendimiento
Geometrías primitivas con color por vértice, un único material compartido para las piezas (geometría compartida por tipo), hierba en un solo `InstancedMesh`, una luz hemisférica + una direccional sin sombras, y renderizado solo cuando cambia la escena o la cámara.
