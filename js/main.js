/* ==========================================================================
   ごうのすけのゲーム  —  がめんの きりかえ と ボタン

   ここは「がめんの すすみかた」の ファイルです。
   ========================================================================== */

(function () {

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* =================================================
     バージョン
     あたらしく こうかいする ときは この すうじを 1つ あげます。
     ================================================= */
  const GAME_VERSION = '1.5';

  /* --- さいしんばんの みはり その1：ホームがめんに いれた アプリばん ---
     サービスワーカー（sw.js）が あたらしい ばんを みつけたら おしらせを だす */
  let swWaiting = null;      // じゅんびが できた あたらしい ばん
  let reloading = false;

  function watchForUpdateSW() {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    if (typeof location === 'undefined') return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    navigator.serviceWorker.register('./sw.js').then(reg => {
      // すでに あたらしい ばんが まって いる
      if (reg.waiting && navigator.serviceWorker.controller) {
        swWaiting = reg.waiting; showUpdateBanner();
      }
      reg.addEventListener('updatefound', () => {
        const fresh = reg.installing;
        if (!fresh) return;
        fresh.addEventListener('statechange', () => {
          if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
            swWaiting = fresh; showUpdateBanner();
          }
        });
      });
      // 5ふん おきに あたらしい ばんが ないか みる
      setInterval(() => { reg.update().catch(() => {}); }, 5 * 60 * 1000);
    }).catch(() => { /* サービスワーカーが つかえない ばしょでは なにも しない */ });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  /* --- さいしんばんの みはり その2：claude.ai で ひらいた とき --- */
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
          () => { /* つながらなくても ゲームは そのまま あそべます */ }
        );
      }).catch(() => {});
    } catch (e) { /* おしらせが つかえなくても ゲームは うごきます */ }
  }

  function showUpdateBanner() {
    const b = $('#update-banner');
    if (!b || b.dataset.dismissed === '1') return;
    b.classList.remove('hidden');
  }

  /* -------------------------------------------------
     がめんの きりかえ
     ------------------------------------------------- */
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  /* -------------------------------------------------
     クリアきろく（あそんだ きろくを おぼえておく）
     ------------------------------------------------- */
  const SAVE_KEY = 'gounosuke_clear_v1';
  function loadClear() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveClear(no) {
    try {
      const d = loadClear(); d[no] = true;
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    } catch (e) { /* ファイルを ひらいて あそぶ ときは ほぞん できない ことも あります */ }
  }

  /* -------------------------------------------------
     ステージ せんたく
     ------------------------------------------------- */
  function buildStageList() {
    const box = $('#stage-list');
    box.innerHTML = '';
    const cleared = loadClear();
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

  /* -------------------------------------------------
     キャラの アイコン（ちいさい え）
     ------------------------------------------------- */
  function drawIcon(canvas, id, sizeScale) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 44, h = canvas.clientHeight || 38;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h - 2);
    const sc = (sizeScale || 0.34);
    ctx.scale(sc, sc);
    const fn = DRAWERS[id];
    if (fn) fn(ctx, { t: 0.7, moving: false, atk: -1, hpRatio: 1 });
    ctx.restore();
  }

  /* -------------------------------------------------
     したの キャラボタンを つくる
     ------------------------------------------------- */
  /* ばいそく（1.0 → 1.5 → 2.0 → 1.0 …）*/
  const SPEEDS = [1.0, 1.5, 2.0];
  let speedIndex = 0;
  function currentSpeed() { return SPEEDS[speedIndex]; }
  function cycleSpeed() {
    speedIndex = (speedIndex + 1) % SPEEDS.length;
    updateSpeedButton();
  }
  function updateSpeedButton() {
    const sp = currentSpeed();
    $('#speed-num').textContent = sp.toFixed(1);
    $('#btn-speed').classList.toggle('fast', sp > 1.0);
  }

  let unitButtons = [];
  function buildUnitButtons() {
    const box = $('#unit-buttons');
    box.innerHTML = '';
    unitButtons = [];
    PARTY.forEach(id => {
      const def = UNITS[id];
      const b = document.createElement('button');
      b.className = 'unit-btn';
      b.innerHTML =
        '<canvas class="u-icon"></canvas>' +
        '<span class="u-name">' + def.shortName + '</span>' +
        '<span class="u-cost">' + def.cost + '</span>' +
        '<span class="cd-mask" style="display:none"></span>';
      b.addEventListener('click', (ev) => {
        ev.preventDefault();
        Game.summon(id);
      });
      box.appendChild(b);
      unitButtons.push({ id, el: b, mask: b.querySelector('.cd-mask'), icon: b.querySelector('.u-icon') });
    });
    // アイコンは レイアウトが きまってから かく
    requestAnimationFrame(() => {
      unitButtons.forEach(u => drawIcon(u.icon, u.id, 0.30));
    });
  }

  /* -------------------------------------------------
     バトル かいし
     ------------------------------------------------- */
  function startBattle(index) {
    show('screen-battle');
    const canvas = $('#canvas');
    Game.canvas = canvas;
    Game.ctx = canvas.getContext('2d');
    Game.hudHeight = parseInt(getComputedStyle($('#hud-bottom')).height, 10) || 96;
    Game.start(index);
    requestAnimationFrame(() => {
      Game.resize();
      unitButtons.forEach(u => drawIcon(u.icon, u.id, 0.30));   // アイコンを かきなおす
    });
    $('#confirm-quit').classList.add('hidden');
    updateSpeedButton();
    lastTime = performance.now();
    resultShown = false;
  }

  /* -------------------------------------------------
     HUDの こうしん
     ------------------------------------------------- */
  const moneyFill = () => $('#money-fill');
  function updateHud() {
    // おかね
    const ratio = Game.money / Game.moneyMax;
    $('#money-fill').style.width = (ratio * 100) + '%';
    $('#money-text').textContent = Math.floor(Game.money) + ' / ' + Game.moneyMax;

    // しろの たいりょく
    $('#enemy-hp-fill').style.width  = (Game.enemyCastle.hp / Game.enemyCastle.maxHp * 100) + '%';
    $('#player-hp-fill').style.width = (Game.playerCastle.hp / Game.playerCastle.maxHp * 100) + '%';

    // ボス
    const bossBox = $('#boss-hp');
    if (Game.boss && !Game.boss.dead) {
      bossBox.classList.remove('hidden');
      $('#boss-name').textContent = Game.boss.def.name;
      $('#boss-hp-fill').style.width = (Game.boss.hp / Game.boss.maxHp * 100) + '%';
    } else {
      bossBox.classList.add('hidden');
    }

    // おさいふ君
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

    // ちゅどーん
    const cb = $('#btn-chudon');
    const cr = Game.chudonCharge / CONFIG.chudon.chargeTime;
    $('#chudon-fill').style.width = (cr * 100) + '%';
    cb.classList.toggle('ready', Game.chudonReady && !Game.finished);
    cb.disabled = !Game.chudonReady || Game.finished;

    // キャラボタン
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

  /* -------------------------------------------------
     しょうはい がめん
     ------------------------------------------------- */
  let resultShown = false;
  function showResult() {
    resultShown = true;
    const win = Game.result === 'win';
    const t = $('#result-title');
    t.textContent = win ? 'かった！' : 'まけた…';
    t.className = win ? 'win' : 'lose';
    $('#result-sub').textContent = win
      ? 'ステージ ' + Game.stage.no + ' 「' + Game.stage.name + '」 クリア！'
      : 'もういちど ちょうせん しよう';
    if (win) saveClear(Game.stage.no);
    show('screen-result');
  }

  /* -------------------------------------------------
     メインループ
     ------------------------------------------------- */
  let lastTime = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const battleVisible = $('#screen-battle').classList.contains('active');
    if (!battleVisible || !Game.active) { lastTime = now; return; }

    const raw = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!Game.paused) {
      // ばいそく ぶん、こまかく わけて すすめる（すりぬけ ぼうし）
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

  /* -------------------------------------------------
     そうさ（ドラッグで がめんを よこに うごかす）
     ------------------------------------------------- */
  function setupCanvasDrag() {
    const c = $('#canvas');
    let dragging = false, lastX = 0, moved = 0;

    const down = (x) => { dragging = true; lastX = x; moved = 0; };
    const move = (x) => {
      if (!dragging) return;
      const dx = x - lastX;
      lastX = x;
      moved += Math.abs(dx);
      if (moved > 6) Game.panCamera(dx / Game.view.scale);
    };
    const up = () => { dragging = false; };

    c.addEventListener('touchstart', e => { down(e.touches[0].clientX); }, { passive: true });
    c.addEventListener('touchmove',  e => { move(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend',   up);
    c.addEventListener('mousedown',  e => down(e.clientX));
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup',   up);
  }

  /* -------------------------------------------------
     キーボード（パソコンで あそぶ とき）
     1〜5 = キャラ / W = おさいふ君 / スペース = ちゅどーん
     ------------------------------------------------- */
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

  /* -------------------------------------------------
     はじめの じゅんび
     ------------------------------------------------- */
  function init() {
    buildStageList();
    buildUnitButtons();
    setupCanvasDrag();
    setupKeys();

    $('#btn-start').addEventListener('click', () => { buildStageList(); show('screen-stage'); });
    $('#btn-stage-back').addEventListener('click', () => show('screen-title'));
    $('#btn-retreat').addEventListener('click', () => {
      Game.paused = true;                       // かんがえて いる あいだは とめる
      $('#confirm-quit').classList.remove('hidden');
    });
    $('#btn-quit-no').addEventListener('click', () => {
      $('#confirm-quit').classList.add('hidden');
      Game.paused = false;
      lastTime = performance.now();             // とまって いた ぶんを すすめない
    });
    $('#btn-quit-yes').addEventListener('click', () => {
      $('#confirm-quit').classList.add('hidden');
      Game.paused = false;
      Game.active = false;
      buildStageList();
      show('screen-stage');
    });
    $('#btn-speed').addEventListener('click', cycleSpeed);

    /* あたらしい バージョンの おしらせ */
    $('#version-num').textContent = GAME_VERSION;
    $('#btn-update').addEventListener('click', () => {
      $('#btn-update').textContent = 'こうしん中…';
      if (swWaiting) {
        // あたらしい ばんに いれかえて、そのあと じどうで リロードされる
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
    watchForUpdateSW();   // ホームがめんに いれた アプリばん
    watchForUpdate();     // claude.ai で ひらいた とき
    $('#btn-wallet').addEventListener('click', () => Game.upgradeWallet());
    $('#btn-chudon').addEventListener('click', () => Game.fireChudon());
    $('#btn-result-retry').addEventListener('click', () => startBattle(Game.stageIndex));
    $('#btn-result-back').addEventListener('click', () => { buildStageList(); show('screen-stage'); });

    window.addEventListener('resize', () => {
      if (Game.canvas) {
        Game.hudHeight = parseInt(getComputedStyle($('#hud-bottom')).height, 10) || 96;
        Game.resize();
      }
      unitButtons.forEach(u => drawIcon(u.icon, u.id, 0.30));
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => { if (Game.canvas) Game.resize(); }, 300);
    });

    // ダブルタップで ズームしない ように
    document.addEventListener('gesturestart', e => e.preventDefault());

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
