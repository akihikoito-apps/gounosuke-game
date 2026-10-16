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
const TATAKI  = vm.runInContext('TATAKI', ctx);
const MEMORY  = vm.runInContext('MEMORY', ctx);
const UNITS   = vm.runInContext('UNITS', ctx);
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

test('3しゅもく とも「かちの よいん」が ある', () => {
  /* ★はしり おわった／たたき おわった すぐ あとに けっかの まどが でると
       あじけない ので、かみふぶきと ファンファーレの あいだを おきます。 */
  [['かけっこ', RUNGAME], ['たたき', TATAKI], ['おぼえ', MEMORY]].forEach(([name, C]) => {
    assert.ok(typeof C.cheer === 'number', name + ' に cheer が ない');
    assert.ok(C.cheer >= 1.5 && C.cheer <= 6,
      name + ' の よいんが ' + C.cheer + 'びょう（1.5〜6 の そとです）');
  });
});

console.log('むしむし たたき の すうじ');

test('じかんと あなの かずが あそべる はんい', () => {
  assert.ok(TATAKI.time >= 8 && TATAKI.time <= 40, 'せいげんじかんが ' + TATAKI.time + 'びょう');
  assert.ok(TATAKI.cols * TATAKI.rows >= 4, 'あなが すくなすぎる');
  assert.ok(TATAKI.maxUp >= 1 && TATAKI.maxUp <= TATAKI.cols * TATAKI.rows,
    'いちどに でる かずが あなの かずを こえて いる');
});

test('おわりに ちかづく ほど むずかしく なる', () => {
  assert.ok(TATAKI.showTo < TATAKI.showFrom, 'でて いる じかんが みじかく なって いない');
  assert.ok(TATAKI.gapTo < TATAKI.gapFrom, 'でて くる あいだが みじかく なって いない');
  assert.ok(TATAKI.showTo > 0.3, 'みじかすぎて たためません（' + TATAKI.showTo + 'びょう）');
});

test('キンキラは プラス、なかまは マイナス', () => {
  assert.ok(TATAKI.goldPoint > 1, 'キンキラむしが ふつうと おなじ てんすう');
  assert.ok(TATAKI.friendPoint < 0, 'なかまを たたいても へらない');
  const sum = TATAKI.goldRate + TATAKI.friendRate;
  assert.ok(sum > 0 && sum < 0.8, 'とくべつな むしの わりあいが ' + sum + '（おおすぎ／すくなすぎ）');
});

console.log('じゅんばん おぼえ の すうじ');

test('パネルの なかまは 4たい とも ほんとうに いる', () => {
  assert.ok(Array.isArray(MEMORY.chars) && MEMORY.chars.length === 4,
    'パネルが 4つ では ない');
  assert.strictEqual(new Set(MEMORY.chars).size, 4, 'おなじ なかまが 2かい ある');
  MEMORY.chars.forEach(id => assert.ok(UNITS[id], 'いない なかま: ' + id));
});

test('いちばん ながい ステージまで あそべる ながさ', () => {
  assert.ok(MEMORY.maxRound >= 5 && MEMORY.maxRound <= 20,
    'maxRound が ' + MEMORY.maxRound);
  /* いちばん ながい ときの「みせる じかん」が ながすぎない か */
  const show = MEMORY.maxRound * (MEMORY.showOn + MEMORY.showGap) + MEMORY.startWait;
  assert.ok(show <= 12, 'いちばん ながい ステージの みせる じかんが ' + show.toFixed(1) + 'びょう');
});

test('ひかって いる じかんが みえる ながさ', () => {
  assert.ok(MEMORY.showOn >= 0.25, 'ひかる じかんが みじかすぎる（' + MEMORY.showOn + 'びょう）');
  assert.ok(MEMORY.showGap >= 0.08, 'つぎに ひかる までが みじかすぎる');
});

console.log('がめん と ボタン');

test('あたらしい がめんが ある', () => {
  ['screen-minimode', 'screen-vsname', 'screen-run', 'screen-tataki', 'screen-memory']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('ひとり／ふたり の ボタンが ある', () => {
  ['btn-mini-solo', 'btn-mini-duo', 'btn-minimode-back'].forEach(id =>
    assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('なまえを いれる ところと タップボタンが ある', () => {
  ['vs-name1', 'vs-name2', 'btn-vsname-go',
   'btn-run-tap', 'btn-run-again', 'btn-run-exit',
   'btn-tataki-tap', 'btn-tataki-again', 'btn-tataki-exit',
   'btn-memory-tap', 'btn-memory-again', 'btn-memory-exit']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が ない'));
});

test('ミニゲームの ボタンは まず「ひとり／ふたり」を ひらく', () => {
  assert.ok(/\$\('#btn-home-mini'\)\.addEventListener\('click', openMiniMode\)/.test(main),
            'トップの ミニゲームボタンが openMiniMode に なって いない');
});

test('もとの 3つは ひとり用、あたらしい 3しゅもくは ふたり用に 入って いる', () => {
  const solo = main.match(/const MINIGAMES = \[[\s\S]*?\n  \];/);
  const duo  = main.match(/const MINIGAMES2 = \[[\s\S]*?\n  \];/);
  assert.ok(solo, 'MINIGAMES が みつからない');
  assert.ok(duo,  'MINIGAMES2 が みつからない');
  ['bugshoot', 'foodcatch', 'duel'].forEach(k =>
    assert.ok(solo[0].indexOf("'" + k + "'") >= 0, k + ' が ひとり用に ない'));
  ['tankrun', 'tataki', 'memory'].forEach(k =>
    assert.ok(duo[0].indexOf("'" + k + "'") >= 0, k + ' が ふたり用に ない'));
  ['bugshoot', 'foodcatch', 'duel'].forEach(k =>
    assert.ok(duo[0].indexOf("'" + k + "'") < 0, k + ' が ふたり用にも 入って いる'));
});

console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
