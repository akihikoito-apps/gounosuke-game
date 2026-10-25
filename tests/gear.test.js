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
const SLOTS     = run('GEAR_SLOTS');
const RANKS     = run('GEAR_RANKS');
const RANK_ORDER = run('GEAR_RANK_ORDER');
const FUSE      = run('GEAR_FUSE');
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

/* ★3かしょに つけた ときの すがた。wear = { body: id, foot: id, weapon: id } */
function defWear(unitId, wear) {
  Game.evolved = {}; Game.evolved2 = {};
  Game.gear = { [unitId]: wear };
  return Game.defOf(unitId);
}
const gearOfSlot = (sid, pick) => GEARS.filter(g => g.slot === sid)[pick || 0];

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
  const gc = GEARS.find(x => x.eff.cost && x.eff.cost < 1);
  if (gc) assert.ok(defWith('tankun', gc.id).cost < UNITS.tankun.cost);
  const gc2 = GEARS.find(x => x.eff.cost && x.eff.cost > 1);
  if (gc2) assert.ok(defWith('tankun', gc2.id).cost > UNITS.tankun.cost);
  const gb = GEARS.find(x => x.eff.recharge && x.eff.recharge < 1);
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

console.log('そうびの ばしょ（からだ・あし・ぶき）');

test('ばしょが 6つ あって、ぜんぶの そうびに ばしょが ある', () => {
  assert.ok(Array.isArray(SLOTS) && SLOTS.length === 6, 'ばしょが ' + (SLOTS || []).length + 'こ');
  assert.deepStrictEqual(SLOTS.map(x => x.id).sort().join(','),
    'acce,body,foot,hand,head,weapon', 'ばしょの id: ' + SLOTS.map(x => x.id));
  SLOTS.forEach(s => {
    assert.ok(s.id && s.name && s.icon, 'ばしょに なまえか えが ない');
    assert.ok(!/[A-Za-z]/.test(s.name), 'ばしょの なまえが にほんごで ない: ' + s.name);
  });
  GEARS.forEach(g => {
    assert.ok(SLOTS.some(s => s.id === g.slot), g.id + ' の ばしょが へん: ' + g.slot);
  });
});

test('どの ばしょにも そうびが じゅうぶん ある', () => {
  SLOTS.forEach(s => {
    const n = GEARS.filter(g => g.slot === s.id).length;
    assert.ok(n >= 8, s.name + ' の そうびが ' + n + 'こ しか ない');
  });
  assert.ok(GEARS.length >= 50, 'そうびが ' + GEARS.length + 'こ しか ない');
});

test('あたらしい そうびも なまえ・せつめいが にほんご', () => {
  GEARS.forEach(g => {
    assert.ok(!/[A-Za-z]/.test(g.desc), g.id + ' の せつめいに ローマ字: ' + g.desc);
    assert.ok(g.icon && g.icon.length <= 4, g.id + ' の えが へん');
  });
});

test('つよすぎる そうびが ない（1こで ばいりつ 1.7いじょうは なし）', () => {
  GEARS.forEach(g => {
    ['hp', 'atk'].forEach(k => {
      if (g.eff[k]) assert.ok(g.eff[k] <= 1.7, g.id + ' の ' + k + ' が ' + g.eff[k] + 'ばい');
    });
    if (g.eff.speed) assert.ok(g.eff.speed <= 1.8, g.id + ' の はやさが ' + g.eff.speed + 'ばい');
    if (g.eff.range) assert.ok(g.eff.range <= 100, g.id + ' の きょりが ＋' + g.eff.range);
  });
});

console.log('3かしょぶんの こうかが かさなる');

test('たいりょくと こうげきは かけ算で かさなる', () => {
  const unit = 'tankun';
  const body = GEARS.find(g => g.slot === 'body' && g.eff.hp);
  const wep  = GEARS.find(g => g.slot === 'weapon' && g.eff.atk);
  assert.ok(body && wep, 'ためす そうびが ない');
  const base = defWith(unit, null);
  const both = defWear(unit, { body: body.id, weapon: wep.id });
  assert.strictEqual(both.hp,  Math.round(base.hp * body.eff.hp), 'たいりょくが かさならない');
  assert.strictEqual(both.atk, Math.round(base.atk * wep.eff.atk), 'こうげきが かさならない');
});

