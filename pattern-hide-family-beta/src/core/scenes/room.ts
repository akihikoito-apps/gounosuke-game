// へや：布（カーテン・ソファ・ラグ）と木目のある部屋
import type { SceneDef, CostumeDef } from '../scene';
import { patternMarkup } from '../patterns';
import { basket, ball, blanket, blocks, cushion, pot, toyBox } from '../props';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#F6E4C8', fg: '#F6E4C8', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#FCE4E9', fg: '#F2A9B8', size: 38 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#7EA6DA', fg: '#EAF2FC', size: 46 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#FFF6DC', fg: '#F2B84B', size: 52 } },
];

export const room: SceneDef = {
  id: 'room',
  name: 'へや',
  costumes,
  base:
    // 床（木目）
    `<rect x="0" y="650" width="1000" height="350" fill="url(#{P}wood-room)"/>` +
    `<path d="M0 760 H1000 M0 880 H1000" stroke="#C99A68" stroke-width="3" opacity="0.6"/>`,
  extraDefs:
    patternMarkup('{P}wood-room', { kind: 'wood', bg: '#E8C194', fg: '#CFA06C', size: 120 }) +
    patternMarkup('{P}wood-room-dark', { kind: 'wood', bg: '#C08A57', fg: '#9E6C3E', size: 90 }),
  regions: [
    { id: 'wall', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 0, w: 1000, h: 650 }] },
    {
      id: 'curtain',
      costume: 'stripes',
      shapes: [
        {
          kind: 'poly',
          pts: [
            { x: 24, y: 40 },
            { x: 218, y: 40 },
            { x: 226, y: 644 },
            { x: 16, y: 644 },
          ],
        },
      ],
    },
    {
      id: 'sofa',
      costume: 'dots',
      shapes: [
        { kind: 'rect', x: 360, y: 400, w: 400, h: 240, rx: 42 },
        { kind: 'rect', x: 326, y: 480, w: 70, h: 190, rx: 30 },
        { kind: 'rect', x: 724, y: 480, w: 70, h: 190, rx: 30 },
      ],
    },
    { id: 'rug', costume: 'check', shapes: [{ kind: 'ellipse', cx: 530, cy: 868, rx: 380, ry: 112 }] },
  ],
  decor:
    // はば木
    `<rect x="0" y="632" width="1000" height="22" fill="#D7B48A"/>` +
    // まど
    `<rect x="250" y="80" width="250" height="230" rx="14" fill="#CFEFFF" stroke="#C99A68" stroke-width="12"/>` +
    `<path d="M375 86 V304 M256 195 H494" stroke="#C99A68" stroke-width="8"/>` +
    `<circle cx="440" cy="140" r="26" fill="#FFF2A8"/>` +
    // カーテンレール
    `<rect x="8" y="28" width="230" height="16" rx="8" fill="#B07A4A"/>` +
    // ソファの脚
    `<rect x="350" y="664" width="18" height="22" rx="4" fill="#7A5A3A"/><rect x="752" y="664" width="18" height="22" rx="4" fill="#7A5A3A"/>` +
    // 低い戸だな（木目）
    `<rect x="812" y="474" width="176" height="180" rx="10" fill="url(#{P}wood-room-dark)" stroke="#7A5A3A" stroke-width="5"/>` +
    `<path d="M900 480 V648" stroke="#7A5A3A" stroke-width="4"/><circle cx="886" cy="566" r="6" fill="#7A5A3A"/><circle cx="914" cy="566" r="6" fill="#7A5A3A"/>`,
  minorDecor:
    // かべの絵と時計
    `<rect x="560" y="120" width="120" height="96" rx="8" fill="#FFFFFF" stroke="#C99A68" stroke-width="8"/>` +
    `<path d="M574 200 L606 160 L630 186 L646 170 L668 200Z" fill="#8CCB9B"/><circle cx="650" cy="146" r="10" fill="#F2B84B"/>` +
    `<circle cx="790" cy="140" r="40" fill="#FFFFFF" stroke="#B07A4A" stroke-width="8"/><path d="M790 140 V114 M790 140 L808 150" stroke="#4A3A40" stroke-width="5" stroke-linecap="round"/>`,
  spots: [
    { id: 'room-curtain', x: 120, y: 646, s: 1, region: 'curtain', prop: toyBox(120, 590), easy: true },
    { id: 'room-plant', x: 290, y: 652, s: 1, region: 'wall', prop: pot(290, 588), easy: true },
    { id: 'room-sofa-l', x: 470, y: 600, s: 1, region: 'sofa', prop: cushion(470, 602), easy: true },
    { id: 'room-sofa-r', x: 650, y: 600, s: 1, region: 'sofa', prop: blanket(650, 566), easy: false },
    { id: 'room-cabinet', x: 900, y: 476, s: 0.95, region: 'wall', prop: pot(900, 418, 104, 62, '#7FB8F0'), easy: false },
    { id: 'room-rug-1', x: 260, y: 880, s: 1, region: 'rug', prop: blocks(260, 912), easy: true },
    { id: 'room-rug-2', x: 440, y: 950, s: 1, region: 'rug', prop: ball(440, 920), easy: false },
    { id: 'room-rug-3', x: 630, y: 878, s: 1, region: 'rug', prop: basket(630, 832), easy: true },
    { id: 'room-rug-4', x: 810, y: 930, s: 1, region: 'rug', prop: cushion(810, 920, 78, 44, '#F6A5B8'), easy: false },
  ],
};
