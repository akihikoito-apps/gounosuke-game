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
  { x: 14, y: 586 },
  { x: 14, y: 260 },
  ...quadPoints({ x: 14, y: 260 }, { x: 201, y: 160 }, { x: 388, y: 260 }, 16),
  { x: 388, y: 586 },
];

/** 右側の曲線背もたれアンティークソファ */
export const SOFA_POLY: Pt[] = [
  { x: 576, y: 586 },
  { x: 576, y: 372 },
  ...quadPoints({ x: 576, y: 372 }, { x: 775, y: 304 }, { x: 974, y: 372 }, 16),
  { x: 974, y: 586 },
];

/** 手前中央〜右のフリンジつきパッチワークじゅうたん */
export const CARPET_POLY: Pt[] = [
  { x: 395, y: 784 },
  { x: 905, y: 784 },
  ...quadPoints({ x: 905, y: 784 }, { x: 942, y: 878 }, { x: 925, y: 980 }, 8),
  ...quadPoints({ x: 925, y: 980 }, { x: 650, y: 990 }, { x: 375, y: 980 }, 8),
  ...quadPoints({ x: 375, y: 980 }, { x: 358, y: 878 }, { x: 395, y: 784 }, 8),
];

export const haunted: SceneDef = {
  id: 'haunted',
  name: 'おばけやしき',
  costumes,
  base:
    // 夜の洋館の天井・壁と、中央奥の満月のアーチ窓
    `<rect x="0" y="0" width="1000" height="250" fill="#3B3561"/>` +
    `<path d="M425 230 V115 Q490 45 555 115 V230 Z" fill="#2D294E" stroke="#6E5A4F" stroke-width="10"/>` +
    `<circle cx="490" cy="120" r="62" fill="#FFF3B0" opacity="0.18"/>` +
    `<circle cx="490" cy="120" r="38" fill="#FFF3B0"/>`,
  extraDefs: '',
  regions: [
    { id: 'hall', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 240, w: 1000, h: 760 }] },
    { id: 'curtain', costume: 'stripes', shapes: [{ kind: 'poly', pts: CURTAIN_POLY }] },
    { id: 'sofa', costume: 'dots', shapes: [{ kind: 'poly', pts: SOFA_POLY }] },
    { id: 'carpet', costume: 'check', shapes: [{ kind: 'poly', pts: CARPET_POLY }] },
  ],
  decor:
    // 洋館の腰壁モールディング
    `<path d="M0 584 H1000" stroke="#7A6C98" stroke-width="6"/>` +
    // ドレープカーテンのアーチ飾り枠と巾木
    `<path d="M10 584 V260 Q201 156 392 260 V584" fill="none" stroke="#68548A" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="8" y="580" width="388" height="14" rx="4" fill="#68548A" stroke="#4A3A40" stroke-width="3"/>` +
    // アンティークソファの木彫りフレームと台座
    `<path d="M572 584 V372 Q775 300 978 372 V584" fill="none" stroke="#6E5270" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="568" y="580" width="414" height="14" rx="4" fill="#6E5270" stroke="#4A3A40" stroke-width="3"/>` +
    // 中央通路の石畳ステップ
    `<ellipse cx="460" cy="660" rx="36" ry="14" fill="#8A7DA6"/>` +
    `<ellipse cx="530" cy="710" rx="36" ry="14" fill="#8A7DA6"/>`,
  minorDecor:
    // 右上天井隅の細く控えめなくもの巣と、小さな星のきらめき
    `<g stroke="#7A709E" stroke-width="2" fill="none" opacity="0.7"><path d="M1000 0 L910 30 M1000 0 L930 65 M1000 0 L965 90"/><path d="M940 18 Q950 40 978 52 M920 26 Q936 56 968 78"/></g>` +
    `<g fill="#FFF3B0" opacity="0.85"><circle cx="390" cy="110" r="6"/><circle cx="600" cy="120" r="5"/><circle cx="630" cy="92" r="4"/></g>`,
  spots: [
    { id: 'haunted-curtain-1', x: 136, y: 584, s: 1, region: 'curtain', prop: smilePumpkin(136, 522, 124, 72), easy: true },
    { id: 'haunted-curtain-2', x: 300, y: 584, s: 1, region: 'curtain', prop: candleStand(300, 524, 134, 70), easy: false },
    { id: 'haunted-sofa-1', x: 680, y: 584, s: 1, region: 'sofa', prop: ghostPlush(680, 526, 136, 68), easy: true },
    { id: 'haunted-sofa-2', x: 865, y: 584, s: 1, region: 'sofa', prop: magicBooks(865, 526, 136, 68), easy: false },
    { id: 'haunted-carpet-1', x: 476, y: 922, s: 1, region: 'carpet', prop: batCushion(476, 902, 76, 40), easy: true },
    { id: 'haunted-carpet-2', x: 654, y: 928, s: 1, region: 'carpet', prop: candyPots(654, 904), easy: false },
    { id: 'haunted-carpet-3', x: 830, y: 922, s: 1, region: 'carpet', prop: musicBox(830, 864, 138, 68), easy: true },
    { id: 'haunted-hall-1', x: 136, y: 922, s: 1, region: 'hall', prop: teaCart(136, 864, 134, 70), easy: true },
    { id: 'haunted-hall-2', x: 300, y: 928, s: 0.95, region: 'hall', prop: lanternPost(300, 872, 126, 68), easy: false },
  ],
};
