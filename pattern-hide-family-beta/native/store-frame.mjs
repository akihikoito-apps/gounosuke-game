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
  courses: ['10の コースを', 'じゅんばんに'],
  course5: ['ぼうしや かさで', 'だんだん むずかしく'],
  beach: ['うみべで', 'あたらしい ともだち'],
  stickers: ['みつけて あつめる', 'シールちょう'],
};
const SIZES = { iphone69: [1320, 2868], ipad13: [2064, 2752] };

const b = await chromium.launch();
const files = readdirSync(src).filter((f) => f.endsWith('.png'));
for (const f of files) {
  const [dev, , key] = f.replace('.png', '').split('-');
  const [W, H] = SIZES[dev];
  const cap = CAPTIONS[key];
  if (!cap) continue;
  const img = 'data:image/png;base64,' + readFileSync(join(src, f)).toString('base64');
  const phone = dev === 'iphone69';
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
