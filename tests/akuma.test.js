/* ==========================================================================
   特設・あくまの とりで の じどう チェック

   つかいかた：  node tests/akuma.test.js
   ブラウザは つかいません。data.js / draw.js / game.js を そのまま よみこんで、
   たたかいを じっさいに すすめて たしかめます。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const MAIN = read('js/main.js');

/* ---- にせものの canvas（かいた かずを かぞえる だけ）---- */
let drawCalls = 0;
const mkctx = () => new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient')
      return () => ({ addColorStop() {} });
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getImageData') return (x, y, cw, ch) =>
      ({ data: new Uint8ClampedArray(Math.max(4, cw * ch * 4)).fill(180), width: cw, height: ch });
    if (k === 'canvas') return { width: 800, height: 400 };
    if (typeof k === 'string') return () => { drawCalls++; };
    return undefined;
  },
  set() { return true; },
});

const SRC = ['js/data.js', 'js/draw.js', 'js/game.js'].map(read).join('\n');
function load() {
  const sandbox = {
    Math, Date, console, JSON, Number, String, Array, Object, isNaN,
    parseInt, parseFloat, Float32Array, Uint8ClampedArray, Set, Map,
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    window: { devicePixelRatio: 2 },
    document: undefined,
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC +
    ';globalThis.Game=Game;globalThis.FORT=AKUMA_FORT;globalThis.ENEMIES=ENEMIES;' +
    'globalThis.DRAWERS=DRAWERS;globalThis.UNITS=UNITS;globalThis.RARITY_ORDER=RARITY_ORDER;', sandbox);
  return sandbox;
}
const c0 = load();
const FORT = c0.FORT;
const ENEMIES = c0.ENEMIES;
const courseOf = (no) => FORT.courses.find(c => c.no === no);

/* たたかいを すすめる。sec びょうぶん。cb(G, t) を まいかい よぶ */
function sim(course, sec, cb) {
  const c = load(), G = c.Game;
  G.levels = {}; G.evolved = {};
  G.start(course);
  G.canvas = { width: 800, height: 400, clientWidth: 800, clientHeight: 400 };
  G.ctx = mkctx();
  let t = 0;
  const dt = 1 / 30;
  while (t < sec && !G.finished) {
    G.update(dt);
    if (G.draw) G.draw();
    t += dt;
    if (cb) cb(G, t);
  }
  return { G, t };
}
const liveIds = (G) => G.units.filter(u => u.side === 'enemy' && !u.dead).map(u => u.def.id);

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('とくせつステージの かたち');

test('5ステージ あって、ばんごうも なまえも そろって いる', () => {
  assert.ok(FORT, 'AKUMA_FORT が ない');
  assert.strictEqual(FORT.floors, 5, 'ステージが ' + FORT.floors + 'つ');
  assert.strictEqual(FORT.courses.length, 5, 'コースが ' + FORT.courses.length + 'つ');
  FORT.courses.forEach((c, i) => {
    assert.strictEqual(c.no, 701 + i, (i + 1) + 'つめの ばんごうが ' + c.no);
    assert.strictEqual(c.floor, i + 1);
    assert.ok(c.name && c.desc, (i + 1) + 'つめに なまえか せつめいが ない');
    assert.ok(c.waves && c.waves.length >= 4, (i + 1) + 'つめの てきの でかたが すくない');
  });
  /* ほかの ステージと ばんごうが ぶつかって いない */
  const all = {};
  [c0.FORT].concat([]).forEach(() => {});
  const src = read('js/data.js');
  FORT.courses.forEach(c => {
    const n = (src.match(new RegExp('no: ' + c.no + '\\b', 'g')) || []).length;
    assert.strictEqual(n, 1, 'ばんごう ' + c.no + ' が ' + n + 'かい つかわれて いる');
  });
});

test('★5ステージ ぜんぶ「レア いか」の なかま しか つれて いけない', () => {
  FORT.courses.forEach(c => {
    assert.ok(Array.isArray(c.allowRarity), c.no + ' に せいげんが ない');
    assert.strictEqual(c.allowRarity.join(','), 'N,R',
      c.no + ' の せいげんが ' + c.allowRarity);
  });
  /* ほんとうに レア いか なら、つかえる なかまが ちゃんと いる */
  const ok = Object.keys(c0.UNITS).filter(id =>
    ['N', 'R'].indexOf(c0.UNITS[id].rarity) >= 0);
  assert.ok(ok.length >= 8, 'つかえる なかまが ' + ok.length + 'たい しか いない');
});

