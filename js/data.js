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

  /* --- かみ ぞくせい（あき坊）---
     どの ぞくせいにも すこし ゆうり。ただし メタルにだけは よわい */
  godAtk: 1.2,       // かみが なぐる とき ダメージ 1.2ばい
  godDef: 0.8,       // かみが なぐられる とき ダメージ 0.8ばい

  /* --- はどう（あき坊）--- */
  wave: {
    step:  120,      // レベル1ぶんの ながさ。レベル5 なら 120x5 = 600
    speed: 620,      // はどうが すすむ はやさ（1びょうに すすむ きょり）
    hitW:  34,       // はどうの あつみ（このなかに いる てきに あたる）
  },

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
    /* とくしゅのうりょく：あてた てきの スピードを 30%に する（70% ダウン） */
    slow: { rate: 0.3, duration: 4.0, chance: 1.0 },  // rate 0.3 → はやさ 30%（70% ダウン）/ 4びょう / 100%

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「ぷりぷりおぷりねこ」に なれます

       ・じゃまする じかん（どんそく）が 2ばい（4びょう → 8びょう）
       ・たいりょくと こうげきりょくが 1.5ばい
       ・おおきな くちを あけた すがたに かわります
       ・★はどうストッパー：はどうの ダメージを うけず、なみを せきとめる
       ------------------------------------------------------------ */
    evolve: {
      name: 'ぷりぷりおぷりねこ', shortName: 'ぷりぷり',
      hp: 840,                                        // 560 x 1.5
      atk: 51,                                        // 34 x 1.5
      slow: { rate: 0.3, duration: 8.0, chance: 1.0 },// じゃまする じかん 2ばい
      /* ★はどうストッパー
         じぶんは はどうの ダメージを うけず、
         なみを ここで とめる ので、うしろの なかまにも とどかない。
         闇堕ちあき坊の はどう レベル5 たいさくに なる。            */
      waveStopper: true,
      drawAs: 'puripurio',
    },
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

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「たんくんDX」に なれます

       ・そうこうを つけて たいりょくが 2ばい
       ・キャタピラが つよく なって はやさも 2ばい
       ・こうげきりょくは そのまま（かべやくの まま）
       ------------------------------------------------------------ */
    evolve: {
      name: 'たんくんDX', shortName: 'たんDX',
      hp: 2800,                          // 1400 x 2
      speed: 52,                         // 26 x 2
      drawAs: 'tankundx',
    },
  },

  /* テルテル君 ── みずいろの てるてるぼうず / えんきょり（ガラスの たいほう） */
  teruteru: {
    id: 'teruteru', name: 'テルテル君', shortName: 'テルテル',
    rarity: 'N',                          // ノーマル
    attr: 'water',
    cost: 250,  recharge: 6.5,
    hp: 360,    atk: 90,   range: 184,  speed: 14,
    attackInterval: 2.6,   attackWindup: 0.45,
    kbCount: 2,
    scale: 1.0,
    attackType: 'single',
    projectile: 'drop',
    /* とくしゅのうりょく：しずくを 3れんげき */
    multiHit: { count: 3, delay: 0.16 },   // 3はつを 0.16びょう おきに とばす

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「デルテル君（怒り）」に なれます
         れんげき  3はつ → 6はつ（ダメージ 2ばい）
         しゃてい  184 → 276（1.5ばい）
         コスト    250 → 300
       ------------------------------------------------------------ */
    evolve: {
      name: 'デルテル君', shortName: 'デルテル',
      cost: 300,
      range: 276,                            // 184 x 1.5
      multiHit: { count: 6, delay: 0.14 },   // 6れんげき
      drawAs: 'deruteru',
    },
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

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「時の柄」に なれます

       つよさに かかわる ところを ぜんぶ 1.3ばいに：
         たいりょく 820 → 1066
         こうげき   155 →  202
         しゃてい   131 →  170
         はやさ      33 →   43
         こうげきの はやさ 1.8びょう → 1.38びょう（1.3ばい はやい）
         ふきとばす かくりつ 20% → 26%
       そのうえで──
         ★あてた あいてを 1びょう とめる（20%）を あたらしく ついか
       ------------------------------------------------------------ */
    evolve: {
      name: '時の柄', shortName: '時の柄',
      hp: 1066,
      atk: 202,
      range: 170,
      speed: 43,
      attackInterval: 1.38,
      knockbackChance: 0.26,
      stun: { duration: 1.0, chance: 0.20 },   // ★あたらしく ついか
      drawAs: 'tokinogara',
    },
  },

  /* ひー坊 ── ほのおを まとった たかかりょく */
  hiibou: {
    id: 'hiibou', name: 'ひー坊', shortName: 'ひー坊',
    rarity: 'GR',                        // げきレア
    attr: 'fire',
    cost: 1350, recharge: 30.0,
    hp: 1900,   atk: 500,  range: 118,  speed: 24,
    attackInterval: 2.2,   attackWindup: 0.55,   // おおきく ふりかぶる
    kbCount: 3,
    scale: 1.65,                                 // みための おおきさ 1.5ばい
    attackType: 'area',                          // はんい こうげき
    areaRadius: 46,                              // ばくはつの おおきさ
    projectile: 'fireball',

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「隕坊（いんぼう）」に なれます

       いんせきの ように なって、ほのおの おを ひきながら すすむ。
       つよさに かかわる ところが ぜんぶ 1.3ばい：
         たいりょく  1900 → 2470
         こうげき     500 →  650
         しゃてい     118 →  153
         はやさ        24 →   31
         ばくはつの おおきさ 46 → 60
         こうげきの はやさ 2.2びょう → 1.69びょう（1.3ばい はやい）
       そのうえで──
         ★100%で あいての こうげきりょくを 2びょう 80%に さげる
       ------------------------------------------------------------ */
    evolve: {
      name: '隕坊', shortName: '隕坊',
      hp: 2470,
      atk: 650,
      range: 153,
      speed: 31,
      attackInterval: 1.69,
      areaRadius: 60,
      /* ★かならず あいての こうげきりょくを 2びょう 20% さげる */
      weaken: { chance: 1.0, rate: 0.8, duration: 2.0 },
      drawAs: 'inbou',
    },
  },

  /* 霊太郎 ── ランドセルを せおって パンを くわえた しょうがくせいの おばけ。
              がっこうに ちこく しそうで あわてて いる。
              ★ゆうれい ぞくせい：むぞくせいと パワーの こうげきを むこうかする
                （ダメージ 0。ただし ふくごう ぞくせい（2つ もち）の
                  こうげきは むこうかできず、ふつうに ダメージを うける）
              ★10%で あいてを 3びょう どんそくに する                      */
  reitarou: {
    id: 'reitarou', name: '霊太郎', shortName: '霊太郎',
    rarity: 'R',                          // レア
    attr: 'ghost',                        // ★あたらしい ゆうれい ぞくせい
    cost: 170,  recharge: 6.0,
    hp: 620,    atk: 80,   range: 68,   speed: 28,
    attackInterval: 1.0,   attackWindup: 0.25,   // こうげきの かいすうは おおい
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* ★むこうか：むぞくせいと パワーの こうげきは ダメージ 0 */
    nullify: { attrs: ['none', 'power'] },
    /* 10%で 3びょう どんそく */
    slow: { rate: 0.5, duration: 3.0, chance: 0.10 },
  },

  /* マッチくん ── ぼうの ぶぶんが おれて ふらふら あるく マッチぼう。
                 かみの ように よわいが、まだまだ もえる。
                 ★15%で あいての こうげきりょくを 5びょう 80%に さげる    */
  matchkun: {
    id: 'matchkun', name: 'マッチくん', shortName: 'マッチ',
    rarity: 'N',                          // ノーマル
    attr: 'fire',
    cost: 110,  recharge: 4.0,
    hp: 300,    atk: 105,  range: 62,   speed: 46,    // かみたいきゅう・はやめ
    attackInterval: 1.3,   attackWindup: 0.30,
    kbCount: 2,
    scale: 0.95,
    attackType: 'single',
    projectile: null,
    /* 15%で あいての こうげきりょくを 5びょう 80%に */
    weaken: { chance: 0.15, rate: 0.8, duration: 5.0 },
  },

  /* あき坊 ── ぜんちぜんのうの かみさま。りょうてで かおを おしつぶして
              へんな かおを して いる。でも ちからは ほんもの。
              ★かみ ぞくせい：ぜんぶの ぞくせいに 1.2ばい、うける ダメージ 0.8ばい
                        ただし メタルにだけは よわい
              ★はどう レベル5：こうげきが あたると、まえに なみが はしって
                        とおりみちの てき ぜんぶに ダメージ                 */
  akibou: {
    id: 'akibou', name: 'あき坊', shortName: 'あき坊',
    rarity: 'LR',                         // でんせつレア
    attr: 'god',                          // ★あたらしい かみ ぞくせい
    cost: 1800, recharge: 240.0,          // さいせい 4ふん
    hp: 5200,   atk: 900,  range: 210,  speed: 52,
    attackInterval: 4.2,   attackWindup: 0.9,   // クールタイム すこし ながめ
    kbCount: 5,
    scale: 1.9,                                 // からだが とても おおきい
    attackType: 'single',
    projectile: null,
    /* ★はどう レベル5（にゃんこ大戦争と おなじ かんがえかた）
       こうげきが あたった とき、まえに なみが はしって
       とおりみちの てき ぜんぶに おなじ ダメージを あたえる       */
    wave: { level: 5, damageRate: 1.0 },
  },

  /* バケ着 ── みずの はいった バケツを もった ぼうにんげん。
             たかく とびあがって マイクラの「みずバケツちゃくち」を する。
             その みずしぶきで まわりの てきを まとめて こうげき。
             ★あてた あいての こうげきりょくを 5びょう 20%さげる
             ★15%で ちゃくちに しっぱいして、じぶんだけ ダメージ      */
  bakegi: {
    id: 'bakegi', name: 'バケ着', shortName: 'バケ着',
    rarity: 'SR',                         // スーパーレア
    attr: 'water',
    cost: 780,  recharge: 22.0,
    hp: 2600,   atk: 340,  range: 175,  speed: 26,
    attackInterval: 1.9,   attackWindup: 0.55,  // こうげきの かいすうは おおめ
    kbCount: 4,
    scale: 1.05,
    attackType: 'area',
    areaRadius: 105,                      // ちゃくちの みずしぶきは とても ひろい
    projectile: null,
    /* あてた あいての こうげきりょくを 5びょう 20%さげる */
    weaken: { chance: 1.0, rate: 0.8, duration: 5.0 },
    /* 15%で ちゃくちに しっぱい。こうげきは そらぶり、じぶんに 10%ダメージ */
    selfHurt: { chance: 0.15, rate: 0.10 },
  },

  /* A（エーくん）── まほうの ぼうしを かぶった きいろい「A」。
                    ほしの つえで まほうを うつ。ノーマルで はじめての まじゅつし。
                    ★10%で あいての うごきを 2びょう とめる                     */
  akun: {
    id: 'akun', name: 'A（エーくん）', shortName: 'エーくん',
    rarity: 'N',                          // ノーマル
    attr: 'magic',                        // まじゅつし
    cost: 160,  recharge: 4.5,
    hp: 400,    atk: 95,   range: 165,  speed: 26,
    attackInterval: 1.8,   attackWindup: 0.35,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: 'star',
    /* とくしゅのうりょく：10%で あいてを 2びょう とめる */
    stun: { duration: 2.0, chance: 0.10 },
  },

  /* たたみん ── たった たたみ。どっしり かまえて みんなを まもる。
                ★みずの こうげきを 20%に おさえる（ふつうは 60%）      */
  tatamin: {
    id: 'tatamin', name: 'たたみん', shortName: 'たたみん',
    rarity: 'N',                          // ノーマル
    attr: 'grass',                        // くさ
    cost: 200,  recharge: 6.0,
    hp: 1300,   atk: 45,   range: 62,   speed: 16,
    attackInterval: 2.0,   attackWindup: 0.35,
    kbCount: 4,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：みずの こうげきを 20%まで おさえる
       （くさは もともと みずに つよくて 60%。それを さらに 20%に）  */
    resist: { attrs: ['water'], mult: 0.2 },
  },

  /* ドンドコ力士 ── はらたいこの りきし。バチで おなかを たたくと、
                   おとの しょうげきはが まわりの てき ぜんぶに とどく。
                   さいせいは 3ぷん。1せんに 1かいの きりふだ           */
  dondoko: {
    id: 'dondoko', name: 'ドンドコ力士', shortName: 'ドンドコ',
    rarity: 'SR',                         // スーパーレア
    attr: 'power',                        // パワー
    cost: 1100, recharge: 180.0,          // さいせい やく3ぷん
    hp: 3800,   atk: 800,  range: 120,  speed: 12,
    attackInterval: 3.4,   attackWindup: 0.80,
    kbCount: 6,
    scale: 1.3,
    attackType: 'area',                   // じぶんの まわり ぜんぶ
    areaRadius: 120,                      // とても ひろい
    projectile: null,
  },

  /* しゅりへん ── せなかに かべを かついだ しゅりけん。
                 じぶんから ものすごい はやさで とびかかって いく。
                 4びょうに 1かい、おおきく まわって はんいこうげき。
                 むぞくせいなので どんな あいてにも ふつうに ダメージが とおる。
                 そのかわり たいりょくは ふつう。とびだしすぎに ちゅうい      */
  shurihen: {
    id: 'shurihen', name: 'しゅりへん', shortName: 'しゅりへん',
    rarity: 'GR',                        // げきレア
    attr: 'none',
    cost: 420,  recharge: 20.0,
    hp: 1400,   atk: 950,  range: 88,   speed: 125,   // saba なみの はやさ
    attackInterval: 4.0,   attackWindup: 0.5,         // こうげき クールタイム 4びょう
    kbCount: 2,
    scale: 1.0,
    attackType: 'area',                   // はんいこうげき
    areaRadius: 58,
    projectile: null,
  },

  /* かべくん ── ちゃいろい かべ。こうげきは まったく しない かわりに
                たいりょくが ものすごく たかい。はやく はしって いって
                てきの まえに たちはだかる、まもり せんもんの なかま  */
  kabekun: {
    id: 'kabekun', name: 'かべくん', shortName: 'かべくん',
    rarity: 'R',                          // レア
    attr: 'power',                        // パワー（けものに つよい／まじゅつしに よわい）
    cost: 400,  recharge: 12.0,
    hp: 2500,   atk: 0,    range: 78,   speed: 60,
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

    /* ------------------------------------------------------------
       しんか：じつりょく Lv.10 で「ずに太」に なれます

       ・たいりょくが 1.5ばい
       ・こうげきりょくは はんぶん。そのかわり 3れんげき
         → ぜんぶ あたれば じっしつ 1.5ばい
       ・パワーアップがめんの ボタンで いつでも もとに もどせます

       evolve に かいた こうもく だけが さしかわります。
       ------------------------------------------------------------ */
    evolve: {
      id: 'zunio',                       // え を えらぶ ときの なまえ（したで きりかえ）
      name: 'ずに太', shortName: 'ずに太',
      hp: 630,                           // 420 x 1.5
      atk: 150,                          // 300 の はんぶん
      multiHit: { count: 3, delay: 0.18 },   // 3れんげき（ぜんぶ あたれば 450 ＝ 1.5ばい）
      drawAs: 'zunita',                  // え は ずに太（3のめ）
    },
  },

  /* フタバッポ ── うえきばちに はえた ふたば。ふたつの はっぱに かおが ある。
                ピョコピョコ すすんで、あたまで ポカポカ こうげき。
                ★みずの こうげきを すいとって、そのぶん げんきに なる（かいふく）  */
  futabappo: {
    id: 'futabappo', name: 'フタバッポ', shortName: 'フタバッポ',
    rarity: 'R',                          // レア
    attr: 'grass',                        // くさ（みずに つよい／ほのおに よわい）
    cost: 240,  recharge: 7.0,
    hp: 1150,   atk: 80,   range: 90,   speed: 28,
    attackInterval: 1.5,   attackWindup: 0.30,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：みずの こうげきは ダメージ 0。
       そのかわり おなじ ぶんだけ たいりょくが かいふく する            */
    absorb: { attrs: ['water'], rate: 1.0 },
  },

  /* シャドウヤマネコ ── くろっぽい やまねこの こども。みみの さきに ふさげ。
                      とても はやく はしり、するどい ツメで れんぞく スラッシュ。
                      ★15%で かいしんの いちげき（3ばい・あいしょうは かんけいなし）*/
  shadowyamaneko: {
    id: 'shadowyamaneko', name: 'シャドウヤマネコ', shortName: 'ヤマネコ',
    rarity: 'R',                          // レア
    attr: 'beast',                        // けもの（まじゅつしに つよい／パワーに よわい）
    cost: 280,  recharge: 8.0,
    hp: 600,    atk: 120,  range: 112,  speed: 48,
    attackInterval: 0.85,  attackWindup: 0.18,   // こうそく れんぞく スラッシュ
    kbCount: 2,                                  // たいりょくは ひくめ（ガラスの ツメ）
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：15%で かいしんの いちげき。
       ダメージ 3ばい。ぞくせいの あいしょうは けいさんに いれない        */
    crit: { chance: 0.15, mult: 3, ignoreAttr: true },
  },

  /* 豪傑天むす丸 ── さんかくおにぎりの ごうけつ。あたまに エビの てんぷら。
                   ドシンドシン ゆっくり すすみ、めのまえで エビ天を フルスイング。
                   ★35%で あいてを ふきとばす                            */
  tenmusumaru: {
    id: 'tenmusumaru', name: '豪傑天むす丸', shortName: '天むす丸',
    rarity: 'GR',                         // げきレア
    attr: 'power',                        // パワー（けものに つよい／まじゅつしに よわい）
    cost: 520,  recharge: 15.0,
    hp: 2100,   atk: 460,  range: 70,   speed: 15,
    attackInterval: 2.8,   attackWindup: 0.70,   // おおきく ふりかぶる
    kbCount: 4,
    scale: 1.1,
    attackType: 'area',                          // まえに てんぷらの しょうげきは
    areaRadius: 52,
    projectile: null,
    /* とくしゅのうりょく：35%で あいてを ふきとばす */
    knockbackChance: 0.35,
  },

  /* スティーブ ── あき坊の塔を ぜんぶ クリアすると なかまに なる とくべつキャラ。
                 じじょうの まえに つちブロックを つんで、そこから うごかずに
                 ひの やを とても とおくまで うちつづける。コストは とても たかい  */
  steve: {
    id: 'steve', name: 'スティーブ', shortName: 'スティーブ',
    rarity: 'GR',                        // げきレア
    attr: 'fire',
    cost: 850,  recharge: 180.0,                 // さいせい 3ぷん
    hp: 1300,   atk: 960,  range: 1000,  speed: 0,   // てきの しろの すぐ てまえまで とどく
    attackInterval: 3.0,   attackWindup: 1.0,    // ゆみを 1びょうかけて ひきしぼる
    kbCount: 3,
    scale: 1.25,
    attackType: 'single',
    projectile: 'firearrow',
    stationary: true,                     // うごかない（まもりの やぐら）
    blocks: 3,
  },
};

