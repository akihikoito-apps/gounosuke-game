import { describe, expect, it } from 'vitest';
import { STICKERS, earnedStickers, newStickers } from '../../src/core/stickers';
import { BASE_CHARACTER_IDS, CHARACTER_IDS, unlockedCharacters } from '../../src/core/characters';
import { autoLayout } from '../../src/core/placement';
import { courseRound } from '../../src/core/courses';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { validate } from '../../src/storage/schema';

describe('sticker book and the new friend', () => {
  it('15 stickers: one per course and five by total finds, no randomness', () => {
    expect(STICKERS).toHaveLength(15);
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(15);
    expect(earnedStickers(0, 0)).toHaveLength(0);
    expect(earnedStickers(10, 150)).toHaveLength(15);
    expect(earnedStickers(3, 30).map((s) => s.id)).toEqual(['c1', 'c2', 'c3', 'f10', 'f30']);
    expect(newStickers({ cleared: 4, totalFinds: 29 }, { cleared: 5, totalFinds: 30 }).map((s) => s.id)).toEqual(['c5', 'f30']);
  });

  it('nyako joins only after course 5 and never appears before that', () => {
    expect(unlockedCharacters(4)).toEqual(BASE_CHARACTER_IDS);
    expect(unlockedCharacters(5)).toEqual(CHARACTER_IDS);
    for (const id of SCENE_IDS) {
      for (let seed = 1; seed <= 60; seed++) {
        expect(autoLayout(SCENES[id], 'normal', seed).some((p) => p.char === 'nyako')).toBe(false);
        expect(courseRound(SCENES[id], 9, 3, seed).some((p) => p.char === 'nyako')).toBe(false);
      }
    }
    // 仲間になったあとは出てくる
    const seen = SCENE_IDS.some((id) => Array.from({ length: 60 }, (_, s) => courseRound(SCENES[id], 9, 3, s + 1, CHARACTER_IDS)).flat().some((p) => p.char === 'nyako'));
    expect(seen).toBe(true);
  });

  it('total finds is kept, repaired when broken, and old saves start at 0', () => {
    const base = { schema: 1, settings: { sound: true, difficulty: 'easy', tutorialSeen: true }, resume: null, playtest: { enabled: false, counters: {} } };
    expect(validate(base).data.collection.totalFinds).toBe(0);
    expect(validate({ ...base, collection: { totalFinds: 42 } }).data.collection.totalFinds).toBe(42);
    const r = validate({ ...base, collection: { totalFinds: -5 } });
    expect(r.data.collection.totalFinds).toBe(0);
    expect(r.repaired).toBe(true);
  });
});
