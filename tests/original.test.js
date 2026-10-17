/* ==========================================================================
   オリジナルの間（はいけい・てき・ステージを つくる）の じどう チェック

   つかいかた：  node tests/original.test.js

   ・そざいの カタログ（BG_PARTS / FOE_PARTS / FOE_COLORS / FOE_MOTION /
     FOE_STATS / FOE_EXTRAS）の つじつま
   ・つくった てきの パーツを ★ぜんぶの くみあわせ★ で えに して みて、
     エラーが でない こと
   ・とくこうかが ゲームの わかる かたちに なる こと
   ・あたらしい がめんと ボタンが ある こと
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math });
for (const file of ['data.js', 'draw.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', file), 'utf8'), ctx, { filename: file });
}
const run = (code) => vm.runInContext(code, ctx);
const BG_PARTS   = run('BG_PARTS');
const FOE_PARTS  = run('FOE_PARTS');
const FOE_COLORS = run('FOE_COLORS');
const FOE_MOTION = run('FOE_MOTION');
const FOE_STATS  = run('FOE_STATS');
const FOE_EXTRAS = run('FOE_EXTRAS');
const FOE_BASE   = run('FOE_BASE');
const FOE_BODY_SIZE = run('FOE_BODY_SIZE');
const drawFoeFrame  = run('drawFoeFrame');
const ORIG       = run('ORIG');
const BACKGROUNDS = run('BACKGROUNDS');
const BG_NAME = run('BG_NAME');
const bgNameOf = run('bgNameOf');
const ATTR_LABEL = run('ATTR_LABEL');
const drawFoeParts = run('drawFoeParts');
const registerFoeDrawer = run('registerFoeDrawer');
const DRAWERS = run('DRAWERS');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

/* えを かく ふり を する（ほんとうの キャンバスは つかいません）*/
let drawCalls = 0;
const grad = () => ({ addColorStop() {} });
const fakeCtx = new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return grad;
    if (k === 'measureText') return () => ({ width: 10 });
    if (typeof k === 'string') return () => { drawCalls++; };
    return undefined;
  },
  set() { return true; },
});

const NL2 = String.fromCharCode(10);

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('はいけいの そざい');

test('そら・やま・じめん・かざり が ぜんぶ ある', () => {
  ['sky', 'hill', 'ground', 'deco'].forEach(k => {
    assert.ok(Array.isArray(BG_PARTS[k]) && BG_PARTS[k].length >= 2, k + ' が すくなすぎる');
    assert.strictEqual(new Set(BG_PARTS[k].map(x => x.id)).size, BG_PARTS[k].length,
      k + ' の id が かぶって いる');
    BG_PARTS[k].forEach(x => assert.ok(x.name, k + '/' + x.id + ' に なまえが ない'));
  });
});

