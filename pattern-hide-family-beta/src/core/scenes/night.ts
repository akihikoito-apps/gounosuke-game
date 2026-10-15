// ほたるの かわべ（背景パック4）：しまのくさはら、水玉の夜の川、チェックのござ、月あかりの石みち
// 3〜6歳向けに、ほたるがふわふわ飛ぶ暗めだけどやさしい夏の夜の川べり。輪郭線 #4A3A40 と顔がはっきり見える中間明度の柄。
import { type Pt, quadPoints } from '../geometry';
import type { SceneDef, CostumeDef } from '../scene';
import {
  bambooBenchProp,
  bambooBoat,
  fireflyCage,
  frogStatue,
  leafBoat,
  paperLanternProp,
  uchiwaFan,
  waterlily,
  watermelon,
} from '../props-night';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#7E889B', fg: '#7E889B', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#4E7A6B', fg: '#82B596', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#4B6E96', fg: '#F2DC8C', size: 44 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#C8A86B', fg: '#8C9E6E', size: 48 } },
];

/** 左側の夜の夏草のしげみ（くさはら） */
export const GRASS_POLY: Pt[] = [
  { x: 14, y: 586 },
  { x: 14, y: 260 },
  ...quadPoints({ x: 14, y: 260 }, { x: 201, y: 160 }, { x: 388, y: 260 }, 16),
  { x: 388, y: 586 },
];

/** 右側の月あかりが映る夜の川（かわ） */
export const RIVER_POLY: Pt[] = [
  { x: 576, y: 586 },
  { x: 576, y: 372 },
  // 上のふちは ゆるい波（川の水面）。のぞき場所（x 680・860）は 波の谷にして、顔が水面の上に出るように
  ...quadPoints({ x: 576, y: 372 }, { x: 616, y: 348 }, { x: 680, y: 348 }, 8),
  ...quadPoints({ x: 680, y: 348 }, { x: 770, y: 296 }, { x: 860, y: 348 }, 10),
  ...quadPoints({ x: 860, y: 348 }, { x: 934, y: 348 }, { x: 974, y: 372 }, 8),
  { x: 974, y: 586 },
];

/** 手前中央〜右の川べりに敷いたピクニックのござ */
export const MAT_POLY: Pt[] = [
  { x: 395, y: 784 },
  { x: 905, y: 784 },
  ...quadPoints({ x: 905, y: 784 }, { x: 942, y: 878 }, { x: 925, y: 980 }, 8),
  ...quadPoints({ x: 925, y: 980 }, { x: 650, y: 990 }, { x: 375, y: 980 }, 8),
  ...quadPoints({ x: 375, y: 980 }, { x: 358, y: 878 }, { x: 395, y: 784 }, 8),
];

export const night: SceneDef = {
  id: 'night',
  name: 'ほたるの かわべ',
  costumes,
  base:
    // 深い紺色の夜空・遠くの山なみ・まるい満月
    `<rect x="0" y="0" width="1000" height="250" fill="#24345A"/>` +
    `<path d="M0 242 Q160 168 340 220 Q520 156 710 218 Q860 168 1000 228 V250 H0 Z" fill="#32476E"/>` +
    `<circle cx="490" cy="112" r="62" fill="#FFF3B0" opacity="0.2"/>` +
    `<circle cx="490" cy="112" r="38" fill="#FFF3B0"/>`,
  extraDefs: '',
  regions: [
    { id: 'path', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 240, w: 1000, h: 760 }] },
    { id: 'grass', costume: 'stripes', shapes: [{ kind: 'poly', pts: GRASS_POLY }] },
    { id: 'river', costume: 'dots', shapes: [{ kind: 'poly', pts: RIVER_POLY }] },
    { id: 'mat', costume: 'check', shapes: [{ kind: 'poly', pts: MAT_POLY }] },
  ],
  decor:
    // 川岸の石畳ライン
    `<path d="M0 584 H1000" stroke="#647084" stroke-width="6"/>` +
    // くさはらの縁と草の穂・根元の石組み
    `<path d="M10 584 V260 Q201 156 392 260 V584" fill="none" stroke="#3E6658" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="8" y="580" width="388" height="14" rx="4" fill="#5C7E6E" stroke="#4A3A40" stroke-width="3"/>` +
    // 夜の川の岸辺の石枠と丸石
    `<path d="M572 584 V372 Q614 344 680 344 Q770 292 860 344 Q936 344 978 372 V584" fill="none" stroke="#3E5C82" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="568" y="580" width="414" height="14" rx="4" fill="#5A7698" stroke="#4A3A40" stroke-width="3"/>` +
    // かわらの飛び石
    `<ellipse cx="460" cy="660" rx="36" ry="14" fill="#929CB0"/>` +
    `<ellipse cx="530" cy="710" rx="36" ry="14" fill="#929CB0"/>`,
  minorDecor:
    // 夜空の小さな星と、遠くに浮かぶほたるの光
    `<g fill="#FFF3B0" opacity="0.85"><circle cx="120" cy="76" r="4.5"/><circle cx="280" cy="58" r="5"/><circle cx="390" cy="110" r="5.5"/><circle cx="600" cy="120" r="5"/><circle cx="630" cy="92" r="4"/><circle cx="840" cy="74" r="5"/><circle cx="930" cy="108" r="4.5"/></g>` +
    `<g fill="#FFF099" opacity="0.75"><circle cx="440" cy="210" r="7"/><circle cx="545" cy="196" r="6"/></g>`,
  spots: [
    { id: 'night-grass-1', x: 136, y: 584, s: 1, region: 'grass', prop: fireflyCage(136, 522, 124, 72), easy: true },
    { id: 'night-grass-2', x: 300, y: 584, s: 1, region: 'grass', prop: uchiwaFan(300, 524, 134, 70), easy: false },
    { id: 'night-river-1', x: 680, y: 584, s: 1, region: 'river', prop: waterlily(680, 526, 136, 68), easy: true },
    { id: 'night-river-2', x: 865, y: 584, s: 1, region: 'river', prop: bambooBoat(865, 526, 136, 68), easy: false },
    { id: 'night-mat-1', x: 476, y: 922, s: 1, region: 'mat', prop: watermelon(476, 902, 76, 40), easy: true },
    { id: 'night-mat-2', x: 654, y: 928, s: 1, region: 'mat', prop: leafBoat(654, 904), easy: false },
    { id: 'night-mat-3', x: 830, y: 922, s: 1, region: 'mat', prop: bambooBenchProp(830, 864, 138, 68), easy: true },
    { id: 'night-path-1', x: 136, y: 922, s: 1, region: 'path', prop: frogStatue(136, 864, 134, 70), easy: true },
    { id: 'night-path-2', x: 300, y: 928, s: 0.95, region: 'path', prop: paperLanternProp(300, 872, 126, 68), easy: false },
  ],
};
