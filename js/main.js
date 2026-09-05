/* ==========================================================================
   ごうのすけのゲーム  —  がめんの きりかえ と ボタン

   がめんの ながれ
     タイトル → セーブデータ せんたく → トップがめん
       → ステージ せんたく → バトル → けっか
   ========================================================================== */

(function () {

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* =================================================
     バージョン
     あたらしく こうかいする ときは この すうじと
     sw.js の APP_VERSION を おなじ すうじに あげます。
     ================================================= */
  const GAME_VERSION = '4.1';


  /* =================================================
     がめんの おおきさに あわせて UIを おおきくする
     （iPad など おおきい がめんでは ボタンも もじも おおきく）
     ================================================= */
  let uiScale = 1;
  function applyUiScale() {
    const w = window.innerWidth || 800;
    const h = window.innerHeight || 400;
    const shorter = Math.min(w, h);
    let ui = shorter / 390;                       // iPhone よこもち を 1.0 とする
    ui = Math.max(1, Math.min(1.7, ui));
    uiScale = ui;
    document.documentElement.style.setProperty('--ui', ui.toFixed(3));
    return ui;
  }

  /* したの キャラボタンの ならびかた（6たいから 2だん）と HUDの たかさ */
  function applyUnitLayout() {
    const n = PARTY.length;
    const rows = n <= 6 ? 1 : 2;   // 7たいから 2だん（10たいなら 5れつ x 2だん）
    const cols = rows === 1 ? n : Math.ceil(n / 2);
    const root = document.documentElement.style;
    root.setProperty('--ub-rows', rows);
    root.setProperty('--ub-cols', cols);
    const h  = window.innerHeight || 400;
    let hud  = (rows === 1 ? 96 : 142) * uiScale;
    hud = Math.min(hud, h * (rows === 1 ? 0.30 : 0.37));   // がめんを うめつくさない
    hud = Math.max(hud, rows === 1 ? 74 : 112);
    root.setProperty('--hud-h', Math.round(hud) + 'px');
  }


  /* =================================================
     セーブデータ（3つ）
     ================================================= */
  const SAVE_KEY   = 'gounosuke_save_v2';
  const SLOT_COUNT = 3;
  let saveData = null;      // { slots: [ null | {...}, x3 ] }
  let slotIndex = 0;        // いま あそんでいる データ

  function blankSave() { return { v: 2, slots: [null, null, null] }; }

  function newSlot(name) {
    return {
      name: name,
      cleared: {},                       // { ステージばんごう: true }
      created: Date.now(),
      played: Date.now(),
      coins: 0,                          // Gコイン（ガチャに つかう）
      exp: 0,                            // けいけんち（レベルあげに つかう）
      levels: {},                        // キャラごとの レベル（けいけんちで あがる）
      plus: {},                          // レベルの じょうげんかいほう（ガチャの ダブりで ふえる）
      evolved: {},                       // しんかずみの キャラ
      seenEnemies: {},                   // ずかん：いままで でてきた てき
      owned: START_CHARS.slice(),        // もっている キャラ（はじめは 2たい）
      party: START_CHARS.slice(),        // せんとうに つれていく メンバー
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const d = raw ? JSON.parse(raw) : null;
      if (d && Array.isArray(d.slots) && d.slots.length === SLOT_COUNT) return d;
    } catch (e) { /* よめなくても あたらしく はじめられます */ }

    // まえの バージョンの きろくが あれば データ1に ひきつぐ
    const fresh = blankSave();
    try {
      const old = JSON.parse(localStorage.getItem('gounosuke_clear_v1') || 'null');
      if (old && Object.keys(old).length) {
        fresh.slots[0] = newSlot('データ1');
        fresh.slots[0].cleared = old;
      }
    } catch (e) { /* なくても OK */ }
    return fresh;
  }

  function storeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
    catch (e) { /* ほぞん できない ばあいも ゲームは あそべます */ }
  }

  function slot() { return saveData.slots[slotIndex]; }

  /* ふるい セーブデータに あたらしい こうもくを おぎなう */
  function fixSlot(s) {
    if (!s) return s;
    if (typeof s.coins !== 'number') s.coins = 0;
    if (typeof s.exp   !== 'number') s.exp = 0;
    if (!s.levels)  s.levels = {};
    if (!s.plus)    s.plus = {};
    if (!s.evolved) s.evolved = {};
    if (!s.seenEnemies) s.seenEnemies = {};
    if (!Array.isArray(s.owned) || !s.owned.length) s.owned = START_CHARS.slice();
    if (!Array.isArray(s.party) || !s.party.filter(Boolean).length) s.party = s.owned.slice(0, PARTY_MAX);
    s.owned.forEach(id => { if (typeof s.plus[id] !== 'number') s.plus[id] = 0; });
    s.party = s.party.map(id => (id && s.owned.indexOf(id) >= 0) ? id : null);
    s.owned.forEach(id => { if (!s.levels[id]) s.levels[id] = 1; });
    while (s.party.length < PARTY_MAX) s.party.push(null);
    s.party.length = PARTY_MAX;
    return s;
  }

  /* じつりょくレベル ＝ けいけんちで あげた レベル ＋ じょうげんかいほう(＋) */
  function effLevel(s, id) {
    if (!s) return 1;
    const base = s.levels[id] || 1;
    const plus = (s.plus && s.plus[id]) || 0;
    return Math.min(LEVEL.max + GACHA.plusMax, base + plus);
  }

  /* せんとうに わたす レベルひょう を つくる */
  function effLevelMap(s) {
    const m = {};
    (s.owned || []).forEach(id => { m[id] = effLevel(s, id); });
    return m;
  }

  function markCleared(no) {
    const s = slot();
    if (!s) return;
    s.cleared[no] = true;
    s.played = Date.now();
    storeSave();
  }

  /* ふつうの ステージを いくつ クリアしたか（あき坊の塔は かぞえない）*/
  function clearedCount(s) {
    if (!s || !s.cleared) return 0;
    return STAGES.filter(st => s.cleared[st.no]).length;
  }
  /* あき坊の塔を なんかい のぼったか */
  function towerCount(s) {
    if (!s || !s.cleared || typeof TOWER === 'undefined' || !TOWER.courses) return 0;
    return TOWER.courses.filter(c => s.cleared[c.no]).length;
  }

  function buildSaveSlots() {
    const box = $('#save-slots');
    box.innerHTML = '';
    saveData.slots.forEach((s, i) => {
      const el = document.createElement('button');
      el.className = 'save-slot' + (s ? '' : ' empty');
      if (s) {
        const n  = clearedCount(s);
        const tw = towerCount(s);
        /* ★を ならべると よこに はみだして なまえが つぶれる ので、
           「⭐ ×23」の かたちで みじかく だします                    */
        const stars = n > 0 ? ('⭐<b>×' + n + '</b>') : '';
        el.innerHTML =
          '<span class="slot-no">' + (i + 1) + '</span>' +
          '<span class="slot-info"><b>' + s.name + '</b>' +
          '<small>ステージ ' + n + ' / ' + STAGES.length + ' クリア' +
            (tw > 0 ? '　🗼 ' + tw + ' / ' + TOWER.floors + ' かい' : '') +
          '</small></span>' +
          '<span class="slot-stars">' + stars + '</span>';
        const del = document.createElement('span');
        del.className = 'slot-erase';
        del.textContent = '×';
        del.addEventListener('click', (ev) => { ev.stopPropagation(); askErase(i); });
        el.appendChild(del);
      } else {
        el.innerHTML =
          '<span class="slot-no">' + (i + 1) + '</span>' +
          '<span class="slot-info"><b>あたらしく はじめる</b>' +
          '<small>ここに きろくが ほぞんされます</small></span>';
      }
      el.addEventListener('click', () => chooseSlot(i));
      box.appendChild(el);
    });
  }

  function chooseSlot(i) {
    slotIndex = i;
    if (!saveData.slots[i]) saveData.slots[i] = newSlot('データ' + (i + 1));
    fixSlot(saveData.slots[i]);
    resetGachaWindow();          // データを かえたら ガチャの ひょうじも リセット
    saveData.slots[i].played = Date.now();
    storeSave();
    applyParty();
    openHome();
  }

  let eraseTarget = -1;
  function askErase(i) {
    eraseTarget = i;
    $('#erase-name').textContent = saveData.slots[i].name;
    $('#confirm-erase').classList.remove('hidden');
  }


  /* =================================================
     トップがめん（ホーム）
     ================================================= */
  function openHome() {
    const sl = slot();
    $('#home-slot-label').textContent = sl ? (sl.name + '　🪙' + Math.floor(sl.coins||0) + '　✨' + Math.floor(sl.exp||0)) : 'データ';
    const n = clearedCount(slot());
    $('#home-speech').innerHTML = (n >= STAGES.length)
      ? 'たんくんだよ！<br>ぜんステージ クリア！<br>おめでとう！！'
      : (n === 0
          ? 'たんくんだよ！<br>ステージを クリアして<br>ほうしゅうを てに いれよう！！'
          : 'たんくんだよ！<br>あと ' + (STAGES.length - n) + ' ステージ！<br>その ちょうし！！');
    show('screen-home');
    requestAnimationFrame(drawHomeTankun);
  }

  function drawHomeTankun() {
    const c = $('#home-tankun-canvas');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 120, h = c.clientHeight || 76;
    if (w < 2 || h < 2) return;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h - 4);
    const sc = Math.min(w / 105, (h - 8) / 58);
    ctx.scale(sc, sc);
    if (DRAWERS.tankun) DRAWERS.tankun(ctx, { t: 1.2, moving: false, atk: -1, hpRatio: 1, roll: 0 });
    ctx.restore();
  }

  /* まだ つくって いない ボタン用の おしらせ */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
  }


  /* =================================================
     さいしんばんの みはり
     ================================================= */
  let swWaiting = null;
  let reloading = false;

  function watchForUpdateSW() {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    if (typeof location === 'undefined') return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    navigator.serviceWorker.register('./sw.js').then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) { swWaiting = reg.waiting; showUpdateBanner(); }
      reg.addEventListener('updatefound', () => {
        const fresh = reg.installing;
        if (!fresh) return;
        fresh.addEventListener('statechange', () => {
          if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
            swWaiting = fresh; showUpdateBanner();
          }
        });
      });
      setInterval(() => { reg.update().catch(() => {}); }, 5 * 60 * 1000);
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  function watchForUpdate() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      window.claude.use('db').then(db => {
        if (!db) return;
        db.doc('meta/version').onSnapshot(
          snap => {
            if (!snap || !snap.exists) return;
            const latest = String((snap.data() || {}).version || '');
            if (latest && latest !== GAME_VERSION) showUpdateBanner();
          },
          () => {}
        );
      }).catch(() => {});
    } catch (e) { /* おしらせが なくても ゲームは うごきます */ }
  }

  function showUpdateBanner() {
    const b = $('#update-banner');
    if (!b || b.dataset.dismissed === '1') return;
    b.classList.remove('hidden');
  }


  /* =================================================
     がめんの きりかえ
     ================================================= */
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }


  /* =================================================
     ステージ せんたく
     ================================================= */
  /* --- しょう（ステージ）ごとの コース --- */
  function chapterList() {
    const chs = [];
    STAGES.forEach(st => { const c = st.chapter || 1; if (chs.indexOf(c) < 0) chs.push(c); });
    return chs.sort((a, b) => a - b);
  }
  function coursesOf(ch) { return STAGES.filter(st => (st.chapter || 1) === ch); }

  /* まえの しょうを ぜんぶ クリアすると つぎの しょうが あそべる */
  function chapterOpen(ch) {
    if (ch <= chapterList()[0]) return true;
    const cleared = (slot() && slot().cleared) || {};
    const prev = coursesOf(ch - 1);
    return prev.length > 0 && prev.every(st => cleared[st.no]);
  }

  let currentChapter = 1;

