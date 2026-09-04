/* ==========================================================================
   ごうのすけのゲーム  —  すうじの データ

   ★ ここだけ さわれば つよさを かえられます ★
   すうじを かえて ほぞん → ブラウザを リロード すれば すぐ はんえいされます
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. ぜんたいの ルール
   -------------------------------------------------------------------------- */
const CONFIG = {

  /* --- ぞくせいの あいしょう ---

     【わ その1】  みず → ほのお → くさ → みず
     【わ その2】  まじゅつし → パワー → けもの → まじゅつし
       ※ 2つの わ は べつべつ。わを またぐ くみあわせは 1ばい

     【メタル】  よわてんが 3つ ある かわりに きそのうりょくが たかい
       ほのお・まじゅつし・パワー の 3つに よわい
       メタルが とくいな あいては なし

     ※「む」は どの ぞくせいとも あいしょう なし                        */
  attrStrong: 2.5,   // ゆうりな とき ダメージ 2.5ばい
  attrWeak:   0.6,   // ふりな   とき ダメージ 0.6ばい

  /* --- さいしょに もっている おかね --- */
  startMoney: 250,

  /* --- おさいふ君（おかねの ちから）---
     レベルを あげると「おかねの じょうげん」と「たまる はやさ」が あがる  */
  wallet: {
    maxLevel:    8,                                                       // Lv1 〜 Lv9
    capacity:   [  700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200 ], // おかねの じょうげん
    income:     [   38,   52,   68,   86,  106,  128,  152,  180,  215 ], // 1びょうに たまる おかね
    upgradeCost:[  150,  300,  520,  820, 1200, 1700, 2400, 3200 ],       // レベルアップに ひつような おかね
  },

  /* --- ちゅどーん（ひっさつの たいほう）--- */
  chudon: {
    chargeTime: 22,    // びょう。ぜんぶ たまるまでの じかん
    damage:    650,    // いりょく
    knockback: 145,    // ふきとばす きょり
    range:     455,    // じぶんの しろから この きょりまでの てきに あたる
  },

  /* --- しろ --- */
  playerCastleHp: 4500,     // じぶんの しろの たいりょく
  castleDamageRate: 1.0,    // しろを なぐる ときの ダメージばいりつ（1.0 = そのまま）

  /* --- ノックバック（ふきとばし）--- */
  knockbackDistance: 46,    // うしろに さがる きょり
  knockbackTime:     0.45,  // さがるのに かかる じかん（びょう）

  /* --- せんじょうに だせる みかたの さいだいすう --- */
  maxAllies: 30,

  /* --- せんじょうの ひろさ と みえかた ---
     せんじょう ぜんたい（りょうほうの しろも ふくむ）が つねに 1がめんに おさまります。
     よこスクロールは しません。                                      */
  fieldLength: 1050,        // てきの しろ(ひだり) 〜 じぶんの しろ(みぎ) の きょり
                            //   ちいさくすると せっきんせんに なり けっちゃくが はやい
                            //   おおきくすると キャラが ちいさく うつる
  castleMargin: 180,        // しろを うつす ぶんの よゆう（さわらなくて OK）
  viewWidth:   0,           // 0 = じどう。もっと ひきで みたい ときだけ すうじを いれる
  charScale:   1.5,         // ふつうの キャラの おおきさ（おおきくすると みやすい）
  bossScale:   1.0,         // ボスだけの おおきさ（ボスは もともと おおきいので べつあつかい）
  tallestChar: 250,        // いちばん せの たかい キャラ（ボス）の たかさ。はみださない ように つかう
  groundLine:  0.62,        // じめんの たかさ（0 = うえ / 1 = した の ボタンのすぐうえ）
                            //   ちいさくすると キャラが うえに いって したに すきまが できる
};