test('そらの いろは 2つ いじょう、やま と じめんは いろが そろって いる', () => {
  BG_PARTS.sky.forEach(x => {
    assert.ok(Array.isArray(x.cols) && x.cols.length >= 2, x.id + ' の そらの いろが たりない');
    x.cols.forEach(c => assert.ok(/^#[0-9a-f]{6}$/i.test(c), x.id + ' の いろ「' + c + '」が おかしい'));
  });
  BG_PARTS.hill.forEach(x => assert.ok(x.far && x.near, x.id + ' の やまの いろが たりない'));
  BG_PARTS.ground.forEach(x => assert.ok(x.c && x.top, x.id + ' の じめんの いろが たりない'));
});

test('かざりは ゲームが しって いる なまえだけ', () => {
  /* ゲームの ほんぺんの はいけいで つかって いる かざりの なまえを あつめる */
  const known = new Set(['none']);
  Object.keys(BACKGROUNDS).forEach(k => { if (BACKGROUNDS[k] && BACKGROUNDS[k].deco) known.add(BACKGROUNDS[k].deco); });
  BG_PARTS.deco.forEach(d => {
    assert.ok(known.has(d.id), 'かざり「' + d.id + '」は ゲームの はいけいで つかわれて いない');
  });
});

test('ゲームの はいけいは ぜんぶ 日本語の なまえが ある', () => {
  /* ステージを つくる がめんに ローマ字の しるしが でない ように。*/
  Object.keys(BACKGROUNDS).forEach(k => {
    assert.ok(BG_NAME[k], 'はいけい「' + k + '」の 日本語の なまえが ない');
    assert.notStrictEqual(bgNameOf(k), k, 'はいけい「' + k + '」が ローマ字の まま');
    assert.ok(!/^[a-zA-Z_]+$/.test(bgNameOf(k)), 'はいけい「' + k + '」の なまえが 日本語で ない');
  });
});

console.log('てきの そざい');

test('かたちの バリエーションが じゅうぶん ある', () => {
  assert.ok(FOE_PARTS.body.length >= 15,
    'からだの かたちが ' + FOE_PARTS.body.length + 'しゅるい しか ない');
  /* おおきく ふりきった かたちが 入って いるか */
  ['wide', 'thin', 'spiky', 'tower'].forEach(id =>
    assert.ok(FOE_PARTS.body.some(b => b.id === id), 'かたち「' + id + '」が ない'));
});

test('パーツ・いろ・うごきが ぜんぶ ある', () => {
  ['body', 'eye', 'mouth', 'horn', 'arm', 'leg', 'pattern'].forEach(k => {
    assert.ok(Array.isArray(FOE_PARTS[k]) && FOE_PARTS[k].length >= 2, k + ' が すくなすぎる');
    assert.strictEqual(new Set(FOE_PARTS[k].map(x => x.id)).size, FOE_PARTS[k].length,
      k + ' の id が かぶって いる');
  });
  assert.ok(FOE_COLORS.length >= 6, 'いろが すくなすぎる');
  FOE_COLORS.forEach(c => assert.ok(c.main && c.dark && c.light, c.id + ' の いろが たりない'));
  assert.ok(FOE_MOTION.walk.length >= 3 && FOE_MOTION.atk.length >= 3, 'うごきが すくなすぎる');
});

test('★パーツの くみあわせを ぜんぶ えに して みて エラーが でない', () => {
  const keys = ['body', 'eye', 'mouth', 'horn', 'arm', 'leg', 'pattern'];
  const base = {};
  keys.forEach(k => { base[k] = FOE_PARTS[k][0].id; });
  base.color = FOE_COLORS[0].id;
  const states = [
    { t: 0.5, moving: true,  atk: -1 },
    { t: 1.2, moving: false, atk: 0.6 },
    { t: 2.0, moving: false, atk: -1, fired: true },
  ];
  let n = 0;
  keys.forEach(k => {
    FOE_PARTS[k].forEach(part => {
      FOE_MOTION.walk.forEach(wk => {
        FOE_MOTION.atk.forEach(ak => {
          const look = Object.assign({}, base);
          look[k] = part.id;
          states.forEach(st => {
            n++;
            drawFoeParts(fakeCtx, st, look, { walk: wk.id, atk: ak.id });
          });
        });
      });
    });
  });
  /* いろも ぜんぶ */
  FOE_COLORS.forEach(c => {
    const look = Object.assign({}, base, { color: c.id });
    states.forEach(st => { n++; drawFoeParts(fakeCtx, st, look, { walk: 'step', atk: 'punch' }); });
  });
  assert.ok(n > 500, 'ためした かずが すくなすぎる（' + n + '）');
});

test('えの とうろく（registerFoeDrawer）が はたらく', () => {
  const look = { body: 'blob', eye: 'one', mouth: 'open', horn: 'crown',
                 arm: 'tentacle', leg: 'wheel', pattern: 'gear', color: 'gold' };
  registerFoeDrawer('origfoe_test1', look, { walk: 'float', atk: 'shoot' });
  assert.strictEqual(typeof DRAWERS['origfoe_test1'], 'function');
  assert.doesNotThrow(() => DRAWERS['origfoe_test1'](fakeCtx, { t: 1, moving: true, atk: -1 }));
});

console.log('たいけい（きほんの かたち）');

test('たいけいが 5しゅるい いじょう ある', () => {
  assert.ok(Array.isArray(FOE_BASE) && FOE_BASE.length >= 5,
    'たいけいが ' + (FOE_BASE || []).length + 'しゅるい しか ない');
  assert.strictEqual(new Set(FOE_BASE.map(b => b.id)).size, FOE_BASE.length, 'id が かぶって いる');
  FOE_BASE.forEach(b => assert.ok(b.name, b.id + ' に なまえが ない'));
  assert.ok(FOE_BASE.some(b => b.id === 'blob'), 'いままでの「ふつう」が ない');
  ['human', 'beast', 'fish', 'dino'].forEach(id =>
    assert.ok(FOE_BASE.some(b => b.id === id), 'たいけい「' + id + '」が ない'));
});

test('からだの おおきさを かえられる', () => {
  assert.ok(FOE_BODY_SIZE.min < 1 && FOE_BODY_SIZE.max > 1,
    'おおきくも ちいさくも できない');
  assert.ok(FOE_BODY_SIZE.step > 0 && FOE_BODY_SIZE.def >= FOE_BODY_SIZE.min
    && FOE_BODY_SIZE.def <= FOE_BODY_SIZE.max, 'はじめの あたいが はんいの そと');
});

test('★たいけいの ほねが ぜんぶ かけて、あたまの ばしょを かえす', () => {
  const COL = { main: '#e05252', dark: '#8e2222', light: '#ffb4a8' };
  const ids = FOE_BASE.map(b => b.id).filter(id => id !== 'blob').concat(['しらない かたち']);
  ids.forEach(id => {
    [true, false].forEach(mv => {
      [{ lean: 0, crouch: 0 }, { lean: 0.8, crouch: 0.5 }, { lean: -0.6, crouch: 0 }].forEach(p => {
        const r = drawFoeFrame(fakeCtx, id, 1.3, mv, p, COL, '#20201e');
        assert.ok(r && typeof r.hx === 'number' && typeof r.hy === 'number' && typeof r.hr === 'number',
          id + ' が あたまの ばしょを かえして いない');
        assert.ok(r.hy < 0, id + ' の あたまが じめんの したに ある（hy=' + r.hy + '）');
        assert.ok(r.hr > 10 && r.hr < 40, id + ' の あたまの おおきさが へん（hr=' + r.hr + '）');
        assert.ok(Math.abs(r.hx) < 70, id + ' の あたまが よこに はなれすぎ（hx=' + r.hx + '）');
      });
    });
  });
});

test('たいけい × パーツ × おおきさ を ぜんぶ えに して みて エラーが でない', () => {
  const keys = ['body', 'eye', 'mouth', 'horn', 'arm', 'leg', 'pattern'];
  const base = {};
  keys.forEach(k => { base[k] = FOE_PARTS[k][0].id; });
  base.color = FOE_COLORS[0].id;
  const states = [
    { t: 0.5, moving: true,  atk: -1 },
    { t: 1.2, moving: false, atk: 0.6 },
    { t: 2.0, moving: false, atk: -1, fired: true },
  ];
  let n = 0;
  FOE_BASE.forEach(b => {
    FOE_PARTS.body.forEach(bodyPart => {
      [FOE_BODY_SIZE.min, 1, FOE_BODY_SIZE.max].forEach(sz => {
        FOE_MOTION.atk.forEach(ak => {
          const look = Object.assign({}, base, { base: b.id, bodySize: sz, body: bodyPart.id });
          states.forEach(st => { n++; drawFoeParts(fakeCtx, st, look, { walk: 'step', atk: ak.id }); });
        });
      });
    });
  });
  assert.ok(n > 1000, 'ためした かずが すくなすぎる（' + n + '）');
});

test('たいけいを えらぶ ところが つくる がめんに ある', () => {
  const i = main.indexOf("if (foeTab === 'look')");
  assert.ok(i >= 0, 'みための タブが みつからない');
  const body = main.slice(i, i + 3000);
  assert.ok(/FOE_EDIT\.look\.base = b\.id/.test(body), 'たいけいを えらべない');
  assert.ok(/FOE_EDIT\.look\.bodySize = parseFloat/.test(body), 'おおきさを かえられない');
  assert.ok(/k === 'arm' \|\| k === 'leg'/.test(body),
    'たいけいの ときに て・あしを かくして いない');
});

test('★パーツを ひとつずつ ぜんぶ えに して、かならず なにか かかれる', () => {
  const keys = ['body', 'eye', 'mouth', 'horn', 'arm', 'leg', 'pattern'];
  const base = {};
  keys.forEach(k => { base[k] = FOE_PARTS[k][0].id; });
  base.color = FOE_COLORS[0].id;
  const states = [
    { t: 0.5, moving: true,  atk: -1 },
    { t: 1.2, moving: false, atk: 0.6 },
  ];
  /* その パーツが ほんとうに かかれて いるか を、
     「ありえない id」の ときの かいすうと くらべて たしかめます */
  const count = (k, id) => {
    const look = Object.assign({}, base, { base: 'blob', bodySize: 1 });
    look[k] = id;
    drawCalls = 0;
    states.forEach(st => drawFoeParts(fakeCtx, st, look, { walk: 'step', atk: 'swing' }));
    return drawCalls;
  };
  let n = 0;
  keys.forEach(k => {
    const nothing = count(k, '__nai__');
    FOE_PARTS[k].forEach(p => {
      n++;
      const c = count(k, p.id);
      assert.ok(c > 0, k + ' の ' + p.id + ' で なにも かかれない');
      /* からだは id が しらない ものでも かならず かかれる ので くらべません */
      if (p.id !== 'none' && k !== 'body') {
        assert.notStrictEqual(c, nothing,
          k + ' の「' + p.name + '」（' + p.id + '）が えに なって いない');
      }
    });
  });
  assert.ok(n >= 60, 'ためした パーツが すくなすぎる（' + n + '）');
});

test('★あたらしい パーツが ふえて いる（しっぽ・たて・ほしの め など）', () => {
  const want = {
    leg:     ['fishtail', 'fluff', 'snake'],
    arm:     ['shield', 'wand', 'arm4'],
    horn:    ['antler', 'halo', 'hair'],
    eye:     ['star', 'heart', 'sleepy'],
    mouth:   ['tongue', 'mustache'],
    pattern: ['star', 'check', 'bolt'],
  };
  Object.keys(want).forEach(k => {
    want[k].forEach(id => {
      const p = FOE_PARTS[k].find(x => x.id === id);
      assert.ok(p, k + ' に ' + id + ' が ない');
      assert.ok(/^[^A-Za-z]+$/.test(p.name), k + '/' + id + ' の なまえが にほんごで ない：' + p.name);
    });
  });
  /* いままでの はじめの パーツ（＝はじめの すがた）は かわって いない */
  assert.strictEqual(FOE_PARTS.body[0].id, 'round');
  assert.strictEqual(FOE_PARTS.leg[0].id, 'two');
  assert.strictEqual(FOE_PARTS.arm[0].id, 'none');
});

console.log('ステータスと とくこうか');

test('バーの はんいが つじつまが あって いる', () => {
  assert.ok(FOE_STATS.length >= 5, 'ステータスが すくなすぎる');
  FOE_STATS.forEach(s => {
    assert.ok(s.name, s.key + ' に なまえが ない');
    assert.ok(s.min < s.max, s.key + ' の min が max いじょう');
    assert.ok(s.def >= s.min && s.def <= s.max, s.key + ' の はじめの あたいが はんいの そと');
    assert.ok(s.step > 0, s.key + ' の step が 0');
  });
  /* せんとうに ひつような ものが そろって いるか */
  ['hp', 'atk', 'speed', 'range', 'attackInterval', 'kbCount'].forEach(k =>
    assert.ok(FOE_STATS.some(s => s.key === k), k + ' の バーが ない'));
});

test('とくこうかは ゲームの わかる かたちに なる', () => {
  const known = ['attackType', 'areaRadius', 'slow', 'knockbackChance', 'stun', 'wave',
                 'crit', 'weaken', 'burn', 'drain', 'flying', 'isBoss'];
  FOE_EXTRAS.forEach(x => {
    assert.ok(x.name && x.desc, x.id + ' に なまえ／せつめいが ない');
    assert.strictEqual(typeof x.apply, 'function', x.id + ' に apply が ない');
    const d = {};
    x.apply(d);
    const got = Object.keys(d);
    assert.ok(got.length >= 1, x.id + ' が なにも かえて いない');
    got.forEach(k => assert.ok(known.indexOf(k) >= 0,
      x.id + ' が しらない こうもく「' + k + '」を かえて いる'));
  });
});

test('ほぞんできる かずが きまって いる', () => {
  ['maxBg', 'maxFoe', 'maxStage', 'maxWaves'].forEach(k =>
    assert.ok(ORIG[k] >= 1, k + ' が きまって いない'));
  assert.ok(ORIG.castleMin < ORIG.castleMax, 'しろの たいりょくの はんいが おかしい');
  assert.ok(ORIG.castleDef >= ORIG.castleMin && ORIG.castleDef <= ORIG.castleMax,
    'しろの たいりょくの はじめの あたいが はんいの そと');
});

console.log('てきの でかたの くりかえし');

/* でて くる かずを かぞえる（ほんとうに だす かわりに かぞえる だけ）*/
const Game = run('Game');
Game.addEffect = () => {};
Game.groundWorldY = () => 0;
function countSpawns(wave, seconds) {
  Game.levels = {}; Game.evolved = {}; Game.evolved2 = {}; Game.gear = {};
  Game.extraEnemies = {
    t_foe: { id: 't_foe', name: 'ためし', rarity: 'N', attr: 'none',
             hp: 100, atk: 10, range: 100, speed: 20,
             attackInterval: 2, attackWindup: 0.3, kbCount: 3, scale: 1,
             attackType: 'single', money: 50, drawAs: 'origfoe_test1' },
  };
  Game.start({ no: 9999, orig: true, name: 'ためし', bg: 'meadow', bgData: null,
               castleHp: 9999999, power: 1, drops: [], reward: { coins: 0, exp: 0 },
               waves: [wave] });
  let n = 0;
  const keep = Game.spawnEnemy;
  Game.spawnEnemy = function () { n++; };
  for (let t = 0; t < seconds; t += 1 / 30) Game.update(1 / 30);
  Game.spawnEnemy = keep;
  return n;
}

test('くりかえし なしなら 1かいだけ でる', () => {
  const n = countSpawns({ at: 2, id: 't_foe', count: 3, gap: 0 }, 40);
  assert.strictEqual(n, 3, '3たい でる はずが ' + n + 'たい');
});

test('★「なんびょう ごとに なんかい」で その かいすう だけ でる', () => {
  /* 2びょうから 5びょう ごとに 3かい → 2・7・12びょう ＝ 2たい × 3かい */
  const n = countSpawns({ at: 2, id: 't_foe', count: 2, gap: 0, repeat: 5, times: 3 }, 40);
  assert.strictEqual(n, 6, '2たい × 3かい ＝ 6たい の はずが ' + n + 'たい');
});

test('かいすうを きめないと ずっと くりかえす（もとの ステージは そのまま）', () => {
  /* times を かかない のは ゲームに もとから ある ステージの かきかた。
     30びょうなら 2・7・12・17・22・27 の 6かい。                    */
  const n = countSpawns({ at: 2, id: 't_foe', count: 1, gap: 0, repeat: 5 }, 30);
  assert.strictEqual(n, 6, 'ずっと くりかえす はずが ' + n + 'たい');
});

test('くりかえしの はんいが きまって いる', () => {
  assert.ok(ORIG.repeatMax >= 10, 'repeatMax が ちいさすぎる');
  assert.ok(ORIG.timesMax >= 5, 'timesMax が ちいさすぎる');
});

test('ステージを つくる がめんに くりかえしの いれものが ある', () => {
  const i = main.indexOf('STG_EDIT.waves.forEach(');
  assert.ok(i >= 0, 'でかたの ぎょうが みつからない');
  const body = main.slice(i, i + 3000);
  assert.ok(/w\.repeat = v/.test(body), 'くりかえしの びょうすうを いじれない');
  assert.ok(/w\.times = v/.test(body), 'くりかえしの かいすうを いじれない');
  /* せんとうに わたして いるか */
  const j = main.indexOf('function playOrig(');
  const pl = main.slice(j, main.indexOf(NL2 + '  }', j));
  assert.ok(/out\.repeat = w\.repeat/.test(pl), 'くりかえしを せんとうに わたして いない');
  assert.ok(/out\.times = w\.times/.test(pl), 'かいすうを せんとうに わたして いない');
});

console.log('がめんと ボタン');

test('あたらしい がめんが 5つ ある', () => {
  ['screen-orig', 'screen-bgmake', 'screen-foemake', 'screen-stgmake', 'screen-origplay']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('トップに ボタンが あって、つくる がめんに ほぞんボタンが ある', () => {
  ['btn-home-orig', 'btn-bgmake-save', 'btn-foemake-save', 'btn-stgmake-save',
   'bgmake-name', 'foemake-name', 'stgmake-name', 'foemake-power']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('★けす ときは かならず かくにんする', () => {
  ['orig-del', 'orig-del-text', 'btn-origdel-yes', 'btn-origdel-no']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
  /* 3しゅるい とも かくにんを とおして いるか（× を おして すぐ けして いない）*/
  ['buildBgSaved', 'buildFoeSaved', 'buildStgSaved'].forEach(fn => {
    const i = main.indexOf('function ' + fn + '(');
    assert.ok(i >= 0, fn + ' が みつからない');
    const body = main.slice(i, main.indexOf(NL2 + '  }', i));
    assert.ok(/askOrigDelete\(/.test(body), fn + ' が かくにんを とおして いない');
  });
});

test('オリジナルステージは ごほうびを ださない', () => {
  const i = main.indexOf('function playOrig(');
  assert.ok(i >= 0, 'playOrig が みつからない');
  const body = main.slice(i, main.indexOf('\n  }', i));
  assert.ok(/reward: \{ coins: 0, exp: 0 \}/.test(body), 'ごほうびが 0 に なって いない');
  assert.ok(/orig: true/.test(body), 'オリジナルの しるし（orig）が ない');
  assert.ok(/bgData:/.test(body), 'はいけいを わたして いない');
});

test('つくった てきは ずかんに のらない', () => {
  const i = main.indexOf('function recordSeen(');
  assert.ok(i >= 0, 'recordSeen が みつからない');
  const body = main.slice(i, main.indexOf('\n  }', i));
  assert.ok(/if \(!ENEMIES\[id\]\) continue;/.test(body),
    'ゲームに いない てきを よりわけて いない');
});

test('三番勝負は 3しゅもく ぜんぶを じゅんばんに やる', () => {
  const i = main.indexOf('const MATCH_EVENTS = [');
  assert.ok(i >= 0, 'MATCH_EVENTS が みつからない');
  const body = main.slice(i, main.indexOf('];', i));
  ['startRun', 'startTataki', 'startMemory'].forEach(k =>
    assert.ok(body.indexOf(k) >= 0, k + ' が 三番勝負に 入って いない'));
  assert.ok(html.indexOf('id="screen-match"') >= 0, 'せいせきひょうの がめんが ない');
  assert.ok(html.indexOf('id="btn-match-go"') >= 0, 'つぎへ すすむ ボタンが ない');
});

console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
