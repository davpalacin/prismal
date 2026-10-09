import { BufferGeometry, DirectionalLight, HemisphereLight, Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';

// Genera una miniatura (data URL) por pieza con un renderer temporal que se
// destruye al terminar: se hace una sola vez al arrancar.
export function makeThumbs(ids, geometryOf, materialFor) {
  const r = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(112, 112);
  const sc = new Scene();
  sc.add(new HemisphereLight('#ffffff', '#8a7a5a', 1.6));
  const sun = new DirectionalLight('#fff0d4', 1.9);
  sun.position.set(3, 6, 2);
  sc.add(sun);
  const mesh = new Mesh(new BufferGeometry());
  sc.add(mesh);
  const cam = new PerspectiveCamera(30, 1, 0.1, 50), dir = new Vector3(0.8, 0.65, 1).normalize(), out = {};
  for (const id of ids) {
    const g = (mesh.geometry = geometryOf(id)), s = g.boundingSphere;
    mesh.material = materialFor(g);
    cam.position.copy(s.center).addScaledVector(dir, (s.radius / Math.sin(Math.PI / 12)) * 1.02);
    cam.lookAt(s.center);
    r.render(sc, cam);
    out[id] = r.domElement.toDataURL();
  }
  r.dispose();
  r.forceContextLoss();
  return out;
}
