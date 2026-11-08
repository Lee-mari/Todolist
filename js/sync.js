/* Study Quest — Google 로그인 · 기기 간 동기화 (Firebase Auth + Firestore) */
(function () {
  'use strict';
  const SQ = window.SQ;
  const { esc, icon } = SQ;
  const A = SQ.actions;

  const CFG = window.SQ_FIREBASE_CONFIG;
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const META_KEY = 'studyquest.sync';

  const sync = (SQ.sync = {
    configured: !!(CFG && CFG.apiKey && CFG.projectId),
    status: 'off', // off | loading | signedout | syncing | synced | offline | error
    user: null,
    lastSync: null,
    error: '',
  });

  function meta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function setMeta(m) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(Object.assign(meta(), m)));
    } catch (e) {}
  }
  const deviceId = meta().deviceId || SQ.uid() + SQ.uid();
  setMeta({ deviceId });

  function setStatus(s, err) {
    sync.status = s;
    sync.error = err || '';
    const el = document.getElementById('sync-pill');
    if (el) el.outerHTML = SQ.syncPill();
    if (SQ.route() === 'settings' && !SQ.modal.isOpen() && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName)) SQ.render();
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  let fb, auth, db, docRef, unsub, applyingRemote = false;

  async function init() {
    if (!sync.configured) return;
    sync.status = 'loading';
    try {
      await loadScript(SDK + 'firebase-app-compat.js');
      await Promise.all([loadScript(SDK + 'firebase-auth-compat.js'), loadScript(SDK + 'firebase-firestore-compat.js')]);
      fb = window.firebase;
      fb.initializeApp(CFG);
      auth = fb.auth();
      db = fb.firestore();
      auth.useDeviceLanguage();
      auth.getRedirectResult().catch((e) => SQ.toast(authMsg(e)));
      auth.onAuthStateChanged(onUser);
    } catch (e) {
      setStatus('error', '동기화 모듈을 불러오지 못했어요. 인터넷 연결을 확인해 주세요');
    }
  }

  function authMsg(e) {
    const c = (e && e.code) || '';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return '로그인을 취소했어요';
    if (c === 'auth/unauthorized-domain') return '이 주소가 Firebase 승인된 도메인에 없어요 (README 참고)';
    if (c === 'auth/network-request-failed') return '인터넷 연결을 확인해 주세요';
    return '로그인하지 못했어요' + (c ? ` (${c})` : '');
  }

  async function onUser(user) {
    if (unsub) {
      unsub();
      unsub = null;
    }
    sync.user = user ? { uid: user.uid, name: user.displayName || '', email: user.email || '', photo: user.photoURL || '' } : null;
    if (!user) {
      docRef = null;
      return setStatus('signedout');
    }
    docRef = db.collection('users').doc(user.uid);
    setStatus('syncing');
    try {
      const snap = await docRef.get();
      const m = meta();
      if (!snap.exists) {
        await upload();
      } else {
        const remote = snap.data();
        if (m.uid !== user.uid) {
          // first time this account syncs on this device
          await firstSyncChoice(remote);
        } else if ((m.localChangedAt || 0) > (m.lastSync || 0) && (m.localChangedAt || 0) > (remote.updatedAt || 0)) {
          await upload();
        } else if ((remote.updatedAt || 0) > (m.lastSync || 0)) {
          applyRemote(remote);
        }
      }
      setMeta({ uid: user.uid });
      listen();
      if (!sync.user.name || !SQ.state.profile.name) {
        if (!SQ.state.profile.name && sync.user.name) {
          SQ.state.profile.name = sync.user.name;
          SQ.save();
        }
      }
      setStatus('synced');
    } catch (e) {
      console.error(e);
      setStatus('error', e.code === 'permission-denied' ? 'Firestore 보안 규칙이 막고 있어요 (README 참고)' : '동기화 중 문제가 생겼어요');
    }
  }

  function firstSyncChoice(remote) {
    return new Promise((resolve) => {
      let choice = 'cloud';
      const when = remote.updatedAt ? new Date(remote.updatedAt) : null;
      SQ.modal.open({
        title: '어떤 데이터를 쓸까요?',
        sub: '이 계정에 이미 저장된 데이터가 있어요',
        submit: '확인',
        noCancel: true,
        noFocus: true,
        body: `
          <div class="opt-list">
            <label class="opt"><input type="radio" name="pick" value="cloud" checked><span><b>계정에 저장된 데이터 불러오기</b><small>${when ? `${when.getMonth() + 1}월 ${when.getDate()}일 ${SQ.pad(when.getHours())}:${SQ.pad(when.getMinutes())}에 저장됨 · ` : ''}이 기기의 데이터는 덮어써져요</small></span></label>
            <label class="opt"><input type="radio" name="pick" value="local"><span><b>이 기기 데이터를 계정에 올리기</b><small>계정에 있던 데이터가 이 기기 데이터로 바뀌어요</small></span></label>
          </div>`,
        onSubmit(d) {
          choice = d.pick || 'cloud';
        },
        onClose: async () => {
          if (choice === 'local') await upload();
          else applyRemote(remote);
          resolve();
        },
      });
    });
  }

  function applyRemote(remote) {
    let data;
    try {
      data = typeof remote.data === 'string' ? JSON.parse(remote.data) : remote.data;
    } catch (e) {
      return;
    }
    if (!data) return;
    applyingRemote = true;
    SQ.state = Object.assign(SQ.emptyState(), data);
    SQ.state.settings = Object.assign(SQ.emptyState().settings, data.settings);
    SQ.housekeeping();
    SQ.save();
    applyingRemote = false;
    setMeta({ lastSync: remote.updatedAt || Date.now(), localChangedAt: remote.updatedAt || Date.now() });
    sync.lastSync = remote.updatedAt || Date.now();
    SQ.applyTheme();
    const busy = SQ.modal.isOpen() || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName);
    if (busy) SQ.pendingRender = true;
    else SQ.render();
  }

  function listen() {
    unsub = docRef.onSnapshot(
      { includeMetadataChanges: false },
      (snap) => {
        if (!snap.exists || snap.metadata.hasPendingWrites) return;
        const r = snap.data();
        if (r.device === deviceId) return;
        if ((r.updatedAt || 0) <= (meta().lastSync || 0)) return;
        applyRemote(r);
        SQ.toast('다른 기기에서 바뀐 내용을 불러왔어요');
      },
      () => setStatus('error', '실시간 동기화가 끊겼어요')
    );
  }

  async function upload() {
    if (!docRef) return;
    const now = Date.now();
    const data = JSON.stringify(SQ.state);
    if (data.length > 900000) {
      setStatus('error', '데이터가 너무 커서 올리지 못했어요 (최대 약 900KB)');
      return;
    }
    setStatus('syncing');
    try {
      await docRef.set({ data, updatedAt: now, device: deviceId, v: 1 });
      setMeta({ lastSync: now });
      sync.lastSync = now;
      setStatus('synced');
    } catch (e) {
      setStatus(navigator.onLine ? 'error' : 'offline', navigator.onLine ? '저장하지 못했어요. 잠시 후 다시 시도해요' : '');
    }
  }
  const uploadSoon = SQ.debounce(upload, 1200);

  // called from SQ.save()
  SQ.onSaved = function () {
    if (applyingRemote) return;
    setMeta({ localChangedAt: Date.now() });
    if (docRef) uploadSoon();
  };

  window.addEventListener('online', () => {
    if (docRef && (meta().localChangedAt || 0) > (meta().lastSync || 0)) upload();
  });
  window.addEventListener('offline', () => docRef && setStatus('offline'));

  /* ---------- UI ---------- */
  SQ.syncPill = function () {
    if (!sync.configured) return '<span id="sync-pill" hidden></span>';
    const s = sync.status;
    if (s === 'signedout' || s === 'off' || s === 'loading')
      return `<button id="sync-pill" class="sync-pill out" data-act="signIn" ${s === 'loading' ? 'disabled' : ''}>${googleG()}<span>${s === 'loading' ? '불러오는 중…' : '구글로 로그인'}</span></button>`;
    const label = { syncing: '동기화 중…', synced: '동기화됨', offline: '오프라인 · 연결되면 올려요', error: '동기화 오류' }[s] || '';
    return `<a id="sync-pill" href="#/settings" class="sync-pill ${s}">${sync.user && sync.user.photo ? `<img src="${esc(sync.user.photo)}" alt="" referrerpolicy="no-referrer">` : icon('cloud', 16)}<span>${label}</span></a>`;
  };

  function googleG() {
    return '<svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  }

  SQ.syncSettings = function () {
    if (!sync.configured) {
      return `
        <section class="card set span2">
          <h3>${icon('cloud', 18)} 계정 · 기기 간 동기화</h3>
          <p class="muted-t">구글로 로그인하면 휴대폰과 PC에서 같은 데이터를 쓸 수 있어요. 아직 동기화 서버(Firebase)가 연결되지 않았어요. 사이트 관리자가 <code>js/firebase-config.js</code>에 설정값을 넣으면 여기서 로그인할 수 있어요.</p>
        </section>`;
    }
    const u = sync.user;
    const last = sync.lastSync || meta().lastSync;
    const lastTxt = last ? (() => { const d = new Date(last); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${SQ.pad(d.getHours())}:${SQ.pad(d.getMinutes())}`; })() : '아직 없음';
    return `
      <section class="card set span2">
        <h3>${icon('cloud', 18)} 계정 · 기기 간 동기화</h3>
        ${
          u
            ? `<div class="acct">
                ${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="acct-ph">${icon('user', 20)}</span>`}
                <div><b>${esc(u.name || '구글 계정')}</b><small>${esc(u.email)}</small></div>
                <span class="sp"></span>
                <button class="btn line sm" data-act="signOut">로그아웃</button>
              </div>
              <p class="muted-t">${{ syncing: '동기화하는 중이에요…', synced: '모든 변경 사항이 계정에 저장됐어요.', offline: '오프라인이에요. 연결되면 자동으로 올려요.', error: esc(sync.error || '동기화 오류') }[sync.status] || ''} · 마지막 동기화 ${lastTxt}</p>
              <div class="row wrap"><button class="btn line sm" data-act="syncNow">${icon('repeat', 15)} 지금 동기화</button></div>`
            : `<p class="muted-t">로그인하면 이 데이터가 구글 계정에 저장되고, 휴대폰·PC 어디서 로그인해도 같은 내용이 보여요. 한 기기에서 고치면 다른 기기에도 바로 반영돼요.</p>
              ${sync.error ? `<p class="form-err" style="margin:0">${esc(sync.error)}</p>` : ''}
              <div class="row wrap"><button class="btn line google" data-act="signIn" ${sync.status === 'loading' ? 'disabled' : ''}>${googleG()} 구글로 로그인</button></div>`
        }
      </section>`;
  };

  A.signIn = async () => {
    if (!auth) return SQ.toast('잠시 후 다시 눌러 주세요');
    const provider = new fb.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      const c = e && e.code;
      if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') {
        try {
          await auth.signInWithRedirect(provider);
        } catch (e2) {
          SQ.toast(authMsg(e2));
        }
      } else SQ.toast(authMsg(e));
    }
  };
  A.signOut = async () => {
    const ok = await SQ.confirm('로그아웃할까요? 이 기기의 데이터는 그대로 남아요.', { ok: '로그아웃' });
    if (!ok) return;
    await auth.signOut();
    setMeta({ uid: null, lastSync: null });
    SQ.toast('로그아웃했어요');
  };
  A.syncNow = () => upload();

  init();
})();
