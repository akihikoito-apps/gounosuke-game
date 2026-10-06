// Codex など絵の作り手に渡す「下書きガイド」を art-guides/ に書き出す。
// ゲームと同じ形状データから作るので、ガイドどおりに描けば当たり判定・可視判定と一致する。
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { loadGeometry } from './lib/load-geometry.mjs';

const G = await loadGeometry();
mkdirSync('art-guides', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, w, h, path) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.locator('svg').first().screenshot({ path, omitBackground: false });
}

// ---- キャラクター（450×600px ＝ ローカル座標 -90,-225 から 180×240 の 2.5倍）
const F = G.CHAR_FRAME;
for (const id of G.CHARACTER_IDS) {
  const c = G.CHARACTERS[id];
  const pat = G.patternMarkup('gp', { kind: 'plain', bg: '#d6e4ff', fg: '#d6e4ff', size: 40 });
  const sil = c.silhouette.map((s) => G.shapeToSvg(s, 'fill="none" stroke="#e05a00" stroke-width="1.2" stroke-dasharray="4 3"')).join('');
  const body = G.shapeToSvg(G.BODY, 'fill="#5b8def" fill-opacity="0.28" stroke="#2b5fd0" stroke-width="1"');
  const face = c.facePoints.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2.6" fill="#e00000"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="${F.x} ${F.y} ${F.w} ${F.h}">
    <defs>${pat}</defs>
    <rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="#fff"/>
    <g opacity="0.35">${G.characterMarkup(c, { fillId: 'gp', outline: 1 })}</g>
    ${body}${sil}${face}
    <path d="M-6 0 H6 M0 -6 V6" stroke="#000" stroke-width="1"/>
    <text x="${F.x + 3}" y="${F.y + 9}" font-size="7" fill="#333">${id} 450x600 青=服 橙=上限 赤=顔 ＋=足</text>
  </svg>`;
  writeFileSync(`art-guides/character-${id}.svg`, svg);
  await png(svg, 450, 600, `art-guides/character-${id}.png`);
}

// ---- シーン（1000×1000。2000×2000 で描いてもよい）
const colors = ['#5b8def', '#e05a00', '#18a058', '#a040c0', '#c09000'];
for (const sid of G.SCENE_IDS) {
  const sc = G.SCENES[sid];
  const regions = sc.regions
    .map((r, i) => r.shapes.map((s) => G.shapeToSvg(s, `fill="${colors[i % colors.length]}" fill-opacity="0.18" stroke="${colors[i % colors.length]}" stroke-width="3"`)).join('') +
      `<text x="${labelPos(r.shapes[0]).x}" y="${labelPos(r.shapes[0]).y}" font-size="22" fill="${colors[i % colors.length]}">${r.id}（服:${r.costume}）</text>`)
    .join('');
  const props = sc.spots.map((sp) => sp.prop.shapes.map((s) => G.shapeToSvg(s, 'fill="#ff8a00" fill-opacity="0.35" stroke="#ff8a00" stroke-width="2"')).join('')).join('');
  const spots = sc.spots
    .map((sp) => {
      const sil = G.CHARACTER_IDS.map((c) => G.silhouetteWorld(c, sp).map((s) => G.shapeToSvg(s, 'fill="none" stroke="#333" stroke-width="1.5" stroke-dasharray="6 4"')).join('')).join('');
      const t = G.spotTransform(sp);
      const face = G.CHARACTERS.koro.facePoints.map((p) => G.transformPt(t, p)).map((p) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#e00000"/>`).join('');
      const keep = `<ellipse cx="${sp.x}" cy="${sp.y - 142 * sp.s}" rx="${60 * sp.s}" ry="${56 * sp.s}" fill="none" stroke="#e00000" stroke-width="3"/>`;
      return sil + face + keep + `<text x="${sp.x - 60}" y="${sp.y + 26}" font-size="16" fill="#000">${sp.id}</text>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="#fff"/>${regions}${props}${spots}
    <text x="10" y="990" font-size="18" fill="#000">${sid}: 色面=柄の領域（ここはゲームが柄を塗る） 橙=前景の小物(fore) 点線=キャラ 赤円=顔（何も重ねない）</text></svg>`;
  writeFileSync(`art-guides/scene-${sid}.svg`, svg);
  await png(svg, 1000, 1000, `art-guides/scene-${sid}.png`);
  const shot = `screenshots/390x844_04-search-room-easy.png`;
  if (existsSync(shot) && sid === 'room') copyFileSync(shot, 'art-guides/current-room-easy.png');
}
for (const [src, dst] of [
  ['screenshots/390x844_08-search-shop-normal.png', 'current-shop-normal.png'],
  ['screenshots/390x844_11-hide-place-candidates.png', 'current-garden-hide.png'],
  ['screenshots/390x844_01-title.png', 'current-title.png'],
]) if (existsSync(src)) copyFileSync(src, `art-guides/${dst}`);

function labelPos(s) {
  if (s.kind === 'rect') return { x: s.x + 8, y: s.y + 28 };
  if (s.kind === 'ellipse') return { x: s.cx - s.rx + 20, y: s.cy };
  return { x: Math.min(...s.pts.map((p) => p.x)) + 8, y: Math.min(...s.pts.map((p) => p.y)) + 28 };
}
await browser.close();
console.log('art-guides written');