test('きょりと ふきとびは たし算で かさなる', () => {
  const unit = 'tankun';
  const a = GEARS.find(g => g.eff.range);
  const b = GEARS.find(g => g.eff.kb && g.slot !== a.slot);
  assert.ok(a && b, 'ためす そうびが ない');
  const base = defWith(unit, null);
  const w = {}; w[a.slot] = a.id; w[b.slot] = b.id;
  const both = defWear(unit, w);
  assert.strictEqual(both.range, base.range + a.eff.range, 'きょりが たされない');
  assert.strictEqual(both.kbCount, (base.kbCount || 1) + b.eff.kb, 'ふきとびが たされない');
});

test('おなじ ばいりつの そうびを 2つ つけると もっと のびる', () => {
  const unit = 'tankun';
  const a = GEARS.filter(g => g.slot === 'body' && g.eff.hp)[0];
  const b = GEARS.filter(g => g.slot === 'foot' && g.eff.hp)[0];
  if (!a || !b) return;                       // どちらかの ばしょに なければ とばす
  const one  = defWear(unit, { body: a.id });
  const both = defWear(unit, { body: a.id, foot: b.id });
  assert.ok(both.hp > one.hp, '2つめの そうびが きいて いない');
});

test('3かしょ つけても こわれない（ぜんぶの くみあわせを ためす）', () => {
  const unit = 'tankun';
  const bodies = GEARS.filter(g => g.slot === 'body');
  const foots  = GEARS.filter(g => g.slot === 'foot');
  const weps   = GEARS.filter(g => g.slot === 'weapon');
  let n = 0;
  bodies.forEach(b => foots.forEach(ft => weps.forEach(w => {
    n++;
    const d = defWear(unit, { body: b.id, foot: ft.id, weapon: w.id });
    assert.ok(d.hp > 0 && d.atk >= 0, b.id + '/' + ft.id + '/' + w.id + ' が へん');
    assert.ok(d.cost >= 1 && d.recharge >= 0.5, b.id + '/' + ft.id + '/' + w.id + ' の すうじが へん');
    assert.ok(isFinite(d.speed) && d.speed >= 1, 'はやさが へん');
  })));
  assert.ok(n >= 900, 'ためした くみあわせが すくない（' + n + '）');
});

test('とくいな あいて（vs）は 2つ つけると どちらも きく', () => {
  const vs = GEARS.filter(g => g.eff.vs);
  const a = vs[0];
  const b = vs.find(g => g.slot !== a.slot &&
    g.eff.vs.attrs.join() !== a.eff.vs.attrs.join());
  if (!b) return;
  const w = {}; w[a.slot] = a.id; w[b.slot] = b.id;
  const d = defWear('tankun', w);
  assert.ok(d.gearEff && d.gearEff.vsList && d.gearEff.vsList.length === 2,
    'とくいな あいてが 1つ しか のこって いない');
});

test('まもり（guard）も 2つ つけると どちらも きく', () => {
  const gs = GEARS.filter(g => g.eff.guard);
  const a = gs[0];
  const b = gs.find(g => g.eff.guard.attrs.join() !== a.eff.guard.attrs.join());
  if (!b || a.slot === b.slot) {
    /* おなじ ばしょ どうし なら 1つしか つけられない ので、かたほうだけ たしかめる */
    const w = {}; w[a.slot] = a.id;
    const d = defWear('tankun', w);
    assert.ok(d.gearEff.guardList && d.gearEff.guardList.length === 1, 'まもりが きえた');
    return;
  }
  const w = {}; w[a.slot] = a.id; w[b.slot] = b.id;
  const d = defWear('tankun', w);
  assert.strictEqual(d.gearEff.guardList.length, 2, 'まもりが 1つ しか のこらない');
});

test('つきぬけ（pierce）と かいしんは いちばん いい ものに なる', () => {
  const p = GEARS.find(g => g.eff.pierce);
  const c = GEARS.filter(g => g.eff.crit);
  if (p) {
    const w = {}; w[p.slot] = p.id;
    assert.ok(defWear('tankun', w).gearEff.pierce, 'つきぬけが きえた');
  }
  if (c.length) {
    const w = {}; w[c[0].slot] = c[0].id;
    const d = defWear('tankun', w);
    assert.ok(d.gearEff.crit && d.gearEff.crit.chance > 0, 'かいしんが きえた');
  }
});

test('むかしの セーブ（1たいに 1つ）でも うごく', () => {
  const g = GEARS.find(x => x.eff.hp);
  const base = defWith('tankun', null);
  const old  = defWith('tankun', g.id);        // もじで わたす ＝ むかしの かたち
  assert.strictEqual(old.hp, Math.round(base.hp * g.eff.hp), 'むかしの セーブが きかない');
});

