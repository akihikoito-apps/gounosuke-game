// うみべ（背景パック1）：しまの海の家、水玉の風よけ、チェックのレジャーシート、砂浜
import type { SceneDef, CostumeDef } from '../scene';
import { ball } from '../props';
import { cooler, floatRing, sandBucket, sandcastle, shellPile } from '../props-beach';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#F1DDB5', fg: '#F1DDB5', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#EAF5F8', fg: '#9CC8DE', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#F2A99B', fg: '#FFF4EA', size: 44 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#FFFFFF', fg: '#8FBCE0', size: 48 } },
];

const wave = (y: number, step: number, amp: number) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < 1000; x += step) d += ` q${step / 2} ${-amp} ${step} 0`;
  return d;
};

export const beach: SceneDef = {
  id: 'beach',
  name: 'うみべ',
  costumes,
  base:
    // 空と海
    `<rect x="0" y="0" width="1000" height="360" fill="#CFEAF6"/>` +
    `<rect x="0" y="330" width="1000" height="150" fill="#94CFE0"/>` +
    `<path d="${wave(372, 80, 10)}" fill="none" stroke="#E8F6FA" stroke-width="5"/>` +
    `<path d="${wave(420, 80, 10)}" fill="none" stroke="#E8F6FA" stroke-width="4" opacity="0.8"/>` +
    `<circle cx="880" cy="96" r="48" fill="#FFE07A"/>`,
  extraDefs: '',
  regions: [
    { id: 'sand', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 470, w: 1000, h: 530 }] },
    { id: 'hut', costume: 'stripes', shapes: [{ kind: 'rect', x: 30, y: 250, w: 300, h: 404 }] },
    { id: 'windbreak', costume: 'dots', shapes: [{ kind: 'rect', x: 600, y: 440, w: 380, h: 214, rx: 6 }] },
    {
      id: 'towel',
      costume: 'check',
      shapes: [
        {
          kind: 'poly',
          pts: [
            { x: 400, y: 770 },
            { x: 900, y: 770 },
            { x: 930, y: 972 },
            { x: 370, y: 972 },
          ],
        },
      ],
    },
  ],
  decor:
    // 波打ちぎわ
    `<path d="${wave(474, 60, 12)}" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>` +
    // 海の家の屋根と土台
    `<path d="M14 262 L180 176 L346 262 Z" fill="#E99A86" stroke="#4A3A40" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="24" y="650" width="312" height="12" rx="4" fill="#C9A06A"/>` +
    // 風よけの柱
    `<g fill="#C9A06A" stroke="#4A3A40" stroke-width="3"><rect x="592" y="424" width="14" height="246" rx="5"/><rect x="783" y="424" width="14" height="246" rx="5"/><rect x="974" y="424" width="14" height="246" rx="5"/></g>`,
  minorDecor:
    // 雲・ヨット・かもめ
    `<g fill="#FFFFFF" opacity="0.9"><ellipse cx="200" cy="110" rx="70" ry="26"/><ellipse cx="250" cy="92" rx="48" ry="28"/><ellipse cx="600" cy="150" rx="56" ry="22"/></g>` +
    `<path d="M520 360 h70 l-10 16 h-50z" fill="#E99A86"/><path d="M552 358 V300 L590 352Z" fill="#FFFFFF" stroke="#4A3A40" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M420 200 q12 -12 24 0 q12 -12 24 0" stroke="#4A3A40" stroke-width="4" fill="none"/>`,
  spots: [
    { id: 'beach-hut-1', x: 110, y: 652, s: 1, region: 'hut', prop: sandBucket(110, 594), easy: true },
    { id: 'beach-hut-2', x: 260, y: 652, s: 1, region: 'hut', prop: floatRing(258, 616), easy: false },
    { id: 'beach-wind-1', x: 690, y: 652, s: 1, region: 'windbreak', prop: cooler(690, 606, 132, 70), easy: true },
    { id: 'beach-wind-2', x: 880, y: 652, s: 1, region: 'windbreak', prop: sandcastle(880, 600, 132, 78), easy: false },
    { id: 'beach-towel-1', x: 490, y: 884, s: 1, region: 'towel', prop: ball(490, 870, 52), easy: true },
    { id: 'beach-towel-2', x: 660, y: 948, s: 1, region: 'towel', prop: shellPile(660, 926), easy: false },
    { id: 'beach-towel-3', x: 830, y: 884, s: 1, region: 'towel', prop: floatRing(830, 852), easy: true },
    { id: 'beach-sand-1', x: 150, y: 900, s: 1, region: 'sand', prop: sandcastle(150, 848, 132, 78), easy: true },
    { id: 'beach-sand-2', x: 320, y: 960, s: 0.95, region: 'sand', prop: sandBucket(320, 914), easy: false },
  ],
};
