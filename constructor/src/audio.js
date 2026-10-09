// Sonido procedural con WebAudio (sin archivos): viento, lluvia y truenos.
export function makeAudio() {
  let ctx = null, wind, rain, master, muted = false, noise;

  function loop(filter, gain) {
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true;
    s.connect(filter).connect(gain).connect(master);
    s.start();
    return gain;
  }

  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 0.7;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    wind = loop(bp, Object.assign(ctx.createGain(), {}));
    rain = loop(hp, ctx.createGain());
    wind.gain.value = rain.gain.value = 0;
  }

  return {
    init,
    set(windS, rainI) {
      if (!ctx) return;
      wind.gain.setTargetAtTime(Math.min(1, windS) * 0.35, ctx.currentTime, 0.5);
      rain.gain.setTargetAtTime(rainI * 0.22, ctx.currentTime, 0.5);
    },
    thunder() {
      if (!ctx) return;
      const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
      s.buffer = noise; lp.type = 'lowpass'; lp.frequency.value = 260;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1.4, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      s.connect(lp).connect(g).connect(master);
      s.start(t, Math.random()); s.stop(t + 3.3);
    },
    toggle() {
      muted = !muted;
      if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.1);
      return muted;
    },
  };
}
