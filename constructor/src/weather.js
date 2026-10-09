import {
  AdditiveBlending, BufferGeometry, CanvasTexture, Color, DirectionalLight, Float32BufferAttribute, FogExp2,
  HemisphereLight, LineSegments, LineBasicMaterial, Mesh, MeshBasicMaterial, Points, PointsMaterial, SphereGeometry,
  Sprite, SpriteMaterial, Vector3,
} from 'three';

// Hora del día (paleta base) y clima (modificadores). Todo se interpola poco a
// poco, así los cambios son graduales.
const TIME = {
  dia: { sky: '#8ec5ee', hemiS: '#d6e6ff', hemiG: '#6b7a4a', hemi: 2.3, sunC: '#fff1d0', sun: 3.8, fog: 0.005, day: 1, dir: [0.55, 0.8, 0.4] },
  noche: { sky: '#0a1224', hemiS: '#7f98d0', hemiG: '#2a3040', hemi: 1.5, sunC: '#a9bfee', sun: 2.4, fog: 0.02, day: 0, dir: [-0.5, 0.55, -0.7] },
};
export const KINDS = {
  despejado: { grey: 0, dark: 1, fog: 0, clouds: 0.25, rain: 0, wind: 0.12, storm: 0 },
  brisa: { grey: 0.1, dark: 0.95, fog: 0.002, clouds: 0.5, rain: 0, wind: 1, storm: 0 },
  niebla: { grey: 0.65, dark: 0.8, fog: 0.04, clouds: 0.8, rain: 0, wind: 0.08, storm: 0 },
  lluvia: { grey: 0.6, dark: 0.6, fog: 0.012, clouds: 1, rain: 0.75, wind: 0.5, storm: 0 },
  tormenta: { grey: 0.75, dark: 0.35, fog: 0.02, clouds: 1, rain: 1, wind: 0.95, storm: 1 },
};
const KIND_NAMES = Object.keys(KINDS);
const RAIN_N = 2200, VOL = [40, 24, 40];

function blob(r, g, b) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d'), gr = c.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = gr;
  c.fillRect(0, 0, 128, 128);
  return new CanvasTexture(cv);
}

