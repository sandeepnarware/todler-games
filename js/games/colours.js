// Colour match — put each item into the basket of the same colour. Drag it, or tap the basket.
import { h, onTap, pick, sample, centerOf, replayClass } from '../lib/util.js';
import { draggable } from '../lib/drag.js';

const COLOUR = {
  red: '#ef3e4a',
  yellow: '#ffcf33',
  green: '#3bb54a',
  blue: '#3a86ff',
  orange: '#ff8c1a',
  purple: '#9b5de5',
};

const ITEMS = {
  red: [['apple', '🍎'], ['strawberry', '🍓'], ['cherries', '🍒'], ['tomato', '🍅']],
  yellow: [['banana', '🍌'], ['lemon', '🍋'], ['chick', '🐤'], ['star', '⭐']],
  green: [['broccoli', '🥦'], ['frog', '🐸'], ['leaf', '🍃'], ['cucumber', '🥒']],
  blue: [['whale', '🐳'], ['butterfly', '🦋'], ['drop', '💧']],
  orange: [['orange', '🍊'], ['carrot', '🥕'], ['pumpkin', '🎃']],
  purple: [['grapes', '🍇'], ['eggplant', '🍆']],
};

const ITEMS_PER_ROUND = 5;

export default {
  id: 'colours',
  emoji: '🎨',
  tint: '#ffc6ff',
  skill: 'Colour recognition and sorting',
  maxLevel: 2, // 2, 3, then 4 baskets

  start(stage, c) {
    const zone = h('div', { class: 'item-zone' });
    const baskets = h('div', { class: 'baskets' });
    stage.append(zone, baskets);

    let colours = [];
    let current = null; // { colour, id, emoji, el }
    let done = 0;
    let busy = false;
    let lastColour = null;

    const ask = () => current && c.say(c.t.colourAsk(c.t.things[current.id][0], c.t.colours[current.colour]));
    c.setReplay(() => ask());

    function round() {
      colours = sample(Object.keys(COLOUR), 2 + c.level());
      done = 0;
      baskets.replaceChildren();
      for (const colour of colours) {
        const basket = h('button', { class: 'basket pop-in', style: { '--c': COLOUR[colour] }, 'aria-label': c.t.colours[colour] }, h('div', { class: 'contents' }));
        basket.dataset.colour = colour;
        onTap(basket, () => tryPlace(basket, true));
        baskets.append(basket);
      }
      nextItem();
    }

    function nextItem() {
      const options = colours.length > 1 ? colours.filter((col) => col !== lastColour) : colours;
      const colour = pick(options);
      lastColour = colour;
      const [id, emoji] = pick(ITEMS[colour]);
      const el = h('div', { class: 'item emoji pop-in' }, emoji);
      current = { colour, id, emoji, el };
      zone.replaceChildren(el);
      draggable(el, {
        targets: () => [...baskets.children],
        onPick: () => c.sfx.pick(),
        onDrop: (basket) => tryPlace(basket, false),
      });
      busy = false;
      ask();
    }

    function tryPlace(basket, fromTap) {
      if (busy || !current) return false;
      const colour = basket.dataset.colour;
      if (colour !== current.colour) {
        c.sfx.soft();
        replayClass(basket, 'wobble');
        c.say(c.t.colourWrong(c.t.colours[colour]));
        return false;
      }
      busy = true;
      const item = current;
      current = null;
      const land = () => {
        item.el.remove();
        basket.querySelector('.contents').append(h('span', { class: 'in emoji pop-in' }, item.emoji));
        replayClass(basket, 'snap');
        const { x, y } = centerOf(basket);
        c.sparkle(x, y, COLOUR[colour]);
      };
      c.sfx.drop();
      if (fromTap) {
        const a = centerOf(item.el);
        const b = centerOf(basket);
        item.el.animate(
          [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(0.3)` }],
          { duration: 420, easing: 'cubic-bezier(.5,0,.5,1)', fill: 'forwards' }
        ).onfinish = land;
      } else {
        land();
      }
      afterCorrect(colour);
      return true;
    }

    async function afterCorrect(colour) {
      await Promise.all([c.say(c.t.colourRight(c.t.colours[colour])), c.wait(800)]);
      if (++done >= ITEMS_PER_ROUND) {
        c.win();
        await c.celebrate();
        round();
      } else {
        nextItem();
      }
    }

    round();
  },
};
