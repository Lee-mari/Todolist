/* Study Quest — 공부 기록 */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const ui = SQ.ui;
  const A = SQ.actions;

  function pendingDay() {
    const t = SQ.today();
    for (let i = 1; i <= 7; i++) {
      const k = SQ.addDays(t, -i);
      if (!SQ.state.records[k] && SQ.plannedOn(k) > 0) return k;
    }
    return null;
  }

  function dayName(k) {
    const t = SQ.today();
    const w = SQ.DOW[SQ.dow(k)] + '요일';
    if (k === SQ.addDays(t, -1)) return `어제(${w})`;
    if (k === SQ.addDays(t, -2)) return `그저께(${w})`;
    return `${SQ.md(k)}(${w})`;
  }

  // used on 오늘 and 공부 기록
  SQ.closingQuestCard = function (compact) {
    const k = pendingDay();
    if (!k) {
      if (compact) return '';
      const y = SQ.addDays(SQ.today(), -1);
      const r = SQ.state.records[y];
      return `
      <section class="quest ok">
        <p class="quest-k">${icon('check', 16)} 하루 마감 퀘스트</p>
        <h2>${r ? `${dayName(y)} 기록 완료! ${r.skipped ? '쉬어 간 날이에요' : SQ.dur(r.minutes) + ' 공부했어요'}` : '마감할 날이 없어요. 오늘도 화이팅!'}</h2>
        ${r ? `<button class="link-btn" data-act="editRecord" data-k="${y}">${icon('pencil', 14)} 기록 수정하기</button>` : ''}
      </section>`;
    }
    const planned = SQ.plannedOn(k);
    const guess = SQ.studiedOn(k);
    return `
      <section class="quest">
        <p class="quest-k">${icon('check', 16)} 하루 마감 퀘스트</p>
        <h2>${dayName(k)} 공부, 얼마나 했어요?</h2>
        <p class="quest-d">계획은 ${SQ.dur(planned)}이었어요. 실제로 한 시간만 적으면 끝!${guess ? ` <span class="muted-t">(시간표 기준 ${SQ.dur(guess)})</span>` : ''}</p>
        <div class="quest-f">
          <label><span>시간</span><input class="input" type="number" min="0" max="24" id="rq-h" value="${Math.floor(guess / 60)}" inputmode="numeric"></label>
          <label><span>분</span><input class="input" type="number" min="0" max="59" step="5" id="rq-m" value="${guess % 60}" inputmode="numeric"></label>
          <button class="btn dark" data-act="saveRecord" data-k="${k}">기록하기</button>
          <button class="link-btn muted" data-act="skipRecord" data-k="${k}">못 했어요</button>
        </div>
      </section>`;
  };

  function weekHistory() {
    const cur = SQ.weekStart(SQ.today());
    const out = [];
    let ws = SQ.addDays(cur, -7);
    for (let i = 0; i < 104 && out.length < (ui.histN || 3) + 1; i++, ws = SQ.addDays(ws, -7)) {
      const days = SQ.weekDays(ws);
      const total = days.reduce((a, k) => a + SQ.actualOn(k), 0);
      const planned = days.reduce((a, k) => a + SQ.plannedOn(k), 0);
      if (!total && !planned && !SQ.state.weekGoals[ws]) continue;
      out.push({ ws, days, total, u: SQ.weekUnits(ws) });
    }
    return out;
  }

  SQ.views.record = function () {
    const t = SQ.today();
    const ws = ui.recWeek || SQ.weekStart(t);
    const days = SQ.weekDays(ws);
    const past = days.filter((k) => k <= t);
    const total = past.reduce((a, k) => a + SQ.actualOn(k), 0);
    const plannedPast = past.reduce((a, k) => a + SQ.plannedOn(k), 0);
    const plannedWeek = days.reduce((a, k) => a + SQ.plannedOn(k), 0);
    const ratio = plannedPast ? Math.round((total / plannedPast) * 100) : 0;
    const u = SQ.weekUnits(ws);
    const isCur = ws === SQ.weekStart(t);

    // bar chart
    const vals = days.map((k) => (k <= t ? SQ.actualOn(k) : 0));
    const max = Math.max(120, ...vals);
    const bars = days
      .map((k, i) => {
        const v = vals[i];
        const fut = k > t;
        const d = SQ.dow(k);
        const rec = SQ.state.records[k];
        return `<button class="cbar ${fut ? 'fut' : ''} ${k === t ? 'today' : ''}" data-act="${fut ? '' : 'editRecord'}" data-k="${k}" ${fut ? 'disabled' : ''} aria-label="${SQ.longDate(k)} ${SQ.dur(v)}">
          <span class="cbar-v">${fut ? '' : rec && rec.skipped ? '쉼' : SQ.hours(v)}</span>
          <span class="cbar-col"><i style="height:${fut ? 0 : Math.max(v ? 3 : 0, (v / max) * 100)}%"></i></span>
          <span class="cbar-l ${d === 6 ? 'sat' : ''} ${d === 0 ? 'sun' : ''}">${SQ.DOW[d]}</span>
        </button>`;
      })
      .join('');

    // per subject
    const per = {};
    days.forEach((k) => (SQ.state.schedules[k] || []).forEach((it) => {
      const m = SQ.itemStudied(it);
      if (m > 0) per[it.subjectId || ''] = (per[it.subjectId || ''] || 0) + m;
    }));
    const subjRows = Object.entries(per).sort((a, b) => b[1] - a[1]);
    const smax = subjRows.length ? subjRows[0][1] : 1;

    const hist = weekHistory();
    const shown = hist.slice(0, ui.histN || 3);

    return `
      ${SQ.pageHead('', 'Record', '', '지나간 날을 체크하고, 쌓인 공부 시간 보기')}
      <div class="rule"></div>
      ${SQ.closingQuestCard(false)}
      <div class="week-switch">
        <button class="icon-btn" data-act="recWeek" data-n="-7" aria-label="지난주">${icon('chevL')}</button>
        <b>${isCur ? '이번 주' : SQ.weekLabel(ws)} <small>${SQ.weekRange(ws)}</small></b>
        <button class="icon-btn" data-act="recWeek" data-n="7" aria-label="다음 주" ${isCur ? 'disabled' : ''}>${icon('chevR')}</button>
      </div>
      <div class="stats3">
        <div class="stat"><small>${isCur ? '이번 주' : '그 주'} 공부 시간</small><b>${SQ.dur(total)}</b><span>하루 평균 ${SQ.dur(past.length ? total / past.length : 0)}</span></div>
        <div class="stat"><small>계획 대비</small><b>${ratio}%</b><span>계획 ${SQ.dur(plannedWeek)}</span></div>
        <div class="stat"><small>클리어한 쪼개기</small><b>${u.done}개</b><span>전체 ${u.total}개</span></div>
      </div>
      <section class="card chart">
        <div class="sec-h"><h3>${isCur ? '이번 주' : '그 주'} 요일별</h3><small class="muted-t">진한 색 = 다 끝난 날 · 연한 색 = 오늘(진행 중) · 막대를 누르면 수정</small></div>
        <div class="cbars">${bars}</div>
      </section>
      <section class="card">
        <div class="sec-h"><h3>과목별</h3></div>
        ${
          subjRows.length
            ? `<div class="sbars">${subjRows
                .map(([id, m]) => {
                  const s = SQ.subj(id);
                  return `<div class="sbar" style="${SQ.cvar(s.color)}"><span>${esc(s.name)}</span><span class="bar"><i style="width:${(m / smax) * 100}%"></i></span><b>${SQ.dur(m)}</b></div>`;
                })
                .join('')}</div>`
            : '<p class="muted-t pad">아직 클리어한 일정이 없어요. 일정을 클리어하면 과목별로 쌓여요.</p>'
        }
      </section>
      <h3 class="h-sec">차곡차곡 쌓인 주간 기록</h3>
      ${
        shown.length
          ? `<div class="hist">${shown
              .map((h) => {
                const g = SQ.state.weekGoals[h.ws];
                const r = h.u.total ? h.u.done / h.u.total : 0;
                const badge = r >= 0.9 ? '<span class="badge green">목표 클리어</span>' : r >= 0.5 ? '<span class="badge orange">절반 클리어</span>' : '<span class="badge gray">다음엔 꼭!</span>';
                return `<button class="hrow" data-act="openWeek" data-ws="${h.ws}">
                  <div><small>${SQ.weekLabel(h.ws)}</small><b>${g ? esc(g.title) : '목표 없이 달린 주'}</b></div>
                  <span class="hdots">${h.days.map((k) => `<i class="${SQ.actualOn(k) > 0 ? 'on' : SQ.plannedOn(k) ? 'miss' : ''}" title="${SQ.md(k)} ${SQ.dur(SQ.actualOn(k))}"></i>`).join('')}</span>
                  <b class="htime">${SQ.dur(h.total)}</b>
                  ${badge}
                </button>`;
              })
              .join('')}</div>
            ${hist.length > shown.length ? `<button class="link-btn center" data-act="moreHist">더 지난 기록 보기</button>` : ''}`
          : '<p class="muted-t pad">지난주 기록이 생기면 여기에 차곡차곡 쌓여요.</p>'
      }`;
  };

  A.saveRecord = (el) => {
    const k = el.dataset.k;
    const h = Math.max(0, Math.min(24, +document.getElementById('rq-h').value || 0));
    const m = Math.max(0, Math.min(59, +document.getElementById('rq-m').value || 0));
    const minutes = h * 60 + m;
    SQ.commit((S) => (S.records[k] = { minutes, skipped: false }), { undo: `${dayName(k)} ${SQ.dur(minutes)} 기록했어요` });
  };
  A.skipRecord = (el) => {
    const k = el.dataset.k;
    SQ.commit((S) => (S.records[k] = { minutes: 0, skipped: true }), { undo: `${dayName(k)}은 쉬어 간 날로 기록했어요` });
  };
  A.editRecord = (el) => {
    const k = el.dataset.k;
    const r = SQ.state.records[k];
    const cur = SQ.actualOn(k);
    SQ.modal.open({
      title: '공부 시간 기록',
      sub: SQ.longDate(k),
      body: `
        <p class="muted-t">계획 ${SQ.dur(SQ.plannedOn(k))} · 시간표 기준 ${SQ.dur(SQ.studiedOn(k))}</p>
        <div class="grid2">
          <label class="field"><span>시간</span><input class="input" type="number" name="h" min="0" max="24" value="${Math.floor(cur / 60)}"></label>
          <label class="field"><span>분</span><input class="input" type="number" name="m" min="0" max="59" step="5" value="${cur % 60}"></label>
        </div>
        ${r ? '<p class="muted-t">삭제하면 시간표에서 클리어한 일정으로 자동 계산해요.</p>' : ''}`,
      onDelete: r ? () => { SQ.modal.close(); SQ.commit((S) => delete S.records[k], { undo: '기록을 지우고 자동 계산으로 돌아갔어요' }); } : null,
      onSubmit(d) {
        const minutes = Math.max(0, Math.min(24, +d.h || 0)) * 60 + Math.max(0, Math.min(59, +d.m || 0));
        SQ.commit((S) => (S.records[k] = { minutes, skipped: minutes === 0 }), { toast: '기록했어요' });
      },
    });
  };
  A.recWeek = (el) => {
    const t = SQ.weekStart(SQ.today());
    const n = SQ.addDays(ui.recWeek || t, +el.dataset.n);
    ui.recWeek = n > t ? t : n;
    SQ.render();
  };
  A.moreHist = () => {
    ui.histN = (ui.histN || 3) + 5;
    SQ.render();
  };
  A.openWeek = (el) => {
    ui.selDate = el.dataset.ws;
    SQ.go('week');
  };
})();
