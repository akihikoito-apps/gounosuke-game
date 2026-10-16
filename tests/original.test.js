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
for (const file of ['data.js', 'draw.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', file), 'utf8'), ctx, { filename: file });
}
const run = (code) => vm.runInContext(code, ctx);
const BG_PARTS   = run('BG_PARTS');
const FOE_PARTS  = run('FOE_PARTS');
const FOE_COLORS = run('FOE_COLORS');
const FOE_MOTION = run('FOE_MOTION');
const FOE_STATS  = run('FOE_STATS');
const FOE_EXTRAS = run('FOE_EXTRAS');
const ORIG       = run('ORIG');
const BACKGROUNDS = run('BACKGROUNDS');
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

console.log('てきの そざい');

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
