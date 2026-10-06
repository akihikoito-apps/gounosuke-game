// art/ の絵を自動検査する（npm run validate:art）。
// 形式・寸法・安全性に加え、ゲームと同じ形状データで「顔が隠れない」「全面を隠さない」
// 「服の形がからだの判定とずれない」「柄タイルがつなぎ目なく並ぶ」を確かめる。
// 見た目の良し悪し・幼児にとっての難しさは検査しない（人が見る）。
import { chromium } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { loadGeometry } from './lib/load-geometry.mjs';

const dirArg = process.argv.indexOf('--dir');
const ART = dirArg > 0 ? process.argv[dirArg + 1] : 'art';
const G = await loadGeometry();
const F = G.CHAR_FRAME;
const MAX_FILE = 800 * 1024;
const MAX_TOTAL = 8 * 1024 * 1024;
const results = []; // {file, ok, msg}
const ok = (file, msg) => results.push({ file, ok: true, msg });
const ng = (file, msg) => results.push({ file, ok: false, msg });

function list(d) {
  if (!existsSync(d)) return [];
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? list(p) : [p];
  });
}
const files = list(ART).filter((f) => !basename(f).startsWith('.') && !['README.md', 'ART_CHECK.md'].includes(basename(f)));
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

// ---- 形式・安全性
let total = 0;
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const size = statSync(f).size;
  total += size;
  if (!MIME[ext]) {
    ng(f, `使えない形式 ${ext}（png / webp / svg のみ）`);
    continue;
  }
  if (size > MAX_FILE) ng(f, `大きすぎ ${(size / 1024).toFixed(0)}KB > ${MAX_FILE / 1024}KB`);
  if (ext === '.svg') {
    const t = readFileSync(f, 'utf8');
    if (/<script|on[a-z]+\s*=|<foreignObject|javascript:/i.test(t)) ng(f, 'SVG にスクリプト／イベント属性／foreignObject がある');
    if (/(href|src)\s*=\s*["'](?!#|data:image\/)/i.test(t) || /url\(\s*['"]?(?!#)/i.test(t)) ng(f, 'SVG が外部ファイル・URLを参照している（同じファイル内の #id と data:image のみ可）');
    if (/<text|font-family/i.test(t)) ng(f, 'SVG に文字・フォント指定がある（端末で見た目が変わるため、線に変換してください）');
  }
}
if (total > MAX_TOTAL) ng(ART, `合計が大きすぎ ${(total / 1048576).toFixed(1)}MB > 8MB`);

// ---- 画素の読み取り（Chromium の canvas）
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
async function pixels(file, w, h) {
  const data = `data:${MIME[extname(file).toLowerCase()]};base64,${readFileSync(file).toString('base64')}`;
  return page.evaluate(
    async ({ data, w, h }) => {
      const img = new Image();
      img.src = data;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data;
      const a = new Uint8Array(w * h);
      const l = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        a[i] = d[i * 4 + 3];
        l[i] = Math.round((d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) * (d[i * 4 + 3] / 255));
      }
      const b64 = (u) => {
        let s = '';
        for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
        return btoa(s);
      };
      return { nw: img.naturalWidth, nh: img.naturalHeight, a: b64(a), l: b64(l), w, h };
    },
    { data, w, h },
  ).then((r) => ({ ...r, a: Buffer.from(r.a, 'base64'), l: Buffer.from(r.l, 'base64') }));
}
const at = (px, x, y) => {
  const xi = Math.min(px.w - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(px.h - 1, Math.max(0, Math.round(y)));
  return xi + yi * px.w;
};
const near = (px, arr, x, y, r) => {
  let m = 0;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) m = Math.max(m, px[arr][at(px, x + dx, y + dy)]);
  return m;
};

