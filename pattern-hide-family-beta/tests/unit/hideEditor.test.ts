import { describe, expect, it } from 'vitest';
import { allPlaced, chooseScene, emptyDraft, placeAt, placeOnSpot, select, setChars, setCostume, toPlacements, undo } from '../../src/core/hideEditor';
import { SCENES } from '../../src/core/scenes';
import { getSpot, spotAnchor, validateLayout } from '../../src/core/placement';

const scene = SCENES.shop;

describe('hide editor', () => {
  it('scene -> chars -> costume -> place -> done keeps exact coordinates', () => {
    let d = chooseScene(emptyDraft(), 'shop');
    d = setChars(d, ['mimi'], scene);
    d = setCostume(d, 'mimi', 'stripes', scene);
    expect(allPlaced(d)).toBe(false);
    d = placeOnSpot(d, 'mimi', 'shop-counter-1', scene);
    expect(allPlaced(d)).toBe(true);
    const p = toPlacements(d);
    expect(p).toEqual([{ char: 'mimi', spot: 'shop-counter-1', costume: 'stripes', variant: 'exact' }]);
    expect(validateLayout(scene, p).ok).toBe(true);
  });

  it('tap-to-place snaps to nearest valid spot and never overlaps', () => {
    let d = setChars(chooseScene(emptyDraft(), 'shop'), ['koro', 'mimi', 'moko'], scene);
    const target = getSpot(scene, 'shop-wall-2');
    d = placeAt(d, 'koro', spotAnchor(target), scene);
    expect(d.placed.koro).toBe('shop-wall-2');
    d = placeAt(d, 'mimi', spotAnchor(target), scene); // 同じ場所 → 別の空き場所へ
    expect(d.placed.mimi).toBeDefined();
    expect(d.placed.mimi).not.toBe('shop-wall-2');
    d = placeAt(d, 'moko', { x: -999, y: 99999 }, scene); // 画面外 → 安全な候補
    expect(d.placed.moko).toBeDefined();
    expect(validateLayout(scene, toPlacements(d)).ok).toBe(true);
  });

  it('occupied spot cannot be chosen directly; undo steps back one at a time', () => {
    let d = setChars(chooseScene(emptyDraft(), 'shop'), ['koro', 'mimi'], scene);
    d = placeOnSpot(d, 'koro', 'shop-wall-1', scene);
    const before = d;
    d = placeOnSpot(d, 'mimi', 'shop-wall-1', scene);
    expect(d).toBe(before);
    d = placeOnSpot(d, 'mimi', 'shop-wall-3', scene);
    d = undo(d);
    expect(d.placed).toEqual({ koro: 'shop-wall-1' });
    d = undo(d);
    expect(d.placed).toEqual({});
    expect(d.chars).toEqual(['koro', 'mimi']); // 全消去しない
    expect(undo(d)).toBe(d);
  });

  it('changing costume after placing keeps the spot', () => {
    let d = setChars(chooseScene(emptyDraft(), 'shop'), ['koro'], scene);
    d = placeOnSpot(d, 'koro', 'shop-cloth-1', scene);
    d = setCostume(select(d, 'koro'), 'koro', 'check', scene);
    expect(toPlacements(d)[0]).toMatchObject({ spot: 'shop-cloth-1', costume: 'check' });
  });

  it('at most 3 characters, no duplicates', () => {
    const d = setChars(emptyDraft(), ['koro', 'koro', 'mimi', 'moko'], scene);
    expect(d.chars).toEqual(['koro', 'mimi', 'moko']);
  });
});
