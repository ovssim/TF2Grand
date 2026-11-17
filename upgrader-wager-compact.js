/* TF2GRAND: compact Upgrader wager preview; presentation only. */
(() => {
  'use strict';
  function init() {
    const preview = document.getElementById('upgrade-wager-preview');
    const count = document.getElementById('upgrade-wager-count');
    if (!preview || !count) return;
    preview.classList.add('grand-compact-wagers');
    const style = document.createElement('style');
    style.textContent = `
      #upgrade-wager-preview.grand-compact-wagers {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        align-content: center; justify-items: stretch; gap: 8px;
        max-width: 100%; min-width: 0;
      }
      #upgrade-wager-preview.grand-compact-wagers > .upgrade-preview-item {
        min-width: 0; max-width: 100%; box-sizing: border-box;
      }
      #upgrade-wager-preview.grand-compact-wagers > .upgrade-preview-more {
        grid-column: 1 / -1; justify-self: center;
      }
      #upgrade-wager-preview.grand-compact-wagers > .duel-empty { grid-column: 1 / -1; }
    `;
    document.head.appendChild(style);
    let pending = false;
    function compact() {
      pending = false;
      const cards = [...preview.children].filter(el => el.classList.contains('upgrade-preview-item'));
      cards.forEach((card, i) => { card.hidden = i >= 4; });
      const total = Number((count.textContent || '').match(/\d+/)?.[0] || 0);
      const extra = Math.max(0, total - 4);
      let more = preview.querySelector('.upgrade-preview-more');
      if (extra) {
        if (!more) {
          more = document.createElement('span');
          more.className = 'upgrade-preview-more';
          preview.appendChild(more);
        }
        const label = `+${extra} items`;
        if (more.textContent !== label) more.textContent = label;
        more.hidden = false;
      } else if (more) {
        more.hidden = true;
      }
    }
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(compact);
    }
    // Only observe child insertions/removals. Ignore our own text/style changes.
    new MutationObserver(schedule).observe(preview, { childList: true });
    new MutationObserver(schedule).observe(count, { childList: true, characterData: true, subtree: true });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
