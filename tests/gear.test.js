/* ==========================================================================
   そうびひん（ごうのすけの かいはつしつ）の じどう チェック

   つかいかた：  node tests/gear.test.js
   ゲーム ほんたいは かえずに、js/data.js と js/game.js を そのまま よみこんで
   ためします（ブラウザは いりません）。

   ためす こと
     ・そうびひんの データが そろって いる（そうびのもと ＋ そざい、こうかの かきかた）
     ・そうびを つけると ステータスが かわり、★もとの UNITS は かわらない★
     ・つけて いない ときは なにも かわらない
     ・たたかいの なかで こうかが でる
         vs     … きめた ぞくせいの あいてに よぶんに ダメージ
         pierce … あいての「きかない！」（むこうか）を つきぬける
         guard  … きめた ぞくせいの こうげきを うけにくく なる
     ・とびらが あく じょうけん（LAB.needStages）が ほんものの ステージを さして いる
     ・そうびのもとが もらえる コースが ちゃんと ある
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
const Game      = run('Game');
const UNITS     = run('UNITS');
const ENEMIES   = run('ENEMIES');
const GEARS     = run('GEARS');
const GEAR_CORE = run('GEAR_CORE');
const LAB       = run('LAB');
const STAGES    = run('STAGES');
const PARK      = run('FUSHIGI_PARK');
const MATERIALS = run('MATERIALS');
const attrList  = run('attrList');

/* がめんの えんしゅつは ためさないので、からっぽに して おく */
Game.addEffect = () => {};
Game.groundWorldY = () => 0;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  NG  ' + name + '\n      ' + e.message); }
}

/* その なかまに そうびを つけた ときの データを かえす */
function defWith(unitId, gearId) {
  Game.evolved = {}; Game.evolved2 = {};
  Game.gear = gearId ? { [unitId]: gearId } : {};
  return Game.defOf(unitId);
}

/* みかた 1たい と てき 1たいを ならべて 1かい たたかわせ、
   あいてが うけた ダメージを かえす。
   back: true の ときは てきが みかたを たたく（うける がわを ためす）*/
function hitOnce(unitId, enemyId, gearId, back) {
  Game.levels = { [unitId]: 1 };
  Game.evolved = {}; Game.evolved2 = {};
  Game.gear = gearId ? { [unitId]: gearId } : {};
  Game.start(STAGES[0]);
  Game.units = [];
  const a = Game.makeUnit(Game.defOf(unitId), 'ally');
  const e = Game.makeUnit(ENEMIES[enemyId], 'enemy');
  a.x = 500; e.x = 500;
  const src = back ? e : a, dst = back ? a : e;
  dst.hp = dst.maxHp = 99999999;      // たおれない ように して ダメージだけ みる
  Game.units.push(a, e);
  const was = dst.hp;
  Game.applyHit(src, dst, 500, 0);
  return was - dst.hp;
}

/* ====================================================================== */
console.log('そうびひんの データ');

test('そうびひんが 1つ いじょう ある', () => {
  assert.ok(Array.isArray(GEARS) && GEARS.length >= 1);
});

test('id が かぶって いない', () => {
  assert.strictEqual(new Set(GEARS.map(g => g.id)).size, GEARS.length);
});

test('ぜんぶに なまえ・え・せつめいが ある', () => {
  GEARS.forEach(g => {
    assert.ok(g.name, g.id + ' に なまえが ない');
    assert.ok(g.icon, g.id + ' に え が ない');
    assert.ok(g.desc, g.id + ' に せつめいが ない');
  });
});

test('ぜんぶ そうびのもと 1つ いじょう と そざいが いる', () => {
  GEARS.forEach(g => {
    assert.ok(g.cost && g.cost.core >= 1, g.id + ' に ' + GEAR_CORE.name + 'が いらない');
    const mats = Object.keys(g.cost).filter(k => k !== 'core');
    assert.ok(mats.length >= 1, g.id + ' に そざいが いらない');
    mats.forEach(k => assert.ok(MATERIALS[k], g.id + ' の そざい「' + k + '」は ない'));
  });
});

