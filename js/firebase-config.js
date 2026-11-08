/*
 * Google 로그인 · 기기 간 동기화 설정 (Firebase)
 *
 * 비워 두면 동기화 없이 이 브라우저에만 저장돼요.
 * Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)의 firebaseConfig 값을 그대로 붙여 넣으면 켜져요.
 * 이 값들은 공개되어도 괜찮아요. 데이터 보호는 Firestore 보안 규칙이 맡아요 (README 참고).
 *
 * 예)
 * window.SQ_FIREBASE_CONFIG = {
 *   apiKey: "AIza...",
 *   authDomain: "my-project.firebaseapp.com",
 *   projectId: "my-project",
 *   storageBucket: "my-project.appspot.com",
 *   messagingSenderId: "1234567890",
 *   appId: "1:1234567890:web:abcdef"
 * };
 */
window.SQ_FIREBASE_CONFIG = null;
