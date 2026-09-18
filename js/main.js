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
  const GAME_VERSION = '6.16';


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
      evolved: {},                       // しんかずみの キャラ（だい2けいたい）
      evolved2: {},                      // だい3けいたいの キャラ
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
    if (!s.evolved2) s.evolved2 = {};
    if (!s.seenEnemies) s.seenEnemies = {};
    backfillSeen(s);          // まえに クリアした ステージの てきを ずかんに のせる
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
  /* にわで あがった ぶん（1たい ＋10 まで。ガチャの ＋とは べつわく）*/
  function gardenPlus(s, id) {
    if (!s || !s.gardenPlus) return 0;
    const max = (typeof GARDEN !== 'undefined') ? GARDEN.maxPlus : 10;
    return Math.min(max, s.gardenPlus[id] || 0);
  }
  function effLevel(s, id) {
    if (!s) return 1;
    const base = s.levels[id] || 1;
    const plus = (s.plus && s.plus[id]) || 0;
    /* ガチャの ＋は Lv.30＋30 が じょうげん。にわの ＋は その うえに のります */
    return Math.min(LEVEL.max + GACHA.plusMax, base + plus) + gardenPlus(s, id);
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
  /* ------------------------------------------------------------
     とくべつステージ（あき坊の塔 と あき坊の宇宙船）

     どちらも おなじ がめんを つかいまわします。
     currentTower が いま みて いる ほうを さします。
     ------------------------------------------------------------ */
  function allTowers() {
    const list = [];
    if (typeof TOWER !== 'undefined' && TOWER) list.push(TOWER);
    if (typeof SPACESHIP !== 'undefined' && SPACESHIP) list.push(SPACESHIP);
    if (typeof GONO !== 'undefined' && GONO) list.push(GONO);
    if (typeof DOZLE_PLANET !== 'undefined' && DOZLE_PLANET) list.push(DOZLE_PLANET);
    return list;
  }
  /* その ちずに ある とくべつステージ（ふくすう ある ばあいも）*/
  function towersOfWorld(world) {
    return allTowers().filter(t => (t.world || 'earth') === world);
  }
  function towerOfWorld(world) {
    return towersOfWorld(world)[0] || null;
  }
  let currentTower = (typeof TOWER !== 'undefined') ? TOWER : null;

  /* あき坊の塔を なんかい のぼったか */
  function towerCount(s) {
    const T = currentTower;
    if (!s || !s.cleared || !T || !T.courses) return 0;
    return T.courses.filter(c => s.cleared[c.no]).length;
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
     こうしん りれき
     ================================================= */
  function openLog() {
    const box = $('#log-list');
    if (box) {
      box.innerHTML = '';
      const list = (typeof CHANGELOG !== 'undefined') ? CHANGELOG : [];
      if (!list.length) {
        box.innerHTML = '<div class="log-card"><span class="log-name">まだ りれきが ありません</span></div>';
      }
      list.forEach((e, i) => {
        const card = document.createElement('div');
        card.className = 'log-card' + (i === 0 ? ' newest' : '');
        card.innerHTML =
          '<div class="log-head">' +
            '<span class="log-ver">v' + e.ver + '</span>' +
            (i === 0 ? '<span class="log-new">いま これ</span>' : '') +
            '<span class="log-date">' + (e.date || '') + '</span>' +
          '</div>' +
          '<span class="log-name">' + e.title + '</span>' +
          '<ul class="log-items">' +
            (e.items || []).map(t => '<li>' + t + '</li>').join('') +
          '</ul>';
        box.appendChild(card);
      });
      box.scrollTop = 0;
    }
    show('screen-log');
  }


  /* =================================================
     ステージ せんたく
     ================================================= */
  /* --- しょう（ステージ）ごとの コース --- */
  /* いま みて いる ちず。'earth'＝せかいちず / 'space'＝うちゅうちず */
  let currentWorld = 'earth';

  /* その しょうが どちらの ちずに あるか */
  function worldOf(ch) {
    const info = (typeof CHAPTERS !== 'undefined') ? CHAPTERS[ch] : null;
    return (info && info.world) ? info.world : 'earth';
  }

  /* ぜんぶの しょう（ちずに かんけいなく）*/
  function allChapters() {
    const chs = [];
    STAGES.forEach(st => { const c = st.chapter || 1; if (chs.indexOf(c) < 0) chs.push(c); });
    return chs.sort((a, b) => a - b);
  }

  /* いま みて いる ちずの しょうだけ */
  function chapterList() {
    return allChapters().filter(ch => worldOf(ch) === currentWorld);
  }

  /* せかいちずを ぜんぶ クリアしたか（＝うちゅうへ いけるか）*/
  function earthAllCleared() {
    const cleared = (slot() && slot().cleared) || {};
    const earth = allChapters().filter(ch => worldOf(ch) === 'earth');
    return earth.every(ch => coursesOf(ch).every(st => cleared[st.no]));
  }
  function coursesOf(ch) { return STAGES.filter(st => (st.chapter || 1) === ch); }

  /* まえの しょうを ぜんぶ クリアすると つぎの しょうが あそべる */
  function chapterOpen(ch) {
    /* うちゅうの さいしょの ほしは、せかいちずを ぜんぶ クリアしたら あそべる */
    const list = allChapters().filter(c => worldOf(c) === worldOf(ch));
    if (ch <= list[0]) {
      const w = worldOf(ch);
      if (w === 'earth') return true;
      if (w === 'sun')   return spaceAllCleared();   // 太陽は うちゅうを ぜんぶ クリアしてから
      return earthAllCleared();                      // うちゅうは せかいを ぜんぶ クリアしてから
    }
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
    if (rarityLimit) { rarityLimit = null; applyParty(); }
    show('screen-chapter');
    requestAnimationFrame(() => { drawMap(); buildMapNodes(); refreshWorldBtn(); });
  }

  /* せかい ⇄ うちゅう の きりかえボタン */
  /* ちずの みぎうえの とくべつステージ ボタン */
  function refreshTowerBtn() {
    const list = towersOfWorld(currentWorld);
    [['#btn-tower', 0], ['#btn-tower2', 1], ['#btn-tower3', 2]].forEach(([sel, i]) => {
      const b = $(sel);
      if (!b) return;
      const T = list[i];
      b.classList.toggle('hidden', !T);
      if (!T) return;
      const ico = b.querySelector('.tw-ico');
      const nm  = b.querySelector('.tw-name');
      if (ico) ico.textContent = T.icon || ((T.world === 'space') ? '🚀' : '🗼');
      if (nm)  nm.textContent  = T.name;
    });
  }

  /* うちゅうの ほしを ぜんぶ クリアしたか（＝太陽へ いけるか）*/
  function spaceAllCleared() {
    const cleared = (slot() && slot().cleared) || {};
    const space = allChapters().filter(ch => worldOf(ch) === 'space');
    return space.length > 0 && space.every(ch => coursesOf(ch).every(st => cleared[st.no]));
  }

  const WORLD_TITLE = { earth: 'せかい ちず', space: 'うちゅう ちず', sun: '太陽 ちず' };

  function refreshWorldBtn() {
    const b = $('#btn-world');
    if (b) {
      /* 太陽ちずでは ちきゅう ⇄ うちゅう の ボタンは ださない */
      const canGo = earthAllCleared() && currentWorld !== 'sun';
      b.classList.toggle('hidden', !canGo);
      b.classList.toggle('space', currentWorld === 'space');
      b.textContent = (currentWorld === 'earth') ? '🚀 うちゅうへ' : '🌍 ちきゅうへ';
    }
    /* よこの やじるし。うちゅう →（太陽）／ 太陽 →（うちゅう）*/
    const r = $('#btn-map-right'), l = $('#btn-map-left');
    if (r) r.classList.toggle('hidden', !(currentWorld === 'space' && spaceAllCleared()));
    if (l) l.classList.toggle('hidden', currentWorld !== 'sun');
    refreshTowerBtn();
    const t = $('.map-title');
    if (t) t.textContent = WORLD_TITLE[currentWorld] || 'ちず';
  }

  /* ちずを かきなおす。dir を わたすと よこに すべる うごきが つきます
       dir = 'left'  … あたらしい ちずが みぎから はいって くる（＝みぎへ すすむ）
       dir = 'right' … あたらしい ちずが ひだりから はいって くる（＝ひだりへ もどる）*/
  function redrawMap(dir) {
    drawMap(); buildMapNodes(); refreshWorldBtn();
    if (!dir) return;
    const wrap = document.querySelector('.map-wrap');
    if (!wrap) return;
    const cls = (dir === 'left') ? 'map-slide-in-right' : 'map-slide-in-left';
    wrap.classList.remove('map-slide-in-right', 'map-slide-in-left');
    void wrap.offsetWidth;                 // アニメを やりなおさせる
    wrap.classList.add(cls);
    setTimeout(() => wrap.classList.remove(cls), 320);
  }

  function switchWorld() {
    currentWorld = (currentWorld === 'earth') ? 'space' : 'earth';
    redrawMap();
  }

  /* うちゅう ⇄ 太陽（よこに スワイプ）*/
  function goSunMap()   { if (!spaceAllCleared()) { toast('うちゅうの ほしを ぜんぶ クリアすると いけます'); return; }
                          currentWorld = 'sun';   redrawMap('left'); }
  function backToSpace() { currentWorld = 'space'; redrawMap('right'); }

  /* --- 太陽ちずの え（ごうのすけくんの えの とおり）---
       むらさきの そら、ひだりから みぎへ つづく とびいしの みち、
       そして みぎに おおきな オレンジの 太陽。                     */
  function drawSunMap(ctx, W, H) {
    /* むらさきの そら */
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2a13a8');
    g.addColorStop(0.55, '#3a1ad0');
    g.addColorStop(1, '#2510a0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* とおくの ほし */
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 97) % 100) / 100 * W;
      const sy = ((i * 61) % 100) / 100 * H;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }

    /* ★太陽（みぎに おおきく。オレンジの まるに あかい もよう）*/
    const sx = W * 0.80, sy = H * 0.48, sr = Math.min(W * 0.30, H * 0.56);
    /* まわりの ひかり */
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.9, sx, sy, sr * 1.5);
    halo.addColorStop(0, 'rgba(255,160,40,.45)');
    halo.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 1.5, 0, Math.PI * 2); ctx.fill();
    /* ほんたい */
    ctx.fillStyle = '#f9a01b';
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    /* あかい もよう 3つ（えの とおりの ばしょ）*/
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#f4421d';
    ctx.beginPath(); ctx.arc(sx - sr * 0.42, sy - sr * 0.06, sr * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + sr * 0.42, sy - sr * 0.56, sr * 0.19, sr * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + sr * 0.05, sy + sr * 0.72, sr * 0.38, sr * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* ★とびいしの みち（ひだりの はしから 太陽へ）*/
    const stones = [[0.09, 0.66], [0.14, 0.63], [0.20, 0.65], [0.26, 0.62],
                    [0.32, 0.66], [0.38, 0.62], [0.44, 0.60], [0.49, 0.63]];
    ctx.fillStyle = 'rgba(60,20,110,.85)';
    stones.forEach(([px, py], i) => {
      const bx = px * W, by = py * H;
      if (i % 2) { ctx.beginPath(); ctx.ellipse(bx, by, H * 0.030, H * 0.011, 0, 0, Math.PI * 2); ctx.fill(); }
      else       { roundRectPath(ctx, bx - H * 0.024, by - H * 0.022, H * 0.048, H * 0.044, H * 0.008); ctx.fill(); }
    });

    /* ★ひだりの きいろい ぼう（えの「火星とか」へ もどる めじるし）*/
    ctx.fillStyle = '#ffd54f';
    roundRectPath(ctx, W * 0.055, H * 0.28, Math.max(5, W * 0.009), H * 0.40, 4);
    ctx.fill();
  }

  /* まるい かどの しかくを パスに する（ぬりは よびだしがわで）*/
  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y,     x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x,     y + h, rr);
    ctx.arcTo(x,     y + h, x,     y,     rr);
    ctx.arcTo(x,     y,     x + w, y,     rr);
    ctx.closePath();
  }

  /* --- うちゅうちずの え（ほしぞらと わくせい）--- */
  function drawSpaceMap(ctx, W, H) {
    /* まっくらな そら */
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05030f'); g.addColorStop(0.55, '#0d0a24'); g.addColorStop(1, '#14082a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* ほし（おなじ ばしょに でる ように たねを つかう）*/
    for (let i = 0; i < 150; i++) {
      const rx = ((i * 9301 + 49297) % 233280) / 233280;
      const ry = ((i * 4523 + 12345) % 233280) / 233280;
      const rr = ((i * 7919 + 104729) % 100) / 100;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + rr * 0.6) + ')';
      ctx.beginPath(); ctx.arc(rx * W, ry * H, rr * 1.6 + 0.4, 0, Math.PI * 2); ctx.fill();
    }
    /* おおきく ひかる ほし */
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
    for (const [sx, sy, sr] of [[0.12, 0.22, 7], [0.68, 0.16, 5], [0.86, 0.86, 6], [0.44, 0.9, 5]]) {
      const cx = sx * W, cy = sy * H, r = sr * (H / 400);
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    }

    /* とおくの ぎんが */
    const ng = ctx.createRadialGradient(W * 0.78, H * 0.30, 2, W * 0.78, H * 0.30, W * 0.20);
    ng.addColorStop(0, 'rgba(186,104,200,.30)');
    ng.addColorStop(0.6, 'rgba(94,60,140,.16)');
    ng.addColorStop(1, 'rgba(30,10,50,0)');
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.ellipse(W * 0.78, H * 0.30, W * 0.20, H * 0.13, -0.4, 0, Math.PI * 2); ctx.fill();

    /* ちきゅう（ひだりした・きた みち）*/
    const ex = W * 0.06, ey = H * 0.86, er = H * 0.10;
    const eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er);
    eg.addColorStop(0, '#6ec6ff'); eg.addColorStop(1, '#0d47a1');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(102,187,106,.85)';
    ctx.beginPath(); ctx.ellipse(ex - er * 0.2, ey - er * 0.25, er * 0.45, er * 0.28, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ex + er * 0.35, ey + er * 0.3, er * 0.35, er * 0.22, -0.2, 0, Math.PI * 2); ctx.fill();

    /* 火星（しょうの ばしょに あわせて あかい ほしを かく）*/
    const mars = chapterInfo(8);
    if (typeof mars.x === 'number') {
      const mx = mars.x * W, my = mars.y * H, mr = H * 0.15;
      const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
      mg.addColorStop(0, '#ff8a65'); mg.addColorStop(0.6, '#e64a19'); mg.addColorStop(1, '#8d2c0c');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      /* クレーター */
      ctx.fillStyle = 'rgba(120,40,15,.5)';
      for (const [cx2, cy2, cr] of [[-0.35, -0.2, 0.20], [0.25, 0.1, 0.26], [-0.1, 0.45, 0.15], [0.45, -0.35, 0.13]]) {
        ctx.beginPath(); ctx.arc(mx + mr * cx2, my + mr * cy2, mr * cr, 0, Math.PI * 2); ctx.fill();
      }
      /* あかい ひかり */
      const hg2 = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 1.7);
      hg2.addColorStop(0, 'rgba(255,112,67,.35)');
      hg2.addColorStop(1, 'rgba(255,112,67,0)');
      ctx.fillStyle = hg2;
      ctx.beginPath(); ctx.arc(mx, my, mr * 1.7, 0, Math.PI * 2); ctx.fill();
    }

    /* 水星（あおい ほし）*/
    const merc = chapterInfo(9);
    if (typeof merc.x === 'number') {
      const wx = merc.x * W, wy = merc.y * H, wr = H * 0.115;
      const wg = ctx.createRadialGradient(wx - wr * 0.3, wy - wr * 0.3, wr * 0.1, wx, wy, wr);
      wg.addColorStop(0, '#81d4fa'); wg.addColorStop(0.6, '#1e88e5'); wg.addColorStop(1, '#0b3d91');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fill();
      /* みずの もよう */
      ctx.strokeStyle = 'rgba(224,247,250,.6)'; ctx.lineWidth = Math.max(2, H * 0.006);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(wx - wr * 0.8, wy + i * wr * 0.42);
        ctx.quadraticCurveTo(wx, wy + i * wr * 0.42 - wr * 0.18, wx + wr * 0.8, wy + i * wr * 0.42);
        ctx.stroke();
      }
      /* あおい ひかり */
      const wh = ctx.createRadialGradient(wx, wy, wr, wx, wy, wr * 1.7);
      wh.addColorStop(0, 'rgba(79,195,247,.30)'); wh.addColorStop(1, 'rgba(79,195,247,0)');
      ctx.fillStyle = wh;
      ctx.beginPath(); ctx.arc(wx, wy, wr * 1.7, 0, Math.PI * 2); ctx.fill();
      /* 火星 → 水星の みち */
      if (typeof mars.x === 'number') {
        ctx.strokeStyle = 'rgba(255,213,79,.5)';
        ctx.lineWidth = Math.max(3, H * 0.008);
        ctx.setLineDash([Math.max(7, H * 0.03), Math.max(6, H * 0.026)]);
        ctx.beginPath();
        ctx.moveTo(mars.x * W + H * 0.16, mars.y * H + H * 0.05);
        ctx.quadraticCurveTo(W * 0.46, H * 0.44, wx - wr, wy - wr * 0.4);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    /* 木星（しまもようの ガスの ほし。あかい あらしが ある）*/
    const jup = chapterInfo(10);
    if (typeof jup.x === 'number') {
      const jx = jup.x * W, jy = jup.y * H, jr = H * 0.155;
      const jg = ctx.createRadialGradient(jx - jr * 0.3, jy - jr * 0.3, jr * 0.1, jx, jy, jr);
      jg.addColorStop(0, '#ffe0b2'); jg.addColorStop(0.55, '#e08a3c'); jg.addColorStop(1, '#7b3f10');
      ctx.fillStyle = jg;
      ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.fill();
      /* しまもよう（ほしの まるさで きりぬく）*/
      ctx.save();
      ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.clip();
      const bands = [[-0.62, 0.14, 'rgba(255,236,200,.34)'], [-0.30, 0.18, 'rgba(140,74,26,.34)'],
                     [ 0.02, 0.15, 'rgba(255,224,178,.30)'], [ 0.34, 0.18, 'rgba(120,60,20,.32)'],
                     [ 0.66, 0.14, 'rgba(255,236,200,.26)']];
      for (const [by, bh, bc] of bands) {
        ctx.fillStyle = bc;
        ctx.fillRect(jx - jr, jy + jr * by, jr * 2, jr * bh);
      }
      /* だいあかはん（おおきな あらし）*/
      ctx.fillStyle = 'rgba(198,58,40,.75)';
      ctx.beginPath(); ctx.ellipse(jx + jr * 0.26, jy + jr * 0.24, jr * 0.30, jr * 0.17, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,150,.5)'; ctx.lineWidth = Math.max(1.5, H * 0.004);
      ctx.beginPath(); ctx.ellipse(jx + jr * 0.26, jy + jr * 0.24, jr * 0.30, jr * 0.17, -0.15, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      /* オレンジの ひかり */
      const jh = ctx.createRadialGradient(jx, jy, jr, jx, jy, jr * 1.6);
      jh.addColorStop(0, 'rgba(255,167,38,.30)'); jh.addColorStop(1, 'rgba(255,167,38,0)');
      ctx.fillStyle = jh;
      ctx.beginPath(); ctx.arc(jx, jy, jr * 1.6, 0, Math.PI * 2); ctx.fill();
      /* 水星 → 木星の みち */
      if (typeof merc.x === 'number') {
        ctx.strokeStyle = 'rgba(255,213,79,.5)';
        ctx.lineWidth = Math.max(3, H * 0.008);
        ctx.setLineDash([Math.max(7, H * 0.03), Math.max(6, H * 0.026)]);
        ctx.beginPath();
        ctx.moveTo(merc.x * W + H * 0.13, merc.y * H - H * 0.05);
        ctx.quadraticCurveTo(W * 0.78, H * 0.60, jx - jr * 0.85, jy + jr * 0.6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    /* 小惑星ぷりぷり（ちいさな ほし。まわりに トゲが はえて いる）*/
    const ast = chapterInfo(11);
    if (typeof ast.x === 'number') {
      const ax = ast.x * W, ay = ast.y * H, ar = H * 0.098;   // ★ほかの ほしより ちいさめ
      /* トゲ（ぐるっと 14ぼん）*/
      ctx.fillStyle = '#d8b53a';
      for (let i = 0; i < 14; i++) {
        const th = (i / 14) * Math.PI * 2 + 0.2;
        const len = ar * (1.20 + ((i % 3) ? 0.12 : 0.30));
        const wd = 0.10;
        ctx.beginPath();
        ctx.moveTo(ax + Math.cos(th - wd) * ar * 0.96, ay + Math.sin(th - wd) * ar * 0.96);
        ctx.lineTo(ax + Math.cos(th) * len,            ay + Math.sin(th) * len);
        ctx.lineTo(ax + Math.cos(th + wd) * ar * 0.96, ay + Math.sin(th + wd) * ar * 0.96);
        ctx.closePath(); ctx.fill();
      }
      /* ほんたい */
      const ag = ctx.createRadialGradient(ax - ar * 0.3, ay - ar * 0.3, ar * 0.1, ax, ay, ar);
      ag.addColorStop(0, '#f4dd7a'); ag.addColorStop(0.6, '#e3c245'); ag.addColorStop(1, '#a8801d');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fill();
      /* ごうのすけくんの えの よこじま（いわの すじ）*/
      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = 'rgba(70,50,10,.6)';
      ctx.lineWidth = Math.max(1.4, H * 0.0035);
      for (let i = -3; i <= 3; i++) {
        const ly = ay + i * ar * 0.26;
        ctx.beginPath();
        ctx.moveTo(ax - ar, ly);
        ctx.quadraticCurveTo(ax, ly - ar * 0.10, ax + ar, ly + ar * 0.06);
        ctx.stroke();
      }
      ctx.restore();
      /* きいろい ひかり */
      const ah = ctx.createRadialGradient(ax, ay, ar, ax, ay, ar * 1.9);
      ah.addColorStop(0, 'rgba(255,220,90,.26)'); ah.addColorStop(1, 'rgba(255,220,90,0)');
      ctx.fillStyle = ah;
      ctx.beginPath(); ctx.arc(ax, ay, ar * 1.9, 0, Math.PI * 2); ctx.fill();
      /* 木星 → 小惑星ぷりぷり の みち */
      if (typeof jup.x === 'number') {
        ctx.strokeStyle = 'rgba(255,213,79,.5)';
        ctx.lineWidth = Math.max(3, H * 0.008);
        ctx.setLineDash([Math.max(7, H * 0.03), Math.max(6, H * 0.026)]);
        ctx.beginPath();
        /* 木星の したから、すぐ となりの 小惑星へ みじかく つなぐ */
        ctx.moveTo(jup.x * W, jup.y * H + H * 0.16);
        ctx.quadraticCurveTo(ax + ar * 0.6, ay - ar * 2.3, ax + ar * 0.1, ay - ar * 1.05);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    /* ロケットの みち（ちきゅう → 火星）*/
    if (typeof mars.x === 'number') {
      ctx.strokeStyle = 'rgba(255,213,79,.55)';
      ctx.lineWidth = Math.max(3, H * 0.008);
      ctx.setLineDash([Math.max(7, H * 0.03), Math.max(6, H * 0.026)]);
      ctx.beginPath();
      ctx.moveTo(ex + er, ey - er * 0.4);
      ctx.quadraticCurveTo(W * 0.16, H * 0.48, mars.x * W - H * 0.16, mars.y * H + H * 0.05);
      ctx.stroke();
      ctx.setLineDash([]);
    }
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

    /* うちゅうちずの ときは そちらを かいて おわり */
    if (currentWorld === 'space') { drawSpaceMap(ctx, W, H); return; }
    if (currentWorld === 'sun')   { drawSunMap(ctx, W, H); return; }

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

    /* はがねの まち：だい2しょうの まわりを はがねの まちに する */
    const stl = chapterInfo(2);
    if (typeof stl.x === 'number') {
      const sx = stl.x * W, sy = stl.y * H;
      ctx.fillStyle = '#9aa4ad';
      ctx.beginPath(); ctx.ellipse(sx, sy + H * 0.04, W * 0.13, H * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#aeb8c0';
      ctx.beginPath(); ctx.ellipse(sx - W * 0.01, sy + H * 0.01, W * 0.09, H * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      /* ぎんいろの ビル */
      for (let i = 0; i < 4; i++) {
        const bw = W * 0.022, bh = H * (0.09 + (i % 2) * 0.05);
        const bx = sx - W * 0.055 + i * W * 0.032, by = sy + H * 0.03;
        ctx.fillStyle = ['#7d8791', '#8d97a1', '#6e7883', '#98a2ab'][i];
        ctx.fillRect(bx, by - bh, bw, bh);
        ctx.fillStyle = 'rgba(180,225,255,.5)';
        for (let k = 0; k < 4; k++) ctx.fillRect(bx + bw * 0.22, by - bh + bh * (0.12 + k * 0.21), bw * 0.56, bh * 0.10);
      }
      /* おおきな ハグルマ */
      ctx.fillStyle = 'rgba(110,120,130,.9)';
      const gx = sx + W * 0.052, gy = sy - H * 0.02, gr = H * 0.028;
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * Math.PI * 2;
        ctx.fillRect(gx + Math.cos(an) * gr - gr * 0.24, gy + Math.sin(an) * gr - gr * 0.24, gr * 0.48, gr * 0.48);
      }
      ctx.fillStyle = '#aeb8c0';
      ctx.beginPath(); ctx.arc(gx, gy, gr * 0.36, 0, Math.PI * 2); ctx.fill();
    }

    /* 賑わう近海：だい5しょうの まわりを うみに する */
    const sea = chapterInfo(5);
    if (typeof sea.x === 'number') {
      const ox = sea.x * W, oy = sea.y * H;
      const og = ctx.createRadialGradient(ox, oy, H * 0.02, ox, oy, W * 0.20);
      og.addColorStop(0, '#1e88e5'); og.addColorStop(0.65, '#42a5f5'); og.addColorStop(1, '#81d4fa');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.ellipse(ox, oy + H * 0.05, W * 0.20, H * 0.19, 0, 0, Math.PI * 2); ctx.fill();
      /* すなはま */
      ctx.strokeStyle = 'rgba(255,236,179,.85)';
      ctx.lineWidth = Math.max(4, H * 0.02);
      ctx.beginPath(); ctx.ellipse(ox, oy + H * 0.05, W * 0.20, H * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
      /* なみ */
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = Math.max(2, H * 0.008); ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const wy = oy - H * 0.04 + i * H * 0.045;
        const ww = W * (0.11 - Math.abs(i - 2) * 0.025);
        ctx.beginPath();
        ctx.moveTo(ox - ww, wy);
        ctx.quadraticCurveTo(ox - ww * 0.5, wy - H * 0.014, ox, wy);
        ctx.quadraticCurveTo(ox + ww * 0.5, wy + H * 0.014, ox + ww, wy);
        ctx.stroke();
      }
      /* こぶね */
      const bx2 = ox + W * 0.055, by2 = oy - H * 0.02;
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(bx2 - H * 0.032, by2);
      ctx.lineTo(bx2 + H * 0.032, by2);
      ctx.lineTo(bx2 + H * 0.020, by2 + H * 0.020);
      ctx.lineTo(bx2 - H * 0.020, by2 + H * 0.020);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = Math.max(2, H * 0.006);
      ctx.beginPath(); ctx.moveTo(bx2, by2); ctx.lineTo(bx2, by2 - H * 0.05); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(bx2 + H * 0.004, by2 - H * 0.048);
      ctx.lineTo(bx2 + H * 0.036, by2 - H * 0.010);
      ctx.lineTo(bx2 + H * 0.004, by2 - H * 0.010);
      ctx.closePath(); ctx.fill();
    }

    /* 魔導士の里：だい6しょうの まわりを まほうの もりに する */
    const mag = chapterInfo(6);
    if (typeof mag.x === 'number') {
      const mx2 = mag.x * W, my2 = mag.y * H;
      ctx.fillStyle = '#4a2f78';
      ctx.beginPath(); ctx.ellipse(mx2, my2 + H * 0.04, W * 0.145, H * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5e3d94';
      ctx.beginPath(); ctx.ellipse(mx2 - W * 0.012, my2 + H * 0.015, W * 0.10, H * 0.10, 0, 0, Math.PI * 2); ctx.fill();
      /* まほうの とう */
      const tw = W * 0.030, th = H * 0.17;
      const tx2 = mx2 - W * 0.012, ty2 = my2 + H * 0.045;
      ctx.fillStyle = '#3f2a63';
      ctx.fillRect(tx2 - tw / 2, ty2 - th, tw, th);
      ctx.fillStyle = 'rgba(179,157,219,.75)';
      for (let k = 0; k < 3; k++) ctx.fillRect(tx2 - tw * 0.18, ty2 - th + th * (0.20 + k * 0.24), tw * 0.36, th * 0.11);
      /* とんがり やね */
      ctx.fillStyle = '#7e57c2';
      ctx.beginPath();
      ctx.moveTo(tx2 - tw * 0.85, ty2 - th);
      ctx.lineTo(tx2, ty2 - th - H * 0.055);
      ctx.lineTo(tx2 + tw * 0.85, ty2 - th);
      ctx.closePath(); ctx.fill();
      /* うかぶ ルーン */
      ctx.fillStyle = 'rgba(206,147,216,.9)';
      for (const [rx, ry, rr] of [[0.045, -0.055, 0.011], [0.070, -0.010, 0.008], [0.030, 0.020, 0.007], [-0.055, -0.030, 0.009]]) {
        const cx3 = mx2 + W * rx, cy3 = my2 + H * ry, r3 = H * rr;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const an = -Math.PI / 2 + (k / 6) * Math.PI * 2;
          const px = cx3 + Math.cos(an) * r3, py = cy3 + Math.sin(an) * r3;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
    }

    /* 闇の頂：だい7しょう（ボスラッシュ）は くろい やま */
    const dark = chapterInfo(7);
    if (typeof dark.x === 'number') {
      const dx = dark.x * W, dy = dark.y * H;
      /* まわりの やみ */
      const dg = ctx.createRadialGradient(dx, dy, H * 0.02, dx, dy, W * 0.17);
      dg.addColorStop(0, 'rgba(30,10,40,.92)');
      dg.addColorStop(0.6, 'rgba(20,6,28,.7)');
      dg.addColorStop(1, 'rgba(12,4,18,0)');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.ellipse(dx, dy + H * 0.02, W * 0.17, H * 0.19, 0, 0, Math.PI * 2); ctx.fill();
      /* とがった くろい やま（3ぼん）*/
      const peaks = [[-0.045, 0.15, 0.030], [0.010, 0.21, 0.038], [0.055, 0.14, 0.028]];
      peaks.forEach(([px, ph, pw]) => {
        const bxx = dx + W * px, byy = dy + H * 0.075;
        ctx.fillStyle = '#150a1e';
        ctx.beginPath();
        ctx.moveTo(bxx - W * pw, byy);
        ctx.lineTo(bxx, byy - H * ph);
        ctx.lineTo(bxx + W * pw, byy);
        ctx.closePath(); ctx.fill();
        /* あかく ひかる われめ */
        ctx.strokeStyle = 'rgba(229,57,53,.85)';
        ctx.lineWidth = Math.max(1.5, H * 0.005);
        ctx.beginPath();
        ctx.moveTo(bxx, byy - H * ph * 0.85);
        ctx.lineTo(bxx - W * pw * 0.25, byy - H * ph * 0.4);
        ctx.lineTo(bxx + W * pw * 0.12, byy - H * ph * 0.15);
        ctx.stroke();
      });
      /* いただきの あかい ひかり */
      const rg2 = ctx.createRadialGradient(dx + W * 0.010, dy - H * 0.135, 1, dx + W * 0.010, dy - H * 0.135, H * 0.06);
      rg2.addColorStop(0, 'rgba(255,82,82,.9)');
      rg2.addColorStop(1, 'rgba(255,82,82,0)');
      ctx.fillStyle = rg2;
      ctx.beginPath(); ctx.arc(dx + W * 0.010, dy - H * 0.135, H * 0.06, 0, Math.PI * 2); ctx.fill();
    }

    /* き */
    const trees = [[0.05, 0.78], [0.13, 0.68], [0.11, 0.88],
                   /* けものみち（0.33, 0.76）の まわりは きが みっしゅう */
                   [0.24, 0.70], [0.26, 0.88], [0.38, 0.66], [0.41, 0.88], [0.33, 0.94], [0.20, 0.80], [0.44, 0.76]];
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
    const T = currentTower || TOWER;
    const title = $('#tower-title');
    if (title) title.textContent = ((T.world === 'space') ? '🚀 ' : '🗼 ') + T.name;
    $('#tower-lead').textContent = T.desc;
    /* ★つかえる なかまの レア度が きまって いる ステージなら しらせる */
    const lim = $('#tower-limit');
    if (lim) {
      const rs = (T.courses || []).map(cc => cc.allowRarity).filter(Boolean);
      if (rs.length) {
        lim.classList.remove('hidden');
        lim.textContent = '★ステージごとに つかえる なかまの レア度が きまって います';
      } else {
        lim.classList.add('hidden');
      }
    }
    $('#tower-reward-name').textContent = T.rewardName;

    const box = $('#tower-floors');
    box.innerHTML = '';
    const cleared = (s && s.cleared) || {};
    let lockedFloors = 0;
    for (let f = 1; f <= T.floors; f++) {
      const course = T.courses.find(c => c.floor === f) || null;
      const prev   = T.courses.find(c => c.floor === f - 1) || null;
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
        /* label が かいて あれば それを つかう（れい：小惑星ぷりぷりは 10-A・10-B・10-C）*/
        '<span class="stage-no">' + (st.label || (st.chapter + '-' + (st.course || st.no))) + '</span>' +
        '<span class="stage-info"><b>' + (open ? st.name : '？？？') +
            (isNext ? '<span class="next-badge">つぎは ここ！</span>' : '') + '</b>' +
          '<small>' + (open ? st.desc : 'まえの コースを クリアすると あそべます') + '</small>' +
          (open ? '<span class="stage-reward">' +
              dropHtml(st) +
              (cleared[st.no] ? 'けいけんち+' + gainExp(r.exp, false) + '（しゅうかいは すくなめ）'
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
      /* ★わくの いろを レア度に すこし よせる（rar-N / rar-R / … ）*/
      b.className = 'unit-btn rar-' + (def.rarity || 'N');
      b.innerHTML =
        '<canvas class="u-icon"></canvas>' +
        markHtml(def, 'u-mark') +
        '<span class="u-name">' + (shownDef(id) || def).shortName + '</span>' +
        '<span class="u-cost">' + ((shownDef(id) || def).cost) + '</span>' +
        '<span class="cd-mask" style="display:none"></span>';
      b.addEventListener('click', (ev) => { ev.preventDefault(); Game.summon(id); });
      box.appendChild(b);
      unitButtons.push({ id, el: b, mask: b.querySelector('.cd-mask'), icon: b.querySelector('.u-icon') });
    });
  }

  /* ★せんとうの ボタンは かおが みえる ように、うえはんしんを おおきく だす */
  function redrawIcons() { unitButtons.forEach(u => paintCharBust(u.icon, u.id)); }


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
    /* base → だい2けいたい → だい3けいたい の じゅんに かさねます */
    let d = null;
    if (s && s.evolved  && s.evolved[id]  && base.evolve)  d = Object.assign({}, base, base.evolve);
    if (s && s.evolved2 && s.evolved2[id] && base.evolve2) d = Object.assign({}, d || base, base.evolve2);
    return d ? Object.assign(d, { id: id }) : base;
  }
  function shownDrawId(id) {
    const def = shownDef(id);
    return (def && def.drawAs) ? def.drawAs : id;
  }

  /* ============================================================
     ★せんとうの キャラボタンは「うえはんしん（かお）」を おおきく だす

     キャラの えは 1たいずつ おおきさも たかさも ちがう ので、
     きめうちの すうじでは かおが わくから はみだして しまいます。
     そこで、いちど おおきな キャンバスに かいて、
     じっさいに えが ある はんいを ピクセルから しらべ、
     その うえのほう（かお〜むね）が わくに ぴったり はいる ように します。
     しらべた けっかは おぼえて おく ので、おもく なりません。
     ============================================================ */
  const bustBoxCache = {};
  function bustBox(drawId) {
    if (bustBoxCache[drawId] !== undefined) return bustBoxCache[drawId];
    const fn = DRAWERS[drawId];
    if (!fn || typeof document === 'undefined') { bustBoxCache[drawId] = null; return null; }
    const S = 240;
    let box = null;
    try {
      const off = document.createElement('canvas');
      off.width = S; off.height = S;
      const c = off.getContext('2d', { willReadFrequently: true });
      c.clearRect(0, 0, S, S);
      c.save();
      c.translate(S / 2, S * 0.95);          // あしもとを したの ほうに
      c.scale(0.75, 0.75);
      fn(c, { t: 0.7, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.35 });
      c.restore();
      const d = c.getImageData(0, 0, S, S).data;
      let x0 = S, y0 = S, x1 = -1, y1 = -1;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (d[(y * S + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 >= x0 && y1 >= y0) {
        /* かいた ときの ざひょうに もどす */
        box = {
          left:   (x0 - S / 2) / 0.75,
          right:  (x1 - S / 2) / 0.75,
          top:    (y0 - S * 0.95) / 0.75,
          bottom: (y1 - S * 0.95) / 0.75,
        };
      }
    } catch (e) { box = null; }
    bustBoxCache[drawId] = box;
    return box;
  }

  function paintCharBust(canvas, id) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 60, h = canvas.clientHeight || 48;
    if (w < 2 || h < 2) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const drawId = shownDrawId(id);
    const fn = DRAWERS[drawId];
    if (!fn) return;
    const box = bustBox(drawId);

    ctx.save();
    if (box) {
      /* えの たての 55% ぶん（うえから）を きりとって わくに あわせる */
      const bw = Math.max(10, box.right - box.left);
      const bh = Math.max(10, box.bottom - box.top);
      const cutH = bh * 0.55;
      const sc = Math.min(w / (bw * 1.06), h / (cutH * 1.06));
      const cx = (box.left + box.right) / 2;
      const cy = box.top + cutH / 2;
      ctx.translate(w / 2 - cx * sc, h / 2 - cy * sc);
      ctx.scale(sc, sc);
    } else {
      ctx.translate(w / 2, h - 2);
      const sc = Math.min(w / 110, h / 88);
      ctx.scale(sc, sc);
    }
    fn(ctx, { t: 0.7, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.35 });
    ctx.restore();
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
    const T = currentTower || TOWER;
    if (!s || !T.courses.length) return false;
    if (T.courses.length < T.floors) return false;   // まだ ぜんぶ できて いない
    return T.courses.every(c => !!s.cleared[c.no]);
  }

  /* ボスラッシュ（だい7しょう）を ぜんぶ クリアしたら Gコインを どんと もらえる。
     1どだけ。s.bossRush に もらった しるしを のこす。                    */
  /* とくべつステージを ぜんかい クリアした ときの Gコイン（1どだけ）。
     キャラの ごほうびが ない ほう（あき坊の宇宙船）で つかいます。      */
  function giveTowerCoins() {
    const s = slot();
    const T = currentTower;
    if (!s || !T || !T.clearBonus) return 0;
    const key = 'towerBonus_' + (T.name || '');
    if (!s.bonuses) s.bonuses = {};
    if (s.bonuses[key]) return 0;
    if (!T.courses.length || T.courses.length < T.floors) return 0;
    if (!T.courses.every(c => s.cleared[c.no])) return 0;
    s.bonuses[key] = true;
    s.coins = (s.coins || 0) + T.clearBonus;
    storeSave();
    return T.clearBonus;
  }

  function giveBossRushReward() {
    const s = slot();
    if (!s || typeof BOSSRUSH === 'undefined') return 0;
    if (s.bossRush) return 0;                                  // もう もらって いる
    const list = coursesOf(BOSSRUSH.chapter);
    if (!list.length) return 0;
    if (!list.every(st => s.cleared[st.no])) return 0;          // まだ ぜんぶ クリアして いない
    s.bossRush = true;
    s.coins = (s.coins || 0) + BOSSRUSH.clearBonus;
    storeSave();
    return BOSSRUSH.clearBonus;
  }

  function giveTowerReward() {
    const s = slot();
    const T = currentTower || TOWER;
    const id = T.rewardChar;
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
    Game.evolved2 = (s && s.evolved2) ? s.evolved2 : {};
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
    if (effLevel(s, id) < (LEVEL.evolveAt || 10)) { toast('じつりょく Lv.' + (LEVEL.evolveAt || 10) + ' から しんか できます'); return; }
    if (!s.evolved) s.evolved = {};
    if (!s.evolved2) s.evolved2 = {};
    const now = !s.evolved[id];
    if (now) s.evolved[id] = true;
    else { delete s.evolved[id]; delete s.evolved2[id]; }   // もとに もどす ときは だい3も はずす
    storeSave();
    applyParty();
    toast(now ? (UNITS[id].evolve.name + ' に しんかした！')
              : (UNITS[id].name + ' に もどした'));
    buildPower();
    requestAnimationFrame(buildPower);
  }

  /* だい3けいたい ⇄ だい2けいたい を きりかえる（じつりょく Lv.30 から）*/
  function toggleThird(id) {
    const s = slot();
    if (!s || !UNITS[id] || !UNITS[id].evolve2) return;
    if (effLevel(s, id) < LEVEL.max) {
      toast('じつりょく Lv.' + LEVEL.max + ' から だい3けいたいに なれます'); return;
    }
    if (!s.evolved) s.evolved = {};
    if (!s.evolved2) s.evolved2 = {};
    const now = !s.evolved2[id];
    if (now) { s.evolved2[id] = true; s.evolved[id] = true; }   // だい3は だい2の さきに ある
    else delete s.evolved2[id];
    storeSave();
    applyParty();
    toast(now ? (UNITS[id].evolve2.name + ' に なった！')
              : (UNITS[id].evolve.name + ' に もどした'));
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
      const isEv  = !!(s.evolved  && s.evolved[id]  && base.evolve);
      const isEv3 = !!(s.evolved2 && s.evolved2[id] && base.evolve2);
      const canEv = !!base.evolve;
      const lv   = s.levels[id] || 1;
      const plus = (s.plus && s.plus[id]) || 0;
      const eff  = effLevel(s, id);
      const cost = levelUpCost(lv);
      const mul  = levelMult(eff, base.rarity);
      const maxed = (cost === null);
      const can  = !maxed && (s.exp || 0) >= cost;
      const canEvolve = eff >= (LEVEL.evolveAt || 10);
      /* ★じつりょく Lv.30（じょうげん）で だい3けいたいの けんりを えます。
         まだ つくって いない ので、いまは「じゅんびちゅう」と だします。 */
      const canThird = eff >= LEVEL.max;

      const row = document.createElement('div');
      row.className = 'power-row';
      row.innerHTML =
        '<canvas></canvas>' +
        '<span class="pr-info">' +
          '<span class="pr-name">' + def.name +
            (isEv3 ? ' <span class="pr-ev">だい3けいたい</span>'
                   : (isEv ? ' <span class="pr-ev">しんか</span>' : '')) + '</span>' +
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
          ev.innerHTML = 'しんか<br><small>Lv.' + (LEVEL.evolveAt || 10) + 'から</small>';
          ev.disabled = true;
        }
        row.appendChild(ev);

        /* ★じつりょく Lv.30 で「だい3けいたい」に なれます。
           evolve2 が かいて ある キャラだけ ほんとうに なれます。      */
        if (canThird) {
          const t3 = document.createElement('button');
          t3.className = 'pr-btn evolve third' + (isEv3 ? ' on' : '');
          if (base.evolve2) {
            t3.innerHTML = isEv3 ? 'だい2けいたい<br><small>に もどす</small>'
                                 : 'だい3けいたい<br><small>' + base.evolve2.name + '</small>';
            t3.addEventListener('click', () => toggleThird(id));
          } else {
            t3.innerHTML = 'だい3けいたい<br><small>じゅんびちゅう</small>';
            t3.addEventListener('click', () =>
              toast('Lv.' + LEVEL.max + ' たっせい！　この キャラの だい3けいたいは じゅんびちゅうです'));
          }
          row.appendChild(t3);
        }
      } else if (maxed) {
        const ev = document.createElement('button');
        ev.className = 'pr-btn evolve';
        ev.innerHTML = (canThird ? 'だい3けいたい' : 'しんか') + '<br><small>じゅんびちゅう</small>';
        if (canThird) ev.classList.add('third');
        ev.addEventListener('click', () => toast(canThird
          ? ('Lv.' + LEVEL.max + ' たっせい！　だい3けいたいは じゅんびちゅうです')
          : 'この キャラの しんかは じゅんびちゅう！'));
        row.appendChild(ev);
      }
      box.appendChild(row);
      paintChar(row.querySelector('canvas'), id);
    });
  }


  /* キャラボタン・へんせいの わくに つける ちいさな しるし
     （どの ぞくせいで、どのくらい レアか が ひとめで わかる ように）*/

  /* =================================================
     ごうのすけの へや

     ・かぐは すきな ところに おける（ゆびで つかんで うごかす）
     ・ばしょは へやの わりあい（0〜1）で セーブに のこす
     ・なかまを タップすると おしゃべりする
     ================================================= */
  let roomTab = 'item';
  let roomDrag = null;        // うごかして いる かぐ
  let roomTime = 0;
  let roomRaf  = null;
  /* ★いま みて いる ばしょ。'room'＝へや / 'garden'＝にわ
       おなじ がめんを つかいまわして、じょうたいだけ きりかえます。 */
  let roomScene = 'room';
  const isGarden = () => roomScene === 'garden';
  /* にわの じめんの たかさ（がめんの たかさに たいする わりあい）。
     かぐと なかまは この したに おきます。 */
  const GARDEN_FLOOR = 0.62;

  /* セーブの なかの にわの じょうたい（なければ つくる）*/
  function gardenState() {
    const s = slot();
    if (!s) return null;
    if (!s.garden) {
      s.garden = { placed: {}, char: null, charPos: { x: 0.50, y: 0.88 }, since: 0, size: 0 };
    }
    const g = s.garden;
    if (!g.placed) g.placed = {};
    if (!g.charPos) g.charPos = { x: 0.50, y: 0.86 };
    if (typeof g.since !== 'number') g.since = 0;
    if (typeof g.size !== 'number') g.size = 0;
    if (!s.gardenPlus) s.gardenPlus = {};
    return g;
  }

  /* ★にわに いた ぶんの レベルを けいさんして たす
       えらんでから 24じかん ごとに ＋1。1たい ＋10 まで。
       24じかん たって いない ぶんは since に のこして おくので、
       とちゅうで べつの こに かえると その ぶんは きえます。      */
  function gardenTick() {
    const s = slot(); if (!s) return 0;
    const g = gardenState(); if (!g || !g.char) return 0;
    const day = (typeof GARDEN !== 'undefined') ? GARDEN.dayMs : 86400000;
    const max = (typeof GARDEN !== 'undefined') ? GARDEN.maxPlus : 10;
    if (!g.since) { g.since = Date.now(); return 0; }
    const now = Date.now();
    let days = Math.floor((now - g.since) / day);
    if (days <= 0) return 0;
    const have = s.gardenPlus[g.char] || 0;
    const add = Math.max(0, Math.min(days, max - have));
    /* あがった ぶんだけ じかんを すすめる（あまった じかんは のこす）*/
    g.since += days * day;
    if (add > 0) { s.gardenPlus[g.char] = have + add; storeSave(); }
    else storeSave();
    return add;
  }

  /* セーブの なかの へやの じょうたい（なければ つくる）*/
  function roomState() {
    if (isGarden()) return gardenState();
    const s = slot();
    if (!s) return null;
    if (!s.room) {
      s.room = {
        wall: 'wall_cream',
        placed: {},          // { かぐの id: {x, y} } … おいて ある かぐ
        char: null,          // へやに いる なかま
        charPos: { x: 0.52, y: 0.80 },
      };
      /* さいしょは ソファ・カーペット・テレビ・しょくぶつを おいて おく */
      ['carpet_red', 'sofa_green', 'tv', 'plant'].forEach(id => {
        const it = roomItem(id);
        if (it) s.room.placed[id] = { x: it.x, y: it.y };
      });
      const own = (Array.isArray(s.owned) && s.owned.length) ? s.owned : DEFAULT_PARTY;
      s.room.char = own[0] || null;
    }
    if (!s.room.placed) s.room.placed = {};
    if (!s.room.charPos) s.room.charPos = { x: 0.52, y: 0.80 };
    if (typeof s.room.size !== 'number') s.room.size = 0;   // へやの ひろさ（0〜3）
    return s.room;
  }
  /* いまの へやの ひろさ（かぐを かく ときの めやすの よこはば）*/
  function roomSizeInfo(lv) {
    const list = (typeof ROOM_SIZES !== 'undefined') ? ROOM_SIZES : null;
    if (!list) return { lv: 0, name: 'へや', size: 520, cost: null };
    return list[Math.max(0, Math.min(list.length - 1, lv | 0))];
  }
  function roomItem(id) { return ROOM_ITEMS.find(x => x.id === id) || null; }

  /* ---- そざい ----
     s.mats = { wood: 3, iron: 1, … } の かたちで もって います。 */
  function mats() {
    const s = slot();
    if (!s) return {};
    if (!s.mats) s.mats = {};
    return s.mats;
  }
  function matCount(id) { return mats()[id] || 0; }
  function addMat(id, n) {
    const mm = mats();
    mm[id] = (mm[id] || 0) + n;
  }
  /* つくった もの（id の いちらん）*/
  function madeList() {
    const s = slot();
    if (!s) return [];
    if (!Array.isArray(s.made)) s.made = [];
    return s.made;
  }

  /* ★ステージクリアの ドロップ。3しゅるい それぞれ 30%。 */
  function rollDrops(course) {
    const list = (course && Array.isArray(course.drops)) ? course.drops : [];
    const rate = (typeof DROP_RATE === 'number') ? DROP_RATE : 0.3;
    const got = [];
    list.forEach(id => { if (MATERIALS[id] && Math.random() < rate) { addMat(id, 1); got.push(id); } });
    return got;
  }

  /* つくれるか */
  function canCraft(pat) {
    const c = pat.cost || {};
    return Object.keys(c).every(k => matCount(k) >= c[k]);
  }
  function doCraft(pat) {
    if (!canCraft(pat)) return false;
    const c = pat.cost || {};
    Object.keys(c).forEach(k => addMat(k, -c[k]));
    const made = madeList();
    if (made.indexOf(pat.id) < 0) made.push(pat.id);
    storeSave();
    return true;
  }
  function roomWallColors() {
    const r = roomState();
    const w = r && roomItem(r.wall);
    return (w && w.colors) || ROOM_ITEMS[0].colors;
  }

  function refreshSceneUi() {
    const t = $('#room-title');
    if (t) t.textContent = isGarden() ? '🌳 ごうのすけの にわ' : '🛋️ ごうのすけの へや';
    const b = $('#btn-room-scene');
    if (b) b.textContent = isGarden() ? '🏠 へやへ' : '🌳 にわへ';
    const h = $('#room-hint');
    if (h) h.textContent = isGarden()
      ? 'なかまを にわに おくと 24じかんで レベルが 1つ あがるよ（1たい ＋10まで）'
      : 'かぐを ゆびで うごかせるよ。なかまを タップすると おはなし するよ！';
  }

  function openRoom() {
    roomState();
    show('screen-room');
    refreshSceneUi();
    buildRoomTabs();
    buildRoomTray();
    startRoomLoop();
    requestAnimationFrame(() => { drawRoom(); });
  }
  function closeRoom() { closeStore(); closeCraftAsk(); closeMix(); closeMixAsk(); stopRoomLoop(); storeSave(); openHome(); }

  /* ★へや ⇄ にわ（よこに すべる）*/
  function switchScene() {
    roomScene = isGarden() ? 'room' : 'garden';
    if (isGarden()) {
      const got = gardenTick();
      if (got > 0) {
        const g = gardenState();
        toast((UNITS[g.char] ? UNITS[g.char].name : 'なかま') + ' が にわで ＋' + got + ' レベル あがった！');
      }
    }
    /* にわに かべがみ・カーペットの タブは ない ので もどす */
    if (isGarden() && (roomTab === 'wall' || roomTab === 'floor')) roomTab = 'item';
    refreshSceneUi();
    buildRoomTabs();
    buildRoomTray();
    drawRoom();
    const st = document.querySelector('.room-stage');
    if (st) {
      const cls = isGarden() ? 'map-slide-in-right' : 'map-slide-in-left';
      st.classList.remove('map-slide-in-right', 'map-slide-in-left');
      void st.offsetWidth;
      st.classList.add(cls);
      setTimeout(() => st.classList.remove(cls), 320);
    }
  }

  function startRoomLoop() {
    stopRoomLoop();
    let last = performance.now();
    const tick = (now) => {
      roomTime += Math.min(0.05, (now - last) / 1000); last = now;
      drawRoom();
      roomRaf = requestAnimationFrame(tick);
    };
    roomRaf = requestAnimationFrame(tick);
  }
  function stopRoomLoop() { if (roomRaf) cancelAnimationFrame(roomRaf); roomRaf = null; }

  /* ---- へやを かく ---- */
  function drawRoom() {
    const cv = $('#room-canvas');
    if (!cv || $('#screen-room').classList.contains('active') === false) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth || 400, H = cv.clientHeight || 260;
    if (W < 2 || H < 2) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (isGarden()) { drawGardenBg(ctx, W, H); }
    else { drawRoomBg(ctx, W, H); }
    drawStorage(ctx, W, H);
    drawRoomStuff(ctx, W, H);
  }

  /* ---- へやの はいけい（かべ・まど・ゆか）---- */
  function drawRoomBg(ctx, W, H) {
    const col = roomWallColors();
    const floorY = H * 0.62;

    /* かべ */
    ctx.fillStyle = col.wall;
    ctx.fillRect(0, 0, W, floorY);
    ctx.strokeStyle = col.wallLine; ctx.lineWidth = 2;
    for (let x = W * 0.08; x < W; x += W * 0.16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floorY); ctx.stroke();
    }
    /* まど */
    ctx.fillStyle = 'rgba(129,212,250,.85)';
    roundRect(ctx, W * 0.60, H * 0.10, W * 0.26, H * 0.30, 8); ctx.fill();
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5;
    roundRect(ctx, W * 0.60, H * 0.10, W * 0.26, H * 0.30, 8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.73, H * 0.10); ctx.lineTo(W * 0.73, H * 0.40);
    ctx.moveTo(W * 0.60, H * 0.25); ctx.lineTo(W * 0.86, H * 0.25);
    ctx.stroke();

    /* ゆか */
    ctx.fillStyle = col.floor;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = col.floorLine; ctx.lineWidth = 2;
    for (let i = 1; i < 7; i++) {
      const y = floorY + (H - floorY) * (i / 7);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    /* はばき */
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.fillRect(0, floorY - 6, W, 6);
  }

  /* ---- にわの はいけい（ごうのすけくんの えの とおり）----
       あおい そら、あかい たいよう と ひかり、みどりの いけがき、
       そして したは すなの じめん。                              */
  function drawGardenBg(ctx, W, H) {
    /* そら */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5fc6ef'); sky.addColorStop(1, '#9fdcf6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    /* ★たいよう（うえの まんなか。はんぶんだけ みえて いる）*/
    const sx = W * 0.50, sy = -H * 0.06, sr = Math.min(W * 0.15, H * 0.30);
    ctx.fillStyle = '#e8401f';
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    /* ひかり（まるい ぼうが 7ほん）*/
    ctx.strokeStyle = '#e8401f';
    ctx.lineWidth = Math.max(7, H * 0.035);
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.10 + i * 0.133);              // した がわに ひろがる
      const r0 = sr * 1.22, r1 = sr * 1.62;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
      ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
      ctx.stroke();
    }

    /* ★すなの じめん。ここが「にわの ゆか」で、かぐも なかまも ここに たちます。
         えの とおり、ひだりはしと みぎはしが たかく、まんなかが ひくい かたち。 */
    const gy = GARDEN_FLOOR;          // まんなかの じめんの たかさ（わりあい）
    const ey = 0.34;                  // はしの じめんの たかさ（わりあい）
    ctx.fillStyle = '#ddd5c4';
    ctx.beginPath();
    ctx.moveTo(0, H * ey);
    ctx.lineTo(W * 0.20, H * gy);
    ctx.lineTo(W * 0.80, H * gy);
    ctx.lineTo(W, H * ey);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();
    /* すなの もよう */
    ctx.strokeStyle = 'rgba(160,145,115,.35)'; ctx.lineWidth = 1.6;
    for (let i = 1; i < 5; i++) {
      const y = H * gy + (H - H * gy) * (i / 5);
      ctx.beginPath(); ctx.moveTo(W * 0.04, y); ctx.lineTo(W * 0.96, y); ctx.stroke();
    }

    /* ★みどりの いけがき（そらと じめんの さかいめ）*/
    ctx.strokeStyle = '#6ec92e';
    ctx.lineWidth = Math.max(9, H * 0.045);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, H * ey);
    ctx.lineTo(W * 0.20, H * gy);
    ctx.lineTo(W * 0.80, H * gy);
    ctx.lineTo(W, H * ey);
    ctx.stroke();

    /* とおくの くも */
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 3; i++) {
      const cx = W * (0.12 + i * 0.34), cy = H * (0.16 + (i % 2) * 0.10), r = H * 0.045;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.9, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.9, cy + r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---- はしっこの 「おしいれ」／「そうこ」----
       ここに かぐを スワイプして いれると、おいて ある ぶんから はずれます。
       ★おしいれと そうこは うらで つながって いる★ ので、
       へやで しまった ものは にわの そうこからも だせます
       （おいて いない かぐは、どちらの「かぐ」タブにも でて きます）。 */
  function storageRect(W, H) {
    return { x: W * 0.898, y: H * 0.34, w: W * 0.096, h: H * 0.56 };
  }
  function drawStorage(ctx, W, H) {
    const R = storageRect(W, H);
    const garden = isGarden();
    const body = garden ? '#8d6e63' : '#c8a06a';
    const dark = garden ? '#5d4037' : '#8d6e63';
    /* ほんたい */
    ctx.fillStyle = body;
    roundRect(ctx, R.x, R.y, R.w, R.h, 6); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3;
    roundRect(ctx, R.x, R.y, R.w, R.h, 6); ctx.stroke();
    /* やね（そうこ だけ）*/
    if (garden) {
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(R.x - 6, R.y);
      ctx.lineTo(R.x + R.w / 2, R.y - H * 0.07);
      ctx.lineTo(R.x + R.w + 6, R.y);
      ctx.closePath(); ctx.fill();
    }
    /* ★いりぐち（くらい あな）*/
    const ix = R.x + R.w * 0.16, iy = R.y + R.h * 0.30;
    const iw = R.w * 0.68, ih = R.h * 0.62;
    ctx.fillStyle = 'rgba(30,20,10,.82)';
    roundRect(ctx, ix, iy, iw, ih, 5); ctx.fill();
    /* とびらの わく */
    ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
    roundRect(ctx, ix, iy, iw, ih, 5); ctx.stroke();
    /* ドラッグちゅうは ひかって しらせる */
    if (roomDrag && roomDrag.id !== '__char') {
      ctx.strokeStyle = 'rgba(255,213,79,.95)'; ctx.lineWidth = 4;
      ctx.setLineDash([7, 5]);
      roundRect(ctx, R.x - 3, R.y - 3, R.w + 6, R.h + 6, 8); ctx.stroke();
      ctx.setLineDash([]);
    }
    /* なまえ */
    /* なまえは そうこの はばに おさまる おおきさに する */
    const label = garden ? 'そうこ' : 'おしいれ';
    ctx.fillStyle = '#fff8e1';
    ctx.textAlign = 'center';
    const fs = Math.max(8, Math.min(Math.round(H * 0.055), Math.floor(R.w / label.length) - 1));
    ctx.font = 'bold ' + fs + 'px sans-serif';
    ctx.fillText(label, R.x + R.w / 2, R.y + R.h * 0.22);
    ctx.textAlign = 'start';
  }

  /* ---- かぐと なかまを かく ---- */
  function drawRoomStuff(ctx, W, H) {
    /* かぐ（ゆかに しく ものが さき）*/
    const r = roomState();
    if (!r) return;
    const list = roomPlacedList();
    list.forEach(o => {
      const it = o.item;
      const fn = ROOM_DRAWERS[it.draw];
      if (!fn) return;
      const sc = roomScale(W, H, it);
      ctx.save();
      ctx.translate(o.px, o.py);
      ctx.scale(sc, sc);
      fn(ctx, { t: roomTime, pal: it.palette });
      ctx.restore();
      if (roomDrag && roomDrag.id === it.id) roomOutline(ctx, o, sc, it);
    });

    /* なかま */
    if (r.char && UNITS[r.char]) {
      const px = r.charPos.x * W, py = r.charPos.y * H;
      const fn = DRAWERS[shownDrawId(r.char)];
      if (fn) {
        const sc = Math.min(W, H) / 300;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(sc, sc);
        fn(ctx, { t: roomTime, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.35 });
        ctx.restore();
      }
      if (roomDrag && roomDrag.id === '__char') {
        ctx.strokeStyle = 'rgba(255,183,77,.9)'; ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(px - 40, py - 100, 80, 104);
        ctx.setLineDash([]);
      }
    }
  }

  function roomOutline(ctx, o, sc, it) {
    ctx.strokeStyle = 'rgba(255,183,77,.9)'; ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(o.px - it.w * sc / 2, o.py - it.h * sc, it.w * sc, it.h * sc);
    ctx.setLineDash([]);
  }

  /* ★へやを ひろげると、かぐは そのぶん ちいさく かかれます。
       がめんの おおきさは かわらない ので、ちいさく なった ぶんだけ
       たくさん おける ように なります。                          */
  function roomScale(W, H, it) {
    const r = roomState();
    const base = roomSizeInfo(r ? r.size : 0).size;
    return Math.min(W / base, H / (300 * base / 520));
  }

  /* おいて ある かぐを「ゆかに しく もの → おく もの」の じゅんに */
  function roomPlacedList() {
    const cv = $('#room-canvas');
    const W = cv ? (cv.clientWidth || 400) : 400;
    const H = cv ? (cv.clientHeight || 260) : 260;
    const r = roomState();
    if (!r) return [];
    const out = [];
    Object.keys(r.placed).forEach(id => {
      const it = roomItem(id);
      if (!it || it.kind === 'wall') return;
      const pos = r.placed[id];
      out.push({ id, item: it, px: pos.x * W, py: pos.y * H });
    });
    out.sort((a, b) => (a.item.kind === 'floor' ? 0 : 1) - (b.item.kind === 'floor' ? 0 : 1)
                     || a.py - b.py);
    return out;
  }

  /* ---- ゆびで つかんで うごかす ---- */
  function roomPick(mx, my) {
    const cv = $('#room-canvas');
    const W = cv.clientWidth, H = cv.clientHeight;
    const r = roomState();
    /* なかま が いちばん てまえ */
    if (r.char && UNITS[r.char]) {
      const px = r.charPos.x * W, py = r.charPos.y * H;
      if (mx > px - 42 && mx < px + 42 && my > py - 104 && my < py + 8) {
        return { id: '__char', dx: mx - px, dy: my - py };
      }
    }
    const list = roomPlacedList().slice().reverse();   // てまえから
    for (const o of list) {
      const sc = roomScale(W, H, o.item);
      const w = o.item.w * sc, hh = o.item.h * sc;
      if (mx > o.px - w / 2 && mx < o.px + w / 2 && my > o.py - hh && my < o.py + 10) {
        return { id: o.id, dx: mx - o.px, dy: my - o.py };
      }
    }
    return null;
  }

  function roomSay(id) {
    const lines = (typeof ROOM_TALK !== 'undefined' && ROOM_TALK[id]) ? ROOM_TALK[id]
                : (typeof ROOM_TALK_ANY !== 'undefined' ? ROOM_TALK_ANY : ['よんだ？']);
    const box = $('#room-talk');
    if (!box) return;
    box.textContent = (UNITS[id] ? UNITS[id].name + '「' : '「')
                    + lines[Math.floor(Math.random() * lines.length)] + '」';
    box.classList.remove('hidden');
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.add('hidden'), 2800);
  }

  function bindRoomCanvas() {
    const cv = $('#room-canvas');
    if (!cv || cv._bound) return;
    cv._bound = true;
    let moved = false, startX = 0, startY = 0;
    const pos = (ev) => {
      const rect = cv.getBoundingClientRect();
      const t = ev.touches ? ev.touches[0] : ev;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    let downOnStore = false;
    const down = (ev) => {
      const q = pos(ev);
      /* ★そうこ／おしいれを タップしたか（かぐを つかんで いない ときだけ）*/
      const R = storageRect(cv.clientWidth, cv.clientHeight);
      roomDrag = roomPick(q.x, q.y);
      downOnStore = !roomDrag && q.x > R.x && q.x < R.x + R.w && q.y > R.y - 12 && q.y < R.y + R.h;
      moved = false; startX = q.x; startY = q.y;
      if (roomDrag || downOnStore) ev.preventDefault();
    };
    const move = (ev) => {
      if (!roomDrag) {
        if (downOnStore) {
          const q2 = pos(ev);
          if (Math.abs(q2.x - startX) > 8 || Math.abs(q2.y - startY) > 8) moved = true;
        }
        return;
      }
      ev.preventDefault();
      const q = pos(ev);
      if (Math.abs(q.x - startX) > 6 || Math.abs(q.y - startY) > 6) moved = true;
      if (!moved) return;
      const W = cv.clientWidth, H = cv.clientHeight;
      const nx = Math.min(0.98, Math.max(0.02, (q.x - roomDrag.dx) / W));
      /* にわでは いけがきより したの「じめん」に しか おけません */
      const minY = isGarden() ? (GARDEN_FLOOR + 0.04) : 0.30;
      const ny = Math.min(0.99, Math.max(minY, (q.y - roomDrag.dy) / H));
      const r = roomState();
      if (roomDrag.id === '__char') r.charPos = { x: nx, y: ny };
      else if (r.placed[roomDrag.id]) r.placed[roomDrag.id] = { x: nx, y: ny };
    };
    const up = (ev) => {
      if (!roomDrag && downOnStore && !moved) { downOnStore = false; openStore(); return; }
      downOnStore = false;
      if (roomDrag) {
        const r = roomState();
        if (!moved && roomDrag.id === '__char') roomSay(r.char);
        /* ★そうこ／おしいれの うえで はなしたら しまう */
        if (moved && roomDrag.id !== '__char' && r.placed[roomDrag.id]) {
          const W = cv.clientWidth, H = cv.clientHeight;
          const R = storageRect(W, H);
          const pos = r.placed[roomDrag.id];
          const px = pos.x * W, py = pos.y * H;
          if (px > R.x - 10 && px < R.x + R.w + 10 && py > R.y - 10 && py < R.y + R.h + 30) {
            const it = roomItem(roomDrag.id);
            delete r.placed[roomDrag.id];
            toast((it ? it.name : 'かぐ') + ' を ' + (isGarden() ? 'そうこ' : 'おしいれ') + ' に しまった！');
            buildRoomTray();
          }
        }
        storeSave();
      }
      roomDrag = null;
    };
    cv.addEventListener('mousedown', down);
    cv.addEventListener('touchstart', down, { passive: false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
  }

  /* ---- したの タブと もちもの ---- */
  function buildRoomTabs() {
    const box = $('#room-tabs');
    if (!box) return;
    /* にわには かべも ゆかも ない ので、その 2つは ださない */
    const tabs = isGarden()
      ? [['item', '🛋️ かぐ'], ['char', '😊 なかま'], ['craft', '🔨 つくる'], ['size', '📐 ひろげる']]
      : [['item', '🛋️ かぐ'], ['floor', '🟥 カーペット'], ['wall', '🎨 かべがみ'],
         ['char', '😊 なかま'], ['craft', '🔨 つくる'], ['size', '📐 ひろげる']];
    box.innerHTML = '';
    tabs.forEach(([k, label]) => {
      const b = document.createElement('button');
      b.className = 'room-tab' + (roomTab === k ? ' on' : '');
      b.textContent = label;
      b.addEventListener('click', () => { roomTab = k; buildRoomTabs(); buildRoomTray(); });
      box.appendChild(b);
    });
  }

  /* ★そざいの かず（スクロールしても かくれない ばしょに かく）
       「つくる」と「ひろげる」の ときだけ だします。            */
  function buildMatBar() {
    const bar = $('#room-mats');
    if (!bar) return;
    const show = (roomTab === 'craft' || roomTab === 'size');
    bar.classList.toggle('hidden', !show);
    if (!show) { bar.innerHTML = ''; return; }
    bar.innerHTML = '';
    MATERIAL_ORDER.forEach(id => {
      const mt = MATERIALS[id];
      const chip = document.createElement('span');
      chip.className = 'mat-chip';
      chip.innerHTML = mt.icon + mt.name + ' <b>' + matCount(id) + '</b>';
      bar.appendChild(chip);
    });
  }

  function buildRoomTray() {
    const box = $('#room-tray');
    if (!box) return;
    buildMatBar();
    box.innerHTML = '';
    const r = roomState();
    const s = slot();

    if (roomTab === 'char') {
      const own = (s && Array.isArray(s.owned) && s.owned.length) ? s.owned : DEFAULT_PARTY;
      own.forEach(id => {
        if (!UNITS[id]) return;
        const b = document.createElement('button');
        b.className = 'room-item' + (r.char === id ? ' on' : '');
        const gp = gardenPlus(s, id);
        b.innerHTML = '<canvas></canvas><span class="ri-name">' + (shownDef(id) || UNITS[id]).shortName + '</span>' +
          (isGarden() ? '<span class="ri-cost">にわ ＋' + gp + '</span>' : '');
        b.addEventListener('click', () => {
          const was = r.char;
          r.char = (r.char === id) ? null : id;
          if (isGarden() && r.char !== was) {
            /* ★べつの こに かえたら、24じかんの かぞえを 0から やりなおし。
               とちゅうまで たまって いた ぶんは きえます。 */
            r.since = r.char ? Date.now() : 0;
            const max = (typeof GARDEN !== 'undefined') ? GARDEN.maxPlus : 10;
            if (r.char) {
              const now = gardenPlus(s, r.char);
              toast(UNITS[r.char].name + ' を にわに おいた！　いま ＋' + now + ' ／ ＋' + max + 'まで');
            }
          }
          storeSave(); buildRoomTray();
        });
        box.appendChild(b);
        paintCharBust(b.querySelector('canvas'), id);
      });
      return;
    }

    if (roomTab === 'craft') { buildCraftTray(box); return; }
    if (roomTab === 'size')  { buildSizeTray(box); return; }

    /* さいしょから もって いる ぶん ＋ つくった ぶん */
    const made = madeList();
    ROOM_ITEMS.filter(it => it.kind === roomTab &&
        (it.got === 'start' || made.indexOf(it.id) >= 0)).forEach(it => {
      const on = (it.kind === 'wall') ? (r.wall === it.id) : !!r.placed[it.id];
      const b = document.createElement('button');
      b.className = 'room-item' + (on ? ' on' : '');
      b.innerHTML = '<canvas></canvas>' +
                    (it.kind === 'wall' ? '' : whereTag(it.id)) +
                    '<span class="ri-name">' + it.name + '</span>';
      b.addEventListener('click', () => {
        if (it.kind === 'wall') { r.wall = it.id; }
        else if (r.placed[it.id]) { delete r.placed[it.id]; }
        else {
          /* ★おなじ かぐは 1つ だけ。へやと にわの りょうほうには おけません。
             もういっぽうに おいて あったら、そちらから はずします。      */
          const other = isGarden() ? (s && s.room) : (s && s.garden);
          if (other && other.placed && other.placed[it.id]) {
            delete other.placed[it.id];
            toast(it.name + ' を ' + (isGarden() ? 'へや' : 'にわ') + ' から もって きた！');
          }
          const y0 = isGarden() ? Math.max(it.y, GARDEN_FLOOR + 0.12) : it.y;
          r.placed[it.id] = { x: it.x, y: y0 };
        }
        storeSave(); buildRoomTray();
      });
      box.appendChild(b);
      paintRoomItem(b.querySelector('canvas'), it);
    });
  }

  /* ★つくる：20しゅるい × 5いろ ＝ 100パターン */
  function buildCraftTray(box) {
    /* そざいの かずは buildMatBar() が がめんの うえの ほうに かきます
       （ここに いれると スクロールで かくれて しまう ため）*/
    const made = madeList();
    CRAFT_PATTERNS.forEach(pat => {
      const has = made.indexOf(pat.id) >= 0;
      const can = canCraft(pat);
      const b = document.createElement('button');
      b.className = 'room-item craft-item' + (has ? ' made' : (can ? '' : ' cant'));
      const cost = Object.keys(pat.cost).map(k => MATERIALS[k].icon + pat.cost[k]).join(' ');
      b.innerHTML = '<canvas></canvas>' +
                    (has ? whereTag(pat.id) : '') +
                    '<span class="ri-name">' + pat.name + '</span>' +
                    '<span class="ri-cost">' + (has ? 'つくった！' : cost) + '</span>';
      b.addEventListener('click', () => {
        if (has) { toast('もう つくって あるよ。「かぐ」から おけるよ！'); return; }
        if (!canCraft(pat)) { toast('そざいが たりないよ…'); return; }
        askCraft(pat);        /* ★まちがって つくらない ように かくにんする */
      });
      box.appendChild(b);
      paintRoomItem(b.querySelector('canvas'), pat);
    });
  }

  /* ★へやを ひろげる がめん
       そざいを はらって へやを おおきく します。
       ひろげると かぐが ちいさく かかれる ので、たくさん おけます。 */
  function buildSizeTray(box) {
    const r = roomState();
    const list = (typeof ROOM_SIZES !== 'undefined') ? ROOM_SIZES : [];
    const now = r ? (r.size | 0) : 0;

    /* そざいの かずは buildMatBar() が がめんの うえの ほうに かきます */
    const lead = document.createElement('p');
    lead.className = 'size-lead';
    lead.textContent = 'いまの へや：' + list[now].name +
      '　ひろげると かぐが ちいさく なって、たくさん おけるよ！';
    box.appendChild(lead);

    list.forEach((sz, i) => {
      if (i === 0) return;                            // さいしょの ひろさは ボタンに しない
      const done = now >= i;
      const next = (now === i - 1);
      const can  = next && Object.keys(sz.cost).every(k => matCount(k) >= sz.cost[k]);
      const b = document.createElement('button');
      b.className = 'room-item size-item' + (done ? ' made' : (can ? '' : ' cant'));
      const cost = Object.keys(sz.cost).map(k => MATERIALS[k].icon + sz.cost[k]).join(' ');
      b.innerHTML = '<span class="si-mark">' + (done ? '✅' : (next ? '📐' : '🔒')) + '</span>' +
                    '<span class="ri-name">' + sz.name + '</span>' +
                    '<span class="ri-cost">' + (done ? 'ひろげた！' : cost) + '</span>';
      b.addEventListener('click', () => {
        if (done) { toast('もう ひろげて あるよ！'); return; }
        if (!next) { toast('ひとつ まえの ひろさから じゅんばんに ひろげてね'); return; }
        if (!can) { toast('そざいが たりないよ…'); return; }
        Object.keys(sz.cost).forEach(k => addMat(k, -sz.cost[k]));
        r.size = i;
        storeSave();
        toast('へやが 「' + sz.name + '」に なった！');
        buildRoomTray(); drawRoom();
      });
      box.appendChild(b);
    });
  }

  /* ★その かぐが いま どこに あるか（へや / にわ / ものおき）*/
  function whereIs(id) {
    const s = slot();
    if (s && s.room   && s.room.placed   && s.room.placed[id])   return 'room';
    if (s && s.garden && s.garden.placed && s.garden.placed[id]) return 'grdn';
    return 'store';
  }
  const WHERE_LABEL = { room: 'へや', grdn: 'にわ', store: 'ものおき' };
  function whereTag(id) {
    const w = whereIs(id);
    return '<span class="ri-where ' + w + '">' + WHERE_LABEL[w] + '</span>';
  }

  /* ★ものおき（おしいれ と そうこ が つながって いる ばしょ）
       へやにも にわにも おいて いない かぐが、ここに ならびます。
       タップすると、いま みて いる ばしょ（へや／にわ）に でて きます。 */
  function storeList() {
    const made = madeList();
    return ROOM_ITEMS.filter(it =>
      it.kind !== 'wall' &&
      (it.got === 'start' || made.indexOf(it.id) >= 0) &&
      whereIs(it.id) === 'store');
  }
  function openStore() {
    const box = $('#store-grid');
    const sub = $('#store-sub');
    if (!box) return;
    if (sub) sub.textContent = 'タップすると ' + (isGarden() ? 'にわ' : 'へや') + ' に だせるよ';
    box.innerHTML = '';
    const list = storeList();
    if (!list.length) {
      const e = document.createElement('p');
      e.className = 'store-empty';
      e.textContent = 'いまは からっぽ です。かぐを つかんで おしいれ／そうこに いれると ここに はいります。';
      box.appendChild(e);
    } else {
      list.forEach(it => {
        const b = document.createElement('button');
        b.className = 'room-item';
        b.innerHTML = '<canvas></canvas><span class="ri-name">' + it.name + '</span>';
        b.addEventListener('click', () => {
          const r = roomState();
          const y0 = isGarden() ? Math.max(it.y, GARDEN_FLOOR + 0.12) : it.y;
          r.placed[it.id] = { x: it.x, y: y0 };
          storeSave();
          toast(it.name + ' を ' + (isGarden() ? 'にわ' : 'へや') + ' に だした！');
          openStore(); buildRoomTray();
        });
        box.appendChild(b);
        paintRoomItem(b.querySelector('canvas'), it);
      });
    }
    $('#store-modal').classList.remove('hidden');
  }
  function closeStore() { $('#store-modal').classList.add('hidden'); }

  /* ★「ほんとうに つくる？」の かくにん
       そざいを つかう ので、まちがって タップしても つくられない ように。 */
  let craftPending = null;
  function askCraft(pat) {
    craftPending = pat;
    const ask = $('#craft-ask');
    if (ask) ask.innerHTML = 'ほんとうに<br>「' + pat.name + '」を つくりますか？';
    const need = $('#craft-need');
    if (need) {
      need.innerHTML = 'つかう そざい：' +
        Object.keys(pat.cost).map(k => MATERIALS[k].icon + MATERIALS[k].name + '×' + pat.cost[k]).join('　');
    }
    paintRoomItem($('#craft-preview'), pat);
    $('#craft-modal').classList.remove('hidden');
  }
  function closeCraftAsk() { craftPending = null; $('#craft-modal').classList.add('hidden'); }
  function doCraftConfirmed() {
    const pat = craftPending;
    closeCraftAsk();
    if (!pat) return;
    if (!canCraft(pat)) { toast('そざいが たりないよ…'); return; }
    doCraft(pat);
    toast(pat.name + ' が できた！');
    buildRoomTray();
  }

  /* ★そざい ごうせい（2こ → 1こ の こうかんじょ）
       ひだりで えらんだ そざいを 2こ つかうと、
       みぎで えらんだ そざいが 1こ もらえます。               */
  const MIX_RATE = 2;                 // なんこで 1こに なるか
  let mixFrom = 'wood', mixTo = 'stone', mixN = 1;

  function mixMax() {
    return Math.max(1, Math.floor(matCount(mixFrom) / MIX_RATE));
  }
  function buildMixPick(boxId, side) {
    const box = $(boxId);
    if (!box) return;
    box.innerHTML = '';
    MATERIAL_ORDER.forEach(id => {
      const mt = MATERIALS[id];
      const cur = (side === 'from') ? mixFrom : mixTo;
      const other = (side === 'from') ? mixTo : mixFrom;
      const b = document.createElement('button');
      b.className = 'mix-chip' + (cur === id ? ' on' : '') + (other === id ? ' dim' : '');
      b.innerHTML = '<i>' + mt.icon + '</i>' + mt.name +
                    (side === 'from' ? '<span>' + matCount(id) + '</span>' : '');
      b.addEventListener('click', () => {
        if (other === id) { toast('おなじ そざい どうしは こうかん できません'); return; }
        if (side === 'from') { mixFrom = id; mixN = Math.min(mixN, mixMax()); }
        else mixTo = id;
        refreshMix();
      });
      box.appendChild(b);
    });
  }
  function refreshMix() {
    buildMixPick('#mix-from', 'from');
    buildMixPick('#mix-to', 'to');
    const need = mixN * MIX_RATE;
    const have = matCount(mixFrom);
    const ok = have >= need;
    const n = $('#mix-n'); if (n) n.textContent = mixN;
    const sum = $('#mix-sum');
    if (sum) {
      sum.className = 'mix-sum' + (ok ? '' : ' ng');
      sum.innerHTML = MATERIALS[mixFrom].icon + MATERIALS[mixFrom].name + '×' + need +
        '　→　' + MATERIALS[mixTo].icon + MATERIALS[mixTo].name + '×' + mixN +
        (ok ? '' : '　（' + MATERIALS[mixFrom].name + 'が ' + (need - have) + 'こ たりません）');
    }
  }
  function openMix() {
    /* もって いる そざいが いちばん おおい ものを はじめに えらんで おく */
    const sorted = MATERIAL_ORDER.slice().sort((a, b) => matCount(b) - matCount(a));
    mixFrom = sorted[0]; mixTo = sorted[sorted.length - 1];
    mixN = 1;
    refreshMix();
    $('#mix-modal').classList.remove('hidden');
  }
  function closeMix() { $('#mix-modal').classList.add('hidden'); }
  function askMix() {
    const need = mixN * MIX_RATE;
    if (matCount(mixFrom) < need) { toast('そざいが たりないよ…'); return; }
    const t = $('#mix-ask-text');
    if (t) t.innerHTML = 'ほんとうに ごうせい しますか？<br><small>' +
      MATERIALS[mixFrom].icon + MATERIALS[mixFrom].name + '×' + need + ' が なくなり、' +
      MATERIALS[mixTo].icon + MATERIALS[mixTo].name + '×' + mixN + ' に なります</small>';
    $('#mix-ask').classList.remove('hidden');
  }
  function closeMixAsk() { $('#mix-ask').classList.add('hidden'); }
  function doMix() {
    closeMixAsk();
    const need = mixN * MIX_RATE;
    if (matCount(mixFrom) < need) { toast('そざいが たりないよ…'); return; }
    addMat(mixFrom, -need);
    addMat(mixTo, mixN);
    storeSave();
    toast(MATERIALS[mixTo].name + ' を ' + mixN + 'こ てに いれた！');
    mixN = Math.min(mixN, mixMax());
    refreshMix(); buildMatBar(); buildRoomTray();
  }

  /* もちものの ちいさな え */
  function paintRoomItem(canvas, it) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 60, h = canvas.clientHeight || 40;
    if (w < 2 || h < 2) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (it.kind === 'wall') {
      const c = it.colors;
      ctx.fillStyle = c.wall;  ctx.fillRect(0, 0, w, h * 0.62);
      ctx.fillStyle = c.floor; ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.strokeStyle = c.wallLine; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h * 0.62); ctx.stroke();
      return;
    }
    const fn = ROOM_DRAWERS[it.draw];
    if (!fn) return;
    const sc = Math.min(w / (it.w * 1.15), h / (it.h * 1.15));
    ctx.save();
    ctx.translate(w / 2, h - 3);
    ctx.scale(sc, sc);
    fn(ctx, { t: roomTime, pal: it.palette });
    ctx.restore();
  }

  /* コースに でる そざい（アイコンで ひょうじ）*/
  function dropHtml(st) {
    if (!st || !Array.isArray(st.drops) || typeof MATERIALS === 'undefined') return '';
    const pc = Math.round((typeof DROP_RATE === 'number' ? DROP_RATE : 0.3) * 100);
    return '<span class="drop-mats" title="それぞれ ' + pc + '% で でます">' +
      st.drops.map(id => MATERIALS[id]
        ? '<i>' + MATERIALS[id].icon + '</i>' : '').join('') +
      '</span>';
  }

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

  /* クリアずみの コースに でてくる てきは、ぜんぶ「あった こと が ある」ことに する。
     （ずかんを あとから ついかした ので、まえに クリアした ぶんも のせる ため）*/
  function backfillSeen(s) {
    if (!s || !s.cleared) return false;
    if (!s.seenEnemies) s.seenEnemies = {};
    let added = false;
    const mark = (list) => {
      if (!list) return;
      list.forEach(st => {
        if (!st || !s.cleared[st.no] || !st.waves) return;
        st.waves.forEach(w => {
          if (w && w.id && ENEMIES[w.id] && !s.seenEnemies[w.id]) { s.seenEnemies[w.id] = true; added = true; }
        });
      });
    };
    mark(STAGES);
    allTowers().forEach(t => mark(t.courses));
    return added;
  }

  /* せんとうで でてきた てきを セーブに かきうつす */
  function recordSeen() {
    const s = slot();
    if (!s) return;
    if (!s.seenEnemies) s.seenEnemies = {};
    let added = false;
    if (Game.seen) {
      for (const id in Game.seen) { if (!s.seenEnemies[id]) { s.seenEnemies[id] = true; added = true; } }
    }
    if (backfillSeen(s)) added = true;
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
    if (def.slowImmune)  L.push('★どんそくに ならない（クモの巣の なかでも はやさが おちない）');
    if (def.stunImmune)  L.push('★うごきを とめられない');
    if (def.waveStopper) L.push('★はどうストッパー：はどうの ダメージを うけず、なみを せきとめて うしろの なかまを まもる');
    if (def.crit)        L.push('★' + pc(def.crit.chance) + 'で かいしんの いちげき（ダメージ ' + def.crit.mult + 'ばい'
                                + (def.crit.ignoreAttr ? '・ぞくせいの あいしょうは けいさんに いれない' : '') + '）');
    if (def.knockbackChance) L.push('★' + pc(def.knockbackChance) + 'で あいてを うしろに ふきとばす');
    if (def.slow)        L.push('★' + pc(def.slow.chance === undefined ? 1 : def.slow.chance) + 'で あいてを '
                                + def.slow.duration + 'びょう どんそくに する（はやさ ' + pc(def.slow.rate) + '）');
    if (def.web)         L.push('★クモの巣：' + def.web.interval + 'びょうごとに、じぶんの ' + def.web.ahead
                                + ' まえに 巣を はる。巣の なかに いる あいては はやさ ' + pc(def.web.slowRate)
                                + ' に なる（' + def.web.duration + 'びょうで きえる）');
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
    /* すでに その すがたに なって いる ときは あんないを ださない */
    if (def.evolve  && def.name !== def.evolve.name)
      L.push('じつりょく Lv.' + (LEVEL.evolveAt || 10) + ' で「' + def.evolve.name + '」に しんか できる');
    if (def.evolve2 && def.name !== def.evolve2.name)
      L.push('さらに じつりょく Lv.' + LEVEL.max + ' で「' + def.evolve2.name + '」に なれる');
    if (def.burn)        L.push('★' + pc(def.burn.chance === undefined ? 1 : def.burn.chance) + 'で えんじょう：'
                                + (def.burn.dpsRate
                                   ? ('あたえた ダメージの ' + pc(def.burn.dpsRate) + ' を 1びょうごとに ' + def.burn.duration + 'びょう')
                                   : ('1びょうに ' + def.burn.dps + ' を ' + def.burn.duration + 'びょう'))
                                + '（あわせて ' + (def.burn.dpsRate ? pc(def.burn.dpsRate * def.burn.duration) + 'ぶん' : (def.burn.dps * def.burn.duration)) + '）');
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
      statRow('1びょうダメージ', 'dps', dps, dps) +
      statRow('しゃてい',   'range', def.range, def.range) +
      statRow('はやさ', 'speed', def.speed, def.speed) +
      statRow('こうげき そくど', 'cycle', cycle, cycle.toFixed(1) + 'びょうに 1かい');
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
      /* ★え は もともと しんかごを かいて いたので、すうじと なまえも
         いまの すがたに そろえます（しんかして いなければ もとの すがた）*/
      list = owned.filter(id => UNITS[id]).map(id => shownDef(id) || UNITS[id]);
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

  /* いま たたかって いる ステージの レア度せいげん（なければ null）*/
  let rarityLimit = null;

  /* ★つかえる なかまだけに へんせいを しぼる。
     ステージに allowRarity が あれば、その レア度の なかま だけが でられます。 */
  function applyRarityLimit(course) {
    rarityLimit = (course && Array.isArray(course.allowRarity) && course.allowRarity.length)
      ? course.allowRarity.slice() : null;
    if (!rarityLimit) { applyParty(); return; }

    const s = slot();
    const owned = (s && Array.isArray(s.owned)) ? s.owned : DEFAULT_PARTY.slice();
    const inParty = (s && Array.isArray(s.party)) ? s.party.filter(Boolean) : [];
    const ok = id => UNITS[id] && rarityLimit.indexOf(UNITS[id].rarity) >= 0;

    /* まずは いまの へんせいから つかえる なかまを のこす */
    let list = inParty.filter(ok);
    /* たりなければ、もって いる なかまから おぎなう */
    if (list.length < PARTY_MAX) {
      owned.filter(id => ok(id) && list.indexOf(id) < 0)
           .forEach(id => { if (list.length < PARTY_MAX) list.push(id); });
    }

    PARTY.length = 0;
    list.forEach(id => PARTY.push(id));
    Game.levels = s ? effLevelMap(s) : {};
    Game.evolved = (s && s.evolved) ? s.evolved : {};
    Game.evolved2 = (s && s.evolved2) ? s.evolved2 : {};
    applyUnitLayout();
    buildUnitButtons();
    requestAnimationFrame(redrawIcons);
  }

  function startBattle(course) {
    applyRarityLimit(course);
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
      /* ★しんかで コスト／さいせいさんが かわる ことが あるので、
         いまの すがたの すうじを つかいます（もとの すがたでは ない）*/
      const def = shownDef(u.id) || UNITS[u.id];
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

  /* クリアで もらえる けいけんち。
     しょかいは まるまる、2かいめ いこうは LEVEL.repeatExpRate ぶんだけ。 */
  function gainExp(base, first) {
    if (first) return base;
    const rate = (typeof LEVEL !== 'undefined' && typeof LEVEL.repeatExpRate === 'number')
      ? LEVEL.repeatExpRate : 1;
    return Math.max(1, Math.round(base * rate));
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
        /* ★けいけんちは まいかい もらえるが、2かいめ いこうは すくない */
        s.exp = (s.exp || 0) + gainExp(r.exp, first);
      }
      $('#result-sub').textContent += first
        ? '　／　Gコイン +' + r.coins + '　けいけんち +' + r.exp
        : '　／　けいけんち +' + gainExp(r.exp, false)
          + '（2かいめ いこうは すくなめ・Gコインは しょかいだけ）';
      /* ★そざいの ドロップ（3しゅるい それぞれ 30%）*/
      const drops = rollDrops(Game.stage);
      if (drops.length) {
        $('#result-sub').textContent += '　／　' +
          drops.map(id => MATERIALS[id].icon + MATERIALS[id].name).join('・') + ' を てにいれた！';
      }
      markCleared(Game.stage.no);
      recordSeen();
      const rush = giveBossRushReward();      // ★ボスラッシュ ぜんクリアの ごほうび
      if (rush) {
        $('#result-sub').textContent +=
          '　／　★ボスラッシュ せいは！　Gコイン +' + rush;
      }
      const coins = giveTowerCoins();         // ★とくべつステージ ぜんかいの Gコイン
      if (coins) {
        $('#result-sub').textContent +=
          '　／　★' + (currentTower ? currentTower.name : '') + ' せいは！　Gコイン +' + coins;
      }
      const got = giveTowerReward();          // ★とくべつステージを ぜんぶ クリアした ごほうび
      if (got) {
        /* ★どの とくべつステージでも ただしい なまえが でる ように します
           （まえは「あき坊の塔 10かい」で きめうちに なって いました）*/
        const T = currentTower || TOWER;
        const unit = (T === TOWER) ? 'かい' : 'ステージ';
        $('#result-sub').textContent =
          T.name + ' ' + T.floors + unit + ' せいは！　「' + UNITS[got].name + '」が なかまに なった！';
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
    $('#btn-world').addEventListener('click', switchWorld);
    const mr = $('#btn-map-right'); if (mr) mr.addEventListener('click', goSunMap);
    const ml = $('#btn-map-left');  if (ml) ml.addEventListener('click', backToSpace);
    $('#btn-home-room').addEventListener('click', () => {
      roomScene = 'room';
      gardenTick();                       // ホームから きた ときに にわの ぶんを けいさん
      openRoom(); bindRoomCanvas();
    });
    $('#btn-room-back').addEventListener('click', closeRoom);
    const sb = $('#btn-room-scene'); if (sb) sb.addEventListener('click', switchScene);
    const sc = $('#btn-store-close'); if (sc) sc.addEventListener('click', closeStore);
    const mb = $('#btn-room-mix');   if (mb) mb.addEventListener('click', openMix);
    const mc = $('#btn-mix-close');  if (mc) mc.addEventListener('click', closeMix);
    const mg = $('#btn-mix-go');     if (mg) mg.addEventListener('click', askMix);
    const my = $('#btn-mixask-yes'); if (my) my.addEventListener('click', doMix);
    const mn = $('#btn-mixask-no');  if (mn) mn.addEventListener('click', closeMixAsk);
    const mm = $('#mix-minus'); if (mm) mm.addEventListener('click', () => { mixN = Math.max(1, mixN - 1); refreshMix(); });
    const mp = $('#mix-plus');  if (mp) mp.addEventListener('click', () => { mixN = Math.min(99, mixN + 1); refreshMix(); });
    const cy2 = $('#btn-craft-yes');  if (cy2) cy2.addEventListener('click', doCraftConfirmed);
    const cn  = $('#btn-craft-no');   if (cn)  cn.addEventListener('click', closeCraftAsk);
    $('#btn-chapter-back').addEventListener('click', openHome);
    $('#btn-tower').addEventListener('click', () => {
      const T = towerOfWorld(currentWorld);
      if (!T) { toast('ここには とくべつステージが ありません'); return; }
      currentTower = T;
      (openTower)();
    });
    $('#btn-tower2').addEventListener('click', () => {
      const T = towersOfWorld(currentWorld)[1];
      if (!T) { toast('ここには とくべつステージが ありません'); return; }
      currentTower = T;
      (openTower)();
    });
    $('#btn-tower3').addEventListener('click', () => {
      const T = towersOfWorld(currentWorld)[2];
      if (!T) { toast('ここには とくべつステージが ありません'); return; }
      currentTower = T;
      (openTower)();
    });
    $('#btn-tower-back').addEventListener('click', openChapters);
    $('#btn-home-power').addEventListener('click', openPower);
    $('#btn-home-party').addEventListener('click', openParty);
    $('#btn-home-gacha').addEventListener('click', openGacha);
    $('#btn-home-log').addEventListener('click', openLog);
    $('#btn-log-back').addEventListener('click', () => show('screen-home'));
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