test('こうかの かきかたは しって いる ものだけ', () => {
  const known = ['hp', 'atk', 'speed', 'range', 'kb', 'recharge', 'cost', 'vs', 'guard', 'crit', 'pierce'];
  GEARS.forEach(g => {
    assert.ok(g.eff && Object.keys(g.eff).length >= 1, g.id + ' に こうかが ない');
    Object.keys(g.eff).forEach(k =>
      assert.ok(known.indexOf(k) >= 0, g.id + ' の しらない こうか「' + k + '」'));
  });
});

/* ====================================================================== */
console.log('ステータスへの はんえい');

test('そうびを つけないと なにも かわらない', () => {
  const d = defWith('tankun', null);
  assert.strictEqual(d.hp, UNITS.tankun.hp);
  assert.strictEqual(d.atk, UNITS.tankun.atk);
  assert.strictEqual(d.gearEff, undefined);
});

test('たいりょくの ばいりつが かかる', () => {
  const g = GEARS.find(x => x.eff.hp);
  if (!g) return;
  const before = UNITS.tankun.hp;
  const after = defWith('tankun', g.id).hp;
  assert.strictEqual(after, Math.round(before * g.eff.hp));
});

test('こうげきりょくの ばいりつが かかる', () => {
  const g = GEARS.find(x => x.eff.atk && !x.eff.hp);
  if (!g) return;
  const before = UNITS.akibou.atk;
  const after = defWith('akibou', g.id).atk;
  assert.strictEqual(after, Math.round(before * g.eff.atk));
});

test('きょり・ふきとび・さいせいさん・コストも かわる', () => {
  const gr = GEARS.find(x => x.eff.range);
  if (gr) assert.strictEqual(defWith('akibou', gr.id).range, UNITS.akibou.range + gr.eff.range);
  const gk = GEARS.find(x => x.eff.kb);
  if (gk) assert.strictEqual(defWith('tankun', gk.id).kbCount, UNITS.tankun.kbCount + gk.eff.kb);
  const gc = GEARS.find(x => x.eff.cost);
  if (gc) assert.ok(defWith('tankun', gc.id).cost < UNITS.tankun.cost);
  const gb = GEARS.find(x => x.eff.recharge);
  if (gb) assert.ok(defWith('tankun', gb.id).recharge < UNITS.tankun.recharge);
});

test('★もとの UNITS は かきかわらない★', () => {
  const hp = UNITS.tankun.hp, atk = UNITS.akibou.atk;
  GEARS.forEach(g => { defWith('tankun', g.id); defWith('akibou', g.id); });
  assert.strictEqual(UNITS.tankun.hp, hp);
  assert.strictEqual(UNITS.akibou.atk, atk);
  assert.strictEqual(UNITS.tankun.gearEff, undefined);
});

/* ====================================================================== */
console.log('たたかいの なかの こうか');

test('vs：きめた ぞくせいの あいてに よぶんに ダメージ', () => {
  const g = GEARS.find(x => x.eff.vs && !x.eff.pierce);
  if (!g) return;
  const want = g.eff.vs.attrs[0];
  /* その ぞくせい だけを もち、むこうかも かいしんも ない てきを さがす */
  const enemy = Object.keys(ENEMIES).find(k => {
    const e = ENEMIES[k];
    return attrList(e.attr).join() === want && !e.nullify && !e.absorb && !e.resist && !e.dodge;
  });
  /* かいしん・れんげきの ない みかたで はかる（すうじが ぶれない ように）*/
  const unit = Object.keys(UNITS).find(k => {
    const d = UNITS[k];
    return d.atk > 0 && !d.crit && !d.multiHit && !d.wave && !d.bonusVs;
  });
  if (!enemy || !unit) return;
  const plain = hitOnce(unit, enemy, null);
  const withG = hitOnce(unit, enemy, g.id);
  assert.ok(plain > 0, 'そうび なしで ダメージが 0');
  assert.strictEqual(withG, Math.round(plain * g.eff.vs.mult));
});

