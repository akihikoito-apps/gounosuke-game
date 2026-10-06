// おやつのみせ：水玉のかべ、しまのカウンター、チェックのテーブルクロス
import type { SceneDef, CostumeDef } from '../scene';
import { breadBasket, cakeStand, jar, sack, stool } from '../props';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#F2DDBE', fg: '#F2DDBE', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#E6F7F0', fg: '#9CD8C2', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#FCE5EC', fg: '#F4AFC4', size: 46 } },
  { id: 'check', kind: 'check', spec: { kind: 'check', bg: '#FFFFFF', fg: '#EE8C8C', size: 46 } },
];

const awning = (() => {
  let d = 'M0 40 H1000 V150';
  for (let x = 1000; x > 0; x -= 50) d += ` Q${x - 25} 190 ${x - 50} 150`;
  return d + 'Z';
})();

export const shop: SceneDef = {
  id: 'shop',
  name: 'おやつのみせ',
  costumes,
  base: '',
  extraDefs: `<clipPath id="{P}awning-clip"><path d="${awning}"/></clipPath>`,
  regions: [
    { id: 'wall', costume: 'dots', shapes: [{ kind: 'rect', x: 0, y: 0, w: 1000, h: 600 }] },
    { id: 'floor', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 790, w: 1000, h: 210 }] },
    { id: 'counter', costume: 'stripes', shapes: [{ kind: 'rect', x: 60, y: 590, w: 880, h: 210 }] },
    { id: 'cloth', costume: 'check', shapes: [{ kind: 'poly', pts: [{ x: 640, y: 730 }, { x: 960, y: 730 }, { x: 980, y: 975 }, { x: 620, y: 975 }] }] },
  ],
  decor:
    // ひさし
    `<path d="${awning}" fill="#FFFFFF" stroke="#4A3A40" stroke-width="3"/>` +
    `<g clip-path="url(#{P}awning-clip)">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 100}" y="40" width="50" height="160" fill="#F7B267"/>`).join('')}</g>` +
    // カウンターの天板
    `<rect x="40" y="572" width="920" height="26" rx="8" fill="#C98F5A" stroke="#4A3A40" stroke-width="3"/>` +
    // テーブルの天板
    `<rect x="624" y="716" width="352" height="20" rx="8" fill="#B07A4A" stroke="#4A3A40" stroke-width="3"/>`,
  minorDecor:
    // かべのたなと びん
    `<rect x="120" y="270" width="300" height="14" rx="5" fill="#C98F5A"/>` +
    `<rect x="150" y="214" width="46" height="56" rx="12" fill="#EAF6FB" stroke="#4A3A40" stroke-width="3"/><circle cx="173" cy="250" r="12" fill="#F07D7D"/>` +
    `<rect x="230" y="224" width="46" height="46" rx="12" fill="#EAF6FB" stroke="#4A3A40" stroke-width="3"/><circle cx="253" cy="250" r="12" fill="#FFD45C"/>` +
    `<rect x="310" y="210" width="46" height="60" rx="12" fill="#EAF6FB" stroke="#4A3A40" stroke-width="3"/><circle cx="333" cy="250" r="12" fill="#8CCB9B"/>` +
    `<circle cx="760" cy="310" r="64" fill="#FFF3D6" stroke="#4A3A40" stroke-width="3"/><path d="M724 330 q36 -70 72 0z" fill="#F8D6A8" stroke="#4A3A40" stroke-width="3"/><circle cx="760" cy="290" r="9" fill="#F07D7D"/>`,
  spots: [
    { id: 'shop-wall-1', x: 190, y: 578, s: 1, region: 'wall', prop: jar(190, 532), easy: true },
    { id: 'shop-wall-2', x: 470, y: 578, s: 1, region: 'wall', prop: cakeStand(470, 498), easy: false },
    { id: 'shop-wall-3', x: 790, y: 578, s: 1, region: 'wall', prop: breadBasket(790, 538), easy: true },
    { id: 'shop-counter-1', x: 250, y: 800, s: 1, region: 'counter', prop: stool(250, 728), easy: true },
    { id: 'shop-counter-2', x: 470, y: 800, s: 1, region: 'counter', prop: sack(470, 734), easy: false },
    { id: 'shop-cloth-1', x: 720, y: 960, s: 1, region: 'cloth', prop: sack(720, 896), easy: true },
    { id: 'shop-cloth-2', x: 880, y: 962, s: 1, region: 'cloth', prop: stool(880, 872), easy: false },
    { id: 'shop-floor-1', x: 90, y: 985, s: 0.95, region: 'floor', prop: jar(90, 942, 120, 54), easy: true },
    { id: 'shop-floor-2', x: 560, y: 985, s: 0.95, region: 'floor', prop: breadBasket(560, 948), easy: false },
  ],
};
