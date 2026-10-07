import { build } from 'esbuild';
import { mkdtempSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// Codex のサンドボックス内では esbuild が親フォルダを読めずに失敗する。
// 外で成功したときの結果をここに残し、失敗したときはそれを使う（形状データを変えるのは src/ を触る Claude 側だけ）
const cache = join(here, '../../node_modules/.cache/phfb-geo.mjs');
export async function loadGeometry() {
  const out = join(mkdtempSync(join(tmpdir(), 'phfb-geo-')), 'geo.mjs');
  try {
    await build({ entryPoints: [join(here, 'geometry-entry.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' });
  } catch (e) {
    if (!existsSync(cache)) throw e;
    console.warn(`形状データを組み立てられなかったため、前回の結果を使います（${e.message.split('\n')[0]}）`);
    return import(pathToFileURL(cache).href);
  }
  try {
    mkdirSync(dirname(cache), { recursive: true });
    copyFileSync(out, cache);
  } catch {
    // 保存できなくても検査は続ける
  }
  return import(pathToFileURL(out).href);
}
