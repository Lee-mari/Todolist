/* Study Quest — 설정 */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

  SQ.views.settings = function () {
    const S = SQ.state;
    const used = (id) =>
      Object.values(S.schedules).reduce((a, arr) => a + arr.filter((i) => i.subjectId === id).length, 0) + S.board.filter((c) => c.subjectId === id).length;
    let bytes = 0;
    try {
      bytes = (localStorage.getItem('studyquest.v1') || '').length * 2;
    } catch (e) {}
    return `
      ${SQ.pageHead('', 'Settings', '', '나에게 맞게 바꾸기')}
      <div class="rule"></div>
      <div class="set-grid">
        ${SQ.syncSettings ? SQ.syncSettings() : ''}
        <section class="card set">
          <h3>${icon('user', 18)} 프로필</h3>
          <label class="field"><span>이름 <em>오늘 화면 인사말에 쓰여요</em></span>
            <div class="row"><input class="input" id="set-name" maxlength="20" value="${esc(S.profile.name)}" placeholder="이름"><button class="btn line" data-act="saveName">저장</button></div>
          </label>
        </section>

        <section class="card set">
          <h3>${icon('moon', 18)} 화면</h3>
          <div class="seg-radio st3" role="radiogroup" aria-label="테마">
            ${[['system', '시스템'], ['light', '라이트'], ['dark', '다크']].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}" data-act="setTheme" ${S.settings.theme === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
          </div>
          <label class="field"><span>보드 ‘하는 중’ 최대 개수 <em>너무 많이 벌이지 않게</em></span>
            <select class="input" id="set-limit" data-change="limit">${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `<option ${n === S.settings.doingLimit ? 'selected' : ''}>${n}</option>`).join('')}</select>
          </label>
        </section>

        <section class="card set span2">
          <div class="sec-h"><h3>${icon('book', 18)} 과목 관리</h3><button class="btn sm primary" data-act="addSubject">${icon('plus', 15)} 과목 추가</button></div>
          <p class="muted-t">과목 색과 아이콘은 시간표, 보드, 기록 화면에 모두 쓰여요.</p>
          <div class="subj-list">
            ${
              S.subjects
                .map(
                  (s) => `<button class="subj-row" style="${SQ.cvar(s.color)}" data-act="editSubject" data-id="${s.id}">
                    <span class="subj-ic">${icon(s.icon, 17)}</span><b>${esc(s.name)}</b><small>${used(s.id)}개에서 사용</small><span class="sp"></span>${icon('pencil', 15)}
                  </button>`
                )
                .join('') || '<p class="muted-t">아직 과목이 없어요.</p>'
            }
          </div>
        </section>

        <section class="card set span2">
          <h3>${icon('database', 18)} 데이터</h3>
          <p class="muted-t">모든 기록은 이 브라우저에만 저장돼요 (현재 ${(bytes / 1024).toFixed(1)}KB). 다른 기기로 옮기거나 백업하려면 내보내기를 써 주세요.</p>
          <div class="row wrap">
            <button class="btn line" data-act="exportData">${icon('download', 16)} 백업 파일 내보내기</button>
            <label class="btn line file">${icon('upload', 16)} 백업 불러오기<input type="file" accept="application/json,.json" id="import-file" data-change="import" hidden></label>
            <button class="btn line" data-act="loadSample">${icon('sparkle', 16)} 예시 데이터로 채우기</button>
            <button class="btn ghost danger" data-act="resetAll">${icon('trash', 16)} 전부 지우고 새로 시작</button>
          </div>
        </section>
      </div>
      <p class="foot-note">Study Quest · 쪼개서 하나씩 클리어하는 공부 스케줄러</p>`;
  };

  A.saveName = () => {
    const v = document.getElementById('set-name').value.trim();
    SQ.commit((S) => (S.profile.name = v), { toast: '이름을 저장했어요' });
  };
  A.setTheme = (el) => {
    SQ.state.settings.theme = el.value;
    SQ.save();
    SQ.applyTheme();
  };
  SQ.changeHandlers = {
    limit(el) {
      SQ.commit((S) => (S.settings.doingLimit = +el.value), { toast: `하는 중은 최대 ${el.value}개까지` });
    },
    import(el) {
      const f = el.files && el.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async () => {
        let data;
        try {
          data = JSON.parse(r.result);
          if (!data || typeof data !== 'object' || !Array.isArray(data.subjects) || typeof data.schedules !== 'object') throw 0;
        } catch (e) {
          SQ.toast('Study Quest 백업 파일이 아니에요');
          return;
        }
        const ok = await SQ.confirm('지금 데이터를 백업 파일 내용으로 바꿀까요? 현재 데이터는 사라져요.', { ok: '불러오기', danger: true });
        if (!ok) return;
        SQ.state = Object.assign(SQ.emptyState(), data);
        SQ.state.settings = Object.assign(SQ.emptyState().settings, data.settings);
        SQ.save();
        SQ.applyTheme();
        SQ.render();
        SQ.toast('백업을 불러왔어요');
      };
      r.readAsText(f);
      el.value = '';
    },
  };
  A.exportData = () => {
    const blob = new Blob([JSON.stringify(SQ.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `studyquest-backup-${SQ.today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    SQ.toast('백업 파일을 내보냈어요');
  };
  A.loadSample = async () => {
    const ok = await SQ.confirm('지금 데이터를 예시 데이터로 바꿀까요? 되돌리기로 복구할 수 있어요.', { ok: '예시로 채우기' });
    if (!ok) return;
    SQ.commit((S) => {
      const theme = S.settings.theme;
      Object.keys(S).forEach((k) => delete S[k]);
      Object.assign(S, SQ.sampleState());
      S.settings.theme = theme;
    }, { undo: '예시 데이터로 채웠어요' });
  };
  A.resetAll = async () => {
    const ok = await SQ.confirm('모든 일정, 카드, 노트, 기록을 지울까요? 바로 아래 알림의 되돌리기로만 복구할 수 있어요.', { ok: '전부 지우기', danger: true });
    if (!ok) return;
    SQ.commit((S) => {
      const theme = S.settings.theme;
      Object.keys(S).forEach((k) => delete S[k]);
      Object.assign(S, SQ.emptyState());
      S.settings.theme = theme;
      S.subjects = [{ id: SQ.uid(), name: '공부', color: 'pink', icon: 'book' }];
    }, { undo: '전부 지웠어요' });
  };
})();