export function makeWeather(scene, windU, audio) {
  scene.background = new Color();
  scene.fog = new FogExp2('#000000', 0.01);
  const hemi = new HemisphereLight('#ffffff', '#444444', 1);
  const sun = new DirectionalLight('#ffffff', 1);
  scene.add(hemi, sun);

  // Cielo: sol, luna, estrellas y nubes; siguen a la cámara.
  const sunSpr = new Sprite(new SpriteMaterial({ map: blob(255, 244, 210), fog: false, depthWrite: false, transparent: true, blending: AdditiveBlending }));
  sunSpr.scale.setScalar(70);
  const moon = new Mesh(new SphereGeometry(14, 20, 14), new MeshBasicMaterial({ color: '#f4f1dc', fog: false, transparent: true }));
  const halo = new Sprite(new SpriteMaterial({ map: blob(235, 240, 255), fog: false, depthWrite: false, transparent: true }));
  halo.scale.setScalar(90);
  const sp = [];
  for (let i = 0; i < 320; i++) sp.push(...new Vector3(Math.random() * 2 - 1, Math.random() * 0.9 + 0.08, Math.random() * 2 - 1).normalize().multiplyScalar(250));
  const sg = new BufferGeometry();
  sg.setAttribute('position', new Float32BufferAttribute(sp, 3));
  const stars = new Points(sg, new PointsMaterial({ color: '#dfe6ff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true }));
  const cloudTex = blob(255, 255, 255);
  const clouds = Array.from({ length: 16 }, (_, i) => {
    const s = new Sprite(new SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true }));
    s.userData = { a: (i / 16) * Math.PI * 2 + Math.random(), r: 110 + Math.random() * 110, h: 45 + Math.random() * 55 };
    s.scale.set(120 + Math.random() * 90, 36 + Math.random() * 20, 1);
    scene.add(s);
    return s;
  });
  scene.add(sunSpr, moon, halo, stars);

  // Lluvia: trazos en un volumen alrededor de la cámara.
  const rp = new Float32Array(RAIN_N * 6), rpos = [];
  for (let i = 0; i < RAIN_N; i++) rpos.push([(Math.random() - 0.5) * VOL[0], Math.random() * VOL[1], (Math.random() - 0.5) * VOL[2]]);
  const rg = new BufferGeometry();
  rg.setAttribute('position', new Float32BufferAttribute(rp, 3));
  const rainMat = new LineBasicMaterial({ color: '#b9c9dc', transparent: true, opacity: 0.4, fog: false, depthWrite: false });
  const rain = new LineSegments(rg, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);

  const c = {                       // valores actuales (interpolados)
    sky: new Color(), hemiS: new Color(), hemiG: new Color(), sunC: new Color(), dir: new Vector3(),
    hemi: 1, sun: 1, fog: 0.01, day: 0, clouds: 0, rain: 0, wind: 0, storm: 0,
  };
  const st = { time: 'noche', kind: 'brisa', auto: true, autoT: 70, flash: 0, flashT: 8, thunder: [], first: true };
  const tmp = new Color(), tc = new Color();
  const wind = { x: 0, z: 0, s: 0 };

  function target(col, hex, k) {                 // color objetivo = base con gris y oscurecido
    tmp.set(hex);
    const l = tmp.r * 0.3 + tmp.g * 0.59 + tmp.b * 0.11;
    tmp.lerp(tc.setRGB(l, l, l), k.grey).multiplyScalar(0.35 + 0.65 * k.dark);
    return col.copy(tmp);
  }
  const lerp = (a, b, f) => a + (b - a) * f;

  function update(dt, t, cam) {
    const T = TIME[st.time], K = KINDS[st.kind], f = st.first ? 1 : 1 - Math.exp(-dt * 0.55);
    st.first = false;
    const col = new Color();
    c.sky.lerp(target(col, T.sky, K), f);
    c.hemiS.lerp(target(col, T.hemiS, K), f);
    c.hemiG.lerp(target(col, T.hemiG, K), f);
    c.sunC.lerp(tc.set(T.sunC), f);
    c.dir.lerp(new Vector3(...T.dir).normalize(), f).normalize();
    c.hemi = lerp(c.hemi, T.hemi * K.dark, f);
    c.sun = lerp(c.sun, T.sun * K.dark * K.dark * (1 - K.clouds * 0.3), f);
    c.fog = lerp(c.fog, T.fog + K.fog, f);
    c.day = lerp(c.day, T.day, f);
    c.clouds = lerp(c.clouds, K.clouds, f);
    c.rain = lerp(c.rain, K.rain, f);
    c.wind = lerp(c.wind, K.wind, f);
    c.storm = lerp(c.storm, K.storm, f);

    // Viento: ráfagas sobre la fuerza base, dirección que deriva despacio.
    const gust = 0.65 + 0.35 * Math.sin(t * 0.55) + 0.2 * Math.sin(t * 1.9 + 1.3);
    wind.s = Math.max(0, Math.min(1.3, c.wind * gust));
    const ang = 0.6 + 0.5 * Math.sin(t * 0.05);
    wind.x = Math.cos(ang); wind.z = Math.sin(ang);
    windU.uWind.value = wind.s;
    windU.uTime.value = t;
    windU.uDir.value.set(wind.x, wind.z);

    // Relámpagos
    if (K.storm > 0.5) {
      st.flashT -= dt;
      if (st.flashT <= 0) {
        st.flashT = 4 + Math.random() * 9;
        st.flash = 1;
        st.thunder.push(0.4 + Math.random() * 2);
        if (Math.random() < 0.5) st.flashT = 0.25;       // doble destello
      }
    }
    st.flash = Math.max(0, st.flash - dt * 3.5);
    for (let i = st.thunder.length - 1; i >= 0; i--) if ((st.thunder[i] -= dt) <= 0) { audio.thunder(); st.thunder.splice(i, 1); }
    const fl = st.flash * st.flash;

    scene.background.copy(c.sky).lerp(tc.set('#dfe8ff'), fl * 0.7);
    scene.fog.color.copy(scene.background);
    scene.fog.density = c.fog;
    hemi.color.copy(c.hemiS); hemi.groundColor.copy(c.hemiG); hemi.intensity = c.hemi + fl * 3;
    sun.color.copy(c.sunC); sun.intensity = c.sun + fl * 4;
    sun.position.copy(c.dir).multiplyScalar(60).add(cam);
    sun.target.position.copy(cam);
    sun.target.updateMatrixWorld();

    // Cielo
    const d = c.dir.clone().multiplyScalar(240).add(cam);
    sunSpr.position.copy(d); moon.position.copy(d); halo.position.copy(d);
    sunSpr.material.opacity = c.day * (1 - c.clouds * 0.85);
    moon.material.opacity = (1 - c.day) * (1 - c.clouds * 0.8);
    halo.material.opacity = moon.material.opacity * 0.9;
    stars.position.copy(cam);
    stars.material.opacity = (1 - c.day) * (1 - c.day) * (1 - c.clouds);
    const cc = new Color().copy(c.sky).multiplyScalar(1.4).lerp(tc.set('#ffffff'), 0.55 * c.day * (1 - K.grey * 0.5));
    for (const s of clouds) {
      const u = s.userData;
      u.a += dt * (0.002 + wind.s * 0.006);
      s.position.set(cam.x + Math.cos(u.a) * u.r, u.h, cam.z + Math.sin(u.a) * u.r);
      s.material.color.copy(cc);
      s.material.opacity = Math.min(0.85, c.clouds) * (0.35 + 0.55 * c.day);
    }

    // Lluvia
    const n = Math.floor(RAIN_N * c.rain);
    rain.visible = n > 5;
    if (rain.visible) {
      const a = rg.attributes.position.array, v = 20 + c.storm * 6, wx = wind.x * wind.s * 4, wz = wind.z * wind.s * 4;
      for (let i = 0; i < n; i++) {
        const p = rpos[i];
        p[1] -= v * dt; p[0] += wx * dt; p[2] += wz * dt;
        if (p[1] < 0) { p[1] += VOL[1]; p[0] = (Math.random() - 0.5) * VOL[0]; p[2] = (Math.random() - 0.5) * VOL[2]; }
        const x = cam.x + p[0], y = cam.y - 8 + p[1], z = cam.z + p[2];
        a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z;
        a[i * 6 + 3] = x - wx * 0.03; a[i * 6 + 4] = y + 0.55; a[i * 6 + 5] = z - wz * 0.03;
      }
      rg.setDrawRange(0, n * 2);
      rg.attributes.position.needsUpdate = true;
      rainMat.opacity = 0.25 + 0.25 * c.rain;
    }
    audio.set(wind.s, c.rain);

    // Cambio automático de clima (y de vez en cuando de hora)
    if (st.auto && (st.autoT -= dt) <= 0) {
      st.autoT = 70 + Math.random() * 70;
      const next = KIND_NAMES.filter((k) => k !== st.kind);
      st.kind = next[Math.floor(Math.random() * next.length)];
      if (Math.random() < 0.3) st.time = st.time === 'dia' ? 'noche' : 'dia';
      api.onChange?.();
    }
  }

  const api = {
    state: st, wind, update, onChange: null,
    set(time, kind) { if (time) st.time = time; if (kind) st.kind = kind; st.auto = false; api.onChange?.(); },
    setAuto(v) { st.auto = v; st.autoT = 40; api.onChange?.(); },
  };
  return api;
}