/* --------------------------------------------------------------------------
   2. みかたキャラ（5たい）

   cost           …… しょうかんに ひつような おかね
   recharge       …… つぎに だせるまでの まちじかん（びょう）
   hp             …… たいりょく
   atk            …… こうげきりょく（1かいぶんの ダメージ）
   range          …… しゃてい（この きょりまで とどく）
   speed          …… いどうそくど（1びょうに すすむ きょり）
   attackInterval …… こうげきの かんかく（びょう）。ちいさいほど れんだ
   attackWindup   …… ふりかぶってから あたるまでの じかん（びょう）
   kbCount        …… なんかい ふきとばされるか（おおいほど ねばる）
   -------------------------------------------------------------------------- */
const UNITS = {

  /* ぷりおぷりねこ ── オレンジの ゼリーねこ / じゃまやく */
  purio: {
    id: 'purio', name: 'ぷりおぷりねこ', shortName: 'ぷりお',
    attr: 'none',
    cost: 90,   recharge: 3.5,
    hp: 560,    atk: 34,   range: 101,  speed: 22,
    attackInterval: 1.3,   attackWindup: 0.35,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',        // single = ひとりだけ / area = はんい
    projectile: 'jelly',         // とばす たまの しゅるい（null なら なぐる）
    /* とくしゅのうりょく：あてた てきの スピードを はんぶんに する */
    slow: { rate: 0.5, duration: 4.0, chance: 1.0 },  // rate 0.5 → はやさ はんぶん / 4びょう / 100%
  },

  /* タンクン ── よこながの みずいろ せんしゃねこ / かべやく */
  tankun: {
    id: 'tankun', name: 'タンクン', shortName: 'タンクン',
    attr: 'none',
    cost: 75,   recharge: 2.4,
    hp: 1400,   atk: 22,   range: 62,   speed: 26,
    attackInterval: 1.6,   attackWindup: 0.30,
    kbCount: 4,
    scale: 1.05,
    attackType: 'single',
    projectile: null,
  },

  /* テルテル君 ── みずいろの てるてるぼうず / えんきょり（ガラスの たいほう） */
  teruteru: {
    id: 'teruteru', name: 'テルテル君', shortName: 'テルテル',
    attr: 'water',
    cost: 380,  recharge: 9.0,
    hp: 360,    atk: 90,   range: 184,  speed: 14,
    attackInterval: 2.6,   attackWindup: 0.45,
    kbCount: 2,
    scale: 1.0,
    attackType: 'single',
    projectile: 'drop',
    /* とくしゅのうりょく：しずくを 3れんげき */
    multiHit: { count: 3, delay: 0.16 },   // 3はつを 0.16びょう おきに とばす
  },

  /* 時の旅人 ── くろスーツの しょうねん / バランスがた */
  tokinotabibito: {
    id: 'tokinotabibito', name: '時の旅人', shortName: '旅人',
    attr: 'magic',                          // まじゅつし（パワーに つよい / けものに よわい）
    cost: 260,  recharge: 6.0,
    hp: 820,    atk: 155,  range: 131,  speed: 33,
    attackInterval: 1.8,   attackWindup: 0.35,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: 'clock',
    /* とくしゅのうりょく：20%の かくりつで てきを ふきとばす */
    knockbackChance: 0.20,
  },

  /* ひー坊 ── ほのおを まとった たかかりょく */
  hiibou: {
    id: 'hiibou', name: 'ひー坊', shortName: 'ひー坊',
    attr: 'fire',
    cost: 450,  recharge: 10.0,
    hp: 1450,   atk: 430,  range: 118,  speed: 24,
    attackInterval: 2.2,   attackWindup: 0.55,   // おおきく ふりかぶる
    kbCount: 3,
    scale: 1.1,
    attackType: 'area',                          // はんい こうげき
    areaRadius: 46,                              // ばくはつの おおきさ
    projectile: 'fireball',
  },

  /* ずにお ── しろい サイコロ。コロコロ ころがって すすむ。
             1の めから ビームを だして はんいこうげき。
             みず と けもの の てきだけ 50%で 2びょう とめる  */
  zunio: {
    id: 'zunio', name: 'ずにお', shortName: 'ずにお',
    attr: 'none',
    cost: 420,  recharge: 8.0,
    hp: 420,    atk: 300,  range: 150,  speed: 16,
    attackInterval: 4.0,   attackWindup: 0.5,    // クールタイム 4びょう
    kbCount: 2,
    scale: 1.0,
    attackType: 'area',                          // はんい こうげき
    areaRadius: 60,
    projectile: 'beam',
    rolls: true,                                 // ころがって いどうする
    /* とくしゅのうりょく：みず と けもの の てきを 50%で 2びょう とめる */
    stun: { duration: 2.0, chance: 0.5, attrs: ['water', 'beast'] },
  },
};

