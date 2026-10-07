/* ==========================================================================
   ふしぎな せかいの しかけ（てんき・うごく ゆか）の じどう チェック

   つかいかた：  node tests/gimmicks.test.js
   ゲーム ほんたいは かえずに、js/data.js と js/game.js を そのまま よみこんで
   ためします（ブラウザは いりません）。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

/* ---- data.js と game.js を 1つの せかいに よみこむ ---- */
const ctx = vm.createContext({ console, Math });
for (const f of ['data.js', 'game.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(src, ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx);
const Game = run('Game');
const WEATHER_BALL_TIME = run('WEATHER_BALL_TIME');

/* がめんの えんしゅつは ためさないので、からっぽに して おく */
Game.addEffect = () => {};
Game.groundWorldY = () => 0;

function setup(stage) {
  Game.stage = stage;
  Game.time = 0;
  Game.finished = false;
  Game.ballUsed = {};
  Game.ballUntil = 0;
  Game.ballBefore = null;
  Game.setupGimmicks();
}

/* こまかい じかんで すすめる（ほんものの ゲームと おなじ やりかた）*/
function tick(seconds, dt = 0.1) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    Game.time += dt;
    Game.updateGimmicks(dt);
  }
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('てんき');

test('weather が ない ステージでは てんきが ない', () => {
  setup({});
  assert.strictEqual(Game.weatherNow, null);
  tick(30);
  assert.strictEqual(Game.weatherNow, null);
  assert.strictEqual(Game.weatherMult('fire'), 1);
});

test('every びょうごとに list の じゅんばんで かわり、さいごの あとは さいしょに もどる', () => {
  setup({ weather: { every: 10, list: ['sun', 'rain', 'night'] } });
  assert.strictEqual(Game.weatherNow, 'sun');
  tick(9.5);
  assert.strictEqual(Game.weatherNow, 'sun', '10びょう まえは まだ かわらない');
  tick(1);
  assert.strictEqual(Game.weatherNow, 'rain');
  tick(10);
  assert.strictEqual(Game.weatherNow, 'night');
  tick(10);
  assert.strictEqual(Game.weatherNow, 'sun');
});

test('てんきで ぞくせいの ばいりつが かわる', () => {
  setup({ weather: { every: 10, list: ['sun', 'rain'] } });
  assert.strictEqual(Game.weatherMult('fire'), run('WEATHER_UP'));
  assert.strictEqual(Game.weatherMult('water'), run('WEATHER_DOWN'));
  assert.strictEqual(Game.weatherMult('grass'), 1);
  tick(10.5);
  assert.strictEqual(Game.weatherMult('water'), run('WEATHER_UP'));
  assert.strictEqual(Game.weatherMult('fire'), run('WEATHER_DOWN'));
});

test('てんきだま：きまった じかんだけ かわり、おわると もとに もどる。1しあい 1かい', () => {
  setup({ weather: { every: 999, list: ['sun'] } });
  assert.strictEqual(Game.useWeatherBall('snow'), true);
  assert.strictEqual(Game.weatherNow, 'snow');
  assert.strictEqual(Game.useWeatherBall('snow'), false, 'おなじ たまは 2かい つかえない');
  tick(WEATHER_BALL_TIME - 1);
  assert.strictEqual(Game.weatherNow, 'snow');
  tick(1.5);
  assert.strictEqual(Game.weatherNow, 'sun');
});

test('ふしぎ遊園地の ステージは みんな ただしい てんきの なまえを つかっている', () => {
  const WEATHERS = run('WEATHERS');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
  const lists = [...src.matchAll(/weather:\s*\{[^}]*list:\s*\[([^\]]*)\]/g)];
  assert.ok(lists.length >= 7, 'weather の ある ステージが みつかる');
  for (const m of lists) {
    for (const k of m[1].match(/'(\w+)'/g).map(s => s.slice(1, -1))) {
      assert.ok(WEATHERS[k], 'しらない てんき: ' + k);
    }
  }
});

console.log('うごく ゆか');

test('ゆかの うえだけ はやさが たされ、そとでは 0', () => {
  setup({ belts: [{ from: 300, to: 700, speed: 26, flip: 0 }] });
  assert.strictEqual(Game.beltAt(299), 0);
  assert.strictEqual(Game.beltAt(300), 26);
  assert.strictEqual(Game.beltAt(500), 26);
  assert.strictEqual(Game.beltAt(700), 26);
  assert.strictEqual(Game.beltAt(701), 0);
});

test('flip びょうごとに むきが ぎゃくに なる（flip: 0 なら かわらない）', () => {
  setup({ belts: [{ from: 0, to: 100, speed: 20, flip: 5 },
                  { from: 200, to: 300, speed: -10, flip: 0 }] });
  assert.strictEqual(Game.beltAt(50), 20);
  tick(5.5);
  assert.strictEqual(Game.beltAt(50), -20);
  tick(5);
  assert.strictEqual(Game.beltAt(50), 20);
  assert.strictEqual(Game.beltAt(250), -10, 'flip: 0 の ゆかは ずっと おなじ');
});

test('ステージの データを かきかえない（2かい あそんでも おなじ はじまり）', () => {
  const stage = { belts: [{ from: 0, to: 100, speed: 20, flip: 2 }] };
  setup(stage);
  tick(3);
  assert.strictEqual(Game.beltAt(50), -20);
  setup(stage);
  assert.strictEqual(Game.beltAt(50), 20);
  assert.strictEqual(stage.belts[0].dir, undefined);
});

/* あるいて いる なかまを 1かい うごかす（あいては いない ことに する）*/
function walkOnce(x, def, dt) {
  const u = { side: 'enemy', def: def, forward: 1, x: x, hp: 100, maxHp: 100,
              state: 'walk', t: 0, flash: 0, dead: false, atkCd: 0, windup: -1,
              burst: null, slowUntil: -1, webSlowUntil: -1, burnUntil: -1,
              stunUntil: -1, speedBonus: 0, roll: 0, lane: 0 };
  const findTarget = Game.findTarget;
  Game.findTarget = () => null;
  Game.units = [u];
  try { Game.updateUnit(u, dt); } finally { Game.findTarget = findTarget; }
  return u.x;
}

test('ゆかの うえを あるくと いちが ゆかの ぶん よけいに すすむ', () => {
  setup({ belts: [{ from: 300, to: 700, speed: 26, flip: 0 }] });
  assert.strictEqual(walkOnce(400, { speed: 10 }, 0.5), 400 + 5 + 13);
  assert.strictEqual(walkOnce(100, { speed: 10 }, 0.5), 100 + 5, 'ゆかの そとは ふつう');
});

test('ぎゃくむきの ゆかでは おしもどされ、そらを とぶ なかまには きかない', () => {
  setup({ belts: [{ from: 300, to: 700, speed: -26, flip: 0 }] });
  assert.strictEqual(walkOnce(400, { speed: 10 }, 0.5), 400 + 5 - 13);
  assert.strictEqual(walkOnce(400, { speed: 10, flying: true }, 0.5), 400 + 5);
});

console.log('\n' + passed + ' ok / ' + failed + ' NG');
if (failed) process.exit(1);
