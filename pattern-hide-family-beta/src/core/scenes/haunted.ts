// おばけやしき（背景パック4）：しまのドレープカーテン、水玉のアンティークソファ、チェックのじゅうたん、月あかりのホール
// 3〜6歳向けに「暗いけれど、こわくない・かわいい」夜のお屋敷。輪郭線 #4A3A40 と顔がはっきり見える中間明度の柄。
import { type Pt, quadPoints } from '../geometry';
import type { SceneDef, CostumeDef } from '../scene';
import {
  batCushion,
  candleStand,
  candyPots,
  ghostPlush,
  lanternPost,
  magicBooks,
  musicBox,
  smilePumpkin,
  teaCart,
} from '../props-haunted';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#9E92B8', fg: '#9E92B8', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#8672A8', fg: '#B8A4D6', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#7A86B8', fg: '#F6E8B8', size: 44 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#C8A882', fg: '#8C6E96', size: 48 } },
];

/** 左側のゴシックアーチ窓のドレープカーテン */
export const CURTAIN_POLY: Pt[] = [
  { x: 26, y: 654 },
  { x: 26, y: 310 },
  ...quadPoints({ x: 26, y: 310 }, { x: 195, y: 200 }, { x: 364, y: 310 }, 16),
  { x: 364, y: 654 },
];

/** 右側の曲線背もたれアンティークソファ */
export const SOFA_POLY: Pt[] = [
  { x: 576, y: 654 },
  { x: 576, y: 440 },
  ...quadPoints({ x: 576, y: 440 }, { x: 775, y: 372 }, { x: 974, y: 440 }, 16),
  { x: 974, y: 654 },
];

/** 手前中央〜右のフリンジつきパッチワークじゅうたん */
export const CARPET_POLY: Pt[] = [
  { x: 395, y: 770 },
  { x: 905, y: 770 },
  ...quadPoints({ x: 905, y: 770 }, { x: 942, y: 870 }, { x: 925, y: 972 }, 8),
  ...quadPoints({ x: 925, y: 972 }, { x: 650, y: 982 }, { x: 375, y: 972 }, 8),
  ...quadPoints({ x: 375, y: 972 }, { x: 358, y: 870 }, { x: 395, y: 770 }, 8),
];

export const haunted: SceneDef = {
  id: 'haunted',
  name: 'おばけやしき',
  costumes,
  base:
    // 夜の洋館の天井・壁と、中央奥の満月のアーチ窓
    `<rect x="0" y="0" width="1000" height="470" fill="#3B3561"/>` +
    `<rect x="0" y="300" width="1000" height="170" fill="#4E467A"/>` +
    `<path d="M420 280 V140 Q490 60 560 140 V280 Z" fill="#2D294E" stroke="#6E5A4F" stroke-width="10"/>` +
    `<circle cx="490" cy="145" r="68" fill="#FFF3B0" opacity="0.18"/>` +
    `<circle cx="490" cy="145" r="42" fill="#FFF3B0"/>`,
  extraDefs: '',
  regions: [
    { id: 'hall', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }] },
    { id: 'curtain', costume: 'stripes', shapes: [{ kind: 'poly', pts: CURTAIN_POLY }] },
    { id: 'sofa', costume: 'dots', shapes: [{ kind: 'poly', pts: SOFA_POLY }] },
    { id: 'carpet', costume: 'check', shapes: [{ kind: 'poly', pts: CARPET_POLY }] },
  ],
  decor:
    // ドレープカーテンのアーチ飾り枠と巾木
    `<path d="M22 652 V310 Q195 196 368 310 V652" fill="none" stroke="#68548A" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="18" y="648" width="354" height="14" rx="4" fill="#68548A" stroke="#4A3A40" stroke-width="3"/>` +
    // アンティークソファの木彫りフレームと台座
    `<path d="M572 652 V440 Q775 368 978 440 V652" fill="none" stroke="#6E5270" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="568" y="648" width="414" height="14" rx="4" fill="#6E5270" stroke="#4A3A40" stroke-width="3"/>` +
    // 中央通路の石畳ステップ
    `<ellipse cx="460" cy="690" rx="36" ry="14" fill="#8A7DA6"/>` +
    `<ellipse cx="530" cy="725" rx="36" ry="14" fill="#8A7DA6"/>`,
  minorDecor:
    // 右上天井隅の細く控えめなくもの巣と、小さな星のきらめき
    `<g stroke="#7A709E" stroke-width="2" fill="none" opacity="0.7"><path d="M1000 0 L910 30 M1000 0 L930 65 M1000 0 L965 90"/><path d="M940 18 Q950 40 978 52 M920 26 Q936 56 968 78"/></g>` +
    `<g fill="#FFF3B0" opacity="0.85"><circle cx="390" cy="110" r="6"/><circle cx="600" cy="120" r="5"/><circle cx="630" cy="92" r="4"/></g>`,
  spots: [
    { id: 'haunted-curtain-1', x: 112, y: 652, s: 1, region: 'curtain', prop: smilePumpkin(112, 590, 124, 72), easy: true },
    { id: 'haunted-curtain-2', x: 276, y: 652, s: 1, region: 'curtain', prop: candleStand(276, 592, 134, 70), easy: false },
    { id: 'haunted-sofa-1', x: 680, y: 652, s: 1, region: 'sofa', prop: ghostPlush(680, 594, 136, 68), easy: true },
    { id: 'haunted-sofa-2', x: 865, y: 652, s: 1, region: 'sofa', prop: magicBooks(865, 594, 136, 68), easy: false },
    { id: 'haunted-carpet-1', x: 476, y: 884, s: 1, region: 'carpet', prop: batCushion(476, 864, 76, 40), easy: true },
    { id: 'haunted-carpet-2', x: 650, y: 948, s: 1, region: 'carpet', prop: candyPots(650, 924), easy: false },
    { id: 'haunted-carpet-3', x: 830, y: 884, s: 1, region: 'carpet', prop: musicBox(830, 826, 138, 68), easy: true },
    { id: 'haunted-hall-1', x: 135, y: 896, s: 1, region: 'hall', prop: teaCart(135, 838, 134, 70), easy: true },
    { id: 'haunted-hall-2', x: 300, y: 956, s: 0.95, region: 'hall', prop: lanternPost(300, 900, 126, 68), easy: false },
  ],
};