/* はじめから もっている キャラ（へんせいの しょきち）
   へんせいがめんで さいだい 10たい まで えらべます */
const PARTY_MAX = 10;
const DEFAULT_PARTY = ['tankun', 'purio', 'tokinotabibito', 'teruteru', 'hiibou', 'zunio'];
let PARTY = DEFAULT_PARTY.slice();   // いま せんとうに つれていく メンバー（へんせいで かわる）


/* --------------------------------------------------------------------------
   レベルアップ

   キャラは Lv1 から Lv10 まで。けいけんちを つかって あげます。
   1レベル あがるごとに たいりょくと こうげきりょくが ふえます。
   -------------------------------------------------------------------------- */
const LEVEL = {
  max: 10,
  /* Lv1→2, Lv2→3, … Lv9→10 に ひつような けいけんち */
  expCost: [80, 120, 180, 260, 360, 500, 700, 950, 1300],
  gainPerLevel: 0.10,      // 1レベルで +10%。Lv10 で 1.9ばい
};

/* レベルから つよさの ばいりつを だす */
function levelMult(lv) {
  const L = Math.max(1, Math.min(LEVEL.max, lv || 1));
  return 1 + (L - 1) * LEVEL.gainPerLevel;
}

/* つぎの レベルまでに ひつような けいけんち（MAXなら null）*/
function levelUpCost(lv) {
  const L = Math.max(1, Math.min(LEVEL.max, lv || 1));
  return (L >= LEVEL.max) ? null : LEVEL.expCost[L - 1];
}


/* --------------------------------------------------------------------------
   ガチャ
   -------------------------------------------------------------------------- */
const GACHA = {
  cost: 3,                 // 1かい ひくのに ひつような Gコイン
  /* いまは けいけんちが あたります。
     あたらしい キャラが ふえたら ここに キャラを ついかできます  */
  prizes: [
    { weight: 60, rank: 'N',  color: '#90caf9', exp: 80  },
    { weight: 30, rank: 'R',  color: '#ffd54f', exp: 200 },
    { weight: 10, rank: 'SR', color: '#ff8a65', exp: 500 },
  ],
};


/* --------------------------------------------------------------------------
   3. てきキャラ（5たい）

   money …… たおすと もらえる おかね
             ぞくせいを もった てきほど おおく もらえます
   -------------------------------------------------------------------------- */
