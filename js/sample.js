/* Study Quest — 처음 실행할 때 보여 줄 예시 데이터 (오늘 날짜 기준으로 생성) */
(function () {
  'use strict';
  const SQ = window.SQ;

  SQ.sampleState = function () {
    const S = SQ.emptyState();
    const t = SQ.today();
    const ws = SQ.weekStart(t);
    const uid = SQ.uid;
    const sub = (text, done = false) => ({ id: uid(), text, done });

    S.subjects = [
      { id: 'unreal', name: '언리얼', color: 'pink', icon: 'layout' },
      { id: 'cpp', name: 'C++', color: 'blue', icon: 'code' },
      { id: 'knou', name: '방통대', color: 'orange', icon: 'headphones' },
      { id: 'bp', name: '블루프린트', color: 'purple', icon: 'node' },
      { id: 'mat', name: '머티리얼', color: 'teal', icon: 'drop' },
      { id: 'blender', name: '블렌더', color: 'coral', icon: 'box' },
      { id: 'light', name: '라이팅', color: 'yellow', icon: 'sun' },
      { id: 'eng', name: '영어', color: 'sky', icon: 'globe' },
      { id: 'jp', name: '일본어', color: 'violet', icon: 'globe' },
    ];

    /* ----- courses & lectures ----- */
    S.courses = [
      { id: 'c_ds', provider: '방통대', name: '자료구조', total: 15, color: 'orange' },
      { id: 'c_cpp', provider: '경일 수업', name: 'C++ 기초', total: 12, color: 'blue' },
      { id: 'c_ui', provider: '온라인 강의', name: '언리얼 UI 만들기', total: 20, color: 'pink' },
    ];
    const L = (courseId, no, title, done, extra = {}) =>
      Object.assign(
        {
          id: `l_${courseId}_${no}`, courseId, no, title, status: done ? 'done' : 'draft',
          summary: done ? `${title}의 핵심 개념을 예제로 정리했다.` : '', points: done ? [`${title} 개념`, '예제 코드 따라 치기', '실전에서 쓰는 곳'] : ['', '', ''],
          confusing: '', revisits: [], createdAt: SQ.addDays(t, -20 + no),
        },
        extra
      );
    ['자료구조 소개', '알고리즘 분석', '재귀', '배열', '연결 리스트'].forEach((x, i) => S.lectures.push(L('c_ds', i + 1, x, true)));
    S.lectures.push(
      L('c_ds', 6, '스택과 큐', false, {
        summary: '스택은 나중에 넣은 게 먼저 나오고(접시 쌓기), 큐는 먼저 넣은 게 먼저 나온다(줄 서기).',
        points: ['스택: push로 넣고 pop으로 뺀다. 맨 위만 만질 수 있다', '큐: 뒤로 넣고(enqueue) 앞에서 뺀다(dequeue)', '게임에서 쓰는 곳: 되돌리기(Undo)는 스택, 명령 대기열은 큐'],
      })
    );
    ['변수와 자료형', '조건문', '반복문', '함수', '배열과 문자열', '포인터', '참조'].forEach((x, i) => S.lectures.push(L('c_cpp', i + 1, x, true)));
    ['UMG 시작하기', '위젯 블루프린트', '캔버스 패널', '앵커와 정렬', '데이터 바인딩'].forEach((x, i) => S.lectures.push(L('c_ui', i + 1, x, i < 3)));

    /* ----- schedules ----- */
    const mk = (start, end, subjectId, title, desc, subs, done, extra = {}) =>
      Object.assign(
        { id: uid(), kind: 'task', start, end, subjectId, title, desc: desc || '', milestones: (subs || []).map((x) => sub(x, done)), done, spentMin: 0, lectureId: '', boardId: '' },
        extra
      );
    const brk = (start, end, done, activity = 'stretch', title = '스트레칭') => ({ id: uid(), kind: 'break', start, end, title, activity, memo: '', done: false, spentMin: 0 });

    const pool = [
      ['09:00', '10:30', 'cpp', 'C++ 클래스 복습', '생성자와 소멸자가 불리는 순서 정리하기', ['예제 따라 치기', '헷갈린 부분 메모']],
      ['10:45', '12:15', 'unreal', '언리얼 UI 위젯 만들기', '', ['위젯 블루프린트 만들기', '버튼 이벤트 연결']],
      ['14:00', '15:30', 'knou', '방통대 자료구조 강의', '강의 듣고 노트 정리', []],
      ['16:00', '17:00', 'bp', '블루프린트 연습', '', ['트리거 박스 배치', '문 여닫기']],
      ['19:00', '20:00', 'mat', '머티리얼 실험', '노멀맵 섞어 보기', []],
      ['21:00', '21:30', 'eng', '영어 쉐도잉', '', []],
    ];
    const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

    for (let w = -4; w <= 0; w++) {
      const wsw = SQ.addDays(ws, w * 7);
      SQ.weekDays(wsw).forEach((k, i) => {
        if (k === t) return;
        const isPast = k < t;
        const picks = [pool[i % 6], pool[(i + 2) % 6], pool[(i + 3) % 6]].sort((a, b) => a[0].localeCompare(b[0]));
        const items = picks.map((p, j) => {
          const done = isPast && hash(k + j) % 5 !== 0;
          const it = mk(p[0], p[1], p[2], p[3], p[4], p[5], done);
          if (isPast && !done && it.milestones.length) it.milestones[0].done = true;
          return it;
        });
        S.schedules[k] = items;
        // records for older past days (yesterday is left for the 하루 마감 퀘스트)
        if (isPast && k < SQ.addDays(t, -1)) {
          const studied = SQ.studiedOnItems(items);
          const skip = hash(k) % 13 === 0;
          S.records[k] = { minutes: skip ? 0 : Math.max(0, studied + ((hash(k) % 7) - 3) * 10), skipped: skip };
        }
      });
    }

    // today — like the design
    S.schedules[t] = [
      mk('09:00', '10:30', 'cpp', 'C++ 포인터 복습', '경일 수업 3강 복습. 포인터와 참조(&)가 어떻게 다른지 예제로 정리하기', ['포인터 선언 예제', '참조와 비교', '정리 노트 쓰기'], true),
      brk('10:30', '10:45', true),
      mk('10:45', '12:30', 'unreal', '관측기지 HUD 위젯 배치', '위젯 블루프린트로 산소 게이지, 미니맵 자리, 퀘스트 알림 칸을 화면에 배치하기', [], false, {
        boardId: 'b_hud',
        milestones: [
          { id: 'ms_1', text: '산소 게이지', detail: 'WBP_HUD에 프로그레스 바를 놓고 산소 값(0~1)을 바인딩해서 줄어드는 게 보이게', done: true },
          { id: 'ms_2', text: '미니맵 자리', detail: '오른쪽 위에 사이즈 박스로 빈 자리만 먼저 잡아 두기. 실제 미니맵은 다음 주', done: false },
          { id: 'ms_3', text: '퀘스트 알림', detail: '텍스트 블록 하나 + 페이드 인/아웃 애니메이션', done: false },
        ],
        qs: [
          { id: 'q1', q: '플레이어가 이 화면을 보고 어떤 기분이면 좋겠어?', a: '산소가 줄어드는 게 보여서 살짝 긴장되는 기분' },
          { id: 'q2', q: '5분 안에 할 수 있는 첫 행동은 뭐야?', a: 'WBP_HUD 열고 프로그레스 바 하나 드래그하기' },
        ],
        qAsk: true,
      }),
      brk('12:30', '13:30', false, 'meal', '점심 + 산책'),
      mk('14:00', '15:30', 'knou', '방통대 자료구조 6강', '스택과 큐. 듣고 나서 강의 노트 탭에 내 말로 정리하기', [], false, { lectureId: 'l_c_ds_6' }),
      mk('16:00', '17:00', 'bp', '블루프린트 연습', '관측기지 문 열고 닫기. 트리거 박스에 닿으면 타임라인 노드로 문 움직이기', ['트리거 박스 놓기', '타임라인 노드 연결'], false, {
        milestones: [
          { id: 'ms_4', text: '트리거 놓기', detail: '문 앞에 Box Trigger 놓고 OnActorBeginOverlap 이벤트 연결', done: false },
          { id: 'ms_5', text: '문 타임라인', detail: 'Timeline 노드로 1초 동안 문 위치를 위로 이동', done: false },
          { id: 'ms_6', text: '방 2 도착', done: false },
        ],
        qs: [
          { id: 'q3', q: '오늘 배운 것 중에 몇 번 이정표에 쓸 수 있어?', a: '' },
          { id: 'q4', q: '5분 안에 할 수 있는 첫 행동은 뭐야?', a: '' },
        ],
        qAsk: true,
      }),
    ];

    /* ----- goals ----- */
    S.weekGoals[ws] = { title: '작은 우주 관측기지 만들기' };
    S.weekGoals[SQ.addDays(ws, -7)] = { title: '인벤토리 UI 완성하기' };
    S.weekGoals[SQ.addDays(ws, -14)] = { title: 'C++ 클래스 정리' };
    S.weekGoals[SQ.addDays(ws, -21)] = { title: '레벨 블록아웃 1차' };
    S.dayGoals[t] = { title: 'UI 배치 끝내기', done: false };

    /* ----- board ----- */
    const B = (id, title, subjectId, status, o = {}) =>
      Object.assign({ id, title, subjectId, status, due: '', repeat: '', subtasks: [], counter: null, memo: '', createdAt: SQ.addDays(t, -6), startedAt: null, doneAt: null, order: 0 }, o);
    const nextTue = SQ.addDays(ws, 8);
    S.board = [
      B('b_ds7', '자료구조 7강 · 트리', 'knou', 'todo', { due: nextTue, order: 0 }),
      B('b_donut', '도넛 튜토리얼 따라 만들기', 'blender', 'todo', { order: 1, subtasks: ['모델링', '머티리얼', '라이팅', '렌더'].map((x) => sub(x)) }),
      B('b_lumen', '루멘으로 관측기지 실내 조명 잡기', 'light', 'todo', { order: 2 }),
      B('b_shadow', '쉐도잉 10분', 'eng', 'todo', { order: 3, repeat: 'daily' }),
      B('b_kata', '가타카나 외우기', 'jp', 'todo', { order: 4 }),
      B('b_hud', '관측기지 HUD 만들기', 'unreal', 'doing', { order: 0, startedAt: SQ.addDays(t, -1), subtasks: [sub('WBP_HUD 위젯 만들기', true), sub('캔버스 패널에 산소 게이지 놓기'), sub('앵커 맞추기')] }),
      B('b_water', '물 머티리얼 (굴절 + 물결)', 'mat', 'doing', { order: 1, startedAt: SQ.addDays(t, -2), subtasks: [sub('기본 반사', true), sub('굴절', true), sub('노멀맵 두 장 섞어서 물결 만들기'), sub('깊이 페이드'), sub('거품')] }),
      B('b_jlpt', 'JLPT N4 단어 200개', 'jp', 'doing', { order: 2, repeat: 'daily', startedAt: SQ.addDays(t, -10), counter: { cur: 120, total: 200 } }),
      B('b_ptr', 'C++ 포인터 복습', 'unreal', 'done', { order: 0, doneAt: t }),
      B('b_ds6', '자료구조 6강 · 스택과 큐', 'knou', 'done', { order: 1, doneAt: SQ.addDays(t, -2) }),
      B('b_eng30', '영어 단어 30일 챌린지', 'eng', 'done', { order: 2, doneAt: SQ.addDays(t, -4) }),
      B('b_block', '관측기지 블록아웃', 'unreal', 'done', { order: 3, doneAt: SQ.addDays(t, -5) }),
    ];
    S.board.find((c) => c.id === 'b_ptr').subjectId = 'cpp';
    S.board.filter((c) => c.status === 'done').forEach((c) => S.doneLog.push({ cardId: c.id, title: c.title, subjectId: c.subjectId, date: c.doneAt }));
    /* ----- videos (영상 진도) ----- */
    const yt = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    const V = (o) => Object.assign({ id: uid(), url: '', title: '', subjectId: '', series: '', lengthSec: null, posSec: 0, part: '', status: 'queue', goal: '', nextNote: '', nextId: '', logs: [], createdAt: SQ.addDays(t, -5), updatedAt: Date.now(), doneAt: null, order: 0 }, o);
    const vTree = V({ title: '자료구조 7강 · 트리', subjectId: 'knou', series: '방통대 자료구조', url: yt('자료구조 트리'), lengthSec: 3000, goal: '이진 트리 순회 3가지 이해하기', nextNote: '강의 노트 7강 정리', order: 0 });
    const vAnchor = V({ title: '언리얼 UMG 앵커 완벽 정리', subjectId: 'unreal', series: '언리얼 UI 강좌', url: yt('언리얼 UMG 앵커'), lengthSec: 1500, goal: '화면 크기 바뀌어도 HUD 안 깨지게', order: 1 });
    S.videos = [
      V({
        title: '자료구조 6강 · 스택과 큐', subjectId: 'knou', series: '방통대 자료구조', url: yt('자료구조 스택 큐'), status: 'watching',
        lengthSec: 3900, posSec: 1930, part: '원형 큐 구현 시작하는 부분', goal: '스택·큐 개념 잡고 원형 큐 코드 이해하기',
        nextNote: '강의 노트에 정리하기', nextId: vTree.id, updatedAt: Date.now(),
        logs: [
          { id: uid(), date: SQ.addDays(t, -1), posSec: 1210, part: '큐의 enqueue / dequeue', note: '', done: false },
          { id: uid(), date: t, posSec: 1930, part: '원형 큐 구현 시작하는 부분', note: '23:10 원형 큐 그림 다시 보기', done: false },
        ],
      }),
      V({
        title: '물 머티리얼 만들기 (굴절 + 물결)', subjectId: 'mat', series: '머티리얼 기초', url: yt('언리얼 물 머티리얼'), status: 'watching',
        lengthSec: 2280, posSec: 845, part: '노멀맵 두 장 섞는 부분', updatedAt: Date.now() - 86400000,
        logs: [{ id: uid(), date: SQ.addDays(t, -2), posSec: 845, part: '노멀맵 두 장 섞는 부분', note: '', done: false }],
      }),
      vTree,
      vAnchor,
      V({ title: '블렌더 도넛 튜토리얼 1편', subjectId: 'blender', url: yt('blender donut tutorial'), lengthSec: 1320, goal: '도넛 모델링 따라 하기', order: 2 }),
      V({
        title: 'C++ 포인터와 참조 차이', subjectId: 'cpp', url: yt('C++ 포인터 참조 차이'), status: 'done', lengthSec: 1080, posSec: 1080,
        doneAt: SQ.addDays(t, -1), nextNote: '예제 코드로 복습', logs: [{ id: uid(), date: SQ.addDays(t, -1), posSec: 1080, part: '', note: '', done: true }],
      }),
    ];

    for (let i = 0; i < 27; i++) S.doneLog.unshift({ cardId: '', title: '지난 공부', subjectId: S.subjects[i % 9].id, date: SQ.addDays(t, -9 - i * 2) });
    return S;
  };

  SQ.studiedOnItems = (items) => items.reduce((a, it) => a + (it.kind === 'task' && it.done ? SQ.dur2(it) : 0), 0);
})();
