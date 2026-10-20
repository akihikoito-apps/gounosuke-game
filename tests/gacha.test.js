/* ==========================================================================
   ガチャの えんしゅつ と Gコインの てにいれかた の じどう チェック

   つかいかた：  node tests/gacha.test.js
   ブラウザは つかいません。js/gacha-fx.js を にせものの canvas で うごかして
   「おちて → パカーンと あいて → キャラが でる」が さいごまで すすむか、
   そして Gコインの みちが ちゃんと コードに はいって いるかを みます。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const FX_SRC = read('js/gacha-fx.js');
const MAIN = read('js/main.js');
const HTML = read('index.html');
const DATA = read('js/data.js');

/* data.js の なかの ひとつの てい数を とりだす */
function constOf(name) {
  const ctx = vm.createContext({ Math, console, Date });
  vm.runInContext(DATA, ctx, { filename: 'data.js' });
  return vm.runInContext(name, ctx);
}
const COINS = constOf('COINS');
const GACHA = constOf('GACHA');
const RARITY = constOf('RARITY');

/* ---- えんしゅつを にせものの canvas で うごかす ---- */
const OK_SE = ['ball', 'bounce', 'roll', 'pakaan', 'fanfare', 'rare', 'tap'];

function runFx(opt) {
  opt = opt || {};
  let now = 0, frames = [];
  let depth = 0, minDepth = 0, draws = 0;
  const ctxProxy = new Proxy({}, {
    get(t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient')
        return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 20 });
      if (k === 'save') return () => { depth++; };
      if (k === 'restore') return () => { depth--; if (depth < minDepth) minDepth = depth; };
      if (typeof k === 'string') return () => { draws++; };
      return undefined;
    },
    set() { return true; },
  });
  const canvas = {
    clientWidth: (opt.w === undefined) ? 390 : opt.w,
    clientHeight: (opt.h === undefined) ? 700 : opt.h,
    width: 0, height: 0, style: {},
    getContext: () => ctxProxy, addEventListener() {}, removeEventListener() {},
  };
  const sandbox = {
    Math, Date, console, Number, String, Array, Object, isNaN, parseInt, parseFloat,
    performance: { now: () => now },
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
    devicePixelRatio: 2,
  };
  vm.createContext(sandbox);
  vm.runInContext(FX_SRC, sandbox, { filename: 'gacha-fx.js' });
  const FX = vm.runInContext('GachaFX', sandbox);
  let reveal = 0, end = 0;
  const se = [], charH = [];
  const handle = FX.play(canvas, Object.assign({
    color: '#ffd54f', color2: '#fff3c0', star: '★★★', label: 'げきレア', special: false,
    drawChar: (c, h) => { charH.push(h); c.beginPath(); },
    se: (n) => se.push(n),
    onReveal: () => reveal++,
    onEnd: () => end++,
  }, opt.opts || {}));
  for (let i = 0; i < 900 && end === 0; i++) {
    now += 16.7;
    if (opt.skipAt === i) handle.skip();
    if (opt.stopAt === i) handle.stop();
    if (opt.stopAt !== undefined && i > opt.stopAt + 3) break;
    const list = frames; frames = [];
    list.forEach(fn => fn(now));
    if (!list.length && i > 2 && !end) break;
  }
  return { reveal, end, se, charH, draws, depth, minDepth, sec: now / 1000, handle };
}


