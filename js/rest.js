/* Study Quest — 휴식 (rest blocks + rest mode) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

  // what you'll do while resting. h = hue for the soft gradient
  SQ.REST_ACTS = [
    { id: 'free', e: '☁️', l: '그냥 쉬기', h: 205, tip: '아무것도 안 해도 괜찮아요. 쉬는 것도 공부의 일부예요.' },
    { id: 'walk', e: '🚶', l: '산책', h: 150, tip: '창문을 열거나 잠깐 걸으며 바깥 공기를 마셔요.' },
    { id: 'stretch', e: '🧘', l: '스트레칭', h: 265, tip: '목, 어깨, 손목을 천천히 돌려요. 허리도 쭉 펴고요.' },
    { id: 'nap', e: '😴', l: '낮잠', h: 235, tip: '알람 맞추고 눈 감기. 20분 안쪽이 개운해요.' },
    { id: 'tea', e: '🍵', l: '차 · 간식', h: 95, tip: '물 한 잔 먼저! 머리가 맑아져요.' },
    { id: 'meal', e: '🍱', l: '식사', h: 30, tip: '천천히 꼭꼭 씹어 먹어요. 화면은 잠깐 덮어 두고요.' },
    { id: 'music', e: '🎧', l: '음악', h: 330, tip: '좋아하는 노래 두세 곡. 눈은 감아도 좋아요.' },
    { id: 'game', e: '🎮', l: '게임 · 영상', h: 280, tip: '딱 정해둔 시간만큼만! 끝나면 바로 돌아와요.' },
  ];
  SQ.restAct = (it) => SQ.REST_ACTS.find((a) => a.id === (it && it.activity)) || SQ.REST_ACTS[0];
  const restStyle = (a) => `--h:${a.h}`;

  const TIPS = [
    '눈을 감고 20초, 먼 곳 바라보기 20초',
    '어깨를 귀까지 올렸다가 툭 떨어뜨려요',
    '물 한 잔 마셨나요?',
    '지금까지 한 것만으로도 충분히 잘했어요',
    '손바닥을 비벼 따뜻하게 만든 뒤 눈 위에 올려요',
    '창밖 하늘 색을 한번 봐요',
    '숨을 길게 내쉬면 몸이 먼저 쉬어요',
  ];

  /* ---------- timeline row ---------- */
  SQ.restRow = function (it, k) {
    const a = SQ.restAct(it);
    const t = SQ.today(), nm = SQ.nowMin();
    const st = SQ.toMin(it.start), len = SQ.dur2(it), en = st + len;
    const isNow = k === t && nm >= st && nm < en;
    const past = k < t || (k === t && nm >= en);
    const pct = isNow ? ((nm - st) / len) * 100 : 0;
    return `
    <div class="tl-row rest ${isNow ? 'is-now' : ''} ${past ? 'is-past' : ''}" style="${restStyle(a)}" id="it-${it.id}">
      <div class="tl-time"><b>${it.start}</b><span>${it.end}</span></div>
      <div class="tl-rail"><span class="rest-dot" aria-hidden="true">${a.e}</span></div>
      <article class="rest-card">
        <span class="rest-bub b1"></span><span class="rest-bub b2"></span><span class="rest-bub b3"></span>
        <div class="rest-top">
          <button class="rest-main" data-act="openRest" data-id="${it.id}" aria-label="${esc(it.title || a.l)} 휴식 모드 열기">
            <small>${isNow ? '<i class="rest-live"></i>지금 휴식 중' : past ? '쉬었어요' : 'Rest time'}</small>
            <h3>${esc(it.title || a.l)}</h3>
            <p>${a.e} ${esc(a.l)} · ${SQ.dur(len)}${it.memo ? ` · ${esc(it.memo)}` : ''}</p>
          </button>
          <button class="icon-btn rest-edit" data-act="editItem" data-id="${it.id}" aria-label="휴식 수정">${icon('pencil', 15)}</button>
        </div>
        ${
          isNow
            ? `<div class="rest-now">
                <span class="rest-bar"><i style="width:${pct}%"></i></span>
                <span>${SQ.dur(en - nm)} 남았어요</span>
              </div>
              <button class="btn rest-go" data-act="openRest" data-id="${it.id}">${icon('sparkle', 16)} 휴식 모드</button>`
            : ''
        }
      </article>
    </div>`;
  };

  /* ---------- modal fields ---------- */
  SQ.restFields = function (v) {
    const cur = (v && v.activity) || 'free';
    return `
      <div class="rest-only">
        <p class="rest-note">${icon('sparkle', 15)} 휴식은 공부 시간·클리어 집계에 들어가지 않아요. 마음 편히 쉬어요.</p>
        <div class="field">
          <span>무엇을 하며 쉴까요?</span>
          <div class="rest-acts" role="radiogroup" aria-label="휴식 활동">
            ${SQ.REST_ACTS.map(
              (a) => `<label style="${restStyle(a)}"><input type="radio" name="activity" value="${a.id}" ${a.id === cur ? 'checked' : ''}><span><em aria-hidden="true">${a.e}</em>${a.l}</span></label>`
            ).join('')}
          </div>
        </div>
        <label class="field"><span>쉬면서 하고 싶은 것 <em>선택</em></span><input class="input" name="memo" maxlength="60" value="${esc((v && v.memo) || '')}" placeholder="예: 편의점 다녀오기, 고양이 쓰다듬기"></label>
      </div>`;
  };

  /* ---------- rest mode overlay ---------- */
  let R = null; // { id, el, iv, pops, breath }

  function closeRest() {
    if (!R) return;
    clearInterval(R.iv);
    clearTimeout(R.bt);
    R.el.classList.remove('show');
    const el = R.el;
    setTimeout(() => el.remove(), 350);
    document.removeEventListener('keydown', R.onKey);
    if (R.lastFocus && R.lastFocus.focus) R.lastFocus.focus();
    R = null;
    document.body.classList.remove('modal-open');
  }
  SQ.closeRest = closeRest;

  SQ.openRest = function (id) {
    const f = SQ.findItem(id);
    if (!f) return;
    closeRest();
    const it = f.it, k = f.k;
    const a = SQ.restAct(it);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.className = 'rest-mode';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '휴식 모드');
    el.style.cssText = restStyle(a);
    const h = new Date().getHours();
    el.dataset.sky = h < 6 || h >= 20 ? 'night' : h < 10 ? 'dawn' : h < 17 ? 'day' : 'dusk';
    el.innerHTML = `
      <div class="rz-sky"></div>
      <div class="rz-bubbles" aria-hidden="true"></div>
      <div class="rz-in">
        <header class="rz-h">
          <span class="rz-k">${a.e} ${esc(a.l)} · ${it.start}–${it.end}</span>
          <button type="button" class="rz-x" data-rm="close" aria-label="휴식 모드 닫기">${icon('x', 20)}</button>
        </header>
        <div class="rz-center">
          <h2 class="rz-t">${esc(it.title || a.l)}</h2>
          <button type="button" class="rz-breath" data-rm="breath" aria-label="호흡 가이드 시작/멈춤">
            <span class="rz-ring"></span><span class="rz-ring r2"></span>
            <span class="rz-orb"><b class="rz-left">--:--</b><small class="rz-cue">눌러서 같이 숨쉬기</small></span>
          </button>
          <p class="rz-tip">${esc(it.memo ? '오늘의 휴식: ' + it.memo : a.tip)}</p>
        </div>
        <footer class="rz-f">
          <span class="rz-pops" aria-live="polite">비눗방울을 톡 터뜨려 봐요</span>
          <button type="button" class="rz-done" data-rm="close">충분히 쉬었어요</button>
        </footer>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('modal-open');
    R = { id, el, pops: 0, breath: false, lastFocus: document.activeElement, ended: false };
    requestAnimationFrame(() => el.classList.add('show'));
    el.querySelector('.rz-done').focus();

    const leftEl = el.querySelector('.rz-left');
    const cueEl = el.querySelector('.rz-cue');
    const tipEl = el.querySelector('.rz-tip');
    const popsEl = el.querySelector('.rz-pops');
    const bubbles = el.querySelector('.rz-bubbles');

    // countdown to the end of the rest block (if it's happening now), else a free 5-min timer
    const endAt = (() => {
      const isToday = k === SQ.today();
      const en = SQ.toMin(it.start) + SQ.dur2(it);
      if (isToday && SQ.nowMin() < en && SQ.nowMin() >= SQ.toMin(it.start)) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime() + en * 60000;
      }
      return Date.now() + Math.min(SQ.dur2(it), 60) * 60000;
    })();

    let tipI = 0;
    const tick = () => {
      if (!R || R.ended) return;
      const s = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      leftEl.textContent = `${Math.floor(s / 60)}:${SQ.pad(s % 60)}`;
      if (s === 0 && !R.ended) finish();
      // a new tip every 20s
      if (Math.round(Date.now() / 1000) % 20 === 0) {
        tipEl.classList.add('fade');
        setTimeout(() => {
          tipEl.textContent = TIPS[tipI++ % TIPS.length];
          tipEl.classList.remove('fade');
        }, 300);
      }
    };
    R.iv = setInterval(tick, 1000);
    tick();

    function finish() {
      R.ended = true;
      stopBreath();
      const next = SQ.dayItems(k).find((x) => x.kind === 'task' && !x.done && SQ.toMin(x.start) >= SQ.toMin(it.end) - 1);
      el.classList.add('ended');
      leftEl.textContent = '끝!';
      cueEl.textContent = '잘 쉬었어요';
      tipEl.textContent = next ? `다음은 “${next.title}” (${next.start}) 이에요. 가볍게 다시 시작해요!` : '개운해졌나요? 천천히 다시 시작해요.';
      el.querySelector('.rz-done').textContent = '다시 시작하기';
    }

    // breathing guide: 4s in · 2s hold · 6s out
    const PHASES = [['들이마셔요', 4000, 'in'], ['잠깐 멈춰요', 2000, 'hold'], ['천천히 내쉬어요', 6000, 'out']];
    function runPhase(i) {
      if (!R || !R.breath) return;
      const [txt, ms, cls] = PHASES[i % 3];
      cueEl.textContent = txt;
      el.dataset.breath = cls;
      el.style.setProperty('--bt', ms + 'ms');
      R.bt = setTimeout(() => runPhase(i + 1), ms);
    }
    function stopBreath() {
      if (!R) return;
      R.breath = false;
      clearTimeout(R.bt);
      delete el.dataset.breath;
      if (!R.ended) cueEl.textContent = '눌러서 같이 숨쉬기';
    }

    // floating bubbles you can pop
    const spawn = () => {
      if (!R || bubbles.childElementCount > 14) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rz-bub';
      b.tabIndex = -1;
      const size = 34 + Math.random() * 56;
      b.style.cssText = `width:${size}px;height:${size}px;left:${4 + Math.random() * 88}%;--dur:${9 + Math.random() * 8}s;--sway:${(Math.random() - 0.5) * 80}px`;
      b.addEventListener('animationend', () => b.remove());
      bubbles.appendChild(b);
    };
    if (!reduce) {
      for (let i = 0; i < 6; i++) setTimeout(spawn, i * 500);
      const sp = setInterval(() => (R && R.el === el ? spawn() : clearInterval(sp)), 1400);
    }
    const POP_MSG = ['톡!', '톡톡!', '좋아요', '시원하다', '하나 더?', '마음이 가벼워져요', '힐링 중', '비눗방울 장인'];

    el.addEventListener('click', (e) => {
      const bub = e.target.closest('.rz-bub');
      if (bub && !bub.classList.contains('pop')) {
        bub.classList.add('pop');
        setTimeout(() => bub.remove(), 320);
        R.pops++;
        popsEl.textContent = `${POP_MSG[Math.min(R.pops - 1, POP_MSG.length - 1)]} · ${R.pops}개 터뜨렸어요`;
        return;
      }
      const act = e.target.closest('[data-rm]');
      if (!act) return;
      if (act.dataset.rm === 'close') closeRest();
      else if (act.dataset.rm === 'breath' && !R.ended) {
        if (R.breath) stopBreath();
        else {
          R.breath = true;
          runPhase(0);
        }
      }
    });
    R.onKey = (e) => {
      if (e.key === 'Escape') closeRest();
    };
    document.addEventListener('keydown', R.onKey);
  };

  A.openRest = (el) => SQ.openRest(el.dataset.id);

  /* ---------- auto start when a rest begins ---------- */
  const shown = {};
  SQ.restTick = function (onLoad) {
    const t = SQ.today(), nm = SQ.nowMin();
    const cur = (SQ.state.schedules[t] || []).find((x) => x.kind === 'break' && nm >= SQ.toMin(x.start) && nm < SQ.toMin(x.start) + SQ.dur2(x));
    if (!cur || shown[cur.id] || R) return;
    shown[cur.id] = true;
    const a = SQ.restAct(cur);
    const busy = SQ.modal.isOpen() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
    // exactly at the start minute (and not typing): open the rest mode right away
    if (!onLoad && !busy && nm === SQ.toMin(cur.start)) SQ.openRest(cur.id);
    else SQ.toast(`${a.e} 지금은 휴식 시간이에요`, { action: '휴식 모드', onAction: () => SQ.openRest(cur.id) });
  };
})();
