// シーンのSVGを組み立てる。形状・座標は core の定義をそのまま使う。
import { CHARACTERS, type CharacterId } from '../core/characters';
import { r1, shapeToSvg } from '../core/geometry';
import { type PatternSpec, patternMarkup, softVariant } from '../core/patterns';
import { type Placement, getSpot, silhouetteWorld, spotAnchor, spotTransform } from '../core/placement';
import type { SceneDef, SpotDef } from '../core/scene';
import { charArtMarkup } from './charArt';
import { accessoryArt } from './accessoryArt';
import { patternTile, sceneArt } from '../art/registry';
import type { HintInfo } from '../core/session';

export interface SceneRenderOpts {
  prefix: string;
  placements?: Placement[];
  found?: boolean[];
  /** 服のふちの濃さ（難易度で変える。0にはしない） */
  outline?: number;
  /** 編集中だけ：置ける候補 */
  candidates?: SpotDef[];
  selectedChar?: CharacterId | null;
  hint?: HintInfo | null;
  compact?: boolean;
  title?: string;
}

export function scenePatternId(prefix: string, scene: SceneDef, costume: string): string {
  return `${prefix}p-${scene.id}-${costume}`;
}

/** 柄の定義。art/patterns に絵のタイルがあればそれを使う（背景と服で同じタイル） */
export function tiledPatternMarkup(id: string, scene: SceneDef, costumeId: string, spec: PatternSpec, transform = ''): string {
  const tile = patternTile(scene.id, costumeId);
  if (!tile) return patternMarkup(id, spec, transform);
  const s = spec.size;
  const tf = transform ? ` patternTransform="${transform}"` : '';
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${r1(s)}" height="${r1(s)}"${tf}><image href="${tile}" width="${r1(s)}" height="${r1(s)}" preserveAspectRatio="none"/></pattern>`;
}

export function scenePatternDefs(prefix: string, scene: SceneDef): string {
  return scene.costumes.map((c) => tiledPatternMarkup(scenePatternId(prefix, scene, c.id), scene, c.id, c.spec)).join('') + scene.extraDefs.split('{P}').join(prefix);
}

/** 服の柄。背景と同じ座標系にそろえる patternTransform を付ける。 */
export function costumePatternDef(id: string, scene: SceneDef, pl: Placement, spot: SpotDef): string {
  const costume = scene.costumes.find((c) => c.id === pl.costume);
  if (!costume) throw new Error(`unknown costume ${pl.costume}`);
  const t = spotTransform(spot);
  const tf = `scale(${r1(1 / t.s)}) translate(${r1(-t.tx)} ${r1(-t.ty)})`;
  if (pl.variant === 'soft') {
    // やさしい：大きさと色が少し違う柄（絵のタイルの場合は大きさだけ変え、少し暗くする）
    const soft = softVariant(costume.spec);
    if (patternTile(scene.id, costume.id)) {
      return tiledPatternMarkup(id, scene, costume.id, soft, tf).replace('<image ', '<image style="filter:brightness(0.86) saturate(1.15)" ');
    }
    return patternMarkup(id, soft, tf);
  }
  return tiledPatternMarkup(id, scene, costume.id, costume.spec, tf);
}

const full = (href: string, cls = '') => `<image${cls ? ` class="${cls}"` : ''} href="${href}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="none"/>`;

function backgroundMarkup(prefix: string, scene: SceneDef): string {
  const sub = (s: string) => s.split('{P}').join(prefix);
  const art = sceneArt(scene.id);
  const regions = scene.regions
    .map((r) => r.shapes.map((sh) => shapeToSvg(sh, `fill="url(#${scenePatternId(prefix, scene, r.costume)})"`)).join(''))
    .join('');
  return (
    (art?.back ? full(art.back) : sub(scene.base)) +
    regions +
    (art?.over ? full(art.over) : sub(scene.decor)) +
    `<g class="minor">${art?.minor ? full(art.minor) : art?.over ? '' : sub(scene.minorDecor)}</g>`
  );
}