test('むずかしさが だんだん あがる', () => {
  let p = 0, hp = 0;
  FORT.courses.forEach(c => {
    assert.ok(c.power >= p, c.no + ' の つよさが まえより ひくい');
    assert.ok(c.castleHp >= hp, c.no + ' の しろが まえより よわい');
    p = c.power; hp = c.castleHp;
  });
  assert.ok(FORT.courses[4].power >= 1.8, 'さいしゅうが ぬるい');
});

test('★クリアの ごほうびが そうびのもと 5こ と Gコイン 50まい', () => {
  const last = courseOf(705);
  assert.strictEqual(last.gearCore, 5, 'そうびのもとが ' + last.gearCore);
  assert.strictEqual(last.reward.coins, 50, 'Gコインが ' + last.reward.coins);
  assert.ok(last.reward.exp > 0, 'けいけんちが ない');
  /* main.js が その 2つを ちゃんと わたして いるか */
  assert.ok(/Game\.stage\.gearCore/.test(MAIN) && /addCore\(Game\.stage\.gearCore\)/.test(MAIN),
    'そうびのもとを わたす ところが ない');
  assert.ok(/if \(first\) s\.coins = \(s\.coins \|\| 0\) \+ r\.coins;/.test(MAIN),
    'Gコインを わたす ところが ない');
});

test('とくせつの いちらんに くわわって いる（たつまき ちず）', () => {
  assert.strictEqual(FORT.world, 'storm', 'ちずが ' + FORT.world);
  assert.ok(/AKUMA_FORT !== 'undefined' && AKUMA_FORT\) list\.push\(AKUMA_FORT\)/.test(MAIN),
    'main.js の とくせつ いちらんに ない');
  /* たつまき ちず の とくせつは ボタンが 3つ まで */
  const storm = ['FUSHIGI_PARK', 'UNDERGROUND', 'AKUMA_FORT'];
  assert.ok(storm.length <= 3, 'ボタンが たりない');
  assert.ok(FORT.rewardName.indexOf('そうびのもと') >= 0 &&
            FORT.rewardName.indexOf('Gコイン') >= 0, 'ごほうびの あんないが ちがう');
});

console.log('あたらしい てき 6たい');

test('6たい ぜんぶ データが ある', () => {
  ['koakuma', 'komorin', 'tatemori', 'yarioni', 'gargon', 'akuma'].forEach(id => {
    const e = ENEMIES[id];
    assert.ok(e, id + ' が ENEMIES に ない');
    assert.ok(e.name, id + ' に なまえが ない');
    assert.ok(e.hp > 0 && e.atk > 0 && e.range > 0, id + ' の すうじが へん');
    assert.ok(e.money > 0, id + ' から おかねが でない');
    const attrs = [].concat(e.attr);
    attrs.forEach(a => assert.ok(
      ['none', 'grass', 'metal', 'ghost', 'beast', 'fire', 'water', 'magic', 'god', 'power'].indexOf(a) >= 0,
      id + ' の ぞくせい「' + a + '」は ない'));
  });
});

test('6たい ぜんぶ えが かける（うごきを かえても エラーに ならない）', () => {
  const ctx = mkctx();
  ['koakuma', 'komorin', 'tatemori', 'yarioni', 'gargon', 'akuma'].forEach(id => {
    const fn = c0.DRAWERS[id];
    assert.ok(fn, id + ' の えが ない');
    [[0.5, true, -1], [1.2, false, 0.3], [2.0, false, 0.85], [3.3, true, 0.5]].forEach(([t, mv, atk]) => {
      const before = drawCalls;
      assert.doesNotThrow(() => fn(ctx, { t, moving: mv, atk, hpRatio: 0.6, roll: 0.3 }), id);
      assert.ok(drawCalls - before > 15, id + ' の えが すくなすぎる');
    });
  });
});

test('★ボスの あくまは とおくから うつ、ふきとばない、おこる', () => {
  const b = ENEMIES.akuma;
  assert.strictEqual(b.isBoss, true, 'ボスに なって いない');
  assert.ok(b.range >= 300, 'とおくから うてない（range=' + b.range + '）');
  assert.ok(b.projectile, 'とんで いく ものが ない');
  assert.ok(b.kbImmune, 'ふきとんで しまう');
  assert.ok(b.enrage && b.enrage.below > 0, 'おこらない');
  assert.ok(b.hp >= 30000, 'ボスが やわらかすぎる（hp=' + b.hp + '）');
  /* ★まわりの ざこが まもる */
  assert.ok(b.escort && Array.isArray(b.escort.id) && b.escort.id.length >= 2,
    'まもりの てきが いない');
  b.escort.id.forEach(id => assert.ok(ENEMIES[id], 'まもりの ' + id + ' が いない'));
  assert.ok(b.escort.interval > 0 && b.escort.count >= 1, 'まもりの よびかたが へん');
  /* ざこより ずっと つよい */
  ['koakuma', 'komorin', 'tatemori', 'yarioni'].forEach(id =>
    assert.ok(b.hp > ENEMIES[id].hp * 4, id + ' と くらべて ボスが よわい'));
});

