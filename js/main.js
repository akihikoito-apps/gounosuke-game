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
  const GAME_VERSION = '6.39';


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
    /* ★たたかいの ない ばしょ（ネコスの店 など）は STAGES に コースが ないので、
         CHAPTERS の ほうからも ひろって おきます。 */
    if (typeof CHAPTERS !== 'undefined') {
      Object.keys(CHAPTERS).forEach(k => {
        const c = +k;
        if (!isNaN(c) && chs.indexOf(c) < 0) chs.push(c);
      });
    }
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
      if (w === 'storm') return sunAllCleared();     // 竜巻編は 太陽を ぜんぶ クリアしてから
      return earthAllCleared();                      // うちゅうは せかいを ぜんぶ クリアしてから
    }
    const cleared = (slot() && slot().cleared) || {};
    /* コースの ない しょう（ネコスの店）を とばして、ひとつ まえの
       「たたかいが ある しょう」を さがします */
    let p = ch - 1, prev = coursesOf(p);
    while (prev.length === 0 && p > list[0]) { p--; prev = coursesOf(p); }
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

  /* 太陽を ぜんぶ クリアしたか（＝竜巻編へ いけるか）*/
  function sunAllCleared() {
    const cleared = (slot() && slot().cleared) || {};
    const sun = allChapters().filter(ch => worldOf(ch) === 'sun');
    return sun.length > 0 && sun.every(ch => coursesOf(ch).every(st => cleared[st.no]));
  }

  const WORLD_TITLE = { earth: 'せかい ちず', space: 'うちゅう ちず', sun: '太陽 ちず', storm: 'たつまき ちず' };

  /* =================================================
     へん（編）えらび － ちずが ふえたので さいしょに えらびます
     ================================================= */
  const ARCS = [
    { name: 'ちきゅうへん', sub: 'だい1しょう', icon: '🌍', world: 'earth',
      desc: 'はじまりの みちから、せかいじゅうを ぼうけん！',
      worlds: ['earth'], open: () => true,
      lock: '' },
    { name: 'うちゅうへん', sub: 'だい2しょう', icon: '🚀', world: 'space',
      desc: 'ロケットで ほしから ほしへ。さいごは 太陽 ボスラッシュ。',
      worlds: ['space', 'sun'], open: () => earthAllCleared(),
      lock: 'せかい ちずを ぜんぶ クリアすると あそべます' },
    { name: 'たつまきへん', sub: 'だい3しょう', icon: '🌪️', world: 'storm',
      desc: 'ターツーマーキーが ちきゅうに もどって きた！ しろから たつまきほうが とんで くる。',
      worlds: ['storm'], open: () => sunAllCleared(),
      lock: '太陽を ぜんぶ クリアすると あそべます' },
  ];

  function arcProgress(arc) {
    const cleared = (slot() && slot().cleared) || {};
    let done = 0, all = 0;
    allChapters().forEach(ch => {
      if (arc.worlds.indexOf(worldOf(ch)) < 0) return;
      coursesOf(ch).forEach(st => { all++; if (cleared[st.no]) done++; });
    });
    return { done: done, all: all };
  }

  function openArcs() {
    if (rarityLimit) { rarityLimit = null; applyParty(); }
    const box = $('#arc-list');
    if (box) {
      box.innerHTML = '';
      ARCS.forEach(arc => {
        const open = arc.open();
        const pg = arcProgress(arc);
        const el = document.createElement('button');
        el.className = 'arc-card' + (open ? '' : ' locked');
        el.innerHTML =
          '<span class="arc-ico">' + (open ? arc.icon : '🔒') + '</span>' +
          '<span class="arc-body">' +
            '<span class="arc-name">' + arc.name + '</span>' +
            '<span class="arc-sub">' + arc.sub + '</span>' +
            '<span class="arc-desc">' + (open ? arc.desc : arc.lock) + '</span>' +
          '</span>' +
          '<span class="arc-prog">' + (open ? (pg.done + '/' + pg.all) : 'ロック') + '</span>';
        if (open) el.addEventListener('click', () => { currentWorld = arc.world; openChapters(); });
        else      el.addEventListener('click', () => toast(arc.lock));
        box.appendChild(el);
      });
      box.scrollTop = 0;
    }
    show('screen-arc');
  }

  function refreshWorldBtn() {
    const b = $('#btn-world');
    if (b) {
      /* 太陽ちずでは ちきゅう ⇄ うちゅう の ボタンは ださない */
      const canGo = earthAllCleared() && currentWorld !== 'sun' && currentWorld !== 'storm';
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
    /* 竜巻編は ちきゅうの ちずの まま。さいごに あかい もんを かきたす */
    const stormMap = (currentWorld === 'storm');

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
    if (stormMap) drawStormGate(ctx, W, H);
  }

  /* --- 竜巻編の「あたらしい もん」（ごうのすけくんの えの とおり）---
       あかい とりいの ような もん。うえに はたが 1りゅう。
       たつまきが ふいて いる ので、そらも すこし くらく します。   */
  function drawStormGate(ctx, W, H) {
    const sk = ctx.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, 'rgba(46,38,66,.62)');
    sk.addColorStop(0.55, 'rgba(46,38,66,.30)');
    sk.addColorStop(1, 'rgba(46,38,66,.16)');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);

    /* とおくの たつまき 2ほん（ちずの おくに ゆらゆら）*/
    ctx.save();
    ctx.strokeStyle = 'rgba(70,62,95,.55)';
    [[0.60, 0.52], [0.86, 0.44]].forEach(([fx, fh], k) => {
      const cx = W * fx, yTop = H * 0.02, yBot = H * fh;
      const ww = W * 0.11;
      ctx.lineWidth = Math.max(2, H * 0.006);
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        for (let i = 0; i <= 34; i++) {
          const t = i / 34;
          const y = yTop + (yBot - yTop) * t;
          const rad = ww * (1 - t * 0.85) * 0.5;
          const a = t * Math.PI * 6 + j * 2.4 + k;
          const x = cx + Math.cos(a) * rad;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    ctx.restore();

    const info = chapterInfo(13);
    const gx = (typeof info.x === 'number' ? info.x : 0.16) * W;
    const gy = (typeof info.y === 'number' ? info.y : 0.55) * H;
    const w = Math.min(W * 0.20, H * 0.40);
    const h = w * 1.05;
    const pw = w * 0.22;
    const RED = '#dc3f22', INK = '#1b1b1b';

    /* まわりを まう たつまきの かぜ（もんの うしろ）*/
    ctx.strokeStyle = 'rgba(190,175,225,.55)';
    ctx.lineWidth = Math.max(2, H * 0.006);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const ang = t * Math.PI * 4 + k * 2.1;
        const rad = w * (0.10 + t * 0.58);
        const xx = gx + Math.cos(ang) * rad;
        const yy = gy - h * 0.15 - t * h * 0.95;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(gx, gy + h * 0.55);
    ctx.fillStyle = RED; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(3, w * 0.035);
    /* はしら 2ほん */
    for (const d of [-1, 1]) {
      const x = d * (w / 2) - (d > 0 ? pw : 0);
      ctx.fillRect(x, -h * 0.60, pw, h * 0.60);
      ctx.strokeRect(x, -h * 0.60, pw, h * 0.60);
    }
    /* かさぎ（うえの よこぼう）*/
    roundRect(ctx, -w / 2 - pw * 0.20, -h * 0.84, w + pw * 0.40, h * 0.26, h * 0.10);
    ctx.fill(); ctx.stroke();
    /* まんなかの ポールと はた */
    ctx.fillRect(-pw * 0.24, -h * 1.18, pw * 0.48, h * 0.36);
    ctx.strokeRect(-pw * 0.24, -h * 1.18, pw * 0.48, h * 0.36);
    ctx.beginPath();
    ctx.moveTo(pw * 0.24, -h * 1.16);
    ctx.lineTo(pw * 0.24 + w * 0.30, -h * 1.01);
    ctx.lineTo(pw * 0.24, -h * 0.86);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
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
      if (list.length === 0) continue;               // おみせは かぞえない
      if (chapterOpen(ch) && !list.every(st => cleared[st.no])) { nowCh = ch; break; }
    }

    chs.forEach((ch, i) => {
      const p = chapterPos(i, chs.length, ch);
      const info = chapterInfo(ch);
      const list = coursesOf(ch);
      const done = list.filter(st => cleared[st.no]).length;
      const all  = list.length > 0 && done === list.length;
      const open = chapterOpen(ch);
      const shop = !!info.shop;                 // ★たたかいの ない ばしょ

      const el = document.createElement('button');
      el.className = 'map-node' + (shop ? ' shop' : '') +
        (open ? (all ? ' done' : (ch === nowCh ? ' now' : '')) : ' locked');
      el.style.left = (p.x * 100) + '%';
      el.style.top  = (p.y * 100) + '%';
      el.innerHTML =
        '<span class="mn-no">' + (info.icon || ch) + '</span>' +
        '<span class="mn-sub">' + (!open ? 'ロック' : (shop ? 'おみせ' : done + '/' + list.length)) + '</span>' +
        (shop ? '' : (all ? '<span class="mn-badge">⭐</span>' : (open ? '' : '<span class="mn-badge">🔒</span>'))) +
        (shop && !open ? '<span class="mn-badge">🔒</span>' : '') +
        '<span class="mn-label">' +
          (open ? (info.name || ('だい' + ch + 'ステージ'))
                : (shop ? '？？？' : ('だい' + ch + 'ステージ'))) + '</span>';
      if (open && shop) el.addEventListener('click', openShop);
      else if (open)    el.addEventListener('click', () => { currentChapter = ch; buildStageList(); show('screen-stage'); });
      else              el.addEventListener('click', () => toast('まえの ステージを ぜんぶ クリアしてね'));
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
  /* いちど かいて みて、かおが はいる「きりとりわく」を きめます。

     ★v6.21 の なおし
       まえは「えの たての 55%」を きりとって いました。でも キャラの
       せの たかさは バラバラで、せの たかい こ（スティーブ・ゴーレム・
       ドンドコ力士・あき坊 など）は 55%でも からだばかりに なって
       しまい、かおが とても ちいさく なって いました。
       そこで、
         ・きりとる たかさは「えの 55%」と「62（かおが ちょうど はいる
           おおきさ）」の ちいさい ほう
         ・うえの はしは、うすい オーラでは なく ★しっかり ぬられた
           ところ★（アルファ 180ごえ）から はかる
         ・よこの まんなかは、きりとった ところの うえ 45%（＝かお）の
           まんなかに あわせる
         ・よこはばも、からだ ぜんぶでは なく ★きりとった ところだけ★
           で はかる（ひろげた うでや しっぽに ひっぱられない）
       に しました。                                                   */
  const BUST_CUT_MAX = 52;    // かおが ちょうど はいる たかさ
  const BUST_CUT_MIN = 28;
  const bustBoxCache = {};
  function bustBox(drawId) {
    if (bustBoxCache[drawId] !== undefined) return bustBoxCache[drawId];
    const fn = DRAWERS[drawId];
    if (!fn || typeof document === 'undefined') { bustBoxCache[drawId] = null; return null; }
    const S = 240, OY = S * 0.95, K = 0.75;
    let box = null;
    try {
      const off = document.createElement('canvas');
      off.width = S; off.height = S;
      const c = off.getContext('2d', { willReadFrequently: true });
      c.clearRect(0, 0, S, S);
      c.save();
      c.translate(S / 2, OY);                // あしもとを したの ほうに
      c.scale(K, K);
      fn(c, { t: 0.7, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.35 });
      c.restore();
      const d = c.getImageData(0, 0, S, S).data;
      let softTop = S, solidTop = S, bot = -1;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const a = d[(y * S + x) * 4 + 3];
          if (a > 24)  { if (y < softTop) softTop = y; if (y > bot) bot = y; }
          if (a > 180 && y < solidTop) solidTop = y;
        }
      }
      if (bot >= 0) {
        const rowTop = (solidTop < S) ? solidTop : softTop;
        const topA = (rowTop - OY) / K, botA = (bot - OY) / K;
        const cutH = Math.max(BUST_CUT_MIN, Math.min((botA - topA) * 0.55, BUST_CUT_MAX));
        const rowBot  = Math.min(S - 1, Math.round(OY + (topA + cutH) * K));
        /* よこの まんなかは、かおの ぶぶんの ★ぬられた ピクセルの おもさ★
           で きめます（はしの ほそい ゆみや つえに ひっぱられない ため）。*/
        const headBot = rowTop + Math.max(4, Math.round((rowBot - rowTop) * 0.45));
        let x0 = S, x1 = -1, sum = 0, cnt = 0;
        for (let y = rowTop; y <= rowBot; y++) {
          for (let x = 0; x < S; x++) {
            if (d[(y * S + x) * 4 + 3] > 24) {
              if (x < x0) x0 = x; if (x > x1) x1 = x;
              if (y <= headBot) { sum += x; cnt++; }
            }
          }
        }
        if (x1 < x0) { x0 = 0; x1 = S - 1; }
        const cxPx = cnt ? (sum / cnt) : ((x0 + x1) / 2);
        /* かいた ときの ざひょうに もどす */
        box = {
          left:  (x0 - S / 2) / K,
          right: (x1 - S / 2) / K,
          cx:    (cxPx - S / 2) / K,
          top:   topA,
          cutH:  cutH,
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
      /* かおが はいる ぶんだけ きりとって わくに あわせる */
      const bw = Math.max(10, box.right - box.left);
      const cutH = box.cutH;
      const sc = Math.min(w / (bw * 1.06), h / (cutH * 1.10));
      const cx = box.cx;
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
      /* ★パワーアップの ならびも、たたかいの ボタンと おなじ
           「かおが うつる きりとり」に します（v6.26）*/
      paintCharBust(row.querySelector('canvas'), id);
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

  /* =================================================
     ストーリー（コマおくり）
     ================================================= */
  let storyList = null, storyIdx = 0, storyDone = null;

  /* --- コマの え を かくための どうぐ --- */
  function stStars(ctx, W, H, n) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = ((i * 9301 + 49297) % 233280) / 233280 * W;
      const y = ((i * 4021 + 12345) % 100003) / 100003 * H * 0.9;
      const r = 0.6 + ((i * 7) % 5) * 0.35;
      ctx.globalAlpha = 0.35 + ((i * 13) % 7) / 10;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function stSpaceBg(ctx, W, H, c0, c1) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c0 || '#0a0a28'); g.addColorStop(1, c1 || '#1a0d3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stStars(ctx, W, H, 90);
  }
  function stFieldBg(ctx, W, H, dark) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (dark) { g.addColorStop(0, '#2b2740'); g.addColorStop(1, '#4a4a55'); }
    else      { g.addColorStop(0, '#8fd6ff'); g.addColorStop(1, '#d9f2ff'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dark ? '#3f5c3a' : '#7ec850';
    ctx.fillRect(0, H * 0.74, W, H * 0.26);
    ctx.fillStyle = dark ? '#345030' : '#6cb844';
    ctx.fillRect(0, H * 0.74, W, H * 0.03);
  }
  function stPlanet(ctx, cx, cy, r, kind) {
    ctx.save();
    if (kind === 'sun') {
      const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      g.addColorStop(0, '#fff3a8'); g.addColorStop(0.6, '#ffb32e'); g.addColorStop(1, '#ff6a1e');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,80,.45)'; ctx.lineWidth = r * 0.10;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 1.06, cy + Math.sin(a) * r * 1.06);
        ctx.lineTo(cx + Math.cos(a) * r * 1.28, cy + Math.sin(a) * r * 1.28);
        ctx.stroke();
      }
    } else {
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      g.addColorStop(0, '#7fc7ff'); g.addColorStop(1, '#1b5fa8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4caf50';
      [[-0.35, -0.2, 0.42, 0.26], [0.2, 0.25, 0.4, 0.3], [0.32, -0.42, 0.3, 0.2]].forEach(b => {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath();
        ctx.ellipse(cx + b[0] * r, cy + b[1] * r, b[2] * r, b[3] * r, 0.4, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function stTornado(ctx, cx, yTop, yBot, w, color) {
    ctx.save();
    ctx.strokeStyle = color || 'rgba(40,36,60,.85)';
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = Math.max(2, w * 0.05);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const y = yTop + (yBot - yTop) * t;
        const rad = w * (1 - t * 0.82) * 0.5;
        const a = t * Math.PI * 6 + k * 2.1;
        const x = cx + Math.cos(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  /* キャラの えが あしもとから どれだけ うえに のびるかを、いちど かいて
     ピクセルから はかります（きめうちの すうじだと あたまが きれます）。
     れい：ターツーマーキーは あたまの うえの たつまきまで いれて 152。 */
  const storyUpCache = {};
  function storyArtUp(drawId) {
    if (storyUpCache[drawId] !== undefined) return storyUpCache[drawId];
    const fn = (typeof DRAWERS !== 'undefined') ? DRAWERS[drawId] : null;
    if (!fn || typeof document === 'undefined') { storyUpCache[drawId] = 110; return 110; }
    const S = 320, OY = S * 0.92, K = 0.6;
    let up = 110;
    try {
      const off = document.createElement('canvas');
      off.width = S; off.height = S;
      const c = off.getContext('2d', { willReadFrequently: true });
      c.save(); c.translate(S / 2, OY); c.scale(K, K);
      fn(c, { t: 0.7, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.35 });
      c.restore();
      const d = c.getImageData(0, 0, S, S).data;
      let top = S;
      for (let y = 0; y < S && top === S; y++) {
        for (let x = 0; x < S; x++) { if (d[(y * S + x) * 4 + 3] > 24) { top = y; break; } }
      }
      if (top < S) up = Math.max(30, (OY - top) / K);
    } catch (e) { /* はかれなければ めやすの 110 */ }
    storyUpCache[drawId] = up;
    return up;
  }
  function stChar(ctx, id, x, yBase, h, st) {
    const fn = (typeof DRAWERS !== 'undefined') ? DRAWERS[id] : null;
    if (!fn) return;
    ctx.save();
    ctx.translate(x, yBase);
    const sc = h / storyArtUp(id);
    ctx.scale(sc, sc);
    fn(ctx, st || { t: 0.7, moving: false, atk: -1, hpRatio: 1, roll: 0.35 });
    ctx.restore();
  }
  function stCastle(ctx, cx, yBase, w) {
    const h = w * 1.05;
    ctx.save();
    ctx.fillStyle = '#e9e2cf'; ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = Math.max(2, w * 0.035);
    ctx.fillRect(cx - w / 2, yBase - h * 0.62, w, h * 0.62);
    ctx.strokeRect(cx - w / 2, yBase - h * 0.62, w, h * 0.62);
    for (let i = 0; i < 4; i++) {
      const bw = w / 7;
      ctx.fillRect(cx - w / 2 + i * (w / 4) + bw * 0.2, yBase - h * 0.74, bw, h * 0.13);
      ctx.strokeRect(cx - w / 2 + i * (w / 4) + bw * 0.2, yBase - h * 0.74, bw, h * 0.13);
    }
    ctx.fillStyle = '#c94f3a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.30, yBase - h * 0.74);
    ctx.lineTo(cx, yBase - h * 1.02);
    ctx.lineTo(cx + w * 0.30, yBase - h * 0.74);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4b2a';
    ctx.fillRect(cx - w * 0.12, yBase - h * 0.32, w * 0.24, h * 0.32);
    ctx.strokeRect(cx - w * 0.12, yBase - h * 0.32, w * 0.24, h * 0.32);
    ctx.restore();
  }
  function stGate(ctx, cx, yBase, w, alpha) {
    const h = w * 1.05, pw = w * 0.22;
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.translate(cx, yBase);
    ctx.fillStyle = '#dc3f22'; ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = Math.max(3, w * 0.035);
    for (const d of [-1, 1]) {
      const x = d * (w / 2) - (d > 0 ? pw : 0);
      ctx.fillRect(x, -h * 0.60, pw, h * 0.60);
      ctx.strokeRect(x, -h * 0.60, pw, h * 0.60);
    }
    roundRect(ctx, -w / 2 - pw * 0.20, -h * 0.84, w + pw * 0.40, h * 0.26, h * 0.10);
    ctx.fill(); ctx.stroke();
    ctx.fillRect(-pw * 0.24, -h * 1.18, pw * 0.48, h * 0.36);
    ctx.strokeRect(-pw * 0.24, -h * 1.18, pw * 0.48, h * 0.36);
    ctx.beginPath();
    ctx.moveTo(pw * 0.24, -h * 1.16);
    ctx.lineTo(pw * 0.24 + w * 0.30, -h * 1.01);
    ctx.lineTo(pw * 0.24, -h * 0.86);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function stFlash(ctx, W, H, color) {
    ctx.save();
    ctx.globalAlpha = 0.28; ctx.fillStyle = color || '#ff2b2b';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function stTitle(ctx, W, H, text, color) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.min(W * 0.11, H * 0.16);
    ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
    ctx.lineWidth = fs * 0.18; ctx.strokeStyle = '#11121c';
    ctx.strokeText(text, W / 2, H * 0.5);
    ctx.fillStyle = color || '#ffd54f';
    ctx.fillText(text, W / 2, H * 0.5);
    ctx.restore();
  }

  /* --- ばめんを かざる どうぐ（v6.22 で ふやしました）--- */

  /* ちいさな いえ。tilt を つけると かぜで かたむいて みえます */
  function stHouse(ctx, x, yBase, w, tilt, wall, roof) {
    const h = w * 0.78;
    ctx.save();
    ctx.translate(x, yBase);
    ctx.rotate(tilt || 0);
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, w * 0.045);
    ctx.fillStyle = wall || '#f3e6c8';
    ctx.fillRect(-w / 2, -h, w, h); ctx.strokeRect(-w / 2, -h, w, h);
    ctx.fillStyle = roof || '#c25b3f';
    ctx.beginPath();
    ctx.moveTo(-w * 0.60, -h);
    ctx.lineTo(0, -h - w * 0.42);
    ctx.lineTo(w * 0.60, -h);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(-w * 0.13, -h * 0.46, w * 0.26, h * 0.46);
    ctx.strokeRect(-w * 0.13, -h * 0.46, w * 0.26, h * 0.46);
    ctx.restore();
  }

  /* き。bend を つけると かぜに あおられます */
  function stTree(ctx, x, yBase, h, bend) {
    ctx.save();
    ctx.translate(x, yBase);
    ctx.strokeStyle = '#6d4c2f'; ctx.lineWidth = Math.max(2, h * 0.09);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo((bend || 0) * h * 0.30, -h * 0.55, (bend || 0) * h * 0.75, -h * 0.82);
    ctx.stroke();
    ctx.fillStyle = '#4f9a3d'; ctx.strokeStyle = '#2f5f24'; ctx.lineWidth = Math.max(1.5, h * 0.035);
    ctx.beginPath();
    ctx.ellipse((bend || 0) * h * 0.80, -h * 0.90, h * 0.36, h * 0.28, (bend || 0) * 0.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /* ちいさな ひと。pose は 'stand' / 'bow'（ひれふす）/ 'run'（にげる）*/
  function stPerson(ctx, x, yBase, h, pose, color) {
    ctx.save();
    ctx.translate(x, yBase);
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, h * 0.09);
    ctx.lineCap = 'round';
    if (pose === 'bow') {
      /* ひれふす すがた（あたまを じめんに つけて、おじぎ）。
         くらい じめんでも わかる ように、ふとく あかるい いろで かきます。*/
      ctx.strokeStyle = '#efe7d4'; ctx.lineWidth = Math.max(2, h * 0.15);
      ctx.beginPath();                       // おりまげた あし（うしろ）
      ctx.moveTo(-h * 0.50, -h * 0.07);
      ctx.lineTo(-h * 0.20, -h * 0.07);
      ctx.stroke();
      ctx.beginPath();                       // せなか（もりあがった アーチ）
      ctx.moveTo(-h * 0.30, -h * 0.10);
      ctx.quadraticCurveTo(-h * 0.02, -h * 0.46, h * 0.18, -h * 0.26);
      ctx.stroke();
      ctx.beginPath();                       // まえに のばした うで
      ctx.moveTo(h * 0.16, -h * 0.28);
      ctx.lineTo(h * 0.46, -h * 0.06);
      ctx.stroke();
      ctx.fillStyle = color || '#ffd9b3';    // あたま（じめんの ちかく）
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, h * 0.06);
      ctx.beginPath(); ctx.arc(h * 0.30, -h * 0.14, h * 0.17, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    /* あし */
    /* あし */
    ctx.beginPath();
    if (pose === 'run') { ctx.moveTo(-h * 0.16, 0); ctx.lineTo(0, -h * 0.40); ctx.lineTo(h * 0.20, -h * 0.05); }
    else { ctx.moveTo(-h * 0.11, 0); ctx.lineTo(0, -h * 0.40); ctx.lineTo(h * 0.11, 0); }
    ctx.stroke();
    /* からだ */
    ctx.beginPath(); ctx.moveTo(0, -h * 0.40); ctx.lineTo(0, -h * 0.70); ctx.stroke();
    /* うで */
    ctx.beginPath();
    if (pose === 'run') { ctx.moveTo(-h * 0.22, -h * 0.80); ctx.lineTo(0, -h * 0.62); ctx.lineTo(h * 0.20, -h * 0.80); }
    else { ctx.moveTo(-h * 0.20, -h * 0.48); ctx.lineTo(0, -h * 0.62); ctx.lineTo(h * 0.20, -h * 0.48); }
    ctx.stroke();
    /* あたま */
    ctx.fillStyle = color || '#ffd9b3';
    ctx.beginPath(); ctx.arc(0, -h * 0.82, h * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /* まちなみ（じめん＋いえ＋き）。bend を あげると あらしに なります */
  function stTownScape(ctx, W, H, bend, dark) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (dark) { g.addColorStop(0, '#3a3450'); g.addColorStop(1, '#6b6478'); }
    else      { g.addColorStop(0, '#9fd8f5'); g.addColorStop(1, '#e6f6ff'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dark ? '#43603c' : '#79c64c';
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = dark ? '#37502f' : '#68b23f';
    ctx.fillRect(0, H * 0.78, W, H * 0.02);
    const gy = H * 0.80, u = Math.min(W, H);
    stTree(ctx, W * 0.08, gy, u * 0.20, bend);
    stHouse(ctx, W * 0.24, gy, u * 0.20, bend * 0.16);
    stHouse(ctx, W * 0.42, gy + H * 0.02, u * 0.15, bend * 0.10, '#e8dcd0', '#8a5b9c');
    stTree(ctx, W * 0.57, gy, u * 0.16, bend);
    stHouse(ctx, W * 0.80, gy, u * 0.18, bend * 0.13, '#f0e8d2', '#3f7fa8');
    stTree(ctx, W * 0.94, gy + H * 0.02, u * 0.18, bend);
  }

  /* かぜに とばされる かけら */
  function stDebris(ctx, W, H, n) {
    ctx.save();
    ctx.strokeStyle = 'rgba(70,62,88,.7)'; ctx.fillStyle = 'rgba(120,108,140,.75)';
    for (let i = 0; i < n; i++) {
      const x = ((i * 9301 + 49297) % 233280) / 233280 * W;
      const y = ((i * 4021 + 12345) % 100003) / 100003 * H * 0.72;
      const s = 3 + ((i * 7) % 5) * 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(i * 1.1);
      ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(x - s * 3, y + s); ctx.lineTo(x + s * 4, y - s * 0.6);
      ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.restore();
  }

  /* うちゅうに うかぶ いわ（ねむって いた ばしょ）*/
  function stRock(ctx, cx, cy, w) {
    const h = w * 0.34;
    ctx.save();
    ctx.fillStyle = '#5a5468'; ctx.strokeStyle = '#2a2634'; ctx.lineWidth = Math.max(2, w * 0.02);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + cx, cy);
    ctx.lineTo(cx - w * 0.30, cy + h * 0.9);
    ctx.lineTo(cx + w * 0.16, cy + h * 1.15);
    ctx.lineTo(cx + w / 2, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#76708a';
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /* ねむって いる しるし */
  function stZzz(ctx, x, y, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      ctx.font = '900 ' + (s * (0.6 + i * 0.28)) + 'px system-ui, sans-serif';
      ctx.fillText('Z', x + i * s * 0.55, y - i * s * 0.62);
    }
    ctx.restore();
  }

  /* かみなり */
  function stBolt(ctx, x, yTop, h, color) {
    ctx.save();
    ctx.fillStyle = color || '#ffe066'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    const w = h * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    ctx.lineTo(x - w * 0.55, yTop + h * 0.46);
    ctx.lineTo(x + w * 0.10, yTop + h * 0.46);
    ctx.lineTo(x - w * 0.30, yTop + h);
    ctx.lineTo(x + w * 0.60, yTop + h * 0.40);
    ctx.lineTo(x - w * 0.02, yTop + h * 0.40);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /* たまざ（うちゅうの しはいしゃ の いす）。seatY は ざめんの うえ。
     この うえに stChar を おなじ y で かくと、すわって いる ように みえます。*/
  function stThrone(ctx, cx, seatY, w) {
    const backH = w * 1.15;
    ctx.save();
    ctx.strokeStyle = '#1e1930'; ctx.lineWidth = Math.max(2, w * 0.035);
    /* せもたれ */
    ctx.fillStyle = '#4a3f6e';
    roundRectPath(ctx, cx - w * 0.46, seatY - backH, w * 0.92, backH, w * 0.10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a5c96';
    roundRectPath(ctx, cx - w * 0.34, seatY - backH * 0.92, w * 0.68, backH * 0.80, w * 0.08);
    ctx.fill(); ctx.stroke();
    /* せなかの とげ */
    ctx.fillStyle = '#b9a6f0';
    for (let i = -2; i <= 2; i++) {
      const sx = cx + i * w * 0.21;
      const sh = w * (i === 0 ? 0.34 : 0.24 - Math.abs(i) * 0.04);
      ctx.beginPath();
      ctx.moveTo(sx - w * 0.07, seatY - backH);
      ctx.lineTo(sx, seatY - backH - sh);
      ctx.lineTo(sx + w * 0.07, seatY - backH);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    /* ひじかけ */
    ctx.fillStyle = '#4a3f6e';
    for (const d of [-1, 1]) {
      roundRectPath(ctx, cx + d * w * 0.52 - w * 0.09, seatY - w * 0.44, w * 0.18, w * 0.46, w * 0.06);
      ctx.fill(); ctx.stroke();
    }
    /* ざめん */
    ctx.fillStyle = '#5a4d80';
    roundRectPath(ctx, cx - w * 0.62, seatY, w * 1.24, w * 0.18, w * 0.07);
    ctx.fill(); ctx.stroke();
    /* あし */
    ctx.fillStyle = '#3b3158';
    for (const d of [-1, 1]) {
      ctx.fillRect(cx + d * w * 0.45 - w * 0.07, seatY + w * 0.18, w * 0.14, w * 0.24);
      ctx.strokeRect(cx + d * w * 0.45 - w * 0.07, seatY + w * 0.18, w * 0.14, w * 0.24);
    }
    ctx.restore();
  }

  /* まぼろし（まるい わくの なかに ばめんを うつす）*/
  function stVision(ctx, cx, cy, r, inner) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,12,40,.92)'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.translate(cx - r, cy - r);
    inner(ctx, r * 2, r * 2);
    ctx.restore();
    ctx.lineWidth = Math.max(3, r * 0.08); ctx.strokeStyle = '#b39ddb';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  /* なまえの ふだ（3大王の しょうかい に つかいます）*/
  function stNamePlate(ctx, W, H, name, sub, color) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.min(W * 0.075, H * 0.11);
    const y = H * 0.16;
    ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.lineWidth = fs * 0.20; ctx.strokeStyle = '#11121c';
    ctx.strokeText(name, W / 2, y);
    ctx.fillStyle = color || '#ffd54f';
    ctx.fillText(name, W / 2, y);
    if (sub) {
      const fs2 = fs * 0.45;
      ctx.font = '700 ' + fs2 + 'px system-ui, "Hiragino Sans", sans-serif';
      ctx.lineWidth = fs2 * 0.26; ctx.strokeStyle = '#11121c';
      ctx.strokeText(sub, W / 2, y + fs * 0.78);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sub, W / 2, y + fs * 0.78);
    }
    ctx.restore();
  }

  /* --- だい3しょう「竜巻編」の はじまりの おはなし --- */
  const STORY_STORM_INTRO = [
    /* 1 うちゅうの はてまで きた */
    { text: '太陽の いただきを クリア！　ごうのすけたちは、ついに うちゅうの はてまで たどりついた。',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#2a13a8', '#4a1a70');
        stPlanet(c, W * 0.76, H * 0.32, Math.min(W, H) * 0.19, 'sun');
        stCastle(c, W * 0.20, H * 0.88, Math.min(W, H) * 0.22);
        stChar(c, 'tankun',  W * 0.42, H * 0.90, H * 0.16);
        stChar(c, 'kabekun', W * 0.53, H * 0.90, H * 0.22);
        stChar(c, 'purio',   W * 0.63, H * 0.90, H * 0.18);
      } },

    /* 2 うちゅうの はてで ねむって いた */
    { text: '……そのころ。うちゅうの ずっと ずっと はてに、ながい ながい あいだ ねむって いる ものが いた。',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#05041a', '#14092e');
        stRock(c, W * 0.5, H * 0.80, Math.min(W * 0.62, H * 0.90));
        stChar(c, 'tatsumarky', W * 0.5, H * 0.80, H * 0.44,
               { t: 0.0, moving: false, atk: -1, hpRatio: 1, roll: 0.35 });
        stZzz(c, W * 0.66, H * 0.40, Math.min(W, H) * 0.09);
      } },

    /* 3 うちゅうの しはいしゃ */
    { text: 'うちゅうの しはいしゃ、けんじゃ「ターツーマーキー」。ほしという ほしを したがえて きた たつまきの ぬしである。',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#150a35', '#301060');
        const u = Math.min(W, H);
        stPlanet(c, W * 0.13, H * 0.22, u * 0.10, 'earth');
        stPlanet(c, W * 0.87, H * 0.26, u * 0.08, 'sun');
        stPlanet(c, W * 0.24, H * 0.62, u * 0.06, 'earth');
        stThrone(c, W * 0.5, H * 0.80, Math.min(W * 0.20, H * 0.26));
        stChar(c, 'tatsumarky', W * 0.5, H * 0.80, H * 0.52);
      } },

    /* 4 むかし、ちきゅうを あらしまわって いた */
    { text: 'むかしむかし、ターツーマーキーは たつまきで ちきゅうじゅうを あらしまわり、この ほしを おさめて いた。',
      art: (c, W, H) => {
        stTownScape(c, W, H, 1.0, true);
        stTornado(c, W * 0.30, H * 0.00, H * 0.80, W * 0.30, 'rgba(50,44,70,.85)');
        stTornado(c, W * 0.74, H * 0.04, H * 0.72, W * 0.22, 'rgba(70,62,95,.7)');
        stDebris(c, W, H, 16);
        stPerson(c, W * 0.50, H * 0.84, H * 0.16, 'run');
        stPerson(c, W * 0.60, H * 0.86, H * 0.13, 'run');
        stChar(c, 'tatsumarky', W * 0.52, H * 0.44, H * 0.40);
      } },

    /* 5 だれも さからえなかった */
    { text: 'だれも さからえなかった。ひとも どうぶつも、ただ あたまを さげる しか なかったのだ。',
      art: (c, W, H) => {
        stTownScape(c, W, H, 0.35, true);
        stFlash(c, W, H, '#2b2440');
        stChar(c, 'tatsumarky', W * 0.76, H * 0.80, H * 0.60);
        /* てまえに ひれふす ひとびと */
        for (let i = 0; i < 5; i++) {
          stPerson(c, W * (0.08 + i * 0.115), H * (0.93 + (i % 2) * 0.04), H * 0.22, 'bow');
        }
      } },

    /* 6 いまの ちきゅうを しる */
    { text: '目を さました ターツーマーキーは、とおくの ほしを のぞきこんだ。……そして、みて しまった。',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#0d0826', '#241048');
        const r = Math.min(W * 0.24, H * 0.36);
        stVision(c, W * 0.70, H * 0.42, r, (cc, w2, h2) => {
          stPlanet(cc, w2 * 0.62, h2 * 0.44, Math.min(w2, h2) * 0.26, 'sun');
          stCastle(cc, w2 * 0.30, h2 * 0.88, Math.min(w2, h2) * 0.26);
        });
        stChar(c, 'tatsumarky', W * 0.26, H * 0.92, H * 0.56);
      } },

    /* 7 いかり */
    { text: '「なんじゃと……！？　ちきゅうの こどもが、太陽まで のぼって きた じゃと！？」',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#3a0a1a', '#6a1020');
        stFlash(c, W, H, '#ff2b2b');
        stBolt(c, W * 0.22, H * 0.06, H * 0.42);
        stBolt(c, W * 0.80, H * 0.02, H * 0.36);
        stChar(c, 'tatsumarky', W * 0.5, H * 0.92, H * 0.60,
               { t: 0.2, moving: false, atk: 0.3, hpRatio: 1, roll: 0.35 });
      } },

    /* 8 もういちど せいふく して くれる */
    { text: '「ゆるさん。この うちゅうの ぬしは わしじゃ。もういちど、ちきゅうを せいふく して くれる！」',
      art: (c, W, H) => {
        stSpaceBg(c, W, H, '#20103a', '#3a1060');
        stTornado(c, W * 0.5, H * 0.00, H * 0.56, W * 0.74, 'rgba(180,160,230,.9)');
        stDebris(c, W, H, 10);
        stChar(c, 'tatsumarky', W * 0.5, H * 0.92, H * 0.58);
      } },

    /* 9 ちきゅうへ */
    { text: 'ターツーマーキーは おおきな たつまきに なって、ちきゅうへ とんで いった。',
      art: (c, W, H) => {
        stSpaceBg(c, W, H);
        stPlanet(c, W * 0.28, H * 0.50, Math.min(W, H) * 0.22, 'earth');
        stTornado(c, W * 0.68, H * 0.04, H * 0.64, W * 0.32, 'rgba(200,190,240,.9)');
        stDebris(c, W, H, 8);
      } },

    /* 10 あかい もんが あらわれた */
    { text: 'そして「はじまりの みち」に、みたことの ない あかい もんが あらわれた——。',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stTornado(c, W * 0.5, H * 0.00, H * 0.30, W * 0.9, 'rgba(120,110,150,.45)');
        stTree(c, W * 0.10, H * 0.80, Math.min(W, H) * 0.16, 0.5);
        stTree(c, W * 0.90, H * 0.82, Math.min(W, H) * 0.14, 0.5);
        stGate(c, W * 0.5, H * 0.80, Math.min(W * 0.34, H * 0.42));
      } },

    /* 11 タイトル */
    { text: 'だい3しょう「たつまきへん」、かいまく！　あたらしい ちずが あそべる ように なりました。',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stGate(c, W * 0.5, H * 0.86, Math.min(W * 0.30, H * 0.38), 0.45);
        stTitle(c, W, H, 'たつまきへん', '#ffd54f');
      } },
  ];

  /* --- 「新・始まりの道」を クリアした あとの おはなし --- */
  const STORY_STORM_FLEE = [
    /* 1 もんを こえた */
    { text: 'たつまきほうを かいくぐり、ごうのすけたちは あかい もんを こえた。',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stTree(c, W * 0.88, H * 0.82, Math.min(W, H) * 0.15, 0.4);
        stGate(c, W * 0.52, H * 0.82, Math.min(W * 0.30, H * 0.38));
        stCastle(c, W * 0.12, H * 0.92, Math.min(W, H) * 0.15);
        stChar(c, 'tankun',  W * 0.26, H * 0.92, H * 0.14);
        stChar(c, 'kabekun', W * 0.34, H * 0.92, H * 0.19);
      } },

    /* 2 ターツーマーキーが みとめる */
    { text: '「……ほう。わしの たつまきほうを たえきる とはな。なかなか やるでは ないか。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stFlash(c, W, H, '#2b2440');
        stGate(c, W * 0.18, H * 0.88, Math.min(W * 0.20, H * 0.26), 0.55);
        stChar(c, 'tatsumarky', W * 0.64, H * 0.90, H * 0.56);
        stChar(c, 'tankun', W * 0.30, H * 0.94, H * 0.13);
      } },

    /* 3 3大王が いる */
    { text: '「だがな。わしには ★ちゅうじつな しもべが 3たい★ おる。3大王じゃ。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stFlash(c, W, H, '#1d1830');
        stTornado(c, W * 0.5, H * 0.00, H * 0.34, W * 0.9, 'rgba(120,110,150,.45)');
        stChar(c, 'kedamaru', W * 0.20, H * 0.92, H * 0.40);
        stChar(c, 'gaoudou',  W * 0.50, H * 0.92, H * 0.46);
        stChar(c, 'chuchu',   W * 0.80, H * 0.92, H * 0.42);
      } },

    /* 4 ケダマール */
    { text: '「けの かたまり ── ケダマール。ぞくせいは パワー。ちかづく ものは みな ふきとばされる。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stFlash(c, W, H, '#241c30');
        stChar(c, 'kedamaru', W * 0.5, H * 0.94, H * 0.62);
        stNamePlate(c, W, H, 'ケダマール', '3大王 その1　ぞくせい：パワー', '#cfcabb');
      } },

    /* 5 ガオウドウ */
    { text: '「2つの くちで かみくだく ── ガオウドウ。むぞくせい。どんそくも スタンも きかん。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stFlash(c, W, H, '#2a1a10');
        stChar(c, 'gaoudou', W * 0.5, H * 0.94, H * 0.66);
        stNamePlate(c, W, H, 'ガオウドウ', '3大王 その2　ぞくせい：むぞくせい', '#ffb74d');
      } },

    /* 6 チューチュー（つぎの まちの ボス）*/
    { text: '「ちを すう もの ── チューチュー。つぎの まちは、すでに こいつと むしどもの ものじゃ。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stFlash(c, W, H, '#152a1e');
        stChar(c, 'chuchu', W * 0.5, H * 0.94, H * 0.64);
        stNamePlate(c, W, H, 'チューチュー', '3大王 その3　ぞくせい：けもの', '#80e0b0');
      } },

    /* 7 3たいを たおして みせろ */
    { text: '「この 3たいを たおして みせろ。そのときは ── わしが じきじきに あいてを して やろう。」',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stTornado(c, W * 0.64, H * 0.00, H * 0.42, W * 0.52, 'rgba(150,140,190,.8)');
        stBolt(c, W * 0.18, H * 0.06, H * 0.26);
        stDebris(c, W, H, 8);
        stChar(c, 'tatsumarky', W * 0.64, H * 0.90, H * 0.58);
      } },

    /* 8 きえて いく */
    { text: 'そう いいのこして、ターツーマーキーは たつまきに なって きえて しまった。……つぎの まちへ、いそごう。',
      art: (c, W, H) => {
        stFieldBg(c, W, H, true);
        stTornado(c, W * 0.60, H * 0.02, H * 0.80, W * 0.42, 'rgba(60,55,80,.85)');
        stDebris(c, W, H, 10);
        stGate(c, W * 0.18, H * 0.88, Math.min(W * 0.20, H * 0.26), 0.5);
        stChar(c, 'tankun', W * 0.32, H * 0.94, H * 0.13);
      } },
  ];

  /* =================================================
     ネコスの店（たたかいの ない ばしょ）

     ネコスは、ターツーマーキーに おそわれても いきのこった
     にんげんの ひとり。1にちに 1かい、そざいを 5つ わけて くれます
     （よる 0じで リセット）。
     ================================================= */
  /* =================================================
     ★「1日 1かい」の かぞえかた（v6.33 で かえました）

     まえは「もらってから 24じかん」でした。それだと よる おそくに
     もらうと つぎの 日は よる まで もらえない、と わかりにくい ので、
     ★まいにち よる 0じ 0ふんに リセット★ に しました。
     なんじに あそんでも「その日の ぶん」を 1かい もらえます。

     ・gotToday(at)  … その とけいが「きょう」なら true（もう もらった）
     ・nextDayText() … 「あした 0じ（あと ○じかん ○ふん）」

     ※ ばしょの じかん（タイムゾーン）で かぞえます。
        Date の つき は 0はじまり なので +1 して います。
     ================================================= */
  function dayKeyOf(ts) {
    const d = new Date(ts);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function gotToday(at) {
    return !!at && dayKeyOf(at) === dayKeyOf(Date.now());
  }
  function untilNextDayMs() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0, 0) - n;
  }
  function nextDayText() {
    const ms = untilNextDayMs();
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return 'あした 0じ（あと ' + h + 'じかん ' + m + 'ふん）';
    if (m > 0) return 'あした 0じ（あと ' + m + 'ふん）';
    return 'もうすぐ あした 0じ';
  }

  const NEKOS = {
    give: 5,                 // 1かいに もらえる そざいの かず
  };

  /* おしゃべりを 1つ えらぶ。おなじ はなしが 2かい つづかない ように します */
  let nekosLastTalk = -1;
  function nekosPickTalk() {
    const list = (typeof NEKOS_TALKS !== 'undefined') ? NEKOS_TALKS : [];
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    let i = nekosLastTalk;
    while (i === nekosLastTalk) i = Math.floor(Math.random() * list.length);
    nekosLastTalk = i;
    return list[i];
  }

  function nekosState() {
    const s = slot();
    if (!s) return null;
    if (!s.nekos) s.nekos = { at: 0 };
    return s.nekos;
  }
  /* ★きょう まだ もらって いなければ わたせます（よる 0じで リセット）*/
  function nekosReady() {
    const n = nekosState();
    return !!n && !gotToday(n.at);
  }
  function nekosLeftText() { return nextDayText(); }

  function openShop() {
    shopSay(nekosReady()
      ? 'いらっしゃい！　ぼくは ネコス。あの たつまきから にげのびた にんげんさ。　はなしかけて くれたら、ひろって おいた そざいを わけて あげるよ。'
      : 'やあ、また きて くれたんだね。きょうの そざいは わたしちゃった けど、はなしなら いくらでも するよ。', []);
    refreshShopBtn();
    show('screen-shop');
    startShopLoop();
  }

  /* そざい入れの キラキラを うごかす ため、おみせの がめんの あいだだけ
     えを かきなおします。1びょうに 8かい くらいで じゅうぶん です。   */
  let shopRaf = null, shopLastFrame = 0;
  function startShopLoop() {
    if (shopRaf) cancelAnimationFrame(shopRaf);
    shopLastFrame = 0;
    shopRaf = requestAnimationFrame(shopLoop);
  }
  function shopLoop(now) {
    const sc = $('#screen-shop');
    if (!sc || !sc.classList.contains('active')) { shopRaf = null; return; }
    shopRaf = requestAnimationFrame(shopLoop);
    if (shopLastFrame && now - shopLastFrame < 125) return;
    shopLastFrame = now;
    drawShop();
  }

  function refreshShopBtn() {
    const b = $('#btn-shop-talk');
    if (!b) return;
    const ok = nekosReady();
    b.disabled = false;
    b.textContent = ok ? 'ネコスに はなしかける 💬' : 'ネコスと おしゃべり 💬';
    const n = $('#shop-next');
    if (n) n.textContent = ok ? '' : 'つぎの そざい：' + nekosLeftText();
  }

  function shopSay(text, got) {
    const p = $('#shop-speech');
    if (p) p.textContent = text;
    const box = $('#shop-got');
    if (box) {
      box.innerHTML = '';
      (got || []).forEach(g => {
        const el = document.createElement('span');
        el.textContent = MATERIALS[g.id].icon + MATERIALS[g.id].name + ' ×' + g.n;
        box.appendChild(el);
      });
    }
  }

  /* はなしかける → 1にちに 1かい、そざいを 5つ */
  function nekosTalk() {
    /* ★きょうの こうかんが おわって いたら、そのかわりに
         ずかんや ちずの まめちしき／ざつだんを して くれます（20パターン）*/
    if (!nekosReady()) {
      shopSay(nekosPickTalk(), []);
      refreshShopBtn();
      return;
    }
    const n = nekosState();
    if (!n) return;
    const count = {};
    for (let i = 0; i < NEKOS.give; i++) {
      const id = MATERIAL_ORDER[Math.floor(Math.random() * MATERIAL_ORDER.length)];
      addMat(id, 1);
      count[id] = (count[id] || 0) + 1;
    }
    n.at = Date.now();
    storeSave();
    const got = MATERIAL_ORDER.filter(id => count[id]).map(id => ({ id: id, n: count[id] }));
    shopSay('はい どうぞ！　きょうの ぶんの そざい 5こ だよ。　また あした おいでね。', got);
    refreshShopBtn();
    drawShop();
  }

  /* --- おみせの え（カフェ／バーの カウンター）--- */
  function drawShop() {
    const cv = $('#shop-canvas');
    if (!cv) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w < 2 || h < 2) return;      // まだ おおきさが きまって いない（つぎの フレームで かきます）
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawShopScene(ctx, w, h);
  }

  function drawShopScene(ctx, W, H) {
    const u = Math.min(W, H);
    /* かべ（あたたかい きの いろ）*/
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#4a2f1b'); g.addColorStop(1, '#6b452a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* かべの いたの つぎめ */
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = Math.max(1, H * 0.004);
    for (let x = 0; x < W; x += u * 0.13) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.72); ctx.stroke();
    }

    /* うしろの たな（びんと カップ）*/
    const shelfY = [H * 0.24, H * 0.40];
    shelfY.forEach((sy, si) => {
      ctx.fillStyle = '#3a2416';
      ctx.fillRect(W * 0.06, sy, W * 0.88, H * 0.022);
      for (let i = 0; i < 9; i++) {
        const x = W * (0.10 + i * 0.095) + (si % 2) * W * 0.02;
        const bh = u * (0.07 + ((i * 7 + si * 3) % 4) * 0.014);
        const bw = u * 0.035;
        ctx.fillStyle = ['#8fb98a', '#c98a5a', '#9aa7d6', '#d6b45a'][(i + si) % 4];
        roundRectPath(ctx, x, sy - bh, bw, bh, bw * 0.3); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(x + bw * 0.32, sy - bh - u * 0.018, bw * 0.36, u * 0.018);
      }
    });

    /* ランプ（つりさげ）*/
    for (const fx of [0.20, 0.80]) {
      ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1.5, H * 0.006);
      ctx.beginPath(); ctx.moveTo(W * fx, 0); ctx.lineTo(W * fx, H * 0.10); ctx.stroke();
      ctx.fillStyle = '#f5c95a';
      ctx.beginPath();                          // かさ（うえが せまい だいけい）
      ctx.moveTo(W * fx - u * 0.075, H * 0.16);
      ctx.lineTo(W * fx - u * 0.028, H * 0.10);
      ctx.lineTo(W * fx + u * 0.028, H * 0.10);
      ctx.lineTo(W * fx + u * 0.075, H * 0.16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3c4';                // でんきゅう
      ctx.beginPath(); ctx.arc(W * fx, H * 0.175, u * 0.022, 0, Math.PI * 2); ctx.fill();
      const lg = ctx.createRadialGradient(W * fx, H * 0.17, 1, W * fx, H * 0.17, u * 0.22);
      lg.addColorStop(0, 'rgba(255,224,130,.35)'); lg.addColorStop(1, 'rgba(255,224,130,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(W * fx, H * 0.17, u * 0.22, 0, Math.PI * 2); ctx.fill();
    }

    /* かんばん */
    ctx.save();
    ctx.translate(W * 0.5, H * 0.115);
    ctx.fillStyle = '#26170e'; ctx.strokeStyle = '#d6b45a';
    ctx.lineWidth = Math.max(2, u * 0.008);
    roundRectPath(ctx, -u * 0.20, -u * 0.055, u * 0.40, u * 0.11, u * 0.02);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe0b2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + (u * 0.055) + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.fillText('ネコスの店', 0, 0);
    ctx.restore();

    /* ネコス（カウンターの むこうがわ）*/
    const nekosFeet = H * 0.90;
    const fn = (typeof DRAWERS !== 'undefined') ? DRAWERS.nekos : null;
    if (fn) {
      ctx.save();
      ctx.translate(W * 0.5, nekosFeet);
      const sc = (H * 0.62) / 190;              // ネコスは たて 190 くらい
      ctx.scale(sc, sc);
      fn(ctx, { t: (Date.now() % 100000) / 1000 });
      ctx.restore();
    }

    /* カウンター（バーの ように よこに ながく）*/
    const cy = H * 0.72;
    ctx.fillStyle = '#7b4e2a';
    ctx.fillRect(0, cy + H * 0.05, W, H - cy - H * 0.05);
    ctx.fillStyle = '#5a3418';
    for (let x = 0; x < W; x += u * 0.10) {
      ctx.fillRect(x, cy + H * 0.05, Math.max(1, u * 0.004), H);
    }
    ctx.fillStyle = '#9c6534';
    roundRectPath(ctx, -W * 0.02, cy, W * 1.04, H * 0.075, H * 0.02);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(0, cy + H * 0.006, W, H * 0.012);

    /* カウンターの うえの もの */
    /* コーヒーカップ */
    ctx.save();
    ctx.translate(W * 0.22, cy);
    ctx.fillStyle = '#f5f0e6'; ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1.5, u * 0.006);
    roundRectPath(ctx, -u * 0.035, -u * 0.055, u * 0.07, u * 0.055, u * 0.012);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(u * 0.045, -u * 0.030, u * 0.018, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.moveTo(-u * 0.01, -u * 0.07);
    ctx.quadraticCurveTo(u * 0.012, -u * 0.095, -u * 0.006, -u * 0.115);
    ctx.stroke();
    ctx.restore();
    /* かんようしょくぶつ */
    ctx.save();
    ctx.translate(W * 0.09, cy);
    ctx.fillStyle = '#b25b3a';
    roundRectPath(ctx, -u * 0.035, -u * 0.05, u * 0.07, u * 0.05, u * 0.008); ctx.fill();
    ctx.fillStyle = '#4f9a3d';
    for (const d of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(d * u * 0.022, -u * 0.075, u * 0.016, u * 0.035, d * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* ★そざい入れ（きょう まだ もらって いない ときだけ）*/
    if (nekosReady()) {
      drawMatBasket(ctx, u, W * 0.76, cy, (Date.now() % 100000) / 1000);
    }

    /* まえの いす（バースツール）*/
    ctx.fillStyle = '#3a2416';
    for (const fx of [0.30, 0.70]) {
      ctx.fillRect(W * fx - u * 0.008, H * 0.86, u * 0.016, H * 0.14);
      ctx.beginPath();
      ctx.ellipse(W * fx, H * 0.86, u * 0.055, u * 0.016, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#8a3f3f'; ctx.fill();
      ctx.fillStyle = '#3a2416';
    }

    /* あたたかい あかり（ぜんたいに）*/
    const warm = ctx.createRadialGradient(W * 0.5, H * 0.30, u * 0.05, W * 0.5, H * 0.55, Math.max(W, H) * 0.75);
    warm.addColorStop(0, 'rgba(255,214,140,.16)');
    warm.addColorStop(1, 'rgba(0,0,0,.30)');
    ctx.fillStyle = warm; ctx.fillRect(0, 0, W, H);
  }

  /* --- ★そざい入れ（きょうの ぶんを まだ もらって いない ときだけ でます）---
       ネコスの となりの カウンターの うえに おいて あります。
       これが おいて あれば「いま もらえる！」が ひとめで わかります。
       cx, cy … かごの したの まんなか（カウンターの うえ）              */
  function drawMatBasket(ctx, u, cx, cy, t) {
    const bw = u * 0.240, bh = u * 0.140;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    const ink = '#4a2b12';

    /* かごの なかみ（ふちから すこし かおを だす そざい）*/
    const ICONS = ['🪵', '⛓️', '🧵'];
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = (u * 0.066) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ICONS.forEach((ic, i) => {
      /* ふちの うえに かおを だす たかさ（ふちの うえは -bh - u*0.020）*/
      ctx.fillText(ic, (i - 1) * bw * 0.30, -bh - u * 0.018 + (i === 1 ? -u * 0.016 : 0));
    });

    /* かごの ほんたい（したが すこし せまい だいけい）*/
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, u * 0.0065);
    ctx.fillStyle = '#c4873f';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.50, -bh);
    ctx.lineTo(bw * 0.50, -bh);
    ctx.lineTo(bw * 0.39, 0);
    ctx.lineTo(-bw * 0.39, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    /* あみめ（ななめの こうし）*/
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-bw * 0.50, -bh); ctx.lineTo(bw * 0.50, -bh);
    ctx.lineTo(bw * 0.39, 0); ctx.lineTo(-bw * 0.39, 0);
    ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(90,50,18,.45)'; ctx.lineWidth = Math.max(1, u * 0.004);
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * bw * 0.11, -bh); ctx.lineTo(i * bw * 0.11 + bw * 0.12, 0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * bw * 0.11, -bh); ctx.lineTo(i * bw * 0.11 - bw * 0.12, 0); ctx.stroke();
    }
    ctx.restore();

    /* ふち */
    ctx.fillStyle = '#e0a860'; ctx.strokeStyle = ink;
    roundRectPath(ctx, -bw * 0.54, -bh - u * 0.020, bw * 1.08, u * 0.026, u * 0.012);
    ctx.fill(); ctx.stroke();

    /* まえの ふだ「そざい入れ」*/
    const lw = bw * 0.80, lh = u * 0.050;
    ctx.fillStyle = '#fff3d6'; ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.4, u * 0.005);
    roundRectPath(ctx, -lw / 2, -bh * 0.66, lw, lh, u * 0.010);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a10';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + (u * 0.032) + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.fillText('そざい入れ', 0, -bh * 0.66 + lh / 2);

    /* ★キラキラ（いま もらえる よ、の あいず）*/
    const SP = [[-0.72, -1.30, 1.00], [0.70, -1.45, 0.85], [0.92, -0.70, 0.70]];
    SP.forEach((p, i) => {
      const k = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.4 + i * 1.9));
      const r = u * 0.030 * p[2] * k;
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.55 * k;
      ctx.fillStyle = '#fff59d';
      ctx.beginPath();
      const x0 = p[0] * bw * 0.55, y0 = p[1] * bh;
      ctx.moveTo(x0, y0 - r);
      ctx.quadraticCurveTo(x0 + r * 0.18, y0 - r * 0.18, x0 + r, y0);
      ctx.quadraticCurveTo(x0 + r * 0.18, y0 + r * 0.18, x0, y0 + r);
      ctx.quadraticCurveTo(x0 - r * 0.18, y0 + r * 0.18, x0 - r, y0);
      ctx.quadraticCurveTo(x0 - r * 0.18, y0 - r * 0.18, x0, y0 - r);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  /* =================================================
     ミニゲーム

     ・ホームの「ミニゲーム 🎮」から えらびます。
     ・1つめは「むしたいじ シューティング」。
       だい15しょう「虫に支配された町」を ぜんぶ クリアすると あそべます。
     ・かつと そざいが 5こ もらえますが、★ごほうびは 1日に 1かいまで★。
       （よる 0じで リセット。ゲームじたいは なんかいでも あそべます）
     ================================================= */
  const MINI = { give: 5 };

  function chapterAllCleared(ch) {
    const cleared = (slot() && slot().cleared) || {};
    const list = coursesOf(ch);
    return list.length > 0 && list.every(st => cleared[st.no]);
  }
  function miniState() {
    const s = slot();
    if (!s) return null;
    if (!s.mini) s.mini = { at: 0 };
    return s.mini;
  }
  /* ★ごほうびの タイマーは ゲームごとに べつべつ。
       むかしの セーブは s.mini.at だけ もって いる ので、
       1つめの シューティングは そのまま at を つかいます。      */
  const MINI_AT = { bugshoot: 'at', foodcatch: 'catchAt', duel: 'duelAt' };
  function miniAtKey(key) { return MINI_AT[key] || 'at'; }
  /* ★きょう まだ もらって いなければ ごほうびが でます（よる 0じで リセット）*/
  function miniRewardReady(key) {
    const m = miniState();
    return !!m && !gotToday(m[miniAtKey(key)]);
  }
  function miniMarkGot(key) {
    const m = miniState();
    if (m) m[miniAtKey(key)] = Date.now();
  }
  function miniLeftText() { return nextDayText(); }
  /* ごほうびの そざいを ランダムに n こ くばって、なにが でたか かえします */
  function miniGiveMats(n, key) {
    const count = {};
    for (let i = 0; i < n; i++) {
      const id = MATERIAL_ORDER[Math.floor(Math.random() * MATERIAL_ORDER.length)];
      addMat(id, 1); count[id] = (count[id] || 0) + 1;
    }
    miniMarkGot(key);
    storeSave();
    return count;
  }
  function miniShowGot(box, count) {
    if (!box) return;
    box.innerHTML = '';
    MATERIAL_ORDER.filter(id => count[id]).forEach(id => {
      const el = document.createElement('span');
      el.textContent = MATERIALS[id].icon + MATERIALS[id].name + ' ×' + count[id];
      box.appendChild(el);
    });
  }

  const MINIGAMES = [
    { key: 'bugshoot', icon: '🦟', name: 'むしたいじ シューティング',
      desc: 'えらんだ キャラで、そらから せめて くる むしを うちおとそう！　3かい ダメージを うける まえに ぜんぶ たおせば かち。',
      when: '「虫に支配された町」を ぜんぶ クリアすると あそべます',
      open: () => chapterAllCleared(15),
      go: () => openCharPick(startShoot) },
    { key: 'foodcatch', icon: '🍎', name: 'たべもの あつめ',
      desc: 'そらから おちて くる たべもの 30こを ひろおう！　がれきに あたると すこし うごけなく なります。ぜんぶで そざい 5こ、70%（21こ）でも 3こ もらえます。',
      when: '「秩序が失われた村」を ぜんぶ クリアすると あそべます',
      open: () => chapterAllCleared(16),
      go: () => openCharPick(startCatch) },
    { key: 'duel', icon: '💀', name: 'ケダマールとの たいけつ',
      desc: 'ましかくの わくの なかで、スティックで あかい ハートを うごかして こうげきを よけよう！　よけきったら じぶんの ターン。「たたかう」で はりを まんなかに とめるほど つよい。かつと そざい 5こ。',
      when: '「埃にまみれた都市」を ぜんぶ クリアすると あそべます',
      open: () => chapterAllCleared(17),
      go: () => openCharPick(startDuel) },
  ];

  function openMinigames() {
    const note = $('#minigame-note');
    if (note) {
      note.textContent = 'ごほうびの そざいは ★ゲームごとに 1日 1かいまで★（よる 0じで リセット）。ゲームじたいは なんかいでも あそべます。';
    }
    const box = $('#minigame-list');
    if (box) {
      box.innerHTML = '';
      MINIGAMES.forEach(g => {
        const ok = g.open();
        const el = document.createElement('button');
        el.className = 'mini-card' + (ok ? '' : ' locked');
        let desc = ok ? g.desc : g.when;
        if (ok && !miniRewardReady(g.key)) {
          desc += '<br>（きょうの ごほうびは もらいました。つぎは ' + miniLeftText(g.key) + '）';
        }
        el.innerHTML =
          '<span class="mc-ico">' + (ok ? g.icon : '🔒') + '</span>' +
          '<span class="mc-body">' +
            '<span class="mc-name">' + (ok ? g.name : '？？？') + '</span>' +
            '<span class="mc-desc">' + desc + '</span>' +
          '</span>' +
          '<span class="mc-go">' + (ok ? '▶ あそぶ' : '🔒') + '</span>';
        if (ok) el.addEventListener('click', g.go);
        else    el.addEventListener('click', () => toast(g.when));
        box.appendChild(el);
      });
      box.scrollTop = 0;
    }
    show('screen-minigame');
  }

  /* --- キャラえらび（もっている こ ぜんぶ）---
       ミニゲームは どれも おなじ がめんを つかいます。
       えらんだ あとに なにを するかを onPick で わたします。      */
  function openCharPick(onPick) {
    const s = slot();
    const box = $('#shoot-pick');
    if (box) {
      box.innerHTML = '';
      const owned = (s && s.owned && s.owned.length) ? s.owned : DEFAULT_PARTY;
      owned.forEach(id => {
        if (!UNITS[id]) return;
        const el = document.createElement('button');
        el.className = 'pick-item';
        el.innerHTML = '<canvas></canvas><span>' + (shownDef(id) || UNITS[id]).shortName + '</span>';
        el.addEventListener('click', () => onPick(id));
        box.appendChild(el);
        paintCharBust(el.querySelector('canvas'), id);
      });
      box.scrollTop = 0;
    }
    show('screen-shootpick');
  }

  /* =================================================
     むしたいじ シューティング

     ・ゆびで よこに うごかす。たまは じどうで でる。
     ・キャラは みための ちがい だけ（つよさは みんな おなじ）。
     ・3ウェーブ ＋ ボス（チューチュー）を たおせば かち。
     ・3かい ダメージを うけたら まけ。
     ================================================= */
  const SHOOT = {
    life: 3,
    fireCd: 0.28,            // たまの かんかく（びょう）
    bulletSpeed: 620,
    /* ★ボスの たつまきほう */
    torEvery: 8,             // なんびょうごとに うつか
    torWarn: 1.0,            // なんびょう まえに「あぶない！」を だすか
    torFirst: 5,             // ボスがが でてから 1ぱつめまで
    torHold: 0.6,            // たつまきが のこる びょうすう
    waves: [
      /* dash: true … ときどき きゅうに プレイヤーめがけて とつげきして くる */
      { label: 'ウェーブ 1／3', id: 'togehaya_t', n: 6, hp: 2, speed: 62,  swing: 34, fire: 0,   gap: 0.9, dash: true },
      { label: 'ウェーブ 2／3', id: 'hatchie',    n: 9, hp: 1, speed: 118, swing: 78, fire: 0,   gap: 0.6 },
      { label: 'ウェーブ 3／3', id: 'kamajirou',  n: 5, hp: 5, speed: 52,  swing: 22, fire: 2.6, gap: 1.2 },
      { label: '★ボス チューチュー', id: 'chuchu', n: 1, hp: 40, speed: 0, swing: 0, fire: 1.0, gap: 0, boss: true },
    ],
  };

  let SG = null;          // ゲームの じょうたい
  let shootRaf = null;

  function startShoot(charId) {
    SG = {
      char: charId,
      life: SHOOT.life,
      wave: -1,
      pend: [],           // まだ でて いない てき
      enemies: [], bullets: [], ebullets: [], booms: [],
      px: 0.5, target: 0.5,
      t: 0, fire: 0, inv: 0, over: null, spawnT: 0, tor: null,
      W: 0, H: 0,
    };
    const ov = $('#shoot-over');
    if (ov) ov.classList.add('hidden');
    nextShootWave();
    refreshShootHud();
    show('screen-shoot');
    setupShootDrag();
    if (shootRaf) cancelAnimationFrame(shootRaf);
    shootLast = 0;
    shootRaf = requestAnimationFrame(shootLoop);
  }

  function nextShootWave() {
    SG.wave++;
    const w = SHOOT.waves[SG.wave];
    if (!w) { endShoot(true); return; }
    SG.pend = [];
    for (let i = 0; i < w.n; i++) {
      SG.pend.push({ at: i * w.gap, w: w });
    }
    SG.spawnT = 0;
    const el = $('#shoot-wave');
    if (el) el.textContent = w.label;
  }

  function refreshShootHud() {
    const el = $('#shoot-life');
    if (el) el.textContent = '❤️'.repeat(Math.max(0, SG ? SG.life : 0)) +
                             '🖤'.repeat(Math.max(0, SHOOT.life - (SG ? SG.life : 0)));
  }

  function setupShootDrag() {
    const c = $('#shoot-canvas');
    if (!c || c.dataset.bound) return;
    c.dataset.bound = '1';
    const move = (clientX) => {
      if (!SG) return;
      const r = c.getBoundingClientRect();
      SG.target = Math.max(0.05, Math.min(0.95, (clientX - r.left) / r.width));
    };
    c.addEventListener('pointerdown', e => { move(e.clientX); c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => move(e.clientX));
    c.addEventListener('touchmove', e => { if (e.touches[0]) { move(e.touches[0].clientX); e.preventDefault(); } },
                       { passive: false });
  }

  let shootLast = 0;
  function shootLoop(now) {
    if (!SG || !$('#screen-shoot').classList.contains('active')) { shootRaf = null; return; }
    shootRaf = requestAnimationFrame(shootLoop);
    const dt = shootLast ? Math.min(0.05, (now - shootLast) / 1000) : 0;
    shootLast = now;
    if (!SG.over) updateShoot(dt);
    renderShoot();
  }

  function updateShoot(dt) {
    const W = SG.W || 360, H = SG.H || 480;
    SG.t += dt;
    if (SG.inv > 0) SG.inv -= dt;          // ダメージの あとの むてき じかん
    /* プレイヤーは ゆびを おいかける */
    SG.px += (SG.target - SG.px) * Math.min(1, dt * 12);
    const pxr = SG.px * W, pyr = H - H * 0.13;

    /* たまを じどうで うつ */
    SG.fire -= dt;
    if (SG.fire <= 0) {
      SG.fire = SHOOT.fireCd;
      SG.bullets.push({ x: pxr, y: pyr - 24 });
    }

    /* てきを だす */
    const w = SHOOT.waves[SG.wave];
    if (w) {
      SG.spawnT += dt;
      for (let i = SG.pend.length - 1; i >= 0; i--) {
        if (SG.spawnT >= SG.pend[i].at) {
          const e = SG.pend.splice(i, 1)[0].w;
          SG.enemies.push({
            id: e.id, hp: e.hp, maxHp: e.hp, speed: e.speed, swing: e.swing,
            fire: e.fire, fireCd: e.fire ? (0.8 + Math.random() * e.fire) : 0,
            boss: !!e.boss, seed: Math.random() * 10,
            dash: e.dash ? 0 : -1, dashCd: e.dash ? (1.5 + Math.random() * 2.5) : -1,
            dvx: 0, dvy: 0,
            x: e.boss ? W * 0.5 : (0.1 + Math.random() * 0.8) * W,
            y: e.boss ? -H * 0.18 : -40,
            t: 0,
          });
        }
      }
    }

    /* てきの うごき */
    for (const e of SG.enemies) {
      e.t += dt;
      if (e.boss) {
        /* ボスは よこに いったりきたり */
        if (e.y < H * 0.20) e.y += 70 * dt;
        e.x = W * (0.5 + Math.sin(e.t * 0.8) * 0.33);
      } else if (e.dash > 0) {
        /* ★とつげき ちゅう（トゲハヤさん タツマキ）*/
        e.dash -= dt;
        e.x += e.dvx * dt; e.y += e.dvy * dt;
        if (e.x < 20) { e.x = 20; e.dvx = Math.abs(e.dvx); }
        if (e.x > W - 20) { e.x = W - 20; e.dvx = -Math.abs(e.dvx); }
        if (e.y > H + 40) { e.y = -40; e.dash = 0; e.x = (0.1 + Math.random() * 0.8) * W; }
      } else {
        e.y += e.speed * dt;
        e.x += Math.sin(e.t * 2.2 + e.seed) * e.swing * dt;
        if (e.x < 20) e.x = 20;
        if (e.x > W - 20) e.x = W - 20;
        /* ★ときどき きゅうに プレイヤーめがけて とつげき */
        if (e.dash === 0) {
          e.dashCd -= dt;
          if (e.dashCd <= 0 && e.y > 30 && e.y < H * 0.66) {
            e.dash = 0.85; e.dashCd = 2.6 + Math.random() * 3.0;
            const dx = pxr - e.x, dy = (pyr - 10) - e.y, L = Math.hypot(dx, dy) || 1;
            e.dvx = dx / L * 330; e.dvy = dy / L * 330;
          }
        }
        /* したまで いったら うえから もういちど（にげられない）*/
        if (e.y > H + 40) { e.y = -40; e.x = (0.1 + Math.random() * 0.8) * W; }
      }
      if (e.fire) {
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = e.fire * (0.7 + Math.random() * 0.6);
          if (e.boss) {
            for (const d of [-0.35, 0, 0.35]) SG.ebullets.push({ x: e.x, y: e.y + 24, vx: d * 120, vy: 210 });
          } else {
            SG.ebullets.push({ x: e.x, y: e.y + 18, vx: 0, vy: 240 });
          }
        }
      }
    }

    /* じぶんの たま */
    for (let i = SG.bullets.length - 1; i >= 0; i--) {
      const b = SG.bullets[i];
      b.y -= SHOOT.bulletSpeed * dt;
      if (b.y < -20) { SG.bullets.splice(i, 1); continue; }
      for (const e of SG.enemies) {
        const r = e.boss ? 54 : 26;
        if (Math.abs(b.x - e.x) < r && Math.abs(b.y - e.y) < r) {
          e.hp--; SG.bullets.splice(i, 1);
          SG.booms.push({ x: b.x, y: b.y, t: 0, big: false });
          break;
        }
      }
    }
    /* たおれた てき */
    for (let i = SG.enemies.length - 1; i >= 0; i--) {
      if (SG.enemies[i].hp <= 0) {
        const e = SG.enemies.splice(i, 1)[0];
        SG.booms.push({ x: e.x, y: e.y, t: 0, big: true });
      }
    }

    /* てきの たま */
    for (let i = SG.ebullets.length - 1; i >= 0; i--) {
      const b = SG.ebullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > H + 20 || b.x < -20 || b.x > W + 20) { SG.ebullets.splice(i, 1); continue; }
      if (Math.abs(b.x - pxr) < 22 && Math.abs(b.y - pyr + 20) < 26) {
        SG.ebullets.splice(i, 1); hurtShoot(pxr, pyr);
      }
    }
    /* てきと ぶつかった */
    for (let i = SG.enemies.length - 1; i >= 0; i--) {
      const e = SG.enemies[i];
      if (e.boss) continue;
      if (Math.abs(e.x - pxr) < 34 && Math.abs(e.y - pyr + 18) < 38) {
        SG.enemies.splice(i, 1);
        SG.booms.push({ x: e.x, y: e.y, t: 0, big: true });
        hurtShoot(pxr, pyr);
      }
    }

    for (let i = SG.booms.length - 1; i >= 0; i--) {
      SG.booms[i].t += dt;
      if (SG.booms[i].t > 0.4) SG.booms.splice(i, 1);
    }

    /* ★ボスの たつまきほう（8びょうごと。1びょう まえに「あぶない！」）*/
    const boss = SG.enemies.find(e => e.boss);
    if (boss) {
      if (!SG.tor) SG.tor = { at: SG.t + SHOOT.torFirst, warn: false, x: W / 2, w: W * 0.34, fireT: -1 };
      const T = SG.tor;
      if (T.fireT >= 0) { T.fireT += dt; if (T.fireT > SHOOT.torHold) T.fireT = -1; }
      if (!T.warn && SG.t >= T.at - SHOOT.torWarn) {
        /* よこくの しゅんかんの ばしょで ねらいを かためる（うごけば よけられる）*/
        T.warn = true; T.x = pxr; T.w = W * 0.34;
      }
      if (SG.t >= T.at) {
        T.at = SG.t + SHOOT.torEvery; T.warn = false; T.fireT = 0;
        if (Math.abs(pxr - T.x) < T.w / 2) hurtShoot(pxr, pyr);
        /* おびの なかの たまは かき消される */
        SG.bullets = SG.bullets.filter(b => Math.abs(b.x - T.x) >= T.w / 2);
      }
    } else if (SG.tor) {
      SG.tor = null;
    }

    /* ウェーブ クリア */
    if (!SG.over && SG.enemies.length === 0 && SG.pend.length === 0) nextShootWave();
  }

  function hurtShoot(px, py) {
    if (SG.inv > 0) return;
    SG.life--;
    SG.inv = 0.8;
    SG.booms.push({ x: px, y: py - 20, t: 0, big: true });
    refreshShootHud();
    if (SG.life <= 0) endShoot(false);
  }

  function endShoot(win) {
    SG.over = win ? 'win' : 'lose';
    const t = $('#shoot-over-title');
    if (t) { t.textContent = win ? 'かった！' : 'まけた…'; t.className = 'so-title ' + (win ? 'win' : 'lose'); }
    const got = $('#shoot-got');
    if (got) got.innerHTML = '';
    let msg;
    if (!win) {
      msg = 'むしたちに やられて しまった。もういちど ちょうせん しよう！';
    } else if (miniRewardReady('bugshoot')) {
      /* ★ごほうび：そざい 5こ（1日に 1かいまで）*/
      miniShowGot(got, miniGiveMats(MINI.give, 'bugshoot'));
      msg = 'むしを ぜんぶ やっつけた！　そざい 5こパック を てに いれた！';
    } else {
      msg = 'むしを ぜんぶ やっつけた！　きょうの ごほうびは もう もらって いるので、つぎは ' + miniLeftText('bugshoot') + ' です。';
    }
    const tx = $('#shoot-over-text');
    if (tx) tx.textContent = msg;
    const ov = $('#shoot-over');
    if (ov) ov.classList.remove('hidden');
  }

  /* --- え --- */
  function renderShoot() {
    const cv = $('#shoot-canvas');
    if (!cv || !SG) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    SG.W = w; SG.H = h;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* そら */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3a7fb5'); g.addColorStop(0.6, '#8fc9e8'); g.addColorStop(1, '#cfeaf5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    /* ながれる くも */
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 5; i++) {
      const cy = ((i * 0.23 + SG.t * 0.06) % 1.2 - 0.1) * h;
      const cx = ((i * 137) % 100) / 100 * w;
      const r = h * 0.045;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.9, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.9, cy + r * 0.25, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    /* てき */
    for (const e of SG.enemies) {
      const fn = DRAWERS[e.id];
      if (!fn) continue;
      const size = e.boss ? h * 0.20 : h * 0.105;
      ctx.save();
      ctx.translate(e.x, e.y + size * 0.5);
      const sc = size / storyArtUp(e.id);
      ctx.scale(sc, sc);
      try { fn(ctx, { t: e.t, moving: true, atk: -1, hpRatio: e.hp / e.maxHp, hpRate: 1, roll: 0.3 }); } catch (er) {}
      ctx.restore();
      if (e.boss) {
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(w * 0.12, 8, w * 0.76, 10);
        ctx.fillStyle = '#ff7043';
        ctx.fillRect(w * 0.12, 8, w * 0.76 * (e.hp / e.maxHp), 10);
      }
    }

    /* じぶんの たま */
    ctx.fillStyle = '#ffd54f';
    for (const b of SG.bullets) {
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
    /* てきの たま */
    ctx.fillStyle = '#b39ddb';
    for (const b of SG.ebullets) {
      ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill();
    }

    /* じぶん */
    const px = SG.px * w, py = h - h * 0.13;
    const fn = DRAWERS[shownDrawId(SG.char)];
    if (fn) {
      ctx.save();
      ctx.translate(px, py);
      if (SG.inv > 0 && Math.floor(SG.t * 20) % 2 === 0) ctx.globalAlpha = 0.35;
      const size = h * 0.14;
      const sc = size / storyArtUp(shownDrawId(SG.char));
      ctx.scale(sc, sc);
      try { fn(ctx, { t: SG.t, moving: false, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.3 }); } catch (er) {}
      ctx.restore();
    }

    /* ★ボスの たつまきほう（よこく と はっしゃ）*/
    if (SG.tor) {
      const T = SG.tor;
      if (T.warn && T.fireT < 0) {
        /* よこく：おびが てんめつ ＋「あぶない！」*/
        const blink = 0.22 + 0.30 * Math.abs(Math.sin(SG.t * 12));
        ctx.save();
        ctx.fillStyle = 'rgba(179,157,219,' + blink.toFixed(2) + ')';
        ctx.fillRect(T.x - T.w / 2, 0, T.w, h);
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.setLineDash([10, 8]); ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(T.x - T.w / 2, 0); ctx.lineTo(T.x - T.w / 2, h);
        ctx.moveTo(T.x + T.w / 2, 0); ctx.lineTo(T.x + T.w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const fs = Math.min(w * 0.12, h * 0.09) * (1 + 0.08 * Math.sin(SG.t * 14));
        ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
        ctx.lineWidth = fs * 0.20; ctx.strokeStyle = '#3a0a1a'; ctx.lineJoin = 'round';
        const tx = Math.max(w * 0.30, Math.min(w * 0.70, T.x));
        ctx.strokeText('あぶない！', tx, h * 0.42);
        ctx.fillStyle = '#ff5252';
        ctx.fillText('あぶない！', tx, h * 0.42);
        ctx.restore();
      }
      if (T.fireT >= 0) {
        /* はっしゃ：おびいっぱいの たつまき */
        const k = T.fireT / SHOOT.torHold;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k * 0.85);
        ctx.fillStyle = 'rgba(224,214,246,.55)';
        ctx.fillRect(T.x - T.w / 2, 0, T.w, h);
        /* うずまく はしら（したから うえへ わっかを つみあげる）*/
        const N = 12, rx = T.w / 2;
        for (let i = 0; i < N; i++) {
          const f = i / (N - 1);
          const y = h * (1.02 - f * 1.06);
          const sw = Math.sin(SG.t * 14 - i * 0.7) * rx * 0.16;
          ctx.beginPath();
          ctx.ellipse(T.x + sw, y, rx * (0.72 + f * 0.28), h * 0.030, 0, 0, Math.PI * 2);
          ctx.fillStyle = (i % 2 === 0) ? 'rgba(245,244,240,.95)' : 'rgba(140,136,128,.92)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(53,51,47,.85)';
          ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* ばくはつ */
    for (const b of SG.booms) {
      const k = b.t / 0.4;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = b.big ? '#ff8a65' : '#fff59d';
      ctx.beginPath();
      ctx.arc(b.x, b.y, (b.big ? 30 : 14) * (0.4 + k), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function quitShoot() {
    SG = null;
    if (shootRaf) { cancelAnimationFrame(shootRaf); shootRaf = null; }
    openMinigames();
  }

  /* =================================================
     ミニゲーム その2「たべもの あつめ」

     ・だい16しょう「秩序が失われた村」を ぜんぶ クリアすると あそべます。
     ・ゆびで よこに うごいて、そらから おちて くる たべものを ひろいます。
     ・たべものは ★ぜんぶで 30こ★ しか おちて きません。
     ・がれきに あたると すこしの あいだ うごけなく なります（やられは しません）。
     ・30こ ぜんぶ ひろうと そざい 5こ、70%（21こ）いじょうでも そざい 3こ。
       ごほうびは 1日に 1かいまで（よる 0じで リセット・シューティングとは べつ）。
     ・おちる はやさは たべものも がれきも 1つずつ バラバラです。
     ================================================= */
  const CATCH = {
    foods: 30,                 // ★おちて くる たべものの かず
    pass: 0.7,                 // ごうかくの わりあい（70%）
    giveAll: 5, givePass: 3,   // ぜんぶ ひろった とき／ごうかくの とき
    stun: 1.1,                 // がれきに あたって うごけない びょうすう
    foodGap: [0.55, 1.15],     // たべものが おちて くる かんかく（びょう）
    rockGap: [0.75, 1.55],     // がれきが おちて くる かんかく（びょう）
    foodV:   [0.22, 0.46],     // おちる はやさ（がめんの たかさ ÷ びょう）
    rockV:   [0.26, 0.64],
    follow: 13,                // ゆびを おいかける はやさ
  };

  /* たべものの しゅるい（え は したの drawCatchFood で かいて います）*/
  const CATCH_FOODS = ['apple', 'pine', 'banana', 'onigiri', 'berry', 'melon'];

  let CG = null;              // ゲームの じょうたい
  let catchRaf = null, catchLast = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function startCatch(charId) {
    CG = {
      char: charId,
      px: 0.5, target: 0.5,
      t: 0, stun: 0, hitFlash: 0,
      foods: [], rocks: [], pops: [],
      spawned: 0, caught: 0, lost: 0,
      foodT: rnd(0.3, 0.7), rockT: rnd(0.9, 1.6),
      /* ★とおくで なげて いる ガオウドウ（はいけい）*/
      gaoX: 0.5, gaoDir: 1, gaoThrow: -1, gaoT: 0.8, tosses: [],
      over: null, W: 0, H: 0,
    };
    const ov = $('#catch-over');
    if (ov) ov.classList.add('hidden');
    refreshCatchHud();
    show('screen-catch');
    setupCatchDrag();
    if (catchRaf) cancelAnimationFrame(catchRaf);
    catchLast = 0;
    catchRaf = requestAnimationFrame(catchLoop);
  }

  function refreshCatchHud() {
    const sc = $('#catch-score');
    if (sc) sc.textContent = '🍎 ひろった ' + (CG ? CG.caught : 0) + ' ／ ' + CATCH.foods;
    const st = $('#catch-state');
    if (st) {
      const stunned = CG && CG.stun > 0;
      st.textContent = stunned ? '😵 ふらふら…' : '🧺 ひろって！';
      st.classList.toggle('catch-stun', !!stunned);
    }
  }

  function setupCatchDrag() {
    const c = $('#catch-canvas');
    if (!c || c.dataset.bound) return;
    c.dataset.bound = '1';
    const move = (clientX) => {
      if (!CG) return;
      const r = c.getBoundingClientRect();
      CG.target = Math.max(0.06, Math.min(0.94, (clientX - r.left) / r.width));
    };
    c.addEventListener('pointerdown', e => { move(e.clientX); c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => move(e.clientX));
    c.addEventListener('touchmove', e => { if (e.touches[0]) { move(e.touches[0].clientX); e.preventDefault(); } },
                       { passive: false });
  }

  function catchLoop(now) {
    if (!CG || !$('#screen-catch').classList.contains('active')) { catchRaf = null; return; }
    catchRaf = requestAnimationFrame(catchLoop);
    const dt = catchLast ? Math.min(0.05, (now - catchLast) / 1000) : 0;
    catchLast = now;
    if (!CG.over) updateCatch(dt);
    renderCatch();
  }

  function updateCatch(dt) {
    const W = CG.W || 360, H = CG.H || 480;
    CG.t += dt;
    if (CG.hitFlash > 0) CG.hitFlash -= dt;

    /* ★がれきに あたって いる あいだは ゆびに ついて いかない */
    if (CG.stun > 0) {
      CG.stun -= dt;
      if (CG.stun <= 0) { CG.stun = 0; refreshCatchHud(); }
    } else {
      CG.px += (CG.target - CG.px) * Math.min(1, dt * CATCH.follow);
    }
    const pxr = CG.px * W, pyr = H - H * 0.13;

    /* --- たべものを だす（ぜんぶで CATCH.foods こ だけ）--- */
    if (CG.spawned < CATCH.foods) {
      CG.foodT -= dt;
      if (CG.foodT <= 0) {
        CG.foodT = rnd(CATCH.foodGap[0], CATCH.foodGap[1]);
        CG.spawned++;
        CG.foods.push({
          kind: CATCH_FOODS[Math.floor(Math.random() * CATCH_FOODS.length)],
          x: rnd(0.10, 0.90) * W, y: -H * 0.06,
          v: rnd(CATCH.foodV[0], CATCH.foodV[1]) * H,
          spin: rnd(-1.6, 1.6), rot: rnd(0, 6.28),
        });
      }
    }
    /* --- がれきを だす（こちらは かずの せいげん なし）--- */
    if (CG.spawned < CATCH.foods || CG.foods.length > 0) {
      CG.rockT -= dt;
      if (CG.rockT <= 0) {
        CG.rockT = rnd(CATCH.rockGap[0], CATCH.rockGap[1]);
        CG.rocks.push({
          seed: Math.floor(Math.random() * 1000),
          x: rnd(0.08, 0.92) * W, y: -H * 0.07,
          v: rnd(CATCH.rockV[0], CATCH.rockV[1]) * H,
          spin: rnd(-2.4, 2.4), rot: rnd(0, 6.28),
          big: Math.random() < 0.35,
        });
      }
    }

    /* --- あたりはんてい（キャラの からだの あたり）--- */
    const halfW = H * 0.075, top = pyr - H * 0.145, bottom = pyr + H * 0.015;
    const inBody = (o) => (Math.abs(o.x - pxr) < halfW && o.y > top && o.y < bottom);

    for (let i = CG.foods.length - 1; i >= 0; i--) {
      const f = CG.foods[i];
      f.y += f.v * dt; f.rot += f.spin * dt;
      if (inBody(f)) {
        CG.foods.splice(i, 1); CG.caught++;
        CG.pops.push({ x: f.x, y: f.y, t: 0, text: '＋1', color: '#ffeb3b' });
        refreshCatchHud();
      } else if (f.y > H + H * 0.08) {
        CG.foods.splice(i, 1); CG.lost++;
      }
    }
    for (let i = CG.rocks.length - 1; i >= 0; i--) {
      const r = CG.rocks[i];
      r.y += r.v * dt; r.rot += r.spin * dt;
      /* うごけない あいだは かさなっても なんども あたらない */
      if (CG.stun <= 0 && inBody(r)) {
        CG.rocks.splice(i, 1);
        CG.stun = CATCH.stun; CG.hitFlash = 0.3;
        CG.pops.push({ x: r.x, y: r.y, t: 0, text: 'いたっ！', color: '#ff8a65' });
        refreshCatchHud();
      } else if (r.y > H + H * 0.08) {
        CG.rocks.splice(i, 1);
      }
    }
    for (let i = CG.pops.length - 1; i >= 0; i--) {
      CG.pops[i].t += dt;
      if (CG.pops[i].t > 0.8) CG.pops.splice(i, 1);
    }

    updateCatchGaoudou(dt, W, H);

    /* --- おわり：30こ ぜんぶ でて、がめんに 1つも のこって いない --- */
    if (CG.spawned >= CATCH.foods && CG.foods.length === 0) endCatch();
  }

  /* ★とおくの ガオウドウ。ゆっくり よこに あるきながら、
       ときどき たべものや がれきを そらへ ほうりなげます。
       （3大王の うち ガオウドウだけ ミニゲームに でて いなかった ため）  */
  function updateCatchGaoudou(dt, W, H) {
    /* よこに ゆっくり いったりきたり */
    CG.gaoX += CG.gaoDir * 0.035 * dt;
    if (CG.gaoX > 0.74) { CG.gaoX = 0.74; CG.gaoDir = -1; }
    if (CG.gaoX < 0.26) { CG.gaoX = 0.26; CG.gaoDir = 1; }
    /* なげる うごき */
    if (CG.gaoThrow >= 0) { CG.gaoThrow += dt; if (CG.gaoThrow > 0.7) CG.gaoThrow = -1; }
    CG.gaoT -= dt;
    if (CG.gaoT <= 0) {
      CG.gaoT = rnd(0.9, 1.6);
      CG.gaoThrow = 0;
      const gx = CG.gaoX * W, gy = H * 0.215;
      const toLeft = Math.random() < 0.5;
      CG.tosses.push({
        x: gx, y: gy - H * 0.03,
        vx: (toLeft ? -1 : 1) * rnd(0.10, 0.22) * W,
        vy: -rnd(0.16, 0.26) * H,
        rot: 0, spin: rnd(-4, 4), t: 0,
        rock: Math.random() < 0.45,
        kind: CATCH_FOODS[Math.floor(Math.random() * CATCH_FOODS.length)],
        seed: Math.floor(Math.random() * 1000),
      });
    }
    /* なげた ものは うえへ とんで いって きえる（えんしゅつ だけ）*/
    for (let i = CG.tosses.length - 1; i >= 0; i--) {
      const o = CG.tosses[i];
      o.t += dt;
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.vy += H * 0.10 * dt;            // すこしだけ おちる
      o.rot += o.spin * dt;
      if (o.t > 1.5 || o.y < -H * 0.05) CG.tosses.splice(i, 1);
    }
  }

  /* はいけいの ガオウドウを かく（とおくなので うすく・ちいさく）*/
  function drawCatchGaoudou(ctx, w, h) {
    const gy = h * 0.215;
    /* とおくの おか（ほこりで かすんで いる）*/
    ctx.fillStyle = 'rgba(176,152,88,0.42)';
    ctx.beginPath();
    ctx.moveTo(-10, gy + h * 0.02);
    ctx.quadraticCurveTo(w * 0.5, gy - h * 0.035, w + 10, gy + h * 0.02);
    ctx.lineTo(w + 10, gy + h * 0.055);
    ctx.lineTo(-10, gy + h * 0.055);
    ctx.closePath(); ctx.fill();

    const fn = (typeof DRAWERS !== 'undefined') ? DRAWERS.gaoudou : null;
    if (fn) {
      ctx.save();
      ctx.globalAlpha = 0.66;
      const size = h * 0.185;
      const sc = size / storyArtUp('gaoudou');
      ctx.translate(CG.gaoX * w, gy);
      /* なげる とき すこし のけぞって → まえに ふる */
      const k = (CG.gaoThrow >= 0) ? CG.gaoThrow / 0.7 : -1;
      if (k >= 0) ctx.rotate((k < 0.4 ? -k * 0.5 : (k - 0.4) * 0.6 - 0.2) * 0.5);
      ctx.scale(sc * (CG.gaoDir < 0 ? -1 : 1), sc);
      try { fn(ctx, { t: CG.t, moving: true, atk: (k >= 0 && k < 0.5) ? 0.2 : -1,
                      hpRatio: 1, hpRate: 1, roll: 0 }); } catch (e) {}
      ctx.restore();
    }

    /* なげた もの（うえへ とんで いく）*/
    for (const o of CG.tosses) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.75 - o.t * 0.45);
      ctx.translate(o.x, o.y); ctx.rotate(o.rot);
      if (o.rock) drawCatchRock(ctx, o.seed, h * 0.030);
      else        drawCatchFood(ctx, o.kind, h * 0.028);
      ctx.restore();
    }
  }

  function endCatch() {
    const got = CG.caught, need = Math.ceil(CATCH.foods * CATCH.pass);
    const perfect = (got >= CATCH.foods);
    const pass = (got >= need);
    CG.over = pass ? 'win' : 'lose';

    const t = $('#catch-over-title');
    if (t) {
      t.textContent = perfect ? 'パーフェクト！' : (pass ? 'ごうかく！' : 'ざんねん…');
      t.className = 'so-title ' + (pass ? 'win' : 'lose');
    }
    const box = $('#catch-got');
    if (box) box.innerHTML = '';

    const head = 'たべものを ' + got + ' ／ ' + CATCH.foods + ' こ ひろった！　';
    let msg;
    if (!pass) {
      msg = head + need + 'こ（70%）ひろえたら ごうかく です。もういちど ちょうせん しよう！';
    } else if (miniRewardReady('foodcatch')) {
      const n = perfect ? CATCH.giveAll : CATCH.givePass;
      miniShowGot(box, miniGiveMats(n, 'foodcatch'));
      msg = head + (perfect ? 'ぜんぶ ひろえた ので' : 'ごうかく なので') + ' そざい ' + n + 'こ を てに いれた！';
    } else {
      msg = head + 'きょうの ごほうびは もう もらって いるので、つぎは ' + miniLeftText('foodcatch') + ' です。';
    }
    const tx = $('#catch-over-text');
    if (tx) tx.textContent = msg;
    const ov = $('#catch-over');
    if (ov) ov.classList.remove('hidden');
  }

  /* --- え --- */
  function renderCatch() {
    const cv = $('#catch-canvas');
    if (!cv || !CG) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    CG.W = w; CG.H = h;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* そら（きいろ）*/
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f2dc5c'); g.addColorStop(0.55, '#e9cb45'); g.addColorStop(1, '#d9b63a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    /* すなぼこり */
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 4; i++) {
      const cy = ((i * 0.27 + CG.t * 0.05) % 1.2 - 0.1) * h;
      const cx = ((i * 211) % 100) / 100 * w;
      ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.16, h * 0.028, 0, 0, Math.PI * 2); ctx.fill();
    }
    /* ★とおくで なげて いる ガオウドウ */
    drawCatchGaoudou(ctx, w, h);

    /* じめん */
    ctx.fillStyle = 'rgba(120,95,40,.35)';
    ctx.fillRect(0, h - h * 0.055, w, h * 0.055);

    /* たべもの */
    for (const f of CG.foods) {
      ctx.save();
      /* たべものは くるくる まわらず、ゆらゆら かたむく だけ */
      ctx.translate(f.x, f.y); ctx.rotate(Math.sin(f.rot) * 0.30);
      drawCatchFood(ctx, f.kind, h * 0.042);
      ctx.restore();
    }
    /* がれき */
    for (const r of CG.rocks) {
      ctx.save();
      ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      drawCatchRock(ctx, r.seed, h * (r.big ? 0.052 : 0.038));
      ctx.restore();
    }

    /* じぶん */
    const px = CG.px * w, py = h - h * 0.13;
    const fn = DRAWERS[shownDrawId(CG.char)];
    if (fn) {
      ctx.save();
      ctx.translate(px, py);
      if (CG.stun > 0 && Math.floor(CG.t * 14) % 2 === 0) ctx.globalAlpha = 0.45;
      const size = h * 0.14;
      const sc = size / storyArtUp(shownDrawId(CG.char));
      ctx.scale(sc, sc);
      try { fn(ctx, { t: CG.t, moving: CG.stun <= 0, atk: -1, hpRatio: 1, hpRate: 1, roll: 0.3 }); } catch (er) {}
      ctx.restore();
      /* ふらふら の ほし */
      if (CG.stun > 0) {
        ctx.save();
        ctx.fillStyle = '#fff176'; ctx.strokeStyle = '#6d4c00'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = CG.t * 6 + i * 2.1;
          starPath(ctx, px + Math.cos(a) * h * 0.055, py - h * 0.165 + Math.sin(a) * h * 0.012, h * 0.016);
          ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }
    }
    /* あたった ときの あかい ひかり */
    if (CG.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,82,82,' + (CG.hitFlash * 0.6).toFixed(2) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    /* ＋1 などの もじ */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of CG.pops) {
      const k = p.t / 0.8;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      const fs = h * 0.040;
      ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
      ctx.lineWidth = fs * 0.28; ctx.strokeStyle = '#3a2a00'; ctx.lineJoin = 'round';
      ctx.strokeText(p.text, p.x, p.y - k * h * 0.06);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y - k * h * 0.06);
      ctx.restore();
    }

    /* のこりの かず（がめんの うえ）*/
    const left = CATCH.foods - CG.caught - CG.lost;
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const fs2 = h * 0.034;
    ctx.font = '800 ' + fs2 + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.lineWidth = fs2 * 0.30; ctx.strokeStyle = 'rgba(70,52,0,.55)'; ctx.lineJoin = 'round';
    const txt = 'のこり ' + left + 'こ';
    ctx.strokeText(txt, w * 0.03, h * 0.025);
    ctx.fillStyle = '#5b4300';
    ctx.fillText(txt, w * 0.03, h * 0.025);
    ctx.restore();
  }

  /* ほしの かたち（ふらふら の え に つかいます）*/
  function starPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = (i % 2 === 0) ? r : r * 0.45;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /* たべもの（まんなかが 0,0）
       ★そらが きいろい ので、かげを つけて うきあがらせて います */
  function drawCatchFood(ctx, kind, r) {
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.6, r * 0.13);
    ctx.strokeStyle = '#3a2a12';
    ctx.shadowColor = 'rgba(60,40,0,.35)';
    ctx.shadowBlur = r * 0.55; ctx.shadowOffsetY = r * 0.22;
    if (kind === 'apple') {
      ctx.fillStyle = '#e8453c';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5d3a1a'; ctx.beginPath();
      ctx.moveTo(0, -r * 0.9); ctx.lineTo(r * 0.15, -r * 1.35); ctx.stroke();
      ctx.fillStyle = '#5fbf4a';
      ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 1.15, r * 0.42, r * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'pine') {
      ctx.fillStyle = '#f2d626';
      ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.78, r * 1.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3aa03a';
      starPath(ctx, 0, -r * 1.05, r * 0.72); ctx.fill(); ctx.stroke();
    } else if (kind === 'banana') {
      ctx.fillStyle = '#f0a81e';
      ctx.beginPath();
      ctx.moveTo(-r * 1.00, -r * 0.55);
      ctx.quadraticCurveTo(0, r * 1.35, r * 1.00, -r * 0.45);
      ctx.lineTo(r * 0.72, -r * 0.72);
      ctx.quadraticCurveTo(0, r * 0.55, -r * 0.72, -r * 0.80);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      /* へた（りょうはし）*/
      ctx.fillStyle = '#6d4c1e';
      ctx.beginPath(); ctx.arc(-r * 0.90, -r * 0.66, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'onigiri') {
      ctx.fillStyle = '#fdfbf2';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.0); ctx.lineTo(r * 0.95, r * 0.75); ctx.lineTo(-r * 0.95, r * 0.75);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2f3a2a';
      ctx.fillRect(-r * 0.55, r * 0.05, r * 1.1, r * 0.62);
    } else if (kind === 'berry') {
      ctx.fillStyle = '#e0364f';
      ctx.beginPath();
      ctx.moveTo(0, r * 1.05);
      ctx.quadraticCurveTo(-r * 1.0, r * 0.1, -r * 0.6, -r * 0.7);
      ctx.quadraticCurveTo(0, -r * 1.05, r * 0.6, -r * 0.7);
      ctx.quadraticCurveTo(r * 1.0, r * 0.1, 0, r * 1.05);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4aa83a';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.82, r * 0.62, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#9fd06a';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = Math.max(1.2, r * 0.10);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * (0.30 + i * 0.28), r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  /* がれき（まんなかが 0,0）*/
  function drawCatchRock(ctx, seed, r) {
    const rr = (i) => 0.62 + (((seed * 37 + i * 91) % 100) / 100) * 0.55;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.8, r * 0.14);
    ctx.strokeStyle = '#1d2127'; ctx.fillStyle = '#5c636c';
    ctx.shadowColor = 'rgba(40,30,0,.35)';
    ctx.shadowBlur = r * 0.5; ctx.shadowOffsetY = r * 0.20;
    ctx.beginPath();
    const N = 7;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2;
      const x = Math.cos(a) * r * rr(i), y = Math.sin(a) * r * rr(i + 3);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* いたの かけら */
    ctx.fillStyle = '#9a6b34';
    ctx.save(); ctx.rotate(0.5 + (seed % 7) * 0.2);
    ctx.fillRect(-r * 0.18, -r * 1.05, r * 0.36, r * 1.5);
    ctx.strokeRect(-r * 0.18, -r * 1.05, r * 0.36, r * 1.5);
    ctx.restore();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  function quitCatch() {
    CG = null;
    if (catchRaf) { cancelAnimationFrame(catchRaf); catchRaf = null; }
    openMinigames();
  }

  /* =================================================
     ミニゲーム その3「ケダマールとの たいけつ」

     ・だい17しょう「埃にまみれた都市」を ぜんぶ クリアすると あそべます。
     ・「アンダーテイル」の サンズ戦の ような たたかいかたです。
         1. ★あいての ターン★ … ましかくの わくの なかで、あかい ハート
            （じぶんの たましい）を スティックで うごかして こうげきを よける。
         2. ★じぶんの ターン★ … 「たたかう／みを まもる／しらべる」を えらぶ。
            「たたかう」は うごく はりを まんなかで とめるほど ダメージが おおきい。
       これを くりかえして、ケダマールの たいりょくを 0に したら かち。
       じぶんの たいりょくが 0に なったら まけ。
     ・かつと そざいが 5こ（1日 1かいまで・ほかの ミニゲームとは べつ）。
     ================================================= */
  const DUEL = {
    life: 20,                 // じぶんの たいりょく
    bossHp: 120,              // ケダマールの たいりょく（1かい 3〜16 ダメージ）
    hit: 1,                   // 1かい あたると へる ぶん
    invul: 0.80,              // あたった あとの むてき じかん
    guardHeal: 2,             // 「みを まもる」で かいふくする ぶん
    soulSpeed: 440,           // たましいの はやさ（1びょうに すすむ ドット）
    stickDead: 0.16,          // これより かたむきが ちいさい ときは うごかない
    dirCount: 16,             // ★うごける むきは 16ほうい に そろえる
    aimSpeed: 1.45,           // 「たたかう」の はりの はやさ（おうふく／びょう）
    /* ★あいての こうげき。じゅんばんに くりかえし、1しゅうごとに きつく なる */
    waves: [
      { kind: 'rain',    dur: 7.0, label: 'けだまの あめ' },
      { kind: 'spike',   dur: 7.5, label: 'けの とげ' },
      { kind: 'blaster', dur: 8.0, label: 'ケダマール・ビーム' },
      { kind: 'blue',    dur: 7.5, label: 'あおい け（うごくと いたい）' },
      { kind: 'sweep',   dur: 8.0, label: 'けの かべ' },
    ],
  };

  /* ケダマールの セリフ（「しらべる」で でます）*/
  const DUEL_TALKS = [
    'ケダマールは けを ふるわせて いる。……なんだか たのしそうだ。',
    'ケダマールの け は 1ぽん 1ぽんが かたい。さわると いたそう。',
    'ケダマールは 3大王の ひとり。ターツーマーキーの いちばんの おきにいり らしい。',
    'ケダマールを よく みると、まんなかに「3」の しるしが ある。3大王の 3 だろうか。',
    'ケダマールは ほこりを すいこんで、もっと おおきく なろうと して いる。',
    'ケダマールは あきぼうの はどうを こわがって いない ようだ。',
    'ケダマールが わらった。きばが ぎらりと ひかった。',
  ];

  let DG = null;              // ゲームの じょうたい
  let duelRaf = null, duelLast = 0;

  function startDuel(charId) {
    DG = {
      char: charId,
      life: DUEL.life, boss: DUEL.bossHp,
      phase: 'menu',          // menu / aim / enemy / over
      msg: 'ケダマールが たちはだかった！',
      wave: -1, lap: 0,       // lap = なんしゅうめ（まわるほど きつい）
      t: 0, phaseT: 0, waveDur: 0,
      sx: 0.5, sy: 0.5,       // たましいの ばしょ（わくの なかの 0〜1）
      vx: 0, vy: 0,           // スティックの かたむき（-1〜1）
      moved: false,           // ★あおい け の はんてい に つかう
      inv: 0, shake: 0, flash: 0,
      bullets: [], beams: [], pops: [],
      aim: 0, aimDir: 1,      // 「たたかう」の はり
      swing: -1,              // ボスを なぐった えんしゅつ
      guard: false,           // つぎの ターンは やさしく なる
      over: null, W: 0, H: 0,
    };
    const ov = $('#duel-over');
    if (ov) ov.classList.add('hidden');
    setupDuelStick();
    refreshDuelHud();
    show('screen-duel');
    if (duelRaf) cancelAnimationFrame(duelRaf);
    duelLast = 0;
    duelRaf = requestAnimationFrame(duelLoop);
  }

  function refreshDuelHud() {
    const t = $('#duel-turn');
    if (t) {
      t.textContent = !DG ? '' :
        (DG.phase === 'enemy') ? '★あいての ターン★'
        : (DG.phase === 'aim') ? 'まんなかで とめろ！'
        : 'じぶんの ターン';
    }
    const l = $('#duel-life');
    if (l) l.textContent = DG ? ('❤️' + Math.max(0, DG.life) + '/' + DUEL.life) : '';
    /* メニューの ボタンは じぶんの ターンの ときだけ おせる。
       ただし「たたかう」は はりを とめる ため、aim の あいだも おせる。 */
    const menu = !!DG && DG.phase === 'menu' && !DG.over;
    const aim  = !!DG && DG.phase === 'aim'  && !DG.over;
    const f = $('#btn-duel-fight');
    if (f) { f.disabled = !(menu || aim); f.textContent = aim ? '🎯 いま とめる！' : '⚔️ たたかう'; }
    ['#btn-duel-guard', '#btn-duel-act'].forEach(id => {
      const b = $(id); if (b) b.disabled = !menu;
    });
  }

  /* --- ゆびで うごかす スティック --- */
  function setupDuelStick() {
    const pad = $('#duel-stick'), knob = $('#duel-knob');
    if (!pad || pad.dataset.bound) return;
    pad.dataset.bound = '1';
    let id = null;
    const setFrom = (clientX, clientY) => {
      const r = pad.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const max = r.width * 0.34;
      let dx = clientX - cx, dy = clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      if (knob) knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      if (!DG) return;
      /* ★うごく むきは 16ほうい（22.5どごと）に そろえます。
           すこしだけ ななめに たおした ときは まよこ／まうえに うごきます。
           はやさ（かたむきの おおきさ）は そのまま つかいます。        */
      const mag = Math.min(1, Math.hypot(dx, dy) / max);
      if (mag < DUEL.stickDead) { DG.vx = 0; DG.vy = 0; return; }
      const step = Math.PI * 2 / DUEL.dirCount;
      const ang = Math.round(Math.atan2(dy, dx) / step) * step;
      DG.vx = Math.cos(ang) * mag;
      DG.vy = Math.sin(ang) * mag;
    };
    const clear = () => {
      id = null;
      if (knob) knob.style.transform = '';
      if (DG) { DG.vx = 0; DG.vy = 0; }
    };
    pad.addEventListener('pointerdown', e => {
      id = e.pointerId; pad.setPointerCapture(e.pointerId); setFrom(e.clientX, e.clientY);
      e.preventDefault();
    });
    pad.addEventListener('pointermove', e => { if (id === e.pointerId) setFrom(e.clientX, e.clientY); });
    pad.addEventListener('pointerup', clear);
    pad.addEventListener('pointercancel', clear);
    pad.addEventListener('lostpointercapture', clear);
  }

  /* --- じぶんの ターンの えらびかた --- */
  function duelFight() {
    if (!DG || DG.phase !== 'menu') return;
    DG.phase = 'aim'; DG.aim = 0; DG.aimDir = 1; DG.phaseT = 0;
    DG.msg = 'はりが まんなかに きたら もういちど おして！';
    refreshDuelHud();
  }
  function duelStrike() {
    if (!DG || DG.phase !== 'aim') return;
    /* aim は -1〜1。0に ちかいほど つよい */
    const acc = 1 - Math.min(1, Math.abs(DG.aim));
    const dmg = Math.round(3 + acc * acc * 13);          // 3〜16
    DG.boss = Math.max(0, DG.boss - dmg);
    DG.swing = 0;
    DG.pops.push({ x: 0.5, y: 0.22, t: 0, text: '-' + dmg, color: acc > 0.85 ? '#fff176' : '#ff8a80' });
    DG.msg = (acc > 0.85 ? '★クリティカル★ ' : '') + 'ケダマールに ' + dmg + ' ダメージ！';
    if (DG.boss <= 0) { endDuel(true); return; }
    nextDuelWave();
  }

  function duelGuard() {
    if (!DG || DG.phase !== 'menu') return;
    DG.life = Math.min(DUEL.life, DG.life + DUEL.guardHeal);
    DG.guard = true;
    DG.msg = 'みを まもった！　たいりょくが ' + DUEL.guardHeal + ' もどった。';
    nextDuelWave();
  }
  function duelAct() {
    if (!DG || DG.phase !== 'menu') return;
    DG.msg = DUEL_TALKS[Math.floor(Math.random() * DUEL_TALKS.length)];
    DG.guard = true;                 // ようすを みた ぶん、つぎは よみやすい
    nextDuelWave();
  }

  function nextDuelWave() {
    DG.wave++;
    if (DG.wave >= DUEL.waves.length) { DG.wave = 0; DG.lap++; }
    const w = DUEL.waves[DG.wave];
    DG.phase = 'enemy'; DG.phaseT = 0;
    DG.waveDur = w.dur * (DG.guard ? 0.75 : 1);
    DG.bullets = []; DG.beams = []; DG.spawnT = 0; DG.gap = Math.random();
    DG.sx = 0.5; DG.sy = 0.5; DG.moved = false;
    refreshDuelHud();
  }

  function duelLoop(now) {
    if (!DG || !$('#screen-duel').classList.contains('active')) { duelRaf = null; return; }
    duelRaf = requestAnimationFrame(duelLoop);
    const dt = duelLast ? Math.min(0.05, (now - duelLast) / 1000) : 0;
    duelLast = now;
    if (!DG.over) updateDuel(dt);
    renderDuel();
  }

  /* わくの おおきさ（がめんに たいする わりあい）*/
  function duelBox(W, H) {
    const w = Math.min(W * 0.80, H * 0.62), h = Math.min(H * 0.42, w * 0.78);
    return { x: (W - w) / 2, y: H * 0.50, w: w, h: h };
  }

  function updateDuel(dt) {
    const W = DG.W || 360, H = DG.H || 480;
    DG.t += dt; DG.phaseT += dt;
    if (DG.inv > 0) DG.inv -= dt;
    if (DG.shake > 0) DG.shake -= dt;
    if (DG.flash > 0) DG.flash -= dt;
    if (DG.swing >= 0) { DG.swing += dt; if (DG.swing > 0.6) DG.swing = -1; }
    for (let i = DG.pops.length - 1; i >= 0; i--) {
      DG.pops[i].t += dt; if (DG.pops[i].t > 0.9) DG.pops.splice(i, 1);
    }

    if (DG.phase === 'aim') {
      /* はりが -1 → 1 → -1 と おうふく する */
      DG.aim += DG.aimDir * DUEL.aimSpeed * 2 * dt;
      if (DG.aim > 1) { DG.aim = 1; DG.aimDir = -1; }
      if (DG.aim < -1) { DG.aim = -1; DG.aimDir = 1; }
      /* 4びょう たったら じどうで うつ（とまらない ように）*/
      if (DG.phaseT > 4.0) duelStrike();
      return;
    }
    if (DG.phase !== 'enemy') return;

    const box = duelBox(W, H);
    /* --- たましいを うごかす --- */
    const sp = DUEL.soulSpeed * dt;
    const mx = DG.vx * sp / box.w, my = DG.vy * sp / box.h;
    /* ★あおい け の はんてい。スティックが しんでる ぶん（stickDead）は
         setFrom で 0に して ある ので、0で なければ「うごいて いる」*/
    if (DG.vx !== 0 || DG.vy !== 0) DG.moved = true;
    DG.sx = Math.max(0.03, Math.min(0.97, DG.sx + mx));
    DG.sy = Math.max(0.04, Math.min(0.96, DG.sy + my));

    spawnDuelAttack(dt, box);

    /* --- たま を すすめる／あたり はんてい --- */
    const px = box.x + DG.sx * box.w, py = box.y + DG.sy * box.h;
    const SR = Math.max(6, box.h * 0.055);
    for (let i = DG.bullets.length - 1; i >= 0; i--) {
      const b = DG.bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      const out = (b.x < box.x - 90 || b.x > box.x + box.w + 90 ||
                   b.y < box.y - 90 || b.y > box.y + box.h + 90);
      if (out) { DG.bullets.splice(i, 1); continue; }
      /* ★あおい け は「うごいて いなければ」あたらない */
      if (b.blue && !DG.moved) continue;
      const near = (Math.abs(b.x - px) < b.r + SR * 0.7 && Math.abs(b.y - py) < b.r + SR * 0.7);
      if (near) hurtDuel();
    }
    for (let i = DG.beams.length - 1; i >= 0; i--) {
      const bm = DG.beams[i];
      bm.t += dt;
      if (bm.t > bm.warn + bm.fire) { DG.beams.splice(i, 1); continue; }
      if (bm.t > bm.warn) {
        const inLane = bm.vertical
          ? Math.abs(px - bm.p) < bm.w / 2 + SR * 0.5
          : Math.abs(py - bm.p) < bm.w / 2 + SR * 0.5;
        if (inLane) hurtDuel();
      }
    }
    /* ★あおい け の はんてい は 1フレームごとに リセット */
    DG.moved = (DG.vx !== 0 || DG.vy !== 0);

    if (DG.phaseT >= DG.waveDur && DG.bullets.length === 0 && DG.beams.length === 0) {
      DG.phase = 'menu'; DG.guard = false;
      DG.msg = 'よけきった！　つぎは じぶんの ターン。';
      refreshDuelHud();
    }
  }

  function hurtDuel() {
    if (DG.inv > 0) return;
    DG.inv = DUEL.invul;
    DG.life -= DUEL.hit;
    DG.shake = 0.3; DG.flash = 0.25;
    refreshDuelHud();
    if (DG.life <= 0) { DG.life = 0; endDuel(false); }
  }

  /* --- あいての こうげきを だす --- */
  function spawnDuelAttack(dt, box) {
    const w = DUEL.waves[DG.wave];
    if (!w || DG.phaseT > DG.waveDur) return;
    const hard = 1 + DG.lap * 0.18;              // しゅうを かさねるほど はやい
    DG.spawnT -= dt;
    if (DG.spawnT > 0) return;

    if (w.kind === 'rain') {
      DG.spawnT = 0.42 / hard;
      const n = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        DG.bullets.push({
          x: box.x + (0.06 + Math.random() * 0.88) * box.w, y: box.y - 14,
          vx: 0, vy: (120 + Math.random() * 80) * hard,
          r: box.h * 0.045, kind: 'ball',
        });
      }
    } else if (w.kind === 'spike') {
      DG.spawnT = 0.95 / hard;
      /* うえ か した から とげの かべ。すきまが 1か所 あく */
      const up = Math.random() < 0.5;
      DG.gap = 0.12 + Math.random() * 0.76;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const fx = (i + 0.5) / n;
        if (Math.abs(fx - DG.gap) < 0.17) continue;
        DG.bullets.push({
          x: box.x + fx * box.w, y: up ? box.y - 16 : box.y + box.h + 16,
          vx: 0, vy: (up ? 1 : -1) * 150 * hard,
          r: box.h * 0.055, kind: 'spike',
        });
      }
    } else if (w.kind === 'blaster') {
      DG.spawnT = 1.7 / hard;
      const vertical = Math.random() < 0.5;
      DG.beams.push({
        vertical: vertical,
        p: vertical ? box.x + (0.15 + Math.random() * 0.7) * box.w
                    : box.y + (0.15 + Math.random() * 0.7) * box.h,
        w: (vertical ? box.w : box.h) * 0.20,
        warn: 0.85 / hard, fire: 0.45, t: 0,
      });
    } else if (w.kind === 'blue') {
      DG.spawnT = 0.75 / hard;
      /* ★あおい け。うごいて いなければ あたらない */
      const fromLeft = Math.random() < 0.5;
      const y = box.y + (0.1 + Math.random() * 0.8) * box.h;
      DG.bullets.push({
        x: fromLeft ? box.x - 18 : box.x + box.w + 18, y: y,
        vx: (fromLeft ? 1 : -1) * 190 * hard, vy: 0,
        r: box.h * 0.075, kind: 'bar', blue: true,
      });
    } else {                                      /* sweep */
      DG.spawnT = 1.15 / hard;
      const fromLeft = Math.random() < 0.5;
      DG.gap = 0.12 + Math.random() * 0.76;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const fy = (i + 0.5) / n;
        if (Math.abs(fy - DG.gap) < 0.19) continue;
        DG.bullets.push({
          x: fromLeft ? box.x - 16 : box.x + box.w + 16,
          y: box.y + fy * box.h,
          vx: (fromLeft ? 1 : -1) * 165 * hard, vy: 0,
          r: box.h * 0.052, kind: 'spike',
        });
      }
    }
  }

  function endDuel(win) {
    DG.over = win ? 'win' : 'lose';
    DG.phase = 'over';
    refreshDuelHud();
    const t = $('#duel-over-title');
    if (t) { t.textContent = win ? 'かった！' : 'まけた…'; t.className = 'so-title ' + (win ? 'win' : 'lose'); }
    const box = $('#duel-got');
    if (box) box.innerHTML = '';
    let msg;
    if (!win) {
      msg = 'ケダマールの けに やられて しまった。もういちど ちょうせん しよう！';
    } else if (miniRewardReady('duel')) {
      miniShowGot(box, miniGiveMats(MINI.give, 'duel'));
      msg = 'ケダマールを たおした！　そざい 5こパック を てに いれた！';
    } else {
      msg = 'ケダマールを たおした！　きょうの ごほうびは もう もらって いるので、つぎは ' + miniLeftText() + ' です。';
    }
    const tx = $('#duel-over-text');
    if (tx) tx.textContent = msg;
    const ov = $('#duel-over');
    if (ov) ov.classList.remove('hidden');
  }

  /* --- え --- */
  function renderDuel() {
    const cv = $('#duel-canvas');
    if (!cv || !DG) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w < 2 || h < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    DG.W = w; DG.H = h;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

    ctx.save();
    if (DG.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);

    /* --- ケダマール（うえ）--- */
    const fn = (typeof DRAWERS !== 'undefined') ? DRAWERS.kedamaru : null;
    if (fn) {
      ctx.save();
      const size = h * 0.30;
      const sc = size / storyArtUp('kedamaru');
      const hop = (DG.swing >= 0) ? Math.sin(DG.swing / 0.6 * Math.PI) * h * 0.02 : 0;
      ctx.translate(w * 0.5, h * 0.36 + hop);
      if (DG.swing >= 0 && Math.floor(DG.swing * 24) % 2 === 0) ctx.globalAlpha = 0.45;
      ctx.scale(sc, sc);
      try { fn(ctx, { t: DG.t, moving: false, atk: -1, hpRatio: DG.boss / DUEL.bossHp, hpRate: 1, roll: 0.3 }); } catch (e) {}
      ctx.restore();
    }
    /* ボスの たいりょく */
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(w * 0.16, h * 0.045, w * 0.68, h * 0.018);
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(w * 0.16, h * 0.045, w * 0.68 * (DG.boss / DUEL.bossHp), h * 0.018);
    ctx.fillStyle = '#ffe082'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '800 ' + (h * 0.030) + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.fillText('ケダマール', w * 0.5, h * 0.008);

    /* --- メッセージ --- */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + (h * 0.030) + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.fillStyle = '#fff';
    wrapDuelText(ctx, DG.msg, w * 0.5, h * 0.455, w * 0.88, h * 0.036);

    /* --- わく --- */
    const box = duelBox(w, h);
    if (DG.phase === 'enemy') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(3, h * 0.008);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.save();
      ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();

      /* ビーム（よこく → はっしゃ）*/
      for (const bm of DG.beams) {
        const firing = bm.t > bm.warn;
        if (!firing) {
          const bl = 0.25 + 0.45 * Math.abs(Math.sin(DG.t * 16));
          ctx.fillStyle = 'rgba(255,255,255,' + bl.toFixed(2) + ')';
        } else {
          ctx.fillStyle = 'rgba(255,241,118,0.92)';
        }
        const th = firing ? bm.w : Math.max(2, bm.w * 0.16);
        if (bm.vertical) ctx.fillRect(bm.p - th / 2, box.y, th, box.h);
        else             ctx.fillRect(box.x, bm.p - th / 2, box.w, th);
      }

      /* たま */
      for (const b of DG.bullets) {
        if (b.blue) {
          ctx.fillStyle = '#4fc3f7'; ctx.strokeStyle = '#e1f5fe';
          ctx.lineWidth = 2;
          roundRectPath(ctx, b.x - b.r * 1.9, b.y - b.r * 0.5, b.r * 3.8, b.r, b.r * 0.4);
          ctx.fill(); ctx.stroke();
        } else if (b.kind === 'spike') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          if (b.vy !== 0) {                      // たて
            const d = b.vy > 0 ? 1 : -1;
            ctx.moveTo(b.x, b.y + b.r * 1.5 * d);
            ctx.lineTo(b.x - b.r * 0.7, b.y - b.r * d);
            ctx.lineTo(b.x + b.r * 0.7, b.y - b.r * d);
          } else {                                // よこ
            const d = b.vx > 0 ? 1 : -1;
            ctx.moveTo(b.x + b.r * 1.5 * d, b.y);
            ctx.lineTo(b.x - b.r * d, b.y - b.r * 0.7);
            ctx.lineTo(b.x - b.r * d, b.y + b.r * 0.7);
          }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = '#e0e0e0'; ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          /* けだま らしい とげ */
          ctx.strokeStyle = '#bdbdbd';
          for (let i = 0; i < 6; i++) {
            const a = DG.t * 2 + i * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r);
            ctx.lineTo(b.x + Math.cos(a) * b.r * 1.6, b.y + Math.sin(a) * b.r * 1.6);
            ctx.stroke();
          }
        }
      }

      /* たましい（あかい ハート）*/
      const px = box.x + DG.sx * box.w, py = box.y + DG.sy * box.h;
      const SR = Math.max(6, box.h * 0.055);
      if (!(DG.inv > 0 && Math.floor(DG.t * 22) % 2 === 0)) {
        ctx.fillStyle = '#ff2b2b';
        heartPath(ctx, px, py, SR);
        ctx.fill();
      }
      ctx.restore();

      /* のこり じかんの バー */
      const left = Math.max(0, 1 - DG.phaseT / DG.waveDur);
      ctx.fillStyle = 'rgba(255,255,255,.20)';
      ctx.fillRect(box.x, box.y + box.h + h * 0.018, box.w, h * 0.012);
      ctx.fillStyle = '#80deea';
      ctx.fillRect(box.x, box.y + box.h + h * 0.018, box.w * left, h * 0.012);
      /* こうげきの なまえ */
      const wv = DUEL.waves[DG.wave];
      if (wv) {
        ctx.fillStyle = '#80deea'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = '800 ' + (h * 0.026) + 'px system-ui, "Hiragino Sans", sans-serif';
        ctx.fillText(wv.label, box.x + box.w / 2, box.y + box.h + h * 0.036);
      }
    } else if (DG.phase === 'aim') {
      /* 「たたかう」の はり */
      const bx = w * 0.10, bw = w * 0.80, by = box.y + box.h * 0.35, bh = h * 0.055;
      ctx.fillStyle = '#212121'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
      /* まんなかの あたり */
      ctx.fillStyle = 'rgba(255,241,118,.35)';
      ctx.fillRect(bx + bw * 0.42, by, bw * 0.16, bh);
      ctx.fillStyle = 'rgba(255,241,118,.18)';
      ctx.fillRect(bx + bw * 0.30, by, bw * 0.40, bh);
      /* はり */
      const hx = bx + bw * (0.5 + DG.aim * 0.5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx - 3, by - 6, 6, bh + 12);
    }

    /* ＋ダメージの もじ */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of DG.pops) {
      const k = p.t / 0.9;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      const fs = h * 0.048;
      ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
      ctx.lineWidth = fs * 0.26; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
      ctx.strokeText(p.text, p.x * w, p.y * h - k * h * 0.06);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x * w, p.y * h - k * h * 0.06);
      ctx.restore();
    }
    ctx.restore();

    if (DG.flash > 0) {
      ctx.fillStyle = 'rgba(255,60,60,' + (DG.flash * 1.6).toFixed(2) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  }

  /* ハートの かたち（たましい）*/
  function heartPath(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.3, cx - r * 0.6, cy - r * 1.3, cx, cy - r * 0.45);
    ctx.bezierCurveTo(cx + r * 0.6, cy - r * 1.3, cx + r * 1.5, cy - r * 0.3, cx, cy + r);
    ctx.closePath();
  }

  /* ながい もじを おりかえして かく */
  function wrapDuelText(ctx, text, cx, cy, maxW, lineH) {
    const lines = [];
    let line = '';
    for (const ch of String(text || '')) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    const top = cy - (lines.length - 1) * lineH / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lineH));
  }

  function quitDuel() {
    DG = null;
    if (duelRaf) { cancelAnimationFrame(duelRaf); duelRaf = null; }
    openMinigames();
  }

  /* =================================================
     ぞくせいの あいしょうひょう（ホームの「あいしょうひょう」）

     しくみは data.js の ATTR_BEATS / CONFIG.attrStrong などと
     おなじ ないようを、え で みせて います。
     ================================================= */
  const ATTR_ICON = {
    water: '💧', fire: '🔥', grass: '🌿',
    magic: '🪄', power: '💪', beast: '🐾',
    metal: '⚙️', god: '✨', ghost: '👻', none: '⬜',
  };

  /* ぞくせいの たま（まるの なかに アイコン、したに なまえ）*/
  function attrNode(ctx, x, y, r, key, dir) {
    const col = (typeof ATTR_COLOR !== 'undefined' && ATTR_COLOR[key]) || '#bdbdbd';
    const name = (typeof ATTR_LABEL !== 'undefined' && ATTR_LABEL[key]) || key;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    /* かげ */
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.96, r * 0.86, r * 0.20, 0, 0, Math.PI * 2); ctx.fill();
    /* たま */
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.13); ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
    /* アイコン */
    ctx.font = (r * 0.95) + 'px system-ui, "Apple Color Emoji", sans-serif';
    ctx.fillText(ATTR_ICON[key] || '', x, y + r * 0.04);
    /* なまえ（たまの そとがわ。dir を わたすと その むきに おきます）
       ★もじの はばを はかって おいて、たまに かぶらない ところに おきます */
    const fs = Math.max(11, r * 0.54);
    const dx = (dir && dir.x) || 0, dy = (dir && dir.y !== undefined) ? dir.y : 1;
    ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
    const tw = ctx.measureText(name).width;
    const d = r * 1.20 + Math.abs(dx) * (tw / 2) + Math.abs(dy) * (fs * 0.70) + fs * 0.20;
    const lx = x + dx * d, ly = y + dy * d;
    ctx.lineWidth = fs * 0.42; ctx.strokeStyle = '#0b1a28'; ctx.lineJoin = 'round';
    ctx.strokeText(name, lx, ly);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, lx, ly);
    ctx.restore();
  }

  /* 「つよい」むきの やじるし（すこし そとに ふくらむ）*/
  function attrArrow(ctx, x1, y1, x2, y2, r, color, bow) {
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const gap1 = r * 1.16, gap2 = r * 1.34;
    const sx = x1 + ux * gap1, sy = y1 + uy * gap1;
    const ex = x2 - ux * gap2, ey = y2 - uy * gap2;
    const b = (bow === undefined) ? 0.14 : bow;
    const cx = (sx + ex) / 2 - uy * L * b, cy = (sy + ey) / 2 + ux * L * b;
    const w = Math.max(4, r * 0.24);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    /* やじり（さいごの むきに あわせる）*/
    const hx = ex - cx, hy = ey - cy, HL = Math.hypot(hx, hy) || 1;
    const hu = hx / HL, hv = hy / HL;
    const hs = w * 2.1;
    ctx.beginPath();
    ctx.moveTo(ex + hu * hs * 0.9, ey + hv * hs * 0.9);
    ctx.lineTo(ex - hu * hs * 0.4 - hv * hs * 0.8, ey - hv * hs * 0.4 + hu * hs * 0.8);
    ctx.lineTo(ex - hu * hs * 0.4 + hv * hs * 0.8, ey - hv * hs * 0.4 - hu * hs * 0.8);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* まるい みだし（わの なまえ）*/
  function attrRingTitle(ctx, x, y, text, size) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + size + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.lineWidth = size * 0.36; ctx.strokeStyle = '#0b1a28'; ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffe082';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* 3つの ぞくせいを わに ならべて、じゅんばんに やじるしを ひく */
  /* 1つの わを「わく（x0,y0,はば,たかさ）」の なかに おさめて かきます。
     ・うえに わの なまえ
     ・まんなかに さんかくに ならべた 3つの たま
     ・なまえは たまの そとがわ（まんなかから とおい ほう）          */
  function attrRing(ctx, x0, y0, cw, ch, keys, color, title) {
    /* よこに ならべた とき、となりの わの なまえと ぶつからない ように
       よこはばは すこし ひかえめに つかいます */
    const c = Math.min(cw * 0.84, ch);
    const r = c * 0.105, rad = c * 0.24;
    const cx = x0 + cw / 2, cy = y0 + ch * 0.63;
    attrRingTitle(ctx, cx, y0 + ch * 0.09, title, Math.max(12, c * 0.080));
    const pts = keys.map((k, i) => {
      const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
      return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, key: k,
               dir: { x: Math.cos(a), y: Math.sin(a) } };
    });
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      attrArrow(ctx, a.x, a.y, b.x, b.y, r, color);
    }
    pts.forEach(p => attrNode(ctx, p.x, p.y, r, p.key, p.dir));
  }

  /* --- ① 2つの わ --- */
  function drawAttrRings(ctx, W, H) {
    const wide = (W / H) > 1.3;
    if (wide) {
      attrRing(ctx, 0,     0, W / 2, H, ['water', 'fire', 'grass'], '#4fc3f7', 'しぜんの わ');
      attrRing(ctx, W / 2, 0, W / 2, H, ['magic', 'power', 'beast'], '#ffb74d', 'ちからの わ');
    } else {
      attrRing(ctx, 0, 0,     W, H / 2, ['water', 'fire', 'grass'], '#4fc3f7', 'しぜんの わ');
      attrRing(ctx, 0, H / 2, W, H / 2, ['magic', 'power', 'beast'], '#ffb74d', 'ちからの わ');
    }
    /* わの あいだには あいしょうが ない しるし */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.26)';
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.010);
    ctx.setLineDash([Math.min(W, H) * 0.045, Math.min(W, H) * 0.04]);
    ctx.beginPath();
    if (wide) { ctx.moveTo(W * 0.5, H * 0.08); ctx.lineTo(W * 0.5, H * 0.92); }
    else      { ctx.moveTo(W * 0.06, H * 0.5); ctx.lineTo(W * 0.94, H * 0.5); }
    ctx.stroke();
    ctx.restore();
  }

  /* ちいさな ふだ（「2.5ばい」など）*/
  function attrChip(ctx, x, y, text, color, size) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + size + 'px system-ui, "Hiragino Sans", sans-serif';
    const w = ctx.measureText(text).width + size * 0.9, h = size * 1.6;
    roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h * 0.45);
    ctx.fillStyle = '#0b1a28'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.12); ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* --- ② メタル --- */
  function drawAttrMetal(ctx, W, H) {
    const u = Math.min(W, H);
    const r = u * 0.105;
    const mx = W * 0.76, my = H * 0.46;
    const from = ['fire', 'magic', 'power'];
    from.forEach((k, i) => {
      const y = H * (0.18 + i * 0.30);
      attrArrow(ctx, W * 0.34, y, mx, my, r, '#ff8a65', 0.04);
    });
    from.forEach((k, i) => {
      const y = H * (0.18 + i * 0.30);
      attrNode(ctx, W * 0.34, y, r, k, { x: -1, y: 0 });
    });
    attrNode(ctx, mx, my, u * 0.125, 'metal', { x: 0, y: 1 });
    attrChip(ctx, W * 0.55, H * 0.46, '2.5ばい', '#ffab91', Math.max(11, u * 0.062));
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.max(11, u * 0.072);
    ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.lineWidth = fs * 0.40; ctx.strokeStyle = '#0b1a28'; ctx.lineJoin = 'round';
    ctx.strokeText('とくいな あいて なし', mx, H * 0.90);
    ctx.fillStyle = '#b0bec5';
    ctx.fillText('とくいな あいて なし', mx, H * 0.90);
    ctx.restore();
  }

  /* --- ③ かみ --- */
  function drawAttrGod(ctx, W, H) {
    const u = Math.min(W, H);
    const r = u * 0.125;
    const gx = W * 0.30, gy = H * 0.52;
    /* ひかり */
    ctx.save();
    const gl = ctx.createRadialGradient(gx, gy, r * 0.3, gx, gy, r * 2.4);
    gl.addColorStop(0, 'rgba(255,224,130,.40)');
    gl.addColorStop(1, 'rgba(255,224,130,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(gx, gy, r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const mx = W * 0.76, my = H * 0.52;
    /* メタル → かみ は つよい（うえがわ）／ かみ → メタル は よわい（したがわ）*/
    attrArrow(ctx, mx, my, gx, gy, r, '#ff8a65', 0.22);
    attrArrow(ctx, gx, gy, mx, my, r, '#78909c', 0.22);
    attrNode(ctx, gx, gy, r, 'god',   { x: 0, y: 1 });
    attrNode(ctx, mx, my, r * 0.92, 'metal', { x: 0, y: 1 });
    const cs = Math.max(10, u * 0.058);
    attrChip(ctx, (gx + mx) / 2, my - u * 0.20, '2.5ばい', '#ffab91', cs);
    attrChip(ctx, (gx + mx) / 2, my + u * 0.20, '0.6ばい', '#90a4ae', cs);

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.max(10, u * 0.070);
    ctx.font = '900 ' + fs + 'px system-ui, "Hiragino Sans", sans-serif';
    ctx.lineWidth = fs * 0.40; ctx.strokeStyle = '#0b1a28'; ctx.lineJoin = 'round';
    [['ぜんぶの あいてに 1.2ばい', '#ffe082', H * 0.11],
     ['うける ダメージは 0.8ばい', '#a5d6a7', H * 0.22]].forEach(([t, c, y]) => {
      ctx.strokeText(t, W * 0.5, y);
      ctx.fillStyle = c; ctx.fillText(t, W * 0.5, y);
    });
    ctx.restore();
  }

  /* あいしょうの ない ぞくせい（む・ゆうれい）*/
  function drawAttrPlain() {
    const box = $('#attr-plain');
    if (!box) return;
    box.innerHTML = '';
    ['none', 'ghost'].forEach(k => {
      const cv = document.createElement('canvas');
      box.appendChild(cv);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (w < 2 || h < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      attrNode(ctx, w / 2, h * 0.40, Math.min(w, h) * 0.30, k);
    });
  }

  /* キャンバス 1まいを かく（よこはばに あわせて たかさを きめる）*/
  function paintAttrCanvas(id, fn, ratio) {
    const cv = $(id);
    if (!cv) return;
    const w = cv.clientWidth;
    if (w < 2) { requestAnimationFrame(() => paintAttrCanvas(id, fn, ratio)); return; }
    /* よこに ひろい ときは ひくく、たてながの ときは たかく します */
    const rt = (typeof ratio === 'function') ? ratio(w) : ratio;
    const h = Math.max(200, Math.min(w * rt, window.innerHeight * 0.78));
    cv.style.height = h + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    fn(ctx, w, h);
  }

  function drawAttrAll() {
    paintAttrCanvas('#attr-rings', drawAttrRings, w => (w < 520 ? 1.45 : 0.52));
    paintAttrCanvas('#attr-metal', drawAttrMetal, w => (w < 520 ? 0.95 : 0.48));
    paintAttrCanvas('#attr-god',   drawAttrGod,   w => (w < 520 ? 0.90 : 0.44));
    drawAttrPlain();
  }

  function openAttr() {
    show('screen-attr');
    const body = $('.attr-body');
    if (body) body.scrollTop = 0;
    requestAnimationFrame(() => { drawAttrAll(); requestAnimationFrame(drawAttrAll); });
  }

  /* =================================================
     ムービー えらび（ホームの「ムービー」ボタン）
     ================================================= */
  /* いちど ながれた ムービーは、ここから いつでも みられます。*/
  const MOVIES = [
    { key: 'storm_intro', name: 'ターツーマーキー、めざめる',
      desc: 'だい3しょう「たつまきへん」の はじまり。うちゅうの しはいしゃが ちきゅうを せいふく しに もどって くるまで。',
      when: '太陽の いただき（12-3）を クリアすると みられます',
      list: () => STORY_STORM_INTRO },
    { key: 'storm_flee', name: '3大王、あらわる',
      desc: '「新・始まりの道」を クリアした あと。ターツーマーキーが ちゅうじつな しもべ「3大王」を しょうかいして きえて いく。',
      when: '新・始まりの道（13-1）を クリアすると みられます',
      list: () => STORY_STORM_FLEE },
  ];

  function openMovies() {
    const box = $('#movie-list');
    if (box) {
      box.innerHTML = '';
      MOVIES.forEach(mv => {
        const open = storySeen(mv.key);
        const el = document.createElement('button');
        el.className = 'movie-card' + (open ? '' : ' locked');
        el.innerHTML =
          '<canvas></canvas>' +
          '<span class="movie-body">' +
            '<span class="movie-name">' + (open ? mv.name : '？？？') + '</span>' +
            '<span class="movie-desc">' + (open ? mv.desc : mv.when) + '</span>' +
          '</span>' +
          '<span class="movie-play">' + (open ? '▶ みる' : '🔒') + '</span>';
        if (open) el.addEventListener('click', () => playStory(mv.list(), openMovies));
        else      el.addEventListener('click', () => toast(mv.when));
        box.appendChild(el);
        paintMovieThumb(el.querySelector('canvas'), mv, open);
      });
      box.scrollTop = 0;
    }
    show('screen-movie');
  }

  /* さいしょの コマを ちいさく かいて、みほんに します */
  function paintMovieThumb(canvas, mv, open) {
    if (!canvas) return;
    requestAnimationFrame(() => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w < 2 || h < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!open) {
        ctx.fillStyle = '#2a2140'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#8d7fb5'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 ' + Math.round(h * 0.42) + 'px system-ui, sans-serif';
        ctx.fillText('？', w / 2, h / 2);
        return;
      }
      const panel = mv.list()[0];
      if (panel && panel.art) panel.art(ctx, w, h);
    });
  }

  function playStory(list, onDone) {
    if (!list || !list.length) { if (onDone) onDone(); return; }
    storyList = list; storyIdx = 0; storyDone = onDone || null;
    show('screen-story');
    requestAnimationFrame(storyRender);
  }
  function storyRender() {
    if (!storyList) return;
    const c = $('#story-canvas');
    if (!c) return;
    const w = c.clientWidth, h = c.clientHeight;
    if (w < 2 || h < 2) { requestAnimationFrame(storyRender); return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const p = storyList[storyIdx];
    if (p.art) p.art(ctx, w, h);
    $('#story-text').textContent = p.text;
    $('#story-page').textContent = (storyIdx + 1) + ' / ' + storyList.length;
    $('#btn-story-next').textContent = (storyIdx === storyList.length - 1) ? 'はじめる ▶' : 'つぎへ ▶';
  }
  function storyNext() {
    if (!storyList) return;
    storyIdx++;
    if (storyIdx >= storyList.length) { storyEnd(); return; }
    storyRender();
  }
  function storyEnd() {
    const cb = storyDone;
    storyList = null; storyDone = null; storyIdx = 0;
    if (cb) cb();
  }

  /* おはなしは 1かいだけ ながれます（セーブに おぼえて おく）*/
  function storySeen(key) {
    const s = slot();
    return !!(s && s.story && s.story[key]);
  }
  function markStory(key) {
    const s = slot();
    if (!s) return;
    if (!s.story) s.story = {};
    s.story[key] = true;
    storeSave();
  }
  /* クリアした ステージに あわせて おはなしを ながす */
  function maybeStory(stageNo) {
    /* ★太陽の ボスラッシュ（12-3）を クリアした ときは まいかい ながします。
         ながくても「とばす」で いつでも すぐ ぬけられます。 */
    if (stageNo === 100 && sunAllCleared()) {
      markStory('storm_intro');
      playStory(STORY_STORM_INTRO, () => show('screen-result'));
      return true;
    }
    if (stageNo === 120 && !storySeen('storm_flee')) {
      markStory('storm_flee');
      playStory(STORY_STORM_FLEE, () => show('screen-result'));
      return true;
    }
    return false;
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
    if (win) maybeStory(Game.stage.no);
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
    $('#btn-home-stage').addEventListener('click', openArcs);
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
    $('#btn-chapter-back').addEventListener('click', openArcs);
    $('#btn-arc-back').addEventListener('click', openHome);
    $('#btn-story-next').addEventListener('click', storyNext);
    $('#btn-story-skip').addEventListener('click', storyEnd);
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
    $('#btn-home-movie').addEventListener('click', openMovies);
    $('#btn-home-attr').addEventListener('click', openAttr);
    $('#btn-home-mini').addEventListener('click', openMinigames);
    $('#btn-minigame-back').addEventListener('click', openHome);
    $('#btn-shootpick-back').addEventListener('click', openMinigames);
    $('#btn-shoot-back').addEventListener('click', quitShoot);
    $('#btn-shoot-exit').addEventListener('click', quitShoot);
    $('#btn-shoot-again').addEventListener('click', () => { if (SG) startShoot(SG.char); });
    $('#btn-catch-back').addEventListener('click', quitCatch);
    $('#btn-catch-exit').addEventListener('click', quitCatch);
    $('#btn-catch-again').addEventListener('click', () => { if (CG) startCatch(CG.char); });
    $('#btn-duel-back').addEventListener('click', quitDuel);
    $('#btn-duel-exit').addEventListener('click', quitDuel);
    $('#btn-duel-again').addEventListener('click', () => { if (DG) startDuel(DG.char); });
    $('#btn-duel-fight').addEventListener('click', () => {
      if (!DG) return;
      if (DG.phase === 'menu') duelFight();
      else if (DG.phase === 'aim') duelStrike();
    });
    $('#btn-duel-guard').addEventListener('click', duelGuard);
    $('#btn-duel-act').addEventListener('click', duelAct);
    $('#btn-attr-back').addEventListener('click', openHome);
    $('#btn-movie-back').addEventListener('click', openHome);
    $('#btn-shop-back').addEventListener('click', () => { show('screen-chapter'); redrawMap(); });
    $('#btn-shop-talk').addEventListener('click', nekosTalk);
    $('#btn-shop-nekos').addEventListener('click', nekosTalk);
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
