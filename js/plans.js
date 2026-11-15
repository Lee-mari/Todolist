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
  const lunch = () => R('12:40', '13:10', 'meal', '☕ 휴식 · 간단히 먹기');
  const dinner = () => R('20:30', '22:00', 'meal', '🍚 저녁');
  const webtoonRest = () => R('23:00', '00:00', 'game', '😌 웹툰 휴식 (공부 아님!)');
  const gugu = () => T('09:00', '09:10', 'review', '🔢 구구단', { desc: '아침 10분 몸풀기' });
  const lang = (jp) =>
    T('20:00', '20:30', jp ? 'jp' : 'eng', jp ? '🇯🇵 일본어' : '🇺🇸 영어', {
      desc: '집에서 30분. 스피킹 → 단어 → 필사 순서로 10분씩',
      ms: [['🗣️ 스피킹 10분'], ['📝 단어 10분'], ['✍️ 필사 10분']],
    });
  // 화~금 오후 뒷부분: 간식 → 따라하기 복습 → 기획 15분 → 섬에 붙이기 → 정리
  const tail = (subj, redo, plan, build) => [
    R('16:35', '16:50', 'tea', '🍪 간식'),
    T('16:50', '17:15', subj, '🔁 따라하기 복습 (영상 끄고!)', { desc: redo }),
    T('17:15', '17:30', subj, `🗒️ 기획 15분 · ${plan.title}`, { desc: plan.desc, ms: plan.ms }),
    T('17:30', '18:20', subj, `🏮 섬에 붙이기 · ${build.title}`, { desc: build.desc, ms: build.ms }),
    R('18:20', '18:30', 'stretch', '☕ 휴식'),
    T('18:30', '19:00', subj, '✅ 정리 · 저장', { desc: build.wrap, ms: [['스크린샷·저장'], ['🤔 질문 1개 3줄 답', '오늘 🤔 질문 중 하나를 골라 3줄로 답 쓰기']] }),
    R('19:00', '20:00', 'walk', '🚶 귀가 · 휴식'),
  ];

  const W47 = {
    id: '2026-11-w3',
    ws: '2026-11-16',
    name: '🎮 11월 3주차 공부 퀘스트',
    goal: '🏮 노을 등대섬 + 30초 시네마틱',
    strip: [['🗺️ 레벨디자인', 'green'], ['🧊 블렌더', 'coral'], ['💡 라이팅', 'orange'], ['🏃 애니메이션', 'purple'], ['🎬 시네마틱', 'rose'], ['🔁 다듬기', 'gray'], ['🏁 완성', 'pink']],
    subjects: [
      { id: 'clang', name: 'C언어', color: 'blue', icon: 'code' },
      { id: 'level', name: '레벨디자인', color: 'green', icon: 'layout' },
      { id: 'blender', name: '블렌더', color: 'coral', icon: 'box' },
      { id: 'light', name: '라이팅', color: 'orange', icon: 'sun' },
      { id: 'anim', name: '애니메이션', color: 'purple', icon: 'node' },
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
        '시작 지점 → 등대까지 걸어갈 수 있음',
        '블렌더로 만든 등대가 섬 위에 서 있음',
        '노을 하늘 + 등대 불빛이 보임',
        '걷기·뛰기 + E키 「불 켜기」 동작',
        '30초 영상 파일(mp4) 1개',
        'C 「등대지기의 밤」 끝까지 실행',
      ],
      memo: '🗺️ 레벨: 바다 위 작은 섬, 언덕 위 등대까지 길을 따라 걸어 올라가요.\n🧍 플레이: 등대 앞에서 E키 → 「불 켜기」 → 등대 불이 켜짐 ✨\n🌅 분위기: 노을 하늘 + 등대 불빛이 바다를 비춤\n🎬 영상: 하늘에서 섬 훑기 → 캐릭터 걷기 → 등대 불 켜짐 (30초)\n⌨️ C 버전: 콘솔 게임 「등대지기의 밤」',
    },
    dayGoals: {
      '2026-11-16': '등대섬 기획서 + 블록아웃 (시작점에서 등대가 보이게)',
      '2026-11-17': '블렌더 등대를 섬 위에 세우기',
      '2026-11-18': '노을빛 + 등대 꼭대기 불빛',
      '2026-11-19': '걷기↔뛰기 + E키로 불 켜기',
      '2026-11-20': '30초 등대섬 영상 mp4 렌더',
      '2026-11-21': '밀린 것 처리 + 3번 플레이 테스트',
      '2026-11-22': '완성 기준 6개 체크 + 다음 주 기획서',
    },
    days: {
      /* ===== 월 · 🗺️ 레벨디자인 (레벨 1: 섬 땅 고르기) ===== */
      '2026-11-16': [
        gugu(),
        T('11:00', '11:15', 'clang', '🔁 C 기억 점검', { desc: '예전에 배운 switch · if를 백지에 써보기' }),
        T('11:15', '12:15', 'clang', '⌨️ C 1~9강 · 변수·입출력', {
          desc: '나도코딩 섹션 1~2',
          ms: [['환경설정'], ['정수·실수 변수'], ['상수'], ['printf'], ['scanf']],
          qs: ['int와 float는 각각 어떤 숫자를 담을까? 나이는 어느 쪽?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('12:15', '12:40', 'clang', '🎮 C 미니게임 · 등대지기 등록증', {
          desc: '이름 · 나이 · 좋아하는 바다 생물을 scanf로 받아 등록증처럼 출력',
          ms: [['scanf로 3개 입력받기'], ['등록증 모양 출력'], ['저장', 'lighthouse_c 폴더에 저장']],
        }),
        lunch(),
        T('13:10', '13:20', 'level', '📜 이번 주 퀘스트 읽기', { desc: '맨 위 「이번 주 목표」 · 완성 기준 6개 읽기 (공부 보드에 있어요)' }),
        T('13:20', '14:50', 'level', '📺 레벨디자인 강의 4개 (51분)', {
          desc: '영상마다 🤔 질문을 먼저 읽고 보기!',
          ms: [
            ['시선유도 법칙 (9분)', '⭐ 3:09 목표를 살짝 보여주는 기법 → 5:35 엘든링 사례'],
            ['How to practice (16분)', '⭐ 3:00 장면 배치 프로토타입 → 6:00 캐릭터로 걸어보기 → 12:00 빛으로 길 안내'],
            ['Blocking Out 3가지 (13분)', '0:59 BSP 브러시 → 3:37 모델링 모드 → 10:16 모듈러 메시'],
            ['Cube Grid (13분)', '0:20 첫 세팅 → ⭐ 5:00 도구 기초 → 10:00 환경 만들기'],
          ],
          qs: [
            '등대는 「크기 인력」일까, 「목적 인력」일까? 둘 다라면 왜?',
            '등대를 살짝만 보여주려면 뭘 가릴까?',
            '꾸미기 전에 캐릭터로 먼저 걸어보는 이유는?',
            '세 블록아웃 방법 중 등대섬엔 뭐가 제일 빠를까?',
            'Cube Grid로 언덕을 만들면 좋은 점·아쉬운 점은?',
          ],
          links: [
            ['야숨·엘든링 시선유도 법칙', YT('eO8CyODLbsM')],
            ['How to practice level design', YT('0AWSxaQSZZE')],
            ['3 Methods for Blocking Out', YT('ZfalgxLtNyI')],
            ['Cube Grid 프로토타입', YB('zo8VY8qU3PU')],
          ],
        }),
        R('14:50', '15:05', 'stretch', '☕ 휴식'),
        T('15:05', '15:35', 'level', '📐 주간 기획 30분 · 이번 주 설계도', {
          desc: '한 문장: 「노을 질 때 등대까지 걸어가 불을 켜는 섬」',
          ms: [
            ['완성 장면 스케치', '불 켜진 등대 + 노을, 1장'],
            ['섬 지도', '시작점 · 길 · 언덕 · 등대 · 「등대가 살짝 보이는 지점」 표시'],
            ['하지 않을 것 3개', '예: 전투 ✕, 인벤토리 ✕, 날씨 변화 ✕'],
            ['오늘 할 일 3개', '🥉 최소 목표: 섬 바닥 + 등대 자리만 있어도 OK'],
          ],
        }),
        T('15:35', '16:35', 'level', '🏮 섬에 붙이기 · 블록아웃', {
          desc: '시작 지점에서 등대가 보이는지가 핵심 👀',
          ms: [
            ['LighthouseIsland 프로젝트', 'Third Person 템플릿으로 새 프로젝트'],
            ['섬 바닥·언덕·길', 'Cube Grid로 섬 바닥 + 언덕 + 구불구불한 길'],
            ['임시 등대 원기둥', '등대 자리에 큰 원기둥 → 시작점에서 보이는지 확인'],
          ],
        }),
        T('16:35', '17:00', 'level', '✅ 정리', { desc: '약속 전에 마무리', ms: [['스크린샷 2장'], ['🤔 질문 1개 3줄 답']] }),
        R('17:00', '20:00', 'free', '🥳 약속'),
        T('20:00', '20:30', 'eng', '🇺🇸 단어만 10분 (선택)', { desc: '귀가 후 여유 있으면' }),
        dinner(),
        R('22:00', '23:00', 'free', '🛋️ 쉬기'),
        webtoonRest(),
      ],

      /* ===== 화 · 🧊 블렌더 (레벨 2: 등대 세우기) ===== */
      '2026-11-17': [
        gugu(),
        T('11:00', '11:15', 'clang', '🔁 C 복습 (1일)', { desc: '어제 「등록증」 안 보고 다시 짜기' }),
        T('11:15', '12:15', 'clang', '⌨️ C 11~18강 · 반복문', {
          desc: '나도코딩 섹션 3',
          ms: [['증감연산'], ['for'], ['while · do while'], ['이중 반복문', '구구단 · 거꾸로 별']],
          qs: ['구구단을 코드로 짠다면, 바깥 for와 안쪽 for는 각각 무엇을 셀까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('12:15', '12:40', 'clang', '🎮 C 미니게임 · 등대 그리기', {
          desc: '이중 for문으로 * 등대 모양 + 아래에 ~ 바다 출력',
          ms: [['* 등대 모양'], ['~ 바다'], ['저장']],
        }),
        lunch(),
        T('13:10', '13:20', 'review', '🔁 어제 회상', { desc: '시선유도 핵심 3줄 백지에 쓰기' }),
        T('13:20', '14:50', 'blender', '📺 블렌더 기초 영상 5개 (71분)', {
          desc: '노션 「1단계: 설치와 기본 조작」 순서',
          ms: [
            ['블렌더 설치 AtoZ (9분)', '0:33 LTS 뜻 → 4:37 컴퓨터 사양 → 6:50 처음 설정'],
            ['기초 강의 part 01 (17분)', '앞부분: 화면 구성 · 시점 조작 → 뒷부분: 기초 모델링'],
            ['싹 다 정리한 기초 (27분)', '⭐ 12:12 우유곽 모델링 → 13:32 채색 (등대 만들 때 쓸 거!)'],
            ['폴리 헤븐 (5분)', '2:17 HDRI → 3:31 텍스처 → 4:22 모델'],
            ['블렌더 마켓 (13분)', '2:18 에셋 종류 → 6:09 애드온 → 7:33 모델·재질'],
          ],
          qs: [
            '최신 버전 대신 LTS를 고르면 좋은 점은?',
            '마우스 가운데 버튼으로 할 수 있는 걸 몇 개 찾았어?',
            '우유곽에서 쓴 기술 중 등대에도 쓸 수 있는 건?',
            '폴리 헤븐(무료)과 블렌더 마켓(유료) 중 등대섬엔 뭘 쓸까?',
          ],
          links: [
            ['블렌더 설치하기 AtoZ', YT('0DZTq6PaZAY')],
            ['블렌더 기초 강의 part 01', YT('IHNGcaQiEr0')],
            ['귀찮아서 싹 다 정리한 블렌더 기초', YT('gVteZaQGry0')],
            ['폴리 헤븐', YB('ZCHFEM-KO28')],
            ['블렌더 마켓', YB('Gw9ITvudeeA')],
          ],
        }),
        R('14:50', '15:05', 'stretch', '☕ 휴식'),
        T('15:05', '16:35', 'blender', '🧊 마스터클래스 0:00–43:48 따라 하기', {
          desc: '블렌더3D 4.x 입문자 종합 마스터클래스 앞부분 (43:48 쉐이더부터는 토요일)',
          ms: [
            ['기본조작 · 객체 편집', '0:31 기본조작 → 2:03 화면창 → 4:45 객체 생성·편집'],
            ['오리진 · 피벗', '9:59 아웃라이너 → ⭐ 11:49 오리엔테이션·3D커서·오리진·피벗'],
            ['스냅 · 복제 · 콜렉션', '15:43 스냅·비례편집·복제 → 18:33 콜렉션 → 20:14 뷰포트 오버레이 · ⏸️ 여기서 5분 쉬기'],
            ['모델링 · 모디파이어', '⭐ 21:35 모델링 기능 → 29:30 모디파이어 → 35:17 스무스 쉐이딩'],
            ['스컵팅', '37:10 스컵팅 → 41:06 스컵팅 방식'],
          ],
          qs: ['오리진이 엉뚱한 곳에 있으면 등대를 돌릴 때 무슨 일이 생길까?', '모디파이어를 쓰면 왜 「되돌리기 쉬운」 모델링이 될까?'],
          links: [['블렌더3D 4.x 입문자 마스터클래스', YT('2bXq_6QZ_4o')]],
        }),
        ...tail(
          'blender',
          '새 파일에서 돌출(E) · 루프컷(Ctrl+R)으로 컵 하나 만들기',
          {
            title: '등대 설계도',
            desc: '🎯 끝나면 보일 것: 「섬 위에 빨강·흰색 등대가 서 있다」',
            ms: [['정면 그림', '몸통 · 불빛 방 · 지붕 + 대충 크기 비율 (예: 6 : 1 : 1)'], ['할 일 3개', '🥉 최소: 원기둥 몸통만 언리얼에 들어가도 OK / 🥇 보너스: 난간·창문']],
          },
          {
            title: '등대 만들기',
            desc: '블렌더 등대 → 언리얼 섬 위로',
            ms: [['몸통·불빛 방·지붕', '원기둥 3개로 몸통 · 불빛 방 · 지붕(원뿔)'], ['빨강·흰 줄무늬 재질', '재질 2개'], ['FBX → 언리얼 교체', 'FBX 내보내기 → 언리얼로 가져오기 → 임시 원기둥 자리에 교체']],
            wrap: '스크린샷 + .blend 저장',
          }
        ),
        lang(true),
        dinner(),
        T('22:00', '23:00', 'toon', '📖 웹툰 분석 #1', { desc: '한 화의 시선 흐름 화살표 그리기 + 좋았던 연출 3개', ms: [['시선 흐름 화살표'], ['좋았던 연출 3개']] }),
        webtoonRest(),
      ],

      /* ===== 수 · 💡 라이팅·루멘 (레벨 3: 노을 켜기) ===== */
      '2026-11-18': [
        gugu(),
        T('11:00', '11:15', 'clang', '🔁 C 복습 (1일)', { desc: '어제 「등대 그리기」 안 보고 다시 출력' }),
        T('11:15', '12:05', 'clang', '⌨️ C 20~24강 · 조건문', {
          desc: '나도코딩 섹션 4',
          ms: [['Up&Down'], ['if else'], ['break / continue'], ['and / or'], ['switch']],
          qs: ['if를 여러 개 쓰는 것과 switch, 언제 뭐가 더 읽기 쉬울까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('12:05', '12:40', 'clang', '🎮 C 미니게임 · 배 신호 Up&Down', {
          desc: 'rand로 배 위치(1~100) 숨기기 → 5번 안에 맞히기 → 맞히면 switch로 신호 색 고르기',
          ms: [['rand로 숨기기'], ['5번 안에 맞히기'], ['switch 신호 색'], ['저장']],
        }),
        lunch(),
        T('13:10', '13:20', 'review', '🔁 어제 회상', { desc: '블렌더 단축키 5개 백지에 쓰기' }),
        T('13:20', '14:50', 'light', '📺 입문 05강 Light & Lumen (54분)', {
          desc: '노션 「1. 루멘 → 2. 나나이트 → 3. 라이팅」 순서. 따라 하며 보기',
          ms: [
            ['포인트 라이트', '0:44 포인트 라이트 + 디테일 패널'],
            ['스포트 라이트', '⭐ 9:29 스포트 라이트 (등대 불빛!) → 13:38 라이트 함수 머티리얼 · ⏸️ 여기서 5분 쉬기'],
            ['디렉셔널 · 스카이', '23:38 렉트 라이트 → ⭐ 27:53 디렉셔널 라이트 (해!) → 32:04 스카이 라이트'],
            ['모빌리티 · 루멘 · 색', '34:50 모빌리티 → 42:14 루멘 → 48:10 채도·명도·명암·유사색'],
          ],
          qs: ['노을은 5가지 라이트 중 어떤 걸로 만들까? 등대 불빛은?', '노을을 더 따뜻하게 보이려면 채도·명도를 어떻게 바꿀까?'],
          links: [['언리얼엔진5 입문 05강 Light & Lumen', YT('azMt_FmoXDg')]],
        }),
        R('14:50', '15:05', 'stretch', '☕ 휴식'),
        T('15:05', '16:35', 'light', '💡 나나이트 · 라이팅 영상 5개 (50분)', {
          ms: [
            ['나나이트 정ㅋ벅ㅋ (14분)', '나나이트가 뭔지 → 왜 좋은지 → 한계는 뭔지, 세 덩어리로 메모'],
            ['나나이트 마스터하기 (8분)', '자막 켜고 보기'],
            ['입문 04강 Nanite (11분)', '0:00 에셋 가져오기 → ⭐ 6:22 나나이트 켜기'],
            ['Clean Lumen (11분)', '1:05 루멘 설정 → 3:20 포스트 프로세스 볼륨 → 5:00 빛 깜빡임 고치기'],
            ['메가 라이트 (6분)', '5.5 이상에서 그림자 라이트를 많이 쓰는 법'],
          ],
          qs: [
            'LOD를 직접 만들 때 뭐가 불편할까? 나나이트는 어떻게 해결할까?',
            '포스트 프로세스 볼륨은 화면에 무슨 일을 할까?',
            '등대섬에 라이트를 몇 개 쓸 거야? 메가 라이트가 필요할까?',
          ],
          links: [
            ['LOD, 노말맵 왜 씀? 나나이트 정ㅋ벅ㅋ', YB('e-XFHcD7ibA')],
            ['언리얼 엔진 나나이트 마스터하기', YB('sxBxIaNl6cU')],
            ['입문 04강 Nanite', YT('ojloZS8dXGY')],
            ['How to Get Clean Lumen Lighting', YT('wOx_jPKWYCE')],
            ['4분 만에 알아보는 메가 라이트', YB('UiCBSCOEIq0')],
          ],
        }),
        ...tail(
          'light',
          '빈 레벨에 해 · 하늘빛 · 안개 넣고 낮 → 밤 바꿔보기',
          {
            title: '노을 무드보드',
            desc: '🎯 끝나면 보일 것: 「주황빛 노을 + 바다를 비추는 등대 불」',
            ms: [['노을 사진 2장 · 색 3개', '하늘 · 바다 · 등대불 색 고르기'], ['해 각도 그림', '어느 쪽에서 얼마나 낮게?'], ['할 일 3개', '🥉 최소: 노을 색 하늘만 돼도 OK / 🥇 보너스: 안개']],
          },
          {
            title: '노을빛',
            desc: '같은 각도로 「전 / 후」 스크린샷 비교',
            ms: [['해를 낮게 · 노을 색', 'Directional Light 낮게 기울이기'], ['등대 Spot Light', '등대 꼭대기에 Spot Light → 바다 쪽으로'], ['바위에 나나이트'], ['전 / 후 스크린샷']],
            wrap: '저장',
          }
        ),
        lang(false),
        dinner(),
        R('22:00', '23:00', 'free', '🚿 머리감기'),
        webtoonRest(),
      ],

      /* ===== 목 · 🏃 애니메이션 (레벨 4: 등대지기 움직이기) ===== */
      '2026-11-19': [
        gugu(),
        T('11:00', '11:15', 'clang', '🔁 C 복습 (1일 + 3일 퀴즈)', {
          desc: '어제 Up&Down 안 보고 다시 짜기 + 월요일 퀴즈',
          ms: [['Up&Down 다시 짜기', '10분'], ['3일 퀴즈 · 월요일', 'int/float 차이, scanf에 & 붙이는 이유']],
        }),
        T('11:15', '12:15', 'clang', '⌨️ C 26~34강 · 함수', {
          desc: '나도코딩 섹션 5',
          ms: [['비밀번호 마스터'], ['함수 형태'], ['반환값·전달값 4종류'], ['함수 계산기']],
          qs: ['같은 코드를 3번 복사 vs 함수로 만들기, 고칠 게 생기면 뭐가 편할까?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('12:15', '12:40', 'clang', '🎮 C 미니게임 · 등대지기 리팩토링', {
          desc: '지금까지 3개를 함수로 나눠 main에서 차례로 부르기',
          ms: [['registerKeeper()'], ['drawLighthouse()'], ['findShip()'], ['main에서 차례로 · 저장']],
        }),
        lunch(),
        T('13:10', '13:20', 'review', '🔁 어제 회상', { desc: '루멘 · 나나이트가 뭔지 한 줄씩 쓰기' }),
        T('13:20', '14:50', 'anim', '📺 애니메이션 블루프린트 3개 (45분)', {
          desc: '오늘 영상은 챕터가 없어서 설명 보고 나눴어요',
          ms: [
            ['State Machine (23분)', '애님 BP가 뭔지 → Event Graph → Anim Graph → ⭐ State Machine으로 달리기'],
            ['Blend Space 1D (11분)', '속력에 따라 걷기↔뛰기 섞기 → Transition Duration → 가속·감속 값'],
            ['Blend Space 2D (11분)', '속력 + 방향(Direction) 두 가지로 섞기'],
          ],
          qs: [
            'Event Graph와 Anim Graph는 각각 무슨 일을 할까?',
            '가속도 값을 크게 하면 등대지기가 어떤 느낌으로 변할까?',
            '1D와 2D는 언제 다르게 쓸까? 등대섬엔 뭐가 맞을까?',
          ],
          links: [
            ['개요와 State Machine', YB('frxyOxsk9OU')],
            ['Blend Space 1D', YB('kVhgM8MEXJE')],
            ['Blend Space 2D', YB('Qg0E6c4O9VQ')],
          ],
        }),
        R('14:50', '15:05', 'stretch', '☕ 휴식'),
        T('15:05', '16:35', 'anim', '🏃 몽타주 · 모션매칭 (28분 + 연습)', {
          ms: [
            ['⭐ Anim Montage (11분)', '「불 켜기」에 쓸 거예요. 몽타주 → Slot 노드 → Layered Blend Per Bone(상하체 분리)'],
            ['Motion Matching 001 (6분)', '샘플 프로젝트 · 플러그인 · 애니메이션 세팅'],
            ['Motion Matching 002 (11분)', '이동할 때 애니메이션 재생하기'],
          ],
          qs: [
            'Slot 노드가 없으면 몽타주가 왜 안 나올까?',
            '걸으면서 불을 켜려면 상하체를 나눠야 할까, 멈춰서 켜도 될까?',
            'State Machine이 「내가 규칙을 정해주는 것」이면, Motion Matching은?',
          ],
          links: [
            ['Anim Montage, 상하체 분리', YB('_swbluqBxn4')],
            ['Motion Matching 001 프로젝트 준비', YB('6UzLRd3xK0U')],
            ['Motion Matching 002 기본 애니메이션', YB('rEimatpnaMM')],
          ],
        }),
        ...tail(
          'anim',
          '새 애님 BP에서 Idle → Walk → Run Blend Space 1D 다시 만들기',
          {
            title: '불 켜기 순서도',
            desc: '🎯 끝나면 보일 것: 「등대 앞에서 E → 손 뻗기 → 불 켜짐」',
            ms: [['화살표 순서도', '트리거 들어감 → E키 → 몽타주 → ? → Spot Light 켜짐 (빈칸 채우기!)'], ['부품 리스트 + 할 일 3개', '🥉 최소: E 누르면 불만 켜져도 OK / 🥇 보너스: 천천히 밝아지기']],
          },
          {
            title: '불 켜기 동작',
            desc: '등대 앞 E키 → 몽타주 → 불 켜짐 💡',
            ms: [['걷기·뛰기 Blend Space', '캐릭터에 적용'], ['트리거 + E키 → 몽타주', '등대 앞 트리거 박스'], ['몽타주 끝 → 불 켜기', '어제 단 Spot Light 켜기']],
            wrap: '저장 + 10초 화면 녹화 (내일 시네마틱 참고용)',
          }
        ),
        lang(true),
        dinner(),
        R('22:00', '23:00', 'music', '🎨 그림 (힐링)'),
        webtoonRest(),
      ],

      /* ===== 금 · 🎬 트윈모션·시네마틱 (레벨 5: 촬영 시작!) ===== */
      '2026-11-20': [
        gugu(),
        T('11:00', '11:15', 'clang', '🔁 C 복습 (1일 + 3일 퀴즈)', {
          desc: '함수 표 그리기 + 화요일 퀴즈',
          ms: [['함수 4종류 표', '반환값 ○✕ × 전달값 ○✕'], ['3일 퀴즈 · 화요일', 'for와 while은 언제 다르게 쓸까?']],
        }),
        T('11:15', '12:15', 'clang', '⌨️ C 36~41강 · 배열', {
          desc: '나도코딩 섹션 6',
          ms: [['아빠는 대머리'], ['배열 기초 · 값 설정'], ['문자 vs 문자열'], ['아스키 코드']],
          qs: ['배열은 왜 0번부터 시작할까? light[8]의 마지막 칸 번호는?'],
          links: [['나도코딩 C 프로그래밍', NADO]],
        }),
        T('12:15', '12:40', 'clang', '🎮 C 미니게임 · 등대 불빛 패턴', {
          desc: '배열 light[8] = {1,0,1,1,0,1,0,0}을 ●○로 출력 → 「등대지기의 밤」 처음부터 끝까지 한 판! 🎉',
          ms: [['●○로 출력'], ['처음부터 끝까지 한 판'], ['저장']],
        }),
        lunch(),
        T('13:10', '13:20', 'review', '🔁 어제 회상', { desc: 'State Machine · Blend Space · 몽타주 차이 한 줄씩' }),
        T('13:20', '14:50', 'cine', '📺 시퀀서 강의 (29분) 따라 하기', {
          desc: 'How To Create Cinematic Cutscenes In UE5',
          ms: [
            ['새 시퀀스 · 타임라인', '1:00 새 시퀀스 → 시퀀서 화면 → 5:00 타임라인 설정'],
            ['카메라 컷 · 물체 이동', '7:00 카메라 컷·커브 → 8:00 장면 준비 → 10:00 물체 움직이기 · ⏸️ 여기서 5분 쉬기'],
            ['키프레임 보간', '⭐ 13:00 키프레임 보간 → 14:00 여러 물체 → 17:00 다듬기'],
            ['카메라 움직이기', '⭐ 19:00 카메라 세팅·움직이기 → 22:00 카메라 컷 심화 → 26:00 미리보기·소리'],
          ],
          qs: ['키프레임 보간을 「직선」과 「곡선」으로 바꾸면 느낌이 어떻게 달라질까?', '컷을 자르는 것 vs 카메라 하나를 계속 움직이기, 노을 영상엔?'],
          links: [['Cinematic Cutscenes In UE5 | Sequencer', YT('4G8FQZQwOiw')]],
        }),
        R('14:50', '15:05', 'stretch', '☕ 휴식'),
        T('15:05', '16:35', 'cine', '🎬 시퀀스 · 렌더 (19분 + 연습)', {
          ms: [
            ['Animate a Sequence (15분)', '2:00 캐릭터 추가 → ⭐ 6:00 캐릭터 움직이기 → 11:00 카메라 움직이기 → 12:00 카메라 전환'],
            ['Movie Render Queue (4분)', '0:55 MRQ 설정 → 1:52 포맷 → 2:26 안티에일리어싱 → 3:31 해상도'],
            ['카메라 움직임 따라 하기', '남는 시간 → 마음에 든 카메라 움직임 1개'],
          ],
          qs: ['어제 만든 「불 켜기」 몽타주를 시퀀서에 넣으려면 어느 트랙?', '기본 렌더와 MRQ 결과는 어디가 다를까?'],
          links: [
            ['How to Animate a Sequence in UE5', YT('DYf8i32aa8U')],
            ['Movie Render Queue로 고화질 렌더', YT('OXxe_ZmwVUs')],
          ],
        }),
        ...tail(
          'cine',
          '빈 레벨에서 카메라 1대 · 키프레임 2개로 5초 영상 만들기',
          {
            title: '콘티 3컷',
            desc: '🎯 끝나면 보일 것: 「30초 mp4 파일 1개」',
            ms: [['컷마다 네모 칸', '카메라 위치 · 움직임 화살표 · 길이(초)'], ['할 일 3개', '🥉 최소: 컷3만 10초여도 OK / 🥇 보너스: 파도 소리']],
          },
          {
            title: '30초 시네마틱',
            desc: '컷 3개 × 10초 → mp4',
            ms: [['컷1 하늘 → 섬', '10초: 하늘에서 섬으로 천천히 내려오기'], ['컷2 걸어서 등대로', '10초: 캐릭터가 길을 걸어 등대로'], ['컷3 불이 켜짐 ✨', '10초: 등대 불이 켜지며 바다를 비춤'], ['MRQ로 mp4 렌더']],
            wrap: '영상 파일 확인 + 저장',
          }
        ),
        lang(false),
        dinner(),
        R('22:00', '23:00', 'nap', '🚿 머리감기 → 😴 일찍 취침'),
      ],

      /* ===== 토 · 🔁 밀린 강의 + 다듬기 (레벨 6: 보스전) ===== */
      '2026-11-21': [
        T('16:00', '16:30', 'clang', '🔁 C 복습 (1일 + 3일 퀴즈)', {
          ms: [['불빛 패턴 다시 짜기', '어제 「불빛 패턴」 배열 안 보고 다시 짜기 (20분)'], ['3일 퀴즈 · 수요일', 'break와 continue 차이, switch는 언제 쓸까?']],
        }),
        T('16:30', '17:45', 'review', '📺 밀린 강의 (위에서부터 하나만)', {
          desc: '이번 주에 못 본 영상이 있으면 그것부터! 없으면 블렌더 마스터클래스 43:48~끝 (33분)',
          ms: [
            ['못 본 영상 먼저'],
            ['쉐이더 · 텍스처 · UV', '43:48 쉐이더·재질 → 47:59 텍스처 → 49:06 노드 블렌딩 → 50:43 UV → 53:06 텍스처 페인팅'],
            ['라이팅 · 애니 · 렌더', '54:24 라이팅 → 1:01:41 애니메이션 → 1:10:31 렌더링'],
          ],
          qs: ['블렌더 라이팅과 수요일에 배운 언리얼 라이팅, 비슷한 점 1개는?'],
          links: [['블렌더 마스터클래스 (43:48~)', YT('2bXq_6QZ_4o')]],
        }),
        R('17:45', '18:00', 'stretch', '☕ 휴식'),
        T('18:00', '18:10', 'level', '🗒️ 기획 10분 · 다듬기 계획', { desc: '밀린 것 · 고칠 것 중 3개만 고르기' }),
        T('18:10', '19:15', 'level', '🏮 섬 다듬기', {
          desc: '밀린 「섬에 붙이기」가 있으면 그것부터 (순서: 등대 → 노을빛 → 불 켜기 → 영상)',
          ms: [['밀린 섬에 붙이기'], ['바위·풀 · 표지판', '없으면 → 바위·풀 몇 개 더 + 길 끝에 작은 표지판']],
        }),
        T('19:15', '19:45', 'level', '🧪 플레이 테스트 3번', {
          desc: '처음부터 등대 불 켜기까지 3번 플레이 → 버그 목록 적기',
          ms: [['1번째 플레이'], ['2번째 플레이'], ['3번째 · 버그 목록']],
          qs: ['처음 하는 사람도 등대까지 길을 안 잃고 갈까? 왜?'],
        }),
        T('19:45', '20:00', 'level', '✅ 저장'),
        dinner(),
        R('22:00', '23:00', 'music', '🎨 그림 (주말 힐링)'),
        webtoonRest(),
      ],

      /* ===== 일 · 🏁 완성 + 다음 주 기획 (레벨 7: 엔딩 크레딧) ===== */
      '2026-11-22': [
        T('17:00', '17:25', 'review', '🔁 주간 복습', {
          ms: [['3일 퀴즈 · 목요일', '함수를 쓰면 뭐가 좋아? 말로 설명하기'], ['이번 주 한 장 정리', 'C 5개 + 레벨디자인 · 블렌더 · 라이팅 · 애니메이션 · 시네마틱 마인드맵']],
          qs: ['아직 답을 못 찾은 🤔 질문이 있어? 다음 주에 어떻게 찾을까?'],
        }),
        T('17:25', '18:25', 'level', '🏁 마무리 · 완성!', {
          desc: '공부 보드의 「완성 기준」 카드 6개 체크 ✅',
          ms: [['큰 버그 2개 고치기'], ['30초 영상 최종 렌더'], ['스크린샷 3장', '블록아웃 · 노을 · 불 켜진 등대'], ['완성 기준 6개 체크']],
        }),
        R('18:25', '18:30', 'stretch', '☕ 휴식'),
        T('18:30', '18:45', 'review', '🪞 회고', {
          desc: '잘된 것 1 · 막힌 것 1 · 다음 주에 바꿀 것 1',
          qs: ['매일 15분 기획한 날과 밀린 날, 만들기가 어떻게 달랐어?'],
        }),
        T('18:45', '19:15', 'review', '📐 다음 주 미니 프로젝트 기획서', {
          desc: '분야 후보: 머터리얼 · 랜드스케이프·PCG · VFX · 블루프린트 · 웹툰·일러',
          ms: [['💬 한 문장'], ['✏️ 완성 장면 스케치'], ['🧩 요일별 조각'], ['🚫 하지 않을 것 3개']],
        }),
        T('19:15', '20:00', 'review', '📅 다음 주 시간표', {
          desc: '「주간시간표_규칙.md」 + 기획서를 Claude에게 주고 「다음 주 시간표 짜줘」 (11/23부터 🏋️ 홈트 시작!)',
          ms: [['밀린 체크박스 → 다음 주'], ['Claude에게 시간표 부탁'], ['C 다음 진도 확인', '섹션 7 포인터 (43~52강)']],
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
    if (p.board && !S.board.some((c) => c.planId === p.id)) {
      S.board.filter((c) => c.status === 'todo').forEach((c) => (c.order = (c.order || 0) + 1));
      S.board.push({
        id: SQ.uid(), planId: p.id, title: p.board.title, subjectId: p.board.subjectId, status: 'todo', due: lastDay(p), repeat: '',
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
      SQ.ui.selDate = SQ.today() >= p.ws ? SQ.today() : p.ws;
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
        <p class="confirm-msg">이 주에 벌써 일정이 ${existing}개 있어요. 어떻게 넣을까요?</p>
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
    const strip = Object.keys(p.days)
      .map((k, i) => {
        const [lab, color] = p.strip[i];
        return `<li style="${SQ.cvar(color)}"><b>${SQ.DOW[SQ.dow(k)]} ${SQ.pkey(k).getDate()}</b><span>${esc(lab)}</span></li>`;
      })
      .join('');
    return `
    <section class="plan-banner">
      <div class="pb-top">
        <span class="pb-ic" aria-hidden="true">📥</span>
        <div class="pb-txt">
          <small>${SQ.today() < p.ws ? '다음 주' : '이번 주'} 시간표가 준비됐어요 · ${SQ.weekRange(p.ws)}</small>
          <h3>${esc(p.name)}</h3>
          <p>목표 「${esc(p.goal)}」 · 공부 ${c.task}개 · 휴식 ${c.rest}개 · 영상 링크·이정표·질문까지 다 들어가요</p>
        </div>
        <div class="pb-act">
          <button class="btn primary" data-act="importPlan" data-plan="${p.id}">${icon('download', 16)} 시간표 넣기</button>
          <button class="icon-btn" data-act="hidePlan" data-plan="${p.id}" aria-label="알림 숨기기" title="숨기기">${icon('x', 16)}</button>
        </div>
      </div>
      <ol class="pb-days">${strip}</ol>
    </section>`;
  };
})();
