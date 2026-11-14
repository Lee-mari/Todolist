/* Study Quest — 오늘 / 이번 주 (timetable) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const ui = SQ.ui;
  ui.expanded = ui.expanded || {};

  const selDate = () => ui.selDate || SQ.today();

  /* ======================= shared pieces ======================= */

  function heroCard(ws) {
    const g = SQ.state.weekGoals[ws];
    const u = SQ.weekUnits(ws);
    const pct = u.total ? Math.round((u.done / u.total) * 100) : 0;
    const R = 34, C = 2 * Math.PI * R;
    const left = u.total - u.done;
    const dots = u.total ? SQ.segBar(u.done, u.total, 30) : '';
    return `
    <section class="hero">
      <div class="hero-l">
        <p class="hero-k">${icon('target', 16)} 이번 주 목표</p>
        <h2 class="hero-t">
          ${g && g.title ? esc(g.title) : '<span class="hero-empty">이번 주 목표를 정해 볼까요?</span>'}
          <button class="icon-btn on-dark" data-act="editWeekGoal" data-ws="${ws}" aria-label="이번 주 목표 수정">${icon('pencil', 16)}</button>
        </h2>
        <div class="hero-dots">${dots || '<span class="hero-hint">일정을 추가하면 진행도가 채워져요</span>'}</div>
      </div>
      <div class="hero-r">
        <svg class="ring" viewBox="0 0 84 84" width="92" height="92" aria-hidden="true">
          <circle cx="42" cy="42" r="${R}" class="ring-bg"/>
          <circle cx="42" cy="42" r="${R}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/>
        </svg>
        <span class="ring-pct">${pct}%</span>
        <div class="hero-stat">
          <small>이정표</small>
          <b>${u.done} / ${u.total}</b>
          <small>${u.total === 0 ? '아직 없어요' : left === 0 ? '전부 클리어!' : `${left}개만 더!`}</small>
        </div>
      </div>
    </section>`;
  }

  function dayStrip(ws, sel) {
    const t = SQ.today();
    return `<nav class="strip" aria-label="요일 선택">${SQ.weekDays(ws)
      .map((k) => {
        const u = SQ.units(SQ.state.schedules[k] || []);
        const d = SQ.dow(k);
        const pct = u.total ? (u.done / u.total) * 100 : 0;
        return `<button class="strip-d ${k === sel ? 'on' : ''} ${d === 6 ? 'sat' : ''} ${d === 0 ? 'sun' : ''}" data-act="selDay" data-k="${k}" aria-pressed="${k === sel}">
          <span class="strip-w">${SQ.DOW[d]}${k === t ? '<em> · 오늘</em>' : ''}</span>
          <span class="strip-n">${SQ.pkey(k).getDate()}</span>
          <span class="strip-bar ${u.total ? '' : 'empty'}"><i style="width:${pct}%"></i></span>
        </button>`;
      })
      .join('')}</nav>`;
  }

  function taskRow(it, k) {
    const s = SQ.subj(it.subjectId);
    const t = SQ.today();
    const nm = SQ.nowMin();
    const st = SQ.toMin(it.start), en = st + SQ.dur2(it);
    const timerOn = SQ.state.timer && SQ.state.timer.id === it.id;
    const isNow = !it.done && ((k === t && nm >= st && nm < en) || timerOn);
    const expanded = isNow || !!ui.expanded[it.id];
    const ms = it.milestones || [];
    const pct = k === t && nm >= st && nm < en ? ((nm - st) / (en - st)) * 100 : 0;
    const lec = it.lectureId && SQ.state.lectures.find((l) => l.id === it.lectureId);

    let badge = '';
    if (timerOn) badge = `<span class="now-badge"><i></i>집중하는 중 · <b data-tick="timer">${SQ.fmtTimer()}</b></span>`;
    else if (isNow) badge = `<span class="now-badge"><i></i>지금 하는 중 · ${SQ.dur(en - nm)} 남음</span>`;

    const tools = `
      <div class="tools ${isNow ? 'show' : ''}">
        ${it.done ? '' : `<button class="icon-btn" data-act="timer" data-id="${it.id}" title="${timerOn ? '타이머 멈추기' : '집중 타이머 시작'}" aria-label="${timerOn ? '타이머 멈추기' : '집중 타이머 시작'}">${icon(timerOn ? 'pause' : 'play', 16)}</button>`}
        <button class="icon-btn" data-act="editItem" data-id="${it.id}" title="수정" aria-label="수정">${icon('pencil', 16)}</button>
        <button class="icon-btn" data-act="moreItem" data-id="${it.id}" title="더 보기" aria-label="더 보기">${icon('more', 16)}</button>
      </div>`;

    let body = '';
    if (it.desc) {
      body += isNow ? `<div class="study-box"><small>공부 내용</small><p>${esc(it.desc)}</p></div>` : `<p class="tl-desc">${esc(it.desc)}</p>`;
    }
    const gated = SQ.qGated(it);
    body += SQ.qInline(it, expanded);
    if (!gated) body += SQ.msPath(it, isNow);
    else if (ms.length) body += `<p class="ms-locked">🔒 이정표 ${ms.length}개 · 질문에 답하면 열려요</p>`;

    const foot = [];
    (it.links || []).forEach((l) => {
      const url = SQ.safeUrl(l.url);
      if (!url) return;
      const yt = SQ.ytId && SQ.ytId(url);
      foot.push(`<a class="chip-btn linkc" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(url)}">${icon(yt ? 'video' : 'link', 15)}<span>${esc(l.name || SQ.platformOf(url))}</span>${icon('arrowR', 13, 'ext')}</a>`);
    });
    if (lec) foot.push(`<button class="chip-btn lec" data-act="openLecture" data-lid="${lec.id}">${icon('notebook', 15)} 강의 노트 열기</button>`);
    if (!ms.length && !it.done) foot.push(`<button class="chip-btn dashed" data-act="editItem" data-id="${it.id}">${icon('flag', 14)} 이정표 세우기</button>`);

    return `
    <div class="tl-row task ${isNow ? 'is-now' : ''} ${it.done ? 'is-done' : ''}" style="${SQ.cvar(s.color)}" id="it-${it.id}">
      <div class="tl-time">
        <b>${it.start}</b>
        ${pct ? `<em class="tl-nowtime" style="top:${pct}%">${SQ.fromMin(nm)}</em>` : ''}
        <span>${it.end}</span>
      </div>
      <div class="tl-rail">
        <div class="tl-pill">
          ${pct ? `<span class="tl-fill" style="height:${pct}%"></span>` : ''}
          <span class="tl-ico">${icon(s.icon || 'book', 16)}</span>
          ${it.done ? `<span class="tl-chk">${icon('check', 15)}</span>` : ''}
        </div>
      </div>
      <article class="tl-card">
        ${badge || !isNow ? `<div class="tl-top">${badge}${tools}</div>` : ''}
        <div class="tl-head">
          <button class="chk" data-act="toggleDone" data-id="${it.id}" aria-label="${it.done ? '완료 취소' : '완료로 표시'}" aria-pressed="${!!it.done}">${icon('check', 15)}</button>
          <div class="tl-titles" data-act="toggleExpand" data-id="${it.id}">
            <h3>${esc(it.title)}</h3>
            <p>${SQ.dur(SQ.dur2(it))}${it.subjectId ? ' · ' + esc(s.name) : ''}${it.spentMin && !it.done ? ` · 집중 ${SQ.dur(it.spentMin)}` : ''}</p>
          </div>
          ${it.done ? '<span class="badge green">클리어</span>' : ''}
        </div>
        ${body}
        ${foot.length ? `<div class="tl-foot">${foot.join('')}</div>` : ''}
      </article>
    </div>`;
  }

  function gapRow(from, to, k) {
    return `
    <div class="tl-row gap">
      <div class="tl-time"></div>
      <div class="tl-rail"><span class="tl-dots"></span></div>
      <div><button class="gap-chip" data-act="fillGap" data-k="${k}" data-s="${SQ.fromMin(from)}" data-e="${SQ.fromMin(to)}">빈 시간 ${SQ.dur(to - from)} <span>${icon('plus', 13)} 채우기</span></button></div>
    </div>`;
  }

  function timeline(k) {
    const items = SQ.dayItems(k);
    if (!items.length) {
      const prev = SQ.addDays(k, -7);
      const hasPrev = (SQ.state.schedules[prev] || []).length;
      return `
      <div class="empty">
        <div class="empty-ic">${icon('calendar', 26)}</div>
        <h3>아직 일정이 없어요</h3>
        <p>공부할 시간을 블록으로 쌓아 보세요. 이정표를 하나씩 지나가면 돼요.</p>
        <div class="row-c">
          <button class="btn primary" data-act="addItem" data-k="${k}">${icon('plus', 16)} 일정 추가</button>
          ${hasPrev ? `<button class="btn line" data-act="copyFrom" data-from="${prev}" data-k="${k}">${icon('copy', 16)} 지난주 ${SQ.DOW[SQ.dow(k)]}요일 가져오기</button>` : ''}
        </div>
      </div>`;
    }
    let html = '', lastEnd = null;
    items.forEach((it) => {
      const st = SQ.toMin(it.start);
      if (lastEnd != null && st - lastEnd >= 30) html += gapRow(lastEnd, st, k);
      html += it.kind === 'break' ? SQ.restRow(it, k) : taskRow(it, k);
      lastEnd = Math.max(lastEnd || 0, st + SQ.dur2(it));
    });
    return `<div class="timeline">${html}</div>`;
  }

  function dayGoalCard(k) {
    const g = SQ.state.dayGoals[k];
    const isToday = k === SQ.today();
    const items = SQ.state.schedules[k] || [];
    const u = SQ.units(items);
    const studied = SQ.studiedOn(k), planned = SQ.plannedOn(k);
    const lbl = isToday ? '오늘' : '이 날';
    return `
    <section class="goalbar ${g && g.done ? 'cleared' : ''}">
      <span class="goal-ic">${icon('target', 22)}</span>
      <div class="goal-main">
        <small>${lbl}의 목표</small>
        ${
          g && g.title
            ? `<h3>${esc(g.title)} <button class="icon-btn xs" data-act="editDayGoal" data-k="${k}" aria-label="목표 수정">${icon('pencil', 14)}</button></h3>`
            : `<h3><button class="link-btn big" data-act="editDayGoal" data-k="${k}">${icon('plus', 16)} ${lbl}의 목표 정하기</button></h3>`
        }
        <p>${u.total ? `이정표 ${u.total}개 중 ${u.done}개 통과` : '일정을 추가하면 진행도가 보여요'}</p>
      </div>
      <div class="goal-time">
        <small>${lbl} 공부한 시간</small>
        <b data-tick="studied" data-k="${k}">${SQ.durShort(studied)}</b><span> / ${SQ.durShort(planned)}</span>
      </div>
      ${
        g && g.title
          ? `<button class="btn ${g.done ? 'line' : 'dark'}" data-act="clearDayGoal" data-k="${k}">${icon('check', 16)} ${g.done ? '클리어 완료' : '목표 클리어!'}</button>`
          : ''
      }
    </section>`;
  }

  function dayPanel(k) {
    const items = SQ.state.schedules[k] || [];
    const tasks = items.filter((i) => i.kind === 'task');
    const restMin = items.filter((i) => i.kind === 'break').reduce((a, i) => a + SQ.dur2(i), 0);
    const d = SQ.pkey(k);
    return `
    <section class="day">
      <div class="day-h">
        <div>
          <h2>${SQ.DOW[d.getDay()]}요일, ${d.getMonth() + 1}월 ${d.getDate()}일</h2>
          <p>공부 ${tasks.length}개 · 계획 ${SQ.dur(SQ.plannedOn(k))}${tasks.length ? ` · 클리어 ${tasks.filter((t) => t.done).length}/${tasks.length}` : ''}${restMin ? ` · 휴식 ${SQ.dur(restMin)}` : ''}</p>
        </div>
        <div class="row">
          <button class="btn line" data-act="editTimetable" data-k="${k}">${icon('pencil', 16)} 시간표 수정</button>
          <button class="btn primary" data-act="addItem" data-k="${k}">${icon('plus', 16)} 일정 추가</button>
        </div>
      </div>
      ${timeline(k)}
      ${dayGoalCard(k)}
    </section>`;
  }

  SQ.fmtTimer = () => {
    const t = SQ.state.timer;
    if (!t) return '00:00';
    const s = Math.floor((Date.now() - t.startedAt) / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h ? h + ':' + SQ.pad(m) : SQ.pad(m)) + ':' + SQ.pad(ss);
  };

  /* ======================= views ======================= */

  SQ.views.week = function () {
    const sel = selDate();
    const ws = SQ.weekStart(sel);
    const t = SQ.today();
    const right = `
      <div class="seg-nav">
        <button class="icon-btn" data-act="weekNav" data-n="-7" aria-label="지난주">${icon('chevL')}</button>
        <button class="btn sm ${SQ.weekStart(t) === ws ? 'soft' : 'ghost'}" data-act="weekToday">오늘</button>
        <button class="icon-btn" data-act="weekNav" data-n="7" aria-label="다음 주">${icon('chevR')}</button>
      </div>`;
    return (
      SQ.pageHead(`${SQ.weekLabel(ws)} · ${SQ.weekRange(ws)}`, ws === SQ.weekStart(t) ? 'This Week' : ws < SQ.weekStart(t) ? 'Past Week' : 'Next Week', right) +
      heroCard(ws) +
      dayStrip(ws, sel) +
      dayPanel(sel)
    );
  };

  SQ.views.today = function () {
    const t = SQ.today();
    const items = SQ.dayItems(t).filter((i) => i.kind === 'task');
    const nm = SQ.nowMin();
    const left = items.filter((i) => !i.done);
    const next = left.find((i) => SQ.toMin(i.start) + SQ.dur2(i) > nm);
    const name = SQ.state.profile.name;
    const h = new Date().getHours();
    const greet = h < 6 ? '늦은 밤이에요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후예요' : '오늘 하루 수고했어요';
    const quest = SQ.closingQuestCard ? SQ.closingQuestCard(true) : '';
    const doing = SQ.state.board.filter((c) => c.status === 'doing');
    return `
      ${SQ.pageHead(SQ.longDate(t), 'Today', `<button class="btn line" data-act="goWeek">${icon('calendar', 16)} 주간 보기</button>`, `${greet}${name ? ', ' + esc(name) + '님' : ''}! ${left.length ? `남은 일정 ${left.length}개, 하나씩 클리어해요.` : items.length ? '오늘 일정을 전부 클리어했어요 🎉' : '오늘 할 공부를 추가해 볼까요?'}`)}
      <div class="stats3">
        <div class="stat"><small>오늘 공부한 시간</small><b data-tick="studied" data-k="${t}">${SQ.durShort(SQ.studiedOn(t))}</b><span>계획 ${SQ.dur(SQ.plannedOn(t))}</span></div>
        <div class="stat"><small>다음 일정</small><b class="ellipsis">${next ? esc(next.title) : '없음'}</b><span>${next ? `${next.start} – ${next.end}` : '여유롭게 쉬어요'}</span></div>
        <div class="stat"><small>연속 공부</small><b>${SQ.streak()}일째</b><span>${SQ.icon('flame', 14)} 끊기지 않게!</span></div>
      </div>
      ${quest}
      ${SQ.resumeMini ? SQ.resumeMini() : ''}
      ${
        doing.length
          ? `<section class="mini-doing"><div class="sec-h"><h3>보드에서 하는 중</h3><a href="#/board" class="link-btn">보드 열기 ${icon('chevR', 14)}</a></div>
          <div class="mini-cards">${doing
            .map((c) => {
              const s = SQ.subj(c.subjectId);
              const p = SQ.cardProgress(c);
              const nextSub = (c.subtasks || []).find((x) => !x.done);
              return `<button class="mini-card" style="${SQ.cvar(s.color)}" data-act="openCard" data-id="${c.id}"><span class="tag">${esc(s.name)}</span><b>${esc(c.title)}</b>${p.total ? `<span class="bar"><i style="width:${(p.done / p.total) * 100}%"></i></span>` : ''}${nextSub ? `<small>다음: ${esc(nextSub.text)}</small>` : ''}</button>`;
            })
            .join('')}</div></section>`
          : ''
      }
      ${dayPanel(t)}`;
  };

  /* ======================= item modal ======================= */

  function lectureOptions(sel) {
    const L = SQ.state.lectures;
    if (!L.length) return '';
    return (
      `<option value="">연결 안 함</option>` +
      SQ.state.courses
        .map((c) => {
          const ls = L.filter((l) => l.courseId === c.id).sort((a, b) => b.no - a.no);
          if (!ls.length) return '';
          return `<optgroup label="${esc(c.name)}">${ls.map((l) => `<option value="${l.id}" ${l.id === sel ? 'selected' : ''}>${l.no}강 · ${esc(l.title)}</option>`).join('')}</optgroup>`;
        })
        .join('')
    );
  }

  SQ.openItemModal = function (o) {
    const editing = o.id ? SQ.findItem(o.id) : null;
    const it = editing ? editing.it : null;
    const k = editing ? editing.k : o.k || selDate();
    let start = o.start, end = o.end;
    if (!it && !start) {
      const items = SQ.dayItems(k);
      let s = items.length ? SQ.toMin(items[items.length - 1].end) : 9 * 60;
      if (k === SQ.today()) s = Math.max(s, Math.ceil(SQ.nowMin() / 30) * 30);
      if (s > 22 * 60) s = 22 * 60;
      start = SQ.fromMin(s);
      end = SQ.fromMin(s + 60);
    }
    if (end && start && SQ.toMin(end) - SQ.toMin(start) > 120 && !it && o.start) end = SQ.fromMin(SQ.toMin(start) + 60);
    const kind = it ? it.kind : o.kind || 'task';
    const pre = o.prefill || {};
    const v = it || {
      title: pre.title || '',
      subjectId: pre.subjectId || '',
      desc: pre.desc || '',
      lectureId: pre.lectureId || '',
      links: pre.links || [],
    };
    const lecOpts = lectureOptions(v.lectureId);
    const linkRow = (l) => `
      <div class="link-row">
        <input class="input" name="linkName" maxlength="60" value="${esc(l.name || '')}" placeholder="이름 (예: UE5.7 Starter 1편)" aria-label="링크 이름">
        <input class="input" name="linkUrl" inputmode="url" value="${esc(l.url || '')}" placeholder="https://youtube.com/..." aria-label="링크 주소">
        <button type="button" class="icon-btn" data-dellink aria-label="링크 빼기">${icon('x', 16)}</button>
      </div>`;
    const watchVids = (SQ.state.videos || []).filter((x) => x.url && x.status !== 'done');
    SQ.modal.open({
      title: it ? '일정 수정' : '일정 추가',
      sub: SQ.longDate(k),
      submit: it ? '저장' : '추가',
      onDelete: it
        ? () => {
            SQ.modal.close();
            SQ.deleteItem(it.id);
          }
        : null,
      body: `
        <div class="kind-pick" role="radiogroup" aria-label="일정 종류">
          <label class="kp-study"><input type="radio" name="kind" value="task" ${kind === 'task' ? 'checked' : ''}><span>${icon('book', 18)}<b>공부</b><small>집계에 들어가요</small></span></label>
          <label class="kp-rest"><input type="radio" name="kind" value="break" ${kind === 'break' ? 'checked' : ''}><span><em aria-hidden="true">🌿</em><b>휴식</b><small>집계 없이 푹 쉬기</small></span></label>
        </div>
        ${SQ.restFields(it && it.kind === 'break' ? it : pre)}
        <label class="field"><span>제목 <em class="rest-opt">선택 · 비우면 활동 이름</em></span><input class="input" name="title" maxlength="60" value="${esc(v.title)}" placeholder="예: C++ 포인터 복습" data-ph-task="예: C++ 포인터 복습" data-ph-rest="예: 점심 산책"></label>
        <div class="grid3">
          <label class="field"><span>날짜</span><input class="input" type="date" name="date" value="${k}" required></label>
          <label class="field"><span>시작</span><input class="input" type="time" name="start" value="${it ? it.start : start}" required step="300"></label>
          <label class="field"><span>끝</span><input class="input" type="time" name="end" value="${it ? it.end : end}" required step="300"></label>
        </div>
        <div class="quick-dur task-any">
          ${[10, 15, 20, 30, 60, 90, 120].map((m) => `<button type="button" class="pill ${[10, 20].includes(m) ? 'rest-dur' : [90, 120].includes(m) ? 'task-dur' : ''}" data-dur="${m}">${SQ.dur(m)}</button>`).join('')}
        </div>
        <div class="task-only">
          <label class="field"><span>과목</span><select class="input" name="subjectId">${SQ.subjectOptions(v.subjectId)}</select></label>
          <label class="field new-subj" hidden><span>새 과목 이름</span><input class="input" name="newSubject" maxlength="20" placeholder="예: 수학"></label>
          <label class="field"><span>공부 내용 <em>선택</em></span><textarea class="input" name="desc" rows="2" maxlength="300" placeholder="무엇을 공부할지 한 줄로">${esc(v.desc)}</textarea></label>
          <div class="field">
            <span>강의 · 영상 링크 <em>선택 · 이름은 직접 정해요</em></span>
            <div class="links-ed">${(v.links || []).map(linkRow).join('')}</div>
            <div class="row wrap">
              <button type="button" class="chip-btn dashed" data-addlink>${icon('plus', 14)} 링크 추가</button>
              ${watchVids.length ? `<select class="input sm pick-video" aria-label="영상 진도에서 가져오기"><option value="">영상 진도에서 가져오기…</option>${watchVids.map((x) => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select>` : ''}
            </div>
          </div>
          ${lecOpts ? `<label class="field"><span>강의 노트 연결 <em>선택</em></span><select class="input" name="lectureId">${lecOpts}</select></label>` : ''}
          ${SQ.questFields(it, (pre.subtasks || []).map((s) => s.text))}
        </div>
        ${
          it
            ? ''
            : `<label class="field"><span>반복</span><select class="input" name="repeat">
                <option value="0">이 날만</option>
                <option value="weekdays">이번 주 평일마다 (월–금)</option>
                <option value="4">매주 같은 요일 · 4주</option>
                <option value="8">매주 같은 요일 · 8주</option>
                <option value="16">매주 같은 요일 · 16주</option>
              </select></label>`
        }`,
      onOpen(form) {
        const sync = () => {
          form.dataset.kind = form.kind.value;
          form.title.placeholder = form.title.dataset[form.kind.value === 'break' ? 'phRest' : 'phTask'];
        };
        sync();
        form.querySelectorAll('[name=kind]').forEach((r) => r.addEventListener('change', sync));
        const sel = form.subjectId;
        sel.addEventListener('change', () => {
          form.querySelector('.new-subj').hidden = sel.value !== '__new';
          if (sel.value === '__new') form.newSubject.focus();
        });
        form.querySelectorAll('[data-dur]').forEach((b) =>
          b.addEventListener('click', () => {
            form.end.value = SQ.fromMin(SQ.toMin(form.start.value || '09:00') + +b.dataset.dur);
          })
        );
        SQ.bindQuest(form, { it });
        const box = form.querySelector('.links-ed');
        const addRow = (l) => {
          box.insertAdjacentHTML('beforeend', linkRow(l || {}));
          return box.lastElementChild;
        };
        form.querySelector('[data-addlink]').addEventListener('click', () => addRow().querySelector('[name=linkName]').focus());
        box.addEventListener('click', (e) => {
          const b = e.target.closest('[data-dellink]');
          if (b) b.closest('.link-row').remove();
        });
        const pick = form.querySelector('.pick-video');
        if (pick)
          pick.addEventListener('change', () => {
            const x = watchVids.find((w) => w.id === pick.value);
            if (x) {
              addRow({ name: x.title, url: SQ.resumeUrl ? SQ.resumeUrl(x) : x.url });
              if (!form.title.value.trim()) form.title.value = x.title;
              if (form.subjectId.value === '' && x.subjectId) form.subjectId.value = x.subjectId;
            }
            pick.value = '';
          });
      },
      onSubmit(d) {
        const isBreak = d.kind === 'break';
        const title = (d.title || '').trim() || (isBreak ? SQ.restAct({ activity: d.activity }).l : '');
        if (!title) return '제목을 적어 주세요';
        if (!d.date) return '날짜를 골라 주세요';
        if (!d.start || !d.end) return '시작과 끝 시간을 정해 주세요';
        if (SQ.toMin(d.end) <= SQ.toMin(d.start)) return '끝 시간이 시작 시간보다 늦어야 해요';
        const names = [].concat(d.linkName || []), urls = [].concat(d.linkUrl || []);
        const links = [];
        if (!isBreak) {
          for (let i = 0; i < urls.length; i++) {
            const raw = String(urls[i] || '').trim(), name = String(names[i] || '').trim();
            if (!raw && !name) continue;
            const url = SQ.safeUrl(raw);
            if (!url) return `${name ? `‘${name}’ ` : ''}링크 주소를 확인해 주세요 (https://로 시작하는 주소)`;
            links.push({ name: name || SQ.platformOf(url) + ' 링크', url });
          }
        }
        const subId = isBreak ? '' : SQ.resolveSubject(d);
        if (d.subjectId === '__new' && !subId) return '새 과목 이름을 적어 주세요';
        const base = {
          kind: isBreak ? 'break' : 'task',
          title,
          start: d.start,
          end: d.end,
          subjectId: subId,
          desc: isBreak ? '' : (d.desc || '').trim(),
          milestones: [],
          lectureId: isBreak ? '' : d.lectureId || '',
          links,
        };
        if (!isBreak) {
          const r = SQ.readQuest(d, it && it.kind === 'task' ? it : null);
          base.qs = r.qs;
          base.milestones = r.milestones;
          base.qAsk = r.qAsk;
          base.q = undefined;
          if (!it) {
            SQ.state.settings.askFirst = r.qAsk;
            SQ.state.settings.defaultQs = r.qs.map((x) => x.q);
          }
        }
        if (isBreak) {
          base.activity = d.activity || 'free';
          base.memo = (d.memo || '').trim();
          base.done = false;
        }
        let overlap = false;
        SQ.commit((S) => {
          const check = (date, id) => {
            (S.schedules[date] || []).forEach((x) => {
              if (x.id === id) return;
              const a = SQ.toMin(x.start), b = a + SQ.dur2(x);
              if (SQ.toMin(base.start) < b && SQ.toMin(base.end) > a) overlap = true;
            });
          };
          if (it) {
            const found = SQ.findItem(it.id);
            const cur = found.it;
            Object.assign(cur, base);
            if (cur.milestones.length && cur.milestones.every((s) => s.done)) cur.done = true;
            if (found.k !== d.date) {
              S.schedules[found.k] = S.schedules[found.k].filter((x) => x.id !== cur.id);
              (S.schedules[d.date] = S.schedules[d.date] || []).push(cur);
              ui.selDate = d.date;
            }
            check(d.date, cur.id);
          } else {
            let dates = [d.date];
            if (d.repeat === 'weekdays') {
              const ws = SQ.weekStart(d.date);
              dates = [0, 1, 2, 3, 4].map((i) => SQ.addDays(ws, i)).filter((x) => x >= d.date);
            } else if (+d.repeat > 0) dates = Array.from({ length: +d.repeat }, (_, i) => SQ.addDays(d.date, i * 7));
            dates.forEach((date, i) => {
              const item = Object.assign({ id: SQ.uid(), done: false, spentMin: 0, boardId: pre.boardId || '' }, base, {
                milestones: base.milestones.map((s) => Object.assign({}, s, { id: SQ.uid(), done: false })),
                qs: (base.qs || []).map((x) => Object.assign({}, x, { a: i === 0 ? x.a : '' })),
              });
              (S.schedules[date] = S.schedules[date] || []).push(item);
              if (i === 0) check(date, item.id);
            });
            ui.selDate = d.date;
          }
        }, { toast: it ? '일정을 저장했어요' : '일정을 추가했어요' });
        if (overlap) SQ.toast('다른 일정과 시간이 겹쳐요. 확인해 보세요!');
      },
    });
  };

  SQ.deleteItem = (id) =>
    SQ.commit((S) => {
      const f = SQ.findItem(id);
      if (!f) return;
      S.schedules[f.k] = S.schedules[f.k].filter((x) => x.id !== id);
      if (S.timer && S.timer.id === id) S.timer = null;
    }, { undo: '일정을 삭제했어요' });

  function copyItems(from, to, S) {
    const src = S.schedules[from] || [];
    const dst = (S.schedules[to] = S.schedules[to] || []);
    src.forEach((x) =>
      dst.push(Object.assign({}, x, { id: SQ.uid(), done: false, spentMin: 0, milestones: (x.milestones || []).map((s) => Object.assign({}, s, { id: SQ.uid(), done: false })), qs: (x.qs || []).map((q) => Object.assign({}, q, { a: '' })) }))
    );
    return src.length;
  }

  /* ======================= actions ======================= */
  const A = SQ.actions;

  A.selDay = (el) => {
    ui.selDate = el.dataset.k;
    SQ.render();
  };
  A.weekNav = (el) => {
    ui.selDate = SQ.addDays(selDate(), +el.dataset.n);
    SQ.render();
  };
  A.weekToday = () => {
    ui.selDate = SQ.today();
    SQ.render();
  };
  A.goWeek = () => {
    ui.selDate = SQ.today();
    SQ.go('week');
  };
  A.addItem = (el) => SQ.openItemModal({ k: el.dataset.k });
  A.fillGap = (el) => SQ.openItemModal({ k: el.dataset.k, start: el.dataset.s, end: el.dataset.e });
  A.editItem = (el) => SQ.openItemModal({ id: el.dataset.id });

  A.toggleDone = (el) => {
    const f = SQ.findItem(el.dataset.id);
    if (!f) return;
    const willDone = !f.it.done;
    SQ.commit((S) => {
      const it = SQ.findItem(el.dataset.id).it;
      if (willDone && S.timer && S.timer.id === it.id) {
        it.spentMin = (it.spentMin || 0) + SQ.liveTimerMin(it);
        S.timer = null;
      }
      it.done = willDone;
      if (willDone) (it.milestones || []).forEach((s) => (s.done = true));
    });
    if (willDone && f.it.kind === 'task') SQ.celebrate(`"${f.it.title}" 클리어!`);
  };

  A.toggleExpand = (el) => {
    const id = el.dataset.id;
    ui.expanded[id] = !ui.expanded[id];
    SQ.render();
  };

  A.timer = (el) => {
    const id = el.dataset.id;
    const T = SQ.state.timer;
    if (T && T.id === id) {
      const f = SQ.findItem(id);
      const add = SQ.liveTimerMin(f.it);
      SQ.commit((S) => {
        SQ.findItem(id).it.spentMin = (f.it.spentMin || 0) + add;
        S.timer = null;
      }, { toast: `집중 시간 ${SQ.dur(add)} 기록했어요` });
    } else {
      SQ.commit((S) => {
        if (T) {
          const prev = SQ.findItem(T.id);
          if (prev) prev.it.spentMin = (prev.it.spentMin || 0) + SQ.liveTimerMin(prev.it);
        }
        S.timer = { id, startedAt: Date.now() };
      }, { toast: '집중 타이머 시작! 끝나면 ⏸ 를 눌러요' });
    }
  };

  A.moreItem = (el) => {
    const id = el.dataset.id;
    const f = SQ.findItem(id);
    SQ.menu(el, [
      { label: '수정', icon: 'pencil', run: () => SQ.openItemModal({ id }) },
      { label: '다른 날로 복사', icon: 'copy', run: () => moveCopyModal(id, false) },
      { label: '다른 날로 옮기기', icon: 'arrowR', run: () => moveCopyModal(id, true) },
      f && f.it.done
        ? { label: '완료 취소', icon: 'repeat', run: () => A.toggleDone({ dataset: { id } }) }
        : { label: '클리어로 표시', icon: 'check', run: () => A.toggleDone({ dataset: { id } }) },
      '-',
      { label: '삭제', icon: 'trash', danger: true, run: () => SQ.deleteItem(id) },
    ]);
  };

  function moveCopyModal(id, move) {
    const f = SQ.findItem(id);
    SQ.modal.open({
      title: move ? '다른 날로 옮기기' : '다른 날로 복사',
      sub: f.it.title,
      submit: move ? '옮기기' : '복사',
      body: `<label class="field"><span>날짜</span><input class="input" type="date" name="date" value="${SQ.addDays(f.k, 1)}"></label>
             <div class="quick-dur">${[1, 2, 7].map((n) => `<button type="button" class="pill" data-add="${n}">${n === 7 ? '다음 주' : n === 1 ? '다음 날' : '모레'}</button>`).join('')}</div>`,
      onOpen(form) {
        form.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => (form.date.value = SQ.addDays(f.k, +b.dataset.add))));
      },
      onSubmit(d) {
        if (!d.date) return '날짜를 골라 주세요';
        SQ.commit((S) => {
          const cur = SQ.findItem(id);
          if (move) {
            S.schedules[cur.k] = S.schedules[cur.k].filter((x) => x.id !== id);
            (S.schedules[d.date] = S.schedules[d.date] || []).push(cur.it);
          } else {
            (S.schedules[d.date] = S.schedules[d.date] || []).push(
              Object.assign({}, cur.it, { id: SQ.uid(), done: false, spentMin: 0, milestones: (cur.it.milestones || []).map((s) => Object.assign({}, s, { id: SQ.uid(), done: false })), qs: (cur.it.qs || []).map((q) => Object.assign({}, q, { a: '' })) })
            );
          }
        }, { toast: `${SQ.longDate(d.date)}로 ${move ? '옮겼어요' : '복사했어요'}` });
      },
    });
  }

  A.copyFrom = (el) => {
    const n = (SQ.state.schedules[el.dataset.from] || []).length;
    SQ.commit((S) => copyItems(el.dataset.from, el.dataset.k, S), { toast: `일정 ${n}개를 가져왔어요` });
  };

  A.editTimetable = (el) => {
    const k = el.dataset.k;
    const prev = SQ.addDays(k, -7);
    const n = (SQ.state.schedules[k] || []).length;
    const pn = (SQ.state.schedules[prev] || []).length;
    SQ.modal.open({
      title: '시간표 수정',
      sub: SQ.longDate(k),
      submit: '적용',
      body: `
        <div class="opt-list">
          <label class="opt"><input type="radio" name="op" value="import" ${pn ? 'checked' : 'disabled'}><span><b>지난주 ${SQ.DOW[SQ.dow(k)]}요일 시간표 가져오기</b><small>${pn ? `${SQ.md(prev)}의 일정 ${pn}개를 이 날에 더해요` : '지난주 같은 요일에 일정이 없어요'}</small></span></label>
          <label class="opt"><input type="radio" name="op" value="copy" ${n ? (pn ? '' : 'checked') : 'disabled'}><span><b>이 날 시간표를 다른 날로 복사</b><small>복사할 날짜를 골라요</small></span></label>
          <label class="field indent"><span>복사할 날짜</span><input class="input" type="date" name="to" value="${SQ.addDays(k, 1)}"></label>
          <label class="opt"><input type="radio" name="op" value="weekdays" ${n ? '' : 'disabled'}><span><b>이번 주 남은 평일에 똑같이 복사</b><small>월–금 중 이 날 이후, 비어 있는 날에만 넣어요</small></span></label>
          <label class="opt"><input type="radio" name="op" value="shift" ${n ? '' : 'disabled'}><span><b>전체 시간 밀기/당기기</b><small>모든 일정을 같은 만큼 옮겨요</small></span></label>
          <label class="field indent"><span>몇 분</span><select class="input" name="shift">${[-60, -30, -15, 15, 30, 60, 90, 120].map((m) => `<option value="${m}" ${m === 30 ? 'selected' : ''}>${m > 0 ? '+' : ''}${m}분</option>`).join('')}</select></label>
          <label class="opt danger"><input type="radio" name="op" value="clear" ${n ? '' : 'disabled'}><span><b>이 날 일정 모두 지우기</b><small>${n}개 일정이 지워져요 (되돌리기 가능)</small></span></label>
        </div>`,
      onSubmit(d) {
        if (!d.op) return '할 작업을 골라 주세요';
        if (d.op === 'import') SQ.commit((S) => copyItems(prev, k, S), { toast: `일정 ${pn}개를 가져왔어요` });
        else if (d.op === 'copy') {
          if (!d.to || d.to === k) return '다른 날짜를 골라 주세요';
          SQ.commit((S) => copyItems(k, d.to, S), { toast: `${SQ.longDate(d.to)}에 복사했어요` });
        } else if (d.op === 'weekdays') {
          const ws = SQ.weekStart(k);
          let c = 0;
          SQ.commit((S) => {
            [0, 1, 2, 3, 4].map((i) => SQ.addDays(ws, i)).filter((x) => x > k && !(S.schedules[x] || []).length).forEach((x) => {
              copyItems(k, x, S);
              c++;
            });
          }, { render: true });
          SQ.toast(c ? `평일 ${c}일에 복사했어요` : '복사할 빈 평일이 없어요');
        } else if (d.op === 'shift') {
          const m = +d.shift;
          const items = SQ.state.schedules[k] || [];
          if (items.some((x) => SQ.toMin(x.start) + m < 0 || SQ.toMin(x.end) + m > 1439)) return '하루 범위를 벗어나는 일정이 있어요';
          SQ.commit(() => items.forEach((x) => {
            x.start = SQ.fromMin(SQ.toMin(x.start) + m);
            x.end = SQ.fromMin(SQ.toMin(x.end) + m);
          }), { undo: `일정을 ${Math.abs(m)}분 ${m > 0 ? '밀었어요' : '당겼어요'}` });
        } else if (d.op === 'clear') SQ.commit((S) => (S.schedules[k] = []), { undo: '이 날 일정을 모두 지웠어요' });
      },
    });
  };

  A.editWeekGoal = (el) => {
    const ws = el.dataset.ws;
    const g = SQ.state.weekGoals[ws] || {};
    SQ.modal.open({
      title: '이번 주 목표',
      sub: `${SQ.weekLabel(ws)} · ${SQ.weekRange(ws)}`,
      body: `<label class="field"><span>한 주 동안 이루고 싶은 것</span><input class="input" name="title" maxlength="40" value="${esc(g.title || '')}" placeholder="예: 작은 우주 관측기지 만들기"></label>`,
      onDelete: g.title ? () => { SQ.modal.close(); SQ.commit((S) => delete S.weekGoals[ws], { undo: '이번 주 목표를 지웠어요' }); } : null,
      onSubmit(d) {
        const title = d.title.trim();
        if (!title) return '목표를 적어 주세요';
        SQ.commit((S) => (S.weekGoals[ws] = { title }), { toast: '이번 주 목표를 정했어요' });
      },
    });
  };

  A.editDayGoal = (el) => {
    const k = el.dataset.k;
    const g = SQ.state.dayGoals[k] || {};
    SQ.modal.open({
      title: k === SQ.today() ? '오늘의 목표' : '이 날의 목표',
      sub: SQ.longDate(k),
      body: `<label class="field"><span>오늘 꼭 끝낼 한 가지</span><input class="input" name="title" maxlength="40" value="${esc(g.title || '')}" placeholder="예: UI 배치 끝내기"></label>`,
      onDelete: g.title ? () => { SQ.modal.close(); SQ.commit((S) => delete S.dayGoals[k], { undo: '목표를 지웠어요' }); } : null,
      onSubmit(d) {
        const title = d.title.trim();
        if (!title) return '목표를 적어 주세요';
        SQ.commit((S) => (S.dayGoals[k] = { title, done: !!g.done }));
      },
    });
  };

  A.clearDayGoal = (el) => {
    const k = el.dataset.k;
    const g = SQ.state.dayGoals[k];
    const now = !g.done;
    SQ.commit((S) => (S.dayGoals[k].done = now));
    if (now) SQ.celebrate('오늘의 목표 클리어! 정말 잘했어요');
  };

  A.openLecture = (el) => {
    const l = SQ.state.lectures.find((x) => x.id === el.dataset.lid);
    if (!l) return SQ.toast('연결된 강의 노트를 찾을 수 없어요');
    ui.courseSel = l.courseId;
    ui.lecSel = l.id;
    SQ.go('lectures');
  };

  /* little celebration */
  SQ.celebrate = function (msg) {
    SQ.toast(msg);
    const root = document.getElementById('fx-root');
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#e0668b', '#f0a050', '#6f9be8', '#9d7ce3', '#4fae74', '#e3b23c'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('i');
      p.className = 'confetti';
      p.style.left = 30 + Math.random() * 40 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() - 0.5) * 60 + 'vw');
      p.style.setProperty('--r', Math.random() * 720 + 'deg');
      p.style.animationDelay = Math.random() * 0.15 + 's';
      root.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  };
})();
