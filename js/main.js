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
  const GAME_VERSION = '1.6';


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
      /* これから つかう ばしょ（パワーアップ・へんせい・ガチャ用） */
      coins: 0,
      levels: {},
      owned: PARTY.slice(),
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
    saveData.slots[i].played = Date.now();
    storeSave();
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
    $('#home-slot-label').textContent = slot() ? slot().name : 'データ';
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
  function buildStageList() {
    const box = $('#stage-list');
    box.innerHTML = '';
    const cleared = (slot() && slot().cleared) || {};
    STAGES.forEach((st, i) => {
      const b = document.createElement('button');
      b.className = 'stage-card';
      b.innerHTML =
        '<span class="stage-no">' + st.no + '</span>' +
        '<span class="stage-info"><b>' + st.name + '</b><small>' + st.desc + '</small></span>' +
        '<span class="stage-clear">' + (cleared[st.no] ? '⭐' : '') + '</span>';
      b.addEventListener('click', () => startBattle(i));
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
    if (win) markCleared(Game.stage.no);
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
    $('#btn-home-stage').addEventListener('click', () => { buildStageList(); show('screen-stage'); });
    $('#btn-home-power').addEventListener('click', () => toast('パワーアップは じゅんびちゅう！'));
    $('#btn-home-party').addEventListener('click', () => toast('キャラクターへんせいは じゅんびちゅう！'));
    $('#btn-home-gacha').addEventListener('click', () => toast('ガチャは じゅんびちゅう！'));
    $('#btn-home-back').addEventListener('click', () => { buildSaveSlots(); show('screen-save'); });
    $('#btn-home-power').classList.add('soon');
    $('#btn-home-party').classList.add('soon');

    /* ステージ せんたく */
    $('#btn-stage-back').addEventListener('click', () => openHome());

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
    $('#btn-result-retry').addEventListener('click', () => startBattle(Game.stageIndex));
    $('#btn-result-back').addEventListener('click', () => { buildStageList(); show('screen-stage'); });

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