const ENEMIES = {

  /* ほのた ── まるい ひのたま。むれで くる */
  honota: {
    id: 'honota', name: 'ほのた',
    attr: 'fire',
    hp: 320,    atk: 62,   range: 63,   speed: 38,
    attackInterval: 1.2,   attackWindup: 0.25,
    kbCount: 3,
    scale: 0.9,
    attackType: 'single',
    projectile: null,
    money: 65,             // ぞくせい あり
  },

  /* トゲハヤさん ── しかくい はこがた ロボット */
  togehaya: {
    id: 'togehaya', name: 'トゲハヤさん',
    attr: 'none',
    hp: 950,    atk: 155,  range: 68,   speed: 24,
    attackInterval: 1.6,   attackWindup: 0.30,
    kbCount: 4,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    money: 40,             // む ぞくせい なので すくなめ
  },

  /* saba ── あおい さかな。ものすごい はやさで とっしんして くる
             もろいけど あたると いたい。かべを ようい してから むかえうつ */
  saba: {
    id: 'saba', name: 'saba',
    attr: 'water',
    hp: 260,    atk: 260,  range: 55,   speed: 140,  // speed 140 = だんとつ さいそく
    attackInterval: 1.8,   attackWindup: 0.22,
    kbCount: 2,
    scale: 1.0,
    attackType: 'area',                              // とっしんの はんい こうげき
    areaRadius: 55,
    projectile: null,
    money: 95,             // ぞくせい あり
  },

  /* 字一龍（じーりゅう）── みどりの りゅう。「字」を はいて こうげき
                          ボスでは ないけど かなり つよい ちゅうボス */
  jiryu: {
    id: 'jiryu', name: '字一龍',
    attr: 'beast',
    hp: 2600,   atk: 320,  range: 100,  speed: 34,
    attackInterval: 3.0,   attackWindup: 0.45,
    kbCount: 3,
    scale: 1.2,
    attackType: 'single',
    projectile: 'moji',                              // 字を はく
    /* とくしゅのうりょく：50%の かくりつで 2びょうかん どんそくに する */
    slow: { rate: 0.5, duration: 2.0, chance: 0.5 },
    money: 220,            // ぞくせい あり ＆ つよい
  },

  /* 下手なきりん ── ボス。くさを とばす はんいこうげき */
  hetakirin: {
    id: 'hetakirin', name: '下手なきりん',
    attr: 'grass',
    hp: 4200,   atk: 700,  range: 135,  speed: 10,
    attackInterval: 3.0,   attackWindup: 0.6,
    kbCount: 4,
    scale: 1.35,
    attackType: 'area',
    areaRadius: 52,
    projectile: 'grass',
    money: 800,
    isBoss: true,
  },

  /* コンガラガーン ── あおい しかくい あたま と オレンジの からだ。
                      みずいろの やじるしの てを のばして こうげきする。
                      メタルぞくせい：ほのお・まじゅつし・パワー に よわい かわりに
                      きそのうりょくが たかい。字一龍 と むれで やってくる  */
  kongaragan: {
    id: 'kongaragan', name: 'コンガラガーン',
    attr: 'metal',
    hp: 1800,   atk: 430,  range: 120,  speed: 45,
    attackInterval: 2.2,   attackWindup: 0.45,   // てを のばす
    kbCount: 3,
    scale: 1.15,
    attackType: 'single',
    projectile: null,                            // ちょくせつ てを のばして なぐる
    /* とくしゅのうりょく：60%の かくりつで クリティカル（ダメージ 2ばい）*/
    crit: { chance: 0.60, mult: 2.0 },
    money: 160,
  },

  /* お菓子マン ── さいごの おおボス。
                 あたまの うえの いしを とばして こうげきする。
                 パワーぞくせい なので「まじゅつし」の 時の旅人 が とても よく きく！ */
  okashiman: {
    id: 'okashiman', name: 'お菓子マン',
    attr: 'power',
    hp: 9000,   atk: 900,  range: 115,  speed: 9,
    attackInterval: 2.0,   attackWindup: 1.0,   // おおきく ふりかぶって いしを なげる
    kbCount: 4,
    scale: 1.40,
    attackType: 'single',
    projectile: 'stone',
    /* とくしゅのうりょく：30%の かくりつで 1びょうかん うごきを とめる */
    stun: { duration: 1.0, chance: 0.30 },
    money: 1200,
    isBoss: true,
  },
};

/* --------------------------------------------------------------------------
   4. はいけい（せんじょうの みため）

   ステージごとに bg で えらびます。いろを かえれば みためが かわります。
   sky …… そらの いろ（うえ → まんなか → したの 3しょく）
   -------------------------------------------------------------------------- */
