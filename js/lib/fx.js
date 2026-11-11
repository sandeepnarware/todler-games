import { h, rand } from './util.js';

const COLOURS = ['#ff5d73', '#ffd23f', '#3bd16f', '#3a86ff', '#ff9f1c', '#a463f2'];

/** Small burst of dots at a screen point. */
export function sparkle(x, y, colour) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const dot = h('div', { class: 'spark', style: { left: `${x}px`, top: `${y}px`, background: colour || COLOURS[i % COLOURS.length] } });
    document.body.append(dot);
    const angle = (i / count) * Math.PI * 2;
    const dist = rand(45, 90);
    dot.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0.3)`, opacity: 0 },
      ],
      { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1)' }
    ).onfinish = () => dot.remove();
  }
}

/** Big star + confetti. Never blocks touches. Resolves after ~1.5s. */
export function celebrate() {
  return new Promise((resolve) => {
    const star = h('div', { class: 'big-star' }, '⭐');
    const layer = h('div', { class: 'celebrate' }, star);
    document.body.append(layer);

    star.animate(
      [
        { transform: 'scale(0) rotate(-40deg)' },
        { transform: 'scale(1.2) rotate(10deg)', offset: 0.6 },
        { transform: 'scale(1) rotate(0deg)' },
      ],
      { duration: 650, easing: 'ease-out' }
    );

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let i = 0; i < (reduced ? 8 : 40); i++) {
      const bit = h('div', {
        class: 'confetti',
        style: { left: `${rand(0, 100)}vw`, background: COLOURS[i % COLOURS.length], width: `${rand(10, 18)}px` },
      });
      layer.append(bit);
      bit.animate(
        [
          { transform: 'translateY(0) rotate(0deg)' },
          { transform: `translate(${rand(-60, 60)}px, 110vh) rotate(${rand(-720, 720)}deg)` },
        ],
        { duration: rand(1400, 2200), delay: rand(0, 300), easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'both' }
      );
    }

    setTimeout(() => {
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350 }).onfinish = () => layer.remove();
      resolve();
    }, 1500);
  });
}
