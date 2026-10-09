# Constructor modular (prototipo)

Construcción modular 3D minimalista en un terreno de 5 × 5 m. Three.js sin más dependencias en ejecución.

## Ejecutar
Abre `constructor/index.html` en el navegador (funciona con doble clic, sin servidor).

Para recompilar tras editar `src/` (opcional): `npm install && npm run build` → `dist/app.js`.

## Controles
| Acción | Control |
|---|---|
| Elegir pieza | Menú (suelo, pared, columna, viga, tablón horizontal/vertical, diagonal, tejado 26°/45°; cada una en 1 m y 0,5 m) |
| Colocar | Clic izquierdo (verde = válida, rojo = inválida) |
| Girar 90° | `R` (`Mayús+R` al revés) o botón |
| Ajuste 1 m / 0,5 m | `G` o botones |
| Altura del plano de trabajo | `Q`/`E` (o `AvPág`/`RePág`) o ▼▲; la rejilla muestra el nivel |
| Eliminar | `X` o botón «Eliminar»; clic sobre la pieza resaltada en rojo; `Esc` vuelve a colocar |
| Orbitar / desplazar / zoom | Arrastrar izq. / clic der. o `Mayús`+arrastrar / rueda |

## Medidas y encaje
- Metros, cuadrícula alineada con el terreno (esquinas en vértices de 1 m; subdivisión de 0,5 m).
- La pieza se coloca sobre el plano de trabajo (nivel `Altura`) y se ajusta a la rejilla; girar es sobre su centro.
- Grosores centrados sobre las líneas de rejilla: paredes, vigas, columnas, tablones y diagonales se unen por ejes, extremos y esquinas, también a distintas alturas.
- Suelos: 10 cm de espesor sobre el nivel; paredes y columnas arrancan en el nivel.
- Diagonales: de esquina a esquina de un módulo de 1 × 1 o 0,5 × 0,5 (4 giros = `/` y `\` en ambos planos).
- Tejados (una vertiente, sin techos planos): proyección horizontal de 1 m; altura = 1 m × tan(ángulo): 26° → 0,5 m (26,57°, 1:2), 45° → 1 m. Ancho 1 o 0,5 m. Alero y cumbrera caen en niveles de rejilla.
- No se admiten duplicados: misma pieza con los mismos puntos de definición (un giro de 180° de una pieza simétrica también cuenta). Tampoco fuera del terreno ni por encima de 4 m.

## Rendimiento
Geometrías primitivas con color por vértice, un único material compartido para las piezas (geometría compartida por tipo), hierba en un solo `InstancedMesh`, una luz hemisférica + una direccional sin sombras, y renderizado solo cuando cambia la escena o la cámara.
