/* ============================================================
   おと（こうかおん と BGM）

   ★おとの ファイルは 1つも つかいません★
     ブラウザの WebAudio で その場で おとを つくって います。
     ダウンロードが ふえず、file:// でも そのまま なります。

   ★スマホの きまり★
     さいしょに ゆびで さわるまで おとは ならせません。
     なので「はじめて タップした とき」に めざめる ように して います。

   つかいかた：
     Sound.se('summon')       … こうかおん を ならす
     Sound.bgm('battle')      … BGM を きりかえる（おなじなら なにも しない）
     Sound.bgm(null)          … BGM を とめる
     Sound.setOn('se', false) … こうかおんを けす
   ============================================================ */
const Sound = (function () {

  let ctx = null;            // AudioContext
  let masterSe = null;       // こうかおん の おおもとの つまみ
  let masterBgm = null;      // BGM の おおもとの つまみ
  let ready = false;
  let on = { se: true, bgm: true };

  /* ---- めざめる（さいしょの タップで よばれる）---- */
  function wake() {
    if (ready) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      masterSe = ctx.createGain();  masterSe.gain.value = 0.55; masterSe.connect(ctx.destination);
      masterBgm = ctx.createGain(); masterBgm.gain.value = 0.0; masterBgm.connect(ctx.destination);
      ready = true;
      return true;
    } catch (e) { return false; }
  }
  /* とまって いたら うごかす（タブを もどした とき など）*/
  function resume() {
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  }

  /* ============================================================
     こうかおん：みじかい おとを その場で くみたてる
     ============================================================ */

  /* おんてい（ドレミ）を しゅうはすうに する。'A4' = 440Hz */
  const NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function hz(name) {
    const m = /^([A-G])(#?)(-?\d)$/.exec(name);
    if (!m) return 440;
    const semi = NOTE[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  }

  /* ひとつの おとを ならす */
  function tone(opt) {
    if (!ready || !on.se) return;
    const t0 = ctx.currentTime + (opt.delay || 0);
    const dur = opt.dur || 0.12;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opt.type || 'square';
    const f0 = (typeof opt.freq === 'string') ? hz(opt.freq) : (opt.freq || 440);
    o.frequency.setValueAtTime(f0, t0);
    if (opt.to) {
      const f1 = (typeof opt.to === 'string') ? hz(opt.to) : opt.to;
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    }
    const vol = (opt.vol === undefined) ? 0.3 : opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(masterSe);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  /* ノイズ（たたく おと・ばくはつ）*/
  function noise(opt) {
    if (!ready || !on.se) return;
    const t0 = ctx.currentTime + (opt.delay || 0);
    const dur = opt.dur || 0.1;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = opt.filter || 'bandpass';
    f.frequency.setValueAtTime(opt.freq || 1200, t0);
    if (opt.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, opt.to), t0 + dur);
    f.Q.value = opt.q || 1;
    const g = ctx.createGain();
    const vol = (opt.vol === undefined) ? 0.3 : opt.vol;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(masterSe);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  /* ---- こうかおんの レシピ ---- */
  const SE = {
    /* ボタン・がめん */
    tap:      () => tone({ freq: 'E5', to: 'A5', dur: 0.07, vol: 0.18, type: 'square' }),
    back:     () => tone({ freq: 'A4', to: 'D4', dur: 0.09, vol: 0.18, type: 'square' }),
    deny:     () => { tone({ freq: 'D4', dur: 0.08, vol: 0.2, type: 'sawtooth' });
                      tone({ freq: 'A3', dur: 0.12, vol: 0.2, type: 'sawtooth', delay: 0.08 }); },

    /* せんとう */
    summon:   () => { tone({ freq: 'C5', dur: 0.06, vol: 0.22 });
                      tone({ freq: 'G5', dur: 0.1,  vol: 0.22, delay: 0.05 }); },
    hit:      () => noise({ freq: 1600, to: 500, dur: 0.07, vol: 0.16 }),
    hitBig:   () => { noise({ freq: 900, to: 180, dur: 0.16, vol: 0.3 });
                      tone({ freq: 'A3', to: 'D3', dur: 0.14, vol: 0.16, type: 'sawtooth' }); },
    crit:     () => { tone({ freq: 'E6', dur: 0.05, vol: 0.26 });
                      tone({ freq: 'B6', dur: 0.09, vol: 0.22, delay: 0.04 }); },
    weak:     () => tone({ freq: 'F4', to: 'C4', dur: 0.1, vol: 0.14, type: 'triangle' }),
    nullify:  () => { tone({ freq: 'C4', dur: 0.07, vol: 0.18, type: 'triangle' });
                      tone({ freq: 'C4', dur: 0.07, vol: 0.18, type: 'triangle', delay: 0.1 }); },
    knockback:() => tone({ freq: 'G4', to: 'G5', dur: 0.12, vol: 0.2, type: 'triangle' }),
    die:      () => noise({ freq: 700, to: 120, dur: 0.22, vol: 0.2, filter: 'lowpass' }),
    bossIn:   () => { tone({ freq: 'C3', dur: 0.5, vol: 0.28, type: 'sawtooth' });
                      tone({ freq: 'G3', dur: 0.5, vol: 0.24, type: 'sawtooth', delay: 0.12 });
                      noise({ freq: 300, to: 80, dur: 0.6, vol: 0.2, filter: 'lowpass', delay: 0.1 }); },
    chudon:   () => { noise({ freq: 2200, to: 200, dur: 0.5, vol: 0.4, filter: 'lowpass' });
                      tone({ freq: 'C6', to: 'C3', dur: 0.45, vol: 0.25, type: 'sawtooth' }); },
    castle:   () => { noise({ freq: 500, to: 60, dur: 0.7, vol: 0.4, filter: 'lowpass' });
                      tone({ freq: 'G2', dur: 0.6, vol: 0.2, type: 'sawtooth' }); },

    /* けっか */
    win:      () => ['C5', 'E5', 'G5', 'C6'].forEach((n, i) =>
                      tone({ freq: n, dur: i === 3 ? 0.4 : 0.13, vol: 0.3, delay: i * 0.11, type: 'square' })),
    lose:     () => ['G4', 'F4', 'E4', 'C4'].forEach((n, i) =>
                      tone({ freq: n, dur: i === 3 ? 0.45 : 0.16, vol: 0.24, delay: i * 0.15, type: 'triangle' })),

    /* そだてる・あつめる */
    coin:     () => { tone({ freq: 'E6', dur: 0.05, vol: 0.2 });
                      tone({ freq: 'A6', dur: 0.1,  vol: 0.18, delay: 0.05 }); },
    levelup:  () => ['C5', 'E5', 'G5'].forEach((n, i) =>
                      tone({ freq: n, dur: 0.12, vol: 0.26, delay: i * 0.07 })),
    evolve:   () => ['C5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) =>
                      tone({ freq: n, dur: 0.18, vol: 0.26, delay: i * 0.08, type: 'triangle' })),
    gacha:    () => { noise({ freq: 1800, to: 600, dur: 0.3, vol: 0.2 });
                      ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'].forEach((n, i) =>
                        tone({ freq: n, dur: 0.1, vol: 0.22, delay: 0.25 + i * 0.06 })); },
    rare:     () => ['C6', 'E6', 'G6', 'C7'].forEach((n, i) =>
                      tone({ freq: n, dur: 0.3, vol: 0.28, delay: i * 0.1, type: 'triangle' })),
    craft:    () => { noise({ freq: 2400, to: 900, dur: 0.08, vol: 0.2 });
                      noise({ freq: 2000, to: 700, dur: 0.1, vol: 0.2, delay: 0.1 });
                      tone({ freq: 'G5', to: 'C6', dur: 0.2, vol: 0.2, delay: 0.22 }); },
    drop:     () => tone({ freq: 'A5', to: 'E6', dur: 0.12, vol: 0.2, type: 'triangle' }),
    talk:     () => { tone({ freq: 'A5', dur: 0.05, vol: 0.16, type: 'triangle' });
                      tone({ freq: 'D6', dur: 0.07, vol: 0.14, type: 'triangle', delay: 0.05 }); },
  };

  function se(name) {
    if (!ready || !on.se) return;
    resume();
    const f = SE[name];
    if (f) { try { f(); } catch (e) {} }
  }

  /* ============================================================
     BGM：みじかい メロディを くりかえす
     ============================================================ */
  /* ・ ＝ やすみ。おとは「おんてい:ながさ(16ぶおんぷ いくつぶん)」 */
  const TRACKS = {
    /* ホーム：のんびり あかるい */
    home: {
      bpm: 104, vol: 0.13, wave: 'triangle',
      lead: 'E5:2 G5:2 A5:4 G5:2 E5:2 D5:4  C5:2 E5:2 G5:4 E5:2 D5:2 C5:4',
      bass: 'C3:4 G3:4 A2:4 E3:4  F2:4 C3:4 G2:4 G2:4',
    },
    /* せんとう：すこし はやくて げんき */
    battle: {
      bpm: 142, vol: 0.11, wave: 'square',
      lead: 'A4:2 A4:2 C5:2 D5:2 E5:4 D5:2 C5:2  A4:2 C5:2 E5:2 G5:2 A5:4 E5:4',
      bass: 'A2:2 A2:2 A2:2 A2:2 F2:2 F2:2 F2:2 F2:2  G2:2 G2:2 G2:2 G2:2 E2:2 E2:2 E2:4',
    },
    /* ボス：ひくくて こわい */
    boss: {
      bpm: 128, vol: 0.12, wave: 'sawtooth',
      lead: 'D4:2 D4:2 F4:2 D4:2 A4:4 G4:2 F4:2  D4:2 D4:2 F4:2 A4:2 A#4:4 A4:4',
      bass: 'D2:2 D2:2 D2:2 D2:2 D2:2 D2:2 D2:2 D2:2  A#1:2 A#1:2 A#1:2 A#1:2 A1:4 A1:4',
    },
    /* へや：しずかで やさしい */
    room: {
      bpm: 88, vol: 0.11, wave: 'triangle',
      lead: 'C5:4 E5:4 G5:4 E5:4  F5:4 E5:4 D5:8',
      bass: 'C3:8 A2:8  F2:8 G2:8',
    },
    /* ガチャ・とくべつ：わくわく */
    gacha: {
      bpm: 150, vol: 0.12, wave: 'square',
      lead: 'C5:2 E5:2 G5:2 C6:2 G5:2 E5:2 C5:2 E5:2  D5:2 F5:2 A5:2 D6:2 A5:2 F5:2 D5:4',
      bass: 'C3:4 C3:4 G2:4 G2:4  D3:4 D3:4 A2:4 A2:4',
    },
  };

  let bgmName = null;
  let bgmTimer = null;
  let bgmNodes = [];

  function parseSeq(str) {
    return str.trim().split(/\s+/).map(tok => {
      const [n, l] = tok.split(':');
      return { note: n, len: Number(l) || 2 };
    });
  }

  function stopBgm() {
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    bgmNodes = [];
  }

  /* 1しょうせつ ぶんを よやくして、おわる まえに つぎを よやくする */
  function scheduleLoop(name) {
    if (!ready || !on.bgm || bgmName !== name) return;
    const tr = TRACKS[name];
    if (!tr) return;
    const beat = 60 / tr.bpm / 4;          // 16ぶおんぷ 1つぶんの びょうすう
    const t0 = ctx.currentTime + 0.06;
    let total = 0;

    const play = (seq, oct, vol, wave) => {
      let t = t0;
      seq.forEach(ev => {
        const d = ev.len * beat;
        if (ev.note !== '.') {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = wave;
          o.frequency.setValueAtTime(hz(ev.note) * oct, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
          g.gain.setValueAtTime(vol, t + d * 0.6);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.95);
          o.connect(g); g.connect(masterBgm);
          o.start(t); o.stop(t + d);
          bgmNodes.push(o);
        }
        t += d;
      });
      return t - t0;
    };

    total = Math.max(
      play(parseSeq(tr.lead), 1, tr.vol, tr.wave),
      play(parseSeq(tr.bass), 1, tr.vol * 0.85, 'triangle')
    );

    /* ふるい ノードを かたづける */
    if (bgmNodes.length > 400) bgmNodes = bgmNodes.slice(-200);

    bgmTimer = setTimeout(() => scheduleLoop(name), Math.max(200, (total - 0.1) * 1000));
  }

  function bgm(name) {
    if (!ready) { bgmName = name; return; }
    if (bgmName === name) return;
    bgmName = name;
    stopBgm();
    if (!name || !on.bgm) { fade(masterBgm, 0); return; }
    resume();
    fade(masterBgm, 0.5);
    scheduleLoop(name);
  }

  function fade(node, to) {
    if (!ready || !node) return;
    const t = ctx.currentTime;
    try {
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(to, t + 0.4);
    } catch (e) { node.gain.value = to; }
  }

  /* ---- オン・オフ ---- */
  function setOn(kind, v) {
    on[kind] = !!v;
    if (kind === 'bgm') {
      if (!v) { stopBgm(); fade(masterBgm, 0); }
      else if (bgmName) { fade(masterBgm, 0.5); scheduleLoop(bgmName); }
    }
    if (kind === 'se' && masterSe) masterSe.gain.value = v ? 0.55 : 0;
  }
  function isOn(kind) { return !!on[kind]; }

  /* さいしょの タップで めざめる */
  function install() {
    const first = () => {
      if (wake()) {
        if (on.se && masterSe) masterSe.gain.value = 0.55;
        const want = bgmName; bgmName = null; if (want) bgm(want);
      }
      document.removeEventListener('pointerdown', first);
      document.removeEventListener('touchstart', first);
      document.removeEventListener('click', first);
    };
    document.addEventListener('pointerdown', first);
    document.addEventListener('touchstart', first);
    document.addEventListener('click', first);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (ctx) { try { ctx.suspend(); } catch (e) {} } }
      else resume();
    });
  }

  return { install, se, bgm, setOn, isOn, wake,
           get ready() { return ready; } };
})();
