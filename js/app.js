import { h, onTap, pick } from './lib/util.js';
import { strings, LANGUAGES } from './lib/i18n.js';
import { store } from './lib/store.js';
import * as speech from './lib/speech.js';
import * as sound from './lib/sound.js';
import { celebrate, sparkle } from './lib/fx.js';

import bubbles from './games/bubbles.js';
import animals from './games/animals.js';
import shapes from './games/shapes.js';
import colours from './games/colours.js';
import counting from './games/counting.js';
import memory from './games/memory.js';

const GAMES = [bubbles, animals, shapes, colours, counting, memory];
const PARENT_HOLD_MS = 3000;

const app = document.getElementById('app');
const T = () => strings(store.get('lang', 'en'));

let active = null; // the running game: { dispose() }
let installPrompt = null;

// ---------------------------------------------------------------- settings

function applySettings() {
  const lang = store.get('lang', 'en');
  document.documentElement.lang = lang;
  speech.configure({ lang, enabled: store.get('voice', true), voiceURI: store.get(`voiceURI:${lang}`, null) });
  sound.setEnabled(store.get('sound', true));
}

// ---------------------------------------------------------------- screens

function render(screen) {
  app.replaceChildren(screen);
}

function showSplash() {
  const play = h('button', { class: 'big-play', 'aria-label': 'Play' }, '▶');
  render(h('section', { class: 'screen splash' }, h('div', { class: 'splash-logo emoji' }, '🧸'), h('h1', {}, T().appName), play));
  onTap(play, () => {
    sound.unlock();
    speech.prime();
    enterFullscreen();
    showHome(true);
  });
}

function showHome(greet) {
  leaveGame();
  const t = T();
  const gear = h('button', { class: 'gear', 'aria-label': 'Grown-ups: hold for 3 seconds' }, h('span', { class: 'ring' }), '⚙️');
  const tiles = GAMES.map((game, i) => {
    const tile = h(
      'button',
      { class: 'tile pop-in', style: { '--tint': game.tint, 'animation-delay': `${i * 60}ms` }, 'aria-label': t.games[game.id] },
      game.emoji
        ? h('span', { class: 'emoji' }, game.emoji)
        : h('span', { class: 'emoji bubbles-icon' }, h('i'), h('i'), h('i')),
      h('span', { class: 'label' }, t.games[game.id])
    );
    onTap(tile, () => {
      sound.sfx.tap();
      openGame(game);
    });
    return tile;
  });

  render(
    h(
      'section',
      { class: 'screen home' },
      h('header', { class: 'home-head' }, h('h1', {}, t.appName), h('div', { class: 'parent' }, h('small', {}, 'Grown-ups: hold'), gear)),
      h('div', { class: 'tiles' }, tiles)
    )
  );
  parentGate(gear, openSettings);
  if (greet) speech.say(t.hello);
}

function openGame(game) {
  leaveGame();
  history.pushState({ game: game.id }, '');

  const home = h('button', { class: 'round-btn', 'aria-label': 'Home' }, '🏠');
  const replay = h('button', { class: 'round-btn invisible', 'aria-label': 'Say it again' }, '🔊');
  const stage = h('div', { class: `stage g-${game.id}` });
  render(h('section', { class: 'screen game', 'data-game': game.id }, h('div', { class: 'topbar' }, home, replay), stage));

  const ctx = makeContext(game, replay);
  onTap(home, goHome);
  const cleanup = game.start(stage, ctx);
  active = {
    dispose() {
      ctx.dispose();
      cleanup?.();
    },
  };
}

function leaveGame() {
  active?.dispose();
  active = null;
  speech.stop();
}

function goHome() {
  if (history.state?.game) history.back();
  else showHome(false);
}

// ---------------------------------------------------------------- game context

/**
 * Everything a game needs. Once the game is left, every async helper returns a
 * promise that never settles, so pending game logic simply stops running.
 */
function makeContext(game, replayBtn) {
  let alive = true;
  let replayFn = null;
  const timers = new Set();
  const halt = new Promise(() => {});
  const guard = (p) => p.then((v) => (alive ? v : halt));
  const levelKey = `level:${game.id}`;
  const winsKey = `wins:${game.id}`;
  const maxLevel = game.maxLevel ?? 0;

  onTap(replayBtn, () => {
    sound.sfx.tap();
    replayFn?.();
  });

  const ctx = {
    get t() {
      return T();
    },
    sfx: sound.sfx,
    sparkle,
    alive: () => alive,
    say: (text) => (alive ? guard(speech.say(text)) : halt),
    later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        if (alive) fn();
      }, ms);
      timers.add(id);
    },
    wait: (ms) => new Promise((resolve) => ctx.later(resolve, ms)),
    celebrate({ praise = true } = {}) {
      if (!alive) return halt;
      sound.sfx.fanfare();
      if (praise) speech.say(pick(T().praise));
      return guard(celebrate());
    },
    setReplay(fn) {
      replayFn = fn;
      replayBtn.classList.toggle('invisible', !fn);
    },
    level: () => Math.min(store.get(levelKey, 0), maxLevel),
    /** Record a finished round; every 3 wins the game gets a little harder. */
    win() {
      const wins = store.get(winsKey, 0) + 1;
      store.set(winsKey, wins);
      if (wins % 3 === 0 && ctx.level() < maxLevel) store.set(levelKey, ctx.level() + 1);
    },
    dispose() {
      alive = false;
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
  return ctx;
}