/* ---- 5れん・10れん の えんしゅつを にせものの canvas で うごかす ---- */
function runMulti(n, opt) {
  opt = opt || {};
  let now = 0, frames = [];
  let depth = 0, minDepth = 0, draws = 0;
  const ctxProxy = new Proxy({}, {
    get(t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient')
        return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 20 });
      if (k === 'save') return () => { depth++; };
      if (k === 'restore') return () => { depth--; if (depth < minDepth) minDepth = depth; };
      if (typeof k === 'string') return () => { draws++; };
      return undefined;
    },
    set() { return true; },
  });
  const canvas = {
    clientWidth: (opt.w === undefined) ? 390 : opt.w,
    clientHeight: (opt.h === undefined) ? 700 : opt.h,
    width: 0, height: 0, style: {},
    getContext: () => ctxProxy, addEventListener() {}, removeEventListener() {},
  };
  const sandbox = {
    Math, Date, console, Number, String, Array, Object, isNaN, parseInt, parseFloat,
    performance: { now: () => now },
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
    devicePixelRatio: 2,
  };
  vm.createContext(sandbox);
  vm.runInContext(FX_SRC, sandbox, { filename: 'gacha-fx.js' });
  const FX = vm.runInContext('GachaFX', sandbox);
  const charH = [];
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({
      color: '#ffd54f', color2: '#fff3c0', star: '★★', label: 'レア',
      special: (opt.special === undefined) ? (i === n - 1) : !!opt.special,
      drawChar: opt.noChar ? null : (c, h) => { charH.push(h); c.beginPath(); },
    });
  }
  const seen = [], se = [], seenAt = [];
  let end = 0;
  const handle = FX.playMulti(canvas, {
    items: items,
    se: opt.noSe ? null : ((x) => se.push(x)),
    onReveal: (i) => { seen.push(i); seenAt.push(now / 1000); },
    onEnd: () => end++,
  });
  for (let i = 0; i < 1500 && end === 0; i++) {
    now += 16.7;
    if (opt.skipAt === i) handle.skip();
    if (opt.skipEvery && i >= opt.skipEvery) handle.skip();
    if (opt.stopAt === i) handle.stop();
    if (opt.stopAt !== undefined && i > opt.stopAt + 3) break;
    const list = frames; frames = [];
    list.forEach(fn => fn(now));
    if (!list.length && i > 2 && !end) break;
  }
  return { n, seen, seenAt, end, se, charH, draws, depth, minDepth, sec: now / 1000, handle };
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('ガチャの えんしゅつ');

test('ガチャポンが おちて、パカーンと あいて、キャラが でて、おわる', () => {
  const r = runFx({});
  assert.strictEqual(r.reveal, 1, 'キャラの とうじょうが ' + r.reveal + 'かい');
  assert.strictEqual(r.end, 1, 'おわりの しらせが ' + r.end + 'かい');
  assert.ok(r.sec > 1.2 && r.sec < 6, 'ながさが へん（' + r.sec.toFixed(2) + 'びょう）');
  assert.ok(r.draws > 200, 'えを かいて いない（' + r.draws + '）');
  assert.ok(r.charH.length > 5, 'キャラを かいて いない');
});

test('つかう おとは ぜんぶ ほんとうに ある なまえ', () => {
  const r = runFx({ opts: { special: true } });
  const bad = [...new Set(r.se)].filter(n => OK_SE.indexOf(n) < 0);
  assert.strictEqual(bad.length, 0, 'ない おと: ' + bad);
  /* js/sound.js に その なまえが あるか */
  const snd = read('js/sound.js');
  [...new Set(r.se)].forEach(n =>
    assert.ok(new RegExp('^    ' + n + ':', 'm').test(snd), 'sound.js に ' + n + ' が ない'));
});

test('おちる・パカーン・パッパラーン の おとが じゅんに なる', () => {
  const r = runFx({});
  const i1 = r.se.indexOf('ball'), i2 = r.se.indexOf('pakaan'), i3 = r.se.indexOf('fanfare');
  assert.ok(i1 >= 0 && i2 > i1 && i3 >= i2, 'じゅんばんが へん: ' + r.se);
});

test('レア度が たかい ときは「ため」が ながく、ドラムロールと キラキラが なる', () => {
  const a = runFx({});
  const b = runFx({ opts: { special: true, star: '★★★★★', label: 'でんせつレア' } });
  assert.ok(b.sec > a.sec + 0.5, 'ふつうと おなじ ながさ（' + a.sec.toFixed(2) + ' / ' + b.sec.toFixed(2) + '）');
  assert.ok(b.se.indexOf('roll') >= 0, 'ドラムロールが ない');
  assert.ok(b.se.indexOf('rare') >= 0, 'キラキラが ない');
  assert.ok(a.se.indexOf('roll') < 0, 'ふつうの ときに ドラムロールが なって いる');
});

