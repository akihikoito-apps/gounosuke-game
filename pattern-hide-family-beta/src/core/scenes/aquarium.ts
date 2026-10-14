// すいぞくかん（背景パック3）：しまの大水槽、水玉のクラゲドーム、チェックのキッズマット、通路床
import { type Pt, quadPoints } from '../geometry';
import type { SceneDef, CostumeDef } from '../scene';
import {
  bubbleBench,
  coralDisplay,
  dolphinPlush,
  guideStand,
  pearlClams,
  penguinSign,
  shellCushion,
  souvenirCart,
  turtleBoard,
} from '../props-aquarium';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#C8DCE8', fg: '#C8DCE8', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#78C6D6', fg: '#4EA4B8', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#8E9CE0', fg: '#F4F7FF', size: 44 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#FFF4EE', fg: '#F2A698', size: 48 } },
];

/** 左側のアーチ型パノラマ大水槽 */
export const TANK_POLY: Pt[] = [
  { x: 26, y: 654 },
  { x: 26, y: 310 },
  ...quadPoints({ x: 26, y: 310 }, { x: 195, y: 200 }, { x: 364, y: 310 }, 16),
  { x: 364, y: 654 },
];

/** 右側のドーム型クラゲ水槽（丸い傘の形） */
export const JELLY_POLY: Pt[] = [
  { x: 576, y: 654 },
  { x: 576, y: 440 },
  ...quadPoints({ x: 576, y: 440 }, { x: 775, y: 372 }, { x: 974, y: 440 }, 16),
  { x: 974, y: 654 },
];

/** 手前中央〜右の波型クッションマット */
export const MAT_POLY: Pt[] = [
  { x: 395, y: 770 },
  { x: 905, y: 770 },
  ...quadPoints({ x: 905, y: 770 }, { x: 942, y: 870 }, { x: 925, y: 972 }, 8),
  ...quadPoints({ x: 925, y: 972 }, { x: 650, y: 982 }, { x: 375, y: 972 }, 8),
  ...quadPoints({ x: 375, y: 972 }, { x: 358, y: 870 }, { x: 395, y: 770 }, 8),
];

export const aquarium: SceneDef = {
  id: 'aquarium',
  name: 'すいぞくかん',
  costumes,
  base:
    // 水中トンネルの天井と館内の奥壁
    `<rect x="0" y="0" width="1000" height="470" fill="#D6ECF4"/>` +
    `<rect x="0" y="300" width="1000" height="170" fill="#B2D4E4"/>` +
    `<path d="M0 180 Q500 80 1000 180" fill="none" stroke="#96C0D4" stroke-width="14"/>` +
    `<path d="M0 300 Q500 220 1000 300" fill="none" stroke="#96C0D4" stroke-width="10"/>` +
    `<circle cx="480" cy="110" r="44" fill="#FFF6C8" opacity="0.8"/>`,
  extraDefs: '',
  regions: [
    { id: 'floor', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }] },
    { id: 'tank', costume: 'stripes', shapes: [{ kind: 'poly', pts: TANK_POLY }] },
    { id: 'jelly', costume: 'dots', shapes: [{ kind: 'poly', pts: JELLY_POLY }] },
    { id: 'mat', costume: 'check', shapes: [{ kind: 'poly', pts: MAT_POLY }] },
  ],
  decor:
    // パノラマ大水槽のアーチ枠と台座
    `<path d="M22 652 V310 Q195 196 368 310 V652" fill="none" stroke="#5E8EA8" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="18" y="648" width="354" height="14" rx="4" fill="#5E8EA8" stroke="#4A3A40" stroke-width="3"/>` +
    // クラゲドーム水槽のドーム枠と台座
    `<path d="M572 652 V440 Q775 368 978 440 V652" fill="none" stroke="#6E82B8" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="568" y="648" width="414" height="14" rx="4" fill="#6E82B8" stroke="#4A3A40" stroke-width="3"/>` +
    // 中央通路のアクアタイルステップ
    `<ellipse cx="460" cy="690" rx="36" ry="14" fill="#B0CAD8"/>` +
    `<ellipse cx="530" cy="725" rx="36" ry="14" fill="#B0CAD8"/>`,
  minorDecor:
    // 水中トンネルの泡と魚影
    `<g fill="#FFFFFF" opacity="0.85"><circle cx="200" cy="110" r="12"/><circle cx="230" cy="86" r="8"/><circle cx="620" cy="130" r="10"/><circle cx="646" cy="108" r="6"/></g>` +
    `<path d="M420 170 q18 -12 36 0 q-18 12 -36 0 M456 170 l10 -8 v16 z" fill="#8AB8CE"/>`,
  spots: [
    { id: 'aquarium-tank-1', x: 112, y: 652, s: 1, region: 'tank', prop: turtleBoard(112, 590, 124, 72), easy: true },
    { id: 'aquarium-tank-2', x: 276, y: 652, s: 1, region: 'tank', prop: coralDisplay(276, 592, 134, 70), easy: false },
    { id: 'aquarium-jelly-1', x: 680, y: 652, s: 1, region: 'jelly', prop: guideStand(680, 594, 136, 68), easy: true },
    { id: 'aquarium-jelly-2', x: 865, y: 652, s: 1, region: 'jelly', prop: bubbleBench(865, 594, 136, 68), easy: false },
    { id: 'aquarium-mat-1', x: 476, y: 884, s: 1, region: 'mat', prop: shellCushion(476, 864, 76, 40), easy: true },
    { id: 'aquarium-mat-2', x: 650, y: 948, s: 1, region: 'mat', prop: pearlClams(650, 924), easy: false },
    { id: 'aquarium-mat-3', x: 830, y: 884, s: 1, region: 'mat', prop: dolphinPlush(830, 826, 138, 68), easy: true },
    { id: 'aquarium-floor-1', x: 135, y: 896, s: 1, region: 'floor', prop: souvenirCart(135, 838, 134, 70), easy: true },
    { id: 'aquarium-floor-2', x: 300, y: 956, s: 0.95, region: 'floor', prop: penguinSign(300, 900, 126, 68), easy: false },
  ],
};
