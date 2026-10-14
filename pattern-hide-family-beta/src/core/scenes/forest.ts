// きのこの もり（背景パック2）：しまのテント、水玉のジャンボきのこ、葉もようのしげみ、森の地面
import type { SceneDef, CostumeDef } from '../scene';
import {
  acornBasket,
  berryClump,
  campfire,
  hollowLog,
  lantern,
  logTable,
  miniMushrooms,
  mossRocks,
  rucksack,
} from '../props-forest';

const costumes: CostumeDef[] = [
  { id: 'plain', kind: 'plain', spec: { kind: 'plain', bg: '#EBD9B4', fg: '#EBD9B4', size: 40 } },
  { id: 'stripes', kind: 'stripes', spec: { kind: 'stripes', bg: '#FFF7E4', fg: '#E5B869', size: 40 } },
  { id: 'dots', kind: 'dots', spec: { kind: 'dots', bg: '#E68A82', fg: '#FFF6EE', size: 44 } },
  { id: 'leaf', kind: 'leaf', spec: { kind: 'leaf', bg: '#72B574', fg: '#488E52', size: 48 } },
];

export const forest: SceneDef = {
  id: 'forest',
  name: 'きのこの もり',
  costumes,
  base:
    // 木漏れ日の空と遠景の森
    `<rect x="0" y="0" width="1000" height="470" fill="#DCEEF2"/>` +
    `<rect x="0" y="310" width="1000" height="160" fill="#B8D8BA"/>` +
    `<rect x="420" y="180" width="28" height="290" fill="#C9B39B"/>` +
    `<rect x="510" y="200" width="24" height="270" fill="#C9B39B"/>` +
    `<rect x="950" y="190" width="26" height="280" fill="#C9B39B"/>` +
    `<circle cx="434" cy="180" r="64" fill="#B8D8BA"/>` +
    `<circle cx="522" cy="200" r="56" fill="#A8CCA8"/>` +
    `<circle cx="963" cy="190" r="60" fill="#B8D8BA"/>` +
    `<circle cx="870" cy="96" r="48" fill="#FFE282"/>`,
  extraDefs: '',
  regions: [
    { id: 'ground', costume: 'plain', shapes: [{ kind: 'rect', x: 0, y: 460, w: 1000, h: 540 }] },
    { id: 'tent', costume: 'stripes', shapes: [{ kind: 'rect', x: 30, y: 250, w: 330, h: 404, rx: 8 }] },
    { id: 'mushroom', costume: 'dots', shapes: [{ kind: 'rect', x: 580, y: 410, w: 390, h: 244, rx: 40 }] },
    { id: 'bush', costume: 'leaf', shapes: [{ kind: 'rect', x: 370, y: 760, w: 560, h: 212, rx: 48 }] },
  ],
  decor:
    // テントの屋根と木製土台
    `<path d="M14 262 L195 174 L376 262 Z" fill="#D98A6C" stroke="#4A3A40" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="24" y="650" width="342" height="12" rx="4" fill="#B88B58"/>` +
    // ジャンボきのこの軸の根元と傘の下縁ライン
    `<g fill="#F5E8D0" stroke="#4A3A40" stroke-width="3"><rect x="648" y="648" width="64" height="18" rx="6"/><rect x="833" y="648" width="64" height="18" rx="6"/></g>` +
    `<path d="M590 652 H960" stroke="#FFF6EE" stroke-width="6" stroke-linecap="round"/>` +
    // 森の飛び石
    `<ellipse cx="460" cy="690" rx="38" ry="15" fill="#D8B88C"/>` +
    `<ellipse cx="530" cy="725" rx="38" ry="15" fill="#D8B88C"/>`,
  minorDecor:
    // 雲と森の小鳥
    `<g fill="#FFFFFF" opacity="0.9"><ellipse cx="210" cy="105" rx="68" ry="25"/><ellipse cx="258" cy="88" rx="46" ry="26"/><ellipse cx="600" cy="140" rx="56" ry="22"/></g>` +
    `<path d="M430 190 q12 -12 24 0 q12 -12 24 0" stroke="#4A3A40" stroke-width="4" fill="none"/>`,
  spots: [
    { id: 'forest-tent-1', x: 112, y: 652, s: 1, region: 'tent', prop: lantern(112, 590, 118, 72), easy: true },
    { id: 'forest-tent-2', x: 276, y: 652, s: 1, region: 'tent', prop: logTable(276, 592, 134, 70), easy: false },
    { id: 'forest-mush-1', x: 680, y: 652, s: 1, region: 'mushroom', prop: acornBasket(680, 594, 136, 68), easy: true },
    { id: 'forest-mush-2', x: 865, y: 652, s: 1, region: 'mushroom', prop: miniMushrooms(865, 594, 136, 68), easy: false },
    { id: 'forest-bush-1', x: 476, y: 884, s: 1, region: 'bush', prop: berryClump(476, 864, 76, 40), easy: true },
    { id: 'forest-bush-2', x: 650, y: 948, s: 1, region: 'bush', prop: mossRocks(650, 924), easy: false },
    { id: 'forest-bush-3', x: 830, y: 884, s: 1, region: 'bush', prop: hollowLog(830, 826, 138, 68), easy: true },
    { id: 'forest-ground-1', x: 135, y: 896, s: 1, region: 'ground', prop: campfire(135, 838, 134, 70), easy: true },
    { id: 'forest-ground-2', x: 300, y: 956, s: 0.95, region: 'ground', prop: rucksack(300, 900, 126, 68), easy: false },
  ],
};
