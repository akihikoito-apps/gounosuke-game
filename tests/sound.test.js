/* ==========================================================================
   おと（こうかおん・BGM）の じどう チェック

   つかいかた：  node tests/sound.test.js
   ゲーム ほんたいは かえずに、js/sound.js を そのまま よみこんで ためします。
   ほんものの スピーカーは つかわず、にせものの AudioContext で
   「おとが いくつ ならされたか」を かぞえます（ブラウザは いりません）。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const SOUND_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'sound.js'), 'utf8');

/* ---- にせものの AudioContext（ならした おとを かぞえる だけ）---- */
function makeFakeAudio() {
  const log = { started: 0, contexts: [], gains: [] };
  const param = (v) => ({
    value: v,
    setValueAtTime(x) { this.value = x; },
    exponentialRampToValueAtTime(x) { this.value = x; },
    linearRampToValueAtTime(x) { this.value = x; },
    cancelScheduledValues() {},
  });
  const node = (extra) => Object.assign({
    connect() {}, disconnect() {},
    start() { log.started++; }, stop() {},
  }, extra);
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = node({});
      log.contexts.push(this);
    }
    createGain() { const g = node({ gain: param(1) }); log.gains.push(g); return g; }
    createOscillator() { return node({ type: 'sine', frequency: param(440) }); }
    createBiquadFilter() { return node({ type: 'lowpass', frequency: param(350), Q: param(1) }); }
    createBuffer(ch, n) { const d = new Float32Array(n); return { getChannelData: () => d }; }
    createBufferSource() { return node({ buffer: null }); }
    resume() { this.state = 'running'; }
    suspend() { this.state = 'suspended'; }
  }
  return { log, FakeAudioContext };
}

/* ---- sound.js を まっさらな せかいに よみこむ ---- */
function load(withAudio) {
  const fake = makeFakeAudio();
  const listeners = {};
  const document = {
    hidden: false,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter(f => f !== fn);
    },
  };
  const timers = [];
  const window = withAudio ? { AudioContext: fake.FakeAudioContext } : {};
  const ctx = vm.createContext({
    console, Math, Number, Float32Array, window, document,
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
  });
  vm.runInContext(SOUND_SRC, ctx, { filename: 'sound.js' });
  const Sound = vm.runInContext('Sound', ctx);
  return { Sound, log: fake.log, listeners, timers };
}

/* ゲームの なかで つかわれて いる こうかおんの なまえ（js/ から さがす）*/
function seNamesUsedInGame() {
  const names = new Set();
  for (const f of ['game.js', 'main.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
    for (const m of src.matchAll(/Sound\.se\(([^)]*)\)/g)) {
      for (const q of m[1].matchAll(/'(\w+)'/g)) names.add(q[1]);
    }
  }
  return [...names];
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

console.log('おとの でない かんきょう');

test('AudioContext が ない ブラウザでも エラーに ならず、なにも ならない', () => {
  const { Sound } = load(false);
  assert.strictEqual(Sound.wake(), false);
  assert.strictEqual(Sound.ready, false);
  assert.doesNotThrow(() => {
    Sound.se('summon');
    Sound.se('win');
    Sound.bgm('battle');
    Sound.bgm(null);
    Sound.setOn('se', false);
    Sound.setOn('bgm', false);
    Sound.setOn('se', true);
    Sound.setOn('bgm', true);
  });
});

test('めざめる まえ（さいしょの タップ まえ）は ならさない', () => {
  const { Sound, log } = load(true);
  assert.doesNotThrow(() => { Sound.se('summon'); Sound.bgm('home'); });
  assert.strictEqual(log.contexts.length, 0, 'かってに AudioContext を つくらない');
  assert.strictEqual(log.started, 0);
});

console.log('こうかおん');

const MAIN_SE = ['tap', 'back', 'deny', 'summon', 'hit', 'hitBig', 'crit', 'weak',
                 'nullify', 'knockback', 'die', 'bossIn', 'chudon', 'castle',
                 'win', 'lose', 'fanfare', 'coin', 'levelup', 'evolve', 'gacha', 'rare',
                 'craft', 'drop', 'talk',
                 /* ★ふしめの おと */
                 'start', 'clear', 'champion', 'tie', 'alarm', 'count', 'open'];

test('おもな こうかおんの なまえで よぶと、それぞれ おとが なる', () => {
  const { Sound, log } = load(true);
  assert.strictEqual(Sound.wake(), true);
  assert.strictEqual(Sound.ready, true);
  for (const name of MAIN_SE) {
    const before = log.started;
    assert.doesNotThrow(() => Sound.se(name), name);
    assert.ok(log.started > before, name + ' の おとが ならない');
  }
});

test('ゲームの なかで よんで いる なまえは みんな おとが ある', () => {
  const used = seNamesUsedInGame();
  assert.ok(used.length >= 10, 'Sound.se の よびだしが みつかる');
  const { Sound, log } = load(true);
  Sound.wake();
  for (const name of used) {
    const before = log.started;
    Sound.se(name);
    assert.ok(log.started > before, 'しらない こうかおん: ' + name);
  }
});

test('こうかおんの ひょうに ある なまえは のこらず ならせる', () => {
  const table = [...SOUND_SRC.matchAll(/^    (\w+):\s*\(\)/gm)].map(m => m[1]);
  assert.ok(table.length >= 30, 'こうかおんが ' + table.length + 'しゅるい しか ない');
  const { Sound, log } = load(true);
  Sound.wake();
  for (const name of table) {
    const before = log.started;
    Sound.se(name);
    assert.ok(log.started > before, name + ' が ならない');
  }
});

test('こうかおんを ならした かずを かぞえて いる（タップおんの だぶり よけ）', () => {
  const { Sound } = load(true);
  Sound.wake();
  const a = Sound.count;
  Sound.se('tap'); Sound.se('tap');
  assert.strictEqual(Sound.count, a + 2, 'かぞえて いない');
  Sound.se('nai-oto');
  assert.strictEqual(Sound.count, a + 2, 'ない おとを かぞえて しまう');
});

test('★ステージの はじまり・おわり、三番勝負の けっちゃくで おとが なる', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  const game = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');
  assert.ok(/show\('screen-battle'\);[\s\S]{0,160}Sound\.se\('start'\)/.test(main),
    'ステージの はじまりに おとが ない');
  assert.ok(/Game\.result === 'win' \? 'clear'/.test(main),
    'ステージ クリアの おとが ない');
  assert.ok(/MATCH\.wins\[0\] === MATCH\.wins\[1\] \? 'tie' : 'champion'/.test(main),
    '三番勝負の けっちゃくの おとが ない');
  assert.ok(/pinchDone[\s\S]{0,220}Sound\.se\('alarm'\)/.test(game),
    'しろが ピンチの おとが ない');
});

