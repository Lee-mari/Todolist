/* Study Quest — 일정마다 이정표(짧은 이름 + 세부 설명) · 질문은 카드에서 바로 답하기 */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;
  const ui = SQ.ui;
  ui.qOpen = ui.qOpen || {};

  SQ.DEFAULT_QS = ['오늘 배운 것 중에 몇 번 이정표에 쓸 수 있어?', '5분 안에 할 수 있는 첫 행동은 뭐야?'];

  /* ---------- data helpers (with migration from the old per-item q) ---------- */
  SQ.itemQs = (it) => {
    if (Array.isArray(it.qs)) return it.qs;
    const o = it.q;
    if (!o) return [];
    let ms = '';
    if (o.msId === 'none') ms = '아직 모르겠어';
    else if (o.msId)
      Object.values(SQ.state.weekQuests || {}).forEach((w) => {
        const m = (w.milestones || []).find((x) => x.id === o.msId);
        if (m) ms = `🏁 ${m.text}`;
      });
    return [
      { id: 'q1', q: SQ.DEFAULT_QS[0], a: [ms, o.use || ''].filter(Boolean).join(' · ') },
      { id: 'q2', q: SQ.DEFAULT_QS[1], a: o.first || '' },
    ];
  };
  SQ.itemAsk = (it) => (typeof it.qAsk === 'boolean' ? it.qAsk : !!(it.q && it.q.ask));
  const answered = (qs) => qs.length > 0 && qs.every((x) => (x.a || '').trim());
  SQ.qGated = (it) => it.kind === 'task' && !it.done && SQ.itemAsk(it) && SQ.itemQs(it).length > 0 && !answered(SQ.itemQs(it));
  SQ.qAnswered = (it) => answered(SQ.itemQs(it));

  function copyText(text) {
    const done = () => SQ.toast('질문을 복사했어요. 그대로 붙여넣고 힌트만 물어봐요 💡');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => prompt('복사해서 쓰세요', text));
    else prompt('복사해서 쓰세요', text);
  }
  function hintText(title, ms, qs) {
    return (
      `[힌트 요청]${title ? `\n작업: ${title}` : ''}` +
      (ms.length ? `\n이정표: ${ms.map((m, i) => `${i + 1}. ${m.text}${m.detail ? ` (${m.detail})` : ''}`).join(' → ')}` : '') +
      '\n' +
      qs.map((x, i) => `${i + 1}. ${x.q}\n   내 생각: ${(x.a || '').trim() || '(아직 모르겠어요)'}`).join('\n') +
      '\n\n정답 말고 힌트만 주세요.'
    );
  }

  /* ---------- modal: milestones + question texts ---------- */
  const msRow = (m) => `
    <div class="ms-row">
      <input class="input ms-t" name="msText" maxlength="24" value="${esc(m.text || '')}" placeholder="짧게 (예: 트리거 놓기)" aria-label="이정표 이름">
      <input class="input ms-d" name="msDetail" maxlength="200" value="${esc(m.detail || '')}" placeholder="세부 설명 · 마우스 올리면 보여요 (선택)" aria-label="세부 설명">
      <button type="button" class="icon-btn" data-delrow aria-label="이정표 빼기">${icon('x', 16)}</button>
    </div>`;
  const qRow = (x) => `
    <div class="q-row">
      <input class="input q-q" name="qQ" maxlength="80" value="${esc(x.q || '')}" placeholder="질문 (예: 이걸 끝내면 뭐가 가능해져?)" aria-label="질문">
      <button type="button" class="icon-btn" data-delrow aria-label="질문 빼기">${icon('x', 16)}</button>
    </div>`;

  SQ.questFields = function (it, preMs) {
    const isNew = !it || it.kind !== 'task';
    const ms = isNew ? (preMs || []).map((text) => ({ text })) : it.milestones || [];
    const qs = isNew ? (SQ.state.settings.defaultQs || SQ.DEFAULT_QS).map((q) => ({ q })) : SQ.itemQs(it);
    const ask = isNew ? !!SQ.state.settings.askFirst : SQ.itemAsk(it);
    return `
      <div class="qbox">
        <div class="qbox-h"><b>🧭 이정표</b><small>이 일정에서 지나갈 단계 · 이름은 짧게, 설명은 따로</small></div>
        <div class="ms-rows">${(ms.length ? ms : [{}]).map(msRow).join('')}</div>
        <div class="row wrap"><button type="button" class="chip-btn dashed" data-addms>${icon('plus', 14)} 이정표 추가</button></div>
      </div>
      <div class="qbox">
        <div class="qbox-h"><b>❓ 질문</b><small>답은 일정 카드에서 질문 바로 밑에 적어요</small></div>
        <div class="q-rows">${qs.map(qRow).join('')}</div>
        <div class="row wrap"><button type="button" class="chip-btn dashed" data-addq>${icon('plus', 14)} 질문 추가</button></div>
        <label class="check-row"><input type="checkbox" name="qAsk" ${ask ? 'checked' : ''}><span class="cb">${icon('check', 13)}</span><span>시작 전에 질문부터 · 답해야 이정표가 열려요</span></label>
        <div class="q-help"><span>💡 막히면 질문째로 복사해서 힌트만 받아요</span><button type="button" class="chip-btn" data-copysq>${icon('copy', 14)} 힌트 복사</button></div>
      </div>`;
  };

  SQ.formData = (form) => {
    const d = {};
    new FormData(form).forEach((v, k) => (d[k] = k in d ? [].concat(d[k], v) : v));
    return d;
  };

  SQ.bindQuest = function (form, ctx) {
    const msBox = form.querySelector('.ms-rows'), qBox = form.querySelector('.q-rows');
    form.addEventListener('click', (e) => {
      const del = e.target.closest('[data-delrow]');
      if (del) del.closest('.ms-row, .q-row').remove();
    });
    form.querySelector('[data-addms]').addEventListener('click', () => {
      msBox.insertAdjacentHTML('beforeend', msRow({}));
      msBox.lastElementChild.querySelector('.ms-t').focus();
    });
    form.querySelector('[data-addq]').addEventListener('click', () => {
      qBox.insertAdjacentHTML('beforeend', qRow({}));
      qBox.lastElementChild.querySelector('.q-q').focus();
    });
    form.querySelector('[data-copysq]').addEventListener('click', () => {
      const r = SQ.readQuest(SQ.formData(form), ctx.it);
      const title = (form.title && form.title.value) || (ctx.it && ctx.it.title) || '';
      copyText(hintText(title, r.milestones, r.qs));
    });
  };

  // modal → { milestones, qs, qAsk }; answers are kept by matching question text
  SQ.readQuest = function (d, prev) {
    const oldQs = prev ? SQ.itemQs(prev) : [];
    const qs = [];
    [].concat(d.qQ || []).forEach((q) => {
      q = String(q || '').trim();
      if (!q || qs.some((x) => x.q === q)) return;
      const o = oldQs.find((x) => x.q === q);
      qs.push({ id: o ? o.id : SQ.uid(), q, a: o ? o.a || '' : '' });
    });
    const tt = [].concat(d.msText || []), dd = [].concat(d.msDetail || []);
    const old = (prev && prev.milestones) || [];
    const milestones = [];
    tt.forEach((text, i) => {
      text = String(text || '').trim();
      const detail = String(dd[i] || '').trim();
      if (!text && !detail) return;
      if (!text) text = detail.slice(0, 24);
      const o = old.find((m) => m.text === text) || old[i];
      milestones.push({ id: o ? o.id : SQ.uid(), text, detail, done: o && o.text === text ? !!o.done : false });
    });
    return { qs, milestones, qAsk: !!d.qAsk };
  };

  /* ---------- card: milestone path ---------- */
  SQ.msPath = (it, isNow) => {
    const ms = it.milestones || [];
    if (!ms.length) return '';
    const all = ms.every((m) => m.done);
    const cur = ms.findIndex((m) => !m.done);
    return `<ol class="qc-path in-card" aria-label="이정표">${ms
      .map(
        (m, i) => `<li class="${m.done ? 'done' : ''} ${isNow && i === cur ? 'cur' : ''}">
          <button class="qc-step" data-act="toggleItemMs" data-id="${it.id}" data-mid="${m.id}" aria-pressed="${!!m.done}" aria-label="${i + 1}번 이정표 ${esc(m.text)} ${m.done ? '완료 취소' : '완료'}${m.detail ? ' · ' + esc(m.detail) : ''}">
            <span class="qc-n">${m.done ? icon('check', 14) : i + 1}</span>
            <span class="qc-tw"><span class="qc-t">${esc(m.text)}${m.detail ? '<i class="qc-more" aria-hidden="true">i</i>' : ''}</span>${m.detail ? `<span class="qc-d">${esc(m.detail)}</span>` : ''}</span>
          </button>
          ${m.detail ? `<span class="qc-tip" role="tooltip">${esc(m.detail)}</span>` : ''}
        </li>`
      )
      .join('')}<li class="qc-goal ${all ? 'done' : ''}"><span class="qc-n" aria-hidden="true">🏁</span></li></ol>`;
  };

  /* ---------- card: questions with answers written right below ---------- */
  SQ.qInline = (it, expanded) => {
    const qs = SQ.itemQs(it);
    if (!qs.length) return '';
    const gated = SQ.qGated(it);
    const done = answered(qs);
    const open = gated || ui.qOpen[it.id] != null ? gated || ui.qOpen[it.id] : !done || expanded;
    if (!open)
      return `<button class="q-sum" data-act="toggleQ" data-id="${it.id}">❓ 질문 ${qs.length}개 · 답 다 했어요 ${icon('chevD', 14)}</button>`;
    return `
      <div class="q-inline ${gated ? 'gated' : ''}">
        <div class="q-in-h">
          <b>${gated ? '❓ 질문에 답하면 이정표가 열려요' : '❓ 질문'}</b>
          <span class="sp"></span>
          <button class="chip-btn xs" data-act="copyHint" data-id="${it.id}">${icon('copy', 13)} 힌트 복사</button>
          ${!gated && done ? `<button class="icon-btn xs" data-act="toggleQ" data-id="${it.id}" aria-label="질문 접기">${icon('chevD', 14)}</button>` : ''}
        </div>
        ${qs
          .map(
            (x, i) => `<label class="q-item">
              <span class="q-label"><b class="qn">${i + 1}</b>${esc(x.q)}</span>
              <textarea class="input q-ans-in" rows="1" maxlength="300" data-qa="${it.id}" data-qid="${x.id}" placeholder="여기에 바로 답을 적어요">${esc(x.a || '')}</textarea>
            </label>`
          )
          .join('')}
      </div>`;
  };

  // autosave answers as you type; re-render on blur when the gate opens/closes
  const grow = (t) => {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  };
  const saveSoon = SQ.debounce(() => SQ.save(), 400);
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.qa) return;
    grow(t);
    const f = SQ.findItem(t.dataset.qa);
    if (!f) return;
    if (!Array.isArray(f.it.qs)) {
      f.it.qs = SQ.itemQs(f.it).map((x) => Object.assign({}, x));
      f.it.qAsk = SQ.itemAsk(f.it);
      delete f.it.q;
    }
    const q = f.it.qs.find((x) => x.id === t.dataset.qid);
    if (q) q.a = t.value;
    saveSoon();
  });
  document.addEventListener('focusout', (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.qa) return;
    const f = SQ.findItem(t.dataset.qa);
    if (!f) return;
    const wasGated = t.closest('.q-inline').classList.contains('gated');
    SQ.save();
    // only re-render if the gate changed and focus didn't just move to another answer box
    setTimeout(() => {
      const next = document.activeElement;
      if (next && next.dataset && next.dataset.qa) return;
      if (wasGated && !SQ.qGated(f.it)) {
        SQ.toast('좋아요, 이정표가 열렸어요 👣');
        SQ.render();
      }
    }, 0);
  });
  SQ.growAnswers = () => document.querySelectorAll('[data-qa]').forEach(grow);
  SQ.after.today = SQ.after.week = () => SQ.growAnswers();

  /* ---------- actions ---------- */
  A.toggleQ = (el) => {
    const card = el.closest('.tl-card');
    ui.qOpen[el.dataset.id] = !(card && card.querySelector('.q-inline'));
    SQ.render();
  };
  A.copyHint = (el) => {
    const it = SQ.findItem(el.dataset.id).it;
    copyText(hintText(it.title, it.milestones || [], SQ.itemQs(it)));
  };
  A.toggleItemMs = (el) => {
    let now = false, all = false, title = '';
    SQ.commit((S) => {
      const f = SQ.findItem(el.dataset.id);
      const m = f && (f.it.milestones || []).find((x) => x.id === el.dataset.mid);
      if (!m) return;
      m.done = now = !m.done;
      all = f.it.milestones.every((x) => x.done);
      title = f.it.title;
      if (!m.done) f.it.done = false;
      else if (all && !f.it.done) {
        f.it.done = true;
        if (S.timer && S.timer.id === f.it.id) {
          f.it.spentMin = (f.it.spentMin || 0) + SQ.liveTimerMin(f.it);
          S.timer = null;
        }
      }
    });
    if (now) SQ.celebrate(all ? `이정표를 전부 지났어요! "${title}" 클리어 🏁` : '이정표 하나 통과! 🚩');
  };
})();
