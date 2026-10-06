import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// 本番ビルドの後に、ビルド成果物の一覧から Service Worker を作る。
// 版（VERSION）は成果物の内容のハッシュなので、更新すると古いキャッシュは消える。
function serviceWorkerPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'local-service-worker',
    apply: 'build',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (d: string) => {
        for (const f of readdirSync(d)) {
          const p = join(d, f);
          if (statSync(p).isDirectory()) walk(p);
          else files.push(p);
        }
      };
      walk(outDir);
      const list = files
        .map((f) => relative(outDir, f).split('\\').join('/'))
        .filter((f) => f !== 'sw.js')
        .sort();
      const h = createHash('sha256');
      for (const f of list) h.update(f).update(readFileSync(join(outDir, f)));
      const version = h.digest('hex').slice(0, 12);
      const tpl = readFileSync(resolve(ROOT, 'src/sw-template.js'), 'utf8');
      const out = tpl.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(['./', ...list.map((f) => './' + f)]));
      writeFileSync(join(outDir, 'sw.js'), out);
    },
  };
}

// 本番だけ、通信先を同一オリジンに制限する CSP を入れる
function cspPlugin(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const csp =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'";
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [cspPlugin(), serviceWorkerPlugin()],
  build: { target: 'es2020', sourcemap: false },
  server: { host: '127.0.0.1', strictPort: false },
  preview: { host: '127.0.0.1' },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
} as never);
