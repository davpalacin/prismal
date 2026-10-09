# Constructor modular (prototipo)

Construcción modular 3D minimalista en un terreno de 5 × 5 m. Three.js sin más dependencias en ejecución.

## Ejecutar
Abre `constructor/index.html` en el navegador (funciona con doble clic, sin servidor).

Para recompilar tras editar `src/` (opcional): `npm install && npm run build` → `dist/app.js`.

## Controles
| Acción | Control |
|---|---|
| Caminar / correr / saltar | `WASD` o flechas / `Shift` / `Espacio` |
| Vista 1ª / 3ª persona | `V` o botón |
| Mirar | Arrastrar con el ratón (clic corto = colocar) |
| Acariciar al perrito | `E` (cerca de él) |
| Elegir pieza | Menú con miniaturas |
| Colocar | Clic izquierdo (verde = válida, rojo = inválida) |
| Anclaje de la pieza | `Q` (siguiente), `Mayús+Q` (anterior) o ◀ ▶ |
| Girar (8 pasos de 45°) | Rueda del ratón, `R` / `Mayús+R` o botón |
| Ajuste 1 m / 0,5 m (rejilla del suelo) | `G` o botones |
| Eliminar | **Clic central (rueda)** sobre la pieza, en cualquier modo; o `X` / botón y clic izquierdo; `Esc` vuelve a colocar |
| Sonido | `M` o botón (viento, lluvia y truenos generados por código) |
| Zoom (3ª persona) | `Ctrl`+rueda, `+` / `−` o botones (en modo eliminar, la rueda) |

## Mundo y piezas
- Noche con luna llena y niebla; mapa de 50 × 50 m con un claro central de 9 m de radio y bosque aleatorio alrededor.
- Personaje: constructor anciano de 1,5 m con pelo y barba blancos. Salto de ~1,15 m (sube a una pared de 1 m); sube solo desniveles de hasta 0,5 m. Suelos, paredes, columnas, vigas, tablones, puertas y árboles son sólidos; tejados y esquinas de tejado se pueden recorrer como rampas.
- Perrito dorado que te sigue por detrás a la derecha, se aparta si estorba, mueve la cola y se deja acariciar.
- Piezas nuevas: paredes con corte diagonal 26° y 45° (1 y 0,5 m), esquinas de tejado exterior (cumbrera) e interior (valle) de 1 × 1 m en 26° y 45°, puerta de 1 × 2 m, pared de vidrio de 0,5 × 1 m y antorcha.
- Antorchas: iluminan con 8 luces puntuales reutilizadas (las 8 más cercanas a la cámara); las demás conservan la llama pero no luz.

## Anclajes y encaje
- Mapa de 50 × 50 m, altura máxima 10 m.
- Cada pieza tiene varios puntos de anclaje en la rejilla de 0,5 m (esquinas, bordes, caras; tejado: sus 4 bordes; diagonal: 4 esquinas y centro; pared con corte: su silueta).
- El ratón elige el anclaje de una pieza ya colocada más cercano (radio 26 px, punto amarillo); si no hay ninguno, el vértice de la rejilla del suelo.
- La pieza en vista previa se coloca de modo que **su** anclaje (`Q`) coincida con ese punto, y gira sobre él.
- Tejados con proyección horizontal de 1 m (26° → 0,5 m de altura, 26,57°; 45° → 1 m). Las paredes con corte siguen exactamente esa pendiente y las esquinas comparten sus planos con el tejado normal, por lo que encajan.
- No se admiten duplicados, ni piezas fuera del terreno o por debajo del suelo.

## Clima y ambiente
Panel arriba a la derecha: **Hora** (día / noche) y **Clima** (despejado, brisa, niebla, lluvia, tormenta). `Auto` los va cambiando solo (cada 70–140 s) con transiciones suaves; elegir uno a mano lo desactiva.
- **Brisa/viento:** ráfagas con dirección que deriva. Mueven la barba (13 mechones), la melena, la bufanda, las orejas y cola del perro, la hierba y las copas de los árboles. Al correr, la barba vuela hacia atrás.
- **Lluvia y tormenta:** 2200 trazos de lluvia alrededor de la cámara, relámpagos con trueno diferido, cielo cubierto.
- **Niebla**, nubes a la deriva, sol de día; luna y estrellas de noche.

## Texturas (CC0)
Madera (WoodFloor043), tejas (Tiles036), hierba (Grass001) y roca/corteza (Rock020), con mapas de normales en madera y tejas, de **ambientCG** (licencia CC0), obtenidas de la biblioteca pmndrs/market-assets (reducidas y guardadas en `src/tex/`, incrustadas en `dist/app.js`). Las luces de antorcha, la piel, la ropa y el cuero usan color plano o la textura de madera tintada: la biblioteca no trae telas ni piel con UV.

## Rendimiento
Geometría propia con UV por proyección y color por vértice, 4 materiales compartidos (madera, vidrio, llama, tejas; geometría compartida por tipo), hierba y árboles en `InstancedMesh`, 8 luces puntuales fijas para antorchas, sin sombras, y bucle de render continuo (hay personaje, perro, clima y luces animadas).
