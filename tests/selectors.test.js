/* ==========================================================================
   「1つだけ とって くる $」に forEach を つかって いない か しらべる

   つかいかた：  node tests/selectors.test.js

   ★なぜ この チェックが あるか★
     js/main.js には どうぐが 2つ あります。
       $(…)  … あてはまる ものを ★1つだけ★ とって くる
       $$(…) … あてはまる ものを ★ぜんぶ★ とって くる（くりかえせる）
     v6.53 で、パッチを あてる スクリプトの つくりかたの せいで
     show() の $$('.screen') が $('.screen') に かわって しまい、
     ★がめんの きりかえが まるごと とまる★ という ことが おきました
     （タイトルで「はじめる」を おしても なにも おきない）。
     おなじ ことが また おきない ように、ここで みはって います。

   あわせて、ひとつも つかわれて いない id を さがす のでは なく、
   「main.js が さがす id が index.html に ちゃんと ある か」も みます。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css  = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('$ と $$ の つかいわけ');

test('$ と $$ の どちらも ちゃんと きまって いる', () => {
  assert.ok(/const \$\s+= \(sel\) => document\.querySelector\(sel\);/.test(main),
            '$ の きまりが みつからない');
  assert.ok(/const \$\$ = \(sel\) => Array\.from\(document\.querySelectorAll\(sel\)\);/.test(main),
            '$$ の きまりが みつからない');
});

test('1つだけ とって くる $ に くりかえしを つないで いない', () => {
  /* $( … ) の あとに .forEach / .map / .filter などが きて いないか。
     $$( … ) は ただしい つかいかた なので、まえに $ が ない ものだけ みます。 */
  const bad = [];
  const re = /(^|[^$\w])\$\(([^()]*)\)\s*\.\s*(forEach|map|filter|some|every|reduce|slice|indexOf|sort|find)\b/g;
  let m;
  while ((m = re.exec(main))) {
    const line = main.slice(0, m.index).split('\n').length;
    /* ★「1つの ようそ」でも つかえる もの（.indexOf などの もじれつ しょり）は
         ここでは みのがせない ので、ようそ の くりかえし だけに しぼります。 */
    if (['forEach', 'map', 'filter', 'some', 'every', 'reduce'].indexOf(m[3]) >= 0) {
      bad.push(line + 'ぎょうめ: $(' + m[2] + ').' + m[3]);
    }
  }
  assert.strictEqual(bad.length, 0,
    '$ は 1つしか とって こない ので くりかえせません（$$ に して ください）:\n      ' + bad.join('\n      '));
});

test('がめんの きりかえ show() は $$ を つかって いる', () => {
  const m = main.match(/function show\(id\) \{[\s\S]{0,700}?\n  \}/);
  assert.ok(m, 'show() が みつからない');
  assert.ok(m[0].indexOf("$$('.screen')") >= 0,
            "show() が $$('.screen') を つかって いない（がめんが きりかわらなく なります）");
});

console.log('がめんが うえに ずれない か（iOS の スクロール）');

test('がめんを かえる ときに キーボードを とじて ずれを なおす', () => {
  /* iPad は なまえの いれものを タップすると ページごと スクロールし、
     とじても もどらない ことが あります（v6.62 で なおしました）。*/
  const i = main.indexOf('function show(id)');
  assert.ok(i >= 0, 'show が みつからない');
  const body = main.slice(i, i + 400);
  assert.ok(/blurInput\(\)/.test(body), 'show が キーボードを とじて いない');
  assert.ok(/resetScroll\(\)/.test(body), 'show が ずれを なおして いない');
});

test('スクロールの みはりが ついて いる', () => {
  assert.ok(/addEventListener\('scroll', resetScroll/.test(main),
    'スクロールの みはりが ない');
  assert.ok(/addEventListener\('focusout'/.test(main),
    'キーボードを とじた ときの しょりが ない');
});

test('キーボードが でて いる あいだは はかりなおさない', () => {
  const i = main.indexOf('function relayout()');
  assert.ok(i >= 0, 'relayout が みつからない');
  const body = main.slice(i, i + 400);
  assert.ok(/if \(typingNow\(\)\) return;/.test(body),
    'キーボードちゅうでも はかりなおして しまう');
});

test('せんとうの はじめに したの パネルを はかりなおす', () => {
  const i = main.indexOf('function startBattle(course)');
  assert.ok(i >= 0, 'startBattle が みつからない');
  const body = main.slice(i, i + 900);
  assert.ok(/applyUnitLayout\(\)/.test(body),
    'せんとうの はじめに したの パネルを はかりなおして いない');
});

test('もじの いれものは 16px いじょう（iOS が かってに ズームしない）', () => {
  /* 16px より ちいさい もじの いれものを タップすると、iOS は
     がめんを ズームして スクロールの いちが ずれた まま に なります。*/
  const bad = [];
  ['.vs-input', '.vs-input.mk-name', '.wv-row select, .wv-row input'].forEach(sel => {
    const i = css.indexOf(sel + ' {');
    const j = (i >= 0) ? i : css.indexOf(sel + '{');
    assert.ok(j >= 0, sel + ' が style.css に ない');
    const block = css.slice(j, css.indexOf('}', j));
    const m = block.match(/font-size:\s*([^;]+);/);
    assert.ok(m, sel + ' に font-size が ない');
    if (m[1].indexOf('max(16px') < 0) bad.push(sel + ' → ' + m[1].trim());
  });
  assert.strictEqual(bad.length, 0,
    '16px いじょうに なって いない: ' + bad.join(' / '));
});

console.log('id の つけわすれ');

test('main.js が さがす id は ぜんぶ index.html に ある', () => {
  const ids = new Set();
  const re = /\$\('#([a-zA-Z0-9_-]+)'\)/g;
  let m;
  while ((m = re.exec(main))) ids.add(m[1]);
  assert.ok(ids.size > 50, 'id が すくなすぎる（しらべかたが まちがって いる かも）');
  const miss = [...ids].filter(id => html.indexOf('id="' + id + '"') < 0);
  assert.strictEqual(miss.length, 0, 'index.html に ない id: ' + miss.join(', '));
});

test('バージョンの すうじが main.js と sw.js で そろって いる', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const a = main.match(/const GAME_VERSION = '([^']+)'/);
  const b = sw.match(/const APP_VERSION = '([^']+)'/);
  assert.ok(a && b, 'バージョンの ぎょうが みつからない');
  assert.strictEqual(a[1], b[1],
    'main.js は ' + a[1] + '、sw.js は ' + b[1] + ' に なって いる（そろえて ください）');
});

console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
