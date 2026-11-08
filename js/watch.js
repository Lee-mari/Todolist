/* Study Quest — 영상 진도 (어디까지 봤는지, 다음에 뭘 볼지) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const ui = SQ.ui;
  const A = SQ.actions;

  const STATUS = { queue: '볼 예정', watching: '보는 중', done: '다 봄' };

  /* ---------- time & link helpers ---------- */
  // "1:02:03" · "32:10" · "32" (분) · "1시간 5분 30초" → seconds
  SQ.parseTime = function (s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return null;
    const ko = s.match(/^(?:(\d+)\s*시간)?\s*(?:(\d+)\s*분)?\s*(?:(\d+)\s*초)?$/);
    if (ko && (ko[1] || ko[2] || ko[3])) return (+ko[1] || 0) * 3600 + (+ko[2] || 0) * 60 + (+ko[3] || 0);
    if (/^\d+$/.test(s)) return +s * 60;
    const p = s.split(/[:：.]/).map((x) => x.trim());
    if (p.length > 3 || p.some((x) => !/^\d+$/.test(x))) return null;
    return p.reduce((a, x) => a * 60 + +x, 0);
  };
  SQ.fmtTime = function (sec) {
    if (sec == null || isNaN(sec)) return '';
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${SQ.pad(m)}:${SQ.pad(s)}` : `${m}:${SQ.pad(s)}`;
  };

  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    try {
      const x = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : 'https://' + u);
      return x.protocol === 'http:' || x.protocol === 'https:' ? x.href : '';
    } catch (e) {
      return '';
    }
  }
  function ytId(u) {
    try {
      const x = new URL(u);
      const h = x.hostname.replace(/^www\.|^m\./, '');
      if (h === 'youtu.be') return x.pathname.slice(1).split('/')[0] || null;
      if (h.endsWith('youtube.com')) {
        if (x.searchParams.get('v')) return x.searchParams.get('v');
        const m = x.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/);
        if (m) return m[1];
      }
    } catch (e) {}
    return null;
  }
  function platform(u) {
    if (!u) return '링크 없음';
    try {
      const h = new URL(u).hostname.replace(/^www\.|^m\./, '');
      const map = [
        [/youtu\.?be/, 'YouTube'], [/inflearn/, '인프런'], [/udemy/, 'Udemy'], [/coursera/, 'Coursera'],
        [/class101/, '클래스101'], [/fastcampus/, '패스트캠퍼스'], [/knou/, '방통대'], [/nomadcoders/, '노마드코더'],
        [/chzzk|afreeca|sooplive/, '라이브'], [/vimeo/, 'Vimeo'], [/kmooc/, 'K-MOOC'], [/ebs/, 'EBS'],
      ];
      const f = map.find(([r]) => r.test(h));
      return f ? f[1] : h;
    } catch (e) {
      return '링크';
    }
  }
  function resumeUrl(v) {
    if (!v.url) return '';
    if (!ytId(v.url) || !v.posSec || v.status === 'done') return v.url;
    try {
      const x = new URL(v.url);
      x.searchParams.set('t', Math.floor(v.posSec) + 's');
      return x.href;
    } catch (e) {
      return v.url;
    }
  }
  SQ.safeUrl = safeUrl;
  SQ.ytId = ytId;
  SQ.platformOf = platform;
  SQ.resumeUrl = resumeUrl;

  const pct = (v) => (v.status === 'done' ? 100 : v.lengthSec && v.posSec ? Math.min(100, Math.round((v.posSec / v.lengthSec) * 100)) : 0);

  const videos = () => SQ.state.videos || (SQ.state.videos = []);
  const byId = (id) => videos().find((v) => v.id === id);

  function thumb(v, big) {
    const id = v.url && ytId(v.url);
    const s = SQ.subj(v.subjectId);
    const p = pct(v);
    const inner = id
      ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(id)}/${big ? 'hqdefault' : 'mqdefault'}.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
      : '';
    const time = v.status === 'done' ? '다 봄' : v.posSec ? SQ.fmtTime(v.posSec) : v.lengthSec ? SQ.fmtTime(v.lengthSec) : '';
    const body = `
      <span class="th-ph" style="${SQ.cvar(s.color)}">${icon('video', big ? 34 : 24)}<small>${esc(platform(v.url))}</small></span>
      ${inner}
      <span class="th-play">${icon('play', big ? 22 : 16)}</span>
      ${time ? `<span class="th-time">${time}</span>` : ''}
      ${p && v.status !== 'done' ? `<span class="th-prog"><i style="width:${p}%"></i></span>` : ''}`;
    const href = resumeUrl(v);
    return href
      ? `<a class="vthumb ${big ? 'big' : ''}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(v.title)} ${v.posSec && v.status !== 'done' ? SQ.fmtTime(v.posSec) + '부터 ' : ''}열기" data-act="openedLink" data-id="${v.id}">${body}</a>`
      : `<span class="vthumb ${big ? 'big' : ''} nolink">${body}</span>`;
  }

  function nextLine(v) {
    const n = v.nextId && byId(v.nextId);
    if (!v.nextNote && !n) return '';
    return `<p class="vnext">${icon('arrowR', 14)} <span>다음: ${n ? `<b>${esc(n.title)}</b>` : ''}${n && v.nextNote ? ' · ' : ''}${esc(v.nextNote || '')}</span></p>`;
  }

  function stopLine(v) {
    if (v.status === 'done') return `<p class="vstop done">${icon('check', 14)} 다 봤어요${v.doneAt ? ' · ' + SQ.md(v.doneAt) : ''}</p>`;
    if (v.posSec) return `<p class="vstop"><b>${SQ.fmtTime(v.posSec)}</b>${v.lengthSec ? `<span class="muted-t"> / ${SQ.fmtTime(v.lengthSec)}</span>` : ''}에서 멈춤${v.part ? ` · ${esc(v.part)}` : ''}</p>`;
    return `<p class="vstop muted">아직 시작 전이에요</p>`;
  }

  function vcard(v) {
    const s = SQ.subj(v.subjectId);
    const text = [v.title, v.series, v.part, v.goal, v.nextNote, s.name, platform(v.url)].join(' ').toLowerCase();
    return `
    <article class="vcard st-${v.status}" style="${SQ.cvar(s.color)}" data-text="${esc(text)}" id="v-${v.id}">
      ${thumb(v)}
      <div class="vbody" data-act="openVideo" data-id="${v.id}" tabindex="0" role="button" aria-label="${esc(v.title)} 자세히">
        <div class="vmeta">${v.subjectId ? `<span class="tag">${esc(s.name)}</span>` : ''}<span class="vplat">${esc(platform(v.url))}${v.series ? ' · ' + esc(v.series) : ''}</span></div>
        <h3>${esc(v.title)}</h3>
        ${v.goal ? `<p class="vgoal">${icon('target', 14)} ${esc(v.goal)}</p>` : ''}
        ${stopLine(v)}
        ${v.lengthSec && v.status === 'watching' ? `<span class="bar"><i style="width:${pct(v)}%"></i></span>` : ''}
        ${nextLine(v)}
      </div>
      <div class="vact">
        ${v.status !== 'done' ? `<button class="btn sm soft" data-act="logStop" data-id="${v.id}">${icon('flag', 15)} ${v.status === 'queue' ? '보기 시작' : '멈춘 곳 기록'}</button>` : `<button class="btn sm line" data-act="rewatch" data-id="${v.id}">${icon('repeat', 15)} 다시 보기</button>`}
        <button class="icon-btn" data-act="videoMore" data-id="${v.id}" aria-label="더 보기">${icon('more', 18)}</button>
      </div>
    </article>`;
  }

  function resumeHero(v) {
    const s = SQ.subj(v.subjectId);
    const href = resumeUrl(v);
    const p = pct(v);
    const lastLog = (v.logs || [])[v.logs.length - 1];
    return `
    <section class="resume" style="${SQ.cvar(s.color)}">
      ${thumb(v, true)}
      <div class="resume-info">
        <p class="resume-k">${icon('play', 13)} 이어 보기 <span>· ${esc(platform(v.url))}${v.series ? ' · ' + esc(v.series) : ''}</span></p>
        <h2>${esc(v.title)}</h2>
        <p class="resume-stop">${v.posSec ? `<b>${SQ.fmtTime(v.posSec)}</b>에서 멈췄어요` : '처음부터 보면 돼요'}${v.part ? `<span> · ${esc(v.part)}</span>` : ''}</p>
        ${lastLog && lastLog.note ? `<p class="resume-note">${icon('pen', 14)} ${esc(lastLog.note)}</p>` : ''}
        ${v.lengthSec ? `<div class="resume-prog"><span class="bar"><i style="width:${p}%"></i></span><small>${SQ.fmtTime(v.posSec || 0)} / ${SQ.fmtTime(v.lengthSec)} · ${p}%</small></div>` : ''}
        ${nextLine(v)}
        <div class="resume-btns">
          ${href ? `<a class="btn primary" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-act="openedLink" data-id="${v.id}">${icon('play', 15)} ${v.posSec && ytId(v.url) ? SQ.fmtTime(v.posSec) + '부터 이어서 보기' : '영상 열기'}</a>` : ''}
          <button class="btn line" data-act="logStop" data-id="${v.id}">${icon('flag', 15)} 멈춘 곳 기록</button>
          <button class="btn ghost" data-act="openVideo" data-id="${v.id}">자세히</button>
        </div>
      </div>
    </section>`;
  }

  SQ.resumeCandidate = () =>
    videos()
      .filter((v) => v.status === 'watching')
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

  SQ.views.watch = function () {
    const V = videos();
    const f = ui.watchF || 'active';
    const cnt = { watching: 0, queue: 0, done: 0 };
    V.forEach((v) => cnt[v.status]++);
    const ws = SQ.weekStart(SQ.today());
    const doneWeek = V.filter((v) => v.status === 'done' && v.doneAt >= ws).length;
    const hero = SQ.resumeCandidate();
    const order = { watching: 0, queue: 1, done: 2 };
    const list = V.filter((v) => (f === 'all' ? true : f === 'active' ? v.status !== 'done' : v.status === f)).sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        (a.status === 'queue' ? (a.order || 0) - (b.order || 0) : a.status === 'done' ? (b.doneAt || '').localeCompare(a.doneAt || '') : (b.updatedAt || 0) - (a.updatedAt || 0))
    );
    const chip = (id, label, n) => `<button class="fchip ${f === id ? 'on' : ''}" data-act="watchFilter" data-f="${id}" aria-pressed="${f === id}">${label}${n != null ? ` <span class="fc-n">${n}</span>` : ''}</button>`;

    if (!V.length) {
      return `
        ${SQ.pageHead('끊긴 곳에서 바로 이어 보기', 'Watch', `<button class="btn primary" data-act="addVideo">${icon('plus', 16)} 영상 추가</button>`)}
        <div class="empty">
          <div class="empty-ic">${icon('video', 26)}</div>
          <h3>보고 있는 강의 영상을 추가해 보세요</h3>
          <p>유튜브나 인강 링크를 넣고, 보다가 끊기면 몇 분 몇 초까지 봤는지와 어느 부분이었는지 적어 두세요. 다 보면 다음에 볼 영상과 할 일도 정리할 수 있어요.</p>
          <button class="btn primary" data-act="addVideo">${icon('plus', 16)} 첫 영상 추가</button>
        </div>`;
    }

    return `
      ${SQ.pageHead('끊긴 곳에서 바로 이어 보기', 'Watch', `<button class="btn primary" data-act="addVideo">${icon('plus', 16)} 영상 추가</button>`)}
      ${hero ? resumeHero(hero) : `<section class="resume empty-resume"><div class="resume-info"><p class="resume-k">${icon('play', 13)} 이어 보기</p><h2>지금 보는 중인 영상이 없어요</h2><p class="muted-t">볼 예정 목록에서 ‘보기 시작’을 누르면 여기에 떠요.</p></div></section>`}
      <div class="stats3 compact">
        <div class="stat"><small>보는 중</small><b>${cnt.watching}개</b></div>
        <div class="stat"><small>볼 예정</small><b>${cnt.queue}개</b></div>
        <div class="stat"><small>이번 주 다 본 영상</small><b>${doneWeek}개</b></div>
      </div>
      <div class="wtools">
        <div class="fchips" role="toolbar" aria-label="상태 필터">
          ${chip('active', '보는 중 · 볼 예정', cnt.watching + cnt.queue)}${chip('watching', '보는 중', cnt.watching)}${chip('queue', '볼 예정', cnt.queue)}${chip('done', '다 봄', cnt.done)}${chip('all', '전체', V.length)}
        </div>
        <label class="search">${icon('search', 16)}<input class="input sm" type="search" placeholder="제목, 부분, 메모 검색" data-key="watchSearch" id="watch-q" value="${esc(ui.watchQ || '')}" aria-label="영상 검색"></label>
      </div>
      <div class="vlist" id="vlist">${list.map(vcard).join('') || `<p class="col-empty">이 목록에는 영상이 없어요</p>`}</div>
      <p class="no-hit col-empty" hidden>검색 결과가 없어요</p>
      <p class="tip">${icon('bulb', 18)} 썸네일이나 ‘이어서 보기’를 누르면 유튜브는 멈춘 시간부터 바로 재생돼요. 시간은 <b>32:10</b>, <b>1:02:03</b>, <b>32</b>(분)처럼 적으면 돼요.</p>`;
  };

  SQ.after.watch = () => {
    if (ui.watchQ) filterList(ui.watchQ);
  };
  function filterList(q) {
    q = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll('#vlist .vcard').forEach((c) => {
      const hit = !q || c.dataset.text.includes(q);
      c.hidden = !hit;
      if (hit) n++;
    });
    const nh = document.querySelector('.no-hit');
    if (nh) nh.hidden = n > 0 || !document.querySelector('#vlist .vcard');
  }
  SQ.keyHandlers.watchSearch = (e, el) => {
    if (e.key === 'Escape') {
      el.value = '';
      ui.watchQ = '';
      filterList('');
    }
  };
  SQ.inputHandlers.watchSearch = (el) => {
    ui.watchQ = el.value;
    filterList(el.value);
  };

  /* ---------- modals ---------- */
  const queueOptions = (exceptId, sel) =>
    `<option value="">고르지 않음</option>` +
    videos()
      .filter((v) => v.id !== exceptId && v.status !== 'done')
      .map((v) => `<option value="${v.id}" ${v.id === sel ? 'selected' : ''}>${esc(v.title)}${v.status === 'watching' ? ' (보는 중)' : ''}</option>`)
      .join('');
  const seriesList = () => [...new Set(videos().map((v) => v.series).filter(Boolean))];

  function videoForm(v) {
    v = v || {};
    return `
      <label class="field"><span>영상 링크 <em>유튜브, 인강 주소 등</em></span><input class="input" name="url" inputmode="url" value="${esc(v.url || '')}" placeholder="https://www.youtube.com/watch?v=..."></label>
      <label class="field"><span>제목</span><input class="input" name="title" maxlength="80" value="${esc(v.title || '')}" placeholder="예: 자료구조 7강 · 트리"></label>
      <div class="grid2">
        <label class="field"><span>과목</span><select class="input" name="subjectId">${SQ.subjectOptions(v.subjectId || '')}</select></label>
        <label class="field"><span>시리즈 · 재생목록 <em>선택</em></span><input class="input" name="series" maxlength="40" list="series-list" value="${esc(v.series || '')}" placeholder="예: 언리얼 UI 강좌"><datalist id="series-list">${seriesList().map((s) => `<option value="${esc(s)}">`).join('')}</datalist></label>
      </div>
      <label class="field new-subj" hidden><span>새 과목 이름</span><input class="input" name="newSubject" maxlength="20"></label>
      <div class="grid2">
        <label class="field"><span>전체 길이 <em>선택 · 진도율 계산</em></span><input class="input" name="length" value="${v.lengthSec ? SQ.fmtTime(v.lengthSec) : ''}" placeholder="예: 1:05:00"></label>
        <label class="field"><span>상태</span><select class="input" name="status">${Object.keys(STATUS).map((k) => `<option value="${k}" ${k === (v.status || 'queue') ? 'selected' : ''}>${STATUS[k]}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>이 영상으로 무엇을 공부할까요? <em>선택</em></span><textarea class="input" name="goal" rows="2" maxlength="200" placeholder="예: 트리 순회 3가지 이해하고 코드로 따라 치기">${esc(v.goal || '')}</textarea></label>
      <div class="grid2">
        <label class="field"><span>다 보면 다음에 할 것 <em>선택</em></span><input class="input" name="nextNote" maxlength="120" value="${esc(v.nextNote || '')}" placeholder="예: 강의 노트 정리, 예제 풀기"></label>
        <label class="field"><span>다음에 볼 영상 <em>선택</em></span><select class="input" name="nextId">${queueOptions(v.id, v.nextId)}</select></label>
      </div>`;
  }
  function bindSubjectNew(form) {
    const sel = form.subjectId;
    sel.addEventListener('change', () => {
      form.querySelector('.new-subj').hidden = sel.value !== '__new';
      if (sel.value === '__new') form.newSubject.focus();
    });
  }
  function readForm(d, old) {
    const url = d.url.trim() ? safeUrl(d.url) : '';
    if (d.url.trim() && !url) return 'http(s)로 시작하는 올바른 링크를 넣어 주세요';
    const title = d.title.trim();
    if (!title) return '제목을 적어 주세요';
    let lengthSec = null;
    if (d.length.trim()) {
      lengthSec = SQ.parseTime(d.length);
      if (lengthSec == null || lengthSec <= 0) return '전체 길이는 1:05:00 이나 65(분)처럼 적어 주세요';
    }
    if (d.subjectId === '__new' && !d.newSubject.trim()) return '새 과목 이름을 적어 주세요';
    return { url, title, lengthSec, series: d.series.trim(), status: d.status, goal: d.goal.trim(), nextNote: d.nextNote.trim(), nextId: d.nextId || '' };
  }

  function addVideoModal(prefill) {
    SQ.modal.open({
      title: '영상 추가',
      sub: '링크를 붙여 넣고 제목만 적으면 돼요',
      wide: true,
      submit: '추가',
      body: videoForm(Object.assign({ status: 'queue' }, prefill || {})),
      onOpen: bindSubjectNew,
      onSubmit(d) {
        const r = readForm(d);
        if (typeof r === 'string') return r;
        let created;
        SQ.commit((S) => {
          const subjectId = SQ.resolveSubject(d);
          const q = (S.videos = S.videos || []).filter((x) => x.status === 'queue');
          created = Object.assign({ id: SQ.uid(), subjectId, posSec: 0, part: '', logs: [], createdAt: SQ.today(), updatedAt: Date.now(), doneAt: null, order: q.length }, r);
          if (created.status === 'done') {
            created.doneAt = SQ.today();
            created.posSec = created.lengthSec || 0;
          }
          S.videos.push(created);
          ui.watchF = created.status === 'done' ? 'done' : ui.watchF === 'done' ? 'active' : ui.watchF;
        }, { toast: '영상을 추가했어요' });
      },
    });
  }

  function editVideoModal(id) {
    const v = byId(id);
    if (!v) return;
    const logs = (v.logs || []).slice().reverse();
    SQ.modal.open({
      title: '영상 자세히',
      sub: `${platform(v.url)} · ${STATUS[v.status]}${v.createdAt ? ' · ' + SQ.md(v.createdAt) + ' 추가' : ''}`,
      wide: true,
      body: `
        ${videoForm(v)}
        <div class="cm-sec">
          <div class="cm-h"><b>${icon('flag', 15)} 멈춘 곳 기록</b><small>${logs.length}번</small></div>
          ${
            logs.length
              ? `<ol class="vlogs">${logs
                  .map(
                    (l) => `<li data-lid="${l.id}">
                      <span class="vl-time">${l.done ? '다 봄' : SQ.fmtTime(l.posSec)}</span>
                      <div><b>${esc(l.part || (l.done ? '끝까지 봤어요' : '부분 메모 없음'))}</b>${l.note ? `<p>${esc(l.note)}</p>` : ''}<small>${SQ.longDate(l.date)}</small></div>
                      <button type="button" class="icon-btn xs" data-vact="dellog" data-lid="${l.id}" aria-label="기록 삭제">${icon('x', 14)}</button>
                    </li>`
                  )
                  .join('')}</ol>`
              : '<p class="muted-t">아직 기록이 없어요. 보다가 멈추면 ‘멈춘 곳 기록’을 눌러요.</p>'
          }
          <button type="button" class="btn sm line" data-vact="log">${icon('flag', 14)} 멈춘 곳 기록하기</button>
        </div>`,
      onDelete: () => {
        SQ.modal.close();
        deleteVideo(id);
      },
      onOpen(form) {
        bindSubjectNew(form);
        form.addEventListener('click', (e) => {
          const b = e.target.closest('[data-vact]');
          if (!b) return;
          if (b.dataset.vact === 'dellog') {
            const cur = byId(id);
            cur.logs = cur.logs.filter((l) => l.id !== b.dataset.lid);
            const last = cur.logs[cur.logs.length - 1];
            if (cur.status !== 'done') {
              cur.posSec = last ? last.posSec : 0;
              cur.part = last ? last.part : '';
            }
            SQ.save();
            b.closest('li').remove();
            SQ.toast('기록을 지웠어요');
          } else if (b.dataset.vact === 'log') {
            SQ.modal.close();
            logStopModal(id);
          }
        });
      },
      onSubmit(d) {
        const r = readForm(d, v);
        if (typeof r === 'string') return r;
        SQ.commit((S) => {
          const cur = byId(id);
          const wasDone = cur.status === 'done';
          Object.assign(cur, r, { subjectId: SQ.resolveSubject(d), updatedAt: Date.now() });
          if (cur.status === 'done' && !wasDone) {
            cur.doneAt = SQ.today();
            if (cur.lengthSec) cur.posSec = cur.lengthSec;
          }
          if (cur.status !== 'done') cur.doneAt = null;
        }, { toast: '저장했어요' });
      },
    });
  }

  function logStopModal(id) {
    const v = byId(id);
    if (!v) return;
    const starting = v.status === 'queue';
    SQ.modal.open({
      title: starting ? '보기 시작' : '멈춘 곳 기록',
      sub: v.title,
      submit: '기록',
      body: `
        ${starting ? `<p class="muted-t">처음부터 보면 시간은 비워 두세요. 보다가 멈추면 다시 여기서 기록해요.</p>` : ''}
        <div class="grid-time">
          <label class="field"><span>어디까지 봤나요?</span><input class="input big-time" name="pos" value="${v.posSec ? SQ.fmtTime(v.posSec) : ''}" placeholder="32:10" inputmode="numeric" autofocus></label>
          <div class="quick-dur">${[1, 5, 10, 30].map((m) => `<button type="button" class="pill" data-plus="${m * 60}">+${m}분</button>`).join('')}</div>
        </div>
        <label class="field"><span>그 부분은 어떤 내용이었나요?</span><input class="input" name="part" maxlength="100" value="" placeholder="예: 원형 큐 구현 시작하는 부분"></label>
        <label class="field"><span>메모 <em>선택 · 헷갈린 점, 다시 볼 곳</em></span><textarea class="input" name="note" rows="2" maxlength="300"></textarea></label>
        <label class="check-row"><input type="checkbox" name="done" value="1"><span class="cb">${icon('check', 13)}</span><span>끝까지 다 봤어요</span></label>
        <div class="done-only">
          <label class="field"><span>다음에 할 것</span><input class="input" name="nextNote" maxlength="120" value="${esc(v.nextNote || '')}" placeholder="예: 강의 노트에 정리하기"></label>
          <label class="field"><span>다음에 볼 영상 <em>고르면 ‘보는 중’으로 바뀌어요</em></span><select class="input" name="nextId">${queueOptions(v.id, v.nextId)}</select></label>
        </div>`,
      onOpen(form) {
        const sync = () => (form.dataset.done = form.done.checked ? '1' : '');
        sync();
        form.done.addEventListener('change', sync);
        form.querySelectorAll('[data-plus]').forEach((b) =>
          b.addEventListener('click', () => {
            const cur = SQ.parseTime(form.pos.value) || 0;
            form.pos.value = SQ.fmtTime(cur + +b.dataset.plus);
          })
        );
      },
      onSubmit(d) {
        const done = !!d.done;
        let pos = d.pos.trim() ? SQ.parseTime(d.pos) : 0;
        if (pos == null) return '시간은 32:10, 1:02:03, 32(분)처럼 적어 주세요';
        if (v.lengthSec && pos > v.lengthSec) return `전체 길이(${SQ.fmtTime(v.lengthSec)})보다 길어요`;
        let nextTitle = '';
        SQ.commit((S) => {
          const cur = byId(id);
          const t = SQ.today();
          cur.logs = cur.logs || [];
          if (done && !pos && cur.lengthSec) pos = cur.lengthSec;
          if (pos || d.part.trim() || d.note.trim() || done) cur.logs.push({ id: SQ.uid(), date: t, posSec: pos, part: d.part.trim(), note: d.note.trim(), done });
          cur.posSec = pos;
          if (d.part.trim()) cur.part = d.part.trim();
          cur.updatedAt = Date.now();
          if (done) {
            cur.status = 'done';
            cur.doneAt = t;
            cur.nextNote = (d.nextNote || '').trim();
            cur.nextId = d.nextId || '';
            const n = cur.nextId && byId(cur.nextId);
            if (n && n.status !== 'done') {
              n.status = 'watching';
              n.updatedAt = Date.now() + 1;
              nextTitle = n.title;
            }
          } else cur.status = 'watching';
        });
        if (done) SQ.celebrate(nextTitle ? `다 봤어요! 다음은 “${nextTitle}”` : `“${v.title}” 다 봤어요!`);
        else SQ.toast(pos ? `${SQ.fmtTime(pos)}까지 기록했어요` : '보기 시작! 멈추면 다시 기록해요');
      },
    });
  }

  function deleteVideo(id) {
    SQ.commit((S) => {
      S.videos = S.videos.filter((v) => v.id !== id);
      S.videos.forEach((v) => {
        if (v.nextId === id) v.nextId = '';
      });
    }, { undo: '영상을 삭제했어요' });
  }

  function setStatus(id, st) {
    SQ.commit(() => {
      const v = byId(id);
      v.status = st;
      v.updatedAt = Date.now();
      if (st === 'done') {
        v.doneAt = SQ.today();
        if (v.lengthSec) v.posSec = v.lengthSec;
      } else v.doneAt = null;
      if (st === 'queue') v.order = videos().filter((x) => x.status === 'queue').length;
    }, { toast: `‘${STATUS[st]}’으로 옮겼어요` });
  }

  function moveQueue(id, dir) {
    const q = videos().filter((v) => v.status === 'queue').sort((a, b) => (a.order || 0) - (b.order || 0));
    const i = q.findIndex((v) => v.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= q.length) return;
    [q[i], q[j]] = [q[j], q[i]];
    SQ.commit(() => q.forEach((v, k) => (v.order = k)));
  }

  /* ---------- actions ---------- */
  A.addVideo = () => addVideoModal();
  A.openVideo = (el) => editVideoModal(el.dataset.id);
  A.logStop = (el) => logStopModal(el.dataset.id);
  A.watchFilter = (el) => {
    ui.watchF = el.dataset.f;
    SQ.render();
  };
  A.rewatch = (el) => {
    SQ.commit(() => {
      const v = byId(el.dataset.id);
      v.status = 'watching';
      v.posSec = 0;
      v.doneAt = null;
      v.updatedAt = Date.now();
    }, { toast: '다시 보기 시작! 처음부터 기록해요' });
  };
  // link clicks are real navigations; just remember it was opened recently
  A.openedLink = (el, e) => {
    const v = byId(el.dataset.id);
    if (v && v.status === 'queue') {
      v.status = 'watching';
      v.updatedAt = Date.now();
      SQ.save();
      setTimeout(SQ.render, 300);
    }
    window.open(el.href, '_blank', 'noopener');
  };
  A.videoMore = (el) => {
    const id = el.dataset.id;
    const v = byId(id);
    const items = [
      { label: '자세히 · 수정', icon: 'pencil', run: () => editVideoModal(id) },
      v.status !== 'done' ? { label: '멈춘 곳 기록', icon: 'flag', run: () => logStopModal(id) } : null,
      { label: '오늘 시간표에 넣기', icon: 'calendar', run: () => SQ.openItemModal({ k: SQ.today(), prefill: { title: v.title, subjectId: v.subjectId, desc: v.goal || (v.posSec ? `${SQ.fmtTime(v.posSec)}부터 이어 보기` : ''), links: v.url ? [{ name: v.title, url: resumeUrl(v) }] : [] } }) },
      v.url ? { label: '이어 보기 링크 복사', icon: 'link', run: () => copy(resumeUrl(v)) } : null,
      '-',
      ...Object.keys(STATUS).filter((k) => k !== v.status).map((k) => ({ label: `‘${STATUS[k]}’으로 옮기기`, icon: 'arrowR', run: () => setStatus(id, k) })),
      v.status === 'queue' ? { label: '순서 위로', icon: 'chevD', run: () => moveQueue(id, -1) } : null,
      v.status === 'queue' ? { label: '순서 아래로', icon: 'chevD', run: () => moveQueue(id, 1) } : null,
      '-',
      { label: '삭제', icon: 'trash', danger: true, run: () => deleteVideo(id) },
    ].filter(Boolean);
    SQ.menu(el, items);
  };
  function copy(text) {
    const done = () => SQ.toast('링크를 복사했어요');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => prompt('링크를 복사하세요', text));
    else prompt('링크를 복사하세요', text);
  }

  /* compact card for 오늘 */
  SQ.resumeMini = function () {
    const v = SQ.resumeCandidate();
    if (!v) return '';
    const href = resumeUrl(v);
    return `
      <section class="resume-mini" style="${SQ.cvar(SQ.subj(v.subjectId).color)}">
        <span class="rm-ic">${icon('video', 20)}</span>
        <div class="rm-t"><small>이어 보기</small><b>${esc(v.title)}</b><span>${v.posSec ? SQ.fmtTime(v.posSec) + '에서 멈춤' : '처음부터'}${v.part ? ' · ' + esc(v.part) : ''}</span></div>
        <div class="row">
          ${href ? `<a class="btn sm primary" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-act="openedLink" data-id="${v.id}">${icon('play', 13)} 이어서</a>` : ''}
          <button class="btn sm line" data-act="logStop" data-id="${v.id}">기록</button>
        </div>
      </section>`;
  };
})();
