import { describe, expect, it } from 'vitest';
import { STICKERS, earnedStickers, newStickers, stickerHint } from '../../src/core/stickers';
import { BASE_CHARACTER_IDS, CHARACTER_IDS, unlockedCharacters } from '../../src/core/characters';
import { autoLayout } from '../../src/core/placement';
import { courseRound } from '../../src/core/courses';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { validate } from '../../src/storage/schema';

describe('sticker book and the new friend', () => {
  it('33 stickers: one per course, five by total finds, three for beach, five for forest, five for aquarium, five for haunted; no randomness', () => {
    expect(STICKERS).toHaveLength(33);
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(33);
    expect(earnedStickers(0, 0)).toHaveLength(0);
    expect(earnedStickers(10, 150)).toHaveLength(15);
    expect(earnedStickers(10, 150, { beach: 30 })).toHaveLength(18);
    expect(earnedStickers(10, 150, { beach: 30, forest: 50 })).toHaveLength(23);
    expect(earnedStickers(10, 150, { beach: 30, forest: 50, aquarium: 50 })).toHaveLength(28);
    expect(earnedStickers(10, 150, { beach: 30, forest: 50, aquarium: 50, haunted: 50 })).toHaveLength(33);
    expect(earnedStickers(0, 0, { beach: 1 }).map((s) => s.id)).toEqual(['b1']);
    expect(earnedStickers(0, 0, { forest: 1 }).map((s) => s.id)).toEqual(['f-s1']);
    expect(earnedStickers(0, 0, { aquarium: 1 }).map((s) => s.id)).toEqual(['a-s1']);
    expect(earnedStickers(0, 0, { haunted: 1 }).map((s) => s.id)).toEqual(['h-s1']);
    expect(earnedStickers(3, 30).map((s) => s.id)).toEqual(['c1', 'c2', 'c3', 'f10', 'f30']);
    expect(newStickers({ cleared: 4, totalFinds: 29 }, { cleared: 5, totalFinds: 30 }).map((s) => s.id)).toEqual(['c5', 'f30']);
    expect(STICKERS.find((s) => s.id === 'c5')?.char).toBe('popo');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b1')!)).toBe('うみべで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b10')!)).toBe('うみべで 10かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s1')!)).toBe('きのこの もりで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s5')!)).toBe('きのこの もりで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s1')!)).toBe('すいぞくかんで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s5')!)).toBe('すいぞくかんで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'h-s1')!)).toBe('おばけやしきで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'h-s5')!)).toBe('おばけやしきで 5かい');
  });

  it('nyako joins after course 1, popo after course 5, and never before that', () => {
    expect(unlockedCharacters(0)).toEqual(BASE_CHARACTER_IDS);
    expect(unlockedCharacters(1)).toEqual([...BASE_CHARACTER_IDS, 'nyako']);
    expect(unlockedCharacters(4)).toEqual([...BASE_CHARACTER_IDS, 'nyako']);
    expect(unlockedCharacters(5)).toEqual([...BASE_CHARACTER_IDS, 'nyako', 'popo']);
    // うみべパックの ちょき・きのこの もりパックの ぴの・すいぞくかんパックの ぷか・おばけやしきパックの ふわ は、それぞれの背景で初めて見つけたら
    expect(unlockedCharacters(0, { beach: 1 })).toEqual([...BASE_CHARACTER_IDS, 'choki']);
    expect(unlockedCharacters(0, { forest: 1 })).toEqual([...BASE_CHARACTER_IDS, 'pino']);
    expect(unlockedCharacters(0, { aquarium: 1 })).toEqual([...BASE_CHARACTER_IDS, 'puka']);
    expect(unlockedCharacters(0, { haunted: 1 })).toEqual([...BASE_CHARACTER_IDS, 'fuwa']);
    expect(unlockedCharacters(10, { beach: 3, forest: 1, aquarium: 1, haunted: 1 })).toEqual(CHARACTER_IDS);
    for (const id of SCENE_IDS) {
      for (let seed = 1; seed <= 60; seed++) {
        expect(autoLayout(SCENES[id], 'normal', seed).some((p) => p.char === 'nyako' || p.char === 'popo')).toBe(false);
        expect(courseRound(SCENES[id], 9, 3, seed, unlockedCharacters(1)).some((p) => p.char === 'popo')).toBe(false);
      }
    }
    // 仲間になったあとは出てくる
    for (const who of ['nyako', 'popo']) {
      const seen = SCENE_IDS.some((id) => Array.from({ length: 60 }, (_, s) => courseRound(SCENES[id], 9, 3, s + 1, CHARACTER_IDS)).flat().some((p) => p.char === who));
      expect(seen).toBe(true);
    }
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
