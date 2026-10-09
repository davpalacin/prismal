# Constructor modular (prototipo)

Construcción modular 3D minimalista en un terreno de 5 × 5 m. Three.js sin más dependencias en ejecución.

## Ejecutar
Abre `constructor/index.html` en el navegador (funciona con doble clic, sin servidor).

Para recompilar tras editar `src/` (opcional): `npm install && npm run build` → `dist/app.js`.

## Controles
| Acción | Control |
|---|---|
| Inventario (4 huecos) | Teclas `1`–`4` o clic: **1 Martillo**, **2 Mano**, 3 y 4 vacíos (equivalen a manos libres) |
| Caminar / correr / saltar | `WASD` o flechas / `Shift` / `Espacio` |
| Vista 1ª / 3ª persona | `V` o botón; arrastrar con el ratón para mirar |
| **Con la mano** | `E` acaricia al perrito (cerca de él); la rueda hace zoom |
| **Con el martillo** | Clic izquierdo coloca (verde = válida, rojo = inválida); clic central borra la pieza bajo el puntero; la rueda gira la pieza 45° |
| Elegir pieza | Menú con miniaturas (solo con el martillo) |
| Anclaje de la pieza | `Q` / `Mayús+Q` o ◀ ▶ |
| Colocación | **Libre** por defecto (sin cuadrícula) sobre cualquier punto del terreno; `G` cambia entre Libre / 0,5 m / 1 m. Las piezas siguen imantándose a los anclajes de otras piezas |
| Eliminar | Clic central, o `X` y clic izquierdo; `Esc` vuelve a colocar |
| Zoom | `+` / `−`, botones o `Ctrl`+rueda (con la mano, solo la rueda) |
| Sonido | `M` o botón |

## Mundo y piezas
- Zona de construcción de 50 × 50 m con un claro central **llano** de 11 m de radio; fuera de él el terreno sube en colinas (hasta ~6 m), con rocas y guijarros (algunos sólidos), hierba y un bosque de ~650 árboles que se extiende más allá de la zona jugable.
- Personaje: cuerpo y animaciones de captura de movimiento (idle / caminar / correr) del maniquí **Xbot de Mixamo**, tomado del repositorio de ejemplos de three.js, escalado a 1,5 m y vestido de constructor medieval anciano (túnica de lana, calzas, botas, mandil, cinto, bufanda, pelo y barba blancos con mechones que ondean con el viento, martillo). Salto de ~1,15 m (sube a una pared de 1 m); sube solo desniveles de hasta 0,5 m. Suelos, paredes, columnas, vigas, tablones, puertas y árboles son sólidos; tejados y esquinas de tejado se pueden recorrer como rampas.
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

## Texturas y modelos
- **Texturas CC0 (ambientCG)**, de la biblioteca pmndrs/market-assets: madera (WoodFloor043), tejas (Tiles036), hierba (Grass001) y roca (Rock020), con mapas de normales. El terreno mezcla hierba y roca por pendiente en el shader y añade una segunda escala de detalle.
- **Personaje**: Xbot de Mixamo (`examples/models/gltf/Xbot.glb` de three.js). Licencia de Mixamo: uso libre en proyectos, pero no redistribuible como recurso suelto; si publicas el proyecto, revisa sus condiciones o sustituye `src/tex/man.glb` por otro modelo con huesos Mixamo (`idle`, `walk`, `run`).
- Reducido (animaciones sobrantes y 55 % de triángulos eliminados) e incrustado en `dist/app.js`.

## Rendimiento
Geometría propia con UV por proyección y color por vértice, 4 materiales compartidos (madera, vidrio, llama, tejas; geometría compartida por tipo), hierba y árboles en `InstancedMesh`, 8 luces puntuales fijas para antorchas, sin sombras, y bucle de render continuo (hay personaje, perro, clima y luces animadas).
