/* Study Quest — 미리 짜 둔 주간 시간표 (버튼 한 번으로 넣기) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

  /* ---------- tiny builders ---------- */
  // T(시작, 끝, 과목, 제목, { desc, ms: [[이름, 설명]], qs: [질문], links: [[이름, url]] })
  const T = (start, end, subjectId, title, o = {}) => ({ kind: 'task', start, end, subjectId, title, ...o });
  // R(시작, 끝, 활동, 제목)  활동: free walk stretch nap tea meal music game
  const R = (start, end, activity, title) => ({ kind: 'break', start, end, activity, title });
  const YT = (id) => `https://www.youtube.com/watch?v=${id}`;
  const YB = (id) => `https://youtu.be/${id}`;
  const NADO = 'https://www.inflearn.com/course/c-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B2%8C%EC%9E%84?cid=111762';

  /* ---------- 11월 3주차 · 📚 공부 주간 (월~수 쉼, 목~일) ---------- */
  // 스카 가는 날 아침: 구구단 → 아침 먹고 스카로 이동 (10:30 도착)
  const morning = () => [
    T('08:50', '09:00', 'review', '🔢 구구단', { desc: '아침 10분 몸풀기' }),
    R('09:00', '10:30', 'meal', '🍳 아침 · 🚶 스카로 이동'),
  ];
  // C언어 사이 짧은 휴식 10분 × 2
  const cBreaks = () => [R('11:45', '11:55', 'stretch', '☕ 휴식'), R('12:25', '12:35', 'free', '☕ 휴식')];
  const dinner = (start = '20:30', end = '22:00') => R(start, end, 'meal', '🍚 저녁');
  const webtoonRest = () => R('23:00', '00:00', 'game', '😌 웹툰 휴식 (공부 아님!)');
  const lang = (jp, start = '20:00', end = '20:30') =>
    T(start, end, jp ? 'jp' : 'eng', jp ? '🇯🇵 일본어' : '🇺🇸 영어', {
      desc: '집에서 30분. 스피킹 → 단어 → 필사 순서로 10분씩',
      ms: [['🗣️ 스피킹 10분'], ['📝 단어 10분'], ['✍️ 필사 10분']],
    });
  // 목·금 오후 뒷부분 (공부 주간): ☕ → 따라하기 40 → ☕ → 실습 기획 10 → 🧪 작은 실습 60 → ☕ → 📺 이어서 듣기 40 → 정리
  const tail = (subj, redo, plan, lab, more) => [
    R('16:15', '16:25', 'stretch', '☕ 휴식'),
    T('16:25', '17:05', subj, '🔁 따라하기 복습 (영상 끄고!)', { desc: redo }),
    R('17:05', '17:15', 'free', '☕ 휴식'),
    T('17:15', '17:25', subj, '🗒️ 실습 기획 10분', { desc: plan }),
    T('17:25', '18:25', subj, `🧪 작은 실습 · ${lab.title} (60분)`, { desc: lab.desc, ms: lab.ms }),
    R('18:25', '18:35', 'stretch', '☕ 휴식'),
    T('18:35', '19:15', subj, more.title || '📺 이어서 듣기 (노션 다음 순서)', { desc: more.desc, ms: more.ms, qs: more.qs, links: more.links }),
    T('19:15', '19:30', subj, '✅ 정리 · 저장', { desc: lab.wrap, ms: [['스크린샷·저장'], ['🤔 질문 1개 3줄 답', '오늘 🤔 질문 중 하나를 골라 3줄로 답 쓰기']] }),
    R('19:30', '20:00', 'walk', '🚶 귀가 · 쉬기'),
  ];
  const offDay = () => [];

  const W47 = {
    id: '2026-11-w3-v6', // 시간표가 바뀌면 v 숫자를 올려요 → 예전 버전을 넣은 사람에게도 배너가 다시 떠요
    family: '2026-11-w3',
    ws: '2026-11-16',
    name: '🎮 11월 3주차 공부 퀘스트 · 📚 공부 주간',
    goal: '📚 공부 주간 · 분야 2개 + 작은 실습',
    strip: [['😴 쉬는 날', 'gray'], ['😴 쉬는 날', 'gray'], ['😴 쉬는 날', 'gray'], ['🗺️ 레벨디자인', 'green'], ['🧊 블렌더', 'coral'], ['🔁 밀린 것 · 💡', 'orange'], ['📐 기획', 'pink']],
    subjects: [
      { id: 'clang', name: 'C언어', color: 'blue', icon: 'code' },
      { id: 'level', name: '레벨디자인', color: 'green', icon: 'layout' },
      { id: 'blender', name: '블렌더', color: 'coral', icon: 'box' },
      { id: 'light', name: '라이팅', color: 'orange', icon: 'sun' },
      { id: 'review', name: '복습', color: 'gray', icon: 'repeat' },
      { id: 'eng', name: '영어', color: 'sky', icon: 'globe' },
      { id: 'jp', name: '일본어', color: 'violet', icon: 'globe' },
      { id: 'toon', name: '웹툰 분석', color: 'pink', icon: 'pen' },
    ],
    board: {
      title: '📚 이번 주 클리어 기준 (일요일 체크)',
      subjectId: 'level',
      subtasks: ['실습 스크린샷 (길·언덕·기둥 · 미니 등대)', 'C 미니게임 2개 실행됨', '다음 주 미니 프로젝트 기획서 1장'],
      memo: '이번 주는 목·금·토·일 4일만! 분야 2개, 분야마다 작은 실습 1개씩.\n🧪 실습: 길+언덕+기둥 (목) · 미니 등대 (금) · 노을 하늘은 보너스 (토)\n🏮 다음 주 예고: 실습을 합치면 「노을 등대섬」! 다음 주에 라이팅·애니메이션·시네마틱을 더해서 완성해요.',
    },
    dayGoals: {
      '2026-11-16': '😴 쉬는 날 · 푹 쉬어요',
      '2026-11-17': '😴 쉬는 날 · 푹 쉬어요',
      '2026-11-18': '😴 쉬는 날 · 푹 쉬어요',
      '2026-11-19': '14시부터! 시선유도 · 블록아웃 + 길·언덕·기둥',
      '2026-11-20': '블렌더 첫걸음 + 미니 등대 모형',
      '2026-11-21': '밀린 것 끝내기 (없으면 노을 하늘)',
      '2026-11-22': '복습 + 「노을 등대섬」 기획서',
    },
    days: {
      '2026-11-16': offDay(),
      '2026-11-17': offDay(),
      '2026-11-18': offDay(),

      /* ===== 목 · 🗺️ 레벨디자인 (레벨 1: 섬 땅 고르기) · 14시 시작이라 짧게 ===== */
      '2026-11-19': [
        T('14:00', '14:10', 'clang', '🔁 C 기억 점검', { desc: '⏳ 14시까지는 개인 일정! 예전에 배운 switch · if를 백지에 써보기' }),
        T('14:10', '15:00', 'clang', '⌨️ C 1~9강 · 변수·입출력', {
          desc: '나도코딩 섹션 1~2 (약 45분 추정)',
          ms: [['환경설정 · Hello World'], ['정수·실수 변수 · 주석'], ['상수'], ['printf'], ['scanf']],
          qs: ['int와 float는 각각 어떤 숫자를 담을까? 나이는 어느 쪽?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        R('15:00', '15:10', 'stretch', '☕ 휴식'),
        T('15:10', '15:30', 'clang', '🎮 C 미니게임 · 등대지기 등록증', {
          desc: '이름 · 나이를 scanf로 받아 출력',
          ms: [['scanf로 이름·나이 받기'], ['등록증 모양 출력 · 저장', 'lighthouse_c 폴더에 저장'], ['🥇 보너스 · 바다 생물', '좋아하는 바다 생물도 받기']],
        }),
        R('15:30', '16:00', 'tea', '🍪 간식 30분'),
        T('16:00', '17:00', 'level', '📺 강의A · 시선유도 · 블록아웃 (38분)', {
          desc: '노션 레벨디자인 1→2→3번. 🤔 질문을 먼저 읽고 보기!',
          ms: [
            ['1. 시선유도 법칙 (9분)', '0:33 필드 유도 → 1:05 스스로 가고 싶게 → 2:09 크기 인력 → 2:41 목적 인력 → ⭐ 3:09 목표를 살짝 보여주기 → 5:35 엘든링 사례'],
            ['2. How to practice 앞 (16분)', '0:00 프로젝트 세팅 → 1:00 바닥 만들기 → ⭐ 3:00 장면 배치 → 6:00 캐릭터로 걸어보기 · ⏸️ 5분 쉬기'],
            ['2. How to practice 뒤', '8:00 메시 교체 → 9:00 레벨 확장 → 11:00 길 다듬기 → ⭐ 12:00 빛으로 길 안내'],
            ['3. Blocking Out 3가지 (13분)', '0:59 BSP 브러시 → 3:37 모델링 모드 → 10:16 모듈러 메시'],
          ],
          qs: [
            '목표를 처음부터 다 보여주면 어떨까? 살짝만 보여주려면 뭘로 가릴까?',
            '꾸미기 전에 캐릭터로 먼저 걸어보는 이유는 뭘까?',
            '세 방법 중 섬을 만들 때 뭐가 제일 빠를까?',
          ],
          links: [
            ['1. 야숨·엘든링 시선유도 법칙', YT('eO8CyODLbsM')],
            ['2. How to practice level design', YT('0AWSxaQSZZE')],
            ['3. 3 Methods for Blocking Out', YT('ZfalgxLtNyI')],
          ],
        }),
        R('17:00', '17:10', 'stretch', '☕ 휴식'),
        T('17:10', '18:00', 'level', '📺 강의B · Cube Grid 따라 하기 (13분)', {
          desc: '언리얼 같이 켜고 따라 하기',
          ms: [['첫 세팅', '0:20 플러그인 켜기 → ⏸️'], ['도구 기초', '⭐ 5:00 도구 기초 → ⏸️'], ['환경 만들기', '10:00 환경 만들기']],
          qs: ['Cube Grid로 언덕을 만들면 좋은 점 1개, 아쉬운 점 1개는?'],
          links: [['Cube Grid로 빠르게 프로토타입', YB('zo8VY8qU3PU')]],
        }),
        R('18:00', '18:10', 'free', '☕ 휴식'),
        T('18:10', '18:20', 'level', '🗒️ 실습 기획 10분', { desc: '「시작점 → 구불구불한 길 → 언덕 → 기둥」 지도 + 🥉 최소 목표: 길 + 기둥만 돼도 OK' }),
        T('18:20', '19:15', 'level', '🧪 작은 실습 · 길 + 언덕 + 기둥 (55분)', {
          desc: '영상 끄고! (따라하기 복습 겸용) · 다음 주 「노을 등대섬」에 이어서 쓸 거예요',
          ms: [
            ['LighthouseIsland 프로젝트', 'Third Person 템플릿으로 새 프로젝트'],
            ['Cube Grid로 길 + 언덕', '구불구불한 길 + 언덕'],
            ['언덕 위 큰 기둥', '나중에 등대 자리! 시작점에서 살짝 보이는지 👀'],
            ['캐릭터로 걸어보기', '시작점 → 기둥까지'],
          ],
        }),
        T('19:15', '19:30', 'level', '✅ 정리 · 저장', {
          desc: '➡️ How to level design part 2 (32분)는 다음 주로 넘겨요',
          ms: [['스크린샷'], ['🤔 질문 1개 3줄 답', '오늘 🤔 질문 중 하나를 골라 3줄로 답 쓰기']],
        }),
        R('19:30', '20:00', 'walk', '🚶 귀가 · 쉬기'),
        lang(true),
        dinner(),
        T('22:00', '23:00', 'toon', '📖 웹툰 분석 #1', { desc: '한 화의 시선 흐름 화살표 그리기 (오늘 배운 시선유도랑 비교!)', ms: [['시선 흐름 화살표'], ['시선유도랑 비교']] }),
        webtoonRest(),
      ],

      /* ===== 금 · 🧊 블렌더 (레벨 2: 처음 만나는 3D) ===== */
      '2026-11-20': [
        ...morning(),
        T('10:30', '10:45', 'clang', '🔁 C 복습 (1일)', { desc: '어제 「등록증」 안 보고 다시 짜기' }),
        T('10:45', '11:45', 'clang', '⌨️ C 11~18강 · 반복문', {
          desc: '나도코딩 섹션 3 (약 45분 추정)',
          ms: [['피라미드'], ['증감연산'], ['for'], ['while · do while'], ['이중 반복문', '구구단 · 거꾸로 별']],
          qs: ['구구단을 코드로 짠다면, 바깥 for와 안쪽 for는 각각 무엇을 셀까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('11:55', '12:25', 'clang', '🎮 C 미니게임 · 등대 그리기', {
          desc: '이중 for문으로 * 등대 모양 + 아래에 ~ 바다 출력',
          ms: [['* 등대 모양'], ['~ 바다'], ['저장']],
        }),
        ...cBreaks(),
        T('12:35', '12:45', 'review', '🔁 어제 회상', { desc: '시선유도 핵심 3줄 백지에 쓰기' }),
        T('12:45', '14:15', 'blender', '📺 강의A · 설치 + 기초 조작 (38분)', {
          desc: '노션 「1단계: 설치와 기본 조작」 순서. 처음이라 작게 끊고 따라 하기',
          ms: [
            ['설치 AtoZ (9분)', '진짜로 설치하면서 보기 · 0:33 LTS 뜻 → 3:12 이전 버전 → 4:37 컴퓨터 사양 → 6:50 처음 설정'],
            ['기초 part 01 (17분)', '챕터 없음, 설명 보고 나눔 · 앞부분: 화면 구성·시점 조작 → ⏸️ → 뒷부분: 기초 모델링 따라 하기'],
            ['싹 다 정리한 기초 앞부분', '0:00–12:12 · 0:42 기초 세팅 → 1:31 인터페이스 → 4:12 화면 조작 → 6:03 오브젝트 조작 → ⭐ 8:30 변형'],
          ],
          qs: [
            '최신 버전 대신 LTS를 고르면 좋은 점은 뭘까?',
            '마우스 가운데 버튼으로 할 수 있는 걸 몇 개 찾았어?',
            '이동(G)·회전(R)·크기(S) 중 등대 만들 때 제일 많이 쓸 건 뭘까?',
          ],
          links: [
            ['블렌더 설치하기 AtoZ', YT('0DZTq6PaZAY')],
            ['블렌더 기초 강의 part 01', YT('IHNGcaQiEr0')],
            ['귀찮아서 싹 다 정리한 블렌더 기초', YT('gVteZaQGry0')],
          ],
        }),
        R('14:15', '14:45', 'tea', '🍪 간식 30분'),
        T('14:45', '16:15', 'blender', '📺 강의B · 우유곽 모델링 + 에셋 (33분)', {
          ms: [
            ['우유곽 모델링 · 채색', '싹 다 정리한 기초 뒷부분 · ⭐ 12:12 우유곽 모델링 → ⭐ 13:32 채색 · ⏸️ 5분 쉬기'],
            ['조명 · 카메라 · 렌더', '16:53 조명 → 20:07 카메라 → 23:16 렌더링'],
            ['폴리 헤븐 (5분)', '1:27 에셋 종류 → 2:17 HDRI → 3:31 텍스처 → 4:22 모델'],
            ['블렌더 마켓 (13분)', '보기만! · 2:18 에셋 종류 → 3:44 구매·다운 → 6:09 애드온 → 7:33 모델'],
          ],
          qs: ['우유곽에서 쓴 기술 중 등대에도 쓸 수 있는 건 뭘까?', '무료(폴리 헤븐)와 유료(블렌더 마켓), 나는 언제 어느 쪽을 쓸까?'],
          links: [
            ['귀찮아서 싹 다 정리한 블렌더 기초 (12:12~)', YT('gVteZaQGry0')],
            ['폴리 헤븐 사이트란?', YB('ZCHFEM-KO28')],
            ['블렌더 마켓 사이트란?', YB('Gw9ITvudeeA')],
          ],
        }),
        ...tail(
          'blender',
          '새 파일에서 우유곽 다시 만들고 색 칠하기. 막히는 곳만 영상 다시 보기',
          '등대 정면 그림 (몸통 · 불빛 방 · 지붕) + 🥉 최소 목표: 원기둥 1개만 돼도 OK',
          {
            title: '미니 등대 모형',
            desc: '원기둥 3개 + 색 2개로 작게!',
            ms: [
              ['몸통·불빛 방·지붕', '원기둥 3개로 몸통 · 불빛 방 · 지붕(원뿔)'],
              ['빨강·흰색 칠하기', '오늘 배운 「채색」으로 2개'],
              ['🥇 보너스 · 언리얼에 놓기', 'FBX로 내보내서 어제 레벨의 기둥 자리에 놓아보기'],
            ],
            wrap: '스크린샷 + .blend 저장',
          },
          {
            title: '🎞️ 연속강의 · 3D 에셋 → 언리얼 (36분)',
            desc: '언리얼엔진5 입문 04강 2부 「외부 3D에셋 엔진에 적용하기」 (보기만) · ➡️ setup guide (46분)는 다음 블렌더 날로',
            ms: [
              ['앞부분 · 가져오기 · FBX', '외부 모델 가져오기 · FBX로 바꾸기 → ⏸️ (챕터 없음, 설명 보고 나눔)'],
              ['뒷부분 · 머티리얼 만들기', '텍스처 없을 때 머티리얼 만들기'],
            ],
            qs: ['오늘 만든 등대를 언리얼에 넣으려면 블렌더에서 뭘 먼저 해야 할까?'],
          }
        ),
        lang(false),
        dinner(),
        R('22:00', '23:00', 'nap', '🚿 머리감기 → 😴 일찍 취침'),
      ],

      /* ===== 토 · 🔁 밀린 것 + 💡 라이팅 맛보기 (레벨 3: 보너스 스테이지) ===== */
      '2026-11-21': [
        T('16:00', '16:30', 'clang', '🔁 C 복습 + 미니 퀴즈', {
          ms: [['등대 그리기 다시', '20분 · 어제 「등대 그리기」 안 보고 다시 출력'], ['미니 퀴즈', '블렌더 단축키 5개 + 시선유도 핵심 3줄 백지에 쓰기']],
        }),
        T('16:30', '17:45', 'light', '📺 밀린 강의 · 없으면 💡 라이팅 맛보기', {
          desc: '목·금에 못 본 영상이 있으면 그것부터! 밀린 게 있어도 괜찮아요, 그걸 하는 날이에요 😊',
          ms: [
            ['밀린 영상 먼저'],
            ['포인트 · 스포트 라이트', '없으면 → 05강 0:44 포인트 라이트 → ⭐ 9:29 스포트 라이트 (등대 불빛!) → 13:38에서 멈추기 · ⏸️ 5분 쉬기'],
            ['디렉셔널 · 스카이 라이트', '⭐ 27:53 디렉셔널 라이트 (해!) → ⭐ 32:04 스카이 라이트 (하늘빛!) → 34:50에서 멈추기'],
          ],
          qs: ['포인트와 스포트의 차이를 전구와 손전등에 비유하면?', '노을을 만들려면 해(디렉셔널)의 뭘 바꿔야 할까?'],
          links: [['언리얼엔진5 입문 05강 Light & Lumen', YT('azMt_FmoXDg')]],
        }),
        R('17:45', '17:55', 'stretch', '☕ 휴식'),
        T('17:55', '18:05', 'light', '🗒️ 실습 기획 10분', { desc: '밀린 실습이 있으면 그것 / 없으면 노을 사진 1장 보고 색 3개 고르기' }),
        T('18:05', '19:15', 'light', '🧪 작은 실습 · 밀린 것 / 노을 하늘 (70분)', {
          ms: [
            ['밀린 실습 먼저', '순서: 길·언덕·기둥 → 미니 등대'],
            ['노을 하늘', '없으면 → 목요일 레벨에 해 낮게 기울이기 + 스카이 라이트'],
            ['꼭대기 Spot Light', '기둥(또는 미니 등대) 꼭대기에 1개 → 바닥을 비추게'],
            ['🥇 보너스 · 스샷 3장', '해 각도만 바꿔서 낮 / 노을 / 밤'],
          ],
        }),
        T('19:15', '20:00', 'review', '🗂️ 이번 주 실습 모아보기', {
          ms: [['스크린샷 한 폴더에 + 저장'], ['합치는 순서 생각하기', '내일 기획서에 쓸 거예요']],
          qs: ['이 실습들을 하나의 섬으로 합치려면 뭘 먼저 해야 할까?'],
        }),
        dinner(),
        R('22:00', '23:00', 'music', '🎨 그림 (주말 힐링)'),
        webtoonRest(),
      ],

      /* ===== 일 · 🔁 복습 + 📐 다음 주 기획 (레벨 5: 다음 맵 준비) ===== */
      '2026-11-22': [
        T('17:00', '17:30', 'review', '🔁 퀴즈 + 주간 정리', {
          ms: [
            ['3일 퀴즈 · 목요일', 'int/float 차이, scanf에 & 붙이는 이유'],
            ['이번 주 한 장 정리', 'C 2개 + 레벨디자인 · 블렌더 (+ 라이팅 맛보기) 마인드맵'],
            ['클리어 기준 체크', '공부 보드의 「이번 주 클리어 기준」 카드'],
          ],
        }),
        T('17:30', '18:20', 'review', '📐 다음 주 미니 프로젝트 기획서 (50분)', {
          desc: '💬 한 문장: 「노을 질 때 등대까지 걸어가면 불이 켜지는 섬」',
          ms: [
            ['✏️ 완성 장면 스케치'],
            ['🧱 실습 나누기', '그대로 쓸 것 / 고칠 것'],
            ['🧩 요일별 조각', '후보: 💡 라이팅으로 노을 · 🏃 애니메이션으로 불 켜기 동작 · 🎬 시네마틱으로 30초 영상'],
            ['🚫 하지 않을 것 3개'],
          ],
        }),
        R('18:20', '18:30', 'stretch', '☕ 휴식'),
        T('18:30', '18:45', 'review', '🪞 회고', {
          desc: '잘된 것 1 · 막힌 것 1 · 다음 주에 바꿀 것 1',
          qs: ['이번 주 🤔 질문 중 아직 답을 못 찾은 게 있어?'],
        }),
        T('18:45', '19:45', 'review', '📅 다음 주 시간표', {
          desc: '「주간시간표_규칙.md」 + 기획서를 Claude에게 주고 「다음 주 시간표 짜줘」 (11/23부터 🏋️ 홈트 + 수·금 18:30 귀가!)',
          ms: [['밀린 체크박스 → 다음 주'], ['Claude에게 시간표 부탁'], ['C 다음 진도 확인', '섹션 4 조건 (20~25강) → 5 함수']],
        }),
        T('19:45', '20:00', 'review', '✅ 정리'),
        dinner(),
        T('22:00', '23:00', 'toon', '📖 웹툰 분석 #2', { desc: '「캐릭터 첫 등장 컷」 3개 비교', ms: [['첫 등장 컷 3개 모으기'], ['비교 메모']] }),
        webtoonRest(),
      ],
    },
  };

  SQ.PLANS = [W47];

  /* ---------- import ---------- */
  const imported = (p) => !!(SQ.state.planImports && SQ.state.planImports[p.id]);
  // 같은 주의 예전 버전을 이미 넣었는지 (그럼 「바뀐 시간표」로 안내)
  const oldImported = (p) => Object.entries(SQ.state.planImports || {}).some(([id, v]) => id !== p.id && v !== 'hidden' && p.family && (id === p.family || id.startsWith(p.family + '-')));
  const lastDay = (p) => SQ.addDays(p.ws, 6);
  const countOf = (p) => {
    let task = 0, rest = 0;
    Object.values(p.days).forEach((l) => l.forEach((x) => (x.kind === 'task' ? task++ : rest++)));
    return { task, rest };
  };
  // 이 주를 보거나(지난주 포함) 오늘이 이 주 안이면 배너를 보여줘요
  SQ.pendingPlan = (ws) => SQ.PLANS.find((p) => !imported(p) && SQ.today() <= lastDay(p) && (!ws || ws === p.ws || ws === SQ.addDays(p.ws, -7)));

  const build = (x) => {
    const base = { id: SQ.uid(), kind: x.kind, start: x.start, end: x.end, title: x.title, done: false, spentMin: 0 };
    if (x.kind === 'break') return Object.assign(base, { activity: x.activity || 'free', memo: '' });
    return Object.assign(base, {
      subjectId: x.subjectId || '',
      desc: x.desc || '',
      milestones: (x.ms || []).map(([text, detail]) => ({ id: SQ.uid(), text, detail: detail || '', done: false })),
      qs: (x.qs || []).map((q) => ({ id: SQ.uid(), q, a: '' })),
      qAsk: false,
      links: (x.links || []).map(([name, url]) => ({ name, url })),
      lectureId: '',
      boardId: '',
    });
  };

  function apply(p, mode, S) {
    p.subjects.forEach((s) => {
      if (!S.subjects.some((x) => x.id === s.id)) S.subjects.push(Object.assign({}, s));
    });
    Object.entries(p.days).forEach(([k, list]) => {
      const fresh = list.map(build);
      S.schedules[k] = mode === 'replace' ? fresh : (S.schedules[k] || []).concat(fresh);
    });
    S.weekGoals[p.ws] = { title: p.goal };
    Object.entries(p.dayGoals).forEach(([k, title]) => {
      if (mode === 'replace' || !(S.dayGoals[k] && S.dayGoals[k].title)) S.dayGoals[k] = { title, done: false };
    });
    const card = p.board && S.board.find((c) => c.planId === p.id || c.planId === p.family);
    if (card) {
      // 예전 버전 카드 → 새 기준으로 바꾸기 (같은 글자인 체크는 그대로)
      const old = card.subtasks || [];
      Object.assign(card, {
        title: p.board.title, memo: p.board.memo || '', due: lastDay(p),
        subtasks: p.board.subtasks.map((text) => {
          const o = old.find((s) => s.text === text);
          return { id: o ? o.id : SQ.uid(), text, done: !!(o && o.done) };
        }),
      });
    } else if (p.board) {
      S.board.filter((c) => c.status === 'todo').forEach((c) => (c.order = (c.order || 0) + 1));
      S.board.push({
        id: SQ.uid(), planId: p.family || p.id, title: p.board.title, subjectId: p.board.subjectId, status: 'todo', due: lastDay(p), repeat: '',
        subtasks: p.board.subtasks.map((text) => ({ id: SQ.uid(), text, done: false })), counter: null, memo: p.board.memo || '',
        createdAt: SQ.today(), startedAt: null, doneAt: null, order: 0,
      });
    }
    S.planImports = Object.assign({}, S.planImports, { [p.id]: mode });
  }

  A.importPlan = (el) => {
    const p = SQ.PLANS.find((x) => x.id === el.dataset.plan);
    if (!p) return;
    const days = Object.keys(p.days);
    const existing = days.reduce((a, k) => a + (SQ.state.schedules[k] || []).length, 0);
    const c = countOf(p);
    const go = (mode) =>
      SQ.commit((S) => apply(p, mode, S), { undo: `${p.name}를 넣었어요 · 공부 ${c.task}개, 휴식 ${c.rest}개` });
    const jump = () => {
      // 오늘 이후로 일정이 있는 첫날 (쉬는 날은 건너뛰기)
      const t = SQ.today();
      SQ.ui.selDate = Object.keys(p.days).find((k) => k >= t && p.days[k].length) || (t >= p.ws ? t : p.ws);
      SQ.go('week');
    };
    if (!existing) {
      go('replace');
      jump();
      return;
    }
    SQ.modal.open({
      title: '시간표 넣기',
      sub: `${p.name} · ${SQ.weekRange(p.ws)}`,
      submit: '넣기',
      body: `
        <p class="confirm-msg">${oldImported(p) ? `시간표가 바뀌었어요. 예전에 넣은 일정이 ${existing}개 있어요. 새 시간표로 바꿀까요?` : `이 주에 벌써 일정이 ${existing}개 있어요. 어떻게 넣을까요?`}</p>
        <div class="opt-list">
          <label class="opt"><input type="radio" name="mode" value="replace" checked><span><b>새 시간표로 바꾸기</b><small>원래 있던 ${existing}개는 지우고 새로 넣어요 (되돌리기 가능)</small></span></label>
          <label class="opt"><input type="radio" name="mode" value="add"><span><b>원래 일정 옆에 더하기</b><small>지우지 않고 새 일정을 함께 넣어요</small></span></label>
        </div>`,
      onSubmit(d) {
        go(d.mode === 'add' ? 'add' : 'replace');
        setTimeout(jump, 0);
      },
    });
  };

  A.hidePlan = (el) => {
    const id = el.dataset.plan;
    SQ.commit((S) => (S.planImports = Object.assign({}, S.planImports, { [id]: 'hidden' })), { undo: '시간표 알림을 숨겼어요' });
  };

  SQ.planBanner = (ws) => {
    const p = SQ.pendingPlan(ws);
    if (!p) return '';
    const c = countOf(p);
    const upd = oldImported(p);
    const strip = Object.keys(p.days)
      .map((k, i) => {
        const [lab, color] = p.strip[i];
        return `<li style="${SQ.cvar(color)}"><b>${SQ.DOW[SQ.dow(k)]} ${SQ.pkey(k).getDate()}</b><span>${esc(lab)}</span></li>`;
      })
      .join('');
    return `
    <section class="plan-banner">
      <div class="pb-top">
        <span class="pb-ic" aria-hidden="true">${upd ? '🔄' : '📥'}</span>
        <div class="pb-txt">
          <small>${SQ.today() < p.ws ? '다음 주' : '이번 주'} 시간표가 ${upd ? '바뀌었어요' : '준비됐어요'} · ${SQ.weekRange(p.ws)}</small>
          <h3>${esc(p.name)}</h3>
          <p>목표 「${esc(p.goal)}」 · 공부 ${c.task}개 · 휴식 ${c.rest}개 · 영상 링크·이정표·질문까지 다 들어가요</p>
        </div>
        <div class="pb-act">
          <button class="btn primary" data-act="importPlan" data-plan="${p.id}">${icon(upd ? 'repeat' : 'download', 16)} ${upd ? '새 시간표로 바꾸기' : '시간표 넣기'}</button>
          <button class="icon-btn" data-act="hidePlan" data-plan="${p.id}" aria-label="알림 숨기기" title="숨기기">${icon('x', 16)}</button>
        </div>
      </div>
      <ol class="pb-days">${strip}</ol>
    </section>`;
  };
})();
