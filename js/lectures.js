/* Study Quest — 강의 노트 */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const ui = SQ.ui;
  const A = SQ.actions;

  const filled = (l) => {
    const f = [
      !!(l.summary || '').trim(),
      (l.points || []).some((p) => (p || '').trim()),
      !!(l.confusing || '').trim(),
      (l.revisits || []).length > 0,
    ];
    return { list: f, n: f.filter(Boolean).length };
  };

  function questBar(l) {
    const f = filled(l);
    return `
      <div class="lq-h"><span>정리 퀘스트 ${f.n} / 4칸 채움</span><b>${f.n === 4 ? (l.status === 'done' ? '클리어!' : '다 채웠어요!') : `+${4 - f.n}칸이면 클리어`}</b></div>
      <div class="lq-bar">${f.list.map((x) => `<i class="${x ? 'on' : ''}"></i>`).join('')}</div>`;
  }

  function courseStats(c) {
    const ls = SQ.state.lectures.filter((l) => l.courseId === c.id);
    const taken = ls.length ? Math.max(...ls.map((l) => l.no)) : 0;
    const done = ls.filter((l) => l.status === 'done').length;
    return { taken, done, count: ls.length };
  }

  function linkedSchedule(lid) {
    let best = null;
    for (const k in SQ.state.schedules) {
      SQ.state.schedules[k].forEach((it) => {
        if (it.lectureId === lid && (!best || k > best.k)) best = { k, it };
      });
    }
    return best;
  }

  function editor(l) {
    const c = SQ.state.courses.find((x) => x.id === l.courseId) || {};
    const link = linkedSchedule(l.id);
    const pts = l.points && l.points.length ? l.points : ['', '', ''];
    while (pts.length < 3) pts.push('');
    return `
    <section class="lec-ed" style="${SQ.cvar(c.color)}">
      <div class="lec-meta">
        <span class="tag">${esc(c.provider ? c.provider + ' · ' : '')}${esc(c.name || '')}</span>
        ${link ? `<button class="link-btn muted" data-act="gotoDate" data-k="${link.k}">${SQ.longDate(link.k)} ${link.it.start} 시간표에서 연결됨</button>` : `<span class="muted-t">시간표 일정에서 이 노트를 연결할 수 있어요</span>`}
        <span class="sp"></span>
        <button class="icon-btn" data-act="lecMore" data-id="${l.id}" aria-label="노트 메뉴">${icon('more', 18)}</button>
      </div>
      <h2 class="lec-title">${l.no}강 · ${esc(l.title)} ${l.status === 'done' ? '<span class="badge green">정리 끝</span>' : ''}</h2>
      <div id="lq-progress" class="lq">${questBar(l)}</div>

      <div class="lsec pinkbox">
        <h4>1. 한 줄 요약</h4>
        <textarea class="bare" rows="2" data-lf="summary" placeholder="이 강의를 한 줄로 말하면?" maxlength="300">${esc(l.summary || '')}</textarea>
      </div>

      <div class="lsec plain">
        <h4>2. 핵심 3개</h4>
        <ol class="pts">
          ${pts.slice(0, 3).map((p, i) => `<li><input class="bare" data-lf="point" data-i="${i}" value="${esc(p)}" placeholder="핵심 ${i + 1}" maxlength="160"></li>`).join('')}
        </ol>
      </div>

      <div class="lsec dashed">
        <h4>3. 헷갈린 점</h4>
        <small>궁금한 걸 한 줄로 적어요</small>
        <textarea class="input" rows="2" data-lf="confusing" placeholder="예: 원형 큐는 왜 필요한지 아직 잘 모르겠음" maxlength="400">${esc(l.confusing || '')}</textarea>
      </div>

      <div class="lsec dashed">
        <h4>4. 다시 볼 부분</h4>
        <div class="revs">
          ${(l.revisits || []).map((r, i) => `<span class="rev"><b>${esc(r.t)}</b> ${esc(r.text)}<button class="icon-btn xs" data-act="delRevisit" data-i="${i}" aria-label="삭제">${icon('x', 13)}</button></span>`).join('')}
          ${
            ui.addingRev
              ? `<span class="rev-add"><input class="input sm t" id="rev-t" placeholder="23:10" maxlength="8" data-key="revInput"><input class="input sm" id="rev-x" placeholder="무엇을 다시 볼지" maxlength="60" data-key="revInput"><button class="btn sm primary" data-act="saveRevisit">추가</button><button class="btn sm ghost" data-act="cancelRevisit">취소</button></span>`
              : `<button class="chip-btn dashed pink" data-act="addRevisit">${icon('plus', 14)} 시간 추가</button>`
          }
        </div>
      </div>

      <div class="lec-actions">
        <span class="save-state" id="save-state">${l.updatedAt ? '자동 저장됨' : ''}</span>
        <span class="sp"></span>
        <button class="btn line" data-act="lecSave">임시 저장</button>
        ${l.status === 'done' ? `<button class="btn line" data-act="lecReopen">다시 작성하기</button>` : `<button class="btn primary" data-act="lecDone">정리 끝!</button>`}
      </div>
    </section>`;
  }

  SQ.views.lectures = function () {
    const S = SQ.state;
    if (!S.courses.length) {
      return `
        ${SQ.pageHead('', 'Lecture', `<button class="btn dark" data-act="addCourse">${icon('plus', 16)} 강의 추가</button>`, '들은 강의를 한 곳에 정리하기')}
        <div class="rule"></div>
        <div class="empty">
          <div class="empty-ic">${icon('notebook', 26)}</div>
          <h3>등록한 강의가 없어요</h3>
          <p>듣고 있는 강의(과목)를 추가하고, 회차마다 4칸 정리 퀘스트를 채워 보세요.</p>
          <button class="btn primary" data-act="addCourse">${icon('plus', 16)} 강의 추가</button>
        </div>`;
    }
    if (!S.courses.some((c) => c.id === ui.courseSel)) ui.courseSel = S.courses[0].id;
    const course = S.courses.find((c) => c.id === ui.courseSel);
    const lecs = S.lectures.filter((l) => l.courseId === course.id).sort((a, b) => b.no - a.no);
    if (!lecs.some((l) => l.id === ui.lecSel)) ui.lecSel = (lecs.find((l) => l.status !== 'done') || lecs[0] || {}).id;
    const lec = lecs.find((l) => l.id === ui.lecSel);

    const courseCards = S.courses
      .map((c) => {
        const st = courseStats(c);
        const pct = c.total ? Math.min(100, (st.taken / c.total) * 100) : 0;
        return `<button class="ccard ${c.id === course.id ? 'on' : ''}" style="${SQ.cvar(c.color)}" data-act="selCourse" data-id="${c.id}">
          <span class="cc-p"><i class="dot"></i>${esc(c.provider || '강의')}</span>
          <b>${esc(c.name)}</b>
          <span class="bar"><i style="width:${pct}%"></i></span>
          <small>${c.total ? `${c.total}강 중 ${st.taken}강` : `${st.taken}강까지`} · 정리 완료 ${st.done}개</small>
        </button>`;
      })
      .join('');

    const list = lecs
      .map(
        (l) => `<button class="lrow ${l.id === ui.lecSel ? 'on' : ''}" data-act="selLecture" data-id="${l.id}">
          <span>${l.no}강 · ${esc(l.title)}</span>
          <em class="${l.status === 'done' ? 'ok' : 'wip'}">${l.status === 'done' ? '정리 끝' : '작성 중'}</em>
        </button>`
      )
      .join('');

    return `
      ${SQ.pageHead('', 'Lecture', `<button class="btn dark" data-act="addCourse">${icon('plus', 16)} 강의 추가</button>`, '들은 강의를 한 곳에 정리하기')}
      <div class="rule"></div>
      <div class="lec-grid ${ui.lecMobileEditor ? 'show-ed' : ''}">
        <aside class="lec-side">
          <h4 class="side-h">내 강의</h4>
          <div class="ccards">${courseCards}</div>
          <div class="side-h row">
            <h4>${esc(course.name)} · 강의별</h4>
            <span class="sp"></span>
            <button class="icon-btn" data-act="editCourse" data-id="${course.id}" aria-label="강의 정보 수정">${icon('pencil', 16)}</button>
          </div>
          <div class="lrows">${list || '<p class="col-empty">아직 정리한 회차가 없어요</p>'}</div>
          <button class="chip-btn dashed wide" data-act="addLecture" data-cid="${course.id}">${icon('plus', 14)} 새 회차 노트</button>
        </aside>
        <div class="lec-main">
          ${ui.lecMobileEditor ? `<button class="btn ghost sm back" data-act="lecBack">${icon('chevL', 16)} 목록</button>` : ''}
          ${
            lec
              ? editor(lec)
              : `<div class="empty card"><div class="empty-ic">${icon('pen', 24)}</div><h3>정리할 회차를 추가해요</h3><p>강의를 듣고 나서 4칸만 채우면 정리 끝!</p><button class="btn primary" data-act="addLecture" data-cid="${course.id}">${icon('plus', 16)} 새 회차 노트</button></div>`
          }
        </div>
      </div>`;
  };

  /* ---------- autosave inputs ---------- */
  const saveSoon = SQ.debounce(() => {
    SQ.save();
    const s = document.getElementById('save-state');
    if (s) s.textContent = '자동 저장됨';
  }, 400);

  SQ.inputHandlers.lecture = (el) => {
    const l = SQ.state.lectures.find((x) => x.id === ui.lecSel);
    if (!l) return;
    const f = el.dataset.lf;
    if (f === 'point') {
      l.points = l.points && l.points.length ? l.points : ['', '', ''];
      l.points[+el.dataset.i] = el.value;
    } else l[f] = el.value;
    l.updatedAt = Date.now();
    const s = document.getElementById('save-state');
    if (s) s.textContent = '저장 중…';
    const p = document.getElementById('lq-progress');
    if (p) p.innerHTML = questBar(l);
    saveSoon();
  };

  SQ.keyHandlers.revInput = (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      A.saveRevisit();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      A.cancelRevisit();
    }
  };

  /* ---------- modals ---------- */
  function courseModal(id) {
    const c = id ? SQ.state.courses.find((x) => x.id === id) : null;
    const v = c || { provider: '', name: '', total: '', color: SQ.nextColor() };
    SQ.modal.open({
      title: c ? '강의 정보 수정' : '강의 추가',
      sub: c ? '' : '듣고 있는 강의(과목) 하나를 등록해요',
      submit: c ? '저장' : '추가',
      body: `
        <div class="grid2">
          <label class="field"><span>어디서 듣나요?</span><input class="input" name="provider" maxlength="20" value="${esc(v.provider)}" placeholder="예: 방통대, 온라인 강의"></label>
          <label class="field"><span>전체 강의 수 <em>선택</em></span><input class="input" type="number" name="total" min="0" max="500" value="${v.total || ''}" placeholder="예: 15"></label>
        </div>
        <label class="field"><span>강의 이름</span><input class="input" name="name" maxlength="40" value="${esc(v.name)}" placeholder="예: 자료구조" autofocus></label>
        <div class="field"><span>색</span>${SQ.colorPicker('color', v.color)}</div>`,
      onDelete: c
        ? async () => {
            SQ.modal.close();
            SQ.commit((S) => {
              S.lectures = S.lectures.filter((l) => l.courseId !== id);
              S.courses = S.courses.filter((x) => x.id !== id);
            }, { undo: `"${c.name}" 강의와 노트를 삭제했어요` });
          }
        : null,
      onSubmit(d) {
        const name = d.name.trim();
        if (!name) return '강의 이름을 적어 주세요';
        SQ.commit((S) => {
          const val = { provider: d.provider.trim(), name, total: Math.max(0, +d.total || 0), color: d.color || 'pink' };
          if (c) Object.assign(S.courses.find((x) => x.id === id), val);
          else {
            const nc = Object.assign({ id: SQ.uid() }, val);
            S.courses.push(nc);
            ui.courseSel = nc.id;
          }
        }, { toast: c ? '저장했어요' : '강의를 추가했어요' });
      },
    });
  }

  function lectureModal(cid, id) {
    const l = id ? SQ.state.lectures.find((x) => x.id === id) : null;
    const ls = SQ.state.lectures.filter((x) => x.courseId === cid);
    const nextNo = ls.length ? Math.max(...ls.map((x) => x.no)) + 1 : 1;
    SQ.modal.open({
      title: l ? '회차 정보 수정' : '새 회차 노트',
      submit: l ? '저장' : '만들기',
      body: `
        <div class="grid-no">
          <label class="field"><span>회차</span><input class="input" type="number" name="no" min="1" max="999" value="${l ? l.no : nextNo}"></label>
          <label class="field"><span>제목</span><input class="input" name="title" maxlength="40" value="${esc(l ? l.title : '')}" placeholder="예: 스택과 큐" autofocus></label>
        </div>`,
      onSubmit(d) {
        const title = d.title.trim();
        const no = Math.max(1, +d.no || 1);
        if (!title) return '제목을 적어 주세요';
        if (ls.some((x) => x.no === no && x.id !== id)) return `${no}강 노트가 이미 있어요`;
        SQ.commit((S) => {
          if (l) Object.assign(S.lectures.find((x) => x.id === id), { title, no });
          else {
            const nl = { id: SQ.uid(), courseId: cid, no, title, summary: '', points: ['', '', ''], confusing: '', revisits: [], status: 'draft', createdAt: SQ.today() };
            S.lectures.push(nl);
            ui.lecSel = nl.id;
            ui.lecMobileEditor = true;
          }
        });
      },
    });
  }

  /* ---------- actions ---------- */
  A.addCourse = () => courseModal();
  A.editCourse = (el) => courseModal(el.dataset.id);
  A.selCourse = (el) => {
    ui.courseSel = el.dataset.id;
    ui.lecSel = null;
    ui.addingRev = false;
    SQ.render();
  };
  A.selLecture = (el) => {
    ui.lecSel = el.dataset.id;
    ui.addingRev = false;
    ui.lecMobileEditor = true;
    SQ.render();
    if (window.innerWidth < 900) window.scrollTo({ top: 0 });
  };
  A.lecBack = () => {
    ui.lecMobileEditor = false;
    SQ.render();
  };
  A.addLecture = (el) => lectureModal(el.dataset.cid);
  A.lecMore = (el) => {
    const l = SQ.state.lectures.find((x) => x.id === el.dataset.id);
    SQ.menu(el, [
      { label: '회차 · 제목 수정', icon: 'pencil', run: () => lectureModal(l.courseId, l.id) },
      { label: '오늘 시간표에 넣기', icon: 'calendar', run: () => SQ.openItemModal({ k: SQ.today(), prefill: { title: `${(SQ.state.courses.find((c) => c.id === l.courseId) || {}).name || ''} ${l.no}강`.trim(), lectureId: l.id, desc: l.title } }) },
      '-',
      {
        label: '노트 삭제', icon: 'trash', danger: true,
        run: () => SQ.commit((S) => {
          S.lectures = S.lectures.filter((x) => x.id !== l.id);
          ui.lecSel = null;
        }, { undo: `${l.no}강 노트를 삭제했어요` }),
      },
    ]);
  };
  A.lecSave = () => {
    SQ.save();
    SQ.toast('임시 저장했어요');
  };
  A.lecDone = async () => {
    const l = SQ.state.lectures.find((x) => x.id === ui.lecSel);
    const f = filled(l);
    if (f.n < 4) {
      const ok = await SQ.confirm(`아직 ${4 - f.n}칸이 비어 있어요. 그래도 정리를 끝낼까요?`, { ok: '정리 끝!' });
      if (!ok) return;
    }
    SQ.commit(() => {
      l.status = 'done';
      l.doneAt = SQ.today();
    });
    SQ.celebrate(`${l.no}강 정리 퀘스트 클리어!`);
  };
  A.lecReopen = () =>
    SQ.commit(() => {
      SQ.state.lectures.find((x) => x.id === ui.lecSel).status = 'draft';
    });
  A.addRevisit = () => {
    ui.addingRev = true;
    ui.focus = '#rev-t';
    SQ.render();
  };
  A.cancelRevisit = () => {
    ui.addingRev = false;
    SQ.render();
  };
  A.saveRevisit = () => {
    const t = document.getElementById('rev-t'), x = document.getElementById('rev-x');
    if (!t || !x) return;
    const tv = t.value.trim(), xv = x.value.trim();
    if (!tv && !xv) {
      t.focus();
      return;
    }
    ui.addingRev = false;
    SQ.commit(() => {
      const l = SQ.state.lectures.find((y) => y.id === ui.lecSel);
      (l.revisits = l.revisits || []).push({ t: tv, text: xv });
      l.updatedAt = Date.now();
    });
  };
  A.delRevisit = (el) =>
    SQ.commit(() => {
      const l = SQ.state.lectures.find((y) => y.id === ui.lecSel);
      l.revisits.splice(+el.dataset.i, 1);
    });
  A.gotoDate = (el) => {
    ui.selDate = el.dataset.k;
    SQ.go('week');
  };
})();
