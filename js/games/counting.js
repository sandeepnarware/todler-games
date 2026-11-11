// Count with me — tap each object while the app counts aloud. One-to-one counting.
import { h, onTap, pick, randInt, replayClass } from '../lib/util.js';

const THINGS = [
  ['apple', '🍎'],
  ['duck', '🦆'],
  ['star', '⭐'],
  ['ball', '⚽'],
  ['fish', '🐟'],
  ['car', '🚗'],
  ['balloon', '🎈'],
  ['flower', '🌸'],
];

// [min, max] objects per level.
const RANGES = [
  [1, 3],
  [2, 5],
  [3, 7],
  [5, 10],
];

export default {
  id: 'counting',
  emoji: '🔢',
  tint: '#fdffb6',
  skill: 'Counting 1–10, number words, one-to-one correspondence',
  maxLevel: 3,

  start(stage, c) {
    const field = h('div', { class: 'count-field' });
    const total = h('div', { class: 'count-total' });
    stage.append(field, total);

    let thing = null;
    const ask = () => thing && c.say(c.t.countIntro(c.t.things[thing[0]][1]));
    c.setReplay(() => ask());

    function round() {
      const [min, max] = RANGES[c.level()];
      const n = randInt(min, max);
      thing = pick(THINGS.filter((t) => t !== thing));
      let counted = 0;

      total.replaceChildren();
      field.replaceChildren();
      field.dataset.size = n <= 3 ? 'l' : n <= 6 ? 'm' : 's';

      for (let i = 0; i < n; i++) {
        const item = h('button', { class: 'count-item emoji pop-in', style: { 'animation-delay': `${i * 70}ms` } }, thing[1]);
        onTap(item, () => {
          if (item.classList.contains('counted')) {
            replayClass(item, 'wobble');
            return;
          }
          counted++;
          item.classList.add('counted');
          item.append(h('span', { class: 'badge' }, counted));
          replayClass(item, 'snap');
          c.sfx.count(counted);
          c.say(c.t.numbers[counted - 1]);
          if (counted === n) finish(n);
        });
        field.append(item);
      }
      ask();
    }

    async function finish(n) {
      await c.wait(700);
      total.replaceChildren(h('div', { class: 'num pop-in' }, n));
      const noun = c.t.things[thing[0]][n === 1 ? 0 : 1];
      await Promise.all([c.say(c.t.countDone(c.t.numbers[n - 1], noun)), c.wait(1000)]);
      c.win();
      await c.celebrate();
      round();
    }

    round();
  },
};
