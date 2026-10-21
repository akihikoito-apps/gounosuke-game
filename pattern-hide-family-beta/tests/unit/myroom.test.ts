import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS, ROOMS, depthScale, itemForSticker, itemsForSticker, openRooms, ownedItems, starterLayout, validLayouts } from '../../src/core/myroom';
import { CHARACTER_IDS } from '../../src/core/characters';
import { STICKERS } from '../../src/core/stickers';
import { type ContentId, PACKS } from '../../src/entitlements/entitlements';

const all = () => true;
const baseOnly = (id: ContentId) => PACKS.find((p) => p.id === 'base')!.contents.includes(id);

describe('じぶんの へや', () => {
  it('無料（きほん）では 部屋は2つまで（リビング・ひみつきち）。しんしつ は つづきのコース、ほかは追加パック', () => {
    // ゆっくり増える：はじめは リビング、コース5で ひみつきち、コース6で しんしつ（つづきのコース）
    expect(openRooms(10, baseOnly).map((r) => r.id)).toEqual(['living', 'treehouse']);
    expect(openRooms(0, all).map((r) => r.id)).toEqual(['living']);
    expect(openRooms(4, all).map((r) => r.id)).toEqual(['living']);
    expect(openRooms(5, all).map((r) => r.id)).toEqual(['living', 'treehouse']);
    expect(openRooms(5, all).map((r) => r.id)).not.toContain('bedroom');
    expect(openRooms(6, all).map((r) => r.id)).toEqual(['living', 'treehouse', 'bedroom']);
    // パックの部屋は、その背景で初めて見つけたら
    expect(openRooms(0, all, { forest: 1, aquarium: 1, night: 1 }).map((r) => r.id)).toEqual(['living', 'yard', 'aquarium-room', 'veranda']);
    expect(openRooms(0, all, { beach: 1, forest: 1, aquarium: 1, night: 1, dino: 1 }).map((r) => r.id)).toEqual(['living', 'beach-deck', 'yard', 'aquarium-room', 'veranda', 'dino-land']);
    // どの部屋も、ちょうど1つのパックに入っている
    for (const r of ROOMS) expect(PACKS.filter((p) => p.contents.includes(r.content)).length, r.id).toBe(1);
  });

  it('シール1枚に もの1つ以上。無料は はじめから3つ、パックで家具・おもちゃが増える', () => {
    for (const s of STICKERS) expect(itemForSticker(s.id), s.id).toBeTruthy();
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(ownedItems({ cleared: 0, totalFinds: 0 }, baseOnly).map((i) => i.id)).toEqual(['sofa', 'table', 'rug']);
    expect(ownedItems({ cleared: 0, totalFinds: 0 }, all).map((i) => i.id)).toEqual([
      'sofa',
      'table',
      'rug',
      'beach-chair',
      'camp-tent',
      'log-seesaw',
      'shell-sofa',
      'engawa-bench',
      'egg-sofa',
      'bone-slide',
      'footprint-rug',
    ]);
    expect(ownedItems({ cleared: 3, totalFinds: 12 }, all).map((i) => i.id)).toEqual([
      'sofa',
      'table',
      'rug',
      'ball',
      'cushion',
      'bed',
      'plant',
      'beach-chair',
      'camp-tent',
      'log-seesaw',
      'shell-sofa',
      'engawa-bench',
      'egg-sofa',
      'bone-slide',
      'footprint-rug',
    ]);
    // コース7・8で きしゃの おもちゃ・もくば、きのこの もり5回で どんぐり ごま、かわべで ほたるかご・きんぎょの すいそう が増える
    expect(itemsForSticker('c7').map((i) => i.id)).toEqual(['moonlamp', 'train-toy']);
    expect(itemsForSticker('c8').map((i) => i.id)).toEqual(['fishtank', 'rocking-horse']);
    expect(itemsForSticker('f-s5').map((i) => i.id)).toEqual(['acorn-lamp', 'acorn-top']);
    expect(itemsForSticker('n-s1').map((i) => i.id)).toEqual(['firefly-jar']);
    expect(itemsForSticker('n-s15').map((i) => i.id)).toEqual(['goldfish-bowl']);
    // うきわ は座ってゆれる
    expect(ITEM_BY_ID['floatring'].seats).toEqual([{ x: 0, y: -36 }]);
    expect(ITEM_BY_ID['floatring'].motion).toBe('bob');
    // パックが無ければ、そのパックのシールの もの は出ない（コース7〜10・うみべ・きのこの もり・すいぞくかん・ほたるの かわべ）
    const base = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { beach: 99, forest: 99, aquarium: 99, night: 99, dino: 99 } }, baseOnly).map((i) => i.id);
    expect(base).not.toContain('train-toy');
    expect(base).not.toContain('rocking-horse');
    expect(base).not.toContain('puppy');
    expect(base).not.toContain('beach-chair');
    expect(base).not.toContain('shell');
    expect(base).not.toContain('camp-tent');
    expect(base).not.toContain('log-seesaw');
    expect(base).not.toContain('acorn-top');
    expect(base).not.toContain('stump-chair');
    expect(base).not.toContain('shell-sofa');
    expect(base).not.toContain('coral-rug');
    expect(base).not.toContain('engawa-bench');
    expect(base).not.toContain('firefly-jar');
    expect(base).not.toContain('goldfish-bowl');
    expect(base).not.toContain('egg-sofa');
    expect(base).not.toContain('bone-slide');
    expect(base).not.toContain('footprint-rug');
    expect(base).not.toContain('dino-egg');
    expect(base).not.toContain('baby-dino');
    expect(base).not.toContain('star-rug');
    expect(base).not.toContain('music-box');
    expect(base).toContain('balloon');
    // 全開放でも legacy の star-rug / music-box は棚（ownedItems）には出ない
    const allOwned = ownedItems({ cleared: 10, totalFinds: 999, sceneFinds: { beach: 99, forest: 99, aquarium: 99, night: 99 } }, all).map((i) => i.id);
    expect(allOwned).toContain('firefly-jar');
    expect(allOwned).toContain('goldfish-bowl');
    expect(allOwned).not.toContain('star-rug');
    expect(allOwned).not.toContain('music-box');
  });

  it('奥ほど小さく、手前ほど大きい', () => {
    const r = ROOMS[0];
    expect(depthScale(r, r.floorTop)).toBeCloseTo(r.scaleBack);
    expect(depthScale(r, 1000)).toBeCloseTo(r.scaleFront);
    expect(depthScale(r, 0)).toBeCloseTo(r.scaleBack);
  });

  it('保存データの検査：正しいものは残し、壊れた部屋だけ消す（旧 star-rug / music-box も壊れない）', () => {
    const living = starterLayout('living');
    expect(validLayouts({ living }, CHARACTER_IDS)).toEqual({ living });
    const verandaLegacy = [{ ref: 'item:star-rug', x: 500, y: 820 }, { ref: 'item:music-box', x: 640, y: 780 }];
    expect(validLayouts({ veranda: verandaLegacy }, CHARACTER_IDS)).toEqual({ veranda: verandaLegacy });
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