test('★ボタンを おすと おとが なる しかけが ある', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  assert.ok(/function installTapSound/.test(main), 'タップおんの しかけが ない');
  assert.ok(/\n    installTapSound\(\);/.test(main), 'タップおんを よんで いない');
  assert.ok(/before = Sound\.count[\s\S]{0,60}true\)/.test(main),
    'さきに かいすうを おぼえて いない（キャプチャ）');
  assert.ok(/Sound\.count !== before/.test(main), 'だぶりを よけて いない');
  assert.ok(/Sound\.se\(back \? 'back' : 'tap'\)/.test(main), 'タップおんを ならして いない');
});

test('しらない なまえ・からっぽ でも エラーに ならず、なにも ならない', () => {
  const { Sound, log } = load(true);
  Sound.wake();
  assert.doesNotThrow(() => { Sound.se('nai-oto'); Sound.se(); Sound.se(null); });
  assert.strictEqual(log.started, 0);
});

test('こうかおんを けす せっていの ときは ならず、もどすと また なる', () => {
  const { Sound, log } = load(true);
  Sound.wake();
  Sound.setOn('se', false);
  assert.strictEqual(Sound.isOn('se'), false);
  for (const name of MAIN_SE) Sound.se(name);
  assert.strictEqual(log.started, 0, 'けして いるのに なった');
  assert.strictEqual(log.gains[0].gain.value, 0, 'こうかおんの つまみが 0');
  Sound.setOn('se', true);
  assert.strictEqual(Sound.isOn('se'), true);
  Sound.se('summon');
  assert.ok(log.started > 0);
});

test('めざめる まえに けして おいても、めざめた あと ならない', () => {
  const { Sound, log } = load(true);
  Sound.setOn('se', false);
  Sound.wake();
  Sound.se('summon');
  assert.strictEqual(log.started, 0);
});

console.log('BGM');

test('BGM を ながすと おとが よやくされ、つぎの くりかえしも よやくされる', () => {
  const { Sound, log, timers } = load(true);
  Sound.wake();
  for (const name of ['home', 'battle', 'boss', 'room', 'gacha']) {
    const before = log.started;
    Sound.bgm(name);
    assert.ok(log.started > before, name + ' が ならない');
  }
  assert.ok(timers.length >= 5, 'くりかえしの よやく');
  assert.doesNotThrow(() => Sound.bgm(null));
});

test('BGM を けす せっていの ときは ならず、くりかえしも しない', () => {
  const { Sound, log, timers } = load(true);
  Sound.wake();
  Sound.setOn('bgm', false);
  assert.strictEqual(Sound.isOn('bgm'), false);
  Sound.bgm('battle');
  assert.strictEqual(log.started, 0);
  assert.strictEqual(timers.length, 0);
});

test('ながして いる とちゅうで BGM を けすと、のこりの よやくも ならない', () => {
  const { Sound, log, timers } = load(true);
  Sound.wake();
  Sound.bgm('battle');
  Sound.setOn('bgm', false);
  const before = log.started;
  timers.forEach(fn => fn());
  assert.strictEqual(log.started, before);
});

console.log('さいしょの タップ');

test('さいしょの タップで めざめ、まえに たのんで いた BGM が ながれる', () => {
  const { Sound, log, listeners } = load(true);
  Sound.install();
  Sound.bgm('home');
  assert.strictEqual(Sound.ready, false);
  listeners.pointerdown.forEach(fn => fn());
  assert.strictEqual(Sound.ready, true);
  assert.ok(log.started > 0, 'たのんで いた BGM が ながれる');
  assert.strictEqual(listeners.pointerdown.length, 0, 'いちど めざめたら もう きかない');
});

console.log('\n' + passed + ' ok / ' + failed + ' NG');
if (failed) process.exit(1);
