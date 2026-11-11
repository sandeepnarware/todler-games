// Memory pairs — flip cards to find matching animals. Working memory and attention.
import { h, onTap, sample, shuffle, centerOf } from '../lib/util.js';
import { ANIMALS } from './animals.js';

const PAIRS = [2, 3, 4, 6];

// [cols, rows] for each card count, portrait / landscape.
const LAYOUT = {
  4: [[2, 2], [2, 2]],
  6: [[2, 3], [3, 2]],
  8: [[2, 4], [4, 2]],
  12: [[3, 4], [4, 3]],
};

export default {
  id: 'memory',
  emoji: '🃏',
  tint: '#a0c4ff',
  skill: 'Memory, attention and matching',
  maxLevel: 3,

  start(stage, c) {
    const grid = h('div', { class: 'memory-grid' });
    stage.append(grid);

    const intro = () => c.say(c.t.memoryIntro);
    c.setReplay(intro);

    let first = null;
    let busy = false;
    let matched = 0;
    let total = 0;

    function layout() {
      if (!total) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const [cols, rows] = LAYOUT[total][W > H ? 1 : 0];
      const gap = Math.max(10, Math.min(W, H) * 0.03);
      const size = Math.min((W - gap * (cols + 1)) / cols, (H - gap * (rows + 1)) / rows, 190);
      grid.style.setProperty('--cols', cols);
      grid.style.setProperty('--size', `${Math.floor(size)}px`);
      grid.style.setProperty('--gap', `${Math.floor(gap)}px`);
    }

    function round() {
      const animals = sample(ANIMALS, PAIRS[c.level()]);
      const deck = shuffle([...animals, ...animals]);
      total = deck.length;
      matched = 0;
      first = null;
      busy = false;
      layout();

      grid.replaceChildren(
        ...deck.map((animal, i) => {
          const card = h(
            'button',
            { class: 'mcard pop-in', style: { 'animation-delay': `${i * 50}ms` }, 'aria-label': 'card' },
            h('div', { class: 'inner' }, h('div', { class: 'face back' }, '⭐'), h('div', { class: 'face front emoji' }, animal.e))
          );
          card.dataset.id = animal.id;
          onTap(card, () => flip(card));
          return card;
        })
      );
    }

    async function flip(card) {
      if (busy || card === first || card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      c.sfx.flip();
      c.say(c.t.animals[card.dataset.id][0]);

      if (!first) {
        first = card;
        return;
      }

      const a = first;
      first = null;
      if (a.dataset.id === card.dataset.id) {
        a.classList.add('matched');
        card.classList.add('matched');
        c.sfx.good();
        for (const el of [a, card]) {
          const { x, y } = centerOf(el);
          c.sparkle(x, y);
        }
        matched += 2;
        if (matched === total) {
          await c.wait(700);
          await c.say(c.t.memoryDone);
          c.win();
          await c.celebrate();
          round();
        }
      } else {
        busy = true;
        await c.wait(1200);
        a.classList.remove('flipped');
        card.classList.remove('flipped');
        c.sfx.soft();
        busy = false;
      }
    }

    window.addEventListener('resize', layout);
    intro();
    round();
    return () => window.removeEventListener('resize', layout);
  },
};
