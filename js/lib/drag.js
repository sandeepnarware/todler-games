/**
 * Make an element draggable onto drop targets with a pointer (finger or mouse).
 * Hit-testing is forgiving: targets count as hit within `slop` px of their edge,
 * and the target nearest the finger wins.
 *
 * onDrop(target) must return true to accept; otherwise the element springs back.
 */
export function draggable(el, { targets, onPick, onDrop, onMiss, slop = 36 }) {
  let pid = null;
  let sx = 0;
  let sy = 0;
  let over = null;

  el.classList.add('draggable');

  const hit = (x, y) => {
    let best = null;
    let bestDist = Infinity;
    for (const t of targets()) {
      const r = t.getBoundingClientRect();
      if (x < r.left - slop || x > r.right + slop || y < r.top - slop || y > r.bottom + slop) continue;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    return best;
  };

  const setOver = (t) => {
    if (over === t) return;
    over?.classList.remove('drop-over');
    over = t;
    over?.classList.add('drop-over');
  };

  el.addEventListener('pointerdown', (e) => {
    if (pid !== null || el.classList.contains('locked')) return;
    e.preventDefault();
    pid = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    try {
      el.setPointerCapture(pid);
    } catch {
      /* ignore */
    }
    el.classList.add('dragging');
    onPick?.();
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    el.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.12)`;
    setOver(hit(e.clientX, e.clientY));
  });

  const end = (e, cancelled) => {
    if (e.pointerId !== pid) return;
    pid = null;
    el.classList.remove('dragging');
    const target = cancelled ? null : hit(e.clientX, e.clientY);
    setOver(null);
    const accepted = target ? onDrop(target) === true : false;
    if (!accepted) {
      const from = el.style.transform;
      el.style.transform = '';
      if (from) {
        el.animate([{ transform: from }, { transform: 'translate(0, 0) scale(1)' }], {
          duration: 320,
          easing: 'cubic-bezier(.3,1.4,.6,1)',
        });
      }
      onMiss?.(target);
    }
  };

  el.addEventListener('pointerup', (e) => end(e, false));
  el.addEventListener('pointercancel', (e) => end(e, true));
}
