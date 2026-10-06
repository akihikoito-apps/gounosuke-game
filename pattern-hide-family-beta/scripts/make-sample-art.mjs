// 差し替えの仕組みの確認用：今のコードの絵を、art/ と同じ構成の層別 PNG に書き出す。
// 使い方：node scripts/make-sample-art.mjs <出力先> [--broken]
//   --broken を付けると、検査で不合格になるべき絵（顔を隠す小物）を混ぜる。
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadGeometry } from './lib/load-geometry.mjs';

const out = process.argv[2];
const broken = process.argv.includes('--broken');
if (!out) throw new Error('出力先を指定してください');
const G = await loadGeometry();
const F = G.CHAR_FRAME;
const browser = await chromium.launch();
const page = await browser.newPage();
async function shot(svg, w, h, path) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator('svg').first().screenshot({ path, omitBackground: true });
}
const frame = (inner, w = 450, h = 600) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${F.x} ${F.y} ${F.w} ${F.h}">${inner}</svg>`;
for (const id of G.CHARACTER_IDS) {
  const d = join(out, 'characters', id);
  mkdirSync(d, { recursive: true });
  const c = G.CHARACTERS[id];
  const html = (found) => {
    const div = `<svg>${G.characterMarkup(c, { fillId: 'x', outline: 1, found })}</svg>`;
    return div;
  };
  // 既定の絵を層に分ける：char-body の足 → back、服 → mask/line、手・頭 → front
  const full = (found) => G.characterMarkup(c, { fillId: 'x', outline: 1, found });
  const feet = '<ellipse cx="-24" cy="2" rx="17" ry="8" fill="#6B5B60"/><ellipse cx="24" cy="2" rx="17" ry="8" fill="#6B5B60"/>';
  await shot(frame(feet), 450, 600, join(d, 'back.png'));
  await shot(frame(`<rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="#000"/>${G.shapeToSvg(G.BODY, 'fill="#fff"')}`), 450, 600, join(d, 'clothes-mask.png'));
  await shot(frame(G.shapeToSvg(G.BODY, 'fill="none" stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"') + '<path d="M-22 -98 Q0 -84 22 -98" fill="none" stroke="#4A3A40" stroke-width="3"/>'), 450, 600, join(d, 'clothes-line.png'));
  for (const [name, found] of [['front', false], ['front-found', true]]) {
    // 服と足を消した残り（手・頭）
    const m = full(found).replace(/<ellipse cx="-24"[^>]*\/><ellipse cx="24"[^>]*\/>/, '').replace(/<polygon[^>]*class="clothes"[^>]*\/>/, '').replace(/<path d="M-22 -98[^>]*\/>/, '');
    await shot(frame(m), 450, 600, join(d, `${name}.png`));
  }
  void html;
}
for (const sid of G.SCENE_IDS) {
  const sc = G.SCENES[sid];
  const d = join(out, 'scenes', sid);
  mkdirSync(d, { recursive: true });
  const P = 's-';
  const defs = sc.extraDefs.split('{P}').join(P);
  const sub = (s) => s.split('{P}').join(P);
  const S = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><defs>${defs}</defs>${inner}</svg>`;
  await shot(S(`<rect width="1000" height="1000" fill="#fff6e8"/>${sub(sc.base)}`), 1000, 1000, join(d, 'back.png'));
  await shot(S(sub(sc.decor)), 1000, 1000, join(d, 'over.png'));
  await shot(S(sub(sc.minorDecor)), 1000, 1000, join(d, 'minor.png'));
  let fore = sc.spots.map((s) => s.prop.markup).join('');
  if (broken && sid === 'room') fore += '<circle cx="120" cy="500" r="60" fill="#e00"/>'; // 顔を隠す（不合格になるべき）
  await shot(S(fore), 1000, 1000, join(d, 'fore.png'));
}
mkdirSync(join(out, 'patterns'), { recursive: true });
const st = G.SCENES.room.costumes.find((c) => c.id === 'stripes').spec;
await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="152" height="152" viewBox="0 0 ${st.size} ${st.size}">${G.patternMarkup('t', st).replace(/^<pattern[^>]*>/, '').replace('</pattern>', '')}</svg>`, 152, 152, join(out, 'patterns', 'room-stripes.png'));
await browser.close();
console.log('sample art written to', out);