// ---- キャラクター
const CH_SCALE = 2; // 1単位 = 2px で検査
for (const id of G.CHARACTER_IDS) {
  const d = join(ART, 'characters', id);
  if (!existsSync(d)) continue;
  const pick = (n) => ['webp', 'png', 'svg'].map((e) => join(d, `${n}.${e}`)).find(existsSync);
  const mask = pick('clothes-mask');
  const front = pick('front');
  if (!mask || !front) {
    ng(d, 'clothes-mask と front の両方が必要（片方だけだと使われません）');
    continue;
  }
  const W = F.w * CH_SCALE;
  const H = F.h * CH_SCALE;
  const toPx = (p) => ({ x: (p.x - F.x) * CH_SCALE, y: (p.y - F.y) * CH_SCALE });
  const c = G.CHARACTERS[id];
  const grid = [];
  for (let y = F.y + 1; y < F.y + F.h; y += 2) for (let x = F.x + 1; x < F.x + F.w; x += 2) grid.push({ x, y });
  const dist = (shapes, p) => Math.min(...shapes.map((s) => G.distanceTo(s, p)));
  for (const n of ['back', 'clothes-mask', 'clothes-shade', 'clothes-line', 'front', 'front-found']) {
    const f = pick(n);
    if (!f) continue;
    const px = await pixels(f, W, H);
    const ar = px.nw / px.nh;
    if (Math.abs(ar - F.w / F.h) > 0.01 || px.nw < 450) ng(f, `寸法 ${px.nw}×${px.nh}（450×600 か、その整数倍）`);
    if (n === 'clothes-mask') {
      const isCl = (p) => px.l[at(px, toPx(p).x, toPx(p).y)] > 128;
      const cl = grid.filter(isCl);
      const inside = cl.filter((p) => G.distanceTo(G.BODY, p) <= 6).length;
      const bodyPts = G.samplePoints(G.BODY, 2);
      const cover = bodyPts.filter(isCl).length / bodyPts.length;
      const r1 = cl.length ? inside / cl.length : 0;
      (r1 >= 0.95 ? ok : ng)(f, `服の白い部分がからだの判定内 ${(r1 * 100).toFixed(0)}%（95%以上）`);
      (cover >= 0.7 ? ok : ng)(f, `からだの判定を服が覆う割合 ${(cover * 100).toFixed(0)}%（70%以上）`);
    } else {
      const op = grid.filter((p) => px.a[at(px, toPx(p).x, toPx(p).y)] > 128);
      const out = op.filter((p) => dist(c.silhouette, p) > 10).length;
      const lim = n === 'front-found' ? 0.12 : 0.04;
      const r = op.length ? out / op.length : 0;
      (r <= lim ? ok : ng)(f, `輪郭の判定からはみ出す割合 ${(r * 100).toFixed(1)}%（${lim * 100}%以下）`);
      if (n === 'front' || n === 'front-found') {
        const faceOk = c.facePoints.every((p) => near(px, 'a', toPx(p).x, toPx(p).y, 2) > 128);
        (faceOk ? ok : ng)(f, faceOk ? '顔の位置に絵がある' : '顔の位置（目・口）に絵が無い');
      }
    }
  }
}

// ---- シーン
for (const sid of G.SCENE_IDS) {
  const d = join(ART, 'scenes', sid);
  if (!existsSync(d)) continue;
  const sc = G.SCENES[sid];
  const pick = (n) => ['webp', 'png', 'svg'].map((e) => join(d, `${n}.${e}`)).find(existsSync);
  for (const n of ['back', 'over', 'minor', 'fore']) {
    const f = pick(n);
    if (!f) continue;
    const px = await pixels(f, 1000, 1000);
    if (px.nw !== px.nh || px.nw < 1000) ng(f, `寸法 ${px.nw}×${px.nh}（正方形・1000以上）`);
    if (n === 'back') {
      ok(f, '寸法確認のみ');
      continue;
    }
    let bad = 0;
    for (const sp of sc.spots) {
      for (const cid of G.CHARACTER_IDS) {
        const t = G.spotTransform(sp);
        const face = G.CHARACTERS[cid].facePoints.map((p) => G.transformPt(t, p));
        const faceA = Math.max(...face.map((p) => near(px, 'a', p.x, p.y, 4)));
        const body = G.samplePoints(G.transformShape(t, G.BODY), 6);
        if (n === 'fore') {
          const sil = G.silhouetteWorld(cid, sp).flatMap((s) => G.samplePoints(s, 6));
          const vis = sil.filter((p) => px.a[at(px, p.x, p.y)] <= 128).length / sil.length;
          const bvis = body.filter((p) => px.a[at(px, p.x, p.y)] <= 128).length / body.length;
          const probs = [];
          if (faceA > 76) probs.push('顔に重なる');
          if (vis < G.LIMITS.minVisible) probs.push(`見える割合 ${vis.toFixed(2)} < ${G.LIMITS.minVisible}`);
          if (bvis < G.LIMITS.minBodyVisible) probs.push(`服が見える割合 ${bvis.toFixed(2)} < ${G.LIMITS.minBodyVisible}`);
          if (bvis > G.LIMITS.maxBodyVisible) probs.push(`服がまったく隠れていない ${bvis.toFixed(2)}`);
          if (probs.length) {
            bad++;
            ng(f, `${sp.id}/${cid}: ${probs.join('、')}`);
          }
        } else {
          const mean = body.reduce((s, p) => s + px.a[at(px, p.x, p.y)], 0) / body.length / 255;
          const probs = [];
          if (faceA > 76) probs.push('顔の後ろに濃い絵がある（顔の輪郭が読みにくくなる）');
          if (mean > 0.35) probs.push(`服の後ろの濃さ ${mean.toFixed(2)} > 0.35（柄が溶け込まなくなる）`);
          if (probs.length) {
            bad++;
            ng(f, `${sp.id}/${cid}: ${probs.join('、')}`);
          }
        }
      }
    }
    if (!bad) ok(f, `全 ${sc.spots.length} か所 × 3体で問題なし`);
  }
}