/* はじめから もっている キャラ（へんせいの しょきち）
   へんせいがめんで さいだい 10たい まで えらべます */
const PARTY_MAX = 10;
/* はじめから もっている キャラ（のこりは ガチャで あつめます）*/
const START_CHARS = ['tankun', 'purio'];
const DEFAULT_PARTY = START_CHARS.slice();
/* ガチャに でてくる キャラ ぜんぶ */
const ALL_CHARS = ['tankun', 'purio', 'teruteru',
                   'tokinotabibito', 'zunio', 'kabekun', 'futabappo', 'shadowyamaneko', 'tenmusumaru',
                   'hiibou', 'shurihen', 'akun', 'tatamin', 'matchkun', 'reitarou',
                   'dondoko', 'bakegi', 'akibou'];
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

  /* --------------------------------------------------------------
     レベルが あがると どれだけ つよく なるか

     にゃんこ大戦争と おなじ かんがえかたに しました。
       ・レベル1の ステータスを もとに、1レベルごとに きまった ぶんだけ たす
       ・ある レベルを こえると、のびる ぶんが はんぶん → さらに はんぶん に なる
       ・その「にぶり はじめる レベル」が レア度で ちがう
         → レア度が たかい キャラほど、ながく ぐんぐん のびる

     tiers は [そのレベルまで, 1レベルあたりの のび] の ならびです。
     -------------------------------------------------------------- */
  growth: {
    N:  [[10, 0.10], [20, 0.05], [40, 0.025]],   // ノーマル      Lv.40 で 2.90ばい
    R:  [[14, 0.10], [24, 0.05], [40, 0.025]],   // レア          Lv.40 で 3.20ばい
    GR: [[18, 0.10], [28, 0.05], [40, 0.025]],   // げきレア      Lv.40 で 3.50ばい
    SR: [[22, 0.10], [32, 0.05], [40, 0.025]],   // スーパーレア  Lv.40 で 3.80ばい
    LR: [[26, 0.10], [36, 0.05], [40, 0.025]],   // でんせつレア  Lv.40 で 4.10ばい
  },
  /* growth に ないときの ほけん（てき など）*/
  gainPerLevel: 0.10,
};

/* レベルから つよさの ばいりつを だす
   じょうげんかいほう(＋)の ぶんも「レベルが あがったのと おなじ」に なります。
   けいけんちレベル 10 ＋ かいほう 30 = じつりょく Lv.40（4.9ばい）が さいだい  */
/* --------------------------------------------------------------------------
   じつりょくレベル → つよさの ばいりつ

   levelMult(20, 'N')  →  ノーマルの Lv.20 の ばいりつ
   levelMult(20, 'SR') →  スーパーレアの Lv.20 の ばいりつ（こちらの ほうが たかい）

   レア度を わたさない ときは いちばん ひくい ノーマルと おなじ あつかいです。
   -------------------------------------------------------------------------- */
function levelMult(lv, rarity) {
  const cap = LEVEL.max + ((typeof GACHA !== 'undefined') ? GACHA.plusMax : 0);
  const L = Math.max(1, Math.min(cap, lv || 1));
  const tiers = (LEVEL.growth && LEVEL.growth[rarity]) || (LEVEL.growth && LEVEL.growth.N);
  if (!tiers) return 1 + (L - 1) * LEVEL.gainPerLevel;

  let mult = 1, from = 1;
  for (const [upto, gain] of tiers) {
    if (L <= from) break;
    const steps = Math.min(L, upto) - from;   // この くぎりで あがった レベルの かず
    if (steps > 0) mult += steps * gain;
    from = Math.min(L, upto);
    if (from >= L) break;
  }
  return mult;
}

