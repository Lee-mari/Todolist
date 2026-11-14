/* Study Quest — core: utils, store, icons, modal, toast, menu, router */
(function () {
  'use strict';
  const SQ = (window.SQ = { actions: {}, views: {}, after: {}, ui: {}, keyHandlers: {}, inputHandlers: {} });
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- date & time utils ---------- */
  Object.assign(SQ, {
    pad,
    DOW: ['일', '월', '화', '수', '목', '금', '토'],
    uid() {
      return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
    },
    dkey(d) {
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    },
    pkey(k) {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d);
    },
    today() {
      return SQ.dkey(new Date());
    },
    nowMin() {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    },
    addDays(k, n) {
      const d = SQ.pkey(k);
      d.setDate(d.getDate() + n);
      return SQ.dkey(d);
    },
    diffDays(a, b) {
      return Math.round((SQ.pkey(b) - SQ.pkey(a)) / 86400000);
    },
    weekStart(k) {
      const d = SQ.pkey(k);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return SQ.dkey(d);
    },
    weekDays(ws) {
      return [0, 1, 2, 3, 4, 5, 6].map((i) => SQ.addDays(ws, i));
    },
    dow(k) {
      return SQ.pkey(k).getDay();
    },
    toMin(t) {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    },
    fromMin(m) {
      m = Math.max(0, Math.min(m, 23 * 60 + 59));
      return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    },
    dur(min) {
      min = Math.max(0, Math.round(min));
      const h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + '분';
      return m ? `${h}시간 ${m}분` : `${h}시간`;
    },
    durShort(min) {
      min = Math.max(0, Math.round(min));
      const h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + 'm';
      return m ? `${h}h ${m}m` : `${h}h`;
    },
    hours(min) {
      const h = Math.round((min / 60) * 10) / 10;
      return h + 'h';
    },
    md(k) {
      const d = SQ.pkey(k);
      return d.getMonth() + 1 + '.' + d.getDate();
    },
    longDate(k) {
      const d = SQ.pkey(k);
      return `${d.getMonth() + 1}월 ${d.getDate()}일 ${SQ.DOW[d.getDay()]}요일`;
    },
    weekLabel(ws) {
      // a week belongs to the month of its Thursday
      const th = SQ.pkey(SQ.addDays(ws, 3));
      return `${th.getMonth() + 1}월 ${Math.ceil(th.getDate() / 7)}주차`;
    },
    weekRange(ws) {
      return `${SQ.md(ws)} – ${SQ.md(SQ.addDays(ws, 6))}`;
    },
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    debounce(fn, ms) {
      let t;
      return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
      };
    },
  });

  /* ---------- colors ---------- */
  SQ.COLORS = {
    pink: '#e0668b', rose: '#d9486f', coral: '#ef8a6a', orange: '#f0a050', yellow: '#e3b23c',
    green: '#4fae74', teal: '#2fa69b', sky: '#5aa9e6', blue: '#6f9be8', purple: '#9d7ce3',
    violet: '#c07bd0', gray: '#9a8f94',
  };
  SQ.COLOR_NAMES = Object.keys(SQ.COLORS);
  SQ.cvar = (color) => `--c:${SQ.COLORS[color] || SQ.COLORS.gray}`;
  SQ.SUBJECT_ICONS = ['book', 'code', 'layout', 'headphones', 'node', 'drop', 'box', 'sun', 'globe', 'pen', 'music', 'star'];

  /* ---------- icons (stroke, 24 viewbox) ---------- */
  const P = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
    notebook: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M4 13h16M9 17h0"/>',
    chart: '<path d="M5 20V12M12 20V5M19 20v-6"/>',
    board: '<rect x="3" y="4" width="4.5" height="13" rx="1.5"/><rect x="9.75" y="4" width="4.5" height="8" rx="1.5"/><rect x="16.5" y="4" width="4.5" height="10" rx="1.5"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.3-5.4 3.6-7.5.3 1.9 1.3 3 2.4 3.4C11.6 7.5 12.9 5 15 3c.3 3.3 3.5 5.6 3.5 10.6 0 4.3-2.8 7.4-6.5 7.4z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chevL: '<path d="M14.5 6l-6 6 6 6"/>',
    chevR: '<path d="M9.5 6l6 6-6 6"/>',
    chevD: '<path d="M6 9.5l6 6 6-6"/>',
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    scissors: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.1 7.6L20 18M8.1 16.4L20 6"/>',
    play: '<path d="M7 5v14l12-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2M12 3.5v2"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="2"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="2"/>',
    code: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/>',
    layout: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M9.5 9.5V20"/>',
    book: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M5 13.5h14"/>',
    node: '<circle cx="6.5" cy="7" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/><path d="M9 7h3a3 3 0 0 1 3 3v4.5"/>',
    drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
    box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    pen: '<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    bulb: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.4h6c0-1 .3-1.8 1-2.4a6.5 6.5 0 0 0-4-11.6z"/>',
    trash: '<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 13.5h10l1-13.5"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M12 3.5v12M7 11l5 5 5-5M4.5 20.5h15"/>',
    upload: '<path d="M12 16V4M7 8.5l5-5 5 5M4.5 20.5h15"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    arrowR: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    grip: '<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v0"/>',
    video: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4.5h11.5l-2.2 4 2.2 4H5"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    cloud: '<path d="M7 19h10.5a4.5 4.5 0 0 0 .6-9 6 6 0 0 0-11.6 1.5A3.8 3.8 0 0 0 7 19z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  };
  SQ.icon = (name, size = 18, cls = '') =>
    `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.book}</svg>`;

  /* ---------- store ---------- */
  const KEY = 'studyquest.v1';
  SQ.emptyState = () => ({
    version: 1,
    profile: { name: '' },
    settings: { doingLimit: 3, theme: 'system' },
    subjects: [],
    schedules: {},
    weekGoals: {},
    weekQuests: {},
    dayGoals: {},
    board: [],
    doneLog: [],
    courses: [],
    lectures: [],
    records: {},
    videos: [],
    timer: null,
  });

  SQ.load = function () {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {}
    if (raw) {
      try {
        SQ.state = Object.assign(SQ.emptyState(), JSON.parse(raw));
        SQ.state.settings = Object.assign(SQ.emptyState().settings, SQ.state.settings);
      } catch (e) {
        SQ.state = SQ.sampleState();
      }
    } else {
      SQ.state = SQ.sampleState();
      SQ.firstRun = true;
    }
    SQ.housekeeping();
    SQ.save(true);
  };

  SQ.save = function (quiet) {
    try {
      localStorage.setItem(KEY, JSON.stringify(SQ.state));
    } catch (e) {
      SQ.toast('브라우저 저장 공간에 저장하지 못했어요');
    }
    if (SQ.onSaved && !quiet) SQ.onSaved();
  };

  // daily-repeat board cards come back to "할 일" the next day
  SQ.housekeeping = function () {
    const t = SQ.today();
    SQ.state.board.forEach((c) => {
      if (c.repeat === 'daily' && c.status === 'done' && c.doneAt && c.doneAt < t) {
        c.status = 'todo';
        c.doneAt = null;
        (c.subtasks || []).forEach((s) => (s.done = false));
      }
    });
  };

  /**
   * Mutate state, persist, re-render.
   * opts.undo: message → shows toast with 되돌리기
   * opts.toast: message
   */
  SQ.commit = function (fn, opts = {}) {
    const snap = opts.undo ? JSON.stringify(SQ.state) : null;
    fn(SQ.state);
    SQ.save();
    if (opts.render !== false) SQ.render();
    if (opts.undo) {
      SQ.toast(opts.undo, {
        action: '되돌리기',
        onAction() {
          SQ.state = JSON.parse(snap);
          SQ.save();
          SQ.render();
        },
      });
    } else if (opts.toast) SQ.toast(opts.toast);
  };

  SQ.subj = (id) => SQ.state.subjects.find((s) => s.id === id) || { id: '', name: '기타', color: 'gray', icon: 'book' };

  SQ.subjectOptions = (sel, withNew = true) =>
    `<option value="">과목 없음</option>` +
    SQ.state.subjects.map((s) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${SQ.esc(s.name)}</option>`).join('') +
    (withNew ? `<option value="__new">+ 새 과목 만들기…</option>` : '');

  SQ.nextColor = () => {
    const used = SQ.state.subjects.map((s) => s.color);
    return SQ.COLOR_NAMES.find((c) => c !== 'gray' && !used.includes(c)) || SQ.COLOR_NAMES[used.length % 11];
  };

  // resolve "__new" subject select + new subject name in a form result
  SQ.resolveSubject = function (data) {
    if (data.subjectId !== '__new') return data.subjectId || '';
    const name = (data.newSubject || '').trim();
    if (!name) return '';
    const exist = SQ.state.subjects.find((s) => s.name === name);
    if (exist) return exist.id;
    const s = { id: SQ.uid(), name, color: SQ.nextColor(), icon: 'book' };
    SQ.state.subjects.push(s);
    return s.id;
  };

  SQ.colorPicker = (name, value) =>
    `<div class="swatches">${SQ.COLOR_NAMES.map(
      (c) => `<label class="swatch" style="${SQ.cvar(c)}" title="${c}"><input type="radio" name="${name}" value="${c}" ${c === value ? 'checked' : ''}><span></span></label>`
    ).join('')}</div>`;

  SQ.iconPicker = (name, value) =>
    `<div class="iconpick">${SQ.SUBJECT_ICONS.map(
      (i) => `<label><input type="radio" name="${name}" value="${i}" ${i === value ? 'checked' : ''}><span>${SQ.icon(i, 18)}</span></label>`
    ).join('')}</div>`;

  /* ---------- toast ---------- */
  SQ.toast = function (msg, opts = {}) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span>${SQ.esc(msg)}</span>` + (opts.action ? `<button type="button">${SQ.esc(opts.action)}</button>` : '');
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const kill = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    };
    if (opts.action) el.querySelector('button').onclick = () => {
      opts.onAction();
      kill();
    };
    setTimeout(kill, opts.action ? 6000 : 2800);
  };

  /* ---------- modal ---------- */
  SQ.modal = {
    open(o) {
      const root = document.getElementById('modal-root');
      SQ.modal.cfg = o;
      SQ.modal.lastFocus = document.activeElement;
      root.innerHTML = `
        <div class="modal-backdrop" data-close></div>
        <form class="modal ${o.wide ? 'wide' : ''}" novalidate role="dialog" aria-modal="true" aria-label="${SQ.esc(o.title)}">
          <header class="modal-h">
            <div><h2>${SQ.esc(o.title)}</h2>${o.sub ? `<p>${SQ.esc(o.sub)}</p>` : ''}</div>
            <button type="button" class="icon-btn" data-close aria-label="닫기">${SQ.icon('x')}</button>
          </header>
          <div class="modal-b">${o.body}</div>
          <p class="form-err" hidden></p>
          <footer class="modal-f">
            ${o.onDelete ? `<button type="button" class="btn ghost danger" data-del>${SQ.icon('trash', 16)} 삭제</button>` : ''}
            <span class="sp"></span>
            ${o.noCancel ? '' : `<button type="button" class="btn line" data-close>${o.cancel || '취소'}</button>`}
            ${o.onSubmit ? `<button type="submit" class="btn ${o.danger ? 'danger-fill' : 'primary'}">${o.submit || '저장'}</button>` : ''}
          </footer>
        </form>`;
      root.classList.add('open');
      document.body.classList.add('modal-open');
      const form = root.querySelector('form');
      root.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => SQ.modal.close()));
      if (o.onDelete) root.querySelector('[data-del]').onclick = () => o.onDelete();
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!o.onSubmit) return;
        const data = {};
        new FormData(form).forEach((v, k) => {
          if (k in data) data[k] = [].concat(data[k], v);
          else data[k] = v;
        });
        const res = o.onSubmit(data, form);
        if (typeof res === 'string') {
          const err = form.querySelector('.form-err');
          err.textContent = res;
          err.hidden = false;
          return;
        }
        if (res !== false) SQ.modal.close();
      };
      if (o.onOpen) o.onOpen(form);
      const first = form.querySelector('[autofocus], .modal-b input:not([type=radio]):not([type=checkbox]):not([type=hidden]), .modal-b textarea');
      if (first && !o.noFocus) setTimeout(() => first.focus(), 30);
    },
    close() {
      const root = document.getElementById('modal-root');
      if (!root.classList.contains('open')) return;
      root.classList.remove('open');
      root.innerHTML = '';
      document.body.classList.remove('modal-open');
      const cb = SQ.modal.cfg && SQ.modal.cfg.onClose;
      SQ.modal.cfg = null;
      if (cb) cb();
      if (SQ.pendingRender && !SQ.modal.isOpen()) {
        SQ.pendingRender = false;
        SQ.render();
      }
      if (SQ.modal.lastFocus && SQ.modal.lastFocus.focus) SQ.modal.lastFocus.focus();
    },
    isOpen() {
      return document.getElementById('modal-root').classList.contains('open');
    },
  };

  SQ.confirm = (msg, o = {}) =>
    new Promise((resolve) => {
      let ok = false;
      SQ.modal.open({
        title: o.title || '확인',
        body: `<p class="confirm-msg">${SQ.esc(msg)}</p>`,
        submit: o.ok || '확인',
        danger: o.danger,
        noFocus: true,
        onSubmit() {
          ok = true;
        },
        onClose() {
          resolve(ok);
        },
      });
    });

  /* ---------- popover menu ---------- */
  SQ.menu = function (anchor, items) {
    SQ.closeMenu();
    const m = document.createElement('div');
    m.className = 'popmenu';
    m.setAttribute('role', 'menu');
    m.innerHTML = items
      .map((it, i) => (it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}">${SQ.icon(it.icon || 'arrowR', 16)}<span>${SQ.esc(it.label)}</span></button>`))
      .join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = Math.min(window.innerWidth - mw - 8, Math.max(8, r.right - mw));
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    m.style.left = left + window.scrollX + 'px';
    m.style.top = top + window.scrollY + 'px';
    m.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      SQ.closeMenu();
      items[+b.dataset.i].run();
    };
    SQ._menu = m;
    setTimeout(() => m.querySelector('button') && m.querySelector('button').focus(), 0);
  };
  SQ.closeMenu = () => {
    if (SQ._menu) SQ._menu.remove();
    SQ._menu = null;
  };

  /* ---------- schedule helpers (shared) ---------- */
  SQ.dur2 = (it) => {
    let d = SQ.toMin(it.end) - SQ.toMin(it.start);
    if (d < 0) d += 1440;
    return d;
  };
  SQ.dayItems = (k) => (SQ.state.schedules[k] || []).slice().sort((a, b) => SQ.toMin(a.start) - SQ.toMin(b.start) || (a.kind === 'break') - (b.kind === 'break'));
  SQ.liveTimerMin = (it) => {
    const t = SQ.state.timer;
    return t && t.id === it.id ? Math.floor((Date.now() - t.startedAt) / 60000) : 0;
  };
  SQ.itemStudied = (it) => (it.kind !== 'task' ? 0 : it.done ? Math.max(SQ.dur2(it), it.spentMin || 0) : (it.spentMin || 0) + SQ.liveTimerMin(it));
  SQ.studiedOn = (k) => (SQ.state.schedules[k] || []).reduce((a, it) => a + SQ.itemStudied(it), 0);
  SQ.plannedOn = (k) => (SQ.state.schedules[k] || []).filter((i) => i.kind === 'task').reduce((a, it) => a + SQ.dur2(it), 0);
  SQ.actualOn = (k) => (SQ.state.records[k] ? SQ.state.records[k].minutes : SQ.studiedOn(k));
  SQ.units = (items) => {
    let done = 0, total = 0;
    items.filter((i) => i.kind === 'task').forEach((it) => {
      const subs = it.subtasks || [];
      if (subs.length) {
        total += subs.length;
        done += it.done ? subs.length : subs.filter((s) => s.done).length;
      } else {
        total += 1;
        done += it.done ? 1 : 0;
      }
    });
    return { done, total };
  };
  SQ.weekUnits = (ws) => SQ.units(SQ.weekDays(ws).flatMap((k) => SQ.state.schedules[k] || []));
  SQ.findItem = (id) => {
    for (const k in SQ.state.schedules) {
      const it = SQ.state.schedules[k].find((i) => i.id === id);
      if (it) return { k, it };
    }
    return null;
  };
  SQ.streak = () => {
    let k = SQ.today(), n = 0;
    if (SQ.actualOn(k) <= 0) k = SQ.addDays(k, -1);
    while (SQ.actualOn(k) > 0 && n < 3650) {
      n++;
      k = SQ.addDays(k, -1);
    }
    return n;
  };

  /* ---------- router & render ---------- */
  SQ.NAV = [
    { id: 'today', label: '오늘', short: '오늘', icon: 'sun' },
    { id: 'week', label: '이번 주', short: '이번 주', icon: 'calendar' },
    { id: 'board', label: '공부 보드', short: '보드', icon: 'board' },
    { id: 'watch', label: '영상 진도', short: '영상', icon: 'video' },
    { id: 'lectures', label: '강의 노트', short: '노트', icon: 'notebook' },
    { id: 'record', label: '공부 기록', short: '기록', icon: 'chart' },
    { id: 'settings', label: '설정', short: '설정', icon: 'settings' },
  ];
  SQ.route = () => {
    const r = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
    return SQ.NAV.some((n) => n.id === r) ? r : 'week';
  };
  SQ.go = (r) => {
    if (SQ.route() === r) SQ.render();
    else location.hash = '#/' + r;
  };

  SQ.renderNav = function () {
    const r = SQ.route();
    const streak = SQ.streak();
    const items = SQ.NAV.map(
      (n) => `<a href="#/${n.id}" class="nav-i ${r === n.id ? 'on' : ''}" ${r === n.id ? 'aria-current="page"' : ''}>${SQ.icon(n.icon, 19)}<span>${n.label}</span></a>`
    ).join('');
    document.getElementById('sidebar').innerHTML = `
      <a href="#/week" class="brand"><span class="brand-mark">${SQ.icon('star', 18)}</span><span class="brand-t">Study Quest</span></a>
      <nav class="nav" aria-label="주요 메뉴">${items}</nav>
      <div class="streak-card">
        <span class="streak-ic">${SQ.icon('flame', 18)}</span>
        <div><small>연속 공부</small><b>${streak}일째</b></div>
      </div>
      ${SQ.syncPill ? SQ.syncPill() : ''}`;
    document.getElementById('tabbar').innerHTML = SQ.NAV.map(
      (n) => `<a href="#/${n.id}" class="tab-i ${r === n.id ? 'on' : ''}" ${r === n.id ? 'aria-current="page"' : ''}>${SQ.icon(n.icon, 20)}<span>${n.short}</span></a>`
    ).join('');
  };

  SQ.render = function () {
    const r = SQ.route();
    SQ.closeMenu();
    SQ.renderNav();
    const main = document.getElementById('main');
    main.innerHTML = `<div class="page page-${r}">${SQ.views[r]()}</div>`;
    document.title = (SQ.NAV.find((n) => n.id === r) || {}).label + ' · Study Quest';
    if (SQ.after[r]) SQ.after[r]();
    if (SQ.ui.focus) {
      const el = document.querySelector(SQ.ui.focus);
      SQ.ui.focus = null;
      if (el) el.focus();
    }
  };

  SQ.applyTheme = function () {
    const t = SQ.state.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  };

  SQ.pageHead = (kicker, title, right = '', sub = '') => `
    <header class="phead">
      <div>
        ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
        <h1 class="ptitle">${title}</h1>
        ${sub ? `<p class="psub">${sub}</p>` : ''}
      </div>
      <div class="phead-r">${right}</div>
    </header>`;

  SQ.segBar = (done, total, max = 12) => {
    if (!total) return '';
    const n = Math.min(total, max);
    const filled = Math.round((done / total) * n);
    let s = '<span class="segs">';
    for (let i = 0; i < n; i++) s += `<i class="${i < filled ? 'on' : ''}"></i>`;
    return s + '</span>';
  };
})();
