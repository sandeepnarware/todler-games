// Shape sorter — drag each shape into its matching hole. Shapes and fine motor control.
import { h, shuffle, centerOf } from '../lib/util.js';
import { draggable } from '../lib/drag.js';

function starPoints() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 46 : 20;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(53 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const SVG = {
  circle: '<circle cx="50" cy="50" r="42"/>',
  square: '<rect x="10" y="10" width="80" height="80" rx="10"/>',
  triangle: '<path d="M50 8 L92 86 L8 86 Z"/>',
  star: `<polygon points="${starPoints()}"/>`,
  heart: '<path d="M50 88 C18 64 4 46 12 28 C20 10 42 10 50 28 C58 10 80 10 88 28 C96 46 82 64 50 88 Z"/>',
  diamond: '<path d="M50 5 L90 50 L50 95 L10 50 Z"/>',
};

const COLOUR = {
  circle: '#ff5d73',
  square: '#3a86ff',
  triangle: '#3bd16f',
  star: '#ffd23f',
  heart: '#ff8fab',
  diamond: '#a463f2',
};

// Easiest first; higher levels add shapes.
const ORDER = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];

function shapeEl(shape, cls) {
  const el = h('div', { class: cls, style: { '--c': COLOUR[shape] } });
  el.dataset.shape = shape;
  el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${SVG[shape]}</svg>`;
  return el;
}

export default {
  id: 'shapes',
  emoji: '🔺',
  tint: '#caffbf',
  skill: 'Shape recognition, drag-and-drop fine motor control',
  maxLevel: 3, // 3, 4, 5, then 6 shapes

  start(stage, c) {
    const holes = h('div', { class: 'shape-row holes' });
    const tray = h('div', { class: 'shape-row tray' });
    stage.append(holes, tray);

    const intro = () => c.say(c.t.shapesIntro);
    c.setReplay(intro);

    function round() {
      const set = ORDER.slice(0, 3 + c.level());
      let placed = 0;
      holes.replaceChildren(...shuffle(set).map((s) => shapeEl(s, 'hole pop-in')));
      tray.replaceChildren();

      for (const shape of shuffle(set)) {
        const piece = shapeEl(shape, 'piece pop-in');
        tray.append(piece);
        draggable(piece, {
          targets: () => [...holes.querySelectorAll('.hole:not(.filled)')],
          onPick: () => {
            c.sfx.pick();
            c.say(c.t.shapes[shape]);
          },
          onDrop: (hole) => {
            if (hole.dataset.shape !== shape) {
              c.sfx.soft();
              c.say(c.t.shapesWrong);
              return false;
            }
            hole.classList.add('filled');
            hole.classList.remove('pop-in');
            void hole.offsetWidth;
            hole.classList.add('snap');
            piece.remove();
            c.sfx.drop();
            const { x, y } = centerOf(hole);
            c.sparkle(x, y, COLOUR[shape]);
            if (++placed === set.length) finish();
            return true;
          },
        });
      }
    }

    async function finish() {
      await c.wait(500);
      c.win();
      await c.celebrate();
      round();
    }

    intro();
    round();
  },
};
