// iOS アプリに入れるゲーム本体（www）を作る。ウェブ版と同じソースを、Service Worker なしでビルドする。
// 使い方（native フォルダで）: node build-www.mjs
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
execSync('npx vite build --mode native --outDir native/www --emptyOutDir', { cwd: root, stdio: 'inherit', shell: true });
console.log('native/www を作りました');
