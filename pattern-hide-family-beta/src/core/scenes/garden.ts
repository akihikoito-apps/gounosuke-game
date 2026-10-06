// にわ：葉もようの生け垣、しまの柵、水玉の花だん
import type { SceneDef, CostumeDef } from '../scene';
import { bucket, crate, flowerClump, pot, stones, stump, wateringCan } from '../props';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#9DD481', fg: '#9DD481', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#FFF7E8', fg: '#E9D2AE', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#79BE68', fg: '#F7A8C4', size: 42 } },
  { id: 'leaf', kind: 'leaf', spec: { kind: 'leaf', bg: '#67B067', fg: '#3F8E4C', size: 48 } },
];

const hedgeTop = (() => {
  const pts = [{ x: 0, y: 660 }];
  for (let x = 0; x <= 570; x += 57) pts.push({ x, y: x % 114 === 0 ? 300 : 278 });
  pts.push({ x: 570, y: 660 });
  return pts;
})();

const fence = (() => {
  const pts = [{ x: 570, y: 660 }];
  for (let x = 570; x < 1000; x += 40) {
    pts.push({ x, y: 380 }, { x: x + 20, y: 356 });
  }
  pts.push({ x: 1000, y: 380 }, { x: 1000, y: 660 });
  return pts;
})();

export const garden: SceneDef = {
  id: 'garden',
  name: 'にわ',
  costumes,
  base:
    `<rect x="0" y="0" width="1000" height="660" fill="#CDEBFA"/>` +
    `<circle cx="860" cy="120" r="56" fill="#FFE07A"/>`,
  extraDefs: '',
  regions: [
    { id: 'lawn', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 650, w: 1000, h: 350 }] },
    { id: 'hedge', costume: 'leaf', shapes: [{ kind: 'poly', pts: hedgeTop }] },
    { id: 'fence', costume: 'stripes', shapes: [{ kind: 'poly', pts: fence }] },
    { id: 'flowers', costume: 'dots', shapes: [{ kind: 'rect', x: 40, y: 770, w: 470, h: 176, rx: 60 }] },
  ],
  decor:
    `<path d="M570 400 H1000 M570 600 H1000" stroke="#D9BE94" stroke-width="10"/>` +
    // 飛び石
    `<ellipse cx="640" cy="760" rx="44" ry="18" fill="#D9D3E2"/><ellipse cx="720" cy="820" rx="44" ry="18" fill="#D9D3E2"/><ellipse cx="650" cy="980" rx="44" ry="18" fill="#D9D3E2"/>`,
  minorDecor:
    `<g fill="#FFFFFF" opacity="0.9"><ellipse cx="200" cy="120" rx="70" ry="28"/><ellipse cx="250" cy="100" rx="50" ry="30"/><ellipse cx="560" cy="170" rx="60" ry="24"/></g>` +
    `<path d="M380 180 q12 -12 24 0 q12 -12 24 0" stroke="#4A3A40" stroke-width="4" fill="none"/>`,
  spots: [
    { id: 'garden-hedge-1', x: 110, y: 662, s: 1, region: 'hedge', prop: bucket(110, 600), easy: true },
    { id: 'garden-hedge-2', x: 290, y: 662, s: 1, region: 'hedge', prop: stones(290, 638), easy: false },
    { id: 'garden-hedge-3', x: 470, y: 662, s: 1, region: 'hedge', prop: pot(470, 598, 116, 70, '#C77E4E'), easy: true },
    { id: 'garden-fence-1', x: 670, y: 662, s: 1, region: 'fence', prop: crate(670, 598), easy: true },
    { id: 'garden-fence-2', x: 870, y: 662, s: 1, region: 'fence', prop: wateringCan(856, 598), easy: false },
    { id: 'garden-flowers-1', x: 150, y: 900, s: 1, region: 'flowers', prop: flowerClump(150, 884), easy: true },
    { id: 'garden-flowers-2', x: 390, y: 900, s: 1, region: 'flowers', prop: flowerClump(390, 888, 74, 38), easy: false },
    { id: 'garden-lawn-1', x: 640, y: 905, s: 1, region: 'lawn', prop: stump(640, 842), easy: true },
    { id: 'garden-lawn-2', x: 870, y: 870, s: 1, region: 'lawn', prop: bucket(870, 808, 124, 78), easy: false },
  ],
};