test('タップで とばすと はやく おわるが、キャラは ちゃんと でる', () => {
  const full = runFx({ opts: { special: true } });
  const sk = runFx({ opts: { special: true }, skipAt: 20 });
  assert.strictEqual(sk.reveal, 1, 'キャラが でない');
  assert.strictEqual(sk.end, 1, 'おわらない');
  assert.ok(sk.sec < full.sec, 'みじかく なって いない');
});

test('とめたら おわりの しらせを ださない', () => {
  const r = runFx({ stopAt: 10 });
  assert.strictEqual(r.end, 0);
});

test('save と restore の かずが あって いる', () => {
  [false, true].forEach(sp => {
    const r = runFx({ opts: { special: sp } });
    assert.strictEqual(r.depth, 0, 'のこって いる（special=' + sp + '）');
    assert.strictEqual(r.minDepth, 0, 'おおく もどして いる（special=' + sp + '）');
  });
});

test('キャラの えや おと が なくても、がめんが 0でも、よこながでも おちない', () => {
  assert.doesNotThrow(() => {
    const a = runFx({ opts: { drawChar: null, se: null, onReveal: null } });
    assert.strictEqual(a.end, 1);
    runFx({ w: 0, h: 0 });
    const c = runFx({ w: 1200, h: 400, opts: { special: true } });
    assert.strictEqual(c.end, 1);
    assert.ok(c.charH[0] < 400, 'キャラが がめんから はみでる');
  });
});

test('skip と stop は なんかい よんでも へいき', () => {
  const r = runFx({});
  assert.doesNotThrow(() => { r.handle.skip(); r.handle.skip(); r.handle.stop(); r.handle.stop(); });
});

console.log('ガチャの がめんに つないで いるか');