const BACKGROUNDS = {

  /* はれた くさはら */
  meadow: {
    sky: ['#5ec8f5', '#bde8fb', '#f3f7c9'],
    hillFar: '#9ccc65', hillNear: '#7cb342',
    ground: '#8d6e3a', groundTop: '#a1874a',
    deco: 'cloud',
  },

  /* ゆうやけ */
  sunset: {
    sky: ['#e2492d', '#ff8a4c', '#ffd9a0'],
    hillFar: '#8d6e63', hillNear: '#4e342e',
    ground: '#5d4037', groundTop: '#795548',
    deco: 'sun',
  },

  /* みずべ */
  water: {
    sky: ['#26c6da', '#9fe6ef', '#e0f7fa'],
    hillFar: '#4db6ac', hillNear: '#00897b',
    ground: '#2f7fa8', groundTop: '#4fa8d8',
    deco: 'wave',
  },

  /* しゃしんの はいけい（js/bg-photo.js の がぞうを なまえで えらぶ）*/
  mori: {
    photo: 'mori',                 // みどりの もり
    ground: '#4a6b2a', groundTop: '#6b9e3a',
    deco: 'none',
  },
  mizu: {
    photo: 'mizu',                 // すいそう（さかなの かわ）
    ground: '#3d6b86', groundTop: '#59a0c2',
    deco: 'wave',
  },

  /* いわば */
  rock: {
    sky: ['#8c9aa5', '#c3ced6', '#e8edf0'],
    hillFar: '#7a8a95', hillNear: '#54626c',
    ground: '#5c5c5c', groundTop: '#787878',
    deco: 'rock',
  },

  /* よるの もり */
  night: {
    sky: ['#080f2b', '#152352', '#2c3e7a'],
    hillFar: '#16352a', hillNear: '#0c2019',
    ground: '#241c14', groundTop: '#382b1e',
    deco: 'star',
  },

  /* はがねの せんじょう（メタルぐんだん）*/
  steel: {
    sky: ['#2b3a45', '#5d7f92', '#c3d3db'],
    hillFar: '#54707f', hillNear: '#354a56',
    ground: '#3f4b52', groundTop: '#5b6b74',
    deco: 'rock',
  },

  /* ボスの ステージ */
  boss: {
    sky: ['#3b0d5e', '#7b2c9e', '#d59ae0'],
    hillFar: '#5c1a7d', hillNear: '#3b0d5e',
    ground: '#43291f', groundTop: '#5e3b2c',
    deco: 'ember',
  },
};


/* --------------------------------------------------------------------------
   5. ステージ と コース

   「ステージ」＝ おおきな くぎり（だい1ステージ・だい2ステージ …）
   「コース」  ＝ その なかの 1かいぶんの たたかい
   1つの ステージに 7コース いれる よていです。
   コースを ふやす ときは、したの ならびに 1つ コピーして
   no（とおしばんごう）・chapter・course・reward を なおして ください。

   waves の かきかた
     at         …… なんびょうごに でるか
     id         …… ENEMIES の なまえ
     count      …… なんたい でるか
     gap        …… なんびょう おきに でるか
     repeat     …… なんびょう おきに くりかえすか（なくても OK）
     atCastleHp …… てきの しろの たいりょくが この わりあい いかに なったら でる
     bg         …… はいけい（BACKGROUNDS の なまえ）
   -------------------------------------------------------------------------- */
