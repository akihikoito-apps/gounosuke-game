import { describe, expect, it } from 'vitest';
import {
  STICKERS,
  earnedStickers,
  initialStickerPage,
  newStickers,
  nextStickerOnPage,
  stickerHint,
  stickerPages,
  stickerProgressHint,
  unseenEarnedStickers,
} from '../../src/core/stickers';
import { visibleStickers } from '../../src/core/access';
import { freeEntitlements } from '../../src/entitlements/entitlements';
import { BASE_CHARACTER_IDS, CHARACTER_IDS, unlockedCharacters } from '../../src/core/characters';
import { autoLayout } from '../../src/core/placement';
import { courseRound } from '../../src/core/courses';
import { SCENES, SCENE_IDS } from '../../src/core/scenes';
import { validate } from '../../src/storage/schema';

describe('sticker book and the new friend', () => {
  it('35 stickers: one per course, five by total finds, five for beach, five for forest, five for aquarium, five for night; no randomness', () => {
    expect(STICKERS).toHaveLength(35);
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(35);
    expect(earnedStickers(0, 0)).toHaveLength(0);
    expect(earnedStickers(10, 150)).toHaveLength(15);
    expect(earnedStickers(10, 150, { beach: 50 })).toHaveLength(20);
    expect(earnedStickers(10, 150, { beach: 50, forest: 50 })).toHaveLength(25);
    expect(earnedStickers(10, 150, { beach: 50, forest: 50, aquarium: 50 })).toHaveLength(30);
    expect(earnedStickers(10, 150, { beach: 50, forest: 50, aquarium: 50, night: 50 })).toHaveLength(35);
    expect(earnedStickers(0, 0, { beach: 1 }).map((s) => s.id)).toEqual(['b1']);
    expect(earnedStickers(0, 0, { beach: 10 }).map((s) => s.id)).toEqual(['b1', 'b5', 'b10']);
    expect(earnedStickers(0, 0, { beach: 30 }).map((s) => s.id)).toEqual(['b1', 'b5', 'b10', 'b30']);
    expect(earnedStickers(0, 0, { beach: 50 }).map((s) => s.id)).toEqual(['b1', 'b5', 'b10', 'b30', 'b50']);
    expect(earnedStickers(0, 0, { forest: 1 }).map((s) => s.id)).toEqual(['f-s1']);
    expect(earnedStickers(0, 0, { aquarium: 1 }).map((s) => s.id)).toEqual(['a-s1']);
    expect(earnedStickers(0, 0, { night: 1 }).map((s) => s.id)).toEqual(['n-s1']);
    expect(earnedStickers(3, 30).map((s) => s.id)).toEqual(['c1', 'c2', 'c3', 'f10', 'f30']);
    expect(newStickers({ cleared: 4, totalFinds: 29 }, { cleared: 5, totalFinds: 30 }).map((s) => s.id)).toEqual(['c5', 'f30']);
    expect(STICKERS.find((s) => s.id === 'c5')?.char).toBe('popo');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b1')!)).toBe('うみべで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b5')!)).toBe('うみべで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b10')!)).toBe('うみべで 10かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'b50')!)).toBe('うみべで 50かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s1')!)).toBe('きのこの もりで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'f-s5')!)).toBe('きのこの もりで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s1')!)).toBe('すいぞくかんで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'a-s5')!)).toBe('すいぞくかんで 5かい');
    expect(stickerHint(STICKERS.find((s) => s.id === 'n-s1')!)).toBe('ほたるの かわべで みつけたら');
    expect(stickerHint(STICKERS.find((s) => s.id === 'n-s5')!)).toBe('ほたるの かわべで 5かい');
  });

  it('sticker book pages, progress hints, and initial page selection', () => {
    const freeCan = (id: Parameters<typeof freeEntitlements.canPlay>[0]) => freeEntitlements.canPlay(id);
    const freePages = stickerPages(visibleStickers(freeCan));
    expect(freePages.map((p) => p.id)).toEqual(['course', 'finds']);

    const allPages = stickerPages(STICKERS);
    expect(allPages.map((p) => p.id)).toEqual(['course', 'finds', 'beach', 'forest', 'aquarium', 'night']);

    const prog = { cleared: 6, totalFinds: 18, sceneFinds: { beach: 2 } };
    expect(stickerProgressHint(STICKERS.find((s) => s.id === 'c7')!, prog)).toBe('コース7');
    expect(stickerProgressHint(STICKERS.find((s) => s.id === 'f30')!, prog)).toBe('あと 12かい');
    expect(stickerProgressHint(STICKERS.find((s) => s.id === 'b5')!, prog)).toBe('うみべで あと 3かい');

    expect(nextStickerOnPage(allPages[0], prog)?.id).toBe('c7');
    expect(nextStickerOnPage(allPages[1], prog)?.id).toBe('f30');
    expect(nextStickerOnPage(allPages[2], prog)?.id).toBe('b5');

    // 未見のシールがあれば そのページを最初に出す
    const seen = earnedStickers(6, 18, { beach: 2 }).map((s) => s.id);
    expect(unseenEarnedStickers(STICKERS, prog, seen)).toHaveLength(0);
    expect(initialStickerPage(allPages, prog, seen.filter((id) => id !== 'b1'))).toBe('beach');
    // 未見がなければ、つぎにもらえそうなシールのページ（うみべで あと3かい）を出す
    expect(initialStickerPage(allPages, prog, seen)).toBe('beach');
  });

  it('nyako joins after course 1, popo after course 5, and never before that', () => {
    expect(unlockedCharacters(0)).toEqual(BASE_CHARACTER_IDS);
    expect(unlockedCharacters(1)).toEqual([...BASE_CHARACTER_IDS, 'nyako']);
    expect(unlockedCharacters(4)).toEqual([...BASE_CHARACTER_IDS, 'nyako']);
    expect(unlockedCharacters(5)).toEqual([...BASE_CHARACTER_IDS, 'nyako', 'popo']);
    // うみべパックの ちょき・きのこの もりパックの ぴの・すいぞくかんパックの ぷか・ほたるの かわべパックの ひか は、それぞれの背景で初めて見つけたら
    expect(unlockedCharacters(0, { beach: 1 })).toEqual([...BASE_CHARACTER_IDS, 'choki']);
    expect(unlockedCharacters(0, { forest: 1 })).toEqual([...BASE_CHARACTER_IDS, 'pino']);
    expect(unlockedCharacters(0, { aquarium: 1 })).toEqual([...BASE_CHARACTER_IDS, 'puka']);
    expect(unlockedCharacters(0, { night: 1 })).toEqual([...BASE_CHARACTER_IDS, 'hika']);
    expect(unlockedCharacters(10, { beach: 3, forest: 1, aquarium: 1, night: 1 })).toEqual(CHARACTER_IDS);
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
    // 古い保存データに知らない背景・知らない部屋があってもエラーにならず、その部分だけ捨てて他を残す
    const oldSave = validate({
      ...base,
      collection: { totalFinds: 20, sceneFinds: { beach: 5, removedScene: 8 } },
      myroom: {
        layouts: {
          living: [{ ref: 'item:sofa', x: 470, y: 690 }],
          removedRoom: [{ ref: 'item:old-item', x: 280, y: 720 }],
        },
        current: 'removedRoom',
      },
    });
    expect(oldSave.repaired).toBe(true);
    expect(oldSave.data.collection.sceneFinds).toEqual({ beach: 5 });
    expect(oldSave.data.myroom.layouts).toEqual({ living: [{ ref: 'item:sofa', x: 470, y: 690 }] });
    expect(oldSave.data.myroom.current).toBe('living');
  });
});
