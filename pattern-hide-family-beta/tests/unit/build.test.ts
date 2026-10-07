// 通常の本番ビルドに、テスト用の読み取り窓口と外部URLが含まれないこと（npm run build の後に実行）
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/assets';
describe.runIf(existsSync(dir))('production bundle', () => {
  const js = !existsSync(dir) ? "" : readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
  it('has no test hook', () => expect(js).not.toContain('__game'));
  it('has no external URL', () => expect(js).not.toMatch(/https?:\/\/(?!www\.w3\.org)/));
  it('has a CSP meta in index.html', () => expect(readFileSync('dist/index.html', 'utf8')).toContain("connect-src 'self'"));
});