const STAGES = [
  {
    no: 1,
    chapter: 1,  course: 1,       // だい1ステージ の 1コースめ
    reward: { coins: 3, exp: 60 },   // チュートリアルなので Gコイン おおめ
    name: 'はじまりの みち',
    desc: 'トゲハヤさん が でてくるよ',
    bg: 'meadow',
    castleHp: 1300,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 16, id: 'togehaya', count: 1 },
      { at: 30, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 50, id: 'togehaya', count: 2, gap: 2.5, repeat: 22 },
    ],
  },

  {
    no: 2,
    chapter: 1,  course: 2,       // だい1ステージ の 2コースめ
    reward: { coins: 1, exp: 90 },
    name: 'ひのたま だいぐんだん',
    desc: 'ほのた の むれが おしよせる',
    bg: 'sunset',
    castleHp: 2400,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 12, id: 'honota',   count: 3, gap: 0.5 },
      { at: 26, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 38, id: 'honota',   count: 3, gap: 0.5 },
      { at: 52, id: 'togehaya', count: 2, gap: 2.0, repeat: 20 },
      { at: 62, id: 'honota',   count: 3, gap: 0.5, repeat: 18 },
    ],
  },

  {
    no: 3,
    chapter: 1,  course: 3,       // だい1ステージ の 3コースめ
    reward: { coins: 1, exp: 120 },
    name: 'さかなの かわ',
    desc: 'saba が すごい はやさで とっしんしてくる',
    bg: 'mizu',
    castleHp: 3000,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 15, id: 'saba',     count: 1 },
      { at: 28, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 40, id: 'saba',     count: 2, gap: 1.4 },
      { at: 54, id: 'togehaya', count: 2, gap: 2.0, repeat: 21 },
      { at: 66, id: 'saba',     count: 2, gap: 1.4, repeat: 19 },
    ],
  },

  {
    no: 4,
    chapter: 1,  course: 4,       // だい1ステージ の 4コースめ
    reward: { coins: 1, exp: 150 },
    name: 'みどりの もり',
    desc: 'ほのた と saba の こんせい ぐんだん',
    bg: 'mori',
    castleHp: 3600,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 13, id: 'honota',   count: 3, gap: 0.5 },
      { at: 26, id: 'saba',     count: 2, gap: 1.4 },
      { at: 38, id: 'togehaya', count: 2, gap: 1.8 },
      { at: 50, id: 'honota',   count: 4, gap: 0.5, repeat: 19 },
      { at: 60, id: 'saba',     count: 2, gap: 1.4, repeat: 21 },
      { at: 72, id: 'togehaya', count: 2, gap: 2.0, repeat: 24 },
    ],
  },

  {
    no: 5,
    chapter: 1,  course: 5,       // だい1ステージ の 5コースめ
    reward: { coins: 1, exp: 180 },
    name: 'いわばの みち',
    desc: '字一龍 とうじょう！ ボスでは ないけど つよい',
    bg: 'rock',
    castleHp: 4200,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 16, id: 'honota',   count: 3, gap: 0.5 },
      { at: 26, id: 'jiryu',    count: 1 },
      { at: 48, id: 'togehaya', count: 2, gap: 2.0, repeat: 21 },
      { at: 58, id: 'jiryu',    count: 1, repeat: 30 },
      { at: 74, id: 'honota',   count: 3, gap: 0.5, repeat: 20 },
    ],
  },

  {
    no: 6,
    chapter: 1,  course: 6,       // だい1ステージ の 6コースめ
    reward: { coins: 1, exp: 210 },
    name: 'よるの もり',
    desc: 'ボス 下手なきりん が まちうける',
    bg: 'night',
    castleHp: 4800,
    waves: [
      { at: 3,  id: 'saba',     count: 1 },
      { at: 13, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 28, id: 'jiryu',    count: 1 },
      { at: 42, id: 'saba',     count: 3, gap: 1.2 },
      { at: 54, id: 'honota',   count: 4, gap: 0.5, repeat: 19 },
      { at: 64, id: 'jiryu',    count: 1, repeat: 34 },
      { at: 76, id: 'saba',     count: 2, gap: 1.4, repeat: 21 },
      /* ボスは てきの しろが 80% まで へると でてくる */
      { atCastleHp: 0.80, id: 'hetakirin', count: 1 },
    ],
  },

  {
    no: 7,
    chapter: 1,  course: 7,       // だい1ステージ の 7コースめ
    reward: { coins: 1, exp: 260 },
    name: 'おかしマンの しろ',
    desc: 'さいご の おおボス お菓子マン。まじゅつし が よく きく！',
    bg: 'boss',
    castleHp: 4300,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 14, id: 'honota',   count: 3, gap: 0.5 },
      { at: 28, id: 'saba',     count: 2, gap: 1.4 },
      { at: 42, id: 'jiryu',    count: 1 },
      { at: 58, id: 'togehaya', count: 2, gap: 2.0, repeat: 28 },
      { at: 68, id: 'honota',   count: 4, gap: 0.5, repeat: 26 },
      { at: 82, id: 'saba',     count: 2, gap: 1.4, repeat: 27 },
      { at: 96, id: 'jiryu',    count: 1, repeat: 55 },
      /* ちゅうボス → おおボス の 2だんがまえ */
      { atCastleHp: 0.90, id: 'hetakirin', count: 1 },
      { atCastleHp: 0.60, id: 'okashiman', count: 1 },
    ],
  },

  {
    no: 8,
    chapter: 2,  course: 1,       // だい2ステージ の 1コースめ
    reward: { coins: 1, exp: 300 },
    name: 'はがねの ぐんだん',
    desc: 'コンガラガーン とうじょう！ メタルは ほのお・まじゅつし・パワー に よわい',
    bg: 'steel',
    castleHp: 6000,
    waves: [
      { at: 3,   id: 'togehaya',   count: 1 },
      { at: 14,  id: 'saba',       count: 2, gap: 1.4 },
      { at: 27,  id: 'kongaragan', count: 1 },
      { at: 40,  id: 'jiryu',      count: 1 },
      { at: 52,  id: 'kongaragan', count: 3, gap: 1.8, repeat: 26 },
      { at: 66,  id: 'honota',     count: 4, gap: 0.5, repeat: 24 },
      { at: 78,  id: 'jiryu',      count: 1, repeat: 36 },
      { at: 94,  id: 'saba',       count: 2, gap: 1.4, repeat: 28 },
      /* さいしゅう ステージ：ボスが 2たい でてくる */
      { atCastleHp: 0.85, id: 'hetakirin', count: 1 },
      { atCastleHp: 0.55, id: 'okashiman', count: 1 },
    ],
  },
];


