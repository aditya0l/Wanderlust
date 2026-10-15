/* Wanderlust soundscapes
   Each place gets a short generative sound sketch built with the Web Audio API:
   no recordings, nothing to license. Swap any scape for a real field recording
   later by replacing its builder with an <audio> source routed into `bus`. */
(() => {
  let ctx, master, dry, wet, noise;
  let current = null, currentKey = null;
  const listeners = new Set();

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .75;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .1;
    master.connect(comp).connect(lim).connect(ctx.destination);
    dry = ctx.createGain(); dry.connect(master);
    // generated hall reverb
    const conv = ctx.createConvolver(), len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    conv.buffer = ir; wet = ctx.createGain(); wet.gain.value = .55; wet.connect(conv).connect(master);
    // brown noise, 4 s loop
    const n = ctx.sampleRate * 4; noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const nd = noise.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; nd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .16; b6 = w * .115926; }
  }

  /* ---------- building blocks ---------- */
  const now = () => ctx.currentTime;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function out(bus, send = .5) { const g = ctx.createGain(); g.connect(bus.dry); const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(bus.wet); return g; }
  function lfo(param, rate, depth, base) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g).connect(param); param.value = base; o.start(); return o; }
  function noiseBed(bus, { type = "bandpass", freq = 500, q = .7, vol = .2, lfoRate = .07, lfoDepth = 300, ampRate = 0, ampDepth = 0, send = .3, white = false }) {
    const src = ctx.createBufferSource(); src.buffer = white ? whiteBuf() : noise; src.loop = true; src.playbackRate.value = rnd(.9, 1.1);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    const g = ctx.createGain();
    src.connect(f).connect(g).connect(out(bus, send));
    const nodes = [src, lfo(f.frequency, lfoRate, lfoDepth, freq)];
    if (ampRate) nodes.push(lfo(g.gain, ampRate, ampDepth, vol)); else g.gain.value = vol;
    src.start(); return nodes;
  }
  let _white;
  function whiteBuf() { if (_white) return _white; const n = ctx.sampleRate * 2; _white = ctx.createBuffer(1, n, ctx.sampleRate); const d = _white.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return _white; }
  function tone(bus, { f, t = now(), type = "sine", a = .005, d = 2, vol = .1, send = .5, detune = 0, filter = 0, endF = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (endF) o.frequency.exponentialRampToValueAtTime(endF, t + d * .6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d);
    let node = o.connect(g);
    if (filter) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(filter, t); fl.frequency.exponentialRampToValueAtTime(Math.max(200, filter / 6), t + d); g.connect(fl); node = fl; }
    node.connect(out(bus, send)); o.start(t); o.stop(t + a + d + .1);
  }
  const partials = (bus, f, ratios, d, vol, send, beat = 0) => ratios.forEach((r, i) => {
    tone(bus, { f: f * r, d: d / (1 + i * .5), vol: vol / (1 + i * 1.4), send });
    if (beat) tone(bus, { f: f * r + beat, d: d / (1 + i * .5), vol: vol / (1 + i * 1.4) * .7, send });
  });
  const bowl = (bus, f, vol = .08) => partials(bus, f, [1, 2.71, 5.2], 9, vol, .7, 1.3);
  const bell = (bus, f, vol = .05) => partials(bus, f, [1, 2.4, 3.95, 5.4], 4, vol, .6);
  const gong = (bus, f, vol = .07) => partials(bus, f, [1, 2.76, 5.4], 3, vol, .5, 5.5);
  const pluck = (bus, f, vol = .09, d = 2.2, bright = 2600, type = "sawtooth") => tone(bus, { f, type, a: .004, d, vol, filter: bright, send: .45, detune: rnd(-6, 6) });
  function drum(bus, { f0 = 190, f1 = 70, vol = .25, d = .5, slap = .05 }) {
    const t = now() + .02; tone(bus, { f: f0, endF: f1, t, d, vol, send: .25 });
    const src = ctx.createBufferSource(); src.buffer = whiteBuf(); const g = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = "bandpass"; fl.frequency.value = 1800; g.gain.setValueAtTime(slap, t); g.gain.exponentialRampToValueAtTime(.0001, t + .08);
    src.connect(fl).connect(g).connect(out(bus, .2)); src.start(t); src.stop(t + .1);
  }
  function chirp(bus, base = 2600) { const t = now() + .02, n = Math.floor(rnd(2, 5)); for (let i = 0; i < n; i++) tone(bus, { f: base * rnd(.9, 1.15), endF: base * rnd(1.3, 1.6), t: t + i * rnd(.09, .14), d: .08, a: .005, vol: .025, send: .6 }); }
  function cowbell(bus, f = rnd(520, 760), vol = .05) {
    const t = now() + .02;
    [1, 1.48].forEach(r => { const o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter(); o.type = "square"; o.frequency.value = f * r; bp.type = "bandpass"; bp.frequency.value = f * 1.6; bp.Q.value = 3;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + rnd(.6, 1.2));
      o.connect(bp).connect(g).connect(out(bus, .55)); o.start(t); o.stop(t + 1.3); });
  }
  function every(timers, min, max, fn) { const run = () => { fn(); timers.push(setTimeout(run, rnd(min, max) * 1000)); }; timers.push(setTimeout(run, rnd(min, max) * 500)); }
  function tanpura(bus, timers, sa, vol = .06) {
    const seq = [sa * 1.5, sa * 2, sa * 2, sa]; let i = 0;
    const run = () => { pluck(bus, seq[i % 4], vol, 4.5, 1800); pluck(bus, seq[i % 4] * 2, vol * .3, 3.5, 3000, "triangle"); i++; timers.push(setTimeout(run, 1150)); };
    run();
  }

  /* ---------- scapes: one per place ---------- */
  const D = 146.83; // Sa on D
  const SCAPES = {
    ladakh: { level: 4.5, title: "Wind through prayer flags, a singing bowl at Thiksey", build(bus, T) {
      const n = [...noiseBed(bus, { freq: 420, q: 1.2, vol: .3, lfoRate: .06, lfoDepth: 260, ampRate: .09, ampDepth: .12 }),
                 ...noiseBed(bus, { freq: 1600, q: 2.5, vol: .05, lfoRate: .11, lfoDepth: 600, send: .5 })];
      bowl(bus, 220, .1); every(T, 6, 9, () => bowl(bus, pick([220, 247, 196]), .09));
      every(T, 2.5, 5, () => bell(bus, pick([1760, 1975, 2349]), .015));
      return n; } },
    maldives: { level: 2.2, title: "Waves on the reef, boduberu drums from the beach", build(bus, T) {
      const n = noiseBed(bus, { type: "lowpass", freq: 520, q: .4, vol: .28, lfoRate: .08, lfoDepth: 380, ampRate: .1, ampDepth: .22, send: .25 });
      const pat = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0]; let s = 0;
      const step = () => { if (pat[s % 16]) drum(bus, { f0: s % 4 === 0 ? 210 : 320, f1: 120, vol: .09, slap: .03 }); s++; T.push(setTimeout(step, 150)); };
      T.push(setTimeout(step, 300));
      every(T, 6, 10, () => chirp(bus, 3400));
      return n; } },
    dubai: { level: 3.8, title: "Desert wind and an oud in maqam hijaz", build(bus, T) {
      const n = noiseBed(bus, { freq: 900, q: .9, vol: .16, lfoRate: .05, lfoDepth: 500, ampRate: .07, ampDepth: .08 });
      const hijaz = [1, 16/15, 5/4, 4/3, 3/2, 8/5, 9/5, 2].map(r => D * 2 * r);
      let i = 0;
      const phrase = () => {
        const len = Math.floor(rnd(3, 7));
        for (let k = 0; k < len; k++) {
          i = Math.max(0, Math.min(hijaz.length - 1, i + pick([-1, -1, 1, 1, 2, -2, 0])));
          const f = hijaz[i];
          T.push(setTimeout(() => { pluck(bus, f, .08, 1.6, 2200); pluck(bus, f * 2, .02, 1, 3000, "triangle"); }, k * rnd(180, 320)));
        }
        T.push(setTimeout(phrase, len * 260 + rnd(900, 2200)));
      };
      phrase(); tone(bus, { f: D, type: "triangle", d: 30, a: 1, vol: .04, send: .6 });
      every(T, 26, 30, () => tone(bus, { f: D, type: "triangle", d: 30, a: 2, vol: .04, send: .6 }));
      return n; } },
    jaipur: { level: 8, title: "A kamaicha drone and folk strings from the Thar", build(bus, T) {
      tanpura(bus, T, D, .05);
      const scale = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2, 9/4].map(r => D * 2 * r); let i = 4;
      const melody = () => {
        i = Math.max(0, Math.min(scale.length - 1, i + pick([-1, 1, -2, 2, 0, -1])));
        const f = scale[i], t = now() + .02, o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(), v = ctx.createOscillator(), vg = ctx.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(f * .985, t); o.frequency.linearRampToValueAtTime(f, t + .12);
        v.frequency.value = 5.5; vg.gain.value = f * .008; v.connect(vg).connect(o.frequency);
        fl.type = "lowpass"; fl.frequency.value = 1400; fl.Q.value = 2;
        const d = rnd(.6, 1.6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .15); g.gain.setTargetAtTime(0, t + d, .25);
        o.connect(fl).connect(g).connect(out(bus, .55)); o.start(t); v.start(t); o.stop(t + d + 1.5); v.stop(t + d + 1.5);
        T.push(setTimeout(melody, d * 1000 + rnd(80, 900)));
      };
      T.push(setTimeout(melody, 900));
      return noiseBed(bus, { freq: 700, q: .7, vol: .04, lfoRate: .05, lfoDepth: 200 }); } },
    kerala: { level: 3.2, title: "Monsoon rain on the backwaters, a koel in the palms", build(bus, T) {
      const n = [...noiseBed(bus, { type: "highpass", freq: 2200, q: .3, vol: .07, lfoRate: .03, lfoDepth: 400, white: true, send: .35 }),
                 ...noiseBed(bus, { type: "lowpass", freq: 380, q: .4, vol: .2, lfoRate: .06, lfoDepth: 120, ampRate: .12, ampDepth: .06 })];
      every(T, .08, .3, () => tone(bus, { f: rnd(1800, 4200), endF: rnd(900, 1500), d: .05, a: .002, vol: .012, send: .3 }));
      every(T, 5, 9, () => { const t = now() + .02; [0, .45].forEach((o, k) => tone(bus, { f: 880 * (k ? 1.26 : 1), endF: 1150 * (k ? 1.26 : 1), t: t + o, d: .35, a: .04, vol: .03, send: .7 })); });
      return n; } },
    manali: { level: 4.2, title: "The Beas river and the bell at Hadimba temple", build(bus, T) {
      const n = [...noiseBed(bus, { freq: 620, q: .5, vol: .26, lfoRate: .2, lfoDepth: 120, ampRate: .3, ampDepth: .03, send: .2 }),
                 ...noiseBed(bus, { freq: 300, q: 1, vol: .1, lfoRate: .05, lfoDepth: 150, ampRate: .08, ampDepth: .06 })];
      bell(bus, 440, .06); every(T, 8, 13, () => bell(bus, pick([392, 440]), .06));
      every(T, 6, 12, () => chirp(bus, 3100));
      return n; } },
    singapore: { level: 3.2, title: "Evening rain over Marina Bay", build(bus, T) {
      const n = [...noiseBed(bus, { type: "highpass", freq: 1800, q: .3, vol: .06, lfoRate: .04, lfoDepth: 300, white: true }),
                 ...noiseBed(bus, { type: "lowpass", freq: 180, q: .5, vol: .25, lfoRate: .02, lfoDepth: 40 })];
      tone(bus, { f: 110, d: 40, a: 2, vol: .025, send: .2 }); every(T, 30, 34, () => tone(bus, { f: 110, d: 40, a: 2, vol: .025, send: .2 }));
      every(T, 9, 15, () => { const t = now() + .02; tone(bus, { f: 659, t, d: 1.6, vol: .025, send: .7 }); tone(bus, { f: 523, t: t + .35, d: 2, vol: .025, send: .7 }); });
      return n; } },
    golden: { level: 5.2, title: "Evening aarti bells over a tanpura", build(bus, T) {
      tanpura(bus, T, D, .045);
      every(T, .45, .6, () => { if (Math.random() < .55) bell(bus, pick([1318, 1396]), .01); });
      bell(bus, 523, .06); every(T, 9, 14, () => bell(bus, 523, .06));
      return noiseBed(bus, { type: "lowpass", freq: 260, q: .4, vol: .07, lfoRate: .03, lfoDepth: 60 }); } },
    bali: { level: 5.2, title: "Gamelan across the rice terraces at dusk", build(bus, T) {
      const pelog = [1, 1.07, 1.2, 1.36, 1.5, 1.6, 1.8].map(r => 293.7 * r);
      const core = [0, 2, 1, 4, 2, 3, 1, 0]; let s = 0;
      const step = () => {
        const f = pelog[core[s % 8]]; gong(bus, f, .045);
        if (s % 2) gong(bus, pelog[(core[s % 8] + 2) % 7] * 2, .018);
        if (s % 8 === 0) gong(bus, pelog[0] / 2, .08);
        s++; T.push(setTimeout(step, 420));
      };
      T.push(setTimeout(step, 100));
      every(T, .25, .9, () => { if (Math.random() < .5) drum(bus, { f0: 380, f1: 260, vol: .015, d: .12, slap: 0 }); });
      return noiseBed(bus, { type: "highpass", freq: 5200, q: .5, vol: .015, ampRate: 6, ampDepth: .012, lfoRate: .1, lfoDepth: 400, white: true }); } },
    swiss: { level: 10, title: "Cowbells in an alpine meadow above Lauterbrunnen", build(bus, T) {
      const n = [...noiseBed(bus, { freq: 500, q: .8, vol: .12, lfoRate: .05, lfoDepth: 200, ampRate: .07, ampDepth: .06 }),
                 ...noiseBed(bus, { freq: 1100, q: .6, vol: .05, lfoRate: .3, lfoDepth: 200, send: .2 })];
      const herd = [rnd(520, 560), rnd(600, 640), rnd(690, 740), rnd(470, 500)];
      every(T, .5, 2.4, () => { const f = pick(herd); cowbell(bus, f, .035); if (Math.random() < .4) setTimeout(() => cowbell(bus, f, .02), rnd(140, 260)); });
      every(T, 7, 12, () => chirp(bus, 2800));
      return n; } },
  };

  function play(key) {
    init();
    if (key === currentKey) return;
    stop();
    const scape = SCAPES[key]; if (!scape) return;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now()); g.gain.linearRampToValueAtTime(scape.level || 1, now() + .7);
    const bd = ctx.createGain(), bw = ctx.createGain(); bd.connect(g); bw.connect(wet); g.connect(dry);
    bw.gain.setValueAtTime(0, now()); bw.gain.linearRampToValueAtTime(scape.level || 1, now() + .7);
    const bus = { dry: bd, wet: bw }, T = [];
    const nodes = scape.build(bus, T) || [];
    current = { g, nodes, T, bw }; currentKey = key;
    listeners.forEach(fn => fn(key, scape.title));
  }
  function stop() {
    if (!current) return;
    const c = current, t = now();
    c.T.forEach(clearTimeout); c.T.length = 0;
    c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + 1.6);
    c.bw.gain.setTargetAtTime(0, t, .5);
    setTimeout(() => { c.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); c.g.disconnect(); c.bw.disconnect(); }, 5000);
    current = null; currentKey = null;
    listeners.forEach(fn => fn(null, ""));
  }
  window.Soundscape = { play, stop, get key() { return currentKey; }, title: k => SCAPES[k]?.title || "", onChange: fn => listeners.add(fn) };
})();
