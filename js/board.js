/* Study Quest — 공부 보드 (kanban) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const ui = SQ.ui;
  const A = SQ.actions;

  const STATUS = { todo: '할 일', doing: '하는 중', done: '끝냄' };

  SQ.cardProgress = (c) => {
    if (c.counter && c.counter.total) return { done: Math.min(c.counter.cur, c.counter.total), total: c.counter.total, counter: true };
    const subs = c.subtasks || [];
    return { done: subs.filter((s) => s.done).length, total: subs.length };
  };

  function dueLabel(due) {
    if (!due) return '';
    const t = SQ.today();
    const diff = SQ.diffDays(t, due);
    const w = SQ.DOW[SQ.dow(due)];
    if (diff < 0) return `<span class="due over">${SQ.md(due)} 지남</span>`;
    if (diff === 0) return `<span class="due soon">오늘까지</span>`;
    if (diff === 1) return `<span class="due soon">내일</span>`;
    const ws = SQ.weekStart(t);
    if (due <= SQ.addDays(ws, 6)) return `<span class="due">이번 주 ${w}</span>`;
    if (due <= SQ.addDays(ws, 13)) return `<span class="due">다음 주 ${w}</span>`;
    return `<span class="due">${SQ.md(due)}</span>`;
  }

  const inToday = (c) => (SQ.state.schedules[SQ.today()] || []).some((i) => i.boardId === c.id);

  function cardHtml(c) {
    const s = SQ.subj(c.subjectId);
    const p = SQ.cardProgress(c);
    const nextSub = (c.subtasks || []).find((x) => !x.done);
    if (c.status === 'done') {
      return `<div class="bcard done" draggable="true" data-id="${c.id}" style="${SQ.cvar(s.color)}" data-act="openCard" tabindex="0">
        <span class="done-chk">${icon('check', 14)}</span>
        <div><b>${esc(c.title)}</b><small>${esc(s.name)}${c.doneAt ? ' · ' + SQ.md(c.doneAt) : ''}</small></div>
      </div>`;
    }
    let meta = '';
    if (c.status === 'doing' && inToday(c)) meta = '<span class="badge pinkfill">오늘 시간표</span>';
    else if (c.due) meta = dueLabel(c.due);
    else if (c.repeat === 'daily') meta = `<span class="meta">${icon('repeat', 14)} 매일</span>`;
    else if (c.status === 'doing' && c.startedAt) meta = `<span class="meta">${SQ.diffDays(c.startedAt, SQ.today()) + 1}일째</span>`;
    else if (p.total && !p.counter) meta = `<span class="meta">쪼갠 일 ${p.done} / ${p.total}</span>`;

    let prog = '';
    if (c.status === 'doing' && p.total) {
      prog = p.counter
        ? `<div class="bprog"><span class="bar"><i style="width:${(p.done / p.total) * 100}%"></i></span><small>${p.done} / ${p.total}</small></div>`
        : `<div class="bprog">${SQ.segBar(p.done, p.total, 6)}<small>${p.done} / ${p.total}</small></div>`;
    }
    return `<div class="bcard" draggable="true" data-id="${c.id}" style="${SQ.cvar(s.color)}" data-act="openCard" tabindex="0">
      <div class="bcard-h"><span class="tag">${esc(s.name)}</span>${meta}</div>
      <b class="bcard-t">${esc(c.title)}</b>
      ${prog}
      ${c.status === 'doing' && nextSub ? `<p class="next">다음: ${esc(nextSub.text)}</p>` : ''}
    </div>`;
  }

  SQ.views.board = function () {
    const S = SQ.state;
    const filter = ui.boardFilter || '';
    const cards = S.board.filter((c) => !filter || c.subjectId === filter);
    const by = (st) => cards.filter((c) => c.status === st).sort((a, b) => (a.order || 0) - (b.order || 0));
    const ws = SQ.weekStart(SQ.today());
    const doneAll = by('done').sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
    const doneWeek = doneAll.filter((c) => c.doneAt && c.doneAt >= ws);
    const doneShown = ui.showAllDone ? doneAll : doneWeek;
    const weekLogCount = S.doneLog.filter((l) => l.date >= ws).length;
    const limit = S.settings.doingLimit;
    const doingAll = S.board.filter((c) => c.status === 'doing').length;

    // subject tiles
    const subjIds = [...new Set(S.board.map((c) => c.subjectId))];
    const tiles = S.subjects
      .filter((s) => subjIds.includes(s.id))
      .concat(subjIds.includes('') ? [SQ.subj('')] : [])
      .map((s) => {
        const cs = S.board.filter((c) => c.subjectId === s.id);
        const n = { todo: 0, doing: 0, done: 0 };
        cs.forEach((c) => n[c.status]++);
        const tot = cs.length || 1;
        const parts = [n.todo && `할 일 ${n.todo}`, n.doing && `하는 중 ${n.doing}`, n.done && `끝 ${n.done}`].filter(Boolean).join(' · ');
        return `<button class="stile ${filter === s.id ? 'on' : ''}" style="${SQ.cvar(s.color)}" data-act="boardFilter" data-s="${s.id}">
          <b><i class="dot"></i>${esc(s.name)}</b>
          <span class="stack"><i class="d" style="width:${(n.done / tot) * 100}%"></i><i class="g" style="width:${(n.doing / tot) * 100}%"></i></span>
          <small>${parts}</small>
        </button>`;
      })
      .join('');

    const chips =
      `<button class="fchip ${!filter ? 'on' : ''}" data-act="boardFilter" data-s="">전체 ${S.board.length}</button>` +
      S.subjects
        .filter((s) => subjIds.includes(s.id))
        .map((s) => `<button class="fchip ${filter === s.id ? 'on' : ''}" style="${SQ.cvar(s.color)}" data-act="boardFilter" data-s="${s.id}"><i class="dot"></i>${esc(s.name)}</button>`)
        .join('');

    const todo = by('todo'), doing = by('doing');
    return `
      ${SQ.pageHead('공부 중인 것 한눈에 보기', 'Study Board', `<button class="btn primary" data-act="addCard" data-st="todo">${icon('plus', 16)} 공부할 것 추가</button>`)}
      ${S.board.length ? `<div class="stiles">${tiles}<button class="stile add" data-act="addSubject">${icon('plus', 18)}<small>과목 추가</small></button></div>
      <div class="legend"><span><i class="lg d"></i> 진한 칸 = 끝냄</span><span><i class="lg g"></i> 연한 칸 = 하는 중</span></div>
      <div class="fchips" role="toolbar" aria-label="과목 필터">${chips}</div>` : ''}
      <div class="kanban">
        <section class="bcol todo" data-status="todo" aria-label="할 일">
          <header><span class="ring-o"></span><h3>할 일</h3><span class="cnt">${todo.length}</span><span class="sp"></span><button class="icon-btn" data-act="addCard" data-st="todo" aria-label="할 일 추가">${icon('plus', 18)}</button></header>
          <div class="bcol-list">${todo.map(cardHtml).join('') || `<p class="col-empty">공부할 것을 추가해 보세요</p>`}</div>
        </section>
        <section class="bcol doing" data-status="doing" aria-label="하는 중">
          <header><span class="live-dot"></span><h3>하는 중</h3><span class="cnt">${doingAll} / ${limit}</span><span class="sp"></span><button class="icon-btn" data-act="addCard" data-st="doing" aria-label="하는 중에 추가" ${doingAll >= limit ? 'disabled' : ''}>${icon('plus', 18)}</button></header>
          ${doingAll >= limit ? `<p class="col-msg">꽉 찼어요! 하나 끝내고 새로 시작해요</p>` : ''}
          <div class="bcol-list">${doing.map(cardHtml).join('') || `<p class="col-empty">할 일 카드를 여기로 끌어오세요</p>`}</div>
        </section>
        <section class="bcol done" data-status="done" aria-label="끝냄">
          <header>${icon('check', 18, 'done-ic')}<h3>끝냄</h3><span class="cnt green">이번 주 ${weekLogCount}</span></header>
          <div class="bcol-list">${doneShown.map(cardHtml).join('') || `<p class="col-empty">${ui.showAllDone ? '아직 끝낸 게 없어요' : '이번 주에 끝낸 게 아직 없어요'}</p>`}</div>
          ${S.doneLog.length || doneAll.length ? `<button class="link-btn green center" data-act="toggleAllDone">${ui.showAllDone ? '이번 주 것만 보기' : `지금까지 끝낸 것 전부 보기 · ${Math.max(S.doneLog.length, doneAll.length)}개`} ${icon('chevR', 14)}</button>` : ''}
        </section>
      </div>
      <p class="tip">${icon('bulb', 18)} 카드를 끌어서 옆 칸으로 옮기면 상태가 바뀌어요. 카드를 누르면 쪼개기랑 메모가 열려요.</p>`;
  };

  /* ---------- drag & drop ---------- */
  SQ.after.board = function () {
    let dragId = null;
    const line = document.createElement('div');
    line.className = 'drop-line';
    document.querySelectorAll('.bcard[draggable]').forEach((el) => {
      el.addEventListener('dragstart', (e) => {
        dragId = el.dataset.id;
        e.dataTransfer.setData('text/plain', dragId);
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(() => el.classList.add('dragging'));
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        line.remove();
        document.querySelectorAll('.bcol.over').forEach((c) => c.classList.remove('over'));
      });
    });
    document.querySelectorAll('.bcol').forEach((col) => {
      const list = col.querySelector('.bcol-list');
      const afterEl = (y) =>
        [...list.querySelectorAll('.bcard:not(.dragging)')].find((c) => {
          const r = c.getBoundingClientRect();
          return y < r.top + r.height / 2;
        });
      col.addEventListener('dragover', (e) => {
        if (!dragId) return;
        e.preventDefault();
        col.classList.add('over');
        const a = afterEl(e.clientY);
        if (a) list.insertBefore(line, a);
        else list.appendChild(line);
      });
      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('over');
          line.remove();
        }
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = dragId || e.dataTransfer.getData('text/plain');
        const a = afterEl(e.clientY);
        line.remove();
        dragId = null;
        SQ.moveCard(id, col.dataset.status, a ? a.dataset.id : null);
      });
    });
  };

  SQ.moveCard = function (id, status, beforeId) {
    const S = SQ.state;
    const c = S.board.find((x) => x.id === id);
    if (!c) return;
    const limit = S.settings.doingLimit;
    if (status === 'doing' && c.status !== 'doing' && S.board.filter((x) => x.status === 'doing').length >= limit) {
      SQ.toast(`하는 중 칸이 꽉 찼어요 (최대 ${limit}개). 하나 끝내고 옮겨요!`);
      SQ.render();
      return;
    }
    const was = c.status;
    SQ.commit(() => setStatus(c, status, beforeId));
    if (status === 'done' && was !== 'done') SQ.celebrate(`"${c.title}" 끝냈어요!`);
  };

  function setStatus(c, status, beforeId) {
    const S = SQ.state;
    const t = SQ.today();
    if (c.status !== status) {
      if (c.status === 'done') {
        const i = S.doneLog.map((l) => l.cardId).lastIndexOf(c.id);
        if (i >= 0 && S.doneLog[i].date === c.doneAt) S.doneLog.splice(i, 1);
        c.doneAt = null;
      }
      if (status === 'doing' && !c.startedAt) c.startedAt = t;
      if (status === 'todo') c.startedAt = null;
      if (status === 'done') {
        c.doneAt = t;
        S.doneLog.push({ cardId: c.id, title: c.title, subjectId: c.subjectId, date: t });
      }
      c.status = status;
    }
    const list = S.board.filter((x) => x.status === status && x.id !== c.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    let idx = beforeId ? list.findIndex((x) => x.id === beforeId) : -1;
    if (idx < 0) idx = list.length;
    list.splice(idx, 0, c);
    list.forEach((x, i) => (x.order = i));
  }

  /* ---------- add / edit card ---------- */
  function newCardModal(status) {
    const S = SQ.state;
    SQ.modal.open({
      title: '공부할 것 추가',
      submit: '추가',
      body: `
        <label class="field"><span>무엇을 공부할까요?</span><input class="input" name="title" maxlength="60" placeholder="예: 도넛 튜토리얼 따라 만들기"></label>
        <div class="grid2">
          <label class="field"><span>과목</span><select class="input" name="subjectId">${SQ.subjectOptions(ui.boardFilter || '')}</select></label>
          <label class="field"><span>상태</span><select class="input" name="status">${Object.keys(STATUS).map((k) => `<option value="${k}" ${k === status ? 'selected' : ''}>${STATUS[k]}</option>`).join('')}</select></label>
        </div>
        <label class="field new-subj" hidden><span>새 과목 이름</span><input class="input" name="newSubject" maxlength="20"></label>
        <div class="grid2">
          <label class="field"><span>마감 <em>선택</em></span><input class="input" type="date" name="due"></label>
          <label class="field"><span>반복</span><select class="input" name="repeat"><option value="">반복 안 함</option><option value="daily">매일 (끝내면 다음 날 다시 할 일로)</option></select></label>
        </div>
        <label class="field"><span>쪼갠 할 일 <em>한 줄에 하나씩</em></span><textarea class="input" name="subs" rows="3"></textarea></label>
        <label class="field"><span>숫자로 채우기 <em>선택 · 예: 단어 200개</em></span><input class="input" type="number" min="0" max="100000" name="total" placeholder="목표 개수"></label>`,
      onOpen(form) {
        const sel = form.subjectId;
        sel.addEventListener('change', () => (form.querySelector('.new-subj').hidden = sel.value !== '__new'));
      },
      onSubmit(d) {
        const title = d.title.trim();
        if (!title) return '제목을 적어 주세요';
        if (d.status === 'doing' && S.board.filter((x) => x.status === 'doing').length >= S.settings.doingLimit) return `하는 중 칸이 꽉 찼어요 (최대 ${S.settings.doingLimit}개)`;
        if (d.subjectId === '__new' && !d.newSubject.trim()) return '새 과목 이름을 적어 주세요';
        SQ.commit(() => {
          const c = {
            id: SQ.uid(), title, subjectId: SQ.resolveSubject(d), status: 'todo', due: d.due || '', repeat: d.repeat || '',
            subtasks: String(d.subs || '').split('\n').map((x) => x.trim()).filter(Boolean).map((text) => ({ id: SQ.uid(), text, done: false })),
            counter: +d.total > 0 ? { cur: 0, total: +d.total } : null,
            memo: '', createdAt: SQ.today(), order: -1,
          };
          S.board.push(c);
          setStatus(c, d.status, null);
        }, { toast: '보드에 추가했어요' });
      },
    });
  }

  function cardBody(c) {
    const p = SQ.cardProgress(c);
    return `
      <label class="field"><span>제목</span><input class="input" data-cf="title" value="${esc(c.title)}" maxlength="60"></label>
      <div class="seg-radio st3">
        ${Object.keys(STATUS).map((k) => `<label><input type="radio" name="cstatus" value="${k}" data-cf="status" ${c.status === k ? 'checked' : ''}><span>${STATUS[k]}</span></label>`).join('')}
      </div>
      <div class="grid3">
        <label class="field"><span>과목</span><select class="input" data-cf="subjectId">${SQ.subjectOptions(c.subjectId, false)}</select></label>
        <label class="field"><span>마감</span><input class="input" type="date" data-cf="due" value="${c.due || ''}"></label>
        <label class="field"><span>반복</span><select class="input" data-cf="repeat"><option value="">안 함</option><option value="daily" ${c.repeat === 'daily' ? 'selected' : ''}>매일</option></select></label>
      </div>
      <div class="cm-sec">
        <div class="cm-h"><b>${icon('scissors', 15)} 쪼갠 할 일</b><small>${(c.subtasks || []).filter((s) => s.done).length} / ${(c.subtasks || []).length}</small></div>
        <ul class="cm-subs">
          ${(c.subtasks || [])
            .map(
              (s) => `<li class="sub ${s.done ? 'done' : ''}"><label><input type="checkbox" data-cact="sub" data-sid="${s.id}" ${s.done ? 'checked' : ''}><span class="cb">${icon('check', 13)}</span><span class="sub-t">${esc(s.text)}</span></label><button type="button" class="icon-btn xs sub-del" data-cact="delsub" data-sid="${s.id}" aria-label="삭제">${icon('x', 14)}</button></li>`
            )
            .join('')}
        </ul>
        <div class="sub-add"><input class="input sm" id="cm-sub" placeholder="쪼갠 할 일을 적고 Enter" maxlength="80"><button type="button" class="btn sm line" data-cact="addsub">추가</button></div>
      </div>
      <div class="cm-sec">
        <div class="cm-h"><b>${icon('chart', 15)} 숫자로 채우기</b><small>예: 단어 120 / 200</small></div>
        <div class="counter">
          <button type="button" class="icon-btn line" data-cact="cnt" data-n="-1" aria-label="1 빼기">−</button>
          <input class="input sm num" type="number" min="0" data-cf="cur" value="${c.counter ? c.counter.cur : 0}" aria-label="현재">
          <span>/</span>
          <input class="input sm num" type="number" min="0" data-cf="total" value="${c.counter ? c.counter.total : ''}" placeholder="목표" aria-label="목표">
          <button type="button" class="icon-btn line" data-cact="cnt" data-n="1" aria-label="1 더하기">+</button>
          <button type="button" class="btn sm ghost" data-cact="cnt" data-n="10">+10</button>
        </div>
        ${p.counter ? `<span class="bar big"><i style="width:${(p.done / p.total) * 100}%"></i></span>` : ''}
      </div>
      <label class="field"><span>메모</span><textarea class="input" data-cf="memo" rows="3" maxlength="1000" placeholder="참고 링크, 막힌 부분 등">${esc(c.memo || '')}</textarea></label>
      <div class="cm-actions">
        <button type="button" class="btn line" data-cact="toToday">${icon('calendar', 15)} 오늘 시간표에 넣기</button>
        ${c.status !== 'done' ? `<button type="button" class="btn soft" data-cact="finish">${icon('check', 15)} 끝냈어요</button>` : ''}
      </div>`;
  }

  function openCard(id) {
    const c = SQ.state.board.find((x) => x.id === id);
    if (!c) return;
    const rerender = () => {
      const b = document.querySelector('.modal-b');
      if (b) b.innerHTML = cardBody(SQ.state.board.find((x) => x.id === id));
    };
    const saveQuiet = SQ.debounce(() => SQ.save(), 250);
    SQ.modal.open({
      title: '카드 자세히',
      sub: SQ.subj(c.subjectId).name + (c.createdAt ? ` · ${SQ.md(c.createdAt)} 추가` : ''),
      wide: true,
      cancel: '닫기',
      noFocus: true,
      body: cardBody(c),
      onDelete: () => {
        SQ.modal.close();
        SQ.commit((S) => {
          S.board = S.board.filter((x) => x.id !== id);
        }, { undo: '카드를 삭제했어요' });
      },
      onClose: () => SQ.render(),
      onOpen(form) {
        form.addEventListener('input', (e) => {
          const el = e.target.closest('[data-cf]');
          if (!el) return;
          const card = SQ.state.board.find((x) => x.id === id);
          const f = el.dataset.cf;
          if (f === 'title' || f === 'memo') {
            card[f] = el.value;
            saveQuiet();
          }
        });
        form.addEventListener('change', (e) => {
          const el = e.target.closest('[data-cf]');
          const card = SQ.state.board.find((x) => x.id === id);
          if (el) {
            const f = el.dataset.cf;
            if (f === 'status') {
              if (el.value === 'doing' && card.status !== 'doing' && SQ.state.board.filter((x) => x.status === 'doing').length >= SQ.state.settings.doingLimit) {
                SQ.toast(`하는 중 칸이 꽉 찼어요 (최대 ${SQ.state.settings.doingLimit}개)`);
                rerender();
                return;
              }
              setStatus(card, el.value, null);
              if (el.value === 'done') SQ.celebrate(`"${card.title}" 끝냈어요!`);
            } else if (f === 'cur' || f === 'total') {
              const cur = Math.max(0, +form.querySelector('[data-cf=cur]').value || 0);
              const total = Math.max(0, +form.querySelector('[data-cf=total]').value || 0);
              card.counter = total ? { cur: Math.min(cur, total), total } : null;
            } else if (f === 'title') {
              card.title = el.value.trim() || card.title;
            } else card[f] = el.value;
            SQ.save();
            if (f !== 'title' && f !== 'memo') rerender();
          }
        });
        form.addEventListener('keydown', (e) => {
          if (e.target.id === 'cm-sub' && e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            addSub();
          }
        });
        const addSub = () => {
          const inp = form.querySelector('#cm-sub');
          const text = inp.value.trim();
          if (!text) return;
          SQ.state.board.find((x) => x.id === id).subtasks.push({ id: SQ.uid(), text, done: false });
          SQ.save();
          rerender();
          form.querySelector('#cm-sub').focus();
        };
        form.addEventListener('click', (e) => {
          const b = e.target.closest('[data-cact]');
          if (!b) return;
          const card = SQ.state.board.find((x) => x.id === id);
          const a = b.dataset.cact;
          if (a === 'sub') {
            const s = card.subtasks.find((x) => x.id === b.dataset.sid);
            s.done = b.checked;
          } else if (a === 'delsub') card.subtasks = card.subtasks.filter((x) => x.id !== b.dataset.sid);
          else if (a === 'addsub') return addSub();
          else if (a === 'cnt') {
            const total = card.counter ? card.counter.total : 0;
            if (!total) {
              SQ.toast('먼저 목표 숫자를 적어 주세요');
              return;
            }
            card.counter.cur = Math.max(0, Math.min(total, card.counter.cur + +b.dataset.n));
            if (card.counter.cur === total && card.status !== 'done') SQ.toast('목표 숫자를 다 채웠어요! 끝냄으로 옮겨 볼까요?');
          } else if (a === 'finish') {
            setStatus(card, 'done', null);
            SQ.save();
            SQ.modal.close();
            SQ.celebrate(`"${card.title}" 끝냈어요!`);
            return;
          } else if (a === 'toToday') {
            SQ.save();
            SQ.modal.close();
            SQ.ui.selDate = SQ.today();
            SQ.openItemModal({
              k: SQ.today(),
              prefill: { title: card.title, subjectId: card.subjectId, subtasks: card.subtasks.filter((s) => !s.done), boardId: card.id, desc: card.memo ? card.memo.split('\n')[0].slice(0, 100) : '' },
            });
            return;
          }
          SQ.save();
          rerender();
        });
      },
    });
  }

  SQ.subjectModal = function (id) {
    const s = id ? SQ.state.subjects.find((x) => x.id === id) : null;
    const v = s || { name: '', color: SQ.nextColor(), icon: 'book' };
    SQ.modal.open({
      title: s ? '과목 수정' : '과목 추가',
      submit: s ? '저장' : '추가',
      body: `
        <label class="field"><span>과목 이름</span><input class="input" name="name" maxlength="20" value="${esc(v.name)}" placeholder="예: 언리얼"></label>
        <div class="field"><span>색</span>${SQ.colorPicker('color', v.color)}</div>
        <div class="field"><span>아이콘</span>${SQ.iconPicker('icon', v.icon)}</div>`,
      onDelete: s
        ? () => {
            SQ.modal.close();
            SQ.commit((S) => {
              S.subjects = S.subjects.filter((x) => x.id !== id);
            }, { undo: `"${s.name}" 과목을 지웠어요. 이 과목의 일정과 카드는 '기타'로 남아요` });
          }
        : null,
      onSubmit(d) {
        const name = d.name.trim();
        if (!name) return '과목 이름을 적어 주세요';
        if (SQ.state.subjects.some((x) => x.name === name && x.id !== id)) return '같은 이름의 과목이 있어요';
        SQ.commit((S) => {
          if (s) Object.assign(S.subjects.find((x) => x.id === id), { name, color: d.color, icon: d.icon });
          else S.subjects.push({ id: SQ.uid(), name, color: d.color || 'pink', icon: d.icon || 'book' });
        }, { toast: s ? '과목을 저장했어요' : '과목을 추가했어요' });
      },
    });
  };

  A.addCard = (el) => newCardModal(el.dataset.st || 'todo');
  A.openCard = (el) => openCard(el.dataset.id);
  A.boardFilter = (el) => {
    ui.boardFilter = ui.boardFilter === el.dataset.s ? '' : el.dataset.s;
    SQ.render();
  };
  A.toggleAllDone = () => {
    ui.showAllDone = !ui.showAllDone;
    SQ.render();
  };
  A.addSubject = () => SQ.subjectModal();
  A.editSubject = (el) => SQ.subjectModal(el.dataset.id);
})();