// ---------------------------------------------------------------- grown-ups

/** Settings open only after holding the gear for a few seconds — easy for adults, unlikely for toddlers. */
function parentGate(btn, onOpen) {
  let raf = null;
  const reset = () => {
    cancelAnimationFrame(raf);
    raf = null;
    btn.style.setProperty('--p', '0%');
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / PARENT_HOLD_MS);
      btn.style.setProperty('--p', `${p * 100}%`);
      if (p >= 1) {
        reset();
        onOpen();
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, reset));
}

function openSettings() {
  speech.stop();
  const lang = store.get('lang', 'en');

  const toggle = (key, label, onChange) => {
    const input = h('input', { type: 'checkbox' });
    input.checked = store.get(key, true);
    input.addEventListener('change', () => {
      store.set(key, input.checked);
      applySettings();
      onChange?.(input.checked);
    });
    return h('label', { class: 'row' }, h('span', {}, label), input);
  };

  const langSeg = h(
    'div',
    { class: 'seg' },
    LANGUAGES.map(({ code, label }) => {
      const b = h('button', { 'aria-pressed': String(code === lang) }, label);
      b.addEventListener('click', () => {
        store.set('lang', code);
        applySettings();
        modal.remove();
        openSettings();
      });
      return b;
    })
  );

  const voices = speech.voicesFor(lang);
  const voiceSelect = h('select', {}, h('option', { value: '' }, 'Automatic'), voices.map((v) => h('option', { value: v.voiceURI }, `${v.name} (${v.lang})`)));
  voiceSelect.value = store.get(`voiceURI:${lang}`, '') || '';
  voiceSelect.addEventListener('change', () => {
    store.set(`voiceURI:${lang}`, voiceSelect.value || null);
    applySettings();
    speech.say(T().hello);
  });
  const testVoice = h('button', { class: 'btn' }, 'Test');
  testVoice.addEventListener('click', () => speech.say(T().hello));

  const voiceHint = !speech.supported
    ? h('p', { class: 'hint' }, 'This browser cannot speak. Try Chrome or Safari for spoken instructions.')
    : voices.length === 0
      ? h('p', { class: 'hint warn' }, `No ${lang === 'hi' ? 'Hindi' : 'English'} voice found on this device. Add one in your phone's text-to-speech settings, then reopen the app.`)
      : null;

  const progress = h(
    'ul',
    { class: 'progress' },
    GAMES.map((g) => {
      const level = Math.min(store.get(`level:${g.id}`, 0), g.maxLevel);
      const stars = g.maxLevel ? '★'.repeat(level + 1) + '☆'.repeat(g.maxLevel - level) : '—';
      return h('li', {}, h('span', {}, `${g.emoji || '🔵'} ${strings('en').games[g.id]}`, h('small', {}, g.skill)), h('b', {}, stars));
    })
  );

  const resetBtn = h('button', { class: 'btn' }, 'Reset levels');
  resetBtn.addEventListener('click', () => {
    store.resetProgress();
    modal.remove();
    openSettings();
  });

  let installRow = null;
  if (installPrompt) {
    const installBtn = h('button', { class: 'btn primary' }, 'Install app');
    installBtn.addEventListener('click', async () => {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installRow.remove();
    });
    installRow = h('div', { class: 'row' }, h('span', {}, 'Add to home screen'), installBtn);
  } else if (!matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) {
    installRow = h('p', { class: 'hint' }, 'To install: open your browser menu and choose “Add to Home Screen”. It then works offline.');
  }

  const close = h('button', { class: 'btn primary' }, 'Done');
  const sheet = h(
    'div',
    { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Grown-up settings' },
    h('h2', {}, 'Grown-ups'),
    h('div', { class: 'row' }, h('span', {}, 'Language'), langSeg),
    toggle('voice', 'Spoken instructions'),
    h('div', { class: 'row' }, h('span', {}, 'Voice'), h('div', { class: 'inline' }, voiceSelect, testVoice)),
    voiceHint,
    toggle('sound', 'Sound effects'),
    h('h3', {}, 'Progress'),
    h('p', { class: 'hint' }, 'Each game gets a little harder after every 3 rounds your child finishes.'),
    progress,
    h('div', { class: 'row' }, h('span', {}, 'Start all games from the easiest level'), resetBtn),
    installRow,
    h('div', { class: 'actions' }, close)
  );
  const modal = h('div', { class: 'modal' }, sheet);
  close.addEventListener('click', () => {
    modal.remove();
    showHome(false);
  });
  document.body.append(modal);
}

// ---------------------------------------------------------------- platform

function enterFullscreen() {
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (standalone || document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.().catch(() => {});
}

window.addEventListener('popstate', () => {
  if (active) showHome(false);
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) speech.stop();
});

// Long-press menus and pinch zoom are confusing for little ones.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

history.replaceState({ home: true }, '');
applySettings();
showSplash();
