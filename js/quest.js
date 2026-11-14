/* Study Quest — 일정마다 이정표 + 내가 정하는 질문 */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

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
      (ms.length ? `\n이정표: ${ms.map((m, i) => `${i + 1}. ${m}`).join(' → ')}` : '') +
      '\n' +
      qs.map((x, i) => `${i + 1}. ${x.q}\n   내 생각: ${(x.a || '').trim() || '(아직 모르겠어요)'}`).join('\n') +
      '\n\n정답 말고 힌트만 주세요.'
    );
  }

  /* ---------- editor (item modal + quick answer modal) ---------- */
  const qRow = (x, withQ) => `
    <div class="q-row">
      ${withQ ? `<input class="input q-q" name="qQ" maxlength="80" value="${esc(x.q || '')}" placeholder="질문 (예: 이걸 끝내면 뭐가 가능해져?)" aria-label="질문">` : `<input type="hidden" name="qQ" value="${esc(x.q || '')}"><p class="q-q-t">❓ ${esc(x.q)}</p>`}
      <textarea class="input q-a" name="qA" rows="1" maxlength="160" placeholder="내 답" aria-label="답">${esc(x.a || '')}</textarea>
      ${withQ ? `<button type="button" class="icon-btn" data-delq aria-label="질문 빼기">${icon('x', 16)}</button>` : ''}
    </div>`;

  SQ.questFields = function (it) {
    const isNew = !it || it.kind !== 'task';
    const ms = (!isNew && it.milestones) || [];
    const qs = isNew ? (SQ.state.settings.defaultQs || SQ.DEFAULT_QS).map((q) => ({ q, a: '' })) : SQ.itemQs(it);
    const ask = isNew ? !!SQ.state.settings.askFirst : SQ.itemAsk(it);
    return `
      <div class="qbox">
        <div class="qbox-h"><b>🧭 이정표</b><small>이 일정에서 지나갈 단계 · 한 줄에 하나씩</small></div>
        <textarea class="input" name="msLines" rows="3" placeholder="예: 트리거 박스 놓기&#10;문 여는 타임라인 만들기&#10;두 번째 방까지 걸어가기">${esc(ms.map((m) => m.text).join('\n'))}</textarea>
      </div>
      <div class="qbox">
        <div class="qbox-h"><b>❓ 질문</b><small>질문도 답도 내가 정해요</small></div>
        <div class="q-rows">${qs.map((x) => qRow(x, true)).join('')}</div>
        <div class="row wrap">
          <button type="button" class="chip-btn dashed" data-addq>${icon('plus', 14)} 질문 추가</button>
        </div>
        <label class="check-row"><input type="checkbox" name="qAsk" ${ask ? 'checked' : ''}><span class="cb">${icon('check', 13)}</span><span>시작 전에 질문부터 · 답해야 할 일이 보여요</span></label>
        <div class="q-help"><span>💡 막히면 질문째로 복사해서 힌트만 받아요</span><button type="button" class="chip-btn" data-copysq>${icon('copy', 14)} 힌트 복사</button></div>
      </div>`;
  };

  SQ.formData = (form) => {
    const d = {};
    new FormData(form).forEach((v, k) => (d[k] = k in d ? [].concat(d[k], v) : v));
    return d;
  };

  SQ.bindQuest = function (form, ctx) {
    const box = form.querySelector('.q-rows');
    const grow = (t) => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 2 + 'px';
    };
    box.querySelectorAll('.q-a').forEach(grow);
    box.addEventListener('input', (e) => e.target.classList.contains('q-a') && grow(e.target));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-delq]');
      if (b) b.closest('.q-row').remove();
    });
    const add = form.querySelector('[data-addq]');
    if (add)
      add.addEventListener('click', () => {
        box.insertAdjacentHTML('beforeend', qRow({}, true));
        box.lastElementChild.querySelector('.q-q').focus();
      });
    form.querySelector('[data-copysq]').addEventListener('click', () => {
      const r = SQ.readQuest(SQ.formData(form), ctx.it);
      const title = (form.title && form.title.value) || (ctx.it && ctx.it.title) || '';
      copyText(hintText(title, r.milestones.map((m) => m.text), r.qs));
    });
  };

  SQ.readQuest = function (d, prev) {
    const qq = [].concat(d.qQ || []), aa = [].concat(d.qA || []);
    const oldQs = prev ? SQ.itemQs(prev) : [];
    const qs = [];
    qq.forEach((q, i) => {
      q = String(q || '').trim();
      const a = String(aa[i] || '').trim();
      if (!q) return;
      const o = oldQs.find((x) => x.q === q);
      qs.push({ id: o ? o.id : SQ.uid(), q, a });
    });
    const out = { qs };
    if ('msLines' in d) {
      const old = (prev && prev.milestones) || [];
      out.milestones = String(d.msLines || '')
        .split('\n')
        .map((x) => x.trim().replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((text) => {
          const o = old.find((m) => m.text === text);
          return { id: o ? o.id : SQ.uid(), text, done: o ? !!o.done : false };
        });
      out.qAsk = !!d.qAsk;
    } else out.milestones = (prev && prev.milestones) || [];
    return out;
  };

  /* ---------- timeline pieces ---------- */
  SQ.msPath = (it) => {
    const ms = it.milestones || [];
    if (!ms.length) return '';
    const all = ms.every((m) => m.done);
    return `<ol class="qc-path in-card" aria-label="이정표">${ms
      .map(
        (m, i) => `<li class="${m.done ? 'done' : ''}">
          <button class="qc-step" data-act="toggleItemMs" data-id="${it.id}" data-mid="${m.id}" aria-pressed="${!!m.done}" aria-label="${i + 1}번 이정표 ${m.done ? '완료 취소' : '완료'}">
            <span class="qc-n">${m.done ? icon('check', 14) : i + 1}</span><span class="qc-t">${esc(m.text)}</span>
          </button></li>`
      )
      .join('')}<li class="qc-goal ${all ? 'done' : ''}"><span class="qc-n" aria-hidden="true">🏁</span></li></ol>`;
  };

  SQ.qGateBlock = (it) => `
    <div class="q-gate">
      <span class="q-gate-ic" aria-hidden="true">❓</span>
      <div><b>시작 전에 질문 ${SQ.itemQs(it).length}개</b><small>답하면 쪼갠 할 일이 열려요 · 5분</small></div>
      <button class="btn sm dark" data-act="answerQ" data-id="${it.id}">답하기</button>
    </div>`;

  SQ.qAnswerList = (it) => {
    const qs = SQ.itemQs(it).filter((x) => (x.a || '').trim());
    if (!qs.length) return '';
    return `<button class="q-ans" data-act="answerQ" data-id="${it.id}" aria-label="질문과 답 수정">${qs
      .map((x) => `<span class="q-pair"><small>${esc(x.q)}</small><b>${esc(x.a)}</b></span>`)
      .join('')}</button>`;
  };

  SQ.qFootChip = (it) =>
    !it.done && it.kind === 'task' && SQ.itemQs(it).length && !SQ.qAnswered(it) && !SQ.qGated(it)
      ? `<button class="chip-btn q" data-act="answerQ" data-id="${it.id}">❓ 질문 ${SQ.itemQs(it).filter((x) => !(x.a || '').trim()).length}개 남음</button>`
      : '';

  /* ---------- actions ---------- */
  A.toggleItemMs = (el) => {
    let now = false, all = false;
    SQ.commit(() => {
      const f = SQ.findItem(el.dataset.id);
      const m = f && (f.it.milestones || []).find((x) => x.id === el.dataset.mid);
      if (!m) return;
      m.done = now = !m.done;
      all = f.it.milestones.every((x) => x.done);
    });
    if (now) SQ.celebrate(all ? '이정표를 전부 지났어요! 🏁' : '이정표 하나 통과! 🚩');
  };

  A.answerQ = (el) => {
    const f = SQ.findItem(el.dataset.id);
    if (!f) return;
    const it = f.it;
    const qs = SQ.itemQs(it);
    SQ.modal.open({
      title: '❓ 질문에 답하기',
      sub: `${it.title} · ${it.start}–${it.end}`,
      submit: '답 저장',
      body: `
        ${it.milestones && it.milestones.length ? `<p class="q-ms-line">🧭 ${it.milestones.map((m, i) => `${i + 1}. ${esc(m.text)}`).join(' → ')}</p>` : ''}
        <div class="q-rows">${qs.map((x) => qRow(x, false)).join('')}</div>
        <div class="q-help"><span>💡 막히면 질문째로 복사해서 힌트만 받아요 · 질문은 일정 수정에서 바꿔요</span><button type="button" class="chip-btn" data-copysq>${icon('copy', 14)} 힌트 복사</button></div>`,
      onOpen(form) {
        SQ.bindQuest(form, { it });
        const first = [...form.querySelectorAll('.q-a')].find((t) => !t.value.trim()) || form.querySelector('.q-a');
        if (first) setTimeout(() => first.focus(), 50);
      },
      onSubmit(d) {
        const r = SQ.readQuest(d, it);
        if (SQ.itemAsk(it) && !answered(r.qs)) return '모든 질문에 답해야 할 일이 열려요 (모르겠으면 ‘모르겠다’라고 써도 돼요)';
        SQ.ui.expanded[it.id] = true;
        SQ.commit((S) => {
          const cur = SQ.findItem(it.id).it;
          cur.qs = r.qs;
          cur.qAsk = SQ.itemAsk(it);
          delete cur.q;
        }, { toast: answered(r.qs) ? '좋아요, 이제 시작해요 👣' : '답을 저장했어요' });
      },
    });
  };
})();