export function charGroup(prefix: string, scene: SceneDef, pl: Placement, i: number, found: boolean, outline: number): string {
  const spot = getSpot(scene, pl.spot);
  const t = spotTransform(spot);
  const fid = `${prefix}c${i}`;
  const acc = accessoryArt(scene, pl, fid, outline);
  return (
    `<g class="char${found ? ' found' : ''}" data-index="${i}" data-char="${pl.char}" transform="translate(${r1(t.tx)} ${r1(t.ty)}) scale(${t.s})">` +
    `<defs>${costumePatternDef(fid, scene, pl, spot)}</defs>` +
    acc.behind +
    `<g class="char-inner">${charArtMarkup(CHARACTERS[pl.char], { fillId: fid, outline, found })}${acc.front}</g>` +
    `</g>`
  );
}

function sparkles(scene: SceneDef, pl: Placement): string {
  const a = spotAnchor(getSpot(scene, pl.spot));
  return [
    [-80, -110],
    [86, -96],
    [-60, -170],
    [70, -168],
  ]
    .map(
      ([dx, dy], k) =>
        `<path class="sparkle" style="animation-delay:${k * 80}ms" transform="translate(${r1(a.x + dx)} ${r1(a.y + dy)})" d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4Z" fill="#FFD45C" stroke="#fff" stroke-width="2"/>`,
    )
    .join('');
}

export function hintMarkup(scene: SceneDef, placements: Placement[], hint: HintInfo | null | undefined): string {
  if (!hint) return '';
  const { cx, cy, r } = hint.area;
  let out = `<circle class="hint-area" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-width="10" stroke-dasharray="4 18" stroke-linecap="round"/>`;
  if (hint.level >= 3) {
    const pl = placements[hint.index];
    const shapes = silhouetteWorld(pl.char, getSpot(scene, pl.spot));
    out += `<g class="hint-outline">${shapes.map((s) => shapeToSvg(s, 'fill="none" stroke="#FFD45C" stroke-width="7" stroke-dasharray="14 10" stroke-linecap="round"')).join('')}</g>`;
  }
  return out;
}

export function renderScene(scene: SceneDef, o: SceneRenderOpts): string {
  const P = o.prefix;
  const placements = o.placements ?? [];
  const found = o.found ?? placements.map(() => false);
  const outline = o.outline ?? 0.6;
  const chars = placements.map((pl, i) => charGroup(P, scene, pl, i, !!found[i], outline)).join('');
  const fore = sceneArt(scene.id)?.fore;
  const props = fore ? full(fore, 'fore') : scene.spots.map((s) => `<g class="prop" data-spot="${s.id}">${s.prop.markup}</g>`).join('');
  const fx = placements.map((pl, i) => (found[i] ? sparkles(scene, pl) : '')).join('');
  const cand = (o.candidates ?? [])
    .map((s) => {
      const a = spotAnchor(s);
      return `<g class="candidate" data-spot="${s.id}" tabindex="0" role="button" aria-label="ここに かくす"><circle cx="${r1(a.x)}" cy="${r1(a.y)}" r="70" fill="#FFFFFF" fill-opacity="0.35" stroke="#FFFFFF" stroke-width="7" stroke-dasharray="10 10"/><circle cx="${r1(a.x)}" cy="${r1(a.y)}" r="14" fill="#FFFFFF"/></g>`;
    })
    .join('');
  let sel = '';
  if (o.selectedChar) {
    const i = placements.findIndex((p) => p.char === o.selectedChar);
    if (i >= 0) {
      const a = spotAnchor(getSpot(scene, placements[i].spot));
      sel = `<ellipse class="selected-ring" cx="${r1(a.x)}" cy="${r1(a.y - 20)}" rx="96" ry="128" fill="none" stroke="#FFD45C" stroke-width="8"/>`;
    }
  }
  return (
    `<svg class="scene-svg${o.compact ? ' compact' : ''}" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${o.title ?? scene.name}">` +
    `<defs>${scenePatternDefs(P, scene)}</defs>` +
    `<g class="bg">${backgroundMarkup(P, scene)}</g>` +
    `<g class="chars">${chars}</g>` +
    `<g class="props">${props}</g>` +
    `<g class="fx">${fx}</g>` +
    `<g class="edit-layer">${cand}${sel}</g>` +
    `<g class="hint-layer">${hintMarkup(scene, placements, o.hint)}</g>` +
    `</svg>`
  );
}

/** シーン選択用の小さい絵（キャラクターなし） */
export function sceneThumb(scene: SceneDef): string {
  return renderScene(scene, { prefix: `t-${scene.id}-`, compact: true });
}