/* =================================================
     せかい ちず（ステージ せんたく）
     ================================================= */

  /* ステージ（しょう）が ちずの どこに あるか（0〜1 の わりあい）*/
  /* しょうの ばしょ。data.js の CHAPTERS に かいて あれば それを つかい、
     なければ これまでどおり じどうで ならべます                        */
  function chapterPos(i, n, ch) {
    const info = (typeof CHAPTERS !== 'undefined') ? CHAPTERS[ch] : null;
    if (info && typeof info.x === 'number') return { x: info.x, y: info.y };
    const t = (n <= 1) ? 0.5 : i / (n - 1);
    return {
      x: 0.14 + t * 0.72,
      y: 0.56 + Math.sin(t * Math.PI * 2 + 0.6) * 0.17,
    };
  }
  function chapterInfo(ch) {
    return ((typeof CHAPTERS !== 'undefined') ? CHAPTERS[ch] : null) || {};
  }

  function openChapters() {
    show('screen-chapter');
    requestAnimationFrame(() => { drawMap(); buildMapNodes(); });
  }

  /* --- ちずの え（そら・やま・かわ・き・みち）--- */
  function drawMap() {
    const cv = $('#map-canvas');
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth || 800, H = cv.clientHeight || 400;
    if (W < 2 || H < 2) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* そら */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5ec8f5');
    sky.addColorStop(0.45, '#a8e0f7');
    sky.addColorStop(1, '#d9f2c9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* くも */
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 4; i++) {
      const cx = W * (0.12 + i * 0.26), cy = H * (0.12 + (i % 2) * 0.08), r = H * 0.045;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.9, cy + r * 0.2, r * 0.72, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.9, cy + r * 0.25, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }

    /* とおくの やま */
    ctx.fillStyle = '#7fa9c9';
    for (let i = -1; i < 6; i++) {
      const bx = W * (i * 0.24 + 0.05), by = H * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx - W * 0.13, by);
      ctx.lineTo(bx, by - H * 0.19);
      ctx.lineTo(bx + W * 0.13, by);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i < 6; i++) {
      const bx = W * (i * 0.24 + 0.05), by = H * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx - W * 0.035, by - H * 0.135);
      ctx.lineTo(bx, by - H * 0.19);
      ctx.lineTo(bx + W * 0.035, by - H * 0.135);
      ctx.closePath(); ctx.fill();
    }

    /* じめん（おか）*/
    ctx.fillStyle = '#8bc34a';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.44);
    ctx.quadraticCurveTo(W * 0.25, H * 0.36, W * 0.5, H * 0.44);
    ctx.quadraticCurveTo(W * 0.75, H * 0.52, W, H * 0.42);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.62);
    ctx.quadraticCurveTo(W * 0.3, H * 0.54, W * 0.62, H * 0.66);
    ctx.quadraticCurveTo(W * 0.85, H * 0.74, W, H * 0.66);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();

    /* かわ */
    ctx.strokeStyle = 'rgba(79,195,247,0.85)';
    ctx.lineWidth = Math.max(6, H * 0.035);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.02, H * 0.92);
    ctx.quadraticCurveTo(W * 0.3, H * 0.78, W * 0.46, H * 0.95);
    ctx.stroke();

    /* けものみち：だい3しょうの まわりを ふかい もりに する */
    const kemo = (typeof CHAPTERS !== 'undefined' && CHAPTERS[3]) ? CHAPTERS[3] : null;
    if (kemo) {
      const kx = kemo.x * W, ky = kemo.y * H;
      ctx.fillStyle = '#2f5a35';
      ctx.beginPath();
      ctx.ellipse(kx, ky + H * 0.02, W * 0.19, H * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d6f3f';
      ctx.beginPath();
      ctx.ellipse(kx - W * 0.03, ky - H * 0.02, W * 0.14, H * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      /* けものの あしあと */
      ctx.fillStyle = 'rgba(60,40,25,.5)';
      for (let i = 0; i < 6; i++) {
        const fx = kx - W * 0.15 + i * W * 0.05, fy = ky + H * 0.08 + ((i % 2) ? H * 0.02 : 0);
        ctx.beginPath(); ctx.ellipse(fx, fy, H * 0.011, H * 0.015, 0, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(fx - H * 0.012 + k * H * 0.012, fy - H * 0.019, H * 0.005, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* 廃れたメカニック工場：だい4しょうの まわりを こうじょうちたいに する */
    const fac = (typeof CHAPTERS !== 'undefined' && CHAPTERS[4]) ? CHAPTERS[4] : null;
    if (fac) {
      const fx = fac.x * W, fy = fac.y * H;
      /* すすけた じめん */
      ctx.fillStyle = '#6b625a';
      ctx.beginPath();
      ctx.ellipse(fx, fy + H * 0.04, W * 0.17, H * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#565049';
      ctx.beginPath();
      ctx.ellipse(fx + W * 0.02, fy + H * 0.02, W * 0.12, H * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();

      /* こうじょうの たてもの と えんとつ */
      const bw = W * 0.035, bh = H * 0.13;
      for (let i = 0; i < 3; i++) {
        const bx = fx - W * 0.085 + i * W * 0.062, by = fy - H * 0.02;
        ctx.fillStyle = ['#4e4a45', '#5a554e', '#443f3a'][i];
        ctx.fillRect(bx, by - bh, bw, bh);
        /* まど */
        ctx.fillStyle = 'rgba(255,200,120,.35)';
        for (let k = 0; k < 3; k++) ctx.fillRect(bx + bw * 0.2, by - bh + bh * (0.18 + k * 0.26), bw * 0.6, bh * 0.13);
        /* えんとつ */
        ctx.fillStyle = '#3d3833';
        const cw = bw * 0.28, chh = bh * (0.5 + i * 0.22);
        ctx.fillRect(bx + bw * 0.62, by - bh - chh, cw, chh);
        /* けむり */
        ctx.fillStyle = 'rgba(150,145,140,.4)';
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(bx + bw * 0.76, by - bh - chh - H * (0.012 + k * 0.016), H * (0.009 + k * 0.005), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      /* クレーン */
      ctx.strokeStyle = '#4a4540'; ctx.lineWidth = Math.max(2, H * 0.008);
      ctx.beginPath();
      ctx.moveTo(fx + W * 0.075, fy + H * 0.02);
      ctx.lineTo(fx + W * 0.075, fy - H * 0.14);
      ctx.lineTo(fx + W * 0.115, fy - H * 0.12);
      ctx.stroke();
      /* ころがった ギア */
      ctx.fillStyle = 'rgba(90,84,78,.85)';
      for (const [gx, gy, gr] of [[-0.10, 0.09, 0.016], [0.06, 0.11, 0.012], [-0.02, 0.13, 0.010]]) {
        const cx2 = fx + W * gx, cy2 = fy + H * gy, r2 = H * gr;
        ctx.beginPath(); ctx.arc(cx2, cy2, r2, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 6; k++) {
          const an = (k / 6) * Math.PI * 2;
          ctx.fillRect(cx2 + Math.cos(an) * r2 - r2 * 0.28, cy2 + Math.sin(an) * r2 - r2 * 0.28, r2 * 0.56, r2 * 0.56);
        }
        ctx.fillStyle = 'rgba(60,56,52,.9)';
        ctx.beginPath(); ctx.arc(cx2, cy2, r2 * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(90,84,78,.85)';
      }
    }

    /* き */
    const trees = [[0.06, 0.72], [0.24, 0.84], [0.55, 0.8], [0.38, 0.52],
                   /* けものみちの まわりは きが みっしゅう */
                   [0.42, 0.66], [0.46, 0.88], [0.57, 0.62], [0.60, 0.90], [0.53, 0.94], [0.38, 0.80], [0.62, 0.72]];
    trees.forEach(([tx, ty]) => {
      const x = W * tx, y = H * ty, r = H * 0.045;
      ctx.fillStyle = '#6d4c2f';
      ctx.fillRect(x - r * 0.14, y - r * 0.2, r * 0.28, r * 0.7);
      ctx.fillStyle = '#4e9a3f';
      ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.2, r * 0.44, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.22, r * 0.46, 0, Math.PI * 2); ctx.fill();
    });

    /* ステージを つなぐ みち */
    const chs = chapterList();
    const cleared = (slot() && slot().cleared) || {};
    for (let i = 0; i < chs.length - 1; i++) {
      const a = chapterPos(i, chs.length, chs[i]), b = chapterPos(i + 1, chs.length, chs[i + 1]);
      const list = coursesOf(chs[i]);
      const done = list.length > 0 && list.every(st => cleared[st.no]);
      const ax = a.x * W, ay = a.y * H, bx = b.x * W, by = b.y * H;
      const mx = (ax + bx) / 2, my = (ay + by) / 2 - H * 0.10;
      // したじきの しろい ふちどり
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(10, H * 0.055);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
      // みち ほんたい
      ctx.strokeStyle = done ? '#ffd54f' : 'rgba(160,170,180,0.9)';
      ctx.lineWidth = Math.max(6, H * 0.032);
      ctx.setLineDash([Math.max(8, H * 0.035), Math.max(7, H * 0.03)]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* --- ちずの うえの ステージボタン --- */
  function buildMapNodes() {
    const box = $('#map-nodes');
    if (!box) return;
    box.innerHTML = '';
    const chs = chapterList();
    const cleared = (slot() && slot().cleared) || {};

    // いま すすむべき ステージ
    let nowCh = chs[chs.length - 1];
    for (const ch of chs) {
      const list = coursesOf(ch);
      if (chapterOpen(ch) && !list.every(st => cleared[st.no])) { nowCh = ch; break; }
    }

    chs.forEach((ch, i) => {
      const p = chapterPos(i, chs.length, ch);
      const list = coursesOf(ch);
      const done = list.filter(st => cleared[st.no]).length;
      const all  = done === list.length;
      const open = chapterOpen(ch);

      const el = document.createElement('button');
      el.className = 'map-node' + (open ? (all ? ' done' : (ch === nowCh ? ' now' : '')) : ' locked');
      el.style.left = (p.x * 100) + '%';
      el.style.top  = (p.y * 100) + '%';
      el.innerHTML =
        '<span class="mn-no">' + (chapterInfo(ch).icon || ch) + '</span>' +
        '<span class="mn-sub">' + (open ? done + '/' + list.length : 'ロック') + '</span>' +
        (all ? '<span class="mn-badge">⭐</span>' : (open ? '' : '<span class="mn-badge">🔒</span>')) +
        '<span class="mn-label">' + (open ? (chapterInfo(ch).name || ('だい' + ch + 'ステージ')) : ('だい' + ch + 'ステージ')) + '</span>';
      if (open) el.addEventListener('click', () => { currentChapter = ch; buildStageList(); show('screen-stage'); });
      else      el.addEventListener('click', () => toast('まえの ステージを ぜんぶ クリアしてね'));
      box.appendChild(el);
    });

    $('#map-hint').textContent = 'すすみたい ステージを タップしてね';
  }


  /* =================================================
     あき坊の塔（とくべつステージ）
     ================================================= */
  function openTower() {
    const s = slot();
    $('#tower-lead').textContent = TOWER.desc;
    $('#tower-reward-name').textContent = TOWER.rewardName;

    const box = $('#tower-floors');
    box.innerHTML = '';
    const cleared = (s && s.cleared) || {};
    let lockedFloors = 0;
    for (let f = 1; f <= TOWER.floors; f++) {
      const course = TOWER.courses.find(c => c.floor === f) || null;
      const prev   = TOWER.courses.find(c => c.floor === f - 1) || null;
      const open   = !!course && (f === 1 || (prev && cleared[prev.no]));
      const done   = !!(course && cleared[course.no]);
      if (!open && !done) {
        lockedFloors++;
        if (lockedFloors > 1) continue;   // つぎの 1かい だけ みせる
      }
      const el = document.createElement('button');
      el.className = 'tower-floor' + (open ? ' open' : '');
      el.innerHTML =
        '<span class="tf-no">' + f + 'かい</span>' +
        '<span class="tf-name">' + (course ? course.name : 'じゅんびちゅう') + '</span>' +
        '<span class="tf-mark">' + (course && cleared[course.no] ? '⭐' : (open ? '▶' : '🔒')) + '</span>';
      if (open) {
        el.addEventListener('click', () => {
          startBattle(course);
        });
      } else {
        el.addEventListener('click', () => toast(course ? 'したの かいから のぼってね' : 'この かいは まだ じゅんびちゅう！'));
      }
      box.appendChild(el);
    }
    if (lockedFloors > 1) {
      const more = document.createElement('div');
      more.className = 'more-note';
      more.textContent = 'この うえに あと ' + (lockedFloors - 1) + ' かい';
      box.appendChild(more);   // ならびは column-reverse なので さいごが いちばん うえ
    }
    show('screen-tower');
  }

  function buildStageList() {
    const box = $('#stage-list');
    box.innerHTML = '';
    const cleared = (slot() && slot().cleared) || {};
    const list = coursesOf(currentChapter);
    $('#stage-title').textContent = chapterInfo(currentChapter).name || ('だい' + currentChapter + 'ステージ');

    // つぎに あそぶ コース（クリアして いない さいしょの コース）
    let nextIdx = -1;
    for (let k = 0; k < list.length; k++) {
      const all = STAGES.indexOf(list[k]);
      const prev = STAGES[all - 1];
      const open = (all === 0) || !!cleared[prev.no] || !!cleared[list[k].no];
      if (open && !cleared[list[k].no]) { nextIdx = k; break; }
    }

    // まだ あそべない コースは「つぎの 1つ」だけ みせる（ならびが ながく ならない ように）
    let lockedShown = 0;

    list.forEach((st, k) => {
      const all  = STAGES.indexOf(st);
      const prev = STAGES[all - 1];
      const open = (all === 0) || !!cleared[prev.no] || !!cleared[st.no];
      const isNext = (k === nextIdx);
      if (!open) {
        lockedShown++;
        if (lockedShown > 1) return;      // 2つめ いこうは かくす
      }

      const b = document.createElement('button');
      b.className = 'stage-card' + (open ? '' : ' locked') + (isNext ? ' next' : '');
      const r = st.reward || { coins: 1, exp: 100 };
      b.innerHTML =
        '<span class="stage-no">' + st.chapter + '-' + (st.course || st.no) + '</span>' +
        '<span class="stage-info"><b>' + (open ? st.name : '？？？') +
            (isNext ? '<span class="next-badge">つぎは ここ！</span>' : '') + '</b>' +
          '<small>' + (open ? st.desc : 'まえの コースを クリアすると あそべます') + '</small>' +
          (open ? '<span class="stage-reward">' +
              (cleared[st.no] ? 'けいけんち+' + r.exp + '（Gコインは しょかいのみ）'
                              : 'クリアで Gコイン+' + r.coins + '　けいけんち+' + r.exp) +
            '</span>' : '') +
        '</span>' +
        '<span class="stage-clear">' + (cleared[st.no] ? '⭐' : (open ? '' : '🔒')) + '</span>';
      if (open) b.addEventListener('click', () => startBattle(st));
      else      b.addEventListener('click', () => toast('まえの コースを クリアしてね'));
      box.appendChild(b);
    });

    // まだ みせて いない コースが なんこ あるか
    const hidden = list.filter(st => {
      const all = STAGES.indexOf(st);
      const prev = STAGES[all - 1];
      return !((all === 0) || cleared[prev.no] || cleared[st.no]);
    }).length - 1;
    if (hidden > 0) {
      const more = document.createElement('div');
      more.className = 'more-note';
      more.textContent = 'この さきに あと ' + hidden + ' コース（クリアすると でてきます）';
      box.appendChild(more);
    }
  }


  /* =================================================
     キャラの アイコン と したの ボタン
     ================================================= */
  function drawIcon(canvas, id) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 44, h = canvas.clientHeight || 34;
    if (w < 2 || h < 2) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h - 1);
    // キャラは たて 80〜110 くらい。ボタンの おおきさに あわせて ちぢめる
    const sc = Math.min(w / 105, h / 80);
    ctx.scale(sc, sc);
    const fn = DRAWERS[shownDrawId(id)];
    if (fn) fn(ctx, { t: 0.7, moving: false, atk: -1, hpRatio: 1, roll: 0.35 });
    ctx.restore();
  }

  let unitButtons = [];
  function buildUnitButtons() {
    const box = $('#unit-buttons');
    box.innerHTML = '';
    unitButtons = [];
    PARTY.forEach(id => {
      const def = UNITS[id];
      if (!def) return;
      const b = document.createElement('button');
      b.className = 'unit-btn';
      b.innerHTML =
        '<canvas class="u-icon"></canvas>' +
        markHtml(def, 'u-mark') +
        '<span class="u-name">' + (shownDef(id) || def).shortName + '</span>' +
        '<span class="u-cost">' + def.cost + '</span>' +
        '<span class="cd-mask" style="display:none"></span>';
      b.addEventListener('click', (ev) => { ev.preventDefault(); Game.summon(id); });
      box.appendChild(b);
      unitButtons.push({ id, el: b, mask: b.querySelector('.cd-mask'), icon: b.querySelector('.u-icon') });
    });
  }

  function redrawIcons() { unitButtons.forEach(u => drawIcon(u.icon, u.id)); }


  /* =================================================
     ばいそく（1.0 → 1.5 → 2.0 → 1.0 …）
     ================================================= */
  const SPEEDS = [1.0, 1.5, 2.0];
  let speedIndex = 0;
  function currentSpeed() { return SPEEDS[speedIndex]; }
  function cycleSpeed() { speedIndex = (speedIndex + 1) % SPEEDS.length; updateSpeedButton(); }
  function updateSpeedButton() {
    const sp = currentSpeed();
    $('#speed-num').textContent = sp.toFixed(1);
    $('#btn-speed').classList.toggle('fast', sp > 1.0);
  }



  /* =================================================
     キャラの え を キャンバスに かく（つかいまわし）
     ================================================= */
  /* しんかずみ なら しんかごの すがた／なまえに する */
  function shownDef(id) {
    const s = slot();
    const base = UNITS[id];
    if (!base) return null;
    if (s && s.evolved && s.evolved[id] && base.evolve) {
      return Object.assign({}, base, base.evolve, { id: id });
    }
    return base;
  }
  function shownDrawId(id) {
    const def = shownDef(id);
    return (def && def.drawAs) ? def.drawAs : id;
  }

  function paintChar(canvas, id, opt) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 60, h = canvas.clientHeight || 48;
    if (w < 2 || h < 2) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h - 2);
    const sc = Math.min(w / 110, h / 88) * ((opt && opt.zoom) || 1);
    ctx.scale(sc, sc);
    const fn = DRAWERS[shownDrawId(id)];
    if (fn) fn(ctx, { t: 0.7, moving: false, atk: -1, hpRatio: 1, roll: 0.35 });
    ctx.restore();
  }


  /* =================================================
     キャラクター へんせい
     ================================================= */
  let selectedSlot = -1;

  function openParty() {
    selectedSlot = -1;
    buildParty();
    show('screen-party');
    requestAnimationFrame(buildParty);   // レイアウトが きまってから え を かきなおす
  }

  function buildParty() {
    withScrollKept('#screen-party', buildPartyInner);
  }

  function buildPartyInner() {
    const s = slot();
    if (!s) return;
    if (!Array.isArray(s.party)) s.party = DEFAULT_PARTY.slice();

    /* --- うえ：へんせいの わく（10こ）--- */
    const box = $('#party-slots');
    box.innerHTML = '';
    for (let i = 0; i < PARTY_MAX; i++) {
      const id = s.party[i] || null;
      const el = document.createElement('button');
      el.className = 'pslot' + (id ? ' filled' : '') + (i === selectedSlot ? ' sel' : '');
      if (id) {
        el.innerHTML = '<span class="ps-no">' + (i + 1) + '</span>' +
          markHtml(UNITS[id], 'ps-mark') +
          '<canvas></canvas>' +
          '<span class="ps-name">' + shownDef(id).shortName + '</span>' +
          '<span class="ps-lv">Lv.' + (s.levels[id] || 1) + '</span>' +
          '<span class="ps-cost">' + UNITS[id].cost + '</span>';
      } else {
        el.className += ' empty-label';
        el.innerHTML = '<span class="ps-no">' + (i + 1) + '</span><span>あき</span>';
      }
      el.addEventListener('click', () => {
        if (selectedSlot === i) {                 // おなじ わくを もういちど → はずす
          if (s.party[i]) { s.party[i] = null; compactParty(s); storeSave(); }
          selectedSlot = -1;
        } else {
          selectedSlot = i;
        }
        buildParty();
        requestAnimationFrame(buildParty);
      });
      if (id) attachSlotDrag(el, i, s);       // ★ながおしで ドラッグ＆ドロップ
      box.appendChild(el);
      if (id) paintChar(el.querySelector('canvas'), id);
    }

    /* --- した：もっている キャラ --- */
    const pool = $('#party-pool');
    pool.innerHTML = '';
    (s.owned || DEFAULT_PARTY).forEach(id => {
      if (!UNITS[id]) return;
      const used = s.party.indexOf(id);
      const el = document.createElement('button');
      el.className = 'pool-item' + (used >= 0 ? ' used' : '');
      el.innerHTML = '<canvas></canvas>' +
        markHtml(UNITS[id], 'pi-mark') +
        '<span class="pi-name">' + shownDef(id).shortName + '</span>' +
        '<span class="pi-lv">Lv.' + (s.levels[id] || 1) + '</span>' +
        '<span class="pi-cost">コスト ' + UNITS[id].cost + '</span>';
      el.addEventListener('click', () => {
        const target = (selectedSlot >= 0) ? selectedSlot : firstEmptySlot(s);
        if (target < 0) { toast('わくが いっぱいです'); return; }
        const here = s.party.indexOf(id);
        if (here === target) { selectedSlot = -1; buildParty(); requestAnimationFrame(buildParty); return; }
        const moved = s.party[target] || null;
        s.party[target] = id;
        if (here >= 0) s.party[here] = moved;      // すでに いた ばあいは いれかえ
        compactParty(s);
        storeSave();
        selectedSlot = -1;
        buildParty();
        requestAnimationFrame(buildParty);
      });
      pool.appendChild(el);
      paintChar(el.querySelector('canvas'), id);
    });

    $('#party-hint').textContent = (selectedSlot >= 0)
      ? (selectedSlot + 1) + 'ばんめの わくに いれる キャラを えらんでね'
      : 'わくを タップして したの キャラを えらぶと セット。ながおしで じゅんばんを いれかえ';
  }

  /* =================================================
     へんせいの わくを ながおし → ドラッグして じゅんばん いれかえ

     ・ながおし 300ミリびょうで「もちあげ」モードに はいります
     ・ゆびを はなすまでは がめんは スクロール しません
     ・ほかの わくの うえで はなすと、そこに わりこんで じゅんばんが かわります
     ================================================= */
  const DRAG_HOLD_MS = 300;      // これだけ おしっぱなしで もちあげ
  const DRAG_SLIP    = 12;       // これいじょう ゆびが うごいたら ながおし キャンセル
  let dragState = null;

  function pointerXY(e) {
    if (e.touches && e.touches.length)            return { x: e.touches[0].clientX,       y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function attachSlotDrag(el, index, s) {
    const onDown = (e) => {
      if (dragState) return;
      if (e.button !== undefined && e.button !== 0) return;   // マウスは ひだりボタン だけ
      const p0 = pointerXY(e);
      dragState = {
        el: el, from: index, over: index, s: s,
        x0: p0.x, y0: p0.y, held: false,
        ghost: null, rects: null, timer: null,
      };
      const st = dragState;
      st.timer = setTimeout(() => { if (dragState === st) beginHold(st); }, DRAG_HOLD_MS);
      document.addEventListener('mousemove', onDocMove, { passive: false });
      document.addEventListener('touchmove', onDocMove, { passive: false });
      document.addEventListener('mouseup', onDocUp);
      document.addEventListener('touchend', onDocUp);
      document.addEventListener('touchcancel', onDocUp);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });
    /* もちあげた あとの タップで「はずす」が はしらない ように */
    el.addEventListener('click', (e) => {
      if (el._justDragged) {
        el._justDragged = false;
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
      }
    }, true);
  }

  /* --- ゆびが うごいた とき（ドキュメント ぜんたいで 1つ だけ）--- */
  function onDocMove(e) {
    const st = dragState;
    if (!st) return;
    const p = pointerXY(e);
    if (!st.held) {
      // まだ もちあげて いない：うごいたら ながおしは とりやめ（スクロール ゆうせん）
      if (Math.abs(p.x - st.x0) > DRAG_SLIP || Math.abs(p.y - st.y0) > DRAG_SLIP) endDrag(false);
      return;
    }
    if (e.cancelable && e.preventDefault) e.preventDefault();   // スクロール させない
    moveGhost(st, p);
    const over = slotAt(st, p);
    if (over !== st.over) { st.over = over; markOver(st); }
  }

  /* --- ゆびを はなした とき --- */
  function onDocUp() {
    const st = dragState;
    if (!st) return;
    const held = st.held;
    if (held && st.over !== st.from) {
      const list = st.s.party.filter(Boolean);
      const item = list.splice(st.from, 1)[0];
      list.splice(Math.min(st.over, list.length), 0, item);
      st.s.party = list.concat(new Array(PARTY_MAX - list.length).fill(null));
      applyParty();
      storeSave();
    }
    endDrag(true);
    if (held) {
      selectedSlot = -1;
      buildParty();
      requestAnimationFrame(buildParty);
    }
  }

  /* --- もちあげ かいし --- */
  function beginHold(st) {
    st.held = true;
    const box = $('#party-slots');
    if (!box || !box.children) return;

    /* わくの いちを おぼえて おく（ドラッグちゅうは うごかない）*/
    st.rects = [];
    for (let i = 0; i < box.children.length; i++) {
      const c = box.children[i];
      if (!c.getBoundingClientRect) continue;
      const r = c.getBoundingClientRect();
      if (st.s.party[i]) st.rects.push({ i: i, r: r });
    }

    /* もちあげた みため */
    if (st.el.classList) st.el.classList.add('dragging');
    if (document.body && document.body.classList) document.body.classList.add('dragging-slot');

    /* おばけ（ゆびに ついてくる コピー）*/
    const id = st.s.party[st.from];
    const g = document.createElement('div');
    g.className = 'pslot filled pslot-ghost';
    g.innerHTML = '<canvas></canvas>' +
      '<span class="ps-name">' + shownDef(id).shortName + '</span>' +
      '<span class="ps-lv">Lv.' + (st.s.levels[id] || 1) + '</span>';
    const r0 = st.el.getBoundingClientRect ? st.el.getBoundingClientRect() : { width: 70, height: 94, left: 0, top: 0 };
    g.style.width = r0.width + 'px';
    g.style.height = r0.height + 'px';
    document.body.appendChild(g);
    st.ghost = g;
    paintChar(g.querySelector('canvas'), id);
    moveGhost(st, { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 });
    markOver(st);

    if (typeof navigator !== 'undefined' && navigator.vibrate) { try { navigator.vibrate(12); } catch (err) {} }
    $('#party-hint').textContent = 'すきな ばしょまで はこんで ゆびを はなしてね';
  }

  function moveGhost(st, p) {
    if (!st.ghost || !st.ghost.style) return;
    st.ghost.style.left = p.x + 'px';
    st.ghost.style.top  = p.y + 'px';
  }

  /* ゆびの したに ある わくの ばんごうを かえす */
  function slotAt(st, p) {
    if (!st.rects || !st.rects.length) return st.from;
    let best = st.from, bestD = Infinity;
    for (const it of st.rects) {
      const cx = it.r.left + it.r.width / 2;
      const cy = it.r.top + it.r.height / 2;
      const d = Math.abs(p.x - cx) + Math.abs(p.y - cy) * 1.4;
      if (d < bestD) { bestD = d; best = it.i; }
    }
    return best;
  }

  function markOver(st) {
    const box = $('#party-slots');
    if (!box || !box.children) return;
    for (let i = 0; i < box.children.length; i++) {
      const c = box.children[i];
      if (!c.classList) continue;
      if (i === st.over && i !== st.from) c.classList.add('drop-target');
      else c.classList.remove('drop-target');
    }
  }

  function endDrag(markClick) {
    const st = dragState;
    dragState = null;
    if (!st) return;
    if (st.timer) clearTimeout(st.timer);
    if (st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
    if (st.el && st.el.classList) st.el.classList.remove('dragging');
    if (markClick && st.held && st.el) st.el._justDragged = true;
    if (document.body && document.body.classList) document.body.classList.remove('dragging-slot');
    const box = $('#party-slots');
    if (box && box.children) {
      for (let i = 0; i < box.children.length; i++) {
        if (box.children[i].classList) box.children[i].classList.remove('drop-target');
      }
    }
    document.removeEventListener('mousemove', onDocMove);
    document.removeEventListener('touchmove', onDocMove);
    document.removeEventListener('mouseup', onDocUp);
    document.removeEventListener('touchend', onDocUp);
    document.removeEventListener('touchcancel', onDocUp);
  }

  /* =================================================
     あき坊の塔を 10かい ぜんぶ クリアすると、とくべつな なかまが
     1どだけ もらえます。この キャラは ガチャには でて きません。
     ================================================= */
  function towerAllCleared(s) {
    if (!s || !TOWER.courses.length) return false;
    if (TOWER.courses.length < TOWER.floors) return false;   // まだ ぜんぶ できて いない
    return TOWER.courses.every(c => !!s.cleared[c.no]);
  }

  function giveTowerReward() {
    const s = slot();
    const id = TOWER.rewardChar;
    if (!s || !id || !UNITS[id]) return null;
    if (!towerAllCleared(s)) return null;
    if (!Array.isArray(s.owned)) s.owned = START_CHARS.slice();
    if (s.owned.indexOf(id) >= 0) return null;               // もう もらって いる
    s.owned.push(id);
    if (typeof s.levels[id] !== 'number') s.levels[id] = 1;
    if (typeof s.plus[id]   !== 'number') s.plus[id]   = 0;
    storeSave();
    return id;
  }

  function firstEmptySlot(s) {
    for (let i = 0; i < PARTY_MAX; i++) if (!s.party[i]) return i;
    return -1;
  }

  /* まえから つめる（あいだの あきを なくす）*/
  function compactParty(s) {
    const list = s.party.filter(Boolean);
    s.party = list.concat(new Array(PARTY_MAX - list.length).fill(null));
    if (s.party.filter(Boolean).length === 0) s.party[0] = (s.owned || DEFAULT_PARTY)[0];
    applyParty();
  }

  /* へんせいを せんとうに はんえいする */
  function applyParty() {
    const s = slot();
    const list = (s && Array.isArray(s.party)) ? s.party.filter(Boolean) : DEFAULT_PARTY.slice();
    PARTY.length = 0;
    list.forEach(id => { if (UNITS[id]) PARTY.push(id); });
    if (PARTY.length === 0) PARTY.push(DEFAULT_PARTY[0]);
    Game.levels = s ? effLevelMap(s) : {};
    Game.evolved = (s && s.evolved) ? s.evolved : {};
    applyUnitLayout();
    buildUnitButtons();
    requestAnimationFrame(redrawIcons);
  }


  /* =================================================
     パワーアップ（レベルあげ）
     ================================================= */
  function openPower() { buildPower(); show('screen-power'); requestAnimationFrame(buildPower); }

  /* =================================================
     いちらんを つくりなおしても、スクロールの いちが
     もどらない ように します。
     （れんぞくで レベルアップする とき、ちがう キャラを
       おしてしまう のを ふせぐ ため）
     ================================================= */
  function withScrollKept(screenId, build) {
    const host = $(screenId);
    const y = host ? (host.scrollTop || 0) : 0;
    build();
    if (host && y > 0) {
      host.scrollTop = y;
      requestAnimationFrame(() => { host.scrollTop = y; });
    }
  }

  /* しんか／もとに もどす を きりかえる */
  function toggleEvolve(id) {
    const s = slot();
    if (!s || !UNITS[id] || !UNITS[id].evolve) return;
    if (effLevel(s, id) < LEVEL.max) { toast('じつりょく Lv.' + LEVEL.max + ' から しんか できます'); return; }
    if (!s.evolved) s.evolved = {};
    const now = !s.evolved[id];
    if (now) s.evolved[id] = true; else delete s.evolved[id];
    storeSave();
    applyParty();
    toast(now ? (UNITS[id].evolve.name + ' に しんかした！')
              : (UNITS[id].name + ' に もどした'));
    buildPower();
    requestAnimationFrame(buildPower);
  }

  function doLevelUp(id) {
    const s = slot();
    const c = levelUpCost(s.levels[id] || 1);
    if (c === null || (s.exp || 0) < c) return;
    s.exp -= c;
    s.levels[id] = (s.levels[id] || 1) + 1;
    storeSave();
    Game.levels = effLevelMap(s);
    toast(UNITS[id].name + ' が Lv.' + s.levels[id] + ' に なった！');
    buildPower(); requestAnimationFrame(buildPower);
  }

  function buildPower() {
    withScrollKept('#screen-power', buildPowerInner);
  }

  function buildPowerInner() {
    const s = slot();
    if (!s) return;
    $('#power-exp').textContent  = Math.floor(s.exp || 0);
    $('#power-coin').textContent = Math.floor(s.coins || 0);

    const box = $('#power-list');
    box.innerHTML = '';
    (s.owned || DEFAULT_PARTY).forEach(id => {
      const base = UNITS[id];
      if (!base) return;
      const def  = shownDef(id);          // しんかずみなら しんかごの すがた
      const isEv = !!(s.evolved && s.evolved[id] && base.evolve);
      const canEv = !!base.evolve;
      const lv   = s.levels[id] || 1;
      const plus = (s.plus && s.plus[id]) || 0;
      const eff  = effLevel(s, id);
      const cost = levelUpCost(lv);
      const mul  = levelMult(eff, base.rarity);
      const maxed = (cost === null);
      const can  = !maxed && (s.exp || 0) >= cost;
      const canEvolve = eff >= LEVEL.max;

      const row = document.createElement('div');
      row.className = 'power-row';
      row.innerHTML =
        '<canvas></canvas>' +
        '<span class="pr-info">' +
          '<span class="pr-name">' + def.name + (isEv ? ' <span class="pr-ev">しんか</span>' : '') + '</span>' +
          '<span class="pr-lv">Lv.' + lv + ' / ' + LEVEL.max +
            (plus ? ' <span class="pr-plus">＋' + plus + '</span>　じつりょく Lv.' + eff : '') +
            '</span>' +
          '<span class="pr-bar"><i style="width:' + ((lv - 1) / (LEVEL.max - 1) * 100) + '%"></i></span>' +
          '<span class="pr-stat">たいりょく ' + Math.round(def.hp * mul) +
            '　こうげき ' + Math.round(def.atk * mul) +
            (def.multiHit ? '×' + def.multiHit.count : '') +
            '（' + mul.toFixed(1) + 'ばい）</span>' +
        '</span>';

      /* レベルアップ ボタン（Lv.10 まで）*/
      if (!maxed) {
        const btn = document.createElement('button');
        btn.className = 'pr-btn';
        btn.innerHTML = 'レベルアップ<br><small>' + cost + '</small>';
        btn.disabled = !can;
        btn.addEventListener('click', () => doLevelUp(id));
        row.appendChild(btn);
      }

      /* しんか ボタン（じつりょく Lv.10 いじょう）*/
      if (canEv) {
        const ev = document.createElement('button');
        ev.className = 'pr-btn evolve' + (isEv ? ' on' : '');
        if (canEvolve) {
          ev.innerHTML = isEv ? 'もとに<br><small>もどす</small>'
                              : 'しんか<br><small>' + base.evolve.name + '</small>';
          ev.addEventListener('click', () => toggleEvolve(id));
        } else {
          ev.innerHTML = 'しんか<br><small>Lv.' + LEVEL.max + 'から</small>';
          ev.disabled = true;
        }
        row.appendChild(ev);
      } else if (maxed) {
        const ev = document.createElement('button');
        ev.className = 'pr-btn evolve';
        ev.innerHTML = 'しんか<br><small>じゅんびちゅう</small>';
        ev.addEventListener('click', () => toast('この キャラの しんかは じゅんびちゅう！'));
        row.appendChild(ev);
      }
      box.appendChild(row);
      paintChar(row.querySelector('canvas'), id);
    });
  }


  /* キャラボタン・へんせいの わくに つける ちいさな しるし
     （どの ぞくせいで、どのくらい レアか が ひとめで わかる ように）*/
  function markHtml(def, cls) {
    const dots = attrList(def.attr).map(x =>
      '<i class="u-dot" style="background:' + (ATTR_COLOR[x] || '#bdbdbd') + '"></i>').join('');
    const r = RARITY[def.rarity];
    return '<span class="' + cls + '">' + dots +
           (r ? '<i class="u-rar" style="color:' + r.color + '">' + r.star + '</i>' : '') + '</span>';
  }

  /* =================================================
     ずかん
     ================================================= */
  let dexSide = 'ally';       // 'ally' か 'enemy'
  let dexAttr = 'all';
  let dexRar  = 'all';
  let dexLimit = null;        // せんとうちゅうは この なかだけ みせる
  let dexBackTo = 'home';     // もどる さきの がめん

  /* せんとうで でてきた てきを セーブに かきうつす */
  function recordSeen() {
    const s = slot();
    if (!s || !Game.seen) return;
    if (!s.seenEnemies) s.seenEnemies = {};
    let added = false;
    for (const id in Game.seen) { if (!s.seenEnemies[id]) { s.seenEnemies[id] = true; added = true; } }
    if (added) storeSave();
  }

  /* --- ぞくせいの バッジ --- */
  function attrTagHtml(attr) {
    return attrList(attr).map(x =>
      '<span class="tag attr" style="background:' + (ATTR_COLOR[x] || '#bdbdbd') + '">' +
      (ATTR_LABEL[x] || x) + '</span>').join('');
  }
  function rarityTagHtml(r) {
    const info = RARITY[r];
    if (!info) return '';
    return '<span class="tag rar" style="background:' + info.color + '">' + info.star + ' ' + info.label + '</span>';
  }

  /* --- とくせいの せつめい（にほんごに なおす）--- */
  function abilityLines(def) {
    const L = [];
    const pc = (v) => Math.round(v * 100) + '%';
    const al = (a) => (a || []).map(x => ATTR_LABEL[x] || x).join('・');

    if (def.noAttack)    L.push('こうげきを しない。たちはだかる だけの かべやく');
    if (def.attackType === 'area') L.push('はんいこうげき：まわり ' + (def.areaRadius || 0) + ' の あいて ぜんぶに あたる');
    if (def.multiHit)    L.push(def.multiHit.count + 'れんげき：1かいの こうげきで ' + def.multiHit.count + 'はつ あたる');
    if (def.wave)        L.push('はどう レベル' + def.wave.level + '：あてると まえに なみが はしり、とおりみちの あいて ぜんぶに おなじ ダメージ');
    if (def.minRange)    L.push('ふところの まあい：きょり ' + def.minRange + ' より ちかづかれると こうげきできない');
    if (def.stationary)  L.push('その ばから うごかない');
    if (def.flying)      L.push('そらを とぶ：かべを こえて いちばん おくの あいてを ねらう');
    if (def.rolls)       L.push('コロコロ ころがって すすむ');
    if (def.blocks)      L.push('とうじょうすると つちブロックを ' + def.blocks + 'だん つんで、その うえに たつ');

    if (def.nullify)     L.push('★' + al(def.nullify.attrs) + ' の こうげきを むこうか（ダメージ 0）。ただし 2つの ぞくせいを もつ こうげきには きかない');
    if (def.absorb)      L.push('★' + al(def.absorb.attrs) + ' の こうげきを すいとって、そのぶん たいりょくが かいふく する');
    if (def.resist)      L.push('★' + al(def.resist.attrs) + ' の こうげきを ' + pc(def.resist.mult) + ' まで おさえる');
    if (def.kbImmune)    L.push('★ふきとばされない');
    if (def.crit)        L.push('★' + pc(def.crit.chance) + 'で かいしんの いちげき（ダメージ ' + def.crit.mult + 'ばい'
                                + (def.crit.ignoreAttr ? '・ぞくせいの あいしょうは けいさんに いれない' : '') + '）');
    if (def.knockbackChance) L.push('★' + pc(def.knockbackChance) + 'で あいてを うしろに ふきとばす');
    if (def.slow)        L.push('★' + pc(def.slow.chance === undefined ? 1 : def.slow.chance) + 'で あいてを '
                                + def.slow.duration + 'びょう どんそくに する（はやさ ' + pc(def.slow.rate) + '）');
    if (def.stun)        L.push('★' + pc(def.stun.chance === undefined ? 1 : def.stun.chance) + 'で あいてを '
                                + def.stun.duration + 'びょう とめる' + (def.stun.attrs ? '（' + al(def.stun.attrs) + ' だけ）' : ''));
    if (def.weaken)      L.push('★' + pc(def.weaken.chance === undefined ? 1 : def.weaken.chance) + 'で あいての こうげきりょくを '
                                + def.weaken.duration + 'びょう ' + pc(def.weaken.rate) + ' に さげる');
    if (def.blind)       L.push('★' + pc(def.blind.chance === undefined ? 1 : def.blind.chance) + 'で あいての こうげきを '
                                + def.blind.duration + 'びょう はずれやすく する');
    if (def.bonusVs)     L.push('★' + al(def.bonusVs.attrs) + ' の あいてには さらに ' + def.bonusVs.mult + 'ばいの ダメージ');
    if (def.healOnce)    L.push('★たいりょくが ' + pc(def.healOnce.below) + ' いかに なると、1どだけ さいだいの ' + pc(def.healOnce.rate) + ' かいふく');
    if (def.enrage) {
      const e = def.enrage;
      L.push('★たいりょくが ' + pc(e.below) + ' いかで ' +
        (e.atkMult ? 'こうげきりょく ' + e.atkMult + 'ばい' : '') +
        (e.intervalMult ? 'こうげきが はやく なる' : ''));
    }
    if (def.selfHurt)    L.push('★' + pc(def.selfHurt.chance) + 'で こうげきに しっぱいして、じぶんだけ さいだいたいりょくの ' + pc(def.selfHurt.rate) + ' ダメージ');
    if (def.regen)       L.push('★じぶんの たいりょくが すこしずつ かいふく する（1びょうに ' + def.regen + '）');
    if (def.heal)        L.push('★ちかくの なかまを ' + def.heal.interval + 'びょうごとに ' + def.heal.amount + ' かいふく する');
    if (def.rest)        L.push('★ときどき やすんで うごかなく なる（' + def.rest.duration + 'びょう）。そのあいだは ダメージを うけやすい');
    if (def.leak)        L.push('★すすむほど はやく なるが、たいりょくが へって いく');
    if (def.stagger)     L.push('★おおきな ダメージを うけると こうげきが キャンセル される');
    if (def.evolve)      L.push('じつりょく Lv.' + LEVEL.max + ' で「' + def.evolve.name + '」に しんか できる');
    return L;
  }

  /* すうじを「★★★☆☆ 1900」の かたちに する */
  function statRow(label, kind, value, shown) {
    const n = starRate(kind, value);
    let st = '';
    for (let i = 0; i < 5; i++) st += (i < n) ? '★' : '☆';
    return '<span class="st-row">' +
             '<i class="st-lb">' + label + '</i>' +
             '<i class="st-star s' + n + '">' + st + '</i>' +
             '<i class="st-num">' + (shown === undefined ? value : shown) + '</i>' +
           '</span>';
  }
  /* ★を つけない ぎょう */
  function plainRow(label, shown) {
    return '<span class="st-row"><i class="st-lb">' + label + '</i>' +
           '<i class="st-star none">－</i><i class="st-num">' + shown + '</i></span>';
  }

  /* --- ずかんの カード 1まい --- */
  function dexCard(def, isAlly) {
    const s = slot();
    const row = document.createElement('div');
    row.className = 'dex-card';

    const hits  = def.multiHit ? def.multiHit.count : 1;
    const cycle = def.attackInterval + def.attackWindup;
    const mul   = isAlly ? levelMult(s ? effLevel(s, def.id) : 1, def.rarity) : 1;
    const hp    = Math.round(def.hp * mul);
    const atk   = Math.round(def.atk * mul);
    const dps   = Math.round((atk * hits) / cycle);

    let stats =
      statRow('たいりょく', 'hp',    hp,  hp) +
      statRow('こうげき',   'atk',   atk, atk + (hits > 1 ? '×' + hits : '')) +
      statRow('1びょうの ダメージ', 'dps', dps, dps) +
      statRow('しゃてい',   'range', def.range, def.range) +
      statRow('うごく はやさ', 'speed', def.speed, def.speed) +
      statRow('こうげきの はやさ', 'cycle', cycle, cycle.toFixed(1) + 'びょうに 1かい');
    if (isAlly) {
      stats += statRow('だしやすさ', 'cheap', def.cost, 'コスト ' + def.cost) +
               plainRow('さいせい', def.recharge + 'びょう');
    } else {
      stats += plainRow('たおすと', (def.money || 0) + 'えん');
    }

    const ab = abilityLines(def);
    const lvTxt = (isAlly && s) ? '　<small>Lv.' + effLevel(s, def.id) + '</small>' : '';
    row.innerHTML =
      '<canvas></canvas>' +
      '<span class="dex-body">' +
        '<span class="dex-name">' + def.name + lvTxt + '</span>' +
        '<span class="dex-badges">' +
          (isAlly ? rarityTagHtml(def.rarity) : (def.isBoss ? '<span class="tag boss">ボス</span>' : '')) +
          attrTagHtml(def.attr) +
        '</span>' +
        '<span class="dex-stats">' + stats + '</span>' +
        (ab.length ? '<span class="dex-abil">' + ab.map(x => '<i>' + x + '</i>').join('') + '</span>' : '') +
      '</span>';
    return row;
  }

  /* --- ずかんを つくる --- */
  function buildDex() {
    const s = slot();

    /* ぞくせいの ボタン */
    const attrBox = $('#dex-attr');
    const attrs = ['all', 'none', 'water', 'fire', 'grass', 'magic', 'power', 'beast', 'metal', 'god', 'ghost'];
    attrBox.innerHTML = '';
    attrs.forEach(k => {
      const b = document.createElement('button');
      b.className = 'dex-tab' + (dexAttr === k ? ' on' : '');
      b.textContent = (k === 'all') ? 'ぜんぶ' : (ATTR_LABEL[k] || k);
      if (k !== 'all') b.style.borderColor = ATTR_COLOR[k];
      b.addEventListener('click', () => { dexAttr = k; buildDex(); });
      attrBox.appendChild(b);
    });

    /* レアどの ボタン（みかた だけ）*/
    $('#dex-rarity-wrap').style.display = (dexSide === 'ally') ? '' : 'none';
    const rarBox = $('#dex-rarity');
    rarBox.innerHTML = '';
    ['all'].concat(RARITY_ORDER).forEach(k => {
      const b = document.createElement('button');
      b.className = 'dex-tab' + (dexRar === k ? ' on' : '');
      b.textContent = (k === 'all') ? 'ぜんぶ' : RARITY[k].star;
      if (k !== 'all') b.style.borderColor = RARITY[k].color;
      b.addEventListener('click', () => { dexRar = k; buildDex(); });
      rarBox.appendChild(b);
    });

    /* タブの みため */
    Array.prototype.forEach.call($('#dex-side').children, (b) => {
      b.className = 'dex-tab' + (b.dataset.side === dexSide ? ' on' : '');
    });

    /* --- ならべる --- */
    const box = $('#dex-list');
    box.innerHTML = '';
    let list = [];
    if (dexSide === 'ally') {
      const owned = (s && s.owned) ? s.owned : DEFAULT_PARTY;
      list = owned.filter(id => UNITS[id]).map(id => UNITS[id]);
      if (dexLimit && dexLimit.ally) list = list.filter(d => dexLimit.ally.indexOf(d.id) >= 0);
      if (dexRar !== 'all') list = list.filter(d => d.rarity === dexRar);
      const ord = {}; RARITY_ORDER.forEach((k, i) => ord[k] = i);
      list.sort((a, b) => (ord[a.rarity] - ord[b.rarity]) || (a.cost - b.cost));
    } else {
      const seen = (s && s.seenEnemies) ? s.seenEnemies : {};
      list = Object.keys(ENEMIES).filter(id => seen[id]).map(id => ENEMIES[id]);
      if (dexLimit && dexLimit.enemy) list = list.filter(d => dexLimit.enemy.indexOf(d.id) >= 0);
      list.sort((a, b) => ((a.isBoss ? 1 : 0) - (b.isBoss ? 1 : 0)) || (a.hp - b.hp));
    }
    if (dexAttr !== 'all') list = list.filter(d => attrList(d.attr).indexOf(dexAttr) >= 0);

    list.forEach(def => {
      const card = dexCard(def, dexSide === 'ally');
      box.appendChild(card);
      paintChar(card.querySelector('canvas'), def.id, { enemy: dexSide === 'enemy' });
    });

    const total = (dexSide === 'ally') ? Object.keys(UNITS).length : Object.keys(ENEMIES).length;
    $('#dex-count').textContent = dexLimit
      ? ('この ステージに でてくる ' + (dexSide === 'ally' ? 'みかた' : 'てき') + ' ' + list.length + 'たい')
      : (list.length + 'たい ひょうじちゅう　（ぜんぶで ' + total + 'たい）');
  }

  function openDex(opts) {
    opts = opts || {};
    dexLimit  = opts.limit || null;
    dexBackTo = opts.back || 'home';
    dexSide   = opts.side || 'ally';
    dexAttr = 'all'; dexRar = 'all';
    recordSeen();
    buildDex();
    show('screen-dex');
    requestAnimationFrame(buildDex);
  }

  /* =================================================
     ガチャ
     ================================================= */
  function openGacha() {
    resetGachaWindow();          // まえの けっかを けす
    refreshGacha();
    show('screen-gacha');
    requestAnimationFrame(drawGachaFriends);
  }

  /* ガチャの まどを はじめの ひょうじに もどす */
  function resetGachaWindow() {
    const r = $('#gacha-result');
    if (r) r.innerHTML = GACHA.cost + 'Gコインで<br>1かい ひけるよ！';
    const w = $('#gacha-window');
    if (w) w.classList.remove('pop');
  }

  /* ガチャきの りょうわきに いる ぷりおぷりねこ と タンクン */
  function drawGachaFriends() {
    paintChar($('#gacha-purio'),  'purio');
    paintChar($('#gacha-tankun'), 'tankun');
  }

  function refreshGacha() {
    const s = slot();
    if (!s) return;
    $('#gacha-coin').textContent = Math.floor(s.coins || 0);
    $('#gacha-exp').textContent  = Math.floor(s.exp || 0);
    const btn = $('#btn-gacha-pull');
    btn.disabled = (s.coins || 0) < GACHA.cost;
    btn.textContent = 'ガチャを ひく（' + GACHA.cost + 'コイン）';
    const info = $('#gacha-rates');
    if (info && !info.dataset.done) {
      info.dataset.done = '1';
      info.innerHTML = RARITY_ORDER.map(k =>
        '<span class="rarity-tag" style="background:' + RARITY[k].color + '">' +
        RARITY[k].star + ' ' + RARITY[k].label + ' ' + RARITY[k].rate + '%</span>').join(' ');
    }
  }

  function pullGacha() {
    const s = slot();
    if (!s || (s.coins || 0) < GACHA.cost) { toast('Gコインが たりません'); return; }
    s.coins -= GACHA.cost;

    /* --- レアリティを ちゅうせん --- */
    const keys = RARITY_ORDER.slice();
    const total = keys.reduce((a, k) => a + RARITY[k].rate, 0);
    let r = Math.random() * total, rank = 'N';
    for (const k of keys) { r -= RARITY[k].rate; if (r <= 0) { rank = k; break; } }
    const info = RARITY[rank];

    /* --- その レアリティの キャラから 1たい --- */
    const pool = ALL_CHARS.filter(id => UNITS[id] && UNITS[id].rarity === rank);
    let html = '';

    if (pool.length === 0) {
      /* まだ キャラが いない レアリティ（でんせつレア）*/
      s.exp = (s.exp || 0) + GACHA.emptyExp;
      html = '<span class="gacha-rank" style="color:' + info.color + '">' + info.star + '</span>' +
             info.label + '<span class="gacha-new">まだ とうじょう して いません！<br>けいけんち +' + GACHA.emptyExp + '</span>';
    } else {
      const id = pool[Math.floor(Math.random() * pool.length)];
      const def = UNITS[id];
      const has = s.owned.indexOf(id) >= 0;

      if (!has) {
        /* --- あたらしい なかま！ --- */
        s.owned.push(id);
        s.levels[id] = 1;
        s.plus[id] = 0;
        const empty = s.party.indexOf(null);
        if (empty >= 0) s.party[empty] = id;
        html = '<span class="gacha-rank" style="color:' + info.color + '">' + info.star + '</span>' +
               '<canvas class="gacha-char" data-char="' + id + '"></canvas>' +
               '<span class="gacha-new">' + def.name + ' が なかまに なった！</span>';
      } else if ((s.plus[id] || 0) < GACHA.plusMax) {
        /* --- ダブり → レベルの じょうげんかいほう --- */
        s.plus[id] = (s.plus[id] || 0) + 1;
        html = '<span class="gacha-rank" style="color:' + info.color + '">' + info.star + '</span>' +
               '<canvas class="gacha-char" data-char="' + id + '"></canvas>' +
               '<span class="gacha-new">' + def.name + ' ＋' + s.plus[id] + '<br>じょうげんかいほう！</span>';
      } else {
        /* --- ＋が MAX → けいけんちに --- */
        const e = GACHA.dupExp[rank] || 100;
        s.exp = (s.exp || 0) + e;
        html = '<span class="gacha-rank" style="color:' + info.color + '">' + info.star + '</span>' +
               '<canvas class="gacha-char" data-char="' + id + '"></canvas>' +
               '<span class="gacha-new">' + def.name + ' は ＋MAX！<br>けいけんち +' + e + '</span>';
      }
    }

    storeSave();
    applyParty();

    const win = $('#gacha-window');
    $('#gacha-result').innerHTML = html;
    const cv = $('#gacha-result').querySelector('canvas');
    if (cv) requestAnimationFrame(() => paintChar(cv, cv.dataset ? cv.dataset.char : null));
    win.classList.remove('pop');
    void win.offsetWidth;
    win.classList.add('pop');
    refreshGacha();
  }



  /* =================================================
     バトル
     ================================================= */
  let lastTime = 0;
  let resultShown = false;

  function measureHud() {
    const h = parseInt(getComputedStyle($('#hud-bottom')).height, 10);
    Game.hudHeight = (h && h > 20) ? h : 96;
    const ht = parseInt(getComputedStyle($('#hud-top')).height, 10);
    Game.hudTopHeight = (ht && ht > 10) ? ht : 48;
  }

  function startBattle(course) {
    show('screen-battle');
    const canvas = $('#canvas');
    Game.canvas = canvas;
    Game.ctx = canvas.getContext('2d');
    measureHud();
    Game.start(course);
    requestAnimationFrame(() => {
      measureHud();
      Game.resize();
      redrawIcons();
    });
    $('#confirm-quit').classList.add('hidden');
    updateSpeedButton();
    lastTime = performance.now();
    resultShown = false;
  }

  function updateHud() {
    $('#money-fill').style.width = (Game.money / Game.moneyMax * 100) + '%';
    $('#money-text').textContent = Math.floor(Game.money) + ' / ' + Game.moneyMax;

    $('#enemy-hp-fill').style.width  = (Game.enemyCastle.hp / Game.enemyCastle.maxHp * 100) + '%';
    $('#player-hp-fill').style.width = (Game.playerCastle.hp / Game.playerCastle.maxHp * 100) + '%';

    const bossBox = $('#boss-hp');
    if (Game.boss && !Game.boss.dead) {
      bossBox.classList.remove('hidden');
      $('#boss-name').textContent = Game.boss.def.name;
      $('#boss-hp-fill').style.width = (Game.boss.hp / Game.boss.maxHp * 100) + '%';
    } else {
      bossBox.classList.add('hidden');
    }

    const wb = $('#btn-wallet');
    const cost = Game.walletCost;
    if (cost === null) {
      $('#wallet-sub').textContent = 'MAX';
      wb.disabled = true;
    } else {
      $('#wallet-sub').textContent = cost + '円';
      wb.disabled = Game.money < cost || Game.finished;
    }
    wb.querySelector('.side-name').textContent = 'おさいふ君 Lv.' + (Game.walletLv + 1);

    const cb = $('#btn-chudon');
    $('#chudon-fill').style.width = (Game.chudonCharge / CONFIG.chudon.chargeTime * 100) + '%';
    cb.classList.toggle('ready', Game.chudonReady && !Game.finished);
    cb.disabled = !Game.chudonReady || Game.finished;

    for (const u of unitButtons) {
      const def = UNITS[u.id];
      const cd = Game.cooldown[u.id];
      if (cd > 0) {
        u.mask.style.display = 'flex';
        u.mask.textContent = cd.toFixed(1);
        u.mask.style.transform = 'scaleY(' + (cd / def.recharge) + ')';
      } else {
        u.mask.style.display = 'none';
      }
      u.el.classList.toggle('poor', Game.money < def.cost);
      u.el.disabled = Game.finished;
    }
  }

  function showResult() {
    resultShown = true;
    recordSeen();                 // まけても「でてきた てき」は ずかんに のこす
    const win = Game.result === 'win';
    const t = $('#result-title');
    t.textContent = win ? 'かった！' : 'まけた…';
    t.className = win ? 'win' : 'lose';
    $('#result-sub').textContent = win
      ? 'ステージ ' + Game.stage.no + ' 「' + Game.stage.name + '」 クリア！'
      : 'もういちど ちょうせん しよう';
    // かったら「つぎへ」、まけたら「もういちど」を おおきく だす
    $('#btn-result-main').textContent = win ? 'ステージせんたくに もどる' : 'もういちど ちょうせん';
    $('#btn-result-sub').textContent  = win ? 'もういちど あそぶ' : 'ステージせんたくに もどる';
    if (win) {
      const r = Game.stage.reward || { coins: 1, exp: 100 };
      const s = slot();
      const first = !!(s && !s.cleared[Game.stage.no]);   // はじめての クリアか
      if (s) {
        if (first) s.coins = (s.coins || 0) + r.coins;    // Gコインは しょかいだけ
        s.exp = (s.exp || 0) + r.exp;                     // けいけんちは まいかい
      }
      $('#result-sub').textContent += first
        ? '　／　Gコイン +' + r.coins + '　けいけんち +' + r.exp
        : '　／　けいけんち +' + r.exp + '（Gコインは しょかいだけ）';
      markCleared(Game.stage.no);
      recordSeen();
      const got = giveTowerReward();          // ★あき坊の塔を ぜんぶ のぼった ごほうび
      if (got) {
        $('#result-sub').textContent =
          'あき坊の塔 10かい せいは！　「' + UNITS[got].name + '」が なかまに なった！';
      }
    }
    show('screen-result');
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!$('#screen-battle').classList.contains('active') || !Game.active) { lastTime = now; return; }

    const raw = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!Game.paused) {
      const total = raw * currentSpeed();
      const steps = total > 0.034 ? 2 : 1;
      for (let i = 0; i < steps; i++) Game.update(total / steps);
    }
    Game.render();
    updateHud();

    if (Game.finished && !resultShown && Game.time > Game.finishAt + 1.3) {
      Game.active = false;
      showResult();
    }
  }


  /* =================================================
     そうさ
     ================================================= */
  function setupCanvasDrag() {
    const c = $('#canvas');
    let dragging = false, lastX = 0, moved = 0;
    const down = (x) => { dragging = true; lastX = x; moved = 0; };
    const move = (x) => {
      if (!dragging) return;
      const dx = x - lastX; lastX = x; moved += Math.abs(dx);
      if (moved > 6) Game.panCamera(dx / Game.view.scale);
    };
    const up = () => { dragging = false; };
    c.addEventListener('touchstart', e => down(e.touches[0].clientX), { passive: true });
    c.addEventListener('touchmove',  e => { move(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend', up);
    c.addEventListener('mousedown', e => down(e.clientX));
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', up);
  }

  function setupKeys() {
    window.addEventListener('keydown', e => {
      if (!$('#screen-battle').classList.contains('active')) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= PARTY.length) { Game.summon(PARTY[n - 1]); return; }
      if (e.key === 'w' || e.key === 'W') Game.upgradeWallet();
      if (e.key === ' ') { e.preventDefault(); Game.fireChudon(); }
      if (e.key === 'f' || e.key === 'F') cycleSpeed();
    });
  }


  /* =================================================
     はじめの じゅんび
     ================================================= */
  function relayout() {
    applyUiScale();
    applyUnitLayout();
    if (Game.canvas && $('#screen-battle').classList.contains('active')) {
      measureHud();
      Game.resize();
    }
    redrawIcons();
    if ($('#screen-home').classList.contains('active')) drawHomeTankun();
    if ($('#screen-gacha').classList.contains('active')) drawGachaFriends();
    if ($('#screen-chapter').classList.contains('active')) { drawMap(); buildMapNodes(); }
  }

  function init() {
    applyUiScale();
    applyUnitLayout();
    saveData = loadSave();
    saveData.slots.forEach(sl => fixSlot(sl));

    buildUnitButtons();
    setupCanvasDrag();
    setupKeys();

    /* タイトル → セーブデータ */
    $('#btn-start').addEventListener('click', () => { buildSaveSlots(); show('screen-save'); });
    $('#btn-save-back').addEventListener('click', () => show('screen-title'));

    /* セーブデータを けす */
    $('#btn-erase-no').addEventListener('click', () => $('#confirm-erase').classList.add('hidden'));
    $('#btn-erase-yes').addEventListener('click', () => {
      if (eraseTarget >= 0) { saveData.slots[eraseTarget] = null; storeSave(); }
      eraseTarget = -1;
      $('#confirm-erase').classList.add('hidden');
      buildSaveSlots();
    });

    /* トップがめん */
    $('#btn-home-stage').addEventListener('click', openChapters);
    $('#btn-chapter-back').addEventListener('click', openHome);
    $('#btn-tower').addEventListener('click', openTower);
    $('#btn-tower-back').addEventListener('click', openChapters);
    $('#btn-home-power').addEventListener('click', openPower);
    $('#btn-home-party').addEventListener('click', openParty);
    $('#btn-home-gacha').addEventListener('click', openGacha);
    $('#btn-party-back').addEventListener('click', openHome);
    $('#btn-power-back').addEventListener('click', openHome);
    $('#btn-gacha-back').addEventListener('click', openHome);
    $('#btn-gacha-pull').addEventListener('click', pullGacha);
    $('#btn-home-back').addEventListener('click', () => { buildSaveSlots(); show('screen-save'); });

    /* ずかん */
    $('#btn-home-dex').addEventListener('click', () => openDex({ back: 'home' }));
    $('#btn-dex-back').addEventListener('click', () => {
      if (dexBackTo === 'battle') {
        show('screen-battle');
        Game.paused = false;
        lastTime = performance.now();
      } else {
        openHome();
      }
    });
    Array.prototype.forEach.call($('#dex-side').children, (b) => {
      b.addEventListener('click', () => { dexSide = b.dataset.side; dexAttr = 'all'; dexRar = 'all'; buildDex(); });
    });

    /* ステージ せんたく */
    $('#btn-stage-back').addEventListener('click', openChapters);

    /* バトル */
    $('#btn-retreat').addEventListener('click', () => {
      Game.paused = true;
      $('#confirm-quit').classList.remove('hidden');
    });
    $('#btn-quit-no').addEventListener('click', () => {
      $('#confirm-quit').classList.add('hidden');
      Game.paused = false;
      lastTime = performance.now();
    });
    $('#btn-quit-yes').addEventListener('click', () => {
      $('#confirm-quit').classList.add('hidden');
      recordSeen();
      Game.paused = false;
      Game.active = false;
      buildStageList();
      show('screen-stage');
    });
    /* メニュー →「キャラ じょうほう」：この ステージの みかたと てき だけの ずかん */
    $('#btn-menu-dex').addEventListener('click', () => {
      $('#confirm-quit').classList.add('hidden');
      const es = [];
      if (Game.stage && Game.stage.waves) {
        Game.stage.waves.forEach(w => { if (w.id && es.indexOf(w.id) < 0) es.push(w.id); });
      }
      openDex({ back: 'battle', limit: { ally: PARTY.slice(), enemy: es } });
    });
    $('#btn-wallet').addEventListener('click', () => Game.upgradeWallet());
    $('#btn-chudon').addEventListener('click', () => Game.fireChudon());
    $('#btn-speed').addEventListener('click', cycleSpeed);

    /* けっか */
    const backToStages = () => { buildStageList(); show('screen-stage'); };
    $('#btn-result-main').addEventListener('click', () => {
      if (Game.result === 'win') backToStages(); else startBattle(Game.stage);
    });
    $('#btn-result-sub').addEventListener('click', () => {
      if (Game.result === 'win') startBattle(Game.stage); else backToStages();
    });

    /* あたらしい バージョンの おしらせ */
    $('#version-num').textContent = GAME_VERSION;
    $('#btn-update').addEventListener('click', () => {
      $('#btn-update').textContent = 'こうしん中…';
      if (swWaiting) {
        swWaiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => { if (!reloading) { reloading = true; location.reload(); } }, 2500);
      } else {
        location.reload();
      }
    });
    $('#btn-update-later').addEventListener('click', () => {
      const b = $('#update-banner');
      b.dataset.dismissed = '1';
      b.classList.add('hidden');
    });
    watchForUpdateSW();
    watchForUpdate();

    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 300));
    document.addEventListener('gesturestart', e => e.preventDefault());

    requestAnimationFrame(redrawIcons);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
