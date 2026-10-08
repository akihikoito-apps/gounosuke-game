// ニット帽と傘の絵（コードで描く）。形は core/accessories と同じ点列を使う。
// 色つきは毛糸・布の質感、camo は背景と同じ座標の柄に、うっすら編み目・骨だけを重ねる。
import {
  type Accessories,
  HAT_COLORS,
  HAT_POLY,
  HAT_POMPOM,
  UMBRELLA_CANOPY,
  UMBRELLA_SHAFT,
  accessoryFits,
} from '../core/accessories';
import { type Pt, r1 } from '../core/geometry';
import { type Placement, getSpot } from '../core/placement';
import type { SceneDef } from '../core/scene';
import { costumePatternDef } from './sceneView';

const LINE = '#4A3A40';
const path = (pts: Pt[]) => 'M' + pts.map((p) => `${r1(p.x)} ${r1(p.y)}`).join(' L') + 'Z';

function knitDef(id: string, bg: string, fg: string): string {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="9" height="8"><rect width="9" height="8" fill="${bg}"/><path d="M0.8 0.8 L4.5 6.6 L8.2 0.8" fill="none" stroke="${fg}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></pattern>`;
}

function stitchOverlayDef(id: string): string {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="9" height="8"><path d="M0.8 0.8 L4.5 6.6 L8.2 0.8" fill="none" stroke="${LINE}" stroke-opacity="0.13" stroke-width="1.3" stroke-linecap="round"/></pattern>`;
}

/** 左上から光が当たる立体感（どの色の上にも重ねられる） */
function shadeDef(id: string, camo = false): string {
  // 背景の柄のときは陰影を弱くする（灰色に浮いて見えないように）
  const hi = camo ? 0.2 : 0.38;
  const lo = camo ? 0.07 : 0.22;
  return `<radialGradient id="${id}" cx="0.3" cy="0.22" r="0.95"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${hi}"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#4A3A40" stop-opacity="${lo}"/></radialGradient>`;
}

function camoFill(scene: SceneDef, pl: Placement, kind: 'hat' | 'umbrella', id: string): string | null {
  const spot = getSpot(scene, pl.spot);
  const fit = accessoryFits(scene, spot, pl.char, kind, 'camo');
  if (!fit.region) return null;
  const costume = scene.regions.find((r) => r.id === fit.region)?.costume;
  if (!costume) return null;
  return costumePatternDef(id, scene, { ...pl, costume }, spot);
}

export interface AccArt {
  /** キャラクターより後ろ（傘） */
  behind: string;
  /** キャラクターより前（帽子） */
  front: string;
}

/** ローカル座標の帽子・傘。id は prefix から作る（同じ画面で重ならない） */
export function accessoryArt(scene: SceneDef, pl: Placement, prefix: string, outline: number): AccArt {
  const acc: Accessories | undefined = pl.acc;
  if (!acc) return { behind: '', front: '' };
  const tone = HAT_COLORS[(acc.tone ?? 0) % HAT_COLORS.length];
  let behind = '';
  let front = '';
  // camo のふち線は服と同じ濃さ（溶け込ませる）。色つきははっきり
  const camoLine = Math.max(0.25, outline);

  if (acc.umbrella) {
    const fid = `${prefix}-umb`;
    const sid = `${prefix}-umbs`;
    const camo = acc.umbrella === 'camo' ? camoFill(scene, pl, 'umbrella', fid) : null;
    const defs = (camo ?? `<pattern id="${fid}" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="${tone[0]}"/></pattern>`) + shadeDef(sid, !!camo);
    const lo = camo ? camoLine : 1;
    const apex = { x: -6, y: -322 };
    const ribs = [-67, -6, 55]
      .map((x) => `<path d="M${apex.x} ${apex.y} Q${r1((apex.x + x) / 2 + (x - apex.x) * 0.18)} -280 ${x} -232" fill="none" stroke="${LINE}" stroke-opacity="${r1(lo * 0.45)}" stroke-width="2.2" stroke-linecap="round"/>`)
      .join('');
    behind =
      `<g class="acc acc-umbrella"><defs>${defs}</defs>` +
      // 柄（手の中へ）
      `<path d="M${UMBRELLA_SHAFT.x} ${UMBRELLA_SHAFT.y0} V${UMBRELLA_SHAFT.y1}" stroke="${LINE}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M${UMBRELLA_SHAFT.x} ${UMBRELLA_SHAFT.y0} V${UMBRELLA_SHAFT.y1}" stroke="#B58C69" stroke-width="3.4" stroke-linecap="round"/>` +
      `<path d="${path(UMBRELLA_CANOPY)}" fill="url(#${fid})"/>` +
      `<path d="${path(UMBRELLA_CANOPY)}" fill="url(#${sid})"/>` +
      ribs +
      `<path d="${path(UMBRELLA_CANOPY)}" fill="none" stroke="${LINE}" stroke-opacity="${r1(lo)}" stroke-width="3.6" stroke-linejoin="round"/>` +
      `<circle cx="${apex.x}" cy="${apex.y - 5}" r="5" fill="#B58C69" stroke="${LINE}" stroke-opacity="${r1(lo)}" stroke-width="2.4"/>` +
      `</g>`;
  }

  if (acc.hat) {
    const fid = `${prefix}-hat`;
    const sid = `${prefix}-hats`;
    const kid = `${prefix}-hatk`;
    const camo = acc.hat === 'camo' ? camoFill(scene, pl, 'hat', fid) : null;
    const defs = (camo ? camo + stitchOverlayDef(kid) : knitDef(fid, tone[0], tone[1])) + shadeDef(sid, !!camo);
    const lo = camo ? camoLine : 1;
    const band = `M-56 -160 Q0 -149 56 -160 L57 -178 Q0 -168 -57 -178Z`;
    const ribs = Array.from({ length: 13 }, (_, k) => {
      const x = -48 + k * 8;
      const y0 = -175 + Math.abs(x) * 0.06 + (1 - (x / 56) ** 2) * 6;
      return `<path d="M${x} ${r1(y0 + 1)} V${r1(y0 + 15)}" stroke="${LINE}" stroke-opacity="${r1(lo * 0.22)}" stroke-width="1.6" stroke-linecap="round"/>`;
    }).join('');
    const { cx, cy, r } = HAT_POMPOM;
    const fluff = Array.from({ length: 10 }, (_, k) => {
      const a = (k / 10) * Math.PI * 2;
      return `<circle cx="${r1(cx + Math.cos(a) * r * 0.82)}" cy="${r1(cy + Math.sin(a) * r * 0.82)}" r="${r1(r * 0.42)}" fill="url(#${fid})"/>`;
    }).join('');
    front =
      `<g class="acc acc-hat"><defs>${defs}</defs>` +
      `<path d="${path(HAT_POLY)}" fill="url(#${fid})"/>` +
      (camo ? `<path d="${path(HAT_POLY)}" fill="url(#${kid})"/>` : '') +
      `<path d="${path(HAT_POLY)}" fill="url(#${sid})"/>` +
      `<path d="${band}" fill="url(#${fid})"/>` +
      ribs +
      `<path d="${band}" fill="url(#${sid})" opacity="0.7"/>` +
      `<path d="${path(HAT_POLY)}" fill="none" stroke="${LINE}" stroke-opacity="${r1(lo)}" stroke-width="3.4" stroke-linejoin="round"/>` +
      `<path d="M-57 -178 Q0 -168 57 -178" fill="none" stroke="${LINE}" stroke-opacity="${r1(lo * 0.6)}" stroke-width="2.4"/>` +
      // ぼんぼり
      `<g>${fluff}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${fid})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${sid})"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="none" stroke="${LINE}" stroke-opacity="${r1(lo * 0.8)}" stroke-width="2.6" stroke-dasharray="5 3"/></g>` +
      `</g>`;
  }
  return { behind, front };
}
