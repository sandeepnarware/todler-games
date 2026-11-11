// Sound effects synthesised with Web Audio: no audio files to download, works offline.
let ctx = null;
let master = null;
let enabled = true;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setEnabled(value) {
  enabled = value;
}

function note(freq, start, dur, { type = 'sine', vol = 0.3, to } = {}) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// C major scale from C5 — used for counting so each number climbs higher.
const SCALE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];

export const sfx = {
  pop(pitch = 1) {
    note(500 * pitch, 0, 0.12, { to: 1300 * pitch, vol: 0.35 });
  },
  tap() {
    note(880, 0, 0.08, { type: 'triangle', vol: 0.2 });
  },
  pick() {
    note(500, 0, 0.1, { to: 760, type: 'triangle', vol: 0.18 });
  },
  drop() {
    note(700, 0, 0.12, { to: 420, vol: 0.25 });
    note(1050, 0.08, 0.16, { type: 'triangle', vol: 0.15 });
  },
  flip() {
    note(1200, 0, 0.05, { type: 'triangle', vol: 0.12 });
  },
  good() {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.08, 0.25, { type: 'triangle', vol: 0.22 }));
  },
  /** Gentle "not quite" — deliberately soft, never a buzzer. */
  soft() {
    note(392, 0, 0.18, { to: 330, vol: 0.18 });
  },
  count(n) {
    note(SCALE[(n - 1) % SCALE.length], 0, 0.22, { type: 'triangle', vol: 0.25 });
  },
  fanfare() {
    [523, 659, 784].forEach((f, i) => note(f, i * 0.12, 0.2, { type: 'triangle', vol: 0.22 }));
    note(1047, 0.36, 0.5, { type: 'triangle', vol: 0.25 });
    note(784, 0.36, 0.5, { type: 'sine', vol: 0.12 });
  },
};
