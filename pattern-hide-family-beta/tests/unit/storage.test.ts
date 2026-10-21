import { describe, expect, it } from 'vitest';
import { MemoryKV, Store } from '../../src/storage/storage';
import { STORAGE_KEY, defaults, validate } from '../../src/storage/schema';
import { record, setEnabled } from '../../src/storage/playtest';

describe('storage', () => {
  it('empty -> defaults; save/load round trip', () => {
    const kv = new MemoryKV();
    const s = new Store(kv);
    expect(s.load()).toEqual(defaults());
    expect(s.status).toBe('empty');
    s.update((d) => {
      d.settings.difficulty = 'normal';
      d.resume = { sceneId: 'room', difficulty: 'normal', origin: 'hide', placements: [{ char: 'koro', spot: 'room-curtain', costume: 'stripes', variant: 'exact' }], found: [false] };
    });
    const s2 = new Store(kv);
    s2.load();
    expect(s2.status).toBe('ok');
    expect(s2.data.settings.difficulty).toBe('normal');
    expect(s2.data.resume?.placements[0].spot).toBe('room-curtain');
  });

  it('old save without seenStickers marks already-earned stickers as seen without marking repaired', () => {
    const oldRaw = {
      schema: 1,
      settings: { sound: true, difficulty: 'easy', tutorialSeen: true, movers: true },
      resume: null,
      playtest: { enabled: false, counters: defaults().playtest.counters },
      course: { cleared: 3, current: 4, finds: 2 },
      collection: { totalFinds: 32, sceneFinds: { beach: 5 } },
    };
    const res = validate(oldRaw);
    expect(res.repaired).toBe(false);
    expect(res.data.collection.seenStickers).toEqual(['c1', 'c2', 'c3', 'f10', 'f30', 'b1', 'b5']);

    // 壊れた seenStickers は使えるシールIDだけ残して修復する
    const broken = validate({
      ...oldRaw,
      collection: { totalFinds: 32, sceneFinds: { beach: 5 }, seenStickers: ['c1', 123, 'unknown-sticker', 'b1'] },
    });
    expect(broken.repaired).toBe(true);
    expect(broken.data.collection.seenStickers).toEqual(['c1', 'b1']);
  });

  it.each([
    ['not json', '{{{'],
    ['wrong schema', JSON.stringify({ schema: 99 })],
    ['array', '[]'],
    ['bad resume', JSON.stringify({ ...defaults(), resume: { sceneId: 'moon', placements: [] } })],
    ['bad spot', JSON.stringify({ ...defaults(), resume: { sceneId: 'room', difficulty: 'easy', origin: 'search', placements: [{ char: 'koro', spot: 'nope', costume: 'plain', variant: 'soft' }], found: [false] } })],
    ['bad settings', JSON.stringify({ ...defaults(), settings: { sound: 'yes', difficulty: 'hard' } })],
    ['huge counters', JSON.stringify({ ...defaults(), playtest: { enabled: true, counters: { searchStarted: 1e12, hintsUsed: -4 } } })],
  ])('corrupted save (%s) recovers safely', (_n, raw) => {
    const kv = new MemoryKV();
    kv.map.set(STORAGE_KEY, raw);
    const s = new Store(kv);
    const d = s.load();
    expect(s.status).toBe('recovered');
    expect(['easy', 'normal']).toContain(d.settings.difficulty);
    expect(typeof d.settings.sound).toBe('boolean');
    expect(d.playtest.counters.searchStarted).toBeLessThanOrEqual(9999);
    expect(d.playtest.counters.hintsUsed).toBeGreaterThanOrEqual(0);
    // 直した内容で上書きされ、次回は ok
    const s2 = new Store(kv);
    s2.load();
    expect(s2.status).toBe('ok');
  });

  it('storage unavailable / quota exceeded does not throw', () => {
    const none = new Store(null);
    none.load();
    expect(none.status).toBe('unavailable');
    expect(none.update((d) => (d.settings.sound = false))).toBe(false);
    expect(none.data.settings.sound).toBe(false); // メモリ上では反映

    const kv = new MemoryKV();
    kv.failWrites = true;
    const s = new Store(kv);
    s.load();
    expect(s.save()).toBe(false);
    expect(s.lastSaveOk).toBe(false);

    const kv2 = new MemoryKV();
    kv2.failReads = true;
    const s2 = new Store(kv2);
    s2.load();
    expect(s2.status).toBe('unavailable');
  });

  it('clearAll removes only this app key', () => {
    const kv = new MemoryKV();
    kv.map.set('other-app', 'keep');
    const s = new Store(kv);
    s.load();
    s.save();
    expect(kv.map.has(STORAGE_KEY)).toBe(true);
    s.clearAll();
    expect(kv.map.has(STORAGE_KEY)).toBe(false);
    expect(kv.map.get('other-app')).toBe('keep');
  });
});

describe('playtest counters', () => {
  it('ON by default (2026-10-21 持ち主の決定)', () => {
    const s = new Store(new MemoryKV());
    s.load();
    expect(s.data.playtest.enabled).toBe(true);
    record(s, { type: 'searchStarted' });
    expect(s.data.playtest.counters.searchStarted).toBe(1);
  });

  it('前の初期値（OFF）のままの保存データは ONになり、保護者が自分でOFFにした選択は守る', () => {
    const old = new MemoryKV();
    old.setItem(STORAGE_KEY, JSON.stringify({ ...defaults(), playtest: { enabled: false, counters: {} } }));
    const a = new Store(old);
    a.load();
    expect(a.data.playtest.enabled).toBe(true);
    const s = new Store(new MemoryKV());
    s.load();
    setEnabled(s, false);
    const kv = new MemoryKV();
    kv.setItem(STORAGE_KEY, JSON.stringify(s.data));
    const b = new Store(kv);
    b.load();
    expect(b.data.playtest.enabled).toBe(false);
  });

  it('OFF: nothing recorded', () => {
    const s = new Store(new MemoryKV());
    s.load();
    setEnabled(s, false);
    record(s, { type: 'searchStarted' });
    record(s, { type: 'hint' });
    expect(Object.values(s.data.playtest.counters).every((v) => v === 0)).toBe(true);
  });

  it('ON records minimal buckets; OFF again clears', () => {
    const s = new Store(new MemoryKV());
    s.load();
    setEnabled(s, true);
    record(s, { type: 'searchStarted' });
    record(s, { type: 'searchCompleted', durationMs: 90_000 });
    record(s, { type: 'hint' });
    record(s, { type: 'hideRound' });
    expect(s.data.playtest.counters).toMatchObject({ searchStarted: 1, searchCompleted: 1, hintsUsed: 1, hideRounds: 1, duration1to3m: 1 });
    // 保存データに個人情報・生の時刻列が無いこと
    const json = JSON.stringify(s.data);
    expect(json).not.toMatch(/name|birth|photo|ip|deviceId|timestamp/i);
    setEnabled(s, false);
    expect(Object.values(s.data.playtest.counters).every((v) => v === 0)).toBe(true);
  });
});
