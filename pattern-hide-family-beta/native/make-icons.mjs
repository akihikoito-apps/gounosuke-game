// art/app/icon.svg・splash.svg から、iOS のアイコン（1024）と起動画面（2732）の PNG を作る。
// App Store のアイコンは透明（アルファ）の情報を含められないので、RGB だけの PNG を自分で書き出す。
// 使い方（native フォルダで）: node make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const art = resolve(here, '../art/app');
const assets = resolve(here, 'ios/App/App/Assets.xcassets');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
/** RGB（アルファなし）の PNG */
function pngRGB(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const browser = await chromium.launch();
const page = await browser.newPage();
async function render(svgFile, size, bg) {
  const svg = readFileSync(svgFile, 'utf8');
  const data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const b64 = await page.evaluate(
    async ({ data, size, bg }) => {
      const img = new Image();
      img.src = data;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const x = c.getContext('2d');
      x.fillStyle = bg; // 透明な部分が残らないよう、先に地の色で塗る
      x.fillRect(0, 0, size, size);
      x.drawImage(img, 0, 0, size, size);
      const d = x.getImageData(0, 0, size, size).data;
      const rgb = new Uint8Array(size * size * 3);
      for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
        rgb[j] = d[i];
        rgb[j + 1] = d[i + 1];
        rgb[j + 2] = d[i + 2];
      }
      let s = '';
      for (let i = 0; i < rgb.length; i += 0x8000) s += String.fromCharCode.apply(null, rgb.subarray(i, i + 0x8000));
      return btoa(s);
    },
    { data, size, bg },
  );
  return pngRGB(size, size, Buffer.from(b64, 'base64'));
}

const icon = await render(resolve(art, 'icon.svg'), 1024, '#FFF6E8');
writeFileSync(resolve(assets, 'AppIcon.appiconset/AppIcon-512@2x.png'), icon);
const splash = await render(resolve(art, 'splash.svg'), 2732, '#FFF6E8');
for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) writeFileSync(resolve(assets, 'Splash.imageset', n), splash);
await browser.close();
console.log(`アイコン ${(icon.length / 1024).toFixed(0)}KB・起動画面 ${(splash.length / 1024).toFixed(0)}KB を書き出しました（RGB・アルファなし）`);
