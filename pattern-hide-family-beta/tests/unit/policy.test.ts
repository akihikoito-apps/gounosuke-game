// ソースの静的検査：通信・追跡・課金・権限要求・外部リンクが無いこと
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { betaEntitlements } from '../../src/entitlements/entitlements';
import { makeChallenge } from '../../src/ui/parent';

function files(d: string): string[] {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
const src = files('src').filter((f) => /\.(ts|js|css)$/.test(f));

describe('policy', () => {
  it.each([
    ['fetch(', /\bfetch\s*\(/],
    ['XMLHttpRequest', /XMLHttpRequest/],
    ['sendBeacon', /sendBeacon/],
    ['WebSocket', /WebSocket/],
    ['EventSource', /EventSource/],
    ['geolocation', /geolocation/],
    ['getUserMedia', /getUserMedia/],
    ['Notification', /Notification\./],
    ['external URL', /https?:\/\//],
    ['anchor link', /<a\s/],
    ['window.open', /window\.open/],
    ['price/purchase words', /[¥￥]|[0-9０-９]\s*円|購入する|価格|広告を/],
    ['eval', /\beval\s*\(|new Function/],
  ])('no %s in app source (except service worker same-origin fetch)', (_n, re) => {
    for (const f of src) {
      let text = readFileSync(f, 'utf8');
      if (f.endsWith('sw-template.js')) text = text.replace(/fetch\(req\)/g, ''); // SW は同一オリジンのみ
      // 保護者向け説明文（課金なしの案内）は許可
      if (f.endsWith('parent.ts')) text = text.replace(/課金|購入|広告/g, '');
      expect(re.test(text), `${f} matches ${re}`).toBe(false);
    }
  });

  it('beta entitlement is not a purchase proof', () => {
    expect(betaEntitlements.kind).toBe('beta-all-unlocked');
    expect(betaEntitlements.canPlay('scene:room')).toBe(true);
  });

  it('parent gate: random 3-key presses rarely pass (< 2%)', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let pass = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const ch = makeChallenge(rnd);
      const want = ch.slice().sort((a, b) => a - b);
      const presses = [0, 1, 2].map(() => 1 + Math.floor(rnd() * 9));
      if (presses.every((p, k) => p === want[k])) pass++;
    }
    expect(pass / N).toBeLessThan(0.02);
    // 表示順はそのまま押すと失敗する並び
    for (let i = 0; i < 200; i++) {
      const ch = makeChallenge(rnd);
      expect(ch[0] < ch[1] && ch[1] < ch[2]).toBe(false);
    }
  });
});
