// きょうりゅうの たに（背景パック5）：しまの地層がけ、水玉のシダジャングル、チェックのたまごの巣、砂の谷底
// 3〜6歳向けに、にっこり笑う恐竜たちが暮らす明るくあたたかい谷。ホラー要素（牙・爪・咆哮）なし。
import { type Pt, quadPoints } from '../geometry';
import type { SceneDef, CostumeDef } from '../scene';
import {
  ammoniteRock,
  cycadStump,
  eggShells,
  explorerCrate,
  fernCushion,
  footprintStone,
  geyserPool,
  ribArch,
  spottedEgg,
} from '../props-dino';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#E8D5B5', fg: '#E8D5B5', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#F4E4CE', fg: '#D99B78', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#78B888', fg: '#FFF4C8', size: 44 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#FFF6E8', fg: '#98C686', size: 48 } },
];

/** 左側のアーチ型・赤土のしましま地層がけ */
export const CLIFF_POLY: Pt[] = [
  { x: 26, y: 654 },
  { x: 26, y: 310 },
  ...quadPoints({ x: 26, y: 310 }, { x: 195, y: 200 }, { x: 364, y: 310 }, 16),
  { x: 364, y: 654 },
];

/** 右側のドーム型・原始のシダとソテツのしげみ */
export const FERN_POLY: Pt[] = [
  { x: 576, y: 654 },
  { x: 576, y: 440 },
  ...quadPoints({ x: 576, y: 440 }, { x: 775, y: 372 }, { x: 974, y: 440 }, 16),
  { x: 974, y: 654 },
];

/** 手前中央〜右の草を編んだたまごの巣マット */
export const NEST_POLY: Pt[] = [
  { x: 395, y: 770 },
  { x: 905, y: 770 },
  ...quadPoints({ x: 905, y: 770 }, { x: 942, y: 870 }, { x: 925, y: 972 }, 8),
  ...quadPoints({ x: 925, y: 972 }, { x: 650, y: 982 }, { x: 375, y: 972 }, 8),
  ...quadPoints({ x: 375, y: 972 }, { x: 358, y: 870 }, { x: 395, y: 770 }, 8),
];

export const dino: SceneDef = {
  id: 'dino',
  name: 'きょうりゅうの たに',
  costumes,
  base:
    // あたたかい空・遠くのテーブルマウンテン・ぽかぽか火山と白い湯気雲
    `<rect x="0" y="0" width="1000" height="470" fill="#FFF3D6"/>` +
    `<path d="M0 470 V320 L140 250 H310 L410 340 L560 220 H720 L840 330 L1000 270 V470 Z" fill="#E6C6A0"/>` +
    `<path d="M430 470 L500 240 H590 L660 470 Z" fill="#C89678"/>` +
    `<path d="M492 240 Q545 262 598 240 Q575 280 545 274 Q515 280 492 240 Z" fill="#F4A27E"/>` +
    `<circle cx="530" cy="180" r="28" fill="#FFFFFF" opacity="0.85"/>` +
    `<circle cx="566" cy="156" r="22" fill="#FFFFFF" opacity="0.8"/>` +
    `<circle cx="545" cy="126" r="16" fill="#FFFFFF" opacity="0.75"/>` +
    `<circle cx="840" cy="108" r="44" fill="#FFE082" opacity="0.85"/>`,
  extraDefs: '',
  regions: [
    { id: 'valley', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }] },
    { id: 'cliff', costume: 'stripes', shapes: [{ kind: 'poly', pts: CLIFF_POLY }] },
    { id: 'fern', costume: 'dots', shapes: [{ kind: 'poly', pts: FERN_POLY }] },
    { id: 'nest', costume: 'check', shapes: [{ kind: 'poly', pts: NEST_POLY }] },
  ],
  decor:
    // 地層がけの輪郭と岩の台座
    `<path d="M22 652 V310 Q195 196 368 310 V652" fill="none" stroke="#B67856" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="18" y="648" width="354" height="14" rx="4" fill="#B67856" stroke="#4A3A40" stroke-width="3"/>` +
    // シダジャングルの縁と台座
    `<path d="M572 652 V440 Q775 368 978 440 V652" fill="none" stroke="#4E9464" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="568" y="648" width="414" height="14" rx="4" fill="#4E9464" stroke="#4A3A40" stroke-width="3"/>` +
    // 谷底のあしあと飛び石
    `<ellipse cx="460" cy="690" rx="36" ry="14" fill="#D2BC9A"/>` +
    `<ellipse cx="530" cy="725" rx="36" ry="14" fill="#D2BC9A"/>`,
  minorDecor:
    // ふわふわ浮かぶ綿毛と雲
    `<g fill="#FFFFFF" opacity="0.85"><circle cx="200" cy="110" r="14"/><circle cx="226" cy="104" r="18"/><circle cx="252" cy="112" r="12"/></g>` +
    `<g fill="#FFFDF4" opacity="0.8"><circle cx="380" cy="180" r="6"/><circle cx="690" cy="190" r="5"/></g>`,
  spots: [
    { id: 'dino-cliff-1', x: 112, y: 652, s: 1, region: 'cliff', prop: ammoniteRock(112, 590, 124, 72), easy: true },
    { id: 'dino-cliff-2', x: 276, y: 652, s: 1, region: 'cliff', prop: ribArch(276, 592, 134, 70), easy: false },
    { id: 'dino-fern-1', x: 680, y: 652, s: 1, region: 'fern', prop: cycadStump(680, 594, 136, 68), easy: true },
    { id: 'dino-fern-2', x: 865, y: 652, s: 1, region: 'fern', prop: geyserPool(865, 594, 136, 68), easy: false },
    { id: 'dino-nest-1', x: 476, y: 884, s: 1, region: 'nest', prop: spottedEgg(476, 864, 76, 40), easy: true },
    { id: 'dino-nest-2', x: 650, y: 948, s: 1, region: 'nest', prop: eggShells(650, 924), easy: false },
    { id: 'dino-nest-3', x: 830, y: 884, s: 1, region: 'nest', prop: fernCushion(830, 826, 138, 68), easy: true },
    { id: 'dino-valley-1', x: 135, y: 896, s: 1, region: 'valley', prop: footprintStone(135, 838, 134, 70), easy: true },
    { id: 'dino-valley-2', x: 300, y: 956, s: 0.95, region: 'valley', prop: explorerCrate(300, 900, 126, 68), easy: false },
  ],
};
