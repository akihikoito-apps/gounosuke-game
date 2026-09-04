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
  const GAME_VERSION = '1.9';


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

  function clearedCount(s) { return s ? Object.keys(s.cleared || {}).length : 0; }

  function buildSaveSlots() {
    const box = $('#save-slots');
    box.innerHTML = '';
    saveData.slots.forEach((s, i) => {
      const el = document.createElement('button');
      el.className = 'save-slot' + (s ? '' : ' empty');
      if (s) {
        const n = clearedCount(s);
        const stars = '⭐'.repeat(Math.min(n, STAGES.length));
        el.innerHTML =
          '<span class="slot-no">' + (i + 1) + '</span>' +
          '<span class="slot-info"><b>' + s.name + '</b>' +
          '<small>ステージ ' + n + ' / ' + STAGES.length + ' クリア</small></span>' +
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

  function openChapters() {
    const box = $('#chapter-list');
    box.innerHTML = '';
    const cleared = (slot() && slot().cleared) || {};
    chapterList().forEach(ch => {
      const list = coursesOf(ch);
      const done = list.filter(st => cleared[st.no]).length;
      const open = chapterOpen(ch);
      const el = document.createElement('button');
      el.className = 'chapter-card' + (open ? '' : ' locked');
      el.innerHTML =
        '<span class="cc-no">' + ch + '</span>' +
        '<span class="cc-info"><b>だい' + ch + 'ステージ</b>' +
          '<small>' + (open ? (done + ' / ' + list.length + ' コース クリア') : 'まえの ステージを ぜんぶ クリアすると あそべます') + '</small>' +
          (open ? '<span class="cc-bar"><i style="width:' + (done / list.length * 100) + '%"></i></span>' : '') +
        '</span>' +
        '<span class="cc-mark">' + (open ? (done === list.length ? '⭐' : '▶') : '🔒') + '</span>';
      if (open) el.addEventListener('click', () => { currentChapter = ch; buildStageList(); show('screen-stage'); });
      else      el.addEventListener('click', () => toast('まえの ステージを ぜんぶ クリアしてね'));
      box.appendChild(el);
    });
    show('screen-chapter');
  }

  function buildStageList() {
    const box = $('#stage-list');
    box.innerHTML = '';
    const cleared = (slot() && slot().cleared) || {};
    const list = coursesOf(currentChapter);
    $('#stage-title').textContent = 'だい' + currentChapter + 'ステージ';

    // つぎに あそぶ コース（クリアして いない さいしょの コース）
    let nextIdx = -1;
    for (let k = 0; k < list.length; k++) {
      const all = STAGES.indexOf(list[k]);
      const prev = STAGES[all - 1];
      const open = (all === 0) || !!cleared[prev.no] || !!cleared[list[k].no];
      if (open && !cleared[list[k].no]) { nextIdx = k; break; }
    }

    list.forEach((st, k) => {
      const all  = STAGES.indexOf(st);
      const prev = STAGES[all - 1];
      const open = (all === 0) || !!cleared[prev.no] || !!cleared[st.no];
      const isNext = (k === nextIdx);

      const b = document.createElement('button');
      b.className = 'stage-card' + (open ? '' : ' locked') + (isNext ? ' next' : '');
      const r = st.reward || { coins: 1, exp: 100 };
      b.innerHTML =
        '<span class="stage-no">' + st.chapter + '-' + (st.course || st.no) + '</span>' +
        '<span class="stage-info"><b>' + (open ? st.name : '？？？') +
            (isNext ? '<span class="next-badge">つぎは ここ！</span>' : '') + '</b>' +
          '<small>' + (open ? st.desc : 'まえの コースを クリアすると あそべます') + '</small>' +
          (open ? '<span class="stage-reward">クリアで Gコイン+' + r.coins + '　けいけんち+' + r.exp + '</span>' : '') +
        '</span>' +
        '<span class="stage-clear">' + (cleared[st.no] ? '⭐' : (open ? '' : '🔒')) + '</span>';
      if (open) b.addEventListener('click', () => startBattle(all));
      else      b.addEventListener('click', () => toast('まえの コースを クリアしてね'));
      box.appendChild(b);
    });
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
    const fn = DRAWERS[id];
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
        '<span class="u-name">' + def.shortName + '</span>' +
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
    const fn = DRAWERS[id];
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
          '<canvas></canvas>' +
          '<span class="ps-name">' + UNITS[id].shortName + '</span>' +
          '<span class="ps-lv">Lv.' + (s.levels[id] || 1) + '</span>';
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
        '<span class="pi-name">' + UNITS[id].shortName + '</span>' +
        '<span class="pi-lv">Lv.' + (s.levels[id] || 1) + '</span>';
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
      : 'わくを タップして、したの キャラを えらぶと セットできます';
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
    applyUnitLayout();
    buildUnitButtons();
    requestAnimationFrame(redrawIcons);
  }


  /* =================================================
     パワーアップ（レベルあげ）
     ================================================= */
  function openPower() { buildPower(); show('screen-power'); requestAnimationFrame(buildPower); }

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
    const s = slot();
    if (!s) return;
    $('#power-exp').textContent  = Math.floor(s.exp || 0);
    $('#power-coin').textContent = Math.floor(s.coins || 0);

    const box = $('#power-list');
    box.innerHTML = '';
    (s.owned || DEFAULT_PARTY).forEach(id => {
      const def = UNITS[id];
      if (!def) return;
      const lv   = s.levels[id] || 1;
      const plus = (s.plus && s.plus[id]) || 0;
      const eff  = effLevel(s, id);
      const cost = levelUpCost(lv);
      const mul  = levelMult(eff);
      const maxed = (cost === null);
      const can  = !maxed && (s.exp || 0) >= cost;
      const canEvolve = eff >= LEVEL.max;

      const row = document.createElement('div');
      row.className = 'power-row';
      row.innerHTML =
        '<canvas></canvas>' +
        '<span class="pr-info">' +
          '<span class="pr-name">' + def.name + '</span>' +
          '<span class="pr-lv">Lv.' + lv + ' / ' + LEVEL.max +
            (plus ? ' <span class="pr-plus">＋' + plus + '</span>　じつりょく Lv.' + eff : '') +
            (s.evolved && s.evolved[id] ? '　★しんかずみ' : '') + '</span>' +
          '<span class="pr-bar"><i style="width:' + ((lv - 1) / (LEVEL.max - 1) * 100) + '%"></i></span>' +
          '<span class="pr-stat">たいりょく ' + Math.round(def.hp * mul) +
            '　こうげき ' + Math.round(def.atk * mul) + '（' + mul.toFixed(1) + 'ばい）</span>' +
        '</span>';

      const btn = document.createElement('button');
      btn.className = 'pr-btn' + (maxed ? ' evolve' : '');
      if (maxed || canEvolve) {
        btn.innerHTML = maxed ? 'しんか<br><small>じゅんびちゅう</small>'
                              : 'レベルアップ<br><small>' + cost + '</small>';
        if (maxed) {
          btn.className = 'pr-btn evolve';
          btn.addEventListener('click', () => toast('しんかは じゅんびちゅう！ すがたが きまったら つかえます'));
        } else {
          btn.className = 'pr-btn';
          btn.disabled = !can;
          btn.addEventListener('click', () => doLevelUp(id));
        }
      } else {
        btn.innerHTML = 'レベルアップ<br><small>' + cost + '</small>';
        btn.disabled = !can;
        btn.addEventListener('click', () => doLevelUp(id));
      }
      row.appendChild(btn);
      box.appendChild(row);
      paintChar(row.querySelector('canvas'), id);
    });
  }


  /* =================================================
     ガチャ
     ================================================= */
  function openGacha() { refreshGacha(); show('screen-gacha'); }

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
      info.innerHTML = ['N', 'R', 'SR', 'LR'].map(k =>
        '<span class="rarity-tag" style="background:' + RARITY[k].color + '">' +
        RARITY[k].star + ' ' + RARITY[k].label + ' ' + RARITY[k].rate + '%</span>').join(' ');
    }
  }

  function pullGacha() {
    const s = slot();
    if (!s || (s.coins || 0) < GACHA.cost) { toast('Gコインが たりません'); return; }
    s.coins -= GACHA.cost;

    /* --- レアリティを ちゅうせん --- */
    const keys = ['N', 'R', 'SR', 'LR'];
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

  function startBattle(index) {
    show('screen-battle');
    const canvas = $('#canvas');
    Game.canvas = canvas;
    Game.ctx = canvas.getContext('2d');
    measureHud();
    Game.start(index);
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
      if (s) {
        s.coins = (s.coins || 0) + r.coins;
        s.exp   = (s.exp   || 0) + r.exp;
      }
      $('#result-sub').textContent += '　／　Gコイン +' + r.coins + '　けいけんち +' + r.exp;
      markCleared(Game.stage.no);
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
    $('#btn-home-power').addEventListener('click', openPower);
    $('#btn-home-party').addEventListener('click', openParty);
    $('#btn-home-gacha').addEventListener('click', openGacha);
    $('#btn-party-back').addEventListener('click', openHome);
    $('#btn-power-back').addEventListener('click', openHome);
    $('#btn-gacha-back').addEventListener('click', openHome);
    $('#btn-gacha-pull').addEventListener('click', pullGacha);
    $('#btn-home-back').addEventListener('click', () => { buildSaveSlots(); show('screen-save'); });

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
      Game.paused = false;
      Game.active = false;
      buildStageList();
      show('screen-stage');
    });
    $('#btn-wallet').addEventListener('click', () => Game.upgradeWallet());
    $('#btn-chudon').addEventListener('click', () => Game.fireChudon());
    $('#btn-speed').addEventListener('click', cycleSpeed);

    /* けっか */
    const backToStages = () => { buildStageList(); show('screen-stage'); };
    $('#btn-result-main').addEventListener('click', () => {
      if (Game.result === 'win') backToStages(); else startBattle(Game.stageIndex);
    });
    $('#btn-result-sub').addEventListener('click', () => {
      if (Game.result === 'win') startBattle(Game.stageIndex); else backToStages();
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
