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
    rarity: 'N',                          // ノーマル
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
    rarity: 'N',                          // ノーマル
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
    rarity: 'N',                          // ノーマル
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
    rarity: 'R',                          // レア
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
    rarity: 'SR',                          // スーパーレア
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

  /* かべくん ── ちゃいろい かべ。こうげきは まったく しない かわりに
                たいりょくが ものすごく たかい。はやく はしって いって
                てきの まえに たちはだかる、まもり せんもんの なかま  */
  kabekun: {
    id: 'kabekun', name: 'かべくん', shortName: 'かべくん',
    rarity: 'R',                          // レア
    attr: 'power',                        // パワー（けものに つよい／まじゅつしに よわい）
    cost: 400,  recharge: 12.0,
    hp: 5000,   atk: 0,    range: 78,   speed: 60,
    attackInterval: 2.0,   attackWindup: 0.3,
    kbCount: 5,                           // なかなか ふきとばされない
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    noAttack: true,                       // ★ こうげき しない（たちはだかる だけ）
  },

  /* ずにお ── しろい サイコロ。コロコロ ころがって すすむ。
             1の めから ビームを だして はんいこうげき。
             みず と けもの の てきだけ 50%で 2びょう とめる  */
  zunio: {
    id: 'zunio', name: 'ずにお', shortName: 'ずにお',
    rarity: 'R',                          // レア
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
/* はじめから もっている キャラ（のこりは ガチャで あつめます）*/
const START_CHARS = ['tankun', 'purio'];
const DEFAULT_PARTY = START_CHARS.slice();
/* ガチャに でてくる キャラ ぜんぶ */
const ALL_CHARS = ['tankun', 'purio', 'teruteru', 'tokinotabibito', 'zunio', 'kabekun', 'hiibou'];
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

/* レベルから つよさの ばいりつを だす
   じょうげんかいほう(＋)の ぶんも「レベルが あがったのと おなじ」に なります。
   けいけんちレベル 10 ＋ かいほう 30 = じつりょく Lv.40（4.9ばい）が さいだい  */
function levelMult(lv) {
  const cap = LEVEL.max + ((typeof GACHA !== 'undefined') ? GACHA.plusMax : 0);
  const L = Math.max(1, Math.min(cap, lv || 1));
  return 1 + (L - 1) * LEVEL.gainPerLevel;
}

/* つぎの レベルまでに ひつような けいけんち（MAXなら null）*/
function levelUpCost(lv) {
  const L = Math.max(1, Math.min(LEVEL.max, lv || 1));
  return (L >= LEVEL.max) ? null : LEVEL.expCost[L - 1];
}


/* --------------------------------------------------------------------------
   レアリティ と ガチャ

   ガチャは まず レアリティを ちゅうせんして、その なかから 1たい えらびます。
   すでに もっている キャラが でたら「レベルの じょうげんかいほう（＋）」に なります。
   -------------------------------------------------------------------------- */
const RARITY = {
  N:  { label: 'ノーマル',     rate: 50, color: '#90caf9', star: '★'    },
  R:  { label: 'レア',         rate: 30, color: '#81c784', star: '★★'   },
  SR: { label: 'スーパーレア', rate: 17, color: '#ffd54f', star: '★★★'  },
  LR: { label: 'でんせつレア', rate:  3, color: '#ff8a65', star: '★★★★' },
};

const GACHA = {
  cost: 3,                 // 1かい ひくのに ひつような Gコイン
  plusMax: 30,             // レベルの じょうげんかいほう は ＋30 まで
  /* ダブった とき（＋が MAXの とき）に もらえる けいけんち */
  dupExp:  { N: 100, R: 250, SR: 600, LR: 1500 },
  /* まだ キャラが いない レアリティが でた ときの おたのしみ */
  emptyExp: 1000,
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
    hp: 420,    atk: 62,   range: 63,   speed: 38,
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

  /* ほしくん ── きいろい ほし。ほしを とばして はんいこうげき。
               50%で あいてを うしろに ふっとばす。クールタイム 4びょう  */
  hoshikun: {
    id: 'hoshikun', name: 'ほしくん',
    attr: 'none',
    hp: 1100,   atk: 380,  range: 125,  speed: 30,
    attackInterval: 4.0,   attackWindup: 0.5,    // クールタイム 4びょう
    kbCount: 3,
    scale: 1.1,
    attackType: 'area',                          // はんい こうげき
    areaRadius: 62,
    projectile: 'star',
    /* とくしゅのうりょく：50%の かくりつで うしろに ふきとばす */
    knockbackChance: 0.50,
    money: 55,             // む ぞくせい なので すくなめ
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

  /* ほしぞら */
  hoshizora: {
    sky: ['#160d38', '#372663', '#7d6cb2'],
    hillFar: '#2c2755', hillNear: '#1a1736',
    ground: '#282240', groundTop: '#403964',
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
     reward     …… クリアの ごほうび（Gコインは しょかいクリアだけ もらえます）
     enemyMult  …… その コースの てき ぜんいんの つよさ ばいりつ
                    すすむほど つよく なるので、はじめのほうの てき（ほのた など）も
                    さいごまで つかえます。1.0 が きほん                    
   -------------------------------------------------------------------------- */
const STAGES = [
  {
    no: 1,
    chapter: 1,  course: 1,       // だい1ステージ の 1コースめ
    enemyMult: 1.00,            // てきの つよさ 1.00ばい
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
    enemyMult: 1.00,            // てきの つよさ 1.00ばい
    reward: { coins: 3, exp: 90 },   // ここまでで ガチャ 2かいぶん
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
    enemyMult: 1.00,            // てきの つよさ 1.00ばい
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
    enemyMult: 1.05,            // てきの つよさ 1.05ばい
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
    enemyMult: 1.05,            // てきの つよさ 1.05ばい
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
    enemyMult: 1.05,            // てきの つよさ 1.05ばい
    reward: { coins: 2, exp: 210 },  // ボスコース
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
    no: 9,
    chapter: 1,  course: 7,       // だい1ステージ の 7コースめ
    enemyMult: 1.10,            // てきの つよさ 1.10ばい
    reward: { coins: 1, exp: 230 },
    name: 'ほしの ひろば',
    desc: 'ほしくん とうじょう！ ほしを とばして ふきとばしてくる',
    bg: 'hoshizora',
    castleHp: 2500,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 16, id: 'hoshikun', count: 1 },
      { at: 32, id: 'honota',   count: 3, gap: 0.5 },
      { at: 48, id: 'hoshikun', count: 1, repeat: 34 },
      { at: 62, id: 'togehaya', count: 2, gap: 2.2, repeat: 28 },
      { at: 78, id: 'honota',   count: 3, gap: 0.5, repeat: 26 },
    ],
  },

  {
    no: 10,
    chapter: 1,  course: 8,       // だい1ステージ の 8コースめ
    enemyMult: 1.10,            // てきの つよさ 1.10ばい
    reward: { coins: 1, exp: 250 },
    name: 'みずと ほしの みち',
    desc: 'saba の とっしん と ほしくん の ふきとばし',
    bg: 'water',
    castleHp: 2900,
    waves: [
      { at: 3,  id: 'saba',     count: 1 },
      { at: 15, id: 'togehaya', count: 2, gap: 2.2 },
      { at: 30, id: 'hoshikun', count: 1 },
      { at: 44, id: 'saba',     count: 2, gap: 1.4, repeat: 30 },
      { at: 60, id: 'hoshikun', count: 1, repeat: 36 },
      { at: 76, id: 'honota',   count: 3, gap: 0.5, repeat: 26 },
    ],
  },

  {
    no: 11,
    chapter: 1,  course: 9,       // だい1ステージ の 9コースめ（ボスの まえ）
    enemyMult: 1.12,            // てきの つよさ 1.12ばい
    reward: { coins: 1, exp: 280 },
    name: 'あらしの まえぶれ',
    desc: 'ボスの まえの そうりょくせん。字一龍 も でてくる',
    bg: 'rock',
    castleHp: 3100,
    waves: [
      { at: 3,  id: 'togehaya', count: 1 },
      { at: 14, id: 'honota',   count: 3, gap: 0.5 },
      { at: 28, id: 'jiryu',    count: 1 },
      { at: 42, id: 'hoshikun', count: 1 },
      { at: 56, id: 'saba',     count: 2, gap: 1.4, repeat: 30 },
      { at: 70, id: 'jiryu',    count: 1, repeat: 50 },
      { at: 84, id: 'hoshikun', count: 1, repeat: 40 },
      { at: 96, id: 'togehaya', count: 2, gap: 2.2, repeat: 28 },
    ],
  },

  {
    no: 7,
    chapter: 1,  course: 10,      // だい1ステージ の さいごの コース（ボス）
    enemyMult: 1.15,            // てきの つよさ 1.15ばい
    reward: { coins: 2, exp: 340 },  // ボスコース
    name: 'おかしマンの しろ',
    desc: 'さいご の おおボス お菓子マン。まじゅつし が よく きく！',
    bg: 'boss',
    castleHp: 3900,
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
    enemyMult: 1.20,            // てきの つよさ 1.20ばい
    reward: { coins: 2, exp: 300 },  // ボスコース
    name: 'はがねの ぐんだん',
    desc: 'コンガラガーン とうじょう！ メタルは ほのお・まじゅつし・パワー に よわい',
    bg: 'steel',
    castleHp: 4600,
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
      /* おおボスは てきの しろが 60% まで へると でてくる */
      { atCastleHp: 0.60, id: 'okashiman', count: 1 },
    ],
  },
  {
    no: 12,
    chapter: 3,  course: 1,       // だい3ステージ の 1コースめ（メタルは ここから また ふえます）
    enemyMult: 1.40,            // てきの つよさ 1.40ばい
    reward: { coins: 2, exp: 380 },
    name: 'メタルの こうじょう',
    desc: 'コンガラガーン だらけ。ほのお・まじゅつし・パワー が よく きく',
    bg: 'steel',
    castleHp: 4400,
    waves: [
      { at: 3,   id: 'togehaya',   count: 1 },
      { at: 15,  id: 'kongaragan', count: 1 },
      { at: 30,  id: 'honota',     count: 4, gap: 0.5 },
      { at: 46,  id: 'kongaragan', count: 2, gap: 2.2, repeat: 30 },
      { at: 62,  id: 'hoshikun',   count: 1, repeat: 38 },
      { at: 78,  id: 'togehaya',   count: 2, gap: 2.2, repeat: 26 },
      { at: 92,  id: 'honota',     count: 4, gap: 0.5, repeat: 24 },
    ],
  },

  {
    no: 17,
    chapter: 2,  course: 2,       // だい2ステージ の 2コースめ（メタルは でてきません）
    enemyMult: 1.20,            // てきの つよさ 1.20ばい
    reward: { coins: 1, exp: 320 },
    name: 'かぜの かわら',
    desc: 'saba と ほのた の すばやい ぐんだん。かべが たいせつ',
    bg: 'mizu',
    castleHp: 4000,
    waves: [
      { at: 3,   id: 'saba',     count: 1 },
      { at: 13,  id: 'honota',   count: 4, gap: 0.4 },
      { at: 26,  id: 'togehaya', count: 2, gap: 2.0 },
      { at: 40,  id: 'saba',     count: 3, gap: 1.2, repeat: 24 },
      { at: 54,  id: 'honota',   count: 4, gap: 0.4, repeat: 20 },
      { at: 70,  id: 'togehaya', count: 2, gap: 2.2, repeat: 26 },
    ],
  },

  {
    no: 13,
    chapter: 2,  course: 3,       // だい2ステージ の 3コースめ（ボス）
    enemyMult: 1.22,            // てきの つよさ 1.22ばい
    reward: { coins: 2, exp: 380 },
    name: 'はがねの よる',
    desc: 'メタルぐんだん と 下手なきりん。くらやみの だいけっせん',
    bg: 'night',
    castleHp: 3400,
    waves: [
      { at: 3,   id: 'saba',       count: 1 },
      { at: 18,  id: 'kongaragan', count: 1 },
      { at: 34,  id: 'jiryu',      count: 1 },
      { at: 50,  id: 'hoshikun',   count: 1 },
      { at: 66,  id: 'kongaragan', count: 1, repeat: 42 },
      { at: 84,  id: 'saba',       count: 2, gap: 1.4, repeat: 38 },
      { at: 100, id: 'jiryu',      count: 1, repeat: 60 },
      { at: 118, id: 'hoshikun',   count: 1, repeat: 54 },
      /* ボスは てきの しろが 75% まで へると でてくる */
      { atCastleHp: 0.75, id: 'hetakirin', count: 1 },
    ],
  },

  {
    no: 14,
    chapter: 2,  course: 4,       // だい2ステージ の 4コースめ
    enemyMult: 1.28,            // てきの つよさ 1.28ばい
    reward: { coins: 1, exp: 340 },
    name: 'ほしと けものの もり',
    desc: 'ほしくん と 字一龍。けものは まじゅつしに つよい ので ちゅうい',
    bg: 'hoshizora',
    castleHp: 3000,
    waves: [
      { at: 3,   id: 'togehaya', count: 1 },
      { at: 17,  id: 'hoshikun', count: 1 },
      { at: 34,  id: 'jiryu',    count: 1 },
      { at: 50,  id: 'honota',   count: 4, gap: 0.5, repeat: 26 },
      { at: 66,  id: 'hoshikun', count: 1, repeat: 44 },
      { at: 84,  id: 'jiryu',    count: 1, repeat: 56 },
      { at: 98,  id: 'togehaya', count: 2, gap: 2.2, repeat: 30 },
    ],
  },

  {
    no: 15,
    chapter: 2,  course: 5,       // だい2ステージ の 5コースめ
    enemyMult: 1.30,            // てきの つよさ 1.30ばい
    reward: { coins: 1, exp: 360 },
    name: 'ひのたま あらし',
    desc: 'ほのた の だいぐんだん。みずの なかまが かつやくする',
    bg: 'sunset',
    castleHp: 4600,
    waves: [
      { at: 3,   id: 'honota',   count: 4, gap: 0.4 },
      { at: 16,  id: 'togehaya', count: 2, gap: 2.0 },
      { at: 30,  id: 'honota',   count: 5, gap: 0.4, repeat: 18 },
      { at: 44,  id: 'saba',     count: 2, gap: 1.4, repeat: 26 },
      { at: 60,  id: 'hoshikun', count: 1, repeat: 34 },
      { at: 76,  id: 'togehaya', count: 2, gap: 2.2, repeat: 24 },
    ],
  },

  {
    no: 16,
    chapter: 2,  course: 6,       // だい2ステージ の 6コースめ（ボス）
    enemyMult: 1.32,            // てきの つよさ 1.32ばい
    reward: { coins: 2, exp: 400 },
    name: 'りゅうの たに',
    desc: '字一龍 の むれ と お菓子マン。だい2ステージの やま',
    bg: 'rock',
    castleHp: 5000,
    waves: [
      { at: 3,   id: 'togehaya',   count: 1 },
      { at: 14,  id: 'jiryu',      count: 1 },
      { at: 28,  id: 'saba',       count: 2, gap: 1.4 },
      { at: 42,  id: 'jiryu',      count: 1, repeat: 34 },
      { at: 56,  id: 'kongaragan', count: 1, repeat: 40 },
      { at: 70,  id: 'honota',     count: 4, gap: 0.5, repeat: 24 },
      { at: 86,  id: 'hoshikun',   count: 1, repeat: 38 },
      /* おおボスは てきの しろが 65% まで へると でてくる */
      { atCastleHp: 0.65, id: 'okashiman', count: 1 },
    ],
  },
];



/* コースは「しょう → コースばんごう」の じゅんに じどうで ならべかえます。
   なので data.js の なかで どこに かいても だいじょうぶです。          */
STAGES.sort((a, b) => ((a.chapter || 1) - (b.chapter || 1)) || ((a.course || a.no) - (b.course || b.no)));


/* --------------------------------------------------------------------------
   とくべつステージ「あき坊の塔」

   10かい ぜんぶ のぼると とくべつな なかまが もらえます。
   かいを ついかする ときは courses に コースを 1つずつ いれて ください。
   かきかたは ふつうの コースと おなじです（no は 100ばんだいを つかいます）。

   れい：
     { no: 101, floor: 1, name: '1かい', desc: '...', bg: 'steel',
       castleHp: 3000, reward: { coins: 0, exp: 200 }, waves: [ ... ] },
   -------------------------------------------------------------------------- */
const TOWER = {
  name: 'あき坊の塔',
  desc: '10かい ぜんぶ のぼると とくべつな なかまが もらえる！',
  floors: 10,                 // ぜんぶで なんかい あるか
  rewardChar: null,           // ぜんぶ クリアで もらえる とくべつキャラ（これから きめます）
  rewardName: 'とくべつな なかま',
  courses: [
    /* ここに 1かい〜10かい を ついかして いきます */
  ],
};


/* --------------------------------------------------------------------------
   7. ぞくせいの あいしょう（さわらなくて OK）
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