/* キャラの id から ばいりつを だす（レア度を じどうで みる）*/
function unitLevelMult(id, lv) {
  const def = (typeof UNITS !== 'undefined') ? UNITS[id] : null;
  return levelMult(lv, def ? def.rarity : undefined);
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
/* レアリティは よわい じゅんに 5だんかい。
   RARITY_ORDER の ならびが そのまま「ひくい → たかい」の じゅんばんです */
const RARITY_ORDER = ['N', 'R', 'GR', 'SR', 'LR'];

const RARITY = {
  N:  { label: 'ノーマル',     rate: 50, color: '#90caf9', star: '★'     },
  R:  { label: 'レア',         rate: 30, color: '#81c784', star: '★★'    },
  GR: { label: 'げきレア',     rate: 15, color: '#ffd54f', star: '★★★'   },
  SR: { label: 'スーパーレア', rate:  4, color: '#ff8a65', star: '★★★★'  },
  LR: { label: 'でんせつレア', rate:  1, color: '#ce93d8', star: '★★★★★' },
};

const GACHA = {
  cost: 3,                 // 1かい ひくのに ひつような Gコイン
  plusMax: 30,             // レベルの じょうげんかいほう は ＋30 まで
  /* ダブった とき（＋が MAXの とき）に もらえる けいけんち */
  dupExp:  { N: 100, R: 250, GR: 600, SR: 1200, LR: 2500 },
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
    rarity: 'N',
    attr: 'fire',
    hp: 310,    atk: 45,   range: 63,   speed: 38,
    attackInterval: 1.2,   attackWindup: 0.25,
    kbCount: 3,
    scale: 0.9,
    attackType: 'single',
    projectile: null,
    money: 45,             // ぞくせい あり
  },

  /* トゲハヤさん ── しかくい はこがた ロボット */
  togehaya: {
    id: 'togehaya', name: 'トゲハヤさん',
    rarity: 'R',
    attr: 'none',
    hp: 640,    atk: 105,  range: 68,   speed: 24,
    attackInterval: 1.6,   attackWindup: 0.30,
    kbCount: 4,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    money: 80,             // む ぞくせい なので すくなめ
  },

  /* saba ── あおい さかな。ものすごい はやさで とっしんして くる
             もろいけど あたると いたい。かべを ようい してから むかえうつ */
  saba: {
    id: 'saba', name: 'saba',
    rarity: 'R',
    attr: 'water',
    hp: 170,    atk: 170,  range: 55,   speed: 140,  // speed 140 = だんとつ さいそく
    attackInterval: 1.8,   attackWindup: 0.22,
    kbCount: 2,
    scale: 1.0,
    attackType: 'area',                              // とっしんの はんい こうげき
    areaRadius: 55,
    projectile: null,
    money: 60,             // ぞくせい あり
  },

  /* 字一龍（じーりゅう）── みどりの りゅう。「字」を はいて こうげき
                          ボスでは ないけど かなり つよい ちゅうボス */
  jiryu: {
    id: 'jiryu', name: '字一龍',
    rarity: 'GR',
    attr: 'beast',
    hp: 1660,   atk: 205,  range: 100,  speed: 34,
    attackInterval: 3.0,   attackWindup: 0.45,
    kbCount: 3,
    scale: 1.2,
    attackType: 'single',
    projectile: 'moji',                              // 字を はく
    /* とくしゅのうりょく：50%の かくりつで 2びょうかん どんそくに する */
    slow: { rate: 0.5, duration: 2.0, chance: 0.5 },
    money: 125,            // ぞくせい あり ＆ つよい
  },

  /* ==========================================================
     ここから した は「あき坊の塔」に でてくる ざこてき
     ========================================================== */

  /* やきポックル ── ちいさな こぶた。はないきで ひを ふく。
                    1ぴきなら よわいが、むれで おしよせる       */
  yakipokkuru: {
    id: 'yakipokkuru', name: 'やきポックル',
    rarity: 'N',
    attr: 'fire',
    hp: 140,    atk: 40,   range: 60,   speed: 50,
    attackInterval: 1.3,   attackWindup: 0.25,
    kbCount: 3,
    scale: 0.95,
    attackType: 'single',
    projectile: null,
    money: 25,
  },

  /* アイアン・コッコ ── てつの ニワトリロボ。たいりょくが とても たかいが
                        こうげきは ほとんど きかない。ときどき ゼンマイが きれて コケる */
  ironkokko: {
    id: 'ironkokko', name: 'アイアン・コッコ',
    rarity: 'R',
    attr: 'metal',
    hp: 1640,   atk: 30,   range: 70,   speed: 22,
    attackInterval: 1.4,   attackWindup: 0.3,
    kbCount: 5,
    scale: 1.1,
    attackType: 'single',
    projectile: null,
    /* ゼンマイぎれ：ときどき ころんで うごけなく なる（そのあいだ よわい）*/
    rest: { every: 9.0, duration: 1.8, mark: '⚙', vuln: 1.4 },
    money: 65,
  },

  /* ウサ・ゴリラ ── マッチョな うさぎ。おおぶりの ニンジンで なぐる。
                    タメが ながく、タメちゅうに たたくと こうげきを キャンセルできる */
  usagorilla: {
    id: 'usagorilla', name: 'ウサ・ゴリラ',
    rarity: 'R',
    attr: 'power',
    hp: 1290,   atk: 285,  range: 85,   speed: 20,
    attackInterval: 3.6,   attackWindup: 3.0,    // 3びょうも ふりかぶる
    kbCount: 4,
    scale: 1.15,
    attackType: 'single',
    projectile: null,
    knockbackChance: 1.0,                        // あたると 1ぽ こうたい
    /* タメちゅうに この ダメージを あたえると こうげきが ふはつに なる */
    stagger: { damage: 400 },
    money: 105,
  },

  /* モーモー・プラント ── くさを せおった うし。ちかくの なかまを かいふくする。
                          まんぷくに なると すわって ひるねを して しまう      */
  momoplant: {
    id: 'momoplant', name: 'モーモー・プラント',
    rarity: 'N',
    attr: 'grass',
    hp: 1110,   atk: 30,   range: 65,   speed: 14,
    attackInterval: 2.0,   attackWindup: 0.3,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* じどう かいふく（じぶん）*/
    regen: 12,
    /* ちかくの なかまを ちょっとずつ かいふく */
    heal: { amount: 70, radius: 210, interval: 3.0 },
    /* ひるね：ときどき すわって うごけなく なる（そのあいだ よわい）*/
    rest: { every: 12.0, duration: 3.0, mark: '💤', vuln: 1.5 },
    money: 50,
  },

  /* モコ魔道士 ── かんむりを かぶった ひつじの まほうつかい。
                  えんきょりから ひかる ひつじの けを とばす。まもりが かたい */
  mokomadoushi: {
    id: 'mokomadoushi', name: 'モコ魔道士',
    rarity: 'GR',
    attr: 'magic',
    hp: 1360,   atk: 160,  range: 190,  speed: 16,
    attackInterval: 2.4,   attackWindup: 0.45,
    kbCount: 3,
    scale: 1.05,
    attackType: 'single',
    projectile: 'wool',
    money: 100,
  },

  /* バケッチン ── みずを なみなみ もった バケツの おばけ。
                  みずを かけて めくらましに する。はしるほど みずが こぼれて
                  はやく なるが たいりょくが へって いく                  */
  bakecchin: {
    id: 'bakecchin', name: 'バケッチン',
    rarity: 'N',
    attr: 'water',
    hp: 740,    atk: 50,   range: 68,   speed: 34,
    attackInterval: 1.6,   attackWindup: 0.28,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* みずしぶきで あいての めいちゅうりつを さげる */
    blind: { chance: 0.6, duration: 4.0, missRate: 0.30 },
    /* はしるほど はやく なるが たいりょくが へる */
    leak: { speedGain: 7, speedMax: 70, hpLoss: 16 },
    money: 60,
  },

  /* ブロック・ワン ── しかくい ブロックの いぬ。こうげきは ほぼ ゼロだが
                    かたくて、あたって きた みかたを おしかえす            */
  blockwan: {
    id: 'blockwan', name: 'ブロック・ワン',
    rarity: 'N',
    attr: 'none',
    hp: 1850,   atk: 20,   range: 58,   speed: 26,
    attackInterval: 1.8,   attackWindup: 0.3,
    kbCount: 5,
    scale: 1.05,
    attackType: 'single',
    projectile: null,
    knockbackChance: 0.5,                 // びみょうに おしかえす
    money: 55,
  },

  /* ニョロリ〜ヌ ── うどんの ヘビ。とても はやくて てかずが おおいが
                    かみのように よわい。ときどき じぶんで ちょうちょむすびに なる */
  nyororiinu: {
    id: 'nyororiinu', name: 'ニョロリ〜ヌ',
    rarity: 'N',
    attr: 'none',
    hp: 150,    atk: 35,   range: 58,   speed: 75,
    attackInterval: 0.7,   attackWindup: 0.15,   // てかずが おおい
    kbCount: 2,
    scale: 0.95,
    attackType: 'single',
    projectile: null,
    rest: { every: 10.0, duration: 1.8, mark: '🎀', vuln: 1.4 },
    money: 35,
  },

  /* おじい農園長 ── むぎわらぼうしの のうか。トマトを なげて こうげき。
                    10じに なると おちゃを のんで 3びょう やすむ            */
  ojiinouenchou: {
    id: 'ojiinouenchou', name: 'おじい農園長',
    rarity: 'R',
    attr: 'none',
    hp: 780,   atk: 85,  range: 140,  speed: 16,
    attackInterval: 2.2,   attackWindup: 0.4,
    kbCount: 3,
    scale: 1.05,
    attackType: 'single',
    projectile: 'tomato',
    rest: { every: 11.0, duration: 3.0, mark: '🍵', vuln: 1.4 },
    money: 65,
  },

  /* クマべぇ ── もふもふの クマ。ときどき さけの もうそうで うっとり とまる */
  kumabee: {
    id: 'kumabee', name: 'クマべぇ',
    rarity: 'R',
    attr: 'beast',
    hp: 1100,   atk: 125,  range: 72,   speed: 20,
    attackInterval: 1.9,   attackWindup: 0.4,
    kbCount: 3,
    scale: 1.1,
    attackType: 'single',
    projectile: null,
    rest: { every: 9.0, duration: 2.0, mark: '🐟', vuln: 1.5 },
    money: 110,
  },

  /* カモメェル ── そらを とぶ カモメ。かべを こえて うしろの みかたを おそう。
                  かみのように よわいので、とどけば すぐ おちる            */
  kamomeeru: {
    id: 'kamomeeru', name: 'カモメェル',
    rarity: 'N',
    attr: 'none',
    hp: 120,    atk: 65,  range: 65,   speed: 68,
    attackInterval: 1.4,   attackWindup: 0.25,
    kbCount: 2,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    flying: true,                         // ★ かべを こえて いちばん うしろを ねらう
    /* ポテトを みつけると おちて うごけなく なる */
    rest: { every: 11.0, duration: 2.2, mark: '🍟', vuln: 1.6 },
    money: 30,
  },

  /* スティーブ ── あき坊の塔の おおボス。
                  とうじょうと どうじに つちブロックを 3だん つみ、その うえに たつ。
                  まえには すすまず、ひを まとった やを とても とおくまで うつ。
                  たおして クリアすると なかまに なる（コストは とても たかい）  */
  steve: {
    id: 'steve', name: 'スティーブ',
    rarity: 'SR',
    attr: 'fire',
    hp: 2760,   atk: 460,  range: 950,   speed: 0,
    attackInterval: 2.5,   attackWindup: 1.0,    // ゆみを 1びょうかけて ひきしぼる（マイクラと おなじ）
    kbCount: 3,
    scale: 1.25,
    attackType: 'single',
    projectile: 'firearrow',
    stationary: true,                     // ★ まえに すすまない
    blocks: 3,                            // つちブロックを 3だん つむ
    money: 275,
    isBoss: true,
  },

  /* ============================================================
     ここから した は だい3しょう「けものみち」に でてくる てき
     けもの ぞくせいが おおく、パワーの なかまが かつやく します
     ============================================================ */

  /* イノっち ── いのしし。まっすぐ つっこんで きて ふきとばす */
  inocchi: {
    id: 'inocchi', name: 'イノっち',
    rarity: 'R',
    attr: 'beast',
    hp: 450,    atk: 95,  range: 62,   speed: 62,
    attackInterval: 1.2,   attackWindup: 0.25,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：30%で あいてを うしろに ふきとばす */
    knockbackChance: 0.30,
    money: 70,
  },

  /* たぬポン ── まるい たぬき。おなかを たたいて まわりの ちからを ぬく */
  tanupon: {
    id: 'tanupon', name: 'たぬポン',
    rarity: 'R',
    attr: 'beast',
    hp: 1290,   atk: 45,   range: 78,   speed: 18,
    attackInterval: 2.2,   attackWindup: 0.40,
    kbCount: 4,
    scale: 1.0,
    attackType: 'area',
    areaRadius: 50,
    projectile: null,
    /* とくしゅのうりょく：30%で あいての こうげきりょくを 3びょう さげる */
    weaken: { chance: 0.30, rate: 0.6, duration: 3.0 },
    money: 80,
  },

  /* ヤマネム ── ねぶくろで ねむって いる やまね。ゆめの あわで どんそくに */
  yamanemu: {
    id: 'yamanemu', name: 'ヤマネム',
    rarity: 'N',
    attr: 'none',
    hp: 370,    atk: 40,   range: 120,  speed: 6,
    attackInterval: 2.4,   attackWindup: 0.50,
    kbCount: 2,
    scale: 0.95,
    attackType: 'area',
    areaRadius: 55,
    projectile: 'bubble',
    /* とくしゅのうりょく：20%で 2びょう どんそくに する */
    slow: { rate: 0.5, duration: 2.0, chance: 0.20 },
    money: 40,
  },

  /* モエリス ── ほのおを まとった りす。もえる どんぐりを なげる。
                くさの あいてに とくに つよい                        */
  moeris: {
    id: 'moeris', name: 'モエリス',
    rarity: 'R',
    attr: ['beast', 'fire'],              // 2ぞくせい もち
    hp: 260,    atk: 160,  range: 200,  speed: 55,
    attackInterval: 2.0,   attackWindup: 0.40,
    kbCount: 2,
    scale: 0.95,
    attackType: 'single',
    projectile: 'nut',
    /* とくしゅのうりょく：くさの あいてに よぶんに ダメージ */
    bonusVs: { attrs: ['grass'], mult: 1.4 },
    money: 50,
  },

  /* ツユガエル ── はっぱの かさを さした かえる。しずくを とばす */
  tsuyugaeru: {
    id: 'tsuyugaeru', name: 'ツユガエル',
    rarity: 'R',
    attr: ['beast', 'water'],             // 2ぞくせい もち
    hp: 600,    atk: 100,  range: 150,  speed: 30,
    attackInterval: 2.0,   attackWindup: 0.40,
    kbCount: 3,
    scale: 1.0,
    attackType: 'area',
    areaRadius: 48,
    projectile: 'drop',
    /* とくしゅのうりょく：25%で あいてを ふきとばす */
    knockbackChance: 0.25,
    money: 85,
  },

  /* コケジカ ── こけと きのこを せおった しか。ピンチで 1どだけ たちなおる */
  kokejika: {
    id: 'kokejika', name: 'コケジカ',
    rarity: 'GR',
    attr: ['beast', 'grass'],             // 2ぞくせい もち
    hp: 1410,   atk: 100,  range: 78,   speed: 28,
    attackInterval: 1.8,   attackWindup: 0.35,
    kbCount: 3,
    scale: 1.1,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：たいりょく 50%いかで 1どだけ 30% かいふく */
    healOnce: { below: 0.5, rate: 0.3 },
    money: 90,
  },

  /* ハリ千本 ── はりねずみ。はりを いっせいに とばす とおくの こうげき */
  harisenbon: {
    id: 'harisenbon', name: 'ハリ千本',
    rarity: 'R',
    attr: 'beast',
    hp: 470,    atk: 220,  range: 190,  speed: 16,
    attackInterval: 2.6,   attackWindup: 0.60,
    kbCount: 2,
    scale: 0.95,
    attackType: 'area',
    areaRadius: 52,
    projectile: 'needle',
    /* とくしゅのうりょく：20%で かいしんの いちげき */
    crit: { chance: 0.20, mult: 2 },
    money: 100,
  },

  /* クマった ── こまった かおの くま。おもたい ひとふりで ちからを ぬく。
                なかなか ふきとばされない                              */
  kumatta: {
    id: 'kumatta', name: 'クマった',
    rarity: 'GR',
    attr: 'beast',
    hp: 2120,   atk: 150,  range: 62,   speed: 14,
    attackInterval: 2.4,   attackWindup: 0.50,
    kbCount: 6,                           // ノックバックしにくい
    scale: 1.15,
    attackType: 'area',
    areaRadius: 50,
    projectile: null,
    /* とくしゅのうりょく：30%で あいての こうげきりょくを さげる */
    weaken: { chance: 0.30, rate: 0.7, duration: 3.0 },
    money: 190,
  },

  /* ヌシノオオカミ ── けものみちの ぬし。だい5コースの ちゅうボス。
                     たいりょくが はんぶんを きると ほんきを だす      */
  nushinoookami: {
    id: 'nushinoookami', name: 'ヌシノオオカミ',
    rarity: 'SR',
    attr: 'beast',
    hp: 2540,   atk: 185,  range: 90,   speed: 52,
    attackInterval: 1.9,   attackWindup: 0.40,
    kbCount: 4,
    scale: 1.25,
    attackType: 'area',
    areaRadius: 58,
    projectile: null,
    /* とくしゅのうりょく */
    enrage: { below: 0.5, atkMult: 1.5 },   // たいりょく 50%いかで こうげき 1.5ばい
    knockbackChance: 0.30,                  // 30%で ふきとばす
    money: 260,
    isBoss: true,
  },

  /* 森喰らい・ガオウ ── けものみちの おおボス。もりを まるごと たべる。
                       ふきとばされず、ピンチで こうげきが はやく なる   */
  gaou: {
    id: 'gaou', name: '森喰らい・ガオウ',
    rarity: 'SR',
    attr: ['beast', 'grass'],             // 2ぞくせい もち
    hp: 2740,   atk: 235,  range: 160,  speed: 12,
    attackInterval: 2.8,   attackWindup: 0.70,
    kbCount: 99,
    scale: 1.4,
    attackType: 'area',
    areaRadius: 70,
    projectile: null,
    /* とくしゅのうりょく */
    kbImmune: true,                              // ノックバック むこう
    slow: { rate: 0.5, duration: 3.0, chance: 0.20 },   // 20%で 3びょう どんそく
    enrage: { below: 0.4, intervalMult: 0.6 },   // たいりょく 40%いかで こうげきが はやく
    money: 235,
    isBoss: true,
  },


  /* ============================================================
     ここから した は だい7しょう「闇の頂」の てき

     ★「覚醒」ボス
        これまで たおして きた ボスたちが、闇の ちからで よみがえった すがた。
        6しょうを クリアした ころの じつりょくに あわせて、
        たいりょくと こうげきりょくを ぐんと あげて ある。
        もとの ボスの くせ（ふきとび無効・きぜつ・はんい…）は そのまま。
     ============================================================ */

  /* --- 1しょう組 --- */
  hetakirin_x: {
    id: 'hetakirin_x', name: '覚醒 下手なきりん',
    rarity: 'SR',
    attr: 'grass',
    hp: 3430,  atk: 225,  range: 150,  speed: 12,
    attackInterval: 2.8,   attackWindup: 0.55,
    kbCount: 8, scale: 1.5,
    attackType: 'area', areaRadius: 60, projectile: 'grass',
    money: 285,
    isBoss: true,
  },
  okashiman_x: {
    id: 'okashiman_x', name: '覚醒 お菓子マン',
    rarity: 'LR',
    attr: 'power',
    hp: 5770,  atk: 390,  range: 130,  speed: 11,
    attackInterval: 1.9,   attackWindup: 0.9,
    kbCount: 8, scale: 1.55,
    attackType: 'single', projectile: 'stone',
    stun: { duration: 1.5, chance: 0.18 },
    money: 415,
    isBoss: true,
  },

  /* --- 3しょう（けもの）組 --- */
  nushinoookami_x: {
    id: 'nushinoookami_x', name: '覚醒 ヌシノオオカミ',
    rarity: 'SR',
    attr: 'beast',
    hp: 3230,  atk: 215,  range: 100,  speed: 56,
    attackInterval: 1.8,   attackWindup: 0.35,
    kbCount: 8, scale: 1.4,
    attackType: 'area', areaRadius: 64, projectile: null,
    knockbackChance: 0.15,
    enrage: { below: 0.5, atkMult: 1.5 },
    money: 365,
    isBoss: true,
  },
  gaou_x: {
    id: 'gaou_x', name: '覚醒 森喰らい・ガオウ',
    rarity: 'SR',
    attr: ['beast', 'grass'],
    hp: 3580,  atk: 245,  range: 175,  speed: 14,
    attackInterval: 2.6,   attackWindup: 0.65,
    kbCount: 99, scale: 1.55,
    attackType: 'area', areaRadius: 78, projectile: null,
    kbImmune: true,
    slow: { rate: 0.5, duration: 3.0, chance: 0.15 },
    enrage: { below: 0.4, intervalMult: 0.6 },
    money: 320,
    isBoss: true,
  },

  /* --- 4しょう（メタル）組 --- */
  garakutei_x: {
    id: 'garakutei_x', name: '覚醒 ガラク帝',
    rarity: 'SR',
    attr: 'metal',
    hp: 4100,  atk: 225,  range: 165,  speed: 16,
    attackInterval: 2.5,   attackWindup: 0.5,
    kbCount: 99, scale: 1.45,
    attackType: 'area', areaRadius: 68, projectile: null,
    kbImmune: true,
    enrage: { below: 0.5, atkMult: 1.5 },
    money: 350,
    isBoss: true,
  },
  meltgear_x: {
    id: 'meltgear_x', name: '覚醒 廃炉獣メルトギア',
    rarity: 'SR',
    attr: ['metal', 'fire'],
    hp: 4280,  atk: 230,  range: 200,  speed: 14,
    attackInterval: 2.8,   attackWindup: 0.7,
    kbCount: 99, scale: 1.6,
    attackType: 'area', areaRadius: 78, projectile: null,
    kbImmune: true,
    weaken: { chance: 0.25, rate: 0.7, duration: 3.0 },
    enrage: { below: 0.3, intervalMult: 0.6 },
    money: 330,
    isBoss: true,
  },

  /* --- 5しょう（うみ）組 --- */
  nereid_x: {
    id: 'nereid_x', name: '覚醒 深海の主 ネレイド',
    rarity: 'SR',
    attr: ['water', 'magic'],
    hp: 4030,  atk: 245,  range: 220,  speed: 26,
    attackInterval: 2.7,   attackWindup: 0.65,
    kbCount: 99, scale: 1.45,
    attackType: 'area', areaRadius: 88, projectile: 'drop',
    kbImmune: true,
    enrage: { below: 0.5, atkMult: 1.5 },
    money: 340,
    isBoss: true,
  },
  leviza_x: {
    id: 'leviza_x', name: '覚醒 暴海竜リヴァイザ',
    rarity: 'SR',
    attr: ['water', 'power'],
    hp: 3820,  atk: 230,  range: 230,  speed: 14,
    attackInterval: 2.9,   attackWindup: 0.75,
    kbCount: 99, scale: 1.5,
    attackType: 'area', areaRadius: 92, projectile: 'drop',
    kbImmune: true,
    knockbackChance: 0.20,
    enrage: { below: 0.3, intervalMult: 0.6 },
    money: 295,
    isBoss: true,
  },
  zabaan_x: {
    id: 'zabaan_x', name: '覚醒 波獣ザバーン',
    rarity: 'LR',
    attr: 'water',
    hp: 7970,  atk: 110,  range: 215,  speed: 18,
    attackInterval: 0.5,   attackWindup: 0.15,
    kbCount: 99, scale: 1.75,
    attackType: 'single', projectile: 'splash',
    kbImmune: true,
    money: 610,
    isBoss: true,
  },

  /* --- 2しょう／6しょう（まどうし）組 --- */
  onigon_x: {
    id: 'onigon_x', name: '覚醒 獄熱オニごん',
    rarity: 'SR',
    attr: ['fire', 'magic'],
    hp: 3990,  atk: 235,  range: 320,  speed: 24,
    minRange: 130,
    attackInterval: 3.4,   attackWindup: 0.85,
    kbCount: 10, scale: 1.5,
    attackType: 'area', areaRadius: 68, projectile: 'dango',
    burn: { chance: 0.25, dps: 90, duration: 3.0 },
    money: 270,
    isBoss: true,
  },
  sagecharon_x: {
    id: 'sagecharon_x', name: '覚醒 賢者カロン',
    rarity: 'SR',
    attr: ['none', 'magic'],
    hp: 3830,  atk: 225,  range: 230,  speed: 20,
    attackInterval: 2.7,   attackWindup: 0.65,
    kbCount: 99, scale: 1.45,
    attackType: 'area', areaRadius: 86, projectile: 'beam',
    kbImmune: true,
    stun:   { duration: 3.0, chance: 0.30 },
    weaken: { chance: 0.30, rate: 0.5, duration: 5.0 },
    money: 305,
    isBoss: true,
  },
  zenos_x: {
    id: 'zenos_x', name: '覚醒 終焉の大魔導士ゼノス',
    rarity: 'LR',
    attr: ['none', 'magic'],
    hp: 6610,  atk: 345,  range: 270,  speed: 12,
    attackInterval: 3.0,   attackWindup: 0.75,
    kbCount: 99, scale: 1.7,
    attackType: 'area', areaRadius: 98, projectile: 'beam',
    kbImmune: true,
    stun:   { duration: 4.0, chance: 0.25 },
    weaken: { chance: 0.20, rate: 0.8, duration: 3.0 },
    money: 480,
    isBoss: true,
  },

  /* ============================================================
     ★★ 闇堕ちあき坊 ── だい7しょうの さいごの ボス ★★

     あき坊の いろちがい。くろ・グレー・シルバーを きほんに、
     めだけが まっかに ひかる。闇の ちからに あやつられた すがた。

     ぞくせい：かみ ＋ ゆうれい の 2つもち
       → かみ  ：ぜんぶの ぞくせいに つよく（あたえる 1.2ばい／うける 0.8ばい）
       → ゆうれい：あいしょうは ぜんぶ ふつう。でも──

     ★★ むぞくせい と パワー の こうげきが きかない（ダメージ 0）★★
        しゅりへん・ドンドコ力士・豪傑天むす丸・ずにお・ぷりおぷりねこ・
        タンクン・かべくん の こうげきは とおらない。
        （ふくごう ぞくせい なら とおる、という ルールは 霊太郎と おなじ）

     ★ぶきに なるのは「ほんもの の あき坊」だけ
        かみ ぞくせい どうしなので、あき坊の こうげきだけが 1.44ばい とおり、
        うける ダメージも 0.96ばいで すむ。
        ほかは ひー坊・スティーブ・バケ着 など ぞくせいもちで せめる。

     ★はどう レベル5 ＋ ひろい はんいこうげき。
       かべを ならべても うしろまで まとめて けずられる。
     ============================================================ */
  yamiakibou: {
    id: 'yamiakibou', name: '闇堕ちあき坊',
    rarity: 'LR',
    attr: ['god', 'ghost'],
    hp: 14180,  atk: 245,  range: 360,  speed: 15,
    attackInterval: 2.8,   attackWindup: 0.75,
    kbCount: 99, scale: 2.1,
    attackType: 'area', areaRadius: 105, projectile: null,
    kbImmune: true,
    /* ★むぞくせい と パワーの こうげきは ダメージ 0 */
    nullify: { attrs: ['none', 'power'] },
    /* ★はどう レベル5 */
    wave: { level: 5, damageRate: 1.0 },
    stun:   { duration: 2.5, chance: 0.22 },
    weaken: { chance: 0.25, rate: 0.6, duration: 4.0 },
    enrage: { below: 0.35, intervalMult: 0.65 },
    money: 670,
    isBoss: true,
  },

  /* ============================================================
     ここから した は だい6しょう「魔導士の里」の てき
     ほとんどが まじゅつし。けもの（シャドウヤマネコ）が とても ゆうり
     ============================================================ */

  /* ① ルンルンウィスプ ── ふわふわ ただよう ちいさな まほうだま */
  runrunwisp: {
    id: 'runrunwisp', name: 'ルンルンウィスプ',
    rarity: 'N',
    attr: 'none',
    hp: 450,    atk: 50,   range: 175,  speed: 26,
    attackInterval: 1.6,   attackWindup: 0.35,
    kbCount: 3, scale: 0.9,
    attackType: 'single', projectile: 'bubble',
    money: 45,
  },

  /* ② ホウキゴブ ── ほうきに のった くろねこ。すばやく つっこむ */
  houkigob: {
    id: 'houkigob', name: 'ホウキゴブ',
    rarity: 'R',
    attr: 'magic',
    hp: 440,    atk: 75,  range: 70,   speed: 52,
    attackInterval: 1.3,   attackWindup: 0.30,
    kbCount: 3, scale: 0.95,
    attackType: 'single', projectile: null,
    /* 10%で あいてを 1びょう とめる */
    stun: { duration: 1.0, chance: 0.10 },
    money: 55,
  },

  /* ③ マジックラビット ── まきものを よむ うさぎ。ちからを ぬく */
  magicrabbit: {
    id: 'magicrabbit', name: 'マジックラビット',
    rarity: 'R',
    attr: 'magic',
    hp: 990,   atk: 120,  range: 190,  speed: 26,
    attackInterval: 2.0,   attackWindup: 0.40,
    kbCount: 3, scale: 1.0,
    attackType: 'single', projectile: 'moji',
    /* 15%で あいての こうげきりょくを 3びょう はんぶんに */
    weaken: { chance: 0.15, rate: 0.5, duration: 3.0 },
    money: 95,
  },

  /* ④ フレイムメイジ ── ほのおの まどうし。あいてを えんじょうさせる */
  flamemage: {
    id: 'flamemage', name: 'フレイムメイジ',
    rarity: 'GR',
    attr: ['fire', 'magic'],
    hp: 1030,   atk: 215,  range: 210,  speed: 26,
    attackInterval: 2.4,   attackWindup: 0.50,
    kbCount: 3, scale: 1.0,
    attackType: 'area', areaRadius: 60, projectile: 'fireball',
    /* ★20%で あいてを 3びょう えんじょうさせる（じわじわ ダメージ）*/
    burn: { chance: 0.20, dps: 60, duration: 3.0 },
    money: 145,
  },

  /* ⑤ アイスウィッチ ── こおりの まじょ。うごきを おそくする */
  icewitch: {
    id: 'icewitch', name: 'アイスウィッチ',
    rarity: 'GR',
    attr: ['water', 'magic'],
    hp: 1010,   atk: 150,  range: 210,  speed: 18,
    attackInterval: 2.2,   attackWindup: 0.45,
    kbCount: 3, scale: 1.0,
    attackType: 'area', areaRadius: 58, projectile: 'drop',
    slow: { rate: 0.5, duration: 2.0, chance: 0.20 },
    money: 120,
  },

  /* ⑥ マンドレイク ── さけぶ ねっこ。おとで ふきとばす */
  mandrake: {
    id: 'mandrake', name: 'マンドレイク',
    rarity: 'GR',
    attr: ['grass', 'magic'],
    hp: 1700,   atk: 145,  range: 130,  speed: 12,
    attackInterval: 2.4,   attackWindup: 0.50,
    kbCount: 4, scale: 1.05,
    attackType: 'area', areaRadius: 62, projectile: null,
    knockbackChance: 0.20,
    money: 155,
  },

  /* ⑦ ルーンゴーレム ── ルーンが ひかる いしの きょじん */
  runegolem: {
    id: 'runegolem', name: 'ルーンゴーレム',
    rarity: 'GR',
    attr: 'magic',
    hp: 1820,   atk: 175,  range: 75,   speed: 12,
    attackInterval: 2.8,   attackWindup: 0.60,
    kbCount: 6, scale: 1.25,
    attackType: 'area', areaRadius: 66, projectile: null,
    /* 30%で あいてを 2びょう とめる */
    stun: { duration: 2.0, chance: 0.30 },
    money: 170,
  },

  /* ⑧ カオススペル ── うかぶ まほうしょ。あいての こうげきを ふうじる */
  chaosspell: {
    id: 'chaosspell', name: 'カオススペル',
    rarity: 'GR',
    attr: ['none', 'magic'],
    hp: 1250,   atk: 225,  range: 200,  speed: 26,
    attackInterval: 2.6,   attackWindup: 0.55,
    kbCount: 4, scale: 1.05,
    attackType: 'area', areaRadius: 70, projectile: 'beam',
    /* ★20%で 5びょう こうげき できなく する（ぜんぶ はずれる）*/
    blind: { chance: 0.20, duration: 5.0, missRate: 1.0 },
    money: 160,
  },

  /* ⑨ 賢者カロン ── だい5コースの ちゅうボス。とめて、ちからを ぬく */
  sagecharon: {
    id: 'sagecharon', name: '賢者カロン',
    rarity: 'SR',
    attr: ['none', 'magic'],
    hp: 2880,   atk: 200,  range: 210,  speed: 18,
    attackInterval: 2.8,   attackWindup: 0.70,
    kbCount: 99, scale: 1.3,
    attackType: 'area', areaRadius: 78, projectile: 'beam',
    kbImmune: true,
    stun:   { duration: 3.0, chance: 0.30 },
    weaken: { chance: 0.30, rate: 0.5, duration: 5.0 },
    money: 215,
    isBoss: true,
  },

  /* ⑩ 終焉の大魔導士ゼノス ── だい6しょうの おおボス。すべての まほうが あつまる */
  zenos: {
    id: 'zenos', name: '終焉の大魔導士ゼノス',
    rarity: 'LR',
    attr: ['none', 'magic'],
    hp: 5380,  atk: 305,  range: 250,  speed: 10,
    attackInterval: 3.2,   attackWindup: 0.80,
    kbCount: 99, scale: 1.5,
    attackType: 'area', areaRadius: 90, projectile: 'beam',
    kbImmune: true,
    stun:   { duration: 5.0, chance: 0.20 },
    weaken: { chance: 0.15, rate: 0.8, duration: 3.0 },
    money: 350,
    isBoss: true,
  },

  /* ============================================================
     ここから した は だい5しょう「賑わう近海」の てき
     ほとんどが みず ぞくせい。くさ（フタバッポ・たたみん）が とても ゆうり
     ============================================================ */

  /* ① プカクラゲ ── ふわふわ ただよう くらげ。しょくしゅで こうげき */
  pukakurage: {
    id: 'pukakurage', name: 'プカクラゲ',
    rarity: 'N',
    attr: 'water',
    hp: 620,    atk: 60,   range: 66,   speed: 26,
    attackInterval: 1.4,   attackWindup: 0.30,
    kbCount: 3, scale: 0.95,
    attackType: 'single', projectile: null,
    money: 65,
  },

  /* ② チビサメ ── すばやく とっしんして かみつく */
  chibisame: {
    id: 'chibisame', name: 'チビサメ',
    rarity: 'GR',
    attr: 'water',
    hp: 970,   atk: 130,  range: 62,   speed: 70,
    attackInterval: 1.2,   attackWindup: 0.25,
    kbCount: 3, scale: 1.0,
    attackType: 'single', projectile: null,
    money: 110,
  },

  /* ③ イカマジン ── みずの まほうで こうはんいを こうげき */
  ikamajin: {
    id: 'ikamajin', name: 'イカマジン',
    rarity: 'GR',
    attr: ['water', 'magic'],
    hp: 870,   atk: 120,  range: 180,  speed: 26,
    attackInterval: 2.2,   attackWindup: 0.45,
    kbCount: 3, scale: 1.0,
    attackType: 'area', areaRadius: 55, projectile: 'bubble',
    /* 30%で あいての はやさを 3びょう さげる */
    slow: { rate: 0.5, duration: 3.0, chance: 0.30 },
    money: 85,
  },

  /* ④ トゲフグ ── ふくらんで しゅういに ダメージ */
  togefugu: {
    id: 'togefugu', name: 'トゲフグ',
    rarity: 'GR',
    attr: 'water',
    hp: 1820,   atk: 70,  range: 70,   speed: 12,
    attackInterval: 2.4,   attackWindup: 0.50,
    kbCount: 5, scale: 1.05,
    attackType: 'area', areaRadius: 60, projectile: null,
    /* 20%で あいてを うしろに ふきとばす */
    knockbackChance: 0.20,
    money: 95,
  },

  /* ⑤ オクトキャノン ── すみだんを うつ たこ。こうはんいを こうげき */
  octocannon: {
    id: 'octocannon', name: 'オクトキャノン',
    rarity: 'GR',
    attr: ['water', 'power'],
    hp: 1170,   atk: 195,  range: 190,  speed: 16,
    attackInterval: 2.6,   attackWindup: 0.55,
    kbCount: 4, scale: 1.05,
    attackType: 'area', areaRadius: 62, projectile: 'ink',
    /* 20%で あいての こうげきりょくを 3びょう さげる */
    weaken: { chance: 0.20, rate: 0.7, duration: 3.0 },
    money: 140,
  },

  /* ⑥ ウミヘビ ── しなやかに すばやく かみつく */
  umihebi: {
    id: 'umihebi', name: 'ウミヘビ',
    rarity: 'GR',
    attr: 'water',
    hp: 1310,   atk: 150,  range: 70,   speed: 66,
    attackInterval: 1.5,   attackWindup: 0.30,
    kbCount: 3, scale: 1.0,
    attackType: 'single', projectile: null,
    /* 30%で あいてを 1びょう とめる */
    stun: { duration: 1.0, chance: 0.30 },
    money: 135,
  },

  /* ⑦ カニタンク ── きょだいな ハサミと ほうげきで ぜんせんを あっぱく */
  kanitank: {
    id: 'kanitank', name: 'カニタンク',
    rarity: 'GR',
    attr: 'water',
    hp: 1940,   atk: 185,  range: 130,  speed: 12,
    attackInterval: 3.0,   attackWindup: 0.70,
    kbCount: 6, scale: 1.2,
    attackType: 'area', areaRadius: 70, projectile: null,
    /* 30%で あいてを ふきとばす */
    knockbackChance: 0.30,
    money: 175,
  },

  /* ⑧ ダイオウエイ ── おおきな ひれで かいりゅうを おこす */
  daiouei: {
    id: 'daiouei', name: 'ダイオウエイ',
    rarity: 'GR',
    attr: 'water',
    hp: 1890,   atk: 180,  range: 150,  speed: 34,
    attackInterval: 2.6,   attackWindup: 0.60,
    kbCount: 8,                          // ノックバックしにくい
    scale: 1.2,
    attackType: 'area', areaRadius: 75, projectile: null,
    money: 185,
  },

  /* ⑨ 深海の主 ネレイド ── うみを すべる ちゅうボス。
                          たいりょくが はんぶんを きると ほんきを だす */
  nereid: {
    id: 'nereid', name: '深海の主 ネレイド',
    rarity: 'SR',
    attr: ['water', 'magic'],
    hp: 2920,   atk: 235,  range: 200,  speed: 24,
    attackInterval: 2.8,   attackWindup: 0.70,
    kbCount: 99, scale: 1.3,
    attackType: 'area', areaRadius: 80, projectile: 'drop',
    kbImmune: true,
    enrage: { below: 0.5, atkMult: 1.5 },
    money: 250,
    isBoss: true,
  },

  /* ⑩ 暴海竜リヴァイザ ── きんかいの すべてを のみこむ りゅう */
  leviza: {
    id: 'leviza', name: '暴海竜リヴァイザ',
    rarity: 'SR',
    attr: ['water', 'power'],
    hp: 2870,   atk: 230,  range: 210,  speed: 12,
    attackInterval: 3.0,   attackWindup: 0.80,
    kbCount: 99, scale: 1.35,
    attackType: 'area', areaRadius: 85, projectile: 'drop',
    kbImmune: true,
    knockbackChance: 0.20,
    enrage: { below: 0.3, intervalMult: 0.6 },
    money: 225,
    isBoss: true,
  },

  /* ★ 波獣ザバーン ── だい5しょうの おおボス。
                    おおきな なみそのものが いきものに なった すがた。
                    みずを とばして 0.5びょうごとに こうげきする。
                    たいりょくは お菓子マンの 4ばい。
                    字一龍 1たいと むれで こうどうする                */
  zabaan: {
    id: 'zabaan', name: '波獣ザバーン',
    rarity: 'LR',
    attr: 'water',
    hp: 10180,  atk: 75,  range: 200,  speed: 16,
    attackInterval: 0.5,   attackWindup: 0.15,   // こうげき クールタイム 0.5びょう
    kbCount: 99, scale: 1.6,
    attackType: 'single', projectile: 'splash',
    kbImmune: true,
    money: 545,
    isBoss: true,
  },

  /* ============================================================
     ここから した は だい4しょう「廃れたメカニック工場」の てき
     ほとんどが メタル。ほのお・まじゅつし・パワーが とても ゆうり
     ============================================================ */

  /* ① ネジロー ── あたまを こうそくかいてんさせて たいあたり */
  nejiro: {
    id: 'nejiro', name: 'ネジロー',
    rarity: 'R',
    attr: 'metal',
    hp: 480,    atk: 65,  range: 60,   speed: 30,
    attackInterval: 1.4,   attackWindup: 0.30,
    kbCount: 3,
    scale: 0.95,
    attackType: 'single',
    projectile: null,
    money: 50,
  },

  /* ② ハコボット ── にもつを おしつけて こうげき。ふきとばされにくい */
  hakobot: {
    id: 'hakobot', name: 'ハコボット',
    rarity: 'R',
    attr: 'none',
    hp: 1300,   atk: 60,   range: 58,   speed: 14,
    attackInterval: 2.0,   attackWindup: 0.35,
    kbCount: 6,                           // ノックバックしにくい
    scale: 1.05,
    attackType: 'single',
    projectile: null,
    money: 75,
  },

  /* ③ サビンチ ── さびた ペンチ。ガチンと はさんで うごきを とめる */
  sabinchi: {
    id: 'sabinchi', name: 'サビンチ',
    rarity: 'R',
    attr: 'metal',
    hp: 840,   atk: 105,  range: 78,   speed: 40,
    attackInterval: 1.6,   attackWindup: 0.30,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: null,
    /* とくしゅのうりょく：20%で あいてを 1びょう とめる */
    stun: { duration: 1.0, chance: 0.20 },
    money: 95,
  },

  /* ④ バーナー君 ── バーナーの ほのおで こうはんいを やく */
  burner: {
    id: 'burner', name: 'バーナー君',
    rarity: 'GR',
    attr: ['metal', 'fire'],              // 2ぞくせい もち
    hp: 890,   atk: 150,  range: 150,  speed: 28,
    attackInterval: 2.2,   attackWindup: 0.45,
    kbCount: 3,
    scale: 1.0,
    attackType: 'area',
    areaRadius: 62,
    projectile: 'flame',
    money: 105,
  },

  /* ⑤ ポタンク ── こうあつの みずを ふんしゃする。ふきとばす */
  potank: {
    id: 'potank', name: 'ポタンク',
    rarity: 'GR',
    attr: ['metal', 'water'],             // 2ぞくせい もち
    hp: 1560,   atk: 110,  range: 150,  speed: 18,
    attackInterval: 2.2,   attackWindup: 0.45,
    kbCount: 4,
    scale: 1.05,
    attackType: 'area',
    areaRadius: 55,
    projectile: 'drop',
    /* とくしゅのうりょく：30%で あいてを うしろに ふきとばす */
    knockbackChance: 0.30,
    money: 130,
  },

  /* ⑥ モジャコード ── のびた コードで たたきつける。うごきを おそくする */
  mojacord: {
    id: 'mojacord', name: 'モジャコード',
    rarity: 'R',
    attr: ['metal', 'grass'],             // 2ぞくせい もち
    hp: 960,   atk: 110,  range: 185,  speed: 38,
    attackInterval: 2.0,   attackWindup: 0.40,
    kbCount: 3,
    scale: 1.0,
    attackType: 'single',
    projectile: 'cord',
    /* とくしゅのうりょく：30%で あいての はやさを 3びょう さげる */
    slow: { rate: 0.5, duration: 3.0, chance: 0.30 },
    money: 90,
  },

  /* ⑦ フォークン ── フォークで とっしんし、なぎたおす */
  forkun: {
    id: 'forkun', name: 'フォークン',
    rarity: 'GR',
    attr: 'metal',
    hp: 1660,   atk: 145,  range: 62,   speed: 46,
    attackInterval: 2.0,   attackWindup: 0.40,
    kbCount: 4,
    scale: 1.15,
    attackType: 'area',
    areaRadius: 52,
    /* とくしゅのうりょく：50%で あいてを ふきとばす */
    knockbackChance: 0.50,
    projectile: null,
    money: 180,
  },

  /* ⑧ プレスケ ── きょだいな プレスで じめんごと おしつぶす */
  pressuke: {
    id: 'pressuke', name: 'プレスケ',
    rarity: 'GR',
    attr: 'metal',
    hp: 2120,   atk: 200,  range: 80,   speed: 8,
    attackInterval: 3.0,   attackWindup: 0.70,
    kbCount: 5,
    scale: 1.2,
    attackType: 'area',
    areaRadius: 60,
    projectile: null,
    money: 195,
  },

  /* ⑨ ガラク帝 ── はがねの おう。だい5コースの ちゅうボス */
  garakutei: {
    id: 'garakutei', name: 'ガラク帝',
    rarity: 'SR',
    attr: 'metal',
    hp: 2520,   atk: 180,  range: 150,  speed: 14,
    attackInterval: 2.6,   attackWindup: 0.55,
    kbCount: 99,
    scale: 1.3,
    attackType: 'area',
    areaRadius: 62,
    projectile: null,
    /* とくしゅのうりょく */
    kbImmune: true,                          // ノックバック むこう
    enrage: { below: 0.5, atkMult: 1.5 },    // たいりょく 50%いかで こうげき 1.5ばい
    money: 190,
    isBoss: true,
  },

  /* ⑩ 廃炉獣メルトギア ── すたれた ろが せかいを のみこむ。さいしゅうボス */
  meltgear: {
    id: 'meltgear', name: '廃炉獣メルトギア',
    rarity: 'SR',
    attr: ['metal', 'fire'],              // 2ぞくせい もち
    hp: 3040,   atk: 190,  range: 185,  speed: 12,
    attackInterval: 3.0,   attackWindup: 0.75,
    kbCount: 99,
    scale: 1.45,
    attackType: 'area',
    areaRadius: 70,
    projectile: null,
    /* とくしゅのうりょく */
    kbImmune: true,
    weaken: { chance: 0.20, rate: 0.7, duration: 3.0 },   // 20%で こうげきりょく ダウン
    enrage: { below: 0.3, intervalMult: 0.6 },            // 30%いかで こうげきが はやく
    money: 200,
    isBoss: true,
  },

  /* 獄熱オニごん ── あかおに と あおおに の ふたりぐみで 1たいの おおボス。
                   2にんで わるさを しながら、とおくから キビだんごを なげて くる。
                   ★はじめての「2ぞくせい もち」＝ ほのお ＋ まじゅつし
                     → みず でも けもの でも 2.5ばいが とおる（こうりゃくの みちが 2つ）
                   ★ふところ（minRange）に はいられると、ちかすぎて なげられない。
                     その ばで あわてる だけ。ここが かけひきの キモ       */
  onigon: {
    id: 'onigon', name: '獄熱オニごん',
    rarity: 'SR',
    attr: ['fire', 'magic'],              // ★ 2ぞくせい もち
    hp: 2740,   atk: 205,  range: 300,   speed: 22,
    minRange: 130,                        // ★ これより ちかいと なげられない
    attackInterval: 3.6,   attackWindup: 0.9,
    kbCount: 5,
    scale: 1.35,
    attackType: 'area',                   // ちゃくだんてんで ばくはつ
    areaRadius: 60,
    projectile: 'dango',                  // キビだんご
    money: 170,
    isBoss: true,
  },

  /* 下手なきりん ── ボス。くさを とばす はんいこうげき */
  hetakirin: {
    id: 'hetakirin', name: '下手なきりん',
    rarity: 'SR',
    attr: 'grass',
    hp: 1700,   atk: 285,  range: 135,  speed: 10,
    attackInterval: 3.0,   attackWindup: 0.6,
    kbCount: 4,
    scale: 1.35,
    attackType: 'area',
    areaRadius: 52,
    projectile: 'grass',
    money: 180,
    isBoss: true,
  },

  /* ほしくん ── きいろい ほし。ほしを とばして はんいこうげき。
               50%で あいてを うしろに ふっとばす。クールタイム 4びょう  */
  hoshikun: {
    id: 'hoshikun', name: 'ほしくん',
    rarity: 'R',
    attr: 'none',
    hp: 710,   atk: 245,  range: 125,  speed: 30,
    attackInterval: 4.0,   attackWindup: 0.5,    // クールタイム 4びょう
    kbCount: 3,
    scale: 1.1,
    attackType: 'area',                          // はんい こうげき
    areaRadius: 62,
    projectile: 'star',
    /* とくしゅのうりょく：50%の かくりつで うしろに ふきとばす */
    knockbackChance: 0.50,
    money: 110,             // む ぞくせい なので すくなめ
  },

  /* コンガラガーン ── あおい しかくい あたま と オレンジの からだ。
                      みずいろの やじるしの てを のばして こうげきする。
                      メタルぞくせい：ほのお・まじゅつし・パワー に よわい かわりに
                      きそのうりょくが たかい。字一龍 と むれで やってくる  */
  kongaragan: {
    id: 'kongaragan', name: 'コンガラガーン',
    rarity: 'GR',
    attr: 'metal',
    hp: 1190,   atk: 285,  range: 120,  speed: 45,
    attackInterval: 2.2,   attackWindup: 0.45,   // てを のばす
    kbCount: 3,
    scale: 1.15,
    attackType: 'single',
    projectile: null,                            // ちょくせつ てを のばして なぐる
    /* とくしゅのうりょく：60%の かくりつで クリティカル（ダメージ 2ばい）*/
    crit: { chance: 0.60, mult: 2.0 },
    money: 150,
  },

  /* お菓子マン ── さいごの おおボス。
                 あたまの うえの いしを とばして こうげきする。
                 パワーぞくせい なので「まじゅつし」の 時の旅人 が とても よく きく！ */
  okashiman: {
    id: 'okashiman', name: 'お菓子マン',
    rarity: 'LR',
    attr: 'power',
    hp: 3940,   atk: 395,  range: 115,  speed: 9,
    attackInterval: 2.0,   attackWindup: 1.0,   // おおきく ふりかぶって いしを なげる
    kbCount: 4,
    scale: 1.40,
    attackType: 'single',
    projectile: 'stone',
    /* とくしゅのうりょく：30%の かくりつで 1びょうかん うごきを とめる */
    stun: { duration: 1.0, chance: 0.30 },
    money: 290,
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

  /* けものみち（だい3しょう）*/
  kemono: {
    sky: ['#3f6b4a', '#79a86a', '#c9d99a'],
    hillFar: '#4a7a4e', hillNear: '#2f5a35',
    ground: '#5a4a2a', groundTop: '#7a6538',
    deco: 'none',
  },

  /* すたれた メカニック こうじょう（だい4しょう）*/
  haikoujou: {
    sky: ['#4a4038', '#7a6a58', '#b8a68c'],
    hillFar: '#5a5048', hillNear: '#3a3430',
    ground: '#3d3a36', groundTop: '#57524a',
    deco: 'none',
  },

  /* にぎわう きんかい（だい5しょう）*/
  kinkai: {
    sky: ['#1e5f8c', '#4aa3cc', '#a8dcee'],
    hillFar: '#2e7fa8', hillNear: '#1a5d80',
    ground: '#12455f', groundTop: '#1e6a8c',
    deco: 'wave',
  },

  /* 魔導士の里（だい6しょう）*/
  mahou: {
    sky: ['#1a0f3d', '#3a2270', '#6b4aa8'],
    hillFar: '#2c1c56', hillNear: '#180e35',
    ground: '#241640', groundTop: '#3a2568',
    deco: 'star',
  },

  /* 闇の頂（だい7しょう・ボスラッシュ）*/
  yami: {
    sky: ['#05040a', '#160d22', '#2e1230'],
    hillFar: '#140a1e', hillNear: '#0a050f',
    ground: '#120a18', groundTop: '#241030',
    deco: 'star',
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
    power: 1.31,            // てきの つよさ 1.00ばい
    reward: { coins: 3, exp: 80 },   // チュートリアルなので Gコイン おおめ
    name: 'はじまりの みち',
    desc: 'トゲハヤさん が でてくるよ',
    bg: 'meadow',
    castleHp: 1300,
    waves: [
      { at: 3,  id: 'togehaya',   count: 1 },
      { at: 16, id: 'togehaya', count: 1 },
      { at: 30, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 50, id: 'togehaya', count: 2, gap: 2.5, repeat: 22 },
    ],
  },

  {
    no: 2,
    chapter: 1,  course: 2,       // だい1ステージ の 2コースめ
    power: 1.34,            // てきの つよさ 1.00ばい
    reward: { coins: 3, exp: 130 },   // ここまでで ガチャ 2かいぶん
    name: 'ひのたま だいぐんだん',
    desc: 'ほのた の むれが おしよせる',
    bg: 'sunset',
    castleHp: 2400,
    waves: [
      { at: 3,  id: 'honota',     count: 3, gap: 0.6 },
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
    power: 1.38,            // てきの つよさ 1.00ばい
    reward: { coins: 1, exp: 170 },
    name: 'さかなの かわ',
    desc: 'saba が すごい はやさで とっしんしてくる',
    bg: 'mizu',
    castleHp: 3000,
    waves: [
      { at: 3,  id: 'saba',       count: 1 },
      { at: 15, id: 'saba',     count: 1 },
      { at: 28, id: 'togehaya', count: 2, gap: 2.0 },
      { at: 40, id: 'saba',     count: 2, gap: 1.4 },
      { at: 54, id: 'togehaya', count: 2, gap: 2.0, repeat: 21 },
      { at: 66, id: 'saba',     count: 2, gap: 1.4, repeat: 19 },
    ],
  },

  {
    no: 5,
    chapter: 1,  course: 4,       // だい1ステージ の 5コースめ
    power: 1.42,            // てきの つよさ 1.05ばい
    reward: { coins: 1, exp: 250 },
    name: 'いわばの みち',
    desc: '字一龍 とうじょう！ ボスでは ないけど つよい',
    bg: 'rock',
    castleHp: 4200,
    waves: [
      { at: 3,  id: 'nyororiinu', count: 2, gap: 0.8 },
      { at: 16, id: 'honota',   count: 3, gap: 0.5 },
      { at: 26, id: 'jiryu',    count: 1 },
      { at: 48, id: 'togehaya', count: 2, gap: 2.0, repeat: 21 },
      { at: 58, id: 'jiryu',    count: 1, repeat: 30 },
      { at: 74, id: 'honota',   count: 3, gap: 0.5, repeat: 20 },
    ],
  },

  {
    no: 6,
    chapter: 1,  course: 5,       // だい1ステージ の 6コースめ
    power: 1.46,            // てきの つよさ 1.05ばい
    reward: { coins: 3, exp: 290 },  // ボスコース
    name: 'よるの もり',
    desc: 'ボス 下手なきりん が まちうける',
    bg: 'night',
    castleHp: 4800,
    waves: [
      { at: 3,  id: 'togehaya',   count: 2, gap: 2.0 },
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
    chapter: 1,  course: 6,       // だい1ステージ の 7コースめ
    power: 1.5,            // てきの つよさ 1.10ばい
    reward: { coins: 1, exp: 320 },
    name: 'ほしの ひろば',
    desc: 'ほしくん とうじょう！ ほしを とばして ふきとばしてくる',
    bg: 'hoshizora',
    castleHp: 2500,
    waves: [
      { at: 3,  id: 'hoshikun',   count: 1 },
      { at: 16, id: 'hoshikun', count: 1 },
      { at: 32, id: 'honota',   count: 3, gap: 0.5 },
      { at: 48, id: 'hoshikun', count: 1, repeat: 34 },
      { at: 62, id: 'togehaya', count: 2, gap: 2.2, repeat: 28 },
      { at: 78, id: 'honota',   count: 3, gap: 0.5, repeat: 26 },
    ],
  },

  {
    no: 7,
    chapter: 1,  course: 7,      // だい1ステージ の さいごの コース（ボス）
    power: 1.53,            // てきの つよさ 1.15ばい
    reward: { coins: 3, exp: 480 },  // ボスコース
    name: 'おかしマンの しろ',
    desc: 'さいご の おおボス お菓子マン。まじゅつし が よく きく！',
    bg: 'boss',
    castleHp: 3900,
    waves: [
      { at: 3,  id: 'blockwan',   count: 1 },
      { at: 14, id: 'honota',   count: 3, gap: 0.5 },
      { at: 28, id: 'saba',     count: 2, gap: 1.4 },
      { at: 42, id: 'jiryu',    count: 1 },
      { at: 58, id: 'togehaya', count: 2, gap: 2.0, repeat: 23 },
      { at: 68, id: 'honota',   count: 4, gap: 0.5, repeat: 21 },
      { at: 82, id: 'saba',     count: 2, gap: 1.4, repeat: 22 },
      { at: 96, id: 'jiryu',    count: 1, repeat: 45 },
      /* ちゅうボス → おおボス の 2だんがまえ */
      { atCastleHp: 0.90, id: 'hetakirin', count: 1 },
      { atCastleHp: 0.60, id: 'okashiman', count: 1 },
    ],
  },

  {
    no: 8,
    chapter: 2,  course: 1,       // だい2ステージ の 1コースめ
    power: 1.32,            // てきの つよさ 1.20ばい
    reward: { coins: 2, exp: 420 },  // ボスコース
    name: 'はがねの ぐんだん',
    desc: 'コンガラガーン とうじょう！ メタルは ほのお・まじゅつし・パワー に よわい',
    bg: 'steel',
    castleHp: 3900,
    waves: [
      { at: 3,  id: 'kongaragan', count: 1 },
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
    no: 13,
    chapter: 2,  course: 2,       // だい2ステージ の 3コースめ（ボス）
    power: 1.36,            // てきの つよさ 1.22ばい
    reward: { coins: 2, exp: 530 },
    name: 'はがねの よる',
    desc: 'メタルぐんだん と 下手なきりん。くらやみの だいけっせん',
    bg: 'night',
    castleHp: 2700,
    waves: [
      { at: 3,  id: 'bakecchin',  count: 2, gap: 1.4 },
      { at: 18,  id: 'kongaragan', count: 1 },
      { at: 34,  id: 'jiryu',      count: 1 },
      { at: 50,  id: 'hoshikun',   count: 1 },
      { at: 66,  id: 'kongaragan', count: 1, repeat: 32 },
      { at: 84,  id: 'saba',       count: 2, gap: 1.4, repeat: 29 },
      { at: 100, id: 'jiryu',      count: 1, repeat: 45 },
      { at: 118, id: 'hoshikun',   count: 1, repeat: 41 },
      /* ボスは てきの しろが 75% まで へると でてくる */
      { atCastleHp: 0.75, id: 'hetakirin', count: 1 },
    ],
  },

  {
    no: 15,
    chapter: 2,  course: 3,       // だい2ステージ の 5コースめ
    power: 1.4,            // てきの つよさ 1.30ばい
    reward: { coins: 1, exp: 500 },
    name: 'ひのたま あらし',
    desc: 'ほのた の だいぐんだん。みずの なかまが かつやくする',
    bg: 'sunset',
    castleHp: 3900,
    waves: [
      { at: 3,  id: 'yakipokkuru',count: 3, gap: 0.6 },
      { at: 16,  id: 'togehaya', count: 2, gap: 2.0 },
      { at: 30,  id: 'honota',   count: 5, gap: 0.4, repeat: 18 },
      { at: 44,  id: 'saba',     count: 2, gap: 1.4, repeat: 26 },
      { at: 60,  id: 'hoshikun', count: 1, repeat: 34 },
      { at: 76,  id: 'togehaya', count: 2, gap: 2.2, repeat: 24 },
    ],
  },

  {
    no: 16,
    chapter: 2,  course: 4,       // だい2ステージ の 6コースめ（ボス）
    power: 1.44,            // てきの つよさ 1.32ばい
    reward: { coins: 3, exp: 560 },
    name: 'りゅうの たに',
    desc: '字一龍 の むれ と お菓子マン。なかばの やま',
    bg: 'rock',
    castleHp: 5000,
    waves: [
      { at: 3,  id: 'jiryu',      count: 1 },
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
  /* ---------------- 2-7 ---------------- */
  {
    no: 18, chapter: 2, course: 5,
    name: 'まほうの としょかん',
    desc: 'モコ魔道士が いっぱい。けもので せめよう',
    bg: 'night',
    castleHp: 4200,
    power: 1.48,
    reward: { coins: 1, exp: 480 },
    waves: [
      { at: 3,  id: 'nyororiinu', count: 3, gap: 0.7 },
      { at: 12, id: 'mokomadoushi', count: 1 },
      { at: 24, id: 'nyororiinu',   count: 3, gap: 0.6 },
      { at: 34, id: 'mokomadoushi', count: 1 },
      { at: 46, id: 'usagorilla',   count: 1 },
      { at: 58, id: 'mokomadoushi', count: 2, gap: 3.0, repeat: 26 },
      { at: 70, id: 'nyororiinu',   count: 3, gap: 0.6, repeat: 18 },
      { at: 84, id: 'togehaya',     count: 2, gap: 2.0, repeat: 24 },
    ],
  },

  /* ---------------- 2-9 ---------------- */
  {
    no: 20, chapter: 2, course: 6,
    name: 'おにが すむ やま',
    desc: 'おおボスの てまえ。ぜんぶの ぞくせいが でる',
    bg: 'rock',
    castleHp: 5200,
    power: 1.52,
    reward: { coins: 1, exp: 560 },
    waves: [
      { at: 3,  id: 'ojiinouenchou', count: 1 },
      { at: 12, id: 'yakipokkuru',  count: 3, gap: 0.6 },
      { at: 24, id: 'kongaragan',   count: 1 },
      { at: 36, id: 'mokomadoushi', count: 1 },
      { at: 46, id: 'kumabee',      count: 1 },
      { at: 58, id: 'usagorilla',   count: 1 },
      { at: 70, id: 'bakecchin',    count: 2, gap: 1.4, repeat: 22 },
      { at: 82, id: 'yakipokkuru',  count: 3, gap: 0.6, repeat: 18 },
      { at: 96, id: 'kongaragan',   count: 1, repeat: 30 },
      { at: 110, id: 'togehaya',    count: 2, gap: 2.0, repeat: 26 },
    ],
  },

  /* ---------------- 2-10（だい2しょう おおボス）---------------- */
  {
    no: 21, chapter: 2, course: 7,
    name: '獄熱オニごんの ひやま',
    desc: 'ふところに とびこめ！とおくからは なげられ ほうだい',
    bg: 'boss',
    castleHp: 4200,
    power: 1.56,
    reward: { coins: 3, exp: 670 },
    waves: [
      { at: 3,  id: 'kamomeeru',  count: 2, gap: 1.2 },
      { at: 14,  id: 'yakipokkuru', count: 3, gap: 0.6 },
      { at: 26,  id: 'blockwan',    count: 1 },
      /* ★おおボスは てきの しろが 75% まで へると でてくる
         （じかん していだと、つよい へんせいの とき でる まえに おわって しまう）*/
      { atCastleHp: 0.75, id: 'onigon', count: 1 },
      { at: 56,  id: 'yakipokkuru', count: 3, gap: 0.6, repeat: 20 },
      { at: 70,  id: 'togehaya',    count: 2, gap: 2.0, repeat: 24 },
      { at: 88,  id: 'honota',      count: 4, gap: 0.5, repeat: 22 },
      { at: 104, id: 'blockwan',    count: 1, repeat: 34 },
    ],
  },

  /* ==========================================================
     だい3しょう「けものみち」──  けもの ぞくせいが たくさん でます。
     パワーの なかま（豪傑天むす丸・かべくん）が とても ゆうり。
     まえはん（3-1〜3-5）より うしろはん（3-6〜3-10）が むずかしめ。
     ========================================================== */

  /* ---------------- 3-1 ---------------- */
  {
    no: 30, chapter: 3, course: 1,
    name: 'けものみちの いりぐち',
    desc: 'イノっちが つっこんで くる。ふきとばしに ちゅうい',
    bg: 'kemono',
    castleHp: 2400,
    power: 1.6,
    reward: { coins: 1, exp: 450 },
    waves: [
      { at: 3,  id: 'inocchi',    count: 2, gap: 1.2 },
      { at: 14, id: 'yamanemu', count: 1 },
      { at: 24, id: 'inocchi',  count: 3, gap: 1.0 },
      { at: 36, id: 'tanupon',  count: 1 },
      { at: 48, id: 'inocchi',  count: 3, gap: 1.0, repeat: 19 },
      { at: 62, id: 'yamanemu', count: 1, repeat: 28 },
    ],
  },

  /* ---------------- 3-2 ---------------- */
  {
    no: 31, chapter: 3, course: 2,
    name: 'たぬきの ひろば',
    desc: 'たぬポンに ちからを ぬかれる。かずで おしきろう',
    bg: 'mori',
    castleHp: 900,
    power: 1.3,
    reward: { coins: 1, exp: 480 },
    waves: [
      { at: 3,  id: 'yamanemu',   count: 2, gap: 1.6 },
      { at: 14, id: 'tanupon',  count: 1 },
      { at: 26, id: 'tanupon',  count: 2, gap: 2.5 },
      { at: 38, id: 'yamanemu', count: 2, gap: 2.0 },
      { at: 50, id: 'tanupon',  count: 2, gap: 2.5, repeat: 31 },
      { at: 64, id: 'inocchi',  count: 3, gap: 1.0, repeat: 28 },
      { at: 44, id: 'kumabee',  count: 1, repeat: 45 },   // もとから いる けものの てき
    ],
  },

  /* ---------------- 3-4 ---------------- */
  {
    no: 33, chapter: 3, course: 3,
    name: 'あめあがりの さわ',
    desc: 'ツユガエルの しずくが はんいに ひろがる',
    bg: 'mizu',
    castleHp: 1600,
    power: 1.27,
    reward: { coins: 1, exp: 530 },
    waves: [
      { at: 3,  id: 'tsuyugaeru', count: 1 },
      { at: 14, id: 'tsuyugaeru', count: 1 },
      { at: 28, id: 'tsuyugaeru', count: 2, gap: 2.0 },
      { at: 40, id: 'yamanemu',   count: 2, gap: 2.0 },
      { at: 54, id: 'tsuyugaeru', count: 2, gap: 2.0, repeat: 41 },
      { at: 70, id: 'tanupon',    count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 3-5（ちゅうボス）---------------- */
  {
    no: 34, chapter: 3, course: 4,
    name: 'ぬしの なわばり',
    desc: 'ちゅうボス「ヌシノオオカミ」。ピンチに なると ほんきを だす',
    bg: 'night',
    castleHp: 1400,
    power: 1.74,
    reward: { coins: 3, exp: 590 },
    waves: [
      { at: 3,  id: 'tanupon',    count: 1 },
      { at: 14, id: 'tanupon', count: 1 },
      { at: 26, id: 'moeris',  count: 1 },
      /* ★ちゅうボスは てきの しろが 70% まで へると でてくる */
      { atCastleHp: 0.70, id: 'nushinoookami', count: 1 },
      { at: 56, id: 'inocchi', count: 3, gap: 1.0, repeat: 18 },
      { at: 70, id: 'tanupon', count: 1, repeat: 25 },
      { at: 62, id: 'kumabee',  count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 3-7 ---------------- */
  {
    no: 36, chapter: 3, course: 5,
    name: 'はりの もり',
    desc: 'ハリ千本が とおくから はりを とばす。まえに でよう',
    bg: 'kemono',
    castleHp: 2100,
    power: 1.15,
    reward: { coins: 1, exp: 640 },
    waves: [
      { at: 3,  id: 'moeris',     count: 1 },
      { at: 14, id: 'harisenbon', count: 1 },
      { at: 30, id: 'tanupon',    count: 1 },
      { at: 48, id: 'harisenbon', count: 1, repeat: 30 },
      { at: 60, id: 'tsuyugaeru', count: 1, repeat: 21 },
      { at: 74, id: 'inocchi',    count: 3, gap: 1.0, repeat: 17 },
      { at: 56, id: 'kumabee',  count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 3-8 ---------------- */
  {
    no: 37, chapter: 3, course: 6,
    name: 'くまの すみか',
    desc: 'クマったは かたくて ふきとびにくい。ちからも ぬかれる',
    bg: 'rock',
    castleHp: 1200,
    power: 0.86,
    reward: { coins: 1, exp: 670 },
    waves: [
      { at: 3,  id: 'kumabee',    count: 1 },
      { at: 14, id: 'kumatta',    count: 1 },
      { at: 30, id: 'moeris',     count: 2, gap: 2.0 },
      { at: 42, id: 'kumatta',    count: 1, repeat: 26 },
      { at: 58, id: 'harisenbon', count: 1, repeat: 29 },
      { at: 74, id: 'inocchi',    count: 3, gap: 1.0, repeat: 21 },
      { at: 46, id: 'jiryu',    count: 1, repeat: 45 },   // 字一龍（けもの）
    ],
  },

  /* ---------------- 3-10（おおボス）---------------- */
  {
    no: 39, chapter: 3, course: 7,
    name: 'もりぐいの おくにわ',
    desc: 'おおボス「森喰らい・ガオウ」。ふきとばせない。ほのおと パワーで',
    bg: 'boss',
    castleHp: 1100,
    power: 0.95,
    reward: { coins: 3, exp: 870 },
    waves: [
      { at: 3,  id: 'inocchi',    count: 3, gap: 1.0 },
      { at: 14,  id: 'tanupon',    count: 1 },
      { at: 26,  id: 'kokejika',   count: 1 },
      { at: 38,  id: 'harisenbon', count: 1 },
      { at: 52,  id: 'kumatta',    count: 1, repeat: 35 },
      { at: 68,  id: 'moeris',     count: 2, gap: 2.0, repeat: 24 },
      { at: 84,  id: 'inocchi',    count: 3, gap: 1.0, repeat: 19 },
      /* おおボスは てきの しろが 75% まで へると でてくる */
      { atCastleHp: 0.75, id: 'gaou', count: 1 },
      { at: 46, id: 'jiryu',    count: 1, repeat: 45 },
    ],
  },

  /* ==========================================================
     だい4しょう「廃れたメカニック工場」
     ほとんどが メタル ぞくせい。
     メタルの よわてんは ほのお・まじゅつし・パワーの 3つ。
     ひー坊・時の旅人・豪傑天むす丸 が だいかつやく します。
     ========================================================== */

  /* ---------------- 4-1 さびた はんにゅうぐち ---------------- */
  {
    no: 40, chapter: 4, course: 1,
    name: 'さびた はんにゅうぐち',
    desc: 'うごきだした ちいさな ネジたち',
    bg: 'haikoujou',
    castleHp: 9500,
    power: 1.58,
    reward: { coins: 1, exp: 780 },
    waves: [
      { at: 3,  id: 'nejiro',     count: 3, gap: 0.8 },
      { at: 16, id: 'nejiro', count: 4, gap: 0.7 },
      { at: 30, id: 'nejiro', count: 5, gap: 0.6, repeat: 18 },
      { at: 46, id: 'hakobot', count: 1, repeat: 33 },
    ],
  },

  /* ---------------- 4-2 ほうちされた さぎょうエリア ---------------- */
  {
    no: 41, chapter: 4, course: 2,
    name: 'ほうちされた さぎょうエリア',
    desc: 'うんぱんロボが いくてを ふさぐ',
    bg: 'steel',
    castleHp: 2100,
    power: 1.63,
    reward: { coins: 1, exp: 810 },
    waves: [
      { at: 3,  id: 'hakobot',    count: 1 },
      { at: 14, id: 'hakobot', count: 2, gap: 2.5 },
      { at: 28, id: 'nejiro',  count: 4, gap: 0.7 },
      { at: 40, id: 'hakobot', count: 2, gap: 2.5, repeat: 25 },
      { at: 54, id: 'nejiro',  count: 5, gap: 0.6, repeat: 19 },
      { at: 46, id: 'ironkokko',  count: 1, repeat: 38 },  // もとから いる メタルの てき
    ],
  },

  /* ---------------- 4-4 エネルギー きょうきゅうく ---------------- */
  {
    no: 43, chapter: 4, course: 3,
    name: 'エネルギー きょうきゅうく',
    desc: 'ほのおと みずの じっけんきが きどう',
    bg: 'steel',
    castleHp: 1500,
    power: 1.14,
    reward: { coins: 1, exp: 870 },
    waves: [
      { at: 3,  id: 'sabinchi',   count: 2, gap: 1.4 },
      { at: 14, id: 'burner',   count: 1 },
      { at: 26, id: 'potank',   count: 1 },
      { at: 38, id: 'sabinchi', count: 2, gap: 1.6 },
      { at: 58, id: 'burner',   count: 1, repeat: 38 },
      { at: 76, id: 'potank',   count: 1, repeat: 41 },
      { at: 82, id: 'nejiro',   count: 4, gap: 0.7, repeat: 17 },
      { at: 50, id: 'ironkokko',  count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 4-5 せいぎょしつ まえ（ちゅうボス）---------------- */
  {
    no: 44, chapter: 4, course: 4,
    name: 'せいぎょしつの まえ',
    desc: 'ちゅうボス「ガラク帝」。ふきとばせない はがねの おう',
    bg: 'haikoujou',
    castleHp: 2600,
    power: 1.72,
    reward: { coins: 3, exp: 950 },
    waves: [
      { at: 3,  id: 'ironkokko',  count: 1 },
      { at: 14, id: 'hakobot',   count: 1 },
      { at: 26, id: 'sabinchi',  count: 2, gap: 1.6 },
      /* ★ちゅうボスは てきの しろが 70% まで へると でてくる */
      { atCastleHp: 0.70, id: 'garakutei', count: 1 },
      { at: 60, id: 'nejiro',    count: 4, gap: 0.7, repeat: 29 },
      { at: 74, id: 'hakobot',   count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 4-6 はいせん つうろ ---------------- */
  {
    no: 45, chapter: 4, course: 5,
    name: 'はいせん つうろ',
    desc: 'からまる コードの わな。うごきが おそくなる',
    bg: 'night',
    castleHp: 2700,
    power: 1.77,
    reward: { coins: 1, exp: 980 },
    waves: [
      { at: 3,  id: 'mojacord',   count: 1 },
      { at: 14, id: 'mojacord', count: 1 },
      { at: 28, id: 'mojacord', count: 1 },
      { at: 40, id: 'sabinchi', count: 2, gap: 1.6 },
      { at: 52, id: 'mojacord', count: 1, repeat: 25 },
      { at: 68, id: 'nejiro',   count: 5, gap: 0.6, repeat: 20 },
      { at: 44, id: 'kongaragan', count: 1, repeat: 30 },
    ],
  },

  /* ---------------- 4-8 プレスこうじょう ---------------- */
  {
    no: 47, chapter: 4, course: 6,
    name: 'プレスこうじょう',
    desc: 'あっとうてきな はかいりょく。プレスケが おしつぶす',
    bg: 'haikoujou',
    castleHp: 2200,
    power: 1.81,
    reward: { coins: 1, exp: 1090 },
    waves: [
      { at: 3,  id: 'nejiro',     count: 5, gap: 0.6 },
      { at: 14, id: 'pressuke', count: 1 },
      { at: 30, id: 'hakobot',  count: 2, gap: 2.5 },
      { at: 42, id: 'sabinchi', count: 2, gap: 1.6 },
      { at: 54, id: 'mojacord', count: 1 },
      { at: 66, id: 'pressuke', count: 1, repeat: 45 },
      { at: 84, id: 'nejiro',   count: 4, gap: 0.7, repeat: 28 },
      { at: 52, id: 'kongaragan', count: 1, repeat: 45 },
    ],
  },

  /* ---------------- 4-10 ようこうろ さいしんぶ（さいしゅうボス）---------------- */
  {
    no: 49, chapter: 4, course: 7,
    name: 'ようこうろの さいしんぶ',
    desc: 'すべての げんきょう「廃炉獣メルトギア」。ほのお・まじゅつし・パワーで',
    bg: 'boss',
    castleHp: 1800,
    power: 0.92,
    reward: { coins: 3, exp: 1400 },
    waves: [
      { at: 3,  id: 'kongaragan', count: 1 },
      { at: 14,  id: 'sabinchi', count: 2, gap: 1.6 },
      { at: 28,  id: 'burner',   count: 1 },
      { at: 42,  id: 'forkun',   count: 1 },
      { at: 58,  id: 'pressuke', count: 1, repeat: 32 },
      { at: 76,  id: 'potank',   count: 1, repeat: 28 },
      { at: 92,  id: 'nejiro',   count: 4, gap: 0.7, repeat: 17 },
      /* さいしゅうボスは てきの しろが 75% まで へると でてくる */
      { atCastleHp: 0.75, id: 'meltgear', count: 1 },
      { at: 68, id: 'kongaragan', count: 1, repeat: 45 },
    ],
  },

  /* ==========================================================
     だい5しょう「賑わう近海」
     ほとんどが みず ぞくせい。くさ（フタバッポ・たたみん）が とても ゆうり。
     たたみんは みずの こうげきを 20%に おさえるので、この しょうの かべやく。
     もとから いる みずの てき（saba・バケッチン）も でて きます。
     ========================================================== */

  /* ---------------- 5-1 しずかな いりえ ---------------- */
  {
    no: 50, chapter: 5, course: 1,
    name: 'しずかな いりえ',
    desc: 'おだやかな うみに あらわれる ちいさな てきたち',
    bg: 'kinkai',
    castleHp: 4400,
    power: 1.5,
    reward: { coins: 1, exp: 900 },
    waves: [
      { at: 3,  id: 'pukakurage', count: 3, gap: 0.9 },
      { at: 16, id: 'pukakurage', count: 4, gap: 0.8 },
      { at: 28, id: 'saba',       count: 2, gap: 1.2 },
      { at: 40, id: 'pukakurage', count: 5, gap: 0.7, repeat: 16 },
      { at: 54, id: 'saba',       count: 2, gap: 1.2, repeat: 22 },
    ],
  },

  /* ---------------- 5-2 ぎょじょうの しゅうへん ---------------- */
  {
    no: 51, chapter: 5, course: 2,
    name: 'ぎょじょうの しゅうへん',
    desc: 'チビサメの むれが すばやく つっこんで くる',
    bg: 'mizu',
    castleHp: 4600,
    power: 1.54,
    reward: { coins: 1, exp: 950 },
    waves: [
      { at: 3,  id: 'chibisame',  count: 2, gap: 1.2 },
      { at: 14, id: 'chibisame',  count: 2, gap: 1.2 },
      { at: 28, id: 'chibisame',  count: 3, gap: 1.0 },
      { at: 40, id: 'bakecchin',  count: 2, gap: 1.5 },
      { at: 52, id: 'chibisame',  count: 3, gap: 1.0, repeat: 18 },
      { at: 66, id: 'pukakurage', count: 4, gap: 0.8, repeat: 16 },
    ],
  },

  /* ---------------- 5-3 しずみかけた ふね ---------------- */
  {
    no: 52, chapter: 5, course: 3,
    name: 'しずみかけた ふね',
    desc: 'ざんがいから あらわれる トゲフグと イカマジン',
    bg: 'kinkai',
    castleHp: 4200,
    power: 1.59,
    reward: { coins: 1, exp: 1000 },
    waves: [
      { at: 3,  id: 'saba',       count: 3, gap: 1.0 },
      { at: 14, id: 'ikamajin',   count: 1 },
      { at: 26, id: 'togefugu',   count: 1 },
      { at: 38, id: 'chibisame',  count: 3, gap: 1.0 },
      { at: 54, id: 'ikamajin',   count: 1, repeat: 30 },
      { at: 70, id: 'togefugu',   count: 1, repeat: 34 },
      { at: 78, id: 'saba',       count: 2, gap: 1.2, repeat: 20 },
    ],
  },

  /* ---------------- 5-4 ちょうりゅうの こうさてん（ちゅうボス）---------------- */
  {
    no: 53, chapter: 5, course: 4,
    name: 'ちょうりゅうの こうさてん',
    desc: 'ちゅうボス「深海の主 ネレイド」。かいりゅうが ぶつかる きけんな かいいき',
    bg: 'water',
    castleHp: 3000,
    power: 1.63,
    reward: { coins: 3, exp: 1100 },
    waves: [
      { at: 3,  id: 'togefugu',   count: 1 },
      { at: 14, id: 'chibisame',  count: 2, gap: 1.2 },
      { at: 26, id: 'ikamajin',   count: 1 },
      /* ★ちゅうボスは てきの しろが 70% まで へると でてくる */
      { atCastleHp: 0.70, id: 'nereid', count: 1 },
      { at: 60, id: 'pukakurage', count: 4, gap: 0.8, repeat: 18 },
      { at: 74, id: 'chibisame',  count: 2, gap: 1.2, repeat: 22 },
    ],
  },

  /* ---------------- 5-5 しげんの さいくつじょう ---------------- */
  {
    no: 54, chapter: 5, course: 5,
    name: 'しげんの さいくつじょう',
    desc: 'じゅうそうの てき。オクトキャノンと カニタンクが まちうける',
    bg: 'kinkai',
    castleHp: 2800,
    power: 1.67,
    reward: { coins: 1, exp: 1150 },
    waves: [
      { at: 3,  id: 'ikamajin',   count: 1 },
      { at: 14, id: 'octocannon', count: 1 },
      { at: 30, id: 'kanitank',   count: 1 },
      { at: 46, id: 'togefugu',   count: 1 },
      { at: 62, id: 'octocannon', count: 1, repeat: 35 },
      { at: 84, id: 'kanitank',   count: 1, repeat: 45 },
      { at: 92, id: 'chibisame',  count: 3, gap: 1.0, repeat: 18 },
    ],
  },

  /* ---------------- 5-6 うみの だいかいろう ---------------- */
  {
    no: 55, chapter: 5, course: 6,
    name: 'うみの だいかいろう',
    desc: 'おおきな かいりゅうと きょだいな いきもの。あらしの まえぶれ',
    bg: 'water',
    castleHp: 2900,
    power: 1.72,
    reward: { coins: 1, exp: 1250 },
    waves: [
      { at: 3,  id: 'bakecchin',  count: 3, gap: 1.2 },
      { at: 14,  id: 'umihebi',    count: 2, gap: 1.5 },
      { at: 30,  id: 'daiouei',    count: 1 },
      { at: 46,  id: 'octocannon', count: 1 },
      /* ★りゅうは てきの しろが 65% まで へると でてくる */
      { atCastleHp: 0.65, id: 'leviza', count: 1 },
      { at: 86,  id: 'umihebi',    count: 2, gap: 1.5, repeat: 30 },
      { at: 104, id: 'daiouei',    count: 1, repeat: 44 },
      { at: 110, id: 'tsuyugaeru', count: 2, gap: 1.4, repeat: 26 },
    ],
  },

  /* ---------------- 5-7 しんかいの さいおく（おおボス）---------------- */
  {
    no: 56, chapter: 5, course: 7,
    name: 'しんかいの さいおく',
    desc: 'おおボス「波獣ザバーン」。字一龍を したがえた なみが すべてを のみこむ',
    bg: 'boss',
    castleHp: 3600,
    power: 1.76,
    reward: { coins: 3, exp: 1800 },
    waves: [
      { at: 3,  id: 'umihebi',    count: 2, gap: 1.5 },
      { at: 14,  id: 'chibisame',  count: 3, gap: 1.0 },
      { at: 28,  id: 'togefugu',   count: 1 },
      { at: 42,  id: 'octocannon', count: 1 },
      { at: 58,  id: 'umihebi',    count: 2, gap: 1.5, repeat: 26 },
      { at: 76,  id: 'daiouei',    count: 1, repeat: 36 },
      { at: 92,  id: 'chibisame',  count: 3, gap: 1.0, repeat: 20 },
      /* ★おおボスは てきの しろが 75% まで へると でてくる。
         字一龍 1たいと むれで こうどうする                        */
      { atCastleHp: 0.75, id: 'zabaan', count: 1 },
      { atCastleHp: 0.75, id: 'jiryu',  count: 1 },
    ],
  },

  /* ==========================================================
     だい6しょう「魔導士の里」
     ほとんどが まじゅつし ぞくせい。
     けもの（シャドウヤマネコ）が とても ゆうり。
     ぎゃくに パワーと メタルの なかまは まじゅつしに よわい ので ちゅうい。
     もとから いる まじゅつしの てき（モコ魔道士・イカマジン）も でて きます。
     ========================================================== */

  /* ---------------- 6-1 いりぐちの いしだたみ ---------------- */
  {
    no: 60, chapter: 6, course: 1,
    name: 'いりぐちの いしだたみ',
    desc: 'みならいたちが むかえる しずかな もんぜん',
    bg: 'mahou',
    castleHp: 3800,
    power: 1.86,
    reward: { coins: 1, exp: 1300 },
    waves: [
      { at: 3,  id: 'runrunwisp', count: 3, gap: 0.9 },
      { at: 16, id: 'houkigob',   count: 2, gap: 1.2 },
      { at: 28, id: 'runrunwisp', count: 4, gap: 0.8 },
      { at: 42, id: 'houkigob',   count: 3, gap: 1.0, repeat: 25 },
      { at: 56, id: 'runrunwisp', count: 4, gap: 0.8, repeat: 23 },
    ],
  },

  /* ---------------- 6-2 まほうの いちば ---------------- */
  {
    no: 61, chapter: 6, course: 2,
    name: 'まほうの いちば',
    desc: 'にぎわう ろてんと こうきしんの つまる ばしょ',
    bg: 'night',
    castleHp: 4000,
    power: 1.91,
    reward: { coins: 1, exp: 1350 },
    waves: [
      { at: 3,  id: 'houkigob',     count: 2, gap: 1.2 },
      { at: 14, id: 'magicrabbit',  count: 1 },
      { at: 26, id: 'runrunwisp',   count: 4, gap: 0.8 },
      { at: 38, id: 'mokomadoushi', count: 1 },
      { at: 52, id: 'magicrabbit',  count: 1, repeat: 28 },
      { at: 68, id: 'houkigob',     count: 3, gap: 1.0, repeat: 25 },
      { at: 84, id: 'mokomadoushi', count: 1, repeat: 40 },
    ],
  },

  /* ---------------- 6-3 ほのおの しれんじょう ---------------- */
  {
    no: 62, chapter: 6, course: 3,
    name: 'ほのおの しれんじょう',
    desc: 'ひの まほうを つかう みならいたちの くんれんエリア',
    bg: 'sunset',
    castleHp: 2000,
    power: 0.99,
    reward: { coins: 1, exp: 1400 },
    waves: [
      { at: 3,  id: 'runrunwisp', count: 3, gap: 0.9 },
      { at: 14, id: 'flamemage',  count: 1 },
      { at: 28, id: 'icewitch',   count: 1 },
      { at: 42, id: 'houkigob',   count: 3, gap: 1.0 },
      { at: 56, id: 'flamemage',  count: 1, repeat: 42 },
      { at: 72, id: 'icewitch',   count: 1, repeat: 45 },
      { at: 88, id: 'runrunwisp', count: 4, gap: 0.8, repeat: 30 },
    ],
  },

  /* ---------------- 6-4 ルーンの かいろう ---------------- */
  {
    no: 63, chapter: 6, course: 4,
    name: 'ルーンの かいろう',
    desc: 'こだいの まほうもじが きざまれた いせき',
    bg: 'mahou',
    castleHp: 1700,
    power: 0.73,
    reward: { coins: 1, exp: 1450 },
    waves: [
      { at: 3,  id: 'mandrake',   count: 1 },
      { at: 16, id: 'runegolem',  count: 1 },
      { at: 32, id: 'houkigob',   count: 3, gap: 1.0 },
      { at: 46, id: 'mandrake',   count: 1, repeat: 32 },
      { at: 62, id: 'runegolem',  count: 1, repeat: 45 },
      { at: 80, id: 'runrunwisp', count: 4, gap: 0.8, repeat: 23 },
    ],
  },

  /* ---------------- 6-5 けんじゃの ま（ちゅうボス）---------------- */
  {
    no: 64, chapter: 6, course: 5,
    name: 'けんじゃの ま',
    desc: 'ちゅうボス「賢者カロン」。いだいな けんじゃとの たいじ',
    bg: 'night',
    castleHp: 2300,
    power: 0.97,
    reward: { coins: 3, exp: 1550 },
    waves: [
      { at: 3,  id: 'magicrabbit', count: 1 },
      { at: 16, id: 'houkigob',    count: 3, gap: 1.0 },
      { at: 30, id: 'icewitch',    count: 1 },
      { at: 46, id: 'flamemage',   count: 1, repeat: 45 },
      { at: 62, id: 'runrunwisp',  count: 4, gap: 0.8, repeat: 32 },
      { at: 78, id: 'houkigob',    count: 3, gap: 1.0, repeat: 38 },
      /* ★ちゅうボスは てきの しろが 70% まで へると でてくる */
      { atCastleHp: 0.70, id: 'sagecharon', count: 1 },
    ],
  },

  /* ---------------- 6-6 きんだんの としょかん ---------------- */
  {
    no: 65, chapter: 6, course: 6,
    name: 'きんだんの としょかん',
    desc: 'きけんな しょもつが ねむる しょこ。こうげきを ふうじられる',
    bg: 'mahou',
    castleHp: 2000,
    power: 0.95,
    reward: { coins: 1, exp: 1650 },
    waves: [
      { at: 3,  id: 'runrunwisp',  count: 3, gap: 0.9 },
      { at: 16, id: 'chaosspell',  count: 1 },
      { at: 32, id: 'ikamajin',    count: 1 },
      { at: 46, id: 'runegolem',   count: 1 },
      { at: 62, id: 'chaosspell',  count: 1, repeat: 45 },
      { at: 80, id: 'ikamajin',    count: 1, repeat: 42 },
      { at: 96, id: 'magicrabbit', count: 1, repeat: 40 },
    ],
  },

  /* ---------------- 6-7 しゅうえんの とう（おおボス）---------------- */
  {
    no: 66, chapter: 6, course: 7,
    name: 'しゅうえんの とう',
    desc: 'おおボス「終焉の大魔導士ゼノス」。すべての まほうが あつまる さいごの たたかい',
    bg: 'boss',
    castleHp: 2700,
    power: 1.3,
    reward: { coins: 3, exp: 2200 },
    waves: [
      { at: 3,   id: 'houkigob',    count: 3, gap: 1.0 },
      { at: 16,  id: 'magicrabbit', count: 1 },
      { at: 30,  id: 'flamemage',   count: 1 },
      { at: 44,  id: 'icewitch',    count: 1 },
      { at: 58,  id: 'runegolem',   count: 1, repeat: 45 },
      { at: 76,  id: 'chaosspell',  count: 1, repeat: 40 },
      { at: 94,  id: 'mandrake',    count: 1, repeat: 34 },
      { at: 110, id: 'runrunwisp',  count: 4, gap: 0.8, repeat: 23 },
      /* ★おおボスは てきの しろが 75% まで へると でてくる */
      { atCastleHp: 0.75, id: 'zenos', count: 1 },
    ],
  },

  /* ==========================================================
     だい7しょう「闇の頂」── ボスラッシュ

     これまでの ボスが「覚醒」して つぎつぎ おそって くる さいごの みち。
     1コースに 2〜3たいの ボスが でて くる。
     ボスは てきの しろの たいりょくが へると じゅんばんに でて くるので、
     いっきに かたを つけようと せず、1たいずつ ならべて たおすのが コツ。
     ========================================================== */

  /* ---------------- 7-1 めざめの もん ---------------- */
  {
    no: 67, chapter: 7, course: 1,
    name: 'めざめの もん',
    desc: 'はじまりの のはらの ぬしたちが 闇の ちからで よみがえる',
    bg: 'yami',
    castleHp: 6000,
    power: 1.57,
    reward: { coins: 3, exp: 2400 },
    waves: [
      { at: 3,  id: 'togehaya', count: 3, gap: 0.9 },
      { at: 18, id: 'tanupon',  count: 2, gap: 1.1 },
      { at: 36, id: 'togehaya', count: 3, gap: 0.9, repeat: 30 },
      { at: 54, id: 'tanupon',  count: 2, gap: 1.1, repeat: 32 },
      /* ★ボス 2たい */
      { atCastleHp: 0.85, id: 'hetakirin_x', count: 1 },
      { atCastleHp: 0.45, id: 'okashiman_x', count: 1 },
    ],
  },

  /* ---------------- 7-2 けものの おうざ ---------------- */
  {
    no: 68, chapter: 7, course: 2,
    name: 'けものの おうざ',
    desc: 'けものみちの ぬしと 森喰らいが そろって たちふさがる',
    bg: 'yami',
    castleHp: 5300,
    power: 1.17,
    reward: { coins: 3, exp: 2500 },
    waves: [
      { at: 3,  id: 'tanupon',  count: 2, gap: 1.0 },
      { at: 20, id: 'kokejika', count: 1 },
      { at: 38, id: 'tanupon',  count: 2, gap: 1.0, repeat: 30 },
      { at: 56, id: 'kumatta',  count: 1, repeat: 40 },
      /* ★ボス 2たい */
      { atCastleHp: 0.85, id: 'nushinoookami_x', count: 1 },
      { atCastleHp: 0.45, id: 'gaou_x',          count: 1 },
    ],
  },

  /* ---------------- 7-3 くろがねの はいきょ ---------------- */
  {
    no: 69, chapter: 7, course: 3,
    name: 'くろがねの はいきょ',
    desc: 'こうじょうの きかいたちが 闇に つながれて うごきだす',
    bg: 'yami',
    castleHp: 6200,
    power: 1.66,
    reward: { coins: 3, exp: 2600 },
    waves: [
      { at: 3,  id: 'ironkokko', count: 2, gap: 1.0 },
      { at: 20, id: 'pressuke',  count: 1 },
      { at: 38, id: 'ironkokko', count: 2, gap: 1.0, repeat: 30 },
      { at: 56, id: 'pressuke',  count: 1, repeat: 38 },
      /* ★ボス 2たい（どちらも メタル。ほのおの なかまが ゆうり）*/
      { atCastleHp: 0.85, id: 'garakutei_x', count: 1 },
      { atCastleHp: 0.45, id: 'meltgear_x',  count: 1 },
    ],
  },

  /* ---------------- 7-4 しずんだ おうこく ---------------- */
  {
    no: 70, chapter: 7, course: 4,
    name: 'しずんだ おうこく',
    desc: 'うみの ぬしと あばれ りゅうが そろって おそって くる',
    bg: 'yami',
    castleHp: 6400,
    power: 1.71,
    reward: { coins: 3, exp: 2700 },
    waves: [
      { at: 3,  id: 'umihebi',    count: 2, gap: 1.0 },
      { at: 20, id: 'octocannon', count: 1 },
      { at: 38, id: 'umihebi',    count: 2, gap: 1.0, repeat: 28 },
      { at: 56, id: 'daiouei',    count: 1, repeat: 34 },
      /* ★ボス 2たい */
      { atCastleHp: 0.85, id: 'nereid_x', count: 1 },
      { atCastleHp: 0.45, id: 'leviza_x', count: 1 },
    ],
  },

  /* ---------------- 7-5 まじゅつの きょくち ---------------- */
  {
    no: 71, chapter: 7, course: 5,
    name: 'まじゅつの きょくち',
    desc: 'ボス 3たい。ほのおの おにと けんじゃ、そして きりんが まちうける',
    bg: 'yami',
    castleHp: 6600,
    power: 1.76,
    reward: { coins: 3, exp: 2900 },
    waves: [
      { at: 3,  id: 'houkigob',   count: 3, gap: 0.9 },
      { at: 20, id: 'chaosspell', count: 1 },
      { at: 38, id: 'houkigob',   count: 3, gap: 0.9, repeat: 28 },
      { at: 56, id: 'runegolem',  count: 1, repeat: 36 },
      /* ★ボス 3たい */
      { atCastleHp: 0.88, id: 'onigon_x',     count: 1 },
      { atCastleHp: 0.58, id: 'sagecharon_x', count: 1 },
      { atCastleHp: 0.28, id: 'hetakirin_x',  count: 1 },
    ],
  },

  /* ---------------- 7-6 ぜつぼうの かいろう ---------------- */
  {
    no: 72, chapter: 7, course: 6,
    name: 'ぜつぼうの かいろう',
    desc: 'ボス 3たい。かたい なみの けものと 大魔導士が まちかまえる',
    bg: 'yami',
    castleHp: 5400,
    power: 1.8,
    reward: { coins: 3, exp: 3200 },
    waves: [
      { at: 3,  id: 'kongaragan', count: 2, gap: 1.1 },
      { at: 22, id: 'runegolem',  count: 1 },
      { at: 40, id: 'kongaragan', count: 2, gap: 1.1, repeat: 30 },
      { at: 58, id: 'chaosspell', count: 1, repeat: 34 },
      /* ★ボス 3たい */
      { atCastleHp: 0.88, id: 'okashiman_x', count: 1 },
      { atCastleHp: 0.58, id: 'zabaan_x',    count: 1 },
      { atCastleHp: 0.26, id: 'zenos_x',     count: 1 },
    ],
  },

  /* ---------------- 7-7 闇の いただき（さいしゅうけっせん）---------------- */
  {
    no: 73, chapter: 7, course: 7,
    name: '闇の いただき',
    desc: 'さいごの てき「闇堕ちあき坊」。むぞくせいと パワーの こうげきは とおらない',
    bg: 'boss',
    castleHp: 8500,
    power: 1.26,
    reward: { coins: 3, exp: 5000 },
    waves: [
      { at: 3,  id: 'kongaragan', count: 2, gap: 1.0 },
      { at: 18, id: 'chaosspell', count: 1 },
      { at: 32, id: 'kongaragan', count: 2, gap: 1.0, repeat: 22 },
      { at: 46, id: 'runegolem',  count: 1, repeat: 26 },
      { at: 60, id: 'chaosspell', count: 1, repeat: 24 },
      /* ★とりまきの ボス 2たい → そして さいごの あき坊 */
      { atCastleHp: 0.90, id: 'sagecharon_x', count: 1 },
      { atCastleHp: 0.62, id: 'zenos_x',      count: 1 },
      { atCastleHp: 0.34, id: 'yamiakibou',   count: 1 },
    ],
  },

];


/* コースは「しょう → コースばんごう」の じゅんに じどうで ならべかえます。
   なので data.js の なかで どこに かいても だいじょうぶです。          */
STAGES.sort((a, b) => ((a.chapter || 1) - (b.chapter || 1)) || ((a.course || a.no) - (b.course || b.no)));


/* --------------------------------------------------------------------------
   ずかんの ★（つよさの めやす）

   すうじを ★5つの めやすに なおす ときの さかいめです。
   [a, b, c, d] と かくと──
       a より したなら ★1
       b より したなら ★2
       c より したなら ★3
       d より したなら ★4
       それいじょうは  ★5

   「ちいさい ほうが よい」もの（こうげきかんかく・コスト）は
   さかいめを おおきい じゅんに かきます。
   -------------------------------------------------------------------------- */
const STAR_SCALE = {
  hp:    [600, 1500, 3000, 6000],      // たいりょく
  atk:   [100, 250,  500,  800],       // こうげきりょく（1はつ）
  dps:   [40,  90,   160,  240],       // 1びょうあたりの ダメージ
  range: [90,  140,  200,  320],       // しゃてい
  speed: [20,  35,   55,   90],        // うごく はやさ
  cycle: [3.6, 2.8,  2.0,  1.4],       // こうげきの はやさ（ちいさい ほうが よい）
  cheap: [1000, 600, 300,  150],       // だしやすさ（コストが やすい ほうが よい）
};

/* すうじ → ★の かず（1〜5）*/
function starRate(kind, value) {
  const sc = STAR_SCALE[kind];
  if (!sc) return 1;
  const lowerIsBetter = (sc[0] > sc[3]);
  for (let i = 0; i < sc.length; i++) {
    if (lowerIsBetter ? (value >= sc[i]) : (value < sc[i])) return i + 1;
  }
  return 5;
}


/* --------------------------------------------------------------------------
   しょう（ステージ）の なまえと、せかいちずの どこに おくか

   x / y は ちずの ひだりうえを 0、みぎしたを 1 とした わりあいです。
   なまえと ばしょを かえたい ときは ここだけ いじれば OK。
   -------------------------------------------------------------------------- */
/* しょうの ばしょ（ちずの よこ・たての わりあい 0〜1）

   ★みぎうえは「あき坊の塔」ボタンが ある ので、そこには おかない こと。
   ★じぐざぐに ならべて、コースの ないようと じめんが あう ように して います。
       うえの れつ … はがね（まち）・こうじょう・まどうしの さと
       したの れつ … のはら・けものみち（もり）・きんかい（うみ）・闇の頂  */
/* ボスラッシュ（だい7しょう）を ぜんぶ クリアした ときの ごほうび */
const BOSSRUSH = {
  chapter: 7,
  clearBonus: 20,      // ★7-1〜7-7 ぜんぶ クリアで Gコイン 20まい（1どだけ）
};

/* --------------------------------------------------------------------------
   てきの レア度と、その おびの つよさ

   ★かんがえかた★
     てきの たいりょく・こうげき・おかねは「Lv.1 の すがた」で ほぞんして あり、
     ステージの power と レア度の おびを かけた ぶんだけ つよく なります。

        じっさいの つよさ ＝ ほぞんずみの すうち（おびこみ）× ステージの power

     こうすると、1しょうの てきでも 7しょうに だせば ちゃんと つよく なり、
     どの てきも どの ステージでも つかえます。

   ★おびの ばい（ほぞんずみの すうちに すでに はいって います）★
     N（こザコ）1.0 ／ R（ちゅうザコ）1.8 ／ GR（おおがたザコ）3.2
     SR（ボス）5.5 ／ LR（ラスボスきゅう）9.0

   ★ばいりつが かかるのは たいりょく・こうげき・おかね だけ★
     しゃてい・はやさ・こうげきかんかく・ふきとび かいすう・
     とくしゅのうりょくの かくりつや びょうすうは かわりません。
   -------------------------------------------------------------------------- */
const ENEMY_BAND = {
  N:  1.0,
  R:  1.8,
  GR: 3.2,
  SR: 5.5,
  LR: 9.0,
};

/* コースの てきの ばいりつを もとめる。
   ふつうは stage.power だけ。とくべつな コースは powerBy で
   レア度ごとに うわがき できる（れい：powerBy: { SR: 7.5 }）。   */
function enemyPowerOf(stage, rarity) {
  const r = rarity || 'N';
  /* とくべつな コースは レア度ごとに うわがき できる */
  if (stage && stage.powerBy && typeof stage.powerBy[r] === 'number') return stage.powerBy[r];
  return (stage && typeof stage.power === 'number') ? stage.power : 1;
}


const CHAPTERS = {
  1: { name: 'はじまりの のはら',     short: 'のはら',   x: 0.07, y: 0.58, icon: '🌱' },
  2: { name: 'はがねの まち',         short: 'はがね',   x: 0.20, y: 0.34, icon: '⚙️' },
  3: { name: 'けものみち',            short: 'けもの',   x: 0.33, y: 0.76, icon: '🐾' },
  4: { name: '廃れたメカニック工場',   short: 'こうじょう', x: 0.46, y: 0.40, icon: '🏭' },
  5: { name: '賑わう近海',            short: 'きんかい', x: 0.60, y: 0.82, icon: '🌊' },
  6: { name: '魔導士の里',            short: 'まどうし', x: 0.74, y: 0.44, icon: '🔮' },
  7: { name: '闇の頂',                short: 'やみ',     x: 0.89, y: 0.72, icon: '🌑' },
};


/* --------------------------------------------------------------------------
   とくべつステージ「あき坊の塔」

   10かい ぜんぶ のぼると とくべつな なかまが もらえます。
   かいを ついかする ときは courses に コースを 1つずつ いれて ください。
   かきかたは ふつうの コースと おなじです（no は 100ばんだいを つかいます）。

   れい：
     { no: 101, floor: 1, name: '1かい', desc: '...', bg: 'steel',
       castleHp: 2000, reward: { coins: 2, exp: 200 }, waves: [ ... ] },
   -------------------------------------------------------------------------- */
const TOWER = {
  name: 'あき坊の塔',
  desc: '10かい ぜんぶ のぼると とくべつな なかまが もらえる！',
  floors: 10,                 // ぜんぶで なんかい あるか
  rewardChar: 'steve',        // ぜんぶ クリアで もらえる とくべつキャラ
  rewardName: 'スティーブ',
  courses: [

    /* ============ 1かい：むぞくせい だけ ============
       ぞくせいの あいしょうは かんけいなし。まずは かべ＋アタッカーの
       きほんの かたちを おぼえる かい。みかた 5たいが Lv.3 なら のぼれます */
    {
      no: 101, floor: 1, chapter: 0, course: 1,
      name: 'にゅうもんの ま',
      desc: 'むぞくせいの てき だけ。きほんの たたかいかた',
      bg: 'rock',
      castleHp: 2000,
      power: 1,
      reward: { coins: 2, exp: 180 },
      waves: [
        { at: 3,  id: 'nyororiinu', count: 2, gap: 0.8 },
        { at: 14, id: 'togehaya',   count: 1 },
        { at: 26, id: 'nyororiinu', count: 3, gap: 0.7 },
        { at: 38, id: 'blockwan',   count: 1 },
        { at: 52, id: 'togehaya',   count: 1, repeat: 24 },
        { at: 64, id: 'nyororiinu', count: 3, gap: 0.7, repeat: 18 },
      ],
    },

    /* ============ 2かい：む ＋ ほのお ============
       ほのおの むれが かべを もやして きます。
       ★みず（テルテル君）が いると らくに なります */
    {
      no: 102, floor: 2, chapter: 0, course: 2,
      name: 'ひばしらの ま',
      desc: 'ほのおの てきが たくさん。みずが ゆうりです',
      bg: 'sunset',
      castleHp: 1800,
      power: 1.4,
      reward: { coins: 2, exp: 210 },
      waves: [
        { at: 3,  id: 'togehaya',    count: 1 },
        { at: 10, id: 'honota',      count: 5, gap: 0.4 },
        { at: 20, id: 'yakipokkuru', count: 4, gap: 0.5 },
        { at: 32, id: 'honota',      count: 5, gap: 0.4, repeat: 16 },
        { at: 44, id: 'yakipokkuru', count: 4, gap: 0.5, repeat: 17 },
        { at: 60, id: 'blockwan',    count: 1, repeat: 34 },
      ],
    },

    /* ============ 3かい：む ＋ みず ============
       サバが とても はやく つっこんで きます。
       ★くさ（フタバッポ）が いると、みずの こうげきを すいとって
         ぎゃくに かいふく します。ここで その つよさが よく わかります */
    {
      no: 103, floor: 3, chapter: 0, course: 3,
      name: 'しぶきの ま',
      desc: 'みずの てき。くさが ゆうりです',
      bg: 'mizu',
      castleHp: 2600,
      power: 1.8,
      reward: { coins: 2, exp: 240 },
      waves: [
        { at: 3,  id: 'togehaya',  count: 1 },
        { at: 10, id: 'saba',      count: 3, gap: 0.8 },
        { at: 20, id: 'bakecchin', count: 3, gap: 1.2 },
        { at: 32, id: 'saba',      count: 4, gap: 0.7, repeat: 11 },
        { at: 44, id: 'bakecchin', count: 3, gap: 1.2, repeat: 14 },
        { at: 58, id: 'blockwan',  count: 1, repeat: 30 },
      ],
    },

    /* ============ 4かい：む ＋ くさ ============
       モーモー・プラントが まえの なかまを どんどん かいふく して きます。
       ★ほのお（ひー坊）で かいふくやくを さきに たおすのが せいかい */
    {
      no: 104, floor: 4, chapter: 0, course: 4,
      name: 'めばえの ま',
      desc: 'かいふくして くる くさの てき。ほのおが ゆうりです',
      bg: 'mori',
      castleHp: 2200,
      power: 2.2,
      reward: { coins: 2, exp: 270 },
      /* かいふくやくを かたく する（ほのおで さきに たおすのが せいかい）*/
      enemyBuff: { momoplant: { hp: 1410 } },
      waves: [
        { at: 3,  id: 'togehaya',      count: 1 },
        { at: 12, id: 'momoplant',     count: 2, gap: 2.0 },
        { at: 24, id: 'ojiinouenchou', count: 1 },
        { at: 36, id: 'momoplant',     count: 2, gap: 2.0 },
        { at: 50, id: 'togehaya',      count: 2, gap: 2.0, repeat: 26 },
        { at: 64, id: 'momoplant',     count: 2, gap: 2.0, repeat: 26 },
        { at: 80, id: 'ojiinouenchou', count: 1, repeat: 34 },
      ],
    },

    /* ============ 5かい：む ＋ パワー ============
       ウサ・ゴリラの ものすごい かいりょく。
       ★まじゅつし（時の旅人）が パワーに つよい */
    {
      no: 105, floor: 5, chapter: 0, course: 5,
      name: 'ごうわんの ま',
      desc: 'パワーの てき。まじゅつしが ゆうりです',
      bg: 'steel',
      castleHp: 2600,
      power: 2.6,
      reward: { coins: 2, exp: 300 },
      /* ウサ・ゴリラを かたく する（まじゅつしの ありがたみ）*/
      enemyBuff: { usagorilla: { hp: 2370 } },
      waves: [
        { at: 3,  id: 'togehaya',   count: 1 },
        { at: 12, id: 'usagorilla', count: 1 },
        { at: 26, id: 'nyororiinu', count: 4, gap: 0.6, repeat: 16 },
        { at: 36, id: 'usagorilla', count: 1, repeat: 18 },
        { at: 60, id: 'blockwan',   count: 1, repeat: 34 },
      ],
    },

    /* ============ 6かい：む ＋ けもの ============
       クマべぇ と 字一龍。
       ★パワー（豪傑天むす丸）が けものに つよい。
         かべくんは こうげき 0 なので、ここは 天むす丸の でばん */
    {
      no: 106, floor: 6, chapter: 0, course: 6,
      name: 'けものの ま',
      desc: 'けものの てき。パワーが ゆうりです',
      bg: 'mori',
      castleHp: 2800,
      power: 3,
      reward: { coins: 2, exp: 330 },
      /* クマべぇを かたく する（パワーの ありがたみ）*/
      enemyBuff: { kumabee: { hp: 2460 } },
      waves: [
        { at: 3,  id: 'togehaya', count: 1 },
        { at: 12, id: 'kumabee',  count: 1 },
        { at: 26, id: 'kumabee',  count: 1, repeat: 18 },
        { at: 44, id: 'jiryu',    count: 1, repeat: 30 },
        { at: 60, id: 'blockwan', count: 1, repeat: 34 },
      ],
    },

    /* ============ 7かい：む ＋ まじゅつし ============
       モコ魔道士は しゃていが 190 と とても ながい。
       ★けもの（シャドウヤマネコ）が はやく つっこんで きれる */
    {
      no: 107, floor: 7, chapter: 0, course: 7,
      name: 'まじゅつの ま',
      desc: 'とおくから うつ まじゅつし。けものが ゆうりです',
      bg: 'night',
      castleHp: 3400,
      power: 3.4,
      reward: { coins: 2, exp: 360 },
      waves: [
        { at: 3,  id: 'togehaya',     count: 1 },
        { at: 12, id: 'mokomadoushi', count: 1 },
        { at: 24, id: 'nyororiinu',   count: 4, gap: 0.6, repeat: 12 },
        { at: 34, id: 'mokomadoushi', count: 1, repeat: 15 },
        { at: 58, id: 'blockwan',     count: 1, repeat: 30 },
      ],
    },

    /* ============ 8かい：む ＋ メタル ============
       メタルは よわてんが 3つ（ほのお・まじゅつし・パワー）ありますが、
       それ いがいの こうげきは ほとんど とおりません。
       ★アイアン・コッコは かたく、コンガラガーンは はやくて つよい */
    {
      no: 108, floor: 8, chapter: 0, course: 8,
      name: 'はがねの ま',
      desc: 'メタルの てき。ほのお・まじゅつし・パワーが ゆうり',
      bg: 'steel',
      castleHp: 2800,
      power: 3.8,
      reward: { coins: 2, exp: 400 },
      /* アイアン・コッコを かたく する（ほのお・まじゅつし・パワーの ありがたみ）*/
      enemyBuff: { ironkokko: { hp: 2140 } },
      waves: [
        { at: 3,  id: 'togehaya',   count: 1 },
        { at: 12, id: 'ironkokko',  count: 1 },
        { at: 26, id: 'kongaragan', count: 1 },
        { at: 40, id: 'ironkokko',  count: 1, repeat: 20 },
        { at: 52, id: 'kongaragan', count: 1, repeat: 19 },
        { at: 66, id: 'blockwan',   count: 1, repeat: 34 },
      ],
    },

    /* ============ 9かい：さまざまな ぞくせい ============
       いままでの まとめ。どの ぞくせいも でて きます。
       みかたを Lv.7 くらいまで そだてて いどみましょう */
    {
      no: 109, floor: 9, chapter: 0, course: 9,
      name: 'まとめの ま',
      desc: 'すべての ぞくせいが でる。いままでの まとめ',
      bg: 'hoshizora',
      castleHp: 4000,
      power: 4.2,
      reward: { coins: 2, exp: 450 },
      waves: [
        { at: 3,   id: 'togehaya',     count: 1 },
        { at: 12,  id: 'honota',       count: 4, gap: 0.5 },
        { at: 22,  id: 'saba',         count: 2, gap: 1.2 },
        { at: 32,  id: 'momoplant',    count: 1 },
        { at: 42,  id: 'usagorilla',   count: 1 },
        { at: 54,  id: 'kumabee',      count: 1 },
        { at: 66,  id: 'mokomadoushi', count: 1 },
        { at: 78,  id: 'kongaragan',   count: 1 },
        { at: 90,  id: 'kamomeeru',    count: 2, gap: 1.2, repeat: 22 },
        { at: 102, id: 'honota',       count: 4, gap: 0.5, repeat: 20 },
        { at: 114, id: 'jiryu',        count: 1, repeat: 34 },
        { at: 128, id: 'togehaya',     count: 2, gap: 2.0, repeat: 24 },
      ],
    },

    /* ============ 10かい：さいじょうかい・スティーブ ============
       9かい ＋ おおボス「スティーブ」。
       スティーブは まえに でて こない かわりに、しゃてい 950 の
       ひの やで こちらの ぜんれつを ねらいつづけます。
       てきの しろが 70% まで へると あらわれます                */
    {
      no: 110, floor: 10, chapter: 0, course: 10,
      name: 'てっぺんの ま',
      desc: 'おおボス「スティーブ」。かって 10かい せいは！',
      bg: 'boss',
      castleHp: 4400,
      power: 4.6,
      reward: { coins: 2, exp: 600 },
      waves: [
        { at: 3,   id: 'togehaya',     count: 1 },
        { at: 12,  id: 'honota',       count: 4, gap: 0.5 },
        { at: 24,  id: 'kongaragan',   count: 1 },
        { at: 36,  id: 'usagorilla',   count: 1 },
        { at: 48,  id: 'mokomadoushi', count: 1 },
        { at: 60,  id: 'kumabee',      count: 1, repeat: 30 },
        { at: 74,  id: 'saba',         count: 2, gap: 1.2, repeat: 22 },
        { at: 88,  id: 'honota',       count: 4, gap: 0.5, repeat: 20 },
        { at: 102, id: 'togehaya',     count: 2, gap: 2.0, repeat: 26 },
        /* ★スティーブは はじめから いる。
           うごかない やぐらなので、あとから でて きても こわく ないため。
           しゃてい 950 の ひの やが せんじょう ぜんたいに とどく          */
        { at: 3, id: 'steve', count: 1 },
      ],
    },

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
  /* かみは とくべつ あつかい（attrPairMultiplier を みてね）*/
  god: [],
  /* ゆうれいは あいしょうは なし。そのかわり むこうか の のうりょくを もつ */
  ghost: [],
};

const ATTR_LABEL = {
  water: 'みず', fire: 'ほのお', grass: 'くさ',
  magic: 'まじゅつし', power: 'パワー', beast: 'けもの', metal: 'メタル',
  god: 'かみ',
  ghost: 'ゆうれい',
  none: 'む',
};

const ATTR_COLOR = {
  water: '#4fc3f7', fire: '#ff7043', grass: '#8bc34a',
  magic: '#ba68c8', power: '#ffca28', beast: '#8d6e63', metal: '#78909c',
  god: '#ffe082',
  ghost: '#b39ddb',
  none: '#bdbdbd',
};

/* --------------------------------------------------------------------------
   ぞくせいは 1つでも 2つでも かけます

     attr: 'fire'                ← 1つ
     attr: ['fire', 'magic']     ← 2つ もち（獄熱オニごん）

   2つ もちの ときは、かんけいの ある ぶんを ぜんぶ かけざん します。
   ポケモンの「こうかは ばつぐんだ／いまひとつ」と おなじ かんがえかたです。

     ほのお＋まじゅつし の あいてに──
       みず   → ほのおに ゆうり(2.5) × まじゅつしには とうばい(1.0) = 2.5ばい
       けもの → ほのおに とうばい(1.0) × まじゅつしに ゆうり(2.5)  = 2.5ばい
       くさ   → ほのおに ふり(0.6)   × まじゅつしには とうばい(1.0) = 0.6ばい
       メタル → ほのおに ふり(0.6)   × まじゅつしにも ふり(0.6)     = 0.36ばい

   1つでも ふりが あれば ダメージは おちます。
   ゆうりが かさなれば どんどん とおるように なります。
   -------------------------------------------------------------------------- */
function attrList(a) { return Array.isArray(a) ? a : [a]; }
function attrMain(a) { return Array.isArray(a) ? a[0] : a; }          // いろ などに つかう だいひょう
function attrHas(a, x) { return attrList(a).indexOf(x) >= 0; }
function attrLabelOf(a) { return attrList(a).map(x => ATTR_LABEL[x] || x).join('・'); }

/* こうげきする がわ → うける がわ の ダメージばいりつ */
function attrBeats(a, b) {
  const list = ATTR_BEATS[a];
  if (!list) return false;
  return (typeof list === 'string') ? (list === b) : (list.indexOf(b) >= 0);
}

/* ぞくせい 1つ どうしの ばいりつ */
function attrPairMultiplier(a, d) {
  /* --- かみ ぞくせい（あき坊）---
     ぜんぶの ぞくせいに すこし つよい（1.2ばい）。
     うける ダメージも すこし すくない（0.8ばい）。
     ただし メタルにだけは ふつうの よわてん あつかい        */
  if (a === 'god') return (d === 'metal') ? CONFIG.attrWeak   : CONFIG.godAtk;
  if (d === 'god') return (a === 'metal') ? CONFIG.attrStrong : CONFIG.godDef;

  if (attrBeats(a, d)) return CONFIG.attrStrong; // ゆうり
  if (attrBeats(d, a)) return CONFIG.attrWeak;   // ふり
  return 1.0;
}

function attrMultiplier(attacker, defender) {
  const A = attrList(attacker), D = attrList(defender);
  if (A.length === 1 && D.length === 1) return attrPairMultiplier(A[0], D[0]);
  let mult = 1;
  for (const a of A) for (const d of D) mult *= attrPairMultiplier(a, d);
  return mult;
}
