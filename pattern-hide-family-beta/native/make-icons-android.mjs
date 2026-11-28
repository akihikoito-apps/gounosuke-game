// art/app/icon.svg・splash.svg から、Android のアイコン（従来型・丸型・アダプティブの前景）と起動画面の PNG を作る。
// アダプティブアイコンは 108dp 四方のうち、まん中の 72dp だけが見える（端末ごとに丸・角丸などで切り抜かれる）。
// そこで絵をまん中に置き、まわりは絵の地の色（水玉の青）で埋める。
// 使い方（native フォルダで）: node make-icons-android.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const art = resolve(here, '../art/app');
const res = resolve(here, 'android/app/src/main/res');
const BG = '#7EA6DA'; // icon.svg の水玉の地の色
const SPLASH_BG = '#FFF6E8';

const browser = await chromium.launch();
const page = await browser.newPage();
const svgData = (f) => 'data:image/svg+xml;base64,' + readFileSync(resolve(art, f)).toString('base64');

/** mode: square＝そのまま／round＝丸く切る／fg＝アダプティブの前景（まん中 76/108 に絵）／cover＝縦横比を保って全面に */
async function render(svg, w, h, mode, bg) {
  const b64 = await page.evaluate(
    async ({ svg, w, h, mode, bg }) => {
      const img = new Image();
      img.src = svg;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d');
      if (mode === 'round') {
        x.beginPath();
        x.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
        x.clip();
      }
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);
      if (mode === 'fg') {
        const s = (w * 76) / 108;
        x.drawImage(img, (w - s) / 2, (h - s) / 2, s, s);
      } else if (mode === 'cover') {
        const s = Math.max(w / img.width, h / img.height);
        x.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      } else {
        x.drawImage(img, 0, 0, w, h);
      }
      return c.toDataURL('image/png').split(',')[1];
    },
    { svg, w, h, mode, bg },
  );
  return Buffer.from(b64, 'base64');
}

const icon = svgData('icon.svg');
const splash = svgData('splash.svg');
const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENSITY)) {
  writeFileSync(resolve(res, `mipmap-${d}/ic_launcher.png`), await render(icon, 48 * k, 48 * k, 'square', BG));
  writeFileSync(resolve(res, `mipmap-${d}/ic_launcher_round.png`), await render(icon, 48 * k, 48 * k, 'round', BG));
  writeFileSync(resolve(res, `mipmap-${d}/ic_launcher_foreground.png`), await render(icon, 108 * k, 108 * k, 'fg', BG));
  const [pw, ph] = [320 * k, 480 * k].map(Math.round);
  const port = d === 'hdpi' ? [480, 800] : d === 'xhdpi' ? [720, 1280] : d === 'xxhdpi' ? [960, 1600] : d === 'xxxhdpi' ? [1280, 1920] : [pw, ph];
  writeFileSync(resolve(res, `drawable-port-${d}/splash.png`), await render(splash, port[0], port[1], 'cover', SPLASH_BG));
  writeFileSync(resolve(res, `drawable-land-${d}/splash.png`), await render(splash, port[1], port[0], 'cover', SPLASH_BG));
}
writeFileSync(resolve(res, 'drawable/splash.png'), await render(splash, 480, 320, 'cover', SPLASH_BG));
// アダプティブアイコンの背景（前景の外側と同じ色）
writeFileSync(
  resolve(res, 'values/ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`,
);
await browser.close();
// Play ストアの掲載用アイコン（512×512・32bit PNG）
writeFileSync(resolve(here, 'store-shots/play-icon-512.png'), await (async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const out = await p.evaluate(async (svg) => {
    const img = new Image();
    img.src = svg;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    c.getContext('2d').drawImage(img, 0, 0, 512, 512);
    return c.toDataURL('image/png').split(',')[1];
  }, icon);
  await b.close();
  return Buffer.from(out, 'base64');
})());
console.log('Android のアイコンと起動画面を書き出しました');
