// Animal sounds — hear a sound, find the animal. Listening and vocabulary.
import { h, onTap, pick, sample, shuffle, replayClass } from '../lib/util.js';

export const ANIMALS = [
  { id: 'cow', e: '🐮' },
  { id: 'dog', e: '🐶' },
  { id: 'cat', e: '🐱' },
  { id: 'duck', e: '🦆' },
  { id: 'sheep', e: '🐑' },
  { id: 'pig', e: '🐷' },
  { id: 'lion', e: '🦁' },
  { id: 'rooster', e: '🐓' },
  { id: 'horse', e: '🐴' },
  { id: 'frog', e: '🐸' },
  { id: 'owl', e: '🦉' },
  { id: 'monkey', e: '🐵' },
];

export default {
  id: 'animals',
  emoji: '🐮',
  tint: '#ffd6a5',
  skill: 'Listening, animal names and sounds',
  maxLevel: 2, // 2, 3, then 4 choices

  start(stage, c) {
    const grid = h('div', { class: 'choices' });
    stage.append(grid);

    let target = null;
    let busy = false;
    const words = (a) => c.t.animals[a.id];
    const ask = () => c.say(c.t.animalAsk(...words(target)));
    c.setReplay(() => ask());

    function round() {
      const n = 2 + c.level();
      target = pick(ANIMALS.filter((a) => a !== target));
      const options = shuffle([target, ...sample(ANIMALS.filter((a) => a !== target), n - 1)]);

      grid.replaceChildren();
      grid.style.setProperty('--n', n);
      grid.dataset.n = n;
      options.forEach((animal, i) => {
        const card = h('button', { class: 'choice emoji pop-in', 'aria-label': words(animal)[0], style: { 'animation-delay': `${i * 80}ms` } }, animal.e);
        onTap(card, () => choose(animal, card));
        grid.append(card);
      });
      busy = false;
      ask();
    }

    async function choose(animal, card) {
      if (busy) return;
      if (animal === target) {
        busy = true;
        c.sfx.good();
        card.classList.add('right');
        await Promise.all([c.say(c.t.animalRight(...words(animal))), c.wait(900)]);
        c.win();
        await c.celebrate({ praise: false });
        round();
      } else {
        c.sfx.soft();
        replayClass(card, 'wobble');
        c.say(c.t.animalWrong(...words(animal)));
      }
    }

    round();
  },
};
