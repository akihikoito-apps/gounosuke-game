/* ==========================================================================
   ミニゲームの 1人用／2人用 と「タンクン かけっこ」の じどう チェック

   つかいかた：  node tests/minigame2.test.js

   ここでは ブラウザを つかわずに できる ことだけ しらべます。
     ・RUNGAME（かけっこの すうじ）の つじつま
     ・あたらしい がめん と ボタンが index.html に ある こと
   じっさいに クリックして とおす テストは、さぎょう用の jsdom で やって います。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), ctx, { filename: 'data.js' });
const RUNGAME = vm.runInContext('RUNGAME', ctx);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('タンクン かけっこ の すうじ');

test('1人 3かい、はやさも 3つ ある', () => {
  assert.strictEqual(RUNGAME.rounds, 3);
  assert.ok(Array.isArray(RUNGAME.speeds));
  assert.ok(RUNGAME.speeds.length >= RUNGAME.rounds,
    'かいすう ' + RUNGAME.rounds + ' に たいして はやさが ' + RUNGAME.speeds.length + 'つ しか ない');
});

test('かいを かさねる ほど はやく なる', () => {
  for (let i = 1; i < RUNGAME.speeds.length; i++) {
    assert.ok(RUNGAME.speeds[i] > RUNGAME.speeds[i - 1],
      (i + 1) + 'かいめ が ' + i + 'かいめ より はやく ない');
  }
});

test('メーターは 1ぺんの いききが みえる はやさに なって いる', () => {
  /* 0 → 100 → 0 で 1おうふく。はやすぎると とめられず、おそすぎると たいくつ。
     1おうふくが 0.9びょう 〜 6びょう の あいだなら あそべます。        */
  RUNGAME.speeds.forEach((sp, i) => {
    const round = 200 / sp;        // 1おうふくの びょうすう
    assert.ok(round >= 0.9 && round <= 6.0,
      (i + 1) + 'かいめ の 1おうふくが ' + round.toFixed(2) + 'びょう（0.9〜6.0 の そとです）');
  });
});

test('スタートの タップで すぐ とまらない ように なって いる', () => {
  assert.ok(RUNGAME.grace > 0, 'grace が 0 だと スタートの タップで そのまま とまります');
  assert.ok(RUNGAME.grace < 0.6, 'grace が ながすぎると とめたい ときに とめられません');
});

test('「ピッタリ！」は いちばん うえの ほうだけ', () => {
  assert.ok(RUNGAME.perfect > 90 && RUNGAME.perfect <= 100,
    'perfect が ' + RUNGAME.perfect + '（まんタンの ちかく では ない）');
});

test('いちばん とおくても はしり おわる じかんに なって いる', () => {
  const maxDist = 100 * RUNGAME.rounds;              // ぜんぶ まんタンの とき
  const sec = maxDist / RUNGAME.runSpeed;
  assert.ok(RUNGAME.runSpeed > 0);
  assert.ok(sec <= 8, 'いちばん とおい ときに ' + sec.toFixed(1) + 'びょう かかる（ながすぎます）');
});

console.log('がめん と ボタン');

test('あたらしい がめんが 3つ ある', () => {
  ['screen-minimode', 'screen-vsname', 'screen-run'].forEach(id =>
    assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('ひとり／ふたり の ボタンが ある', () => {
  ['btn-mini-solo', 'btn-mini-duo', 'btn-minimode-back'].forEach(id =>
    assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('なまえを いれる ところと タップボタンが ある', () => {
  ['vs-name1', 'vs-name2', 'btn-vsname-go', 'btn-run-tap', 'btn-run-again', 'btn-run-exit']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('ミニゲームの ボタンは まず「ひとり／ふたり」を ひらく', () => {
  assert.ok(/\$\('#btn-home-mini'\)\.addEventListener\('click', openMiniMode\)/.test(main),
            'トップの ミニゲームボタンが openMiniMode に なって いない');
});

test('もとの 3つは ひとり用、かけっこは ふたり用に 入って いる', () => {
  const solo = main.match(/const MINIGAMES = \[[\s\S]*?\n  \];/);
  const duo  = main.match(/const MINIGAMES2 = \[[\s\S]*?\n  \];/);
  assert.ok(solo, 'MINIGAMES が みつからない');
  assert.ok(duo,  'MINIGAMES2 が みつからない');
  ['bugshoot', 'foodcatch', 'duel'].forEach(k =>
    assert.ok(solo[0].indexOf("'" + k + "'") >= 0, k + ' が ひとり用に ない'));
  assert.ok(duo[0].indexOf("'tankrun'") >= 0, 'かけっこが ふたり用に ない');
  ['bugshoot', 'foodcatch', 'duel'].forEach(k =>
    assert.ok(duo[0].indexOf("'" + k + "'") < 0, k + ' が ふたり用にも 入って いる'));
});

console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
