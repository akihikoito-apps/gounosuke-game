import { describe, expect, it } from 'vitest';
import { ITEMS, ROOMS, depthScale, itemForSticker, openRooms, ownedItems, starterLayout, validLayouts } from '../../src/core/myroom';
import { CHARACTER_IDS } from '../../src/core/characters';
import { STICKERS } from '../../src/core/stickers';
import { type ContentId, PACKS } from '../../src/entitlements/entitlements';

const all = () => true;
const baseOnly = (id: ContentId) => PACKS.find((p) => p.id === 'base')!.contents.includes(id);

describe('じぶんの へや', () => {
  it('無料（きほん）では 部屋は2つまで。おにわ・ひみつきち は追加パック', () => {
    expect(openRooms(10, baseOnly).map((r) => r.id)).toEqual(['living', 'bedroom']);
    expect(openRooms(0, all).map((r) => r.id)).toEqual(['living', 'treehouse']);
    expect(openRooms(3, all).map((r) => r.id)).toEqual(['living', 'bedroom', 'treehouse']);
    expect(openRooms(6, all).map((r) => r.id)).toEqual(['living', 'bedroom', 'yard', 'treehouse']);
    // どの部屋も、ちょうど1つのパックに入っている
    for (const r of ROOMS) expect(PACKS.filter((p) => p.contents.includes(r.content)).length, r.id).toBe(1);
  });

  it('シール1枚に もの1つ。無料は はじめから3つ、もりパックで キャンプテントが増える', () => {
    for (const s of STICKERS) expect(itemForSticker(s.id), s.id).toBeTruthy();
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(ownedItems({ cleared: 0, totalFinds: 0 }, baseOnly).map((i) => i.id)).toEqual(['sofa', 'table', 'rug']);
    expect(ownedItems({ cleared: 0, totalFinds: 0 }, all).map((i) => i.id)).toEqual(['sofa', 'table', 'rug', 'camp-tent']);
    expect(ownedItems({ cleared: 3, totalFinds: 12 }, all).map((i) => i.id)).toEqual(['sofa', 'table', 'rug', 'ball', 'cushion', 'bed', 'plant', 'camp-tent']);
    // パックが無ければ、そのパックのシールの もの は出ない（コース10のこいぬ・うみべ・きのこの もり）
    const base = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { beach: 99, forest: 99 } }, baseOnly).map((i) => i.id);
    expect(base).not.toContain('puppy');
    expect(base).not.toContain('shell');
    expect(base).not.toContain('camp-tent');
    expect(base).not.toContain('stump-chair');
    expect(base).toContain('balloon');
  });

  it('奥ほど小さく、手前ほど大きい', () => {
    const r = ROOMS[0];
    expect(depthScale(r, r.floorTop)).toBeCloseTo(r.scaleBack);
    expect(depthScale(r, 1000)).toBeCloseTo(r.scaleFront);
    expect(depthScale(r, 0)).toBeCloseTo(r.scaleBack);
  });

  it('保存データの検査：正しいものは残し、壊れた部屋だけ消す', () => {
    const living = starterLayout('living');
    expect(validLayouts({ living }, CHARACTER_IDS)).toEqual({ living });
    expect(validLayouts({ living, bedroom: [{ ref: 'item:nope', x: 1, y: 1 }] }, CHARACTER_IDS)).toEqual({ living });
    expect(validLayouts({ living: [{ ref: 'char:koro', x: 'a', y: 1 }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [{ ref: 'char:koro', x: 1, y: 1, on: { idx: 0, seat: 0 } }] }, CHARACTER_IDS)).toEqual({}); // 自分の上には座れない
    expect(validLayouts({ living: [{ ref: 'item:sofa', x: 1, y: 1 }, { ref: 'char:koro', x: 1, y: 1, on: { idx: 0, seat: 1 } }] }, CHARACTER_IDS).living).toHaveLength(2);
    expect(validLayouts({ living: Array.from({ length: 41 }, (_, i) => ({ ref: i % 2 ? 'item:ball' : 'item:sofa', x: 1, y: 1 })) }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts(null, CHARACTER_IDS)).toEqual({});
    // Codex レビュー96 指摘3：無い座席・物どうし・お互いに座る・同じ席・同じ物2つ・部屋の外
    const sw = { ref: 'item:swing', x: 500, y: 800 };
    expect(validLayouts({ living: [sw, { ref: 'char:koro', x: 1, y: 1, on: { idx: 0, seat: 99 } }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [sw, { ref: 'item:ball', x: 1, y: 1, on: { idx: 0, seat: 0 } }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [{ ref: 'char:koro', x: 1, y: 1, on: { idx: 1, seat: 0 } }, { ref: 'char:mimi', x: 1, y: 1, on: { idx: 0, seat: 0 } }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [sw, { ref: 'char:koro', x: 1, y: 1, on: { idx: 0, seat: 0 } }, { ref: 'char:mimi', x: 1, y: 1, on: { idx: 0, seat: 0 } }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [sw, sw] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [{ ref: 'item:ball', x: -5, y: 1 }] }, CHARACTER_IDS)).toEqual({});
    expect(validLayouts({ living: [{ ref: 'item:ballx', x: 5, y: 1 }] }, CHARACTER_IDS)).toEqual({});
  });
});