test('からっぽの そうびでも こわれない', () => {
  const base = defWith('tankun', null);
  assert.strictEqual(defWear('tankun', {}).hp, base.hp);
  assert.strictEqual(defWear('tankun', { body: null, foot: null, weapon: null }).hp, base.hp);
  assert.strictEqual(defWear('tankun', { body: 'nai-gear' }).hp, base.hp);
});

console.log('ステータスの がめん');

test('がめんと ボタンが ある', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const main = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  ['screen-status', 'status-name', 'status-canvas', 'status-stats', 'status-slots',
   'status-col-l', 'status-col-r', 'status-atk', 'status-hp', 'status-bag',
   'btn-status-back', 'btn-status-change', 'btn-status-sort', 'btn-status-fuse',
   'char-modal', 'char-grid', 'btn-char-close']
    .forEach(id => assert.ok(html.indexOf('id="' + id + '"') >= 0, id + ' が index.html に ない'));
  assert.ok(html.indexOf('id="btn-party-status"') >= 0, 'へんせいに そうびの ボタンが ない');
  assert.ok(/function openStatus/.test(main), 'ステータスの がめんが ない');
  assert.ok(/function buildStatus/.test(main), 'ちゅうみが つくられない');
  assert.ok(/bagFilter = \(bagFilter === sid\) \? null : sid;/.test(main),
    'わくを おしても その ばしょの そうびに しぼれない');
  assert.ok(/btn-party-status'\)\.addEventListener/.test(main), 'ボタンが つながって いない');
  /* ふるい「そうびを えらぶ まど」は もう つかって いない */
  assert.ok(html.indexOf('gear-modal') < 0, 'つかって いない まどが のこって いる');
  assert.ok(main.indexOf('openGearPick') < 0, 'つかって いない しくみが のこって いる');
});

test('むかしの セーブを 3かしょの かたちに なおして いる', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  assert.ok(/typeof v === 'string'[\s\S]{0,260}o\[g\.slot \|\| 'body'\] = v;/.test(main),
    'ひきつぎの しょりが ない');
});

console.log('レア度');

