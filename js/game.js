/* ==========================================================================
   ごうのすけのゲーム  —  ゲームの なかみ（ロジック と がめんの びょうが）

   ここは「しくみ」の ファイルです。
   つよさを かえたい ときは js/data.js を さわってください。
   ========================================================================== */

const Game = {

  /* ---------------- じょうたい ---------------- */
  active: false,
  paused: false,          // かくにん ポップアップ ちゅうは とめる
  finished: false,
  result: null,          // 'win' / 'lose'
  time: 0,
  stage: null,

  money: 0,
  walletLv: 0,
  chudonCharge: 0,

  playerCastle: { hp: 0, maxHp: 0 },
  enemyCastle:  { hp: 0, maxHp: 0 },

  units: [],
  projectiles: [],
  effects: [],
  spawnQueue: [],
  waves: [],
  cooldown: {},          // キャラごとの さいせいさん まちじかん
  boss: null,

  camera: { x: 0, target: 0, manualUntil: 0 },
  bgImages: null,         // はいけいの しゃしん（なまえごと）
  levels: {},             // みかたキャラの レベル（main.js が セットする）
  canvas: null, ctx: null,
  view: { w: 0, h: 0, scale: 1, groundY: 0 },
  hudHeight: 96,

  /* =====================================================================
     ゲームを はじめる
     ===================================================================== */
  start(stageOrCourse) {
    // ばんごうでも、コースそのものでも うけとれます（あき坊の塔 のように
    // STAGES に はいって いない コースにも たいおう するため）
    const st = (typeof stageOrCourse === 'number') ? STAGES[stageOrCourse] : stageOrCourse;
    this.stage = st;
    this.stageIndex = STAGES.indexOf(st);
    this.active = true;
    this.paused = false;
    this.finished = false;
    this.result = null;
    this.time = 0;

    this.money = CONFIG.startMoney;
    this.walletLv = 0;
    this.chudonCharge = 0;

    this.playerCastle = { hp: CONFIG.playerCastleHp, maxHp: CONFIG.playerCastleHp };
    this.enemyCastle  = { hp: st.castleHp,           maxHp: st.castleHp };

    this.units = [];
    this.projectiles = [];
    this.effects = [];
    this.spawnQueue = [];
    this.boss = null;
    this.cooldown = {};
    PARTY.forEach(id => { this.cooldown[id] = 0; });

    // ウェーブを コピーして じゅんび
    this.waves = st.waves.map(w => Object.assign({}, w, { done: false, nextAt: w.at }));

    this.camera.x = CONFIG.fieldLength / 2;
    this.camera.target = this.camera.x;
    this.camera.manualUntil = 0;
    this.laneCounter = 0;
    this.loadPhoto();
  },

  get moneyMax()  { return CONFIG.wallet.capacity[this.walletLv]; },
  get income()    { return CONFIG.wallet.income[this.walletLv]; },
  get walletCost(){ return this.walletLv >= CONFIG.wallet.maxLevel ? null : CONFIG.wallet.upgradeCost[this.walletLv]; },
  get chudonReady(){ return this.chudonCharge >= CONFIG.chudon.chargeTime; },

  allyCount() {
    let n = 0;
    for (const u of this.units) if (u.side === 'ally' && !u.dead) n++;
    return n;
  },

  /* =====================================================================
     プレイヤーの そうさ
     ===================================================================== */

  /* みかたを しょうかんする */
  summon(id) {
    const def = UNITS[id];
    if (!def || !this.active || this.finished) return false;
    if (this.cooldown[id] > 0) return false;
    if (this.money < def.cost) return false;
    if (this.allyCount() >= CONFIG.maxAllies) return false;   // だしすぎ ぼうし
    this.money -= def.cost;
    this.cooldown[id] = def.recharge;
    this.units.push(this.makeUnit(def, 'ally'));
    return true;
  },

  /* おさいふ君の レベルアップ */
  upgradeWallet() {
    const cost = this.walletCost;
    if (cost === null || this.money < cost) return false;
    this.money -= cost;
    this.walletLv++;
    this.addEffect({ type: 'dmg', x: CONFIG.fieldLength - 60, y: this.groundWorldY() - 120,
                     text: 'おさいふ君 Lv.' + (this.walletLv + 1), color: '#ffe082', life: 1.2, big: true });
    return true;
  },

  /* ちゅどーん はっしゃ */
  fireChudon() {
    if (!this.chudonReady || this.finished) return false;
    this.chudonCharge = 0;
    const c = CONFIG.chudon;
    const fromX = CONFIG.fieldLength;
    let hit = 0;
    for (const u of this.units) {
      if (u.side !== 'enemy' || u.dead) continue;
      if (fromX - u.x <= c.range) {
        this.damageUnit(u, c.damage, 'none', null, true);
        this.knockback(u, c.knockback);
        hit++;
      }
    }
    // えんしゅつ
    for (let i = 0; i < 14; i++) {
      const x = fromX - (i / 14) * c.range;
      this.addEffect({ type: 'boom', x: x, y: this.groundWorldY() - 30 - Math.random() * 40,
                       radius: 40 + Math.random() * 30, color: '#ffca28', life: 0.5 + Math.random() * 0.3,
                       delay: i * 0.022 });
    }
    return hit;
  },

  /* =====================================================================
     ユニットを つくる
     ===================================================================== */
  makeUnit(def, side) {
    /* コースが てきを つよく する ばあい（あき坊の塔 など）。
       ENEMIES の もとの データは さわらず、この たいだけの コピーを つくります */
    if (side === 'enemy' && this.stage && this.stage.enemyBuff && this.stage.enemyBuff[def.id]) {
      def = Object.assign({}, def, this.stage.enemyBuff[def.id]);
    }
    const forward = (side === 'ally') ? -1 : 1;
    const x = (side === 'ally')
      ? CONFIG.fieldLength - 40 - Math.random() * 20
      : 40 + Math.random() * 20;
    // みかたは レベルの ぶん、てきは コースの enemyMult の ぶん つよく なる
    let mul;
    if (side === 'ally') {
      const lv = this.levels[def.id] || 1;
      mul = (typeof levelMult === 'function') ? levelMult(lv) : 1;
    } else {
      mul = (this.stage && this.stage.enemyMult) ? this.stage.enemyMult : 1;
    }
    const lv = (side === 'ally') ? (this.levels[def.id] || 1) : 1;
    const hp  = Math.round(def.hp * mul);
    const atk = Math.round(def.atk * mul);
    return {
      side, def, forward, level: lv, atk: atk,
      hp: hp, maxHp: hp,
      x,
      lane: (this.laneCounter++ % 4) * 7,
      state: 'walk',
      t: Math.random() * 10,
      atkCd: 0,
      windup: -1,           // -1 = ふりかぶって いない
      burst: null,
      kbT: 0, kbFrom: 0, kbTo: 0,
      nextKb: def.kbCount - 1,   // つぎに ふきとぶ しきいち（のこり）
      slowUntil: -1, slowRate: 1, roll: 0,
      restT: 0, resting: false,     // きゅうけい（ひるね・ゼンマイぎれ）
      blindUntil: -1, blindRate: 0, // めくらまし（こうげきが はずれる）
      speedBonus: 0,                // みずもれ などで あがった はやさ
      healT: 0,                     // なかまを かいふく する タイマー
      windupDmg: 0,                 // タメちゅうに うけた ダメージ
      stunUntil: -1,
      dead: false,
      flash: 0,
    };
  },

  /* =====================================================================
     まいフレームの こうしん
     ===================================================================== */
  update(dt) {
    if (!this.active) return;
    if (dt > 0.1) dt = 0.1;               // タブを もどした ときの ワープぼうし
    if (!(dt > 0)) return;                // へんな じかんが きたら なにも しない
    this.time += dt;

    if (!this.finished) {
      // おかね
      this.money = Math.min(this.moneyMax, this.money + this.income * dt);
      // ちゅどーん チャージ
      this.chudonCharge = Math.min(CONFIG.chudon.chargeTime, this.chudonCharge + dt);
      // さいせいさん
      for (const id in this.cooldown) {
        if (this.cooldown[id] > 0) this.cooldown[id] = Math.max(0, this.cooldown[id] - dt);
      }
      this.updateWaves(dt);
    }

    for (const u of this.units) this.updateUnit(u, dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);

    // しんだ ユニットを かたづける
    this.units = this.units.filter(u => !u.dead);
    this.boss = this.units.find(u => u.def.isBoss && !u.dead) || null;

    this.updateCamera(dt);
    this.checkResult();
  },

  /* ---- てきの しゅつげん ---- */
  updateWaves(dt) {
    const ratio = this.enemyCastle.hp / this.enemyCastle.maxHp;
    for (const w of this.waves) {
      if (w.done) continue;
      let fire = false;
      if (w.atCastleHp !== undefined) {
        if (ratio <= w.atCastleHp) fire = true;
      } else if (this.time >= w.nextAt) {
        fire = true;
      }
      if (!fire) continue;

      const n = w.count || 1;
      const gap = w.gap || 0;
      for (let i = 0; i < n; i++) {
        this.spawnQueue.push({ at: this.time + i * gap, id: w.id });
      }
      if (w.repeat) { w.nextAt = this.time + w.repeat; }
      else { w.done = true; }
    }
    // よやくされた てきを だす
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
      if (this.time >= this.spawnQueue[i].at) {
        this.spawnEnemy(this.spawnQueue[i].id);
        this.spawnQueue.splice(i, 1);
      }
    }
  },

  spawnEnemy(id) {
    const def = ENEMIES[id];
    if (!def) return;
    const u = this.makeUnit(def, 'enemy');
    this.units.push(u);
    if (def.isBoss) {
      this.boss = u;
      this.addEffect({ type: 'dmg', x: 120, y: this.groundWorldY() - 150,
                       text: def.name + ' あらわる！', color: '#ff8a65', life: 2.0, big: true });
    }
  },

  /* ---- ユニット 1たいぶんの こうしん ---- */
  updateUnit(u, dt) {
    if (u.dead) return;
    u.t += dt;
    if (u.flash > 0) u.flash -= dt;

    // ふきとばされ ちゅう
    if (u.state === 'kb') {
      u.kbT += dt;
      const k = Math.min(1, u.kbT / CONFIG.knockbackTime);
      u.x = u.kbFrom + (u.kbTo - u.kbFrom) * k;
      if (k >= 1) { u.state = 'walk'; u.atkCd = Math.max(u.atkCd, 0.25); }
      return;
    }

    if (this.finished) return;

    /* --- じどう かいふく（リジェネ）--- */
    if (u.def.regen && u.hp < u.maxHp) {
      u.hp = Math.min(u.maxHp, u.hp + u.def.regen * dt);
    }

    /* --- ちかくの なかまを かいふく（モーモー・プラント）--- */
    if (u.def.heal && !u.resting) {
      u.healT += dt;
      if (u.healT >= u.def.heal.interval) {
        u.healT = 0;
        let healed = 0;
        for (const o of this.units) {
          if (o.dead || o.side !== u.side || o === u) continue;
          if (Math.abs(o.x - u.x) <= u.def.heal.radius && o.hp < o.maxHp) {
            o.hp = Math.min(o.maxHp, o.hp + u.def.heal.amount);
            this.addEffect({ type: 'healMark', x: o.x, y: this.groundWorldY() - 70 - o.lane, life: 0.8 });
            healed++;
          }
        }
        if (healed) {
          this.addEffect({ type: 'boom', x: u.x, y: this.groundWorldY() - 40,
                           radius: u.def.heal.radius * 0.5, color: '#a5d6a7', life: 0.45 });
        }
      }
    }

    /* --- きゅうけい（ひるね／ゼンマイぎれ）--- */
    if (u.def.rest) {
      u.restT += dt;
      if (u.resting) {
        if (u.restT >= u.def.rest.duration) { u.resting = false; u.restT = 0; }
        else { u.windup = -1; u.burst = null; return; }   // うごけない
      } else if (u.restT >= u.def.rest.every) {
        u.resting = true; u.restT = 0; u.windup = -1; u.burst = null;
        this.addEffect({ type: 'restMark', x: u.x, y: this.groundWorldY() - 85 - u.lane,
                         text: u.def.rest.mark || '💤', life: 1.0 });
        return;
      }
    }

    // うごきを とめられて いる（お菓子マンの いし）
    if (u.stunUntil > this.time) {
      u.windup = -1; u.burst = null;
      return;
    }

    if (u.atkCd > 0) u.atkCd -= dt;

    // 3れんげき などの れんぱつ しょり
    if (u.burst) {
      u.burst.timer -= dt;
      if (u.burst.timer <= 0) {
        this.fireShot(u);
        u.burst.left--;
        u.burst.timer = u.burst.delay;
        if (u.burst.left <= 0) u.burst = null;
      }
    }

    const target = this.findTarget(u);

    // ふりかぶり ちゅう
    if (u.windup >= 0) {
      u.windup += dt;
      if (u.windup >= u.def.attackWindup) {
        u.windup = -1;
        this.resolveAttack(u);
      }
      return;
    }

    if (target) {
      u.state = 'attack';
      if (u.atkCd <= 0 && !u.burst) { u.windup = 0; u.windupDmg = 0; }   // こうげき かいし
    } else {
      u.state = 'walk';
      let sp = u.def.speed;
      if (u.slowUntil > this.time) sp *= (u.slowRate || 0.5);
      if (u.def.stationary) { u.state = 'attack'; return; }   // その ばから うごかない
      if (u.blocked) { u.state = 'blocked'; return; }         // ふところに はいられて あわてて いる
      if (u.def.leak) {
        u.speedBonus = Math.min(u.def.leak.speedMax || 60, u.speedBonus + u.def.leak.speedGain * dt);
        u.hp -= u.def.leak.hpLoss * dt;
        if (u.hp <= 0) { u.hp = 0; this.killUnit(u); return; }
      }
      u.x += (sp + u.speedBonus) * u.forward * dt;
      u.x = Math.max(0, Math.min(CONFIG.fieldLength, u.x));
      if (u.def.rolls) u.roll += (sp * dt / 25) * -u.forward;   // コロコロ ころがる
    }
  },

  /* ---- こうげき あいてを さがす ---- */
  findTarget(u) {
    const range = u.def.range;

    /* --- そらを とぶ あいて（カモメェル）は かべを こえて
           いちばん おくに いる あいてを ねらう --- */
    if (u.def.flying) {
      let far = null, farDepth = -Infinity;
      for (const o of this.units) {
        if (o.dead || o.side === u.side) continue;
        const depth = o.x * u.forward;          // すすむ さきほど おおきい
        if (depth > farDepth) { far = o; farDepth = depth; }
      }
      if (far && Math.abs(far.x - u.x) <= range) return far;
      const cx = (u.side === 'ally') ? 0 : CONFIG.fieldLength;
      if (Math.abs(cx - u.x) <= range) return { castle: true, x: cx };
      return null;                              // かべに とまらず すすみつづける
    }

    /* --- ふところの まあい ---
       minRange より ちかくに あいてが 1たいでも はいると、
       ちかすぎて こうげきが できなく なります（獄熱オニごん）。
       その ばで あわてる だけで、まえにも すすみません          */
    const minR = u.def.minRange || 0;
    u.blocked = false;
    if (minR > 0) {
      for (const o of this.units) {
        if (o.dead || o.side === u.side) continue;
        if (Math.abs(o.x - u.x) < minR) { u.blocked = true; return null; }
      }
    }

    let best = null, bestDist = Infinity;
    for (const o of this.units) {
      if (o.dead || o.side === u.side) continue;
      const d = (o.x - u.x) * u.forward;          // まえに いれば プラス
      if (d < -25) continue;                      // うしろは むし
      const dist = Math.abs(o.x - u.x);
      if (dist < minR) continue;                  // ちかすぎる あいては ねらえない
      if (dist <= range && dist < bestDist) { best = o; bestDist = dist; }
    }
    // しろも あいて
    const castleX = (u.side === 'ally') ? 0 : CONFIG.fieldLength;
    const cd = Math.abs(castleX - u.x);
    if (cd >= minR && cd <= range && cd < bestDist) return { castle: true, x: castleX };
    return best;
  },

  /* ---- こうげきの しゅんかん ---- */
  resolveAttack(u) {
    u.atkCd = u.def.attackInterval;
    if (u.def.noAttack) return;          // かべくん は こうげき しない（たちはだかる だけ）
    if (u.def.multiHit) {
      u.burst = { left: u.def.multiHit.count, timer: 0, delay: u.def.multiHit.delay };
    } else {
      this.fireShot(u);
    }
  },

  /* ---- 1はつ うつ ---- */
  fireShot(u) {
    const target = this.findTarget(u);
    if (!target) return;
    const y = this.groundWorldY() - 40 - u.lane;

    if (u.def.projectile) {
      const speed = ({ drop: 560, clock: 520, fireball: 400, grass: 380, jelly: 460 })[u.def.projectile] || 480;
      this.projectiles.push({
        kind: u.def.projectile,
        x: u.x + 24 * u.forward, y: y - 14,
        vx: speed * u.forward,
        dir: u.forward,
        side: u.side,
        atk: (u.atk !== undefined ? u.atk : u.def.atk),
        attr: u.def.attr,
        area: u.def.attackType === 'area',
        areaRadius: u.def.areaRadius || 0,
        slow: u.def.slow || null,
        kbChance: u.def.knockbackChance || 0,
        stun: u.def.stun || null,
        blind: u.def.blind || null,
        crit: u.def.crit || null,
        age: 0, life: 3,
      });
    } else {
      // なぐる（たまなし）
      this.applyHit(u, target, u.x + (u.def.range * 0.6) * u.forward, y);
    }
  },

  /* ---- あたった ときの しょり ---- */
  applyHit(src, target, hx, hy) {
    // めくらまし ちゅうは こうげきが はずれる ことが ある
    if (src && src.blindUntil > this.time && Math.random() < (src.blindRate || 0)) {
      this.addEffect({ type: 'dmg', x: src.x, y: this.groundWorldY() - 90 - (src.lane || 0),
                       text: 'はずれ！', color: '#90caf9', life: 0.7 });
      return;
    }
    const isArea = src.def ? src.def.attackType === 'area' : src.area;
    const atk    = (src.atk !== undefined && src.atk !== null) ? src.atk : (src.def ? src.def.atk : 0);
    const attr   = src.def ? src.def.attr : src.attr;
    const side   = src.side;
    const radius = src.def ? (src.def.areaRadius || 0) : (src.areaRadius || 0);
    const slow   = src.def ? (src.def.slow || null) : (src.slow || null);
    const kbCh   = src.def ? (src.def.knockbackChance || 0) : (src.kbChance || 0);
    const stun   = src.def ? (src.def.stun || null) : (src.stun || null);
    const blind  = src.def ? (src.def.blind || null) : (src.blind || null);
    const crit   = src.def ? (src.def.crit || null) : (src.crit || null);

    if (target && target.castle) {
      const dmg = Math.round(atk * CONFIG.castleDamageRate);
      const castle = (side === 'ally') ? this.enemyCastle : this.playerCastle;
      castle.hp = Math.max(0, castle.hp - dmg);
      this.addEffect({ type: 'hit', x: target.x + (side === 'ally' ? 40 : -40), y: hy, seed: Math.random() * 6, life: 0.3, color: '#fff' });
      this.addEffect({ type: 'dmg', x: target.x + (side === 'ally' ? 40 : -40), y: hy - 10, text: String(dmg), color: '#fff', life: 0.7 });
      return;
    }
    if (!target) return;

    const victims = [];
    if (isArea) {
      const cx = target.x;
      for (const o of this.units) {
        if (o.dead || o.side === side) continue;
        if (Math.abs(o.x - cx) <= radius) victims.push(o);
      }
      this.addEffect({ type: 'boom', x: cx, y: hy, radius: radius, color: attr === 'grass' ? '#9ccc65' : '#ffa726', life: 0.45 });
    } else {
      victims.push(target);
    }

    for (const v of victims) {
      const mult = attrMultiplier(attr, v.def.attr);
      let dmg = Math.round(atk * mult);
      let isCrit = false;
      if (crit && Math.random() < ((crit.chance === undefined) ? 1 : crit.chance)) {
        // ignoreAttr の とき は「もとの こうげきりょく × ばいりつ」。
        // あいしょうの ゆうり／ふりは まったく けいさんに いれない
        dmg = crit.ignoreAttr ? Math.round(atk * (crit.mult || 2))
                              : Math.round(dmg * (crit.mult || 2));
        isCrit = true;
      }
      this.damageUnit(v, dmg, attr, mult, false, isCrit);
      if (slow && !v.dead) {
        const chance = (slow.chance === undefined) ? 1 : slow.chance;
        if (Math.random() < chance) {
          const wasSlow = v.slowUntil > this.time;
          v.slowUntil = this.time + slow.duration;    // かさねがけ なし（じかんを のばす だけ）
          v.slowRate = slow.rate;
          if (!wasSlow) {
            this.addEffect({ type: 'slowMark', x: v.x, y: this.groundWorldY() - 70, life: 0.9 });
          }
        }
      }
      if (blind && !v.dead && Math.random() < ((blind.chance === undefined) ? 1 : blind.chance)) {
        v.blindUntil = this.time + blind.duration;
        v.blindRate = blind.missRate || 0.3;
        this.addEffect({ type: 'slowMark', x: v.x, y: this.groundWorldY() - 70, life: 0.8 });
      }
      // 2ぞくせい もちは、どちらか 1つでも あてはまれば こうかが でる
      const stunOkAttr = stun && (!stun.attrs || attrList(v.def.attr).some(x => stun.attrs.indexOf(x) >= 0));
      if (stunOkAttr && !v.dead && Math.random() < ((stun.chance === undefined) ? 1 : stun.chance)) {
        v.stunUntil = this.time + stun.duration;
        this.addEffect({ type: 'stunMark', x: v.x, y: this.groundWorldY() - 78, life: 0.9 });
      }
      if (kbCh > 0 && !v.dead && Math.random() < kbCh) {
        this.knockback(v, CONFIG.knockbackDistance * 1.6);
        this.addEffect({ type: 'dmg', x: v.x, y: this.groundWorldY() - 95, text: 'ふきとび！', color: '#ffd54f', life: 0.8 });
      }
    }
  },

  /* ---- ダメージ ---- */
  damageUnit(u, dmg, attr, mult, noNumber, isCrit) {
    if (u.dead) return;

    /* ★きゅうしゅう：きめられた ぞくせいの こうげきは ダメージ 0。
       そのかわり おなじ ぶんだけ たいりょくが かいふく する          */
    const ab = u.def.absorb;
    // 2ぞくせい もちの こうげきは、りょうほうとも すいとれる ときだけ ダメージ 0
    if (ab && attr && ab.attrs && attrList(attr).every(x => ab.attrs.indexOf(x) >= 0)) {
      const heal = Math.max(1, Math.round(dmg * (ab.rate === undefined ? 1 : ab.rate)));
      const room = Math.max(0, u.maxHp - u.hp);
      const got  = Math.min(room, heal);
      u.hp += got;
      this.addEffect({ type: 'healMark', x: u.x, y: this.groundWorldY() - 72 - u.lane, life: 0.8 });
      this.addEffect({ type: 'dmg', x: u.x, y: this.groundWorldY() - 55 - u.lane,
                       text: got > 0 ? ('＋' + got) : 'すいとった！',
                       color: '#69f0ae', life: 0.75, big: true });
      return;
    }

    // きゅうけいちゅうは よけいに ダメージを うける
    if (u.resting && u.def.rest && u.def.rest.vuln) dmg = Math.round(dmg * u.def.rest.vuln);
    u.hp -= dmg;
    u.flash = 0.12;

    // タメちゅうに たくさん たたくと こうげきを キャンセルできる
    if (u.def.stagger && u.windup >= 0) {
      u.windupDmg += dmg;
      if (u.windupDmg >= u.def.stagger.damage) {
        u.windup = -1; u.windupDmg = 0;
        u.atkCd = Math.max(u.atkCd, u.def.attackInterval * 0.5);
        this.addEffect({ type: 'dmg', x: u.x, y: this.groundWorldY() - 100 - u.lane,
                         text: 'よろけた！', color: '#4fc3f7', life: 0.9, big: true });
      }
    }

    let color = '#ffffff';
    if (mult > 1.01) color = '#ff5252';
    else if (mult < 0.99 && mult > 0) color = '#90a4ae';
    if (isCrit) color = '#ffd54f';

    if (!noNumber) {
      this.addEffect({ type: 'dmg', x: u.x + (Math.random() - 0.5) * 14, y: this.groundWorldY() - 55 - u.lane,
                       text: (isCrit ? '★' : '') + dmg, color: color, life: isCrit ? 0.85 : 0.65,
                       big: isCrit || mult > 1.01 });
    }
    this.addEffect({ type: 'hit', x: u.x, y: this.groundWorldY() - 40 - u.lane, seed: Math.random() * 6, life: 0.25,
                     color: ATTR_COLOR[attrMain(attr)] || '#fff59d' });

    if (u.hp <= 0) {
      u.dead = true;
      if (u.side === 'enemy' && u.def.money) {
        const before = this.money;
        this.money = Math.min(this.moneyMax, this.money + u.def.money);
        const got = Math.round(this.money - before);
        if (got > 0) {
          this.addEffect({ type: 'dmg', x: u.x, y: this.groundWorldY() - 100,
                           text: '+' + got, color: '#ffd54f', life: 1.1, big: true });
        }
      }
      this.addEffect({ type: 'boom', x: u.x, y: this.groundWorldY() - 35, radius: 34 * (u.def.scale || 1),
                       color: '#eceff1', life: 0.4 });
      return;
    }
    // ノックバック はんてい
    const step = u.maxHp / u.def.kbCount;
    while (u.nextKb > 0 && u.hp <= step * u.nextKb) {
      u.nextKb--;
      this.knockback(u, CONFIG.knockbackDistance);
    }
  },

  /* たいりょくが 0 に なった ときの しょり（みずもれ など）*/
  killUnit(u) {
    if (u.dead) return;
    u.dead = true;
    this.addEffect({ type: 'boom', x: u.x, y: this.groundWorldY() - 35,
                     radius: 34 * (u.def.scale || 1), color: '#eceff1', life: 0.4 });
  },

  knockback(u, dist) {
    if (u.dead) return;
    if (u.def.stationary) return;   // ブロックの うえから おちない
    u.state = 'kb';
    u.kbT = 0;
    u.kbFrom = u.x;
    u.kbTo = Math.max(0, Math.min(CONFIG.fieldLength, u.x - dist * u.forward));
    u.windup = -1;
    u.burst = null;
  },

  /* ---- たまの こうしん ---- */
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += Math.sin(p.age * 8) * 0.4;

      let hit = null;
      for (const o of this.units) {
        if (o.dead || o.side === p.side) continue;
        if (Math.abs(o.x - p.x) <= 22) { hit = o; break; }
      }
      const castleX = (p.side === 'ally') ? 0 : CONFIG.fieldLength;
      const reachedCastle = (p.side === 'ally') ? (p.x <= castleX + 20) : (p.x >= castleX - 20);

      if (hit) {
        this.applyHit(p, hit, p.x, p.y);
        this.projectiles.splice(i, 1);
      } else if (reachedCastle) {
        this.applyHit(p, { castle: true, x: castleX }, p.x, p.y);
        this.projectiles.splice(i, 1);
      } else if (p.age > p.life) {
        this.projectiles.splice(i, 1);
      }
    }
  },

  /* ---- エフェクト ---- */
  addEffect(e) {
    e.age = -(e.delay || 0);
    e.life = e.life || 0.5;
    this.effects.push(e);
  },
  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.age += dt;
      if (e.age > e.life) this.effects.splice(i, 1);
    }
  },

  /* ---- カメラ ---- */
  updateCamera(dt) {
    // せんじょう ぜんたいが みえて いる ときは カメラを まんなかに こていする
    if (this.fieldFits()) {
      this.camera.x = CONFIG.fieldLength / 2;
      this.camera.target = this.camera.x;
      return;
    }
    if (this.time < this.camera.manualUntil) {
      this.camera.x = this.camera.target;
      return;
    }
    let focus = CONFIG.fieldLength - 250;
    let frontAlly = null, frontEnemy = null;
    for (const u of this.units) {
      if (u.dead) continue;
      if (u.side === 'ally'  && (frontAlly  === null || u.x < frontAlly))  frontAlly = u.x;
      if (u.side === 'enemy' && (frontEnemy === null || u.x > frontEnemy)) frontEnemy = u.x;
    }
    if (frontAlly !== null && frontEnemy !== null) focus = (frontAlly + frontEnemy) / 2;
    else if (frontAlly !== null) focus = frontAlly;
    else if (frontEnemy !== null) focus = frontEnemy;

    const half = (this.view.w / 2) / this.view.scale;
    focus = Math.max(-80 + half, Math.min(CONFIG.fieldLength + 80 - half, focus));
    if (half * 2 > CONFIG.fieldLength + 160) focus = CONFIG.fieldLength / 2;

    this.camera.x += (focus - this.camera.x) * Math.min(1, dt * 3.2);
    this.camera.target = this.camera.x;
  },

  panCamera(dxWorld) {
    if (this.fieldFits()) return;      // ぜんぶ みえて いる ときは うごかさない
    this.camera.target = Math.max(-100, Math.min(CONFIG.fieldLength + 100, this.camera.target - dxWorld));
    this.camera.x = this.camera.target;
    this.camera.manualUntil = this.time + 3.5;
  },

  /* ---- しょうはい ---- */
  checkResult() {
    if (this.finished) return;
    if (this.enemyCastle.hp <= 0)  { this.finished = true; this.result = 'win';  this.finishAt = this.time; }
    else if (this.playerCastle.hp <= 0) { this.finished = true; this.result = 'lose'; this.finishAt = this.time; }
  },

  /* =====================================================================
     びょうが
     ===================================================================== */
  resize() {
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.view.w = w;
    this.view.h = h;
    // じめんの いち
    const playH = h - this.hudHeight;
    const groundY = this.hudTop() + playH * CONFIG.groundLine;
    this.view.groundY = groundY;
    // よこ：せんじょう ぜんたい（しろも ふくむ）が おさまる おおきさ
    const byWidth  = w / this.worldWidth();
    // たて：いちばん おおきい ボスが うえに はみださない おおきさ
    const byHeight = Math.max(0.18, (groundY - this.hudTop()) / (CONFIG.tallestChar || 250));
    this.view.scale = Math.min(1.30, byWidth, byHeight);
  },

  /* よこに うつす べき ワールドの はば */
  worldWidth() {
    return Math.max(CONFIG.viewWidth || 0, CONFIG.fieldLength + CONFIG.castleMargin * 2);
  },

  /* せんじょう ぜんたいが がめんに おさまって いるか（おさまって いれば スクロールなし）*/
  fieldFits() {
    return this.view.w / this.view.scale >= CONFIG.fieldLength + CONFIG.castleMargin * 2 - 1;
  },
  _e: {},                            // エフェクトびょうが用の つかいまわし オブジェクト
  hudTopHeight: 48,
  hudTop() { return this.hudTopHeight || 48; },
  groundWorldY() { return 0; },     // ワールドy は つねに 0（じめん）

  worldToScreenX(wx) { return (wx - this.camera.x) * this.view.scale + this.view.w / 2; },
  screenToWorldX(sx) { return (sx - this.view.w / 2) / this.view.scale + this.camera.x; },

  render() {
    const ctx = this.ctx;
    const V = this.view;
    ctx.clearRect(0, 0, V.w, V.h);

    this.drawBackground(ctx);

    const gy = V.groundY;
    const s = V.scale;

    // しろ
    this.drawCastle(ctx, 0, 'enemy');
    this.drawCastle(ctx, CONFIG.fieldLength, 'player');

    // ユニット（うしろの レーンから）
    const list = this.units.slice().sort((a, b) => a.lane - b.lane);
    for (const u of list) this.drawUnit(ctx, u);

    // たま（ワールドy は じめんからの たかさ。マイナスが うえ）
    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(this.worldToScreenX(p.x), gy);
      ctx.scale(s, s);
      drawProjectile(ctx, { kind: p.kind, x: 0, y: p.y, age: p.age, dir: p.dir });
      ctx.restore();
    }

    // エフェクト
    for (const e of this.effects) {
      if (e.age < 0) continue;
      ctx.save();
      ctx.translate(this.worldToScreenX(e.x), gy);
      ctx.scale(s, s);
      this._e.age = e.age; this._e.life = e.life; this._e.type = e.type;
      this._e.x = 0; this._e.y = e.y || -40;
      this._e.radius = e.radius; this._e.color = e.color;
      this._e.text = e.text; this._e.big = e.big; this._e.seed = e.seed || 0;
      drawEffect(ctx, this._e);
      ctx.restore();
    }
  },

  /* はいけいの しゃしんを よみこむ（1かいだけ）*/
  loadPhoto() {
    if (this.bgImages) return;
    if (typeof Image === 'undefined' || typeof BG_PHOTOS === 'undefined') return;
    this.bgImages = {};
    for (const key in BG_PHOTOS) {
      const img = new Image();
      img.src = BG_PHOTOS[key];
      this.bgImages[key] = img;
    }
  },

  currentBg() {
    const key = (this.stage && this.stage.bg) || 'meadow';
    return BACKGROUNDS[key] || BACKGROUNDS.meadow;
  },

  drawBackground(ctx) {
    const V = this.view;
    const bg = this.currentBg();
    const img = (bg.photo && this.bgImages) ? this.bgImages[bg.photo] : null;

    if (img && img.complete && img.naturalWidth) {
      /* --- しゃしんの はいけい（ぜんたいに ひろげて まんなかを つかう）--- */
      const sc = Math.max(V.w / img.naturalWidth, V.groundY / img.naturalHeight);
      const w = img.naturalWidth * sc, h = img.naturalHeight * sc;
      ctx.drawImage(img, (V.w - w) / 2, (V.groundY - h) * 0.35, w, h);
      // キャラが みやすい ように すこし しろく かぶせる
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(0, 0, V.w, V.groundY);
    } else {
      /* --- そら --- */
      const sky = bg.sky || BACKGROUNDS.meadow.sky;
      const g = ctx.createLinearGradient(0, 0, 0, V.groundY);
      g.addColorStop(0, sky[0]);
      g.addColorStop(0.65, sky[1]);
      g.addColorStop(1, sky[2]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, V.w, V.groundY);

      this.drawDeco(ctx, bg.deco);

      /* --- とおくの やま（ゆっくり うごく）--- */
      const off = -this.camera.x * 0.25 * V.scale;
      ctx.fillStyle = bg.hillFar;
      for (let i = -1; i < 8; i++) {
        const bx = off + i * 320 * V.scale + V.w / 2;
        ctx.beginPath();
        ctx.moveTo(bx - 200 * V.scale, V.groundY);
        ctx.quadraticCurveTo(bx, V.groundY - 130 * V.scale, bx + 200 * V.scale, V.groundY);
        ctx.fill();
      }
      ctx.fillStyle = bg.hillNear;
      for (let i = -1; i < 10; i++) {
        const bx = off * 1.7 + i * 240 * V.scale + V.w / 2;
        ctx.beginPath();
        ctx.moveTo(bx - 150 * V.scale, V.groundY);
        ctx.quadraticCurveTo(bx, V.groundY - 70 * V.scale, bx + 150 * V.scale, V.groundY);
        ctx.fill();
      }
    }

    /* --- じめん --- */
    ctx.fillStyle = bg.ground;
    ctx.fillRect(0, V.groundY, V.w, V.h - V.groundY);
    ctx.fillStyle = bg.groundTop;
    ctx.fillRect(0, V.groundY, V.w, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    const step = 60 * V.scale;
    const sx = ((-this.camera.x * V.scale + V.w / 2) % step + step) % step;
    for (let x = sx - step; x < V.w; x += step) {
      ctx.fillRect(x, V.groundY + 12, step * 0.5, 5);
    }
    if (bg.deco === 'wave') {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        const y = V.groundY + 20 + r * 16;
        ctx.beginPath();
        for (let x = 0; x <= V.w; x += 12) {
          const yy = y + Math.sin((x / 30) + this.time * 2 + r) * 3;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
  },

  /* そらの かざり（ステージごとに かわる）*/
  drawDeco(ctx, kind) {
    const V = this.view, t = this.time;
    if (!kind || kind === 'none') return;

    if (kind === 'cloud') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 0.29 + t * 0.006) % 1.25 - 0.12) * V.w;
        const cy = V.groundY * (0.14 + (i % 3) * 0.14);
        const r = V.groundY * (0.07 + (i % 2) * 0.03);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.9, cy + r * 0.2, r * 0.75, 0, Math.PI * 2);
        ctx.arc(cx - r * 0.9, cy + r * 0.25, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'sun') {
      const cx = V.w * 0.5, cy = V.groundY * 0.82, r = V.groundY * 0.20;
      const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.4);
      g.addColorStop(0, 'rgba(255,241,118,0.95)');
      g.addColorStop(1, 'rgba(255,167,38,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff59d';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'star') {
      for (let i = 0; i < 26; i++) {
        const sx = ((i * 137.5) % 100) / 100 * V.w;
        const sy = ((i * 61.8) % 100) / 100 * V.groundY * 0.72;
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.6 + i));
        ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
        ctx.fillRect(sx, sy, 2, 2);
      }
      const mx = V.w * 0.78, my = V.groundY * 0.2, mr = V.groundY * 0.11;
      ctx.fillStyle = '#fff9c4';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = BACKGROUNDS.night.sky[0];
      ctx.beginPath(); ctx.arc(mx - mr * 0.42, my - mr * 0.28, mr * 0.92, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'rock') {
      ctx.fillStyle = 'rgba(84,98,108,0.55)';
      for (let i = 0; i < 6; i++) {
        const rx = ((i * 0.19 + 0.05) % 1) * V.w;
        const rh = V.groundY * (0.10 + (i % 3) * 0.05);
        ctx.beginPath();
        ctx.moveTo(rx - rh * 0.8, V.groundY);
        ctx.lineTo(rx - rh * 0.2, V.groundY - rh);
        ctx.lineTo(rx + rh * 0.35, V.groundY - rh * 0.7);
        ctx.lineTo(rx + rh * 0.9, V.groundY);
        ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'ember') {
      for (let i = 0; i < 18; i++) {
        const ex = ((i * 89.3) % 100) / 100 * V.w;
        const ey = V.groundY - ((t * (18 + i % 7) + i * 53) % (V.groundY * 0.95));
        const a = 0.25 + 0.45 * Math.abs(Math.sin(t * 2 + i));
        ctx.fillStyle = 'rgba(255,171,64,' + a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  },

  drawCastle(ctx, worldX, who) {
    const V = this.view, s = V.scale;
    const x = this.worldToScreenX(worldX);
    if (x < -260 || x > V.w + 260) return;
    ctx.save();
    ctx.translate(x, V.groundY);
    ctx.scale(s * CONFIG.charScale, s * CONFIG.charScale);
    if (who === 'enemy') ctx.scale(-1, 1);     // てきの しろは かがみ

    const ratio = (who === 'enemy' ? this.enemyCastle.hp / this.enemyCastle.maxHp
                                   : this.playerCastle.hp / this.playerCastle.maxHp);
    const base = who === 'enemy' ? '#b0464b' : '#4a7fb5';
    const light = who === 'enemy' ? '#e57373' : '#90caf9';

    // ひび（たいりょくが へると ふえる）
    ctx.fillStyle = base;
    roundRect(ctx, 6, -120, 96, 120, 8); ctx.fill();
    ctx.fillStyle = light;
    roundRect(ctx, 14, -112, 80, 40, 6); ctx.fill();
    ctx.fillStyle = '#37474f';
    roundRect(ctx, 30, -56, 44, 56, 6); ctx.fill();   // もん
    ctx.fillStyle = base;
    for (let i = 0; i < 4; i++) roundRect(ctx, 8 + i * 24, -134, 16, 18, 3), ctx.fill();

    // はた
    ctx.strokeStyle = '#616161'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(54, -134); ctx.lineTo(54, -172); ctx.stroke();
    ctx.fillStyle = who === 'enemy' ? '#ff8a65' : '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(54, -172);
    ctx.lineTo(54 + 34, -164 + Math.sin(this.time * 4) * 3);
    ctx.lineTo(54, -152);
    ctx.closePath(); ctx.fill();

    if (ratio < 0.7) {
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(20, -110); ctx.lineTo(34, -84); ctx.lineTo(24, -66); ctx.stroke();
    }
    if (ratio < 0.35) {
      ctx.beginPath(); ctx.moveTo(84, -104); ctx.lineTo(70, -80); ctx.lineTo(82, -60); ctx.stroke();
    }
    ctx.restore();
  },

  drawUnit(ctx, u) {
    const V = this.view, s = V.scale;
    const x = this.worldToScreenX(u.x);
    if (x < -150 || x > V.w + 150) return;

    const sc = s * (u.def.scale || 1) * (u.def.isBoss ? CONFIG.bossScale : CONFIG.charScale);
    let yoff = u.lane * 0.7 * s;
    if (u.def.flying) yoff -= 48 * s;      // そらを とんで いる
    if (u.state === 'kb') {
      const k = Math.min(1, u.kbT / CONFIG.knockbackTime);
      yoff -= Math.sin(k * Math.PI) * 26 * s;
    }

    const stunned = u.stunUntil > this.time;
    const resting = !!u.resting;
    ctx.save();
    ctx.translate(x + (stunned ? Math.sin(this.time * 40) * 2 : 0), V.groundY + yoff);

    // かげ
    ctx.save();
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    // スローの あかし（ゼリーの みずたまり）
    if (u.slowUntil > this.time) {
      ctx.fillStyle = 'rgba(255,152,40,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 1, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    ctx.scale(sc, sc);
    if (resting) { ctx.translate(0, 6); ctx.rotate(0.22); }   // きゅうけいちゅうは ころんで いる
    if (u.side === 'ally') ctx.scale(-1, 1);      // みかたは ひだりむき

    const drawer = DRAWERS[u.def.id];
    if (drawer) {
      const st = {
        t: u.t,
        moving: u.state === 'walk',
        atk: u.windup >= 0 ? Math.min(1, u.windup / u.def.attackWindup) : -1,
        hpRatio: u.hp / u.maxHp,
        roll: u.roll || 0,
        blocked: !!u.blocked,          // ふところに はいられて あわてて いる
        // うった ちょくご（クールタイムの さいしょ 35%）は「バタバタ」の あいだ
        fired: (u.atkCd > (u.def.attackInterval || 1) * 0.65),
      };
      if (u.flash > 0) {
        ctx.save();
        drawer(ctx, st);
        ctx.restore();
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'lighter';
        drawer(ctx, st);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      } else {
        drawer(ctx, st);
      }
    }
    ctx.restore();
  },
};