test('pierce：あいての「きかない！」を つきぬける', () => {
  const g = GEARS.find(x => x.eff.pierce);
  if (!g) return;
  /* むこうかを もつ てきと、その ぞくせい 1つ だけの みかたを さがす */
  let found = null;
  Object.keys(ENEMIES).forEach(ek => {
    if (found) return;
    const e = ENEMIES[ek];
    if (!e.nullify || !e.nullify.attrs) return;
    Object.keys(UNITS).forEach(uk => {
      if (found) return;
      const d = UNITS[uk];
      const at = attrList(d.attr);
      if (d.atk > 0 && at.length === 1 && e.nullify.attrs.indexOf(at[0]) >= 0) found = { ek, uk };
    });
  });
  assert.ok(found, 'むこうかの くみあわせが みつからない');
  assert.strictEqual(hitOnce(found.uk, found.ek, null), 0, 'そうび なしで ダメージが とおって いる');
  assert.ok(hitOnce(found.uk, found.ek, g.id) > 0, 'おふだでも ダメージが とおらない');
});

test('guard：きめた ぞくせいの こうげきを うけにくく なる', () => {
  const g = GEARS.find(x => x.eff.guard);
  if (!g) return;
  const want = g.eff.guard.attrs[0];
  const enemy = Object.keys(ENEMIES).find(k => {
    const e = ENEMIES[k];
    return attrList(e.attr).join() === want && e.atk > 0 && !e.crit && !e.multiHit && !e.wave;
  });
  if (!enemy) return;
  const plain = hitOnce('tankun', enemy, null, true);
  const withG = hitOnce('tankun', enemy, g.id, true);
  assert.ok(plain > 0, 'そうび なしで ダメージが 0');
  assert.ok(withG < plain, 'マントを きても ダメージが へって いない');
});

test('そうびを つけても ステージは ふつうに おわる', () => {
  const party = ['tankun', 'kabekun', 'akibou'];
  Game.levels = {}; Game.evolved = {}; Game.evolved2 = {}; Game.gear = {};
  party.forEach((id, i) => { Game.levels[id] = 20; Game.gear[id] = GEARS[i % GEARS.length].id; });
  Game.start(STAGES[0]);
  let t = 0;
  while (!Game.finished && t < 300) {
    party.forEach(id => Game.summon(id));
    Game.update(1 / 30);
    t += 1 / 30;
  }
  assert.ok(Game.finished, '300びょう たっても おわらなかった');
});

/* ====================================================================== */
console.log('かいはつしつが あく じょうけん');

test('LAB.needStages は ほんものの ステージを さして いる', () => {
  assert.ok(Array.isArray(LAB.needStages) && LAB.needStages.length >= 1);
  const all = STAGES.concat(PARK.courses);
  LAB.needStages.forEach(no =>
    assert.ok(all.some(st => st.no === no), 'no.' + no + ' の ステージが ない'));
});

test('ネコソは 1日に そうびのもとを くれる', () => {
  assert.ok(LAB.give >= 1);
  assert.ok(LAB.needText && LAB.needText.length > 0);
});

test('そうびのもとが もらえる コースが ある', () => {
  const all = STAGES.concat(PARK.courses);
  const give = all.filter(st => st.gearCore);
  assert.ok(give.length >= 1, 'そうびのもとが もらえる コースが ない');
  /* ふしぎ遊園地の さいごの コースで もらえる こと */
  const last = PARK.courses[PARK.courses.length - 1];
  assert.ok(last.gearCore >= 1, 'ふしぎ遊園地の さいごで もらえない');
});

/* ====================================================================== */
console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