test('ひいたら えんしゅつ → でた あとで けっかを みせる じゅんばん', () => {
  const i = MAIN.indexOf('function pullGacha');
  assert.ok(i > 0, 'pullGacha が ない');
  const body = MAIN.slice(i, i + 3200);
  assert.ok(/gachaFxPlay\(g\.rank, g\.id/.test(body), 'えんしゅつを よんで いない');
  assert.ok(body.indexOf('ドキドキ') < body.indexOf('gachaFxPlay'), 'ひいた すぐ あとに けっかが でて しまう');
  assert.ok(/if \(gachaFxHandle\) return;/.test(body), 'えんしゅつちゅうに また ひけて しまう');
  assert.ok(/\$\('#gacha-result'\)\.innerHTML = g\.html;/.test(body), 'けっかを だす ところが ない');
});

test('レア度に あわせて いろと「ため」が かわる', () => {
  const i = MAIN.indexOf('function gachaFxPlay');
  assert.ok(i > 0, 'gachaFxPlay が ない');
  const body = MAIN.slice(i, i + 1600);
  assert.ok(/\['GR', 'SR', 'LR'\]/.test(body), 'めずらしい レア度の はんていが ない');
  assert.ok(/color: info\.color/.test(body) && /lightOf\(info\.color\)/.test(body), 'いろを わたして いない');
  assert.ok(/star: info\.star/.test(body) && /label: info\.label/.test(body), '星や なまえを わたして いない');
  RARITY && Object.keys(RARITY).forEach(k =>
    assert.ok(/^#[0-9a-f]{6}$/i.test(RARITY[k].color), k + ' の いろが へん'));
});

test('がめんを かえると えんしゅつが とまる／タップで とばせる', () => {
  assert.ok(/if \(id !== 'screen-gacha'\) gachaFxStop\(\);/.test(MAIN), 'show() で とめて いない');
  assert.ok(/#gacha-fx'\)\.addEventListener\('click'[\s\S]{0,120}skip\(\)/.test(MAIN), 'タップで とばせない');
});

test('えんしゅつの いれものと よみこみが index.html に ある', () => {
  assert.ok(/id="gacha-fx"/.test(HTML), 'まくが ない');
  assert.ok(/id="gacha-fx-canvas"/.test(HTML), 'キャンバスが ない');
  assert.ok(/<script src="js\/gacha-fx\.js"><\/script>/.test(HTML), 'よみこんで いない');
  assert.ok(HTML.indexOf('js/gacha-fx.js') < HTML.indexOf('js/main.js'), 'main.js より あとに よみこんで いる');
});

console.log('5れん・10れん の えんしゅつ');

test('5こ・10この ボールが ならんで おちて、ぜんぶ じゅんばんに ひらく', () => {
  [5, 10].forEach(n => {
    const r = runMulti(n);
    assert.deepStrictEqual(r.seen, r.items || [...Array(n).keys()],
      n + 'こ のうち でたのは ' + r.seen.length + 'こ（' + r.seen + '）');
    assert.strictEqual(r.end, 1, n + 'れんが おわらない');
    assert.ok(r.draws > 500, n + 'れんで えを かいて いない');
  });
});

test('1こ・2こ でも ならべられる', () => {
  [1, 2].forEach(n => {
    const r = runMulti(n);
    assert.strictEqual(r.seen.length, n);
    assert.strictEqual(r.end, 1);
  });
});

test('かずが おおい ほど ながく、1かいぶんより ながい', () => {
  const a = runMulti(1), b = runMulti(5), c = runMulti(10);
  assert.ok(b.sec > a.sec, '5れんが 1こより みじかい');
  assert.ok(c.sec > b.sec + 0.8, '10れんが 5れんと ほとんど おなじ（' +
    b.sec.toFixed(2) + ' / ' + c.sec.toFixed(2) + '）');
  assert.ok(c.sec < 12, '10れんが ながすぎる（' + c.sec.toFixed(2) + 'びょう）');
});

test('おとは ぜんぶ ある なまえで、パカーンは ひらいた かず だけ なる', () => {
  const r = runMulti(10);
  const bad = [...new Set(r.se)].filter(x => OK_SE.indexOf(x) < 0);
  assert.strictEqual(bad.length, 0, 'ない おと: ' + bad);
  const paka = r.se.filter(x => x === 'pakaan').length;
  assert.strictEqual(paka, 10, 'パカーンが ' + paka + 'かい（10かい の はず）');
  assert.strictEqual(r.se.filter(x => x === 'fanfare').length, 1, 'パッパラーンは 1かい だけ');
});

test('めずらしい ものが まざって いると ドラムロールと キラキラが なる', () => {
  const r = runMulti(10);
  assert.ok(r.se.indexOf('roll') >= 0, 'ドラムロールが ない');
  assert.ok(r.se.indexOf('rare') >= 0, 'キラキラが ない');
  const none = runMulti(10, { special: false });
  assert.ok(none.se.indexOf('roll') < 0, 'めずらしい ものが ないのに ドラムロール');
  assert.ok(r.sec > none.sec, 'めずらしい ものの「ため」が ない');
});

test('★タップすると、つぎの 1たいが すぐ でる', () => {
  [5, 10].forEach(n => {
    const sk = runMulti(n, { skipAt: 6 });        // おちて いる とちゅうで タップ
    const at = sk.seenAt[0];
    assert.ok(at < 0.45, n + 'れん：タップしても 1たいめが ' + at.toFixed(2) + 'びょう かかる');
    assert.strictEqual(sk.seen.length, n, 'さいごまで でない');
    assert.strictEqual(sk.end, 1, 'おわらない');
  });
});

test('★タップを つづけると どんどん すすんで、はやく おわる', () => {
  [5, 10].forEach(n => {
    const full = runMulti(n);
    const sk = runMulti(n, { skipEvery: 6 });
    assert.strictEqual(sk.seen.length, n, 'とばしたら ' + sk.seen.length + 'こ しか でない');
    assert.deepStrictEqual(sk.seen, full.seen, 'じゅんばんが かわって いる');
    assert.strictEqual(sk.end, 1, 'おわらない');
    assert.ok(sk.sec < full.sec * 0.6, 'みじかく なって いない（' +
      sk.sec.toFixed(2) + ' / ' + full.sec.toFixed(2) + '）');
  });
});

test('★5れん・10れんの テンポ（まちすぎない）', () => {
  const b = runMulti(5), c = runMulti(10);
  assert.ok(b.sec < 3.6, '5れんが ' + b.sec.toFixed(2) + 'びょう（ながい）');
  assert.ok(c.sec < 6.0, '10れんが ' + c.sec.toFixed(2) + 'びょう（ながい）');
  const gaps = c.seenAt.slice(1).map((v, i) => v - c.seenAt[i]);
  assert.ok(Math.max.apply(null, gaps) < 0.75,
    'あいだが あきすぎ（さいだい ' + Math.max.apply(null, gaps).toFixed(2) + 'びょう）');
});

test('とめたら おわりの しらせを ださない（まとめて の ほう）', () => {
  assert.strictEqual(runMulti(10, { stopAt: 20 }).end, 0);
});

test('save と restore の かずが あって いる（まとめて の ほう）', () => {
  [5, 10].forEach(n => {
    const r = runMulti(n);
    assert.strictEqual(r.depth, 0, n + 'れんで のこって いる');
    assert.strictEqual(r.minDepth, 0, n + 'れんで おおく もどして いる');
  });
});

test('10こでも キャラが つぶれず がめんに おさまる', () => {
  const r = runMulti(10);
  const h = r.charH[0];
  assert.ok(h > 24, 'ちいさすぎる（' + Math.round(h) + 'px）');
  assert.ok(h < 700 / 3, 'おおきすぎて かさなる（' + Math.round(h) + 'px）');
  const one = runMulti(1);
  assert.ok(one.charH[0] > h, '1こ の ときも おなじ おおきさ');
});

test('キャラの えや おとが なくても、がめんが 0でも、よこながでも おちない（まとめて）', () => {
  assert.doesNotThrow(() => {
    assert.strictEqual(runMulti(10, { noChar: true, noSe: true }).end, 1);
    runMulti(10, { w: 0, h: 0 });
    assert.strictEqual(runMulti(10, { w: 1200, h: 400 }).end, 1);
  });
});

test('skip と stop は なんかい よんでも へいき（まとめて）', () => {
  const r = runMulti(5);
  assert.doesNotThrow(() => { r.handle.skip(); r.handle.skip(); r.handle.stop(); r.handle.stop(); });
});

console.log('1かい・5れん・10れん の ボタン');

test('ボタンが 3つ あって、ねだんが かずの ぶん だけ かかる', () => {
  ['btn-gacha-pull', 'btn-gacha-pull5', 'btn-gacha-pull10'].forEach(id =>
    assert.ok(HTML.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
  assert.ok(/const PULL_SETS = \[[\s\S]{0,400}n: 10/.test(MAIN), 'セットの ひょうが ない');
  assert.ok(/const cost = GACHA\.cost \* n;/.test(MAIN), 'ねだんが かずの ぶん に なって いない');
  assert.ok(/s\.coins -= cost;/.test(MAIN), 'まとめた ぶんを はらって いない');
  assert.ok(/GACHA\.cost \* set\.n/.test(MAIN), 'ボタンに ねだんを かいて いない');
  [[1, ''], [5, '5'], [10, '10']].forEach(([n, suf]) =>
    assert.ok(new RegExp("#btn-gacha-pull" + suf + "'\\)\\.addEventListener\\('click', \\(\\) => pullGacha\\(" + n + "\\)\\)").test(MAIN),
      n + 'かいの ボタンが つながって いない'));
});

test('ひいた かずだけ ちゅうせんして、よい ものを さいごに ならべる', () => {
  const i = MAIN.indexOf('function pullGacha');
  const body = MAIN.slice(i, i + 2600);
  assert.ok(/for \(let i = 0; i < n; i\+\+\) got\.push\(rollGachaOnce\(s\)\);/.test(body),
    'かずの ぶん ちゅうせんして いない');
  assert.ok(/RARITY_ORDER\.indexOf\(a\.rank\) - RARITY_ORDER\.indexOf\(b\.rank\)/.test(body),
    'レア度で ならべかえて いない');
  assert.ok(/if \(n === 1\)/.test(body), '1かいと まとめての わけが ない');
  assert.ok(/gachaFxMulti\(order/.test(body), 'まとめての えんしゅつを よんで いない');
});

test('けっかの いちらんが つくられる', () => {
  const i = MAIN.indexOf('function showGachaMany');
  assert.ok(i > 0, 'いちらんが ない');
  const body = MAIN.slice(i, i + 1800);
  assert.ok(/list\.forEach/.test(body), 'ひとつずつ ならべて いない');
  assert.ok(/kind === 'new'/.test(body) && /kind === 'plus'/.test(body), 'まとめの かぞえが ない');
  assert.ok(/paintChar\(c, c\.dataset/.test(body), 'キャラの えを かいて いない');
  assert.ok(/panel\.classList\.remove\('hidden'\)/.test(body), 'いちらんを ひらいて いない');
  ['gacha-many', 'gacha-many-list', 'gacha-many-title', 'btn-gacha-many-close'].forEach(id =>
    assert.ok(HTML.indexOf('id="' + id + '"') >= 0, id + ' が index.html に ない'));
  assert.ok(/#btn-gacha-many-close'\)\.addEventListener/.test(MAIN), 'とじる ボタンが つながって いない');
  assert.ok(/const many = \$\('#gacha-many'\)[\s\S]{0,120}add\('hidden'\)/.test(MAIN),
    'がめんを かえる ときに いちらんを とじて いない');
});

test('ちゅうせんは 1かいぶんの かんすうに なって いる（1かいでも 10れんでも おなじ）', () => {
  const i = MAIN.indexOf('function rollGachaOnce');
  assert.ok(i > 0, 'rollGachaOnce が ない');
  const body = MAIN.slice(i, MAIN.indexOf('function pullGacha'));
  ['new', 'plus', 'exp', 'empty'].forEach(k =>
    assert.ok(body.indexOf("'" + k + "'") >= 0, k + ' の ばあいが ない'));
  assert.ok(/s\.owned\.push\(id\)/.test(body), 'なかまに ならない');
  assert.ok(/s\.plus\[id\] = \(s\.plus\[id\] \|\| 0\) \+ 1;/.test(body), 'じょうげんかいほうが ない');
  assert.ok(!/storeSave\(\)/.test(body), 'ちゅうせんの なかで ほぞんして いる（10れんで 10かい ほぞんに なる）');
});

console.log('Gコインの てにいれかた');

test('すうじの せっていが そろって いる', () => {
  assert.ok(COINS, 'COINS が ない');
  assert.ok(COINS.exp > 0, 'こうかんの ねだんが ない');
  assert.ok(COINS.backRate > 0 && COINS.backRate <= 1, 'かくりつが へん: ' + COINS.backRate);
  assert.ok(COINS.back >= 1 && COINS.daily >= 1 && COINS.mini >= 1, 'もらえる かずが へん');
  assert.ok(COINS.maxBuy >= GACHA.cost, 'いちどに ガチャ 1かいぶん も こうかん できない');
  /* ガチャ 1かいぶんの ねだんが、うしろの ステージ 1しゅう ぐらいに なって いるか */
  const pull = COINS.exp * GACHA.cost;
  assert.ok(pull >= 1500 && pull <= 12000, 'ガチャ 1かいぶんが ' + pull + 'けいけんち（やすすぎ／たかすぎ）');
});

test('ネコスの店で けいけんち → Gコイン の こうかんが できる', () => {
  assert.ok(/function buyCoins/.test(MAIN), 'こうかんの しくみが ない');
  const i = MAIN.indexOf('function buyCoins');
  const body = MAIN.slice(i, i + 1200);
  assert.ok(/s\.exp -= k \* C\.exp;/.test(body), 'けいけんちを へらして いない');
  assert.ok(/addCoins\(k\)/.test(body), 'コインを ふやして いない');
  assert.ok(/coinBuyMax\(s\)/.test(body), 'もって いる ぶん いじょう こうかん できて しまう');
  assert.ok(/storeSave\(\)/.test(body), 'ほぞんして いない');
  ['btn-sc-1', 'btn-sc-3', 'btn-sc-max', 'sc-exp', 'sc-coin', 'sc-note'].forEach(id =>
    assert.ok(HTML.indexOf('id="' + id + '"') >= 0, id + ' が index.html に ない'));
  assert.ok(/#btn-sc-3'\)\.addEventListener\('click', \(\) => buyCoins\(GACHA\.cost\)\)/.test(MAIN),
    '3まいの ボタンが ガチャ 1かいぶんに なって いない');
});

test('ネコスの店で 1日に 1まい もらえる', () => {
  const i = MAIN.indexOf('function nekosTalk');
  assert.ok(i > 0, 'nekosTalk が ない');
  const body = MAIN.slice(i, i + 1600);
  assert.ok(/COINCFG\(\)\.daily/.test(body), 'きょうの コインが ない');
  assert.ok(/addCoins\(coin\)/.test(body), 'コインを ふやして いない');
  assert.ok(body.indexOf('n.at = Date.now()') >= 0, '1日 1かいの きろくが ない');
});

test('クリアずみを もういちど クリアすると ときどき もらえる', () => {
  const i = MAIN.indexOf('let backCoin = 0');
  assert.ok(i > 0, 'さいクリアの コインが ない');
  const body = MAIN.slice(i, i + 900);
  assert.ok(/if \(first\) s\.coins/.test(body), 'しょかいの ぶんを こわして いる');
  assert.ok(/else if \(Math\.random\(\) < \(COINCFG\(\)\.backRate/.test(body), 'かくりつの はんていが ない');
  assert.ok(/addCoins\(backCoin\)/.test(body), 'コインを ふやして いない');
  assert.ok(/backCoin \? '　／　★Gコイン \+'/.test(body), 'もらった ことが がめんに でない');
});

test('ひとりようの ミニゲームの ごほうびにも つく', () => {
  const i = MAIN.indexOf('function miniGiveMats');
  assert.ok(i > 0, 'miniGiveMats が ない');
  const body = MAIN.slice(i, i + 800);
  assert.ok(/COINCFG\(\)\.mini/.test(body) && /addCoins\(coin\)/.test(body), 'コインが つかない');
  assert.ok(/count\.gcoin = coin/.test(body), 'なにを もらったか つたえて いない');
  const j = MAIN.indexOf('function miniShowGot');
  assert.ok(/count\.gcoin/.test(MAIN.slice(j, j + 600)), 'Gコインを ひょうじ しない');
});

test('ガチャの がめんから ネコスの店へ いけて、ちゃんと もどって これる', () => {
  assert.ok(HTML.indexOf('id="btn-gacha-shop"') >= 0, 'あんないの ボタンが ない');
  assert.ok(/#btn-gacha-shop'\)\.addEventListener\('click', openShopFromGacha\)/.test(MAIN), 'つないで いない');
  assert.ok(/function openShopFromGacha\(\) \{ openShop\('screen-gacha'\); \}/.test(MAIN), 'どこから きたか おぼえて いない');
  assert.ok(/if \(shopFrom === 'screen-gacha'\) \{ openGacha\(\); return; \}/.test(MAIN), 'もどる さきが かわらない');
});

console.log('\n' + passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