test('レア度が 4だんかい あって、ぜんぶの そうびに ついて いる', () => {
  assert.ok(RANKS && RANK_ORDER && RANK_ORDER.length === 4,
    'レア度が ' + (RANK_ORDER || []).length + 'だんかい');
  RANK_ORDER.forEach(k => {
    const r = RANKS[k];
    assert.ok(r && r.label && /^#[0-9a-f]{6}$/i.test(r.color), k + ' の いろか なまえが へん');
    assert.ok(!/[A-Za-z]/.test(r.label), k + ' の なまえが にほんごで ない');
  });
  GEARS.forEach(g => assert.ok(RANKS[g.rank], g.id + ' の レア度が へん: ' + g.rank));
});

test('レア度が たかい そうびほど つくるのに そうびのもとが いる', () => {
  const avg = {};
  RANK_ORDER.forEach(k => {
    const list = GEARS.filter(g => g.rank === k);
    if (!list.length) return;
    avg[k] = list.reduce((a, g) => a + (g.cost.core || 0), 0) / list.length;
  });
  let prev = 0;
  RANK_ORDER.forEach(k => {
    if (avg[k] === undefined) return;
    assert.ok(avg[k] >= prev, k + ' の そうびのもとが まえの レア度より すくない');
    prev = avg[k];
  });
  assert.ok((avg.SP || 9) > (avg.N || 0), 'とくべつと ノーマルで おなじ ねだん');
});

test('どの レア度も そこそこ ある', () => {
  RANK_ORDER.forEach(k => {
    const n = GEARS.filter(g => g.rank === k).length;
    assert.ok(n >= 3, RANKS[k].label + ' が ' + n + 'こ しか ない');
  });
});

console.log('合成（おなじ そうび 3つで レベルアップ）');

test('合成の せっていが そろって いる', () => {
  assert.ok(FUSE && FUSE.need >= 2 && FUSE.maxLv >= 2 && FUSE.step > 0, 'GEAR_FUSE が へん');
  assert.ok(FUSE.maxLv <= 9 && FUSE.step <= 0.5, 'つよく なりすぎ');
});

test('レベルが あがると こうかが つよく なる（ばいりつ）', () => {
  const g = GEARS.find(x => x.eff.hp && x.eff.hp > 1.2);
  Game.gearLv = {};
  const lv1 = defWear('tankun', { [g.slot]: g.id }).hp;
  Game.gearLv = { [g.id]: FUSE.maxLv };
  const lvM = defWear('tankun', { [g.slot]: g.id }).hp;
  Game.gearLv = {};
  const base = defWith('tankun', null).hp;
  const want = Math.round(base * (1 + (g.eff.hp - 1) * (1 + (FUSE.maxLv - 1) * FUSE.step)));
  assert.ok(lvM > lv1, 'レベルを あげても かわらない（' + lv1 + ' → ' + lvM + '）');
  assert.strictEqual(lvM, want, 'けいさんが あわない（' + lvM + ' ／ ' + want + '）');
});

test('レベルが あがると きょり・かいしん・とくいな あいても つよく なる', () => {
  const gr = GEARS.find(x => x.eff.range);
  Game.gearLv = {}; const r1 = defWear('akibou', { [gr.slot]: gr.id }).range;
  Game.gearLv = { [gr.id]: FUSE.maxLv }; const r5 = defWear('akibou', { [gr.slot]: gr.id }).range;
  assert.ok(r5 > r1, 'きょりが のびない');

  const gc = GEARS.find(x => x.eff.crit);
  Game.gearLv = {}; const c1 = defWear('tankun', { [gc.slot]: gc.id }).gearEff.crit.chance;
  Game.gearLv = { [gc.id]: FUSE.maxLv }; const c5 = defWear('tankun', { [gc.slot]: gc.id }).gearEff.crit.chance;
  assert.ok(c5 > c1, 'かいしんが ふえない');

  const gv = GEARS.find(x => x.eff.vs);
  Game.gearLv = {}; const v1 = defWear('tankun', { [gv.slot]: gv.id }).gearEff.vsList[0].mult;
  Game.gearLv = { [gv.id]: FUSE.maxLv }; const v5 = defWear('tankun', { [gv.slot]: gv.id }).gearEff.vsList[0].mult;
  assert.ok(v5 > v1, 'とくいな あいてに つよく ならない');
  Game.gearLv = {};
});

test('レベルを あげても こわれない（ぜんぶの そうび × ぜんぶの レベル）', () => {
  let n = 0;
  GEARS.forEach(g => {
    for (let lv = 1; lv <= FUSE.maxLv; lv++) {
      Game.gearLv = { [g.id]: lv };
      const d = defWear('tankun', { [g.slot]: g.id });
      n++;
      assert.ok(d.hp > 0 && d.atk >= 0 && d.cost >= 1 && d.recharge >= 0.5,
        g.id + ' の Lv' + lv + ' が へん');
      assert.ok(isFinite(d.speed) && d.speed >= 1, g.id + ' の はやさが へん');
    }
  });
  Game.gearLv = {};
  assert.ok(n >= 200, 'ためした かずが すくない（' + n + '）');
});

test('つきぬけは レベルを あげても ついた まま', () => {
  const g = GEARS.find(x => x.eff.pierce);
  if (!g) return;
  Game.gearLv = { [g.id]: FUSE.maxLv };
  assert.ok(defWear('tankun', { [g.slot]: g.id }).gearEff.pierce, 'つきぬけが きえた');
  Game.gearLv = {};
});

test('合成の しくみが main.js に ある', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  assert.ok(/function canFuse/.test(main) && /function doFuse/.test(main), '合成の しくみが ない');
  assert.ok(/gearFree\(gid\) >= FUSE\(\)\.need/.test(main),
    'つけて いる ぶんまで つかって しまう おそれ');
  assert.ok(/bag\[gid\] = Math\.max\(0, \(bag\[gid\] \|\| 0\) - \(FUSE\(\)\.need - 1\)\);/.test(main),
    '3つ あわせて 1つ のこる かたちに なって いない');
  assert.ok(/lvs\[gid\] = gearLv\(gid\) \+ 1;/.test(main), 'レベルが あがらない');
  assert.ok(/if \(!s\.gearLv\) s\.gearLv = \{\};/.test(main), 'セーブに レベルが ない');
  assert.ok(/Game\.gearLv = gearLvMap\(\);/.test(main), 'せんとうに レベルが つたわらない');
});

/* ====================================================================== */
console.log('');
console.log(passed + ' ok / ' + failed + ' NG');
process.exit(failed ? 1 : 0);
