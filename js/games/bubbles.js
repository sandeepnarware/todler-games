// Pop the bubbles — tap practice and hand-eye coordination. No way to fail.
import { h, pick, rand, centerOf } from '../lib/util.js';

const COLOURS = [
  ['red', '#ff5d73'],
  ['yellow', '#ffd23f'],
  ['green', '#3bd16f'],
  ['blue', '#3a86ff'],
  ['orange', '#ff9f1c'],
  ['purple', '#a463f2'],
];
const MAX_ON_SCREEN = 6;
const CELEBRATE_EVERY = 12;

export default {
  id: 'bubbles',
  emoji: '', // drawn with CSS (.bubbles-icon): the 🫧 emoji is missing on older devices
  tint: '#bde0fe',
  skill: 'Tapping, hand–eye coordination, colour words',
  maxLevel: 0,

  start(stage, c) {
    let pops = 0;
    const intro = () => c.say(c.t.bubblesIntro);
    c.setReplay(intro);
    intro();

    function makeBubble() {
      const [name, colour] = pick(COLOURS);
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const size = Math.round(rand(90, Math.max(100, Math.min(160, W * 0.32))));
      const skin = h('div', { class: 'skin' });
      const bubble = h('div', { class: 'bubble', style: { width: `${size}px`, height: `${size}px`, left: `${rand(0, W - size)}px`, '--c': colour } }, skin);
      stage.append(bubble);

      const sway = rand(20, 50) * (Math.random() < 0.5 ? -1 : 1);
      const dist = H + size + 40;
      const rise = bubble.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: `translate(${sway}px, ${-dist * 0.25}px)` },
          { transform: `translate(${-sway}px, ${-dist * 0.5}px)` },
          { transform: `translate(${sway}px, ${-dist * 0.75}px)` },
          { transform: `translate(0, ${-dist}px)` },
        ],
        { duration: rand(6500, 9500), easing: 'linear' }
      );
      rise.onfinish = () => bubble.remove();

      bubble.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (bubble.classList.contains('popped')) return;
        bubble.classList.add('popped');
        rise.pause();
        const { x, y } = centerOf(bubble);
        c.sfx.pop(130 / size);
        c.sparkle(x, y, colour);
        skin.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], {
          duration: 180,
          easing: 'ease-out',
          fill: 'forwards',
        }).onfinish = () => bubble.remove();

        pops++;
        if (pops % CELEBRATE_EVERY === 0) {
          c.win();
          c.celebrate();
        } else {
          c.say(c.t.colours[name]);
        }
      });
    }

    function spawn() {
      if (stage.querySelectorAll('.bubble:not(.popped)').length < MAX_ON_SCREEN) makeBubble();
      c.later(spawn, rand(700, 1300));
    }

    // A few bubbles straight away so there is something to tap immediately.
    c.later(makeBubble, 100);
    c.later(makeBubble, 500);
    c.later(spawn, 900);
  },
};
