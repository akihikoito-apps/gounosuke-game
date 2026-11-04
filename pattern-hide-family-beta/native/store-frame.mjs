// store-shots.mjs で撮った画面写真に、上に短い見出しを付けて App Store 用に仕上げる。
// 大きさは元と同じ（iPhone 1320×2868・iPad 2064×2752）。出力は store-shots/framed/
// 使い方（native フォルダで）: node store-shots.mjs && node store-frame.mjs
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const src = join(here, 'store-shots');
const out = join(src, 'framed');
mkdirSync(out, { recursive: true });

// 画面写真の名前（末尾）→ 見出し。子どもと親の両方が読めるよう、ひらがな中心で短く
const CAPTIONS = {
  title: ['もように まぎれて', 'かくれんぼ'],
  courses: ['つぎの ごほうびが', 'みえるから がんばれる'],
  course5: ['ぼうしや うごく どうぶつで', 'だんだん むずかしく'],
  myroom: ['なかまと かぐで', 'じぶんの へや'],
  stickers: ['みつけて あつめる', 'シールちょう'],
  dino: ['追加パック', 'きょうりゅうの たに'],
};
const SIZES = { iphone63: [1206, 2622], iphone69: [1320, 2868], ipad13: [2064, 2752] };

const b = await chromium.launch();
// 画面写真（iphone69-1-title.png など）だけ。審査用の iap-review.png などは飛ばす
const files = readdirSync(src).filter((f) => /^(iphone63|iphone69|ipad13)-\d+-\w+\.png$/.test(f));
for (const f of files) {
  const [dev, , key] = f.replace('.png', '').split('-');
  const [W, H] = SIZES[dev];
  const cap = CAPTIONS[key];
  if (!cap) continue;
  const img = 'data:image/png;base64,' + readFileSync(join(src, f)).toString('base64');
  const phone = dev.startsWith('iphone');
  const capH = Math.round(H * (phone ? 0.2 : 0.17));
  const shotH = H - capH - Math.round(H * 0.04);
  const shotW = Math.round((shotH * W) / H);
  const fs = Math.round(W * (phone ? 0.082 : 0.058));
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
    body{background:repeating-linear-gradient(90deg,#fff6e8 0 ${W / 30}px,#fdebd6 ${W / 30}px ${W / 15}px);
      font-family:'Hiragino Maru Gothic ProN','Yu Gothic UI','Yu Gothic','Meiryo',sans-serif;color:#4a3a40;
      display:flex;flex-direction:column;align-items:center}
    .cap{height:${capH}px;display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:800;
      font-size:${fs}px;line-height:1.28;letter-spacing:0.04em;text-align:center}
    .cap span:last-child{background:linear-gradient(transparent 62%,#ffd66b 62% 92%,transparent 92%);padding:0 0.2em}
    .shot{width:${shotW}px;height:${shotH}px;border-radius:${Math.round(W * 0.05)}px;overflow:hidden;
      border:${Math.round(W * 0.008)}px solid #4a3a40;box-shadow:0 ${Math.round(W * 0.012)}px 0 rgba(74,58,64,.25);box-sizing:border-box}
    .shot img{width:100%;height:100%;display:block}
  </style><div class="cap"><span>${cap[0]}</span><span>${cap[1]}</span></div><div class="shot"><img src="${img}"></div>`;
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.setContent(html);
  await p.waitForTimeout(200);
  await p.screenshot({ path: join(out, f) });
  await p.close();
}
await b.close();
console.log(`見出し付きの画面写真を ${out} に書き出しました`);
