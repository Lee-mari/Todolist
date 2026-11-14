/* Study Quest — 큰 질문(주간 이정표) · 작은 질문(작업 전 첫 발) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

  SQ.BIG_Q = [
    { key: 'feel', q: '플레이어가 마지막에 어떤 기분이면 좋겠어?', ph: '예: 혼자 관측기지를 지켜냈다는 뿌듯함' },
    { key: 'ms', q: '그 기분이 들려면 플레이어가 뭘 겪어야 해? (3~4개)', ph: '한 줄에 하나씩\n예: 산소가 줄어드는 긴장감\n예: 문을 열고 새 구역 발견\n예: 고장 난 장비 고치기', hint: '답 하나하나가 그대로 이정표 🏁가 돼요' },
    { key: 'friday', q: '이번 주 금요일엔 어디까지 걸을 수 있으면 성공이야?', ph: '예: 문 열고 두 번째 방까지 걸어갈 수 있으면 성공' },
  ];
  SQ.SMALL_Q = ['오늘 배운 것 중에 몇 번 이정표에 쓸 수 있어?', '5분 안에 할 수 있는 첫 행동은 뭐야?'];

  const wq = (ws) => (SQ.state.weekQuests || {})[ws];
  SQ.weekQuest = wq;
  const hasQuest = (q) => q && (q.feel || q.friday || (q.milestones || []).length);
  SQ.milestoneOf = (k, id) => {
    const q = wq(SQ.weekStart(k));
    if (!q || !id) return null;
    const i = (q.milestones || []).findIndex((m) => m.id === id);
    return i < 0 ? null : { i: i + 1, m: q.milestones[i] };
  };

  function copyText(text) {
    const done = () => SQ.toast('질문을 복사했어요. 그대로 붙여넣고 힌트만 물어봐요 💡');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => prompt('복사해서 쓰세요', text));
    else prompt('복사해서 쓰세요', text);
  }

  /* ---------- weekly milestone card ---------- */
  SQ.questCard = function (ws, compact) {
    const q = wq(ws);
    const isMon = SQ.dow(SQ.today()) === 1;
    const lbl = ws === SQ.weekStart(SQ.today()) ? '이번 주' : SQ.weekLabel(ws);
    if (!hasQuest(q)) {
      return `
      <section class="quest-card empty">
        <span class="qc-ic" aria-hidden="true">🧭</span>
        <div class="qc-m">
          <b>${isMon && ws === SQ.weekStart(SQ.today()) ? '월요일이에요! ' : ''}${lbl} 이정표 세우기 · 15분</b>
          <small>큰 질문 3개에 답하면 이번 주에 걸어갈 길이 보여요</small>
        </div>
        <button class="btn dark sm" data-act="editBigQ" data-ws="${ws}">${icon('flag', 15)} 이정표 세우기</button>
      </section>`;
    }
    const ms = q.milestones || [];
    const done = ms.filter((m) => m.done).length;
    return `
    <section class="quest-card ${compact ? 'compact' : ''}">
      <header class="qc-h">
        <h3><span aria-hidden="true">🧭</span> ${lbl} 이정표 <small>${done}/${ms.length}</small></h3>
        <button class="icon-btn" data-act="editBigQ" data-ws="${ws}" aria-label="큰 질문 수정">${icon('pencil', 15)}</button>
      </header>
      ${q.feel && !compact ? `<p class="qc-feel"><small>마지막에 이런 기분</small>“${esc(q.feel)}”</p>` : ''}
      ${
        ms.length
          ? `<ol class="qc-path">${ms
              .map(
                (m, i) => `<li class="${m.done ? 'done' : ''}">
                  <button class="qc-step" data-act="toggleMilestone" data-ws="${ws}" data-id="${m.id}" aria-pressed="${!!m.done}" aria-label="${i + 1}번 이정표 ${m.done ? '완료 취소' : '완료'}">
                    <span class="qc-n">${m.done ? icon('check', 14) : i + 1}</span><span class="qc-t">${esc(m.text)}</span>
                  </button></li>`
              )
              .join('')}<li class="qc-goal ${q.fridayDone ? 'done' : ''}"><span class="qc-n" aria-hidden="true">🏁</span></li></ol>`
          : ''
      }
      ${
        q.friday
          ? `<button class="qc-fri ${q.fridayDone ? 'done' : ''}" data-act="toggleFriday" data-ws="${ws}" aria-pressed="${!!q.fridayDone}">
              <span>${q.fridayDone ? '🎉' : '🎯'}</span><span><small>금요일 성공 기준</small>${esc(q.friday)}</span>${q.fridayDone ? '<em>성공!</em>' : ''}
            </button>`
          : ''
      }
    </section>`;
  };

  A.editBigQ = (el) => {
    const ws = el.dataset.ws;
    const q = wq(ws) || {};
    const ms = q.milestones || [];
    const val = { feel: q.feel || '', ms: ms.map((m) => m.text).join('\n'), friday: q.friday || '' };
    SQ.modal.open({
      title: '🧭 이정표 세우기',
      sub: `${SQ.weekLabel(ws)} · 큰 질문 3개 · 15분`,
      submit: '이정표 저장',
      onDelete: hasQuest(q) ? () => { SQ.modal.close(); SQ.commit((S) => delete S.weekQuests[ws], { undo: '이번 주 이정표를 지웠어요' }); } : null,
      body: `
        ${SQ.BIG_Q.map(
          (b, i) => `<label class="field qfield"><span><b class="qn">${i + 1}</b> ${esc(b.q)}${b.hint ? ` <em>${esc(b.hint)}</em>` : ''}</span>
            ${b.key === 'ms' ? `<textarea class="input" name="ms" rows="4" placeholder="${esc(b.ph)}">${esc(val.ms)}</textarea>` : `<textarea class="input" name="${b.key}" rows="2" maxlength="140" placeholder="${esc(b.ph)}">${esc(val[b.key])}</textarea>`}
          </label>`
        ).join('')}
        <div class="q-help">
          <span>💡 답이 안 떠오르면? 질문째로 복사해서 물어보고 힌트만 받아요.</span>
          <button type="button" class="chip-btn" data-copyq>${icon('copy', 14)} 질문 복사</button>
        </div>`,
      onOpen(form) {
        form.querySelector('[data-copyq]').addEventListener('click', () => {
          const g = SQ.state.weekGoals[ws];
          copyText(
            `[이번 주 이정표 세우기]${g && g.title ? `\n이번 주 목표: ${g.title}` : ''}\n` +
              SQ.BIG_Q.map((b, i) => `${i + 1}. ${b.q}\n   내 생각: ${(form[b.key].value || '').trim().replace(/\n/g, ' / ') || '(아직 모르겠어요)'}`).join('\n') +
              '\n\n정답 말고 힌트만 주세요.'
          );
        });
      },
      onSubmit(d) {
        const lines = String(d.ms || '').split('\n').map((x) => x.trim().replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean).slice(0, 8);
        const feel = (d.feel || '').trim(), friday = (d.friday || '').trim();
        if (!feel && !lines.length && !friday) return '질문 하나에는 답해 주세요';
        SQ.commit(
          (S) => {
            S.weekQuests = S.weekQuests || {};
            const old = (S.weekQuests[ws] || {}).milestones || [];
            S.weekQuests[ws] = Object.assign({}, S.weekQuests[ws], {
              feel,
              friday,
              milestones: lines.map((text) => {
                const o = old.find((m) => m.text === text);
                return { id: o ? o.id : SQ.uid(), text, done: o ? !!o.done : false };
              }),
            });
          },
          { toast: lines.length ? `이정표 ${lines.length}개를 세웠어요 🏁` : '큰 질문을 저장했어요' }
        );
      },
    });
  };

  A.toggleMilestone = (el) => {
    const ws = el.dataset.ws;
    let now = false, all = false;
    SQ.commit((S) => {
      const q = S.weekQuests[ws];
      const m = q && q.milestones.find((x) => x.id === el.dataset.id);
      if (!m) return;
      m.done = now = !m.done;
      all = q.milestones.every((x) => x.done);
    });
    if (now) SQ.celebrate(all ? '이정표를 전부 지났어요! 🏁' : '이정표 하나 통과! 🚩');
  };
  A.toggleFriday = (el) => {
    const ws = el.dataset.ws;
    let now = false;
    SQ.commit((S) => {
      const q = S.weekQuests[ws];
      if (q) q.fridayDone = now = !q.fridayDone;
    });
    if (now) SQ.celebrate('이번 주 성공 기준 달성! 🎉');
  };

  /* ---------- small questions (per study block) ---------- */
  SQ.qAnswered = (q) => !!(q && (q.first || '').trim() && (q.msId || (q.use || '').trim()));
  SQ.qGated = (it) => it.kind === 'task' && !it.done && it.q && it.q.ask && !SQ.qAnswered(it.q);

  function msOptions(k, sel) {
    const q = wq(SQ.weekStart(k));
    const ms = (q && q.milestones) || [];
    if (!ms.length) return '';
    return `<option value="">고르기…</option>${ms.map((m, i) => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>🏁 ${i + 1}. ${esc(m.text)}</option>`).join('')}<option value="none" ${sel === 'none' ? 'selected' : ''}>아직 모르겠어 (오늘은 기초 다지기)</option>`;
  }

  // fields shared by the item modal and the quick "답하기" modal
  SQ.smallQFields = function (k, q, withToggle) {
    q = q || {};
    const opts = msOptions(k, q.msId);
    return `
      <div class="qbox">
        <div class="qbox-h"><b>❓ 오늘의 질문</b><small>작업 들어가기 전 5분</small></div>
        <label class="field qfield"><span><b class="qn">1</b> ${esc(SQ.SMALL_Q[0])}</span>
          ${opts ? `<select class="input" name="qMs">${opts}</select>` : '<small class="muted-t">이번 주 탭에서 이정표를 세우면 여기서 고를 수 있어요</small>'}
          <input class="input" name="qUse" maxlength="100" value="${esc(q.use || '')}" placeholder="어떻게 쓸 수 있을까? (예: 포인터로 문 상태 저장)">
        </label>
        <label class="field qfield"><span><b class="qn">2</b> ${esc(SQ.SMALL_Q[1])}</span>
          <input class="input" name="qFirst" maxlength="80" value="${esc(q.first || '')}" placeholder="예: 에디터 켜고 트리거 박스 하나 놓기">
        </label>
        ${withToggle ? `<label class="check-row"><input type="checkbox" name="qAsk" ${q.ask ? 'checked' : ''}><span class="cb">${icon('check', 13)}</span><span>시작 전에 질문부터 · 답해야 할 일이 보여요</span></label>` : ''}
        <div class="q-help"><span>💡 막히면 질문째로 복사해서 힌트만 받아요</span><button type="button" class="chip-btn" data-copysq>${icon('copy', 14)} 질문 복사</button></div>
      </div>`;
  };
  SQ.bindSmallQ = function (form, ctx) {
    const b = form.querySelector('[data-copysq]');
    if (!b) return;
    b.addEventListener('click', () => {
      const sel = form.qMs && form.qMs.selectedOptions[0];
      const title = (form.title && form.title.value) || ctx.title || '';
      copyText(
        `[오늘의 질문]${title ? `\n작업: ${title}` : ''}\n` +
          `1. ${SQ.SMALL_Q[0]}\n   내 생각: ${[sel && sel.value ? sel.textContent : '', (form.qUse.value || '').trim()].filter(Boolean).join(' · ') || '(아직 모르겠어요)'}\n` +
          `2. ${SQ.SMALL_Q[1]}\n   내 생각: ${(form.qFirst.value || '').trim() || '(아직 모르겠어요)'}` +
          '\n\n정답 말고 힌트만 주세요.'
      );
    });
  };
  SQ.readSmallQ = (d, prev, hasToggle) => ({
    msId: d.qMs || '',
    use: (d.qUse || '').trim(),
    first: (d.qFirst || '').trim(),
    ask: hasToggle ? !!d.qAsk : !!(prev && prev.ask),
  });

  // timeline pieces
  SQ.qGateBlock = (it) => `
    <div class="q-gate">
      <span class="q-gate-ic" aria-hidden="true">❓</span>
      <div><b>시작 전에 질문 2개</b><small>답하면 쪼갠 할 일이 열려요 · 5분</small></div>
      <button class="btn sm dark" data-act="answerQ" data-id="${it.id}">답하기</button>
    </div>`;
  SQ.qAnswerChips = (it, k) => {
    const q = it.q;
    if (!SQ.qAnswered(q)) return '';
    const ms = SQ.milestoneOf(k, q.msId);
    return `<button class="q-ans" data-act="answerQ" data-id="${it.id}" aria-label="오늘의 질문 답 수정">
      ${ms ? `<span class="q-ms ${ms.m.done ? 'done' : ''}">🏁 ${ms.i}. ${esc(ms.m.text)}</span>` : ''}
      ${q.use ? `<span class="q-use">${esc(q.use)}</span>` : ''}
      <span class="q-first"><b>👉 첫 발</b> ${esc(q.first)}</span>
    </button>`;
  };

  A.answerQ = (el) => {
    const f = SQ.findItem(el.dataset.id);
    if (!f) return;
    const it = f.it;
    SQ.modal.open({
      title: '❓ 오늘의 질문',
      sub: `${it.title} · ${it.start}–${it.end}`,
      submit: '답 저장하고 시작',
      body: SQ.smallQFields(f.k, it.q, false),
      onOpen(form) {
        SQ.bindSmallQ(form, it);
        setTimeout(() => (form.qMs || form.qUse).focus(), 50);
      },
      onSubmit(d) {
        const q = SQ.readSmallQ(d, it.q);
        if (!SQ.qAnswered(q)) return !q.first ? '5분 안에 할 첫 행동을 적어 주세요' : '1번 질문에 답해 주세요 (모르겠으면 ‘아직 모르겠어’)';
        SQ.ui.expanded[it.id] = true;
        SQ.commit((S) => (SQ.findItem(it.id).it.q = q), { toast: `첫 발: ${q.first} 👣` });
      },
    });
  };
})();
