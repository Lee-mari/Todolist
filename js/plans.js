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

  /* ---------- 11월 3주차 · 🏮 노을 등대섬 ---------- */
  // 평일 아침: 구구단 → 아침 먹고 스카로 이동 (10:30 도착)
  const morning = () => [
    T('08:50', '09:00', 'review', '🔢 구구단', { desc: '아침 10분 몸풀기' }),
    R('09:00', '10:30', 'meal', '🍳 아침 · 🚶 스카로 이동'),
  ];
  // C언어 사이 짧은 휴식 10분 × 2
  const cBreaks = () => [R('11:45', '11:55', 'stretch', '☕ 휴식'), R('12:25', '12:35', 'free', '☕ 휴식')];
  const dinner = () => R('20:30', '22:00', 'meal', '🍚 저녁');
  const webtoonRest = () => R('23:00', '00:00', 'game', '😌 웹툰 휴식 (공부 아님!)');
  const lang = (jp) =>
    T('20:00', '20:30', jp ? 'jp' : 'eng', jp ? '🇯🇵 일본어' : '🇺🇸 영어', {
      desc: '집에서 30분. 스피킹 → 단어 → 필사 순서로 10분씩',
      ms: [['🗣️ 스피킹 10분'], ['📝 단어 10분'], ['✍️ 필사 10분']],
    });
  // 화~금 오후 뒷부분: ☕ → 따라하기 30 → ☕ → 기획 15 → 섬에 붙이기 75 → ☕ → 여유 30 → 정리 15
  const tail = (subj, redo, plan, build, flex, flexLinks) => [
    R('16:15', '16:25', 'stretch', '☕ 휴식'),
    T('16:25', '16:55', subj, '🔁 따라하기 복습 (영상 끄고!)', { desc: redo }),
    R('16:55', '17:05', 'free', '☕ 휴식'),
    T('17:05', '17:20', subj, `🗒️ 기획 15분 · ${plan.title}`, { desc: plan.desc, ms: plan.ms }),
    T('17:20', '18:35', subj, `🏮 섬에 붙이기 · ${build.title} (75분)`, { desc: build.desc, ms: build.ms }),
    R('18:35', '18:45', 'stretch', '☕ 휴식'),
    T('18:45', '19:15', subj, '🧩 여유 블록', { desc: '위에서부터 하나씩', ms: [['밀린 것 먼저'], ...flex], links: flexLinks }),
    T('19:15', '19:30', subj, '✅ 정리 · 저장', { desc: build.wrap, ms: [['스크린샷·저장'], ['🤔 질문 1개 3줄 답', '오늘 🤔 질문 중 하나를 골라 3줄로 답 쓰기']] }),
    R('19:30', '20:00', 'walk', '🚶 귀가 · 쉬기'),
  ];

  const W47 = {
    id: '2026-11-w3-v3', // 시간표가 바뀌면 v 숫자를 올려요 → 예전 버전을 넣은 사람에게도 배너가 다시 떠요
    family: '2026-11-w3',
    ws: '2026-11-16',
    name: '🎮 11월 3주차 공부 퀘스트',
    goal: '🏮 노을 등대섬 + 30초 시네마틱',
    strip: [['😴 쉬는 날', 'gray'], ['🗺️ 레벨디자인', 'green'], ['🧊 블렌더', 'coral'], ['💡 라이팅', 'orange'], ['🎬 시네마틱', 'rose'], ['🔁 다듬기', 'gray'], ['🏁 완성', 'pink']],
    subjects: [
      { id: 'clang', name: 'C언어', color: 'blue', icon: 'code' },
      { id: 'level', name: '레벨디자인', color: 'green', icon: 'layout' },
      { id: 'blender', name: '블렌더', color: 'coral', icon: 'box' },
      { id: 'light', name: '라이팅', color: 'orange', icon: 'sun' },
      { id: 'cine', name: '시네마틱', color: 'rose', icon: 'video' },
      { id: 'review', name: '복습', color: 'gray', icon: 'repeat' },
      { id: 'eng', name: '영어', color: 'sky', icon: 'globe' },
      { id: 'jp', name: '일본어', color: 'violet', icon: 'globe' },
      { id: 'toon', name: '웹툰 분석', color: 'pink', icon: 'pen' },
    ],
    board: {
      title: '🏮 노을 등대섬 완성 기준 (일요일 체크)',
      subjectId: 'level',
      subtasks: [
        '등대가 살짝 보이고 길 따라 걸어감',
        '블렌더로 만든 등대가 섬 위에 서 있음',
        '노을 하늘 + 등대 불빛이 보임',
        '30초 mp4, 마지막에 등대 불이 켜짐',
        'C 「등대지기의 밤」 끝까지 실행',
      ],
      memo: '💡 일부러 작게 잡았어요. 다 끝내고 시간이 남으면 그때 더 붙여요!\n🗺️ 레벨: 바다 위 작은 섬, 시작 지점에서 언덕 위 등대가 살짝 보이고 길 따라 걸어 올라가요.\n🧍 플레이: 기본 캐릭터(Third Person)로 등대까지 걷기 (캐릭터 애니메이션은 다음 주!)\n🌅 분위기: 노을 하늘 + 등대 불빛이 바다를 비춤\n🎬 영상: 하늘에서 섬 훑기 → 길 따라 올라가기 → 등대 불 켜짐 (시퀀서 빛 밝기 키프레임)\n⌨️ C 버전: 등록 → 등대 그리기 → 배 신호 맞히기',
    },
    dayGoals: {
      '2026-11-16': '😴 쉬는 날 · 푹 쉬어요',
      '2026-11-17': '주간 기획서 + 블록아웃 (등대가 살짝 보이게)',
      '2026-11-18': '블렌더 등대를 섬 위에 세우기',
      '2026-11-19': '노을빛 + 등대 꼭대기 불빛',
      '2026-11-20': '30초 영상, 마지막에 등대 불 켜기',
      '2026-11-21': '밀린 것 처리 + 등대까지 3번 걸어보기',
      '2026-11-22': '완성 기준 5개 체크 + 다음 주 기획서',
    },
    days: {
      /* ===== 월 · 😴 쉬는 날 ===== */
      '2026-11-16': [],

      /* ===== 화 · 🗺️ 레벨디자인 (레벨 1: 섬 땅 고르기) ===== */
      '2026-11-17': [
        ...morning(),
        T('10:30', '10:45', 'clang', '🔁 C 기억 점검', { desc: '예전에 배운 switch · if를 백지에 써보기' }),
        T('10:45', '11:45', 'clang', '⌨️ C 1~9강 · 변수·입출력', {
          desc: '나도코딩 섹션 1~2 (약 45분 추정)',
          ms: [['환경설정 · Hello World'], ['정수·실수 변수 · 주석'], ['상수'], ['printf'], ['scanf']],
          qs: ['int와 float는 각각 어떤 숫자를 담을까? 나이는 어느 쪽?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('11:55', '12:25', 'clang', '🎮 C 미니게임 · 등대지기 등록증', {
          desc: '이름 · 나이 · 좋아하는 바다 생물을 scanf로 받아 등록증처럼 출력',
          ms: [['scanf로 3개 입력받기'], ['등록증 모양 출력'], ['저장', 'lighthouse_c 폴더에 저장']],
        }),
        ...cBreaks(),
        T('12:35', '12:45', 'level', '📜 이번 주 퀘스트 읽기', { desc: '「이번 주 목표」 + 공부 보드의 완성 기준 5개 읽기' }),
        T('12:45', '14:15', 'level', '📺 강의A · 시선유도 · 블록아웃 (38분)', {
          desc: '노션 레벨디자인 1→2→3번 순서. 영상마다 🤔 질문을 먼저 읽고 보기!',
          ms: [
            ['1. 시선유도 법칙 (9분)', '0:33 필드 유도 → 2:09 크기 인력 → 2:41 목적 인력 → ⭐ 3:09 목표를 살짝 보여주기 → 5:35 엘든링 사례'],
            ['2. How to practice (16분)', '1:00 바닥 만들기 → ⭐ 3:00 장면 배치 → 6:00 캐릭터로 걸어보기 · ⏸️ 5분 쉬기 → 8:00 메시 교체 → ⭐ 12:00 빛으로 길 안내'],
            ['3. Blocking Out 3가지 (13분)', '0:59 BSP 브러시 → 3:37 모델링 모드 → 10:16 모듈러 메시'],
          ],
          qs: [
            '등대는 「크기 인력」일까, 「목적 인력」일까? 둘 다라면 왜?',
            '등대를 처음부터 다 보여주면 어떨까? 살짝만 보여주려면 뭘로 가릴까?',
            '꾸미기 전에 캐릭터로 먼저 걸어보는 이유는 뭘까?',
            '세 방법 중 등대섬엔 뭐가 제일 빠를까? 왜?',
          ],
          links: [
            ['1. 야숨·엘든링 시선유도 법칙', YT('eO8CyODLbsM')],
            ['2. How to practice level design', YT('0AWSxaQSZZE')],
            ['3. 3 Methods for Blocking Out', YT('ZfalgxLtNyI')],
          ],
        }),
        R('14:15', '14:45', 'tea', '🍪 간식 30분'),
        T('14:45', '15:15', 'level', '📐 주간 기획 30분 · 이번 주 설계도', {
          desc: '💬 한 문장: 「노을 질 때 등대까지 걸어가면 불이 켜지는 섬」',
          ms: [
            ['완성 장면 스케치', '불 켜진 등대 + 노을, 1장'],
            ['섬 지도', '시작점 · 길 · 언덕 · 등대 · 「등대가 살짝 보이는 지점」 표시'],
            ['하지 않을 것 3개', '예: 전투 ✕, 캐릭터 애니메이션 ✕, 날씨 변화 ✕'],
          ],
        }),
        T('15:15', '16:15', 'level', '📺 강의B · Cube Grid 따라 하기 (13분)', {
          desc: '매 단계 ⏸️ 멈추고 따라 하기',
          ms: [['첫 세팅', '0:20 플러그인 켜기'], ['도구 기초', '⭐ 5:00 도구 기초'], ['환경 만들기', '10:00 환경 만들기']],
          qs: ['Cube Grid로 언덕을 만들면 좋은 점 1개, 아쉬운 점 1개는?'],
          links: [['Cube Grid로 빠르게 프로토타입', YB('zo8VY8qU3PU')]],
        }),
        ...tail(
          'level',
          '새 레벨에 Cube Grid로 계단 1개 + 언덕 1개 다시 만들기',
          {
            title: '오늘의 블록아웃',
            desc: '🎯 끝나면 보일 것: 「시작점에서 언덕 위 원기둥(등대 자리)이 살짝 보인다」',
            ms: [['지도에 동그라미', '주간 기획서 지도에 오늘 만들 부분 동그라미'], ['할 일 3개', '🥉 최소: 섬 바닥 + 등대 자리 / 🥇 보너스: 바위로 길 가리기']],
          },
          {
            title: '블록아웃',
            desc: '시작 지점에서 등대가 살짝 보이는지가 핵심 👀',
            ms: [
              ['LighthouseIsland 프로젝트', 'Third Person 템플릿으로 새 프로젝트'],
              ['섬 바닥·언덕·길', 'Cube Grid로 섬 바닥 + 언덕 + 구불구불한 길'],
              ['임시 등대 원기둥', '등대 자리에 큰 원기둥 → 시작점에서 보이는지 확인'],
              ['캐릭터로 걸어보기', '시작점 → 등대까지 (오늘 배운 「먼저 걸어보기」!)'],
            ],
            wrap: '스크린샷 2장',
          },
          [['🥇 보너스 · 바위로 길 가리기'], ['level design part 2 앞 3분', '그래도 남으면 0:00–3:01 (레벨 문서 · 지도 그리기)만 보고 기획서 다듬기']],
          [['level design part 2', YB('n34hRnF5vGc')]]
        ),
        lang(true),
        dinner(),
        T('22:00', '23:00', 'toon', '📖 웹툰 분석 #1', { desc: '한 화의 시선 흐름 화살표 그리기 + 좋았던 연출 3개', ms: [['시선 흐름 화살표'], ['좋았던 연출 3개']] }),
        webtoonRest(),
      ],

      /* ===== 수 · 🧊 블렌더 (레벨 2: 등대 세우기) ===== */
      '2026-11-18': [
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
          desc: '노션 「1단계: 설치와 기본 조작」 순서. 블렌더는 처음이라 작게 끊고 따라 하기',
          ms: [
            ['설치 AtoZ (9분)', '진짜로 설치하면서 보기 · 0:33 LTS 뜻 → 4:37 컴퓨터 사양 → 6:50 처음 설정'],
            ['기초 part 01 (17분)', '챕터 없음 · 앞부분: 화면 구성·시점 조작 → ⏸️ → 뒷부분: 기초 모델링 따라 하기'],
            ['싹 다 정리한 기초 앞부분', '0:00–12:12 · 1:31 인터페이스 → 4:12 화면 조작 → 6:03 오브젝트 조작 → ⭐ 8:30 변형'],
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
            ['우유곽 모델링 · 채색', '싹 다 정리한 기초 뒷부분 · ⭐ 12:12 우유곽 모델링 → ⭐ 13:32 채색 (등대 만들 때 쓸 거!) · ⏸️ 5분 쉬기'],
            ['조명 · 카메라 · 렌더', '16:53 조명 → 20:07 카메라 → 23:16 렌더링'],
            ['폴리 헤븐 (5분)', '1:27 에셋 종류 → 2:17 HDRI → 3:31 텍스처 → 4:22 모델'],
            ['블렌더 마켓 (13분)', '보기만! · 2:18 에셋 종류 → 3:44 구매·다운 → 6:09 애드온 → 7:33 모델 → 8:23 재질'],
          ],
          qs: ['우유곽에서 쓴 기술 중 등대에도 쓸 수 있는 건 뭘까?', '무료(폴리 헤븐)와 유료(블렌더 마켓) 중 등대섬엔 뭘 쓸까? 왜?'],
          links: [
            ['귀찮아서 싹 다 정리한 블렌더 기초 (12:12~)', YT('gVteZaQGry0')],
            ['폴리 헤븐 사이트란?', YB('ZCHFEM-KO28')],
            ['블렌더 마켓 사이트란?', YB('Gw9ITvudeeA')],
          ],
        }),
        ...tail(
          'blender',
          '새 파일에서 우유곽 다시 만들고 색 칠하기. 막히는 곳만 영상 다시 보기',
          {
            title: '등대 설계도',
            desc: '🎯 끝나면 보일 것: 「섬 위에 빨강·흰색 등대가 서 있다」',
            ms: [['정면 그림', '몸통 · 불빛 방 · 지붕 + 대충 크기 비율 (예: 6 : 1 : 1)'], ['할 일 3개', '🥉 최소: 원기둥 몸통만 언리얼에 들어가도 OK / 🥇 보너스: 난간']],
          },
          {
            title: '등대 만들기',
            desc: '블렌더 등대 → 언리얼 섬 위로',
            ms: [['몸통·불빛 방·지붕', '원기둥 3개로 몸통 · 불빛 방 · 지붕(원뿔)'], ['빨강·흰색 재질', '오늘 배운 「채색」으로 재질 2개'], ['FBX → 언리얼 교체', 'FBX 내보내기 → 언리얼로 가져오기 → 어제 놓은 임시 원기둥 자리에 교체']],
            wrap: '스크린샷 + .blend 저장',
          },
          [['🥇 보너스 · 난간'], ['입문자 블렌더 기초 강좌', '그래도 남으면 노션 다음 순서 0:00–12:06 (설치·렌더·환경 설정)']],
          [['입문자를 위한 블렌더 기초 강좌', YT('_7QbGhPN_uY')]]
        ),
        lang(false),
        dinner(),
        R('22:00', '23:00', 'free', '🚿 머리감기'),
        webtoonRest(),
      ],

      /* ===== 목 · 💡 라이팅·루멘 (레벨 3: 노을 켜기) ===== */
      '2026-11-19': [
        ...morning(),
        T('10:30', '10:45', 'clang', '🔁 C 복습 (1일)', { desc: '어제 「등대 그리기」 안 보고 다시 출력' }),
        T('10:45', '11:45', 'clang', '⌨️ C 20~24강 · 조건문', {
          desc: '나도코딩 섹션 4 · 강의가 짧아서 남는 시간은 예제 따라 치기',
          ms: [['숫자 맞히기 Up&Down'], ['if else'], ['break / continue'], ['and / or'], ['switch']],
          qs: ['if를 여러 개 쓰는 것과 switch, 언제 뭐가 더 읽기 쉬울까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('11:55', '12:25', 'clang', '🎮 C 미니게임 · 배 신호 Up&Down', {
          desc: 'rand로 배 위치(1~100) 숨기기 → 5번 안에 맞히기 → 맞히면 switch로 신호 색 고르기',
          ms: [['rand로 숨기기'], ['5번 안에 맞히기'], ['switch 신호 색'], ['저장']],
        }),
        ...cBreaks(),
        T('12:35', '12:45', 'review', '🔁 어제 회상', { desc: '블렌더 단축키 5개 백지에 쓰기' }),
        T('12:45', '14:15', 'light', '📺 강의A · 라이트 5종류 (05강 0:00–34:50)', {
          desc: '언리얼엔진5 입문 05강 Light & Lumen 앞부분 35분 따라 하기',
          ms: [
            ['포인트 라이트', '0:44 포인트 라이트 + 디테일 패널'],
            ['스포트 라이트', '⭐ 9:29 스포트 라이트 (등대 불빛!) → 13:38 라이트 함수 머티리얼 · ⏸️ 5분 쉬기'],
            ['렉트 · 디렉셔널', '23:38 렉트 라이트 → ⭐ 27:53 디렉셔널 라이트 (해!)'],
            ['스카이 라이트', '⭐ 32:04 스카이 라이트 (하늘빛!)'],
          ],
          qs: ['노을은 다섯 가지 라이트 중 어떤 걸로 만들까? 등대 불빛은?', '포인트와 스포트의 차이를 손전등과 전구에 비유하면?'],
          links: [['언리얼엔진5 입문 05강 Light & Lumen', YT('azMt_FmoXDg')]],
        }),
        R('14:15', '14:45', 'tea', '🍪 간식 30분'),
        T('14:45', '16:15', 'light', '📺 강의B · 루멘 + 나나이트 (31분)', {
          ms: [
            ['05강 뒷부분 · 루멘', '34:50 모빌리티 옵션 → ⭐ 42:14 루멘 → 48:10 채도·명도·명암·유사색'],
            ['나나이트 정ㅋ벅ㅋ (14분)', '챕터 없음 · 보기만! 나나이트가 뭔지 → 왜 좋은지 → 한계는 뭔지, 세 덩어리로 메모'],
          ],
          qs: ['노을을 더 따뜻하게 보이려면 채도·명도를 어떻게 바꿀까?', 'LOD를 사람이 직접 만들 때 뭐가 불편할까? 나나이트는 어떻게 해결할까?'],
          links: [
            ['05강 Light & Lumen (34:50~)', YT('azMt_FmoXDg')],
            ['LOD, 노말맵 왜 씀? 나나이트 정ㅋ벅ㅋ', YB('e-XFHcD7ibA')],
          ],
        }),
        ...tail(
          'light',
          '빈 레벨에 해 · 하늘빛 넣고 해 각도만 바꿔서 낮 → 노을 → 밤 만들기',
          {
            title: '노을 무드보드',
            desc: '🎯 끝나면 보일 것: 「주황빛 노을 + 바다를 비추는 등대 불」',
            ms: [['노을 사진 2장 · 색 3개', '하늘 · 바다 · 등대불 색 고르기'], ['해 각도 그림', '어느 쪽에서 얼마나 낮게?'], ['할 일 3개', '🥉 최소: 노을 색 하늘만 돼도 OK / 🥇 보너스: 바위에 나나이트']],
          },
          {
            title: '노을빛',
            desc: '같은 각도로 「전 / 후」 스크린샷 비교',
            ms: [
              ['해 낮게 + 스카이 라이트', 'Directional Light 낮게 기울여 노을 색 + 스카이 라이트'],
              ['등대 Spot Light', '등대 꼭대기에 Spot Light → 바다 쪽으로'],
              ['모빌리티 Movable', '금요일에 불 켜는 연출을 할 거라서!'],
              ['전 / 후 스크린샷'],
            ],
            wrap: '저장',
          },
          [['🥇 보너스 · 바위에 나나이트'], ['나나이트 마스터하기 (8분)', '그래도 남으면 노션 다음 순서 · 자막 켜고']],
          [['언리얼 엔진 나나이트 마스터하기', YB('sxBxIaNl6cU')]]
        ),
        lang(true),
        dinner(),
        R('22:00', '23:00', 'music', '🎨 그림 (힐링) · 없으면 「노을 등대」 낙서'),
        webtoonRest(),
      ],

      /* ===== 금 · 🎬 비게임 언리얼·시네마틱 (레벨 4: 촬영 시작!) ===== */
      '2026-11-20': [
        ...morning(),
        T('10:30', '10:45', 'clang', '🔁 C 복습 + 퀴즈', {
          ms: [['Up&Down 다시 짜기', '10분 · 어제 Up&Down 안 보고 다시 짜기'], ['3일 퀴즈 · 화요일', 'int/float 차이, scanf에 & 붙이는 이유']],
        }),
        T('10:45', '11:45', 'clang', '⌨️ C 26~34강 · 함수', {
          desc: '나도코딩 섹션 5 (약 50분 추정)',
          ms: [['비밀번호 마스터'], ['계산기'], ['함수 형태'], ['반환값·전달값 4종류'], ['함수 계산기']],
          qs: ['같은 코드를 3번 복사 vs 함수로 만들기, 고칠 게 생기면 뭐가 더 편할까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('11:55', '12:25', 'clang', '🎮 C 미니게임 · 「등대지기의 밤」 완성', {
          desc: '지금까지 3개를 함수로 나눠 main에서 차례로 부르기 → 처음부터 끝까지 한 판! 🎉',
          ms: [['registerKeeper()'], ['drawLighthouse()'], ['findShip()'], ['처음부터 끝까지 한 판']],
        }),
        ...cBreaks(),
        T('12:35', '12:45', 'review', '🔁 어제 회상', { desc: '라이트 5종류 이름 + 하는 일 한 줄씩' }),
        T('12:45', '14:15', 'cine', '📺 강의A · 라이트 복습 + 시퀀서 (43분)', {
          desc: '노션 트윈모션 「0. 공통으로 들을 강의」에서 골랐어요',
          ms: [
            ['Starter Course 라이트', '1:41:26–1:55:01만 (14분, 어제 복습 겸) · 1:41:26 라이트 종류 → 1:49:21 ArchViz 루멘 라이팅'],
            ['시퀀스 · 타임라인', '1:00 새 시퀀스 → 시퀀서 화면 → 5:00 타임라인 설정'],
            ['카메라 컷 · 물체 이동', '7:00 카메라 컷·커브 → 8:00 장면 준비 → ⭐ 10:00 물체 움직이기 · ⏸️ 5분 쉬기'],
            ['키프레임 보간', '⭐ 13:00 키프레임 보간 → 14:00 여러 물체 → 17:00 다듬기'],
            ['카메라 움직이기', '⭐ 19:00 카메라 세팅·움직이기 → 22:00 카메라 컷 심화 → 26:00 미리보기·소리'],
          ],
          qs: [
            '어제 한국어 강의에서 배운 거랑 같은 점 1개, 새로 알게 된 점 1개는?',
            '키프레임 보간을 「직선」과 「곡선」으로 바꾸면 느낌이 어떻게 달라질까?',
            '물체를 움직이는 방법으로 등대 불빛의 밝기도 바꿀 수 있을까?',
          ],
          links: [
            ['UE5 Starter Course (1:41:26~)', YT('gQmiqmxJMtA')],
            ['Cinematic Cutscenes In UE5 | Sequencer', YT('4G8FQZQwOiw')],
          ],
        }),
        R('14:15', '14:45', 'tea', '🍪 간식 30분'),
        T('14:45', '16:15', 'cine', '📺 강의B · 렌더 + 시퀀스 애니 (19분 + 연습)', {
          ms: [
            ['Movie Render Queue (4분)', '0:09 기본 렌더 → 0:55 MRQ 설정 → 1:52 포맷 → 2:26 안티에일리어싱 → 3:31 해상도'],
            ['Animate a Sequence (15분)', '2:00 캐릭터 추가 → 4:00 카메라 추가 → ⭐ 6:00 캐릭터 움직이기 → 11:00 카메라 움직이기 → 12:00 카메라 전환'],
            ['밝기 키프레임 연습', '남는 시간 → 시퀀서에 Spot Light 넣고 밝기(Intensity) 0 → 높게 키프레임'],
          ],
          qs: ['기본 렌더와 MRQ 결과는 어디가 다를까?', '카메라 컷을 자르기 vs 하나를 계속 움직이기, 노을 영상엔 뭐가 어울릴까?'],
          links: [
            ['Movie Render Queue로 고화질 렌더', YT('OXxe_ZmwVUs')],
            ['How to Animate a Sequence in UE5', YT('DYf8i32aa8U')],
          ],
        }),
        ...tail(
          'cine',
          '빈 레벨에서 카메라 1대 · 키프레임 2개로 5초 영상 만들기',
          {
            title: '콘티 3컷',
            desc: '🎯 끝나면 보일 것: 「마지막에 등대 불이 켜지는 30초 mp4 파일」',
            ms: [['컷마다 네모 칸', '카메라 위치 · 움직임 화살표 · 길이(초)'], ['할 일 3개', '🥉 최소: 컷3만 10초여도 OK / 🥇 보너스: 파도 소리']],
          },
          {
            title: '30초 시네마틱',
            desc: '컷 3개 × 10초 → mp4',
            ms: [
              ['컷1 하늘 → 섬', '10초: 하늘에서 섬으로 천천히 내려오기'],
              ['컷2 길 따라 등대로', '10초: 길을 따라 등대로 올라가는 카메라'],
              ['컷3 불이 켜짐 ✨', '10초: Spot Light 밝기 키프레임 → 등대 불이 켜지며 바다를 비춤'],
              ['MRQ로 mp4 렌더'],
            ],
            wrap: '영상 파일 확인 + 저장',
          },
          [['🥇 보너스 · 파도 소리'], ['렌더 다듬기', '그래도 남으면 렌더 한 번 더 다듬기']]
        ),
        lang(false),
        dinner(),
        R('22:00', '23:00', 'nap', '🚿 머리감기 → 😴 일찍 취침'),
      ],

      /* ===== 토 · 🔁 밀린 강의 + 다듬기 (레벨 5: 보스전) ===== */
      '2026-11-21': [
        T('16:00', '16:30', 'clang', '🔁 C 복습 (1일 + 3일 퀴즈)', {
          ms: [['함수 3개 다시 짜기', '20분 · 어제 「등대지기의 밤」 함수 3개 안 보고 다시 짜기'], ['3일 퀴즈 · 수요일', 'for와 while은 언제 다르게 쓸까?']],
        }),
        T('16:30', '17:45', 'review', '📺 밀린 강의 (위에서부터 하나만)', {
          desc: '이번 주에 못 본 영상이 있으면 그것부터! 없으면 노션 레벨디자인 다음 순서 How to level design part 2 (32분)',
          ms: [
            ['못 본 영상 먼저'],
            ['레벨 문서 · 지도', '0:00 레벨 디자인 문서 → 1:38 레이아웃 지도 → 3:01 핵심 메커닉'],
            ['문 · 로직 · 짓기', '⏸️ 7:03 문 만들기 → 9:44 로직 다듬기 → 13:56 레벨 짓기'],
            ['플레이 흐름 · 분위기', '⭐ 18:56 플레이 흐름 테스트 → 22:10 조명·분위기 → 25:26 마무리'],
          ],
          qs: ['이 영상의 레벨 문서와 내 주간 기획서, 다른 점은?', '「잠긴 문」을 등대섬에 넣는다면 어디에 둘까?'],
          links: [['How to level design part 2', YB('n34hRnF5vGc')]],
        }),
        R('17:45', '17:55', 'stretch', '☕ 휴식'),
        T('17:55', '18:05', 'level', '🗒️ 기획 10분 · 다듬기 계획', { desc: '밀린 것 · 고칠 것 중 3개만 고르기' }),
        T('18:05', '19:15', 'level', '🏮 섬 다듬기', {
          desc: '밀린 「섬에 붙이기」가 있으면 그것부터 (순서: 등대 → 노을빛 → 영상)',
          ms: [['밀린 섬에 붙이기'], ['바위·풀 · 표지판', '없으면 → 바위·풀 몇 개 더 + 길 끝에 작은 표지판']],
        }),
        T('19:15', '19:45', 'level', '🧪 등대까지 3번 걸어보기', {
          desc: '처음부터 등대까지 3번 걸어보기 → 버그 · 어색한 곳 목록 적기',
          ms: [['1번째'], ['2번째'], ['3번째 · 버그 목록']],
          qs: ['처음 하는 사람도 등대까지 길을 안 잃고 갈까? 왜?'],
        }),
        T('19:45', '20:00', 'level', '✅ 저장'),
        dinner(),
        R('22:00', '23:00', 'music', '🎨 그림 (주말 힐링)'),
        webtoonRest(),
      ],

      /* ===== 일 · 🏁 완성 + 다음 주 기획 (레벨 6: 엔딩 크레딧) ===== */
      '2026-11-22': [
        T('17:00', '17:25', 'review', '🔁 주간 복습', {
          ms: [['3일 퀴즈 · 목요일', 'break와 continue 차이, switch는 언제 쓸까?'], ['이번 주 한 장 정리', 'C 4개 + 레벨디자인 · 블렌더 · 라이팅 · 시네마틱 마인드맵']],
          qs: ['아직 답을 못 찾은 🤔 질문이 있어? 다음 주에 어떻게 찾을까?'],
        }),
        T('17:25', '18:25', 'level', '🏁 마무리 · 완성!', {
          desc: '공부 보드의 「완성 기준」 카드 5개 체크 ✅',
          ms: [['큰 버그 2개 고치기'], ['30초 영상 최종 렌더'], ['스크린샷 3장', '블록아웃 · 노을 · 불 켜진 등대'], ['완성 기준 5개 체크']],
        }),
        R('18:25', '18:35', 'stretch', '☕ 휴식'),
        T('18:35', '18:45', 'review', '🪞 회고', {
          desc: '잘된 것 1 · 막힌 것 1 · 다음 주에 바꿀 것 1',
          qs: ['15분 기획을 한 날과 건너뛴 날, 만들기가 어떻게 달랐어?'],
        }),
        T('18:45', '19:15', 'review', '📐 다음 주 미니 프로젝트 기획서', {
          desc: '분야 후보: 🏃 애니메이션 (이번 주에 못 한 거!) · 머터리얼 · 랜드스케이프·PCG · 블루프린트',
          ms: [['💬 한 문장'], ['✏️ 완성 장면 스케치'], ['🧩 요일별 조각'], ['🚫 하지 않을 것 3개']],
        }),
        T('19:15', '20:00', 'review', '📅 다음 주 시간표', {
          desc: '「주간시간표_규칙.md」 + 기획서를 Claude에게 주고 「다음 주 시간표 짜줘」 (11/23부터 🏋️ 홈트 + 수·금 18:30 귀가!)',
          ms: [['밀린 체크박스 → 다음 주'], ['Claude에게 시간표 부탁'], ['C 다음 진도 확인', '섹션 6 배열 (36~42강)']],
        }),
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
