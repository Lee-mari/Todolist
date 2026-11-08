/* Study Quest — bootstrap & global event delegation */
(function () {
  'use strict';
  const SQ = window.SQ;

  SQ.load();
  SQ.applyTheme();

  // clicks → data-act
  document.addEventListener('click', (e) => {
    if (SQ._menu && !e.target.closest('.popmenu')) {
      SQ.closeMenu();
      if (!e.target.closest('[data-act]')) return;
    }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    if (el.closest('#modal-root') && !el.closest('#main')) {
      // modal content handles its own clicks unless it uses global actions
      if (!SQ.actions[el.dataset.act]) return;
    }
    const fn = SQ.actions[el.dataset.act];
    if (!fn) return;
    // let checkboxes/radios toggle natively before re-render
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      setTimeout(() => fn(el, e), 0);
      return;
    }
    e.preventDefault();
    fn(el, e);
  });

  // keyboard
  document.addEventListener('keydown', (e) => {
    const k = e.target.closest && e.target.closest('[data-key]');
    if (k && SQ.keyHandlers[k.dataset.key]) {
      SQ.keyHandlers[k.dataset.key](e, k);
      if (e.defaultPrevented || e.cancelBubble) return;
    }
    if (e.key === 'Escape') {
      if (SQ._menu) return SQ.closeMenu();
      if (SQ.modal.isOpen()) return SQ.modal.close();
    }
    // Enter / Space on focusable non-button cards
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-act][tabindex]:not(button)')) {
      e.preventDefault();
      e.target.click();
    }
    // quick add: "n" outside inputs
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !SQ.modal.isOpen() && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      const r = SQ.route();
      if (r === 'week' || r === 'today') SQ.openItemModal({ k: r === 'today' ? SQ.today() : SQ.ui.selDate || SQ.today() });
      else if (r === 'board') SQ.actions.addCard({ dataset: { st: 'todo' } });
      else if (r === 'watch') SQ.actions.addVideo();
    }
  });

  document.addEventListener('input', (e) => {
    const ds = e.target.dataset || {};
    if (ds.lf) SQ.inputHandlers.lecture(e.target);
    else if (ds.key && SQ.inputHandlers[ds.key]) SQ.inputHandlers[ds.key](e.target);
  });
  document.addEventListener('change', (e) => {
    const h = e.target.dataset && e.target.dataset.change;
    if (h && SQ.changeHandlers[h]) SQ.changeHandlers[h](e.target);
  });

  window.addEventListener('hashchange', () => {
    SQ.ui.lecMobileEditor = false;
    SQ.render();
    window.scrollTo({ top: 0 });
  });
  window.addEventListener('resize', SQ.closeMenu);
  window.addEventListener('scroll', SQ.closeMenu, { passive: true });

  // another tab changed data → reload state
  window.addEventListener('storage', (e) => {
    if (e.key === 'studyquest.v1' && e.newValue) {
      try {
        SQ.state = Object.assign(SQ.emptyState(), JSON.parse(e.newValue));
        if (!SQ.modal.isOpen()) SQ.render();
      } catch (err) {}
    }
  });

  // ticking: timer every second, full refresh every minute when idle
  let lastMinute = new Date().getMinutes();
  let lastDay = SQ.today();
  setInterval(() => {
    document.querySelectorAll('[data-tick="timer"]').forEach((el) => (el.textContent = SQ.fmtTimer()));
    const now = new Date();
    if (now.getMinutes() !== lastMinute) {
      lastMinute = now.getMinutes();
      if (SQ.today() !== lastDay) {
        lastDay = SQ.today();
        SQ.housekeeping();
        SQ.save();
      }
      const busy = SQ.modal.isOpen() || SQ._menu || /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
      if (!busy && ['week', 'today'].includes(SQ.route())) SQ.render();
    }
  }, 1000);

  SQ.render();
  if (SQ.firstRun) {
    setTimeout(() => SQ.toast('환영해요! 예시 데이터로 채워 두었어요. 설정에서 언제든 비울 수 있어요'), 600);
  }
})();