/* --------------------------------------------------------------------------
   6. ぞくせいの あいしょう（さわらなくて OK）
   -------------------------------------------------------------------------- */
/* 「A は B に つよい」の いちらん（1つでも、いくつでも かけます）*/
const ATTR_BEATS = {
  /* わ その1 */
  water: ['fire'],            // みず   → ほのお
  fire:  ['grass', 'metal'],  // ほのお → くさ ／ メタル
  grass: ['water'],           // くさ   → みず
  /* わ その2 */
  magic: ['power', 'metal'],  // まじゅつし → パワー ／ メタル
  power: ['beast', 'metal'],  // パワー    → けもの ／ メタル
  beast: ['magic'],           // けもの    → まじゅつし
  /* メタルは とくいな あいてが いない */
  metal: [],
};

const ATTR_LABEL = {
  water: 'みず', fire: 'ほのお', grass: 'くさ',
  magic: 'まじゅつし', power: 'パワー', beast: 'けもの', metal: 'メタル',
  none: 'む',
};

const ATTR_COLOR = {
  water: '#4fc3f7', fire: '#ff7043', grass: '#8bc34a',
  magic: '#ba68c8', power: '#ffca28', beast: '#8d6e63', metal: '#78909c',
  none: '#bdbdbd',
};

/* こうげきする がわ → うける がわ の ダメージばいりつ */
function attrBeats(a, b) {
  const list = ATTR_BEATS[a];
  if (!list) return false;
  return (typeof list === 'string') ? (list === b) : (list.indexOf(b) >= 0);
}

function attrMultiplier(attacker, defender) {
  if (attrBeats(attacker, defender)) return CONFIG.attrStrong; // ゆうり
  if (attrBeats(defender, attacker)) return CONFIG.attrWeak;   // ふり
  return 1.0;
}