console.log('さいしゅうステージの うごき（じっさいに たたかう）');

test('★あくまは 10びょうごに でて くる（それまでは でない）', () => {
  const last = courseOf(705);
  const w = last.waves.find(x => x.id === 'akuma');
  assert.ok(w, 'あくまの でばんが ない');
  assert.strictEqual(w.at, 10, 'でて くるのが ' + w.at + 'びょう');

  let firstAt = -1;
  sim(last, 16, (G, t) => {
    if (firstAt < 0 && liveIds(G).indexOf('akuma') >= 0) firstAt = t;
  });
  assert.ok(firstAt > 0, 'あくまが でて こない');
  assert.ok(firstAt >= 9.9 && firstAt <= 10.6,
    'でて きたのが ' + firstAt.toFixed(2) + 'びょう（10びょうの はず）');
});

test('★あくまが でる まえに しろを こわせない（60%で とまる）', () => {
  const last = courseOf(705);
  const c = load(), G = c.Game;
  G.levels = {}; G.evolved = {};
  G.start(last);
  G.canvas = { width: 800, height: 400, clientWidth: 800, clientHeight: 400 };
  G.ctx = mkctx();
  const max = G.enemyCastle.maxHp;
  let t = 0, low = max;
  while (t < 9) {
    G.enemyCastle.hp = 1;           // むりやり けずって みる
    G.update(1 / 30);
    low = Math.min(low, G.enemyCastle.hp);
    t += 1 / 30;
  }
  assert.ok(low >= max * 0.6 - 1,
    'ボスの まえに ' + Math.round(low / max * 100) + '%まで けずれて しまう');
  assert.strictEqual(G.finished, false, 'ボスの まえに おわって しまう');
  /* でて きた あとは けずれる */
  while (t < 11) { G.update(1 / 30); t += 1 / 30; }
  G.enemyCastle.hp = 1;
  G.update(1 / 30);
  assert.ok(G.enemyCastle.hp <= 1 || G.finished, 'ボストが でた あとも けずれない');
});

test('★あくまは まわりの てきに じぶんを まもらせる', () => {
  const last = courseOf(705);
  let guards = 0;
  const seen = {};
  sim(last, 30, (G) => {
    liveIds(G).forEach(id => { seen[id] = (seen[id] || 0) + 1; });
  });
  ENEMIES.akuma.escort.id.forEach(id => {
    if (seen[id]) guards++;
  });
  assert.ok(guards >= 2, 'まもりの てきが ' + guards + 'しゅるい しか でて いない');
  assert.ok(seen.akuma, 'あくまが でて いない');
});

test('5ステージ ぜんぶ、さいごまで うごかしても エラーに ならない', () => {
  FORT.courses.forEach(c => {
    assert.doesNotThrow(() => sim(c, 60), c.no + ' が とちゅうで とまる');
  });
});

test('むずかしさ：なかまを だす だけでは すぐに クリアできない', () => {
  /* レア いかの なかまを レベル20で だしつづけても、
     さいしゅうステージが 60びょう いないに おわらない こと      */
  const last = courseOf(705);
  const c = load(), G = c.Game;
  const party = Object.keys(c.UNITS)
    .filter(id => ['N', 'R'].indexOf(c.UNITS[id].rarity) >= 0).slice(0, 10);
  G.levels = {}; G.evolved = {};
  party.forEach(id => { G.levels[id] = 20; });
  G.start(last);
  G.canvas = { width: 800, height: 400, clientWidth: 800, clientHeight: 400 };
  G.ctx = mkctx();
  let t = 0;
  while (t < 60 && !G.finished) {
    party.forEach(id => G.summon(id));     // おかねが あれば でる
    G.update(1 / 30);
    t += 1 / 30;
  }
  assert.ok(!(G.finished && G.result === 'win'),
    '60びょうで クリアできて しまう（かんたんすぎ）');
});

console.log('\n' + passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