// ---- 柄タイル
const pdir = join(ART, 'patterns');
for (const f of list(pdir)) {
  const m = basename(f).match(/^(room|garden|shop)-(plain|stripes|dots|check|leaf)\.(png|webp|svg)$/);
  if (!m) {
    ng(f, 'ファイル名は {room|garden|shop}-{costume}.png の形（例 room-stripes.png）');
    continue;
  }
  if (!G.SCENES[m[1]].costumes.some((c) => c.id === m[2])) ng(f, `${m[1]} に ${m[2]} の服はありません`);
  const px = await pixels(f, 128, 128);
  if (px.nw !== px.nh || px.nw < 64) ng(f, `寸法 ${px.nw}×${px.nh}（正方形・64以上）`);
  let diff = 0;
  for (let i = 0; i < 128; i++) {
    diff += Math.abs(px.l[at(px, 0, i)] - px.l[at(px, 127, i)]) + Math.abs(px.l[at(px, i, 0)] - px.l[at(px, i, 127)]);
  }
  diff /= 256;
  const opaque = px.a.every((v) => v > 250);
  (diff < 28 ? ok : ng)(f, `つなぎ目の差 ${diff.toFixed(1)}（28未満）`);
  (opaque ? ok : ng)(f, opaque ? '不透明' : '透明な部分がある（柄タイルは不透明にしてください）');
}

// ---- UI
for (const f of list(join(ART, 'ui'))) {
  if (!/^(title|handoff|bye)\.(png|webp|svg)$/.test(basename(f))) {
    ng(f, 'ファイル名は title / handoff / bye のいずれか');
    continue;
  }
  const px = await pixels(f, 64, 64);
  (px.nw <= 2000 && px.nh <= 2000 ? ok : ng)(f, `寸法 ${px.nw}×${px.nh}`);
}
await browser.close();

const fails = results.filter((r) => !r.ok);
const lines = [
  `# 絵の自動検査結果`,
  ``,
  `対象：\`${ART}/\`（${files.length}ファイル、合計 ${(total / 1024).toFixed(0)}KB） 実行：${new Date().toISOString()}`,
  ``,
  files.length === 0 ? '差し替えの絵はまだありません（ゲームはコードで描いた既定の絵を使います）。' : fails.length ? `**不合格 ${fails.length} 件**` : '**すべて合格**',
  ``,
  `| 結果 | ファイル | 内容 |`,
  `|---|---|---|`,
  ...results.map((r) => `| ${r.ok ? 'OK' : 'NG'} | ${r.file} | ${r.msg} |`),
  ``,
  `見た目の良し悪し・幼児にとっての難しさ・既存作品との似ている度合いは、この検査では分かりません。`,
];
mkdirSync('art-guides', { recursive: true });
writeFileSync(dirArg > 0 ? join(ART, 'ART_CHECK.md') : 'art-guides/ART_CHECK.md', lines.join('\n') + '\n');
console.log(lines.slice(0, 5).join('\n'));
for (const r of fails.slice(0, 40)) console.log('NG', r.file, r.msg);
process.exit(fails.length ? 1 : 0);
