// じぶんの へや：仲間にした友だちと、シールでもらった「もの」を、好きな場所に置いて遊ぶ（おままごと）。
// 勝ち負け・時間制限・正解はない。コースで遊ぶほど、置ける もの と へや が増える。
// 座標は 1000×1000 の部屋の中。もの と 友だち は「足もと中央」を基準に置く（ゲームの他の画面と同じ単位）。
import type { ContentId } from '../entitlements/entitlements';
import type { CanPlay } from './access';
import type { CharacterId } from './characters';
import { STICKERS, hasSticker } from './stickers';
import type { SceneId } from './scene';

export type RoomId = 'living' | 'bedroom' | 'yard' | 'treehouse' | 'aquarium-room' | 'attic';
export type Motion = 'walk' | 'swing' | 'bob' | 'sway' | 'roll' | 'swim';

export interface RoomDef {
  id: RoomId;
  name: string;
  /** この部屋が開くクリア数（0：はじめから） */
  needCleared: number;
  /** パックの部屋：その背景で初めて友だちを見つけたら開く（友だちが仲間になるのと同じとき） */
  needScene?: SceneId;
  /** どのパックの中身か */
  content: ContentId;
  /** 置ける床の範囲（足もとの y）。これより上には置けない */
  floorTop: number;
  /** 奥（floorTop）と手前（1000）での大きさ */
  scaleBack: number;
  scaleFront: number;
}

/**
 * 部屋は ゆっくり増える（ご本人の方針 2026-10-15）：
 * はじめは リビングだけ → コース5 クリアで ひみつきち（無料はここまでの2部屋）→ コース6 クリアで しんしつ（つづきのコースを買って最初のクリアで。Gemini 最終点検の提案を採用）。
 * ほかは追加パックの部屋で、その背景で初めて友だちを見つけたときに開く。
 */
export const ROOMS: RoomDef[] = [
  { id: 'living', name: 'リビング', needCleared: 0, content: 'room:living', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'treehouse', name: 'ひみつきち', needCleared: 5, content: 'room:treehouse', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'bedroom', name: 'しんしつ', needCleared: 6, content: 'room:bedroom', floorTop: 580, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'yard', name: 'もりの ひろば', needCleared: 0, needScene: 'forest', content: 'room:yard', floorTop: 540, scaleBack: 0.95, scaleFront: 1.45 },
  { id: 'aquarium-room', name: 'すいぞくかんの へや', needCleared: 0, needScene: 'aquarium', content: 'room:aquarium-room', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'attic', name: 'ほしの やねうらべや', needCleared: 0, needScene: 'haunted', content: 'room:attic', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
];

export type Genre = 'furniture' | 'toy' | 'animal' | 'deco' | 'food';

/** 棚のタブ（並び順）。絵は代表の物（rep）で見せる。字が読めなくても分かるように */
export const GENRES: { id: Genre; name: string; rep: string }[] = [
  { id: 'furniture', name: 'かぐ', rep: 'sofa' },
  { id: 'toy', name: 'おもちゃ', rep: 'ball' },
  { id: 'animal', name: 'いきもの', rep: 'puppy' },
  { id: 'deco', name: 'かざり', rep: 'flowerpot' },
  { id: 'food', name: 'たべもの', rep: 'cake' },
];

export interface Seat {
  /** もの の足もとから見た、座る位置（足もとが来る所） */
  x: number;
  y: number;
}

export interface ItemDef {
  id: string;
  name: string;
  /** どのシールでもらえるか。null ははじめから持っている */
  sticker: string | null;
  /** パックを買った瞬間から使える物（sticker が null のとき）の所属パック中身 */
  content?: ContentId;
  /** 置いたときの横幅のめやす（ローカル座標。友だちの横幅は 約150） */
  w: number;
  /** 棚での分け方（かぐ・おもちゃ・いきもの・かざり・たべもの） */
  genre: Genre;
  /** 床に敷くもの（いつも いちばん奥に描く） */
  flat?: boolean;
  /** 座れる場所（ソファ・ベッド・ブランコ） */
  seats?: Seat[];
  motion?: Motion;
}

// 絵の枠は全部同じ：viewBox "-150 -300 300 300"、足もと中央が (0, 0)。友だちと同じ大きさの単位で描く。
export const ITEMS: ItemDef[] = [
  // はじめから
  { id: 'sofa', name: 'ソファ', sticker: null, genre: 'furniture', w: 280, seats: [{ x: -62, y: -62 }, { x: 62, y: -62 }] },
  { id: 'table', name: 'テーブル', sticker: null, genre: 'furniture', w: 190 },
  { id: 'rug', name: 'ラグ', sticker: null, genre: 'deco', w: 300, flat: true },
  // コースのシール
  { id: 'ball', name: 'ボール', sticker: 'c1', genre: 'toy', w: 64, motion: 'roll' },
  { id: 'cushion', name: 'クッション', sticker: 'c2', genre: 'deco', w: 90 },
  { id: 'bed', name: 'ベッド', sticker: 'c3', genre: 'furniture', w: 290, seats: [{ x: -40, y: -70 }, { x: 60, y: -70 }] },
  { id: 'flowerpot', name: 'はなの はちうえ', sticker: 'c4', genre: 'deco', w: 80, motion: 'sway' },
  { id: 'present', name: 'プレゼント', sticker: 'c5', genre: 'toy', w: 90 },
  { id: 'cake', name: 'ケーキ', sticker: 'c6', genre: 'food', w: 90 },
  { id: 'moonlamp', name: 'おつきさまの ランプ', sticker: 'c7', genre: 'deco', w: 90, motion: 'bob' },
  { id: 'fishtank', name: 'すいそう', sticker: 'c8', genre: 'animal', w: 150, motion: 'swim' },
  { id: 'swing', name: 'ブランコ', sticker: 'c9', genre: 'toy', w: 260, seats: [{ x: 0, y: -62 }], motion: 'swing' },
  { id: 'puppy', name: 'こいぬ', sticker: 'c10', genre: 'animal', w: 120, motion: 'walk' },
  // 見つけた回数のシール
  { id: 'plant', name: 'うえき', sticker: 'f10', genre: 'deco', w: 100, motion: 'sway' },
  { id: 'breadbasket', name: 'パンの かご', sticker: 'f30', genre: 'food', w: 100 },
  { id: 'heartcushion', name: 'ハートの クッション', sticker: 'f60', genre: 'deco', w: 90 },
  { id: 'balloon', name: 'ふうせん', sticker: 'f100', genre: 'toy', w: 80, motion: 'bob' },
  { id: 'starmobile', name: 'ほしの メリー', sticker: 'f150', genre: 'deco', w: 110, motion: 'sway' },
  // うみべパック
  { id: 'shell', name: 'かいがら', sticker: 'b1', genre: 'deco', w: 70 },
  { id: 'floatring', name: 'うきわ', sticker: 'b10', genre: 'toy', w: 120 },
  { id: 'beachball', name: 'ビーチボール', sticker: 'b30', genre: 'toy', w: 80, motion: 'roll' },
  // きのこの もりパック
  { id: 'camp-tent', name: 'キャンプテント', sticker: null, genre: 'furniture', content: 'scene:forest', w: 280, seats: [{ x: 0, y: -50 }] },
  { id: 'stump-chair', name: 'きりかぶの いす', sticker: 'f-s1', genre: 'furniture', w: 120, seats: [{ x: 0, y: -55 }] },
  { id: 'acorn-lamp', name: 'どんぐりランプ', sticker: 'f-s5', genre: 'deco', w: 90, motion: 'bob' },
  { id: 'mushroom-table', name: 'きのこの つくえ', sticker: 'f-s15', genre: 'furniture', w: 170 },
  { id: 'campfire-pot', name: 'たきびの なべ', sticker: 'f-s30', genre: 'food', w: 140, motion: 'sway' },
  { id: 'squirrel', name: 'りす', sticker: 'f-s50', genre: 'animal', w: 110, motion: 'walk' },
  // すいぞくかんパック
  { id: 'shell-sofa', name: 'かいがらの ソファ', sticker: null, genre: 'furniture', content: 'scene:aquarium', w: 280, seats: [{ x: -58, y: -60 }, { x: 58, y: -60 }] },
  { id: 'coral-rug', name: 'さんごの ラグ', sticker: 'a-s1', genre: 'deco', w: 290, flat: true },
  { id: 'jelly-lamp', name: 'くらげの ランプ', sticker: 'a-s5', genre: 'deco', w: 96, motion: 'bob' },
  { id: 'dolphin-ride', name: 'イルカの のりもの', sticker: 'a-s15', genre: 'toy', w: 180, seats: [{ x: 0, y: -64 }], motion: 'sway' },
  { id: 'treasure-box', name: 'たからばこ', sticker: 'a-s30', genre: 'toy', w: 130 },
  { id: 'penguin', name: 'ペンギン', sticker: 'a-s50', genre: 'animal', w: 100, motion: 'walk' },
  // おばけやしき パック
  { id: 'gothic-sofa', name: 'おやしきの ソファ', sticker: null, genre: 'furniture', content: 'scene:haunted', w: 280, seats: [{ x: -58, y: -60 }, { x: 58, y: -60 }] },
  { id: 'star-rug', name: 'ほしぞらの ラグ', sticker: 'h-s1', genre: 'deco', w: 290, flat: true },
  { id: 'pumpkin-lantern', name: 'かぼちゃ ランタン', sticker: 'h-s5', genre: 'deco', w: 96, motion: 'sway' },
  { id: 'music-box', name: 'ほしの オルゴール', sticker: 'h-s15', genre: 'toy', w: 130, motion: 'sway' },
  { id: 'ghost-chair', name: 'おばけの ゆりいす', sticker: 'h-s30', genre: 'furniture', w: 160, seats: [{ x: 0, y: -62 }], motion: 'sway' },
  { id: 'ghost-plush', name: 'ふわふわ おばけ', sticker: 'h-s50', genre: 'toy', w: 100, motion: 'bob' },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export interface ProgressLike {
  cleared: number;
  totalFinds: number;
  sceneFinds?: Partial<Record<SceneId, number>>;
}

/** いま使える もの（シールを持っていて、そのシールのパックも遊べる） */
export function ownedItems(p: ProgressLike, can: CanPlay): ItemDef[] {
  return ITEMS.filter((it) => {
    if (!it.sticker) return !it.content || can(it.content);
    const s = STICKERS.find((x) => x.id === it.sticker);
    if (!s || !can(`char:${s.char}`)) return false;
    if (s.kind === 'course' && !can(`course:${s.need}`)) return false;
    if (s.kind === 'scene' && s.scene && !can(`scene:${s.scene}`)) return false;
    return hasSticker(s, p.cleared, p.totalFinds, p.sceneFinds);
  });
}

/** シールでもらえる もの（シールちょう・ごほうびの告知で使う） */
export function itemForSticker(stickerId: string): ItemDef | undefined {
  return ITEMS.find((i) => i.sticker === stickerId);
}

export function openRooms(cleared: number, can: CanPlay, sceneFinds: Partial<Record<SceneId, number>> = {}): RoomDef[] {
  return ROOMS.filter((r) => can(r.content) && cleared >= r.needCleared && (!r.needScene || (sceneFinds[r.needScene] ?? 0) >= 1));
}

/**
 * 置いてある部屋（同じ友だち・物は1つの部屋にだけ置ける。先に並ぶ部屋が優先）。
 * open を渡すと、開いている部屋だけを見る（閉じた部屋＝パックが使えない部屋に取り残された物は、ほかで使える）。
 */
export function ownerRooms(layouts: RoomLayouts, open?: readonly RoomId[]): Map<string, RoomId> {
  const m = new Map<string, RoomId>();
  for (const r of ROOMS) {
    if (open && !open.includes(r.id)) continue;
    for (const p of layouts[r.id] ?? []) if (!m.has(p.ref)) m.set(p.ref, r.id);
  }
  return m;
}

/** 置き方から ref を取りのぞく（座っていた子は床に下ろし、座席の番号を つめる） */
export function removeRef(list: readonly Placed[], ref: string): Placed[] {
  const i = list.findIndex((p) => p.ref === ref);
  if (i < 0) return list.map((p) => ({ ...p }));
  return list
    .filter((_, j) => j !== i)
    .map((p) => {
      const q: Placed = { ...p };
      if (q.on) {
        if (q.on.idx === i) delete q.on;
        else if (q.on.idx > i) q.on = { idx: q.on.idx - 1, seat: q.on.seat };
      }
      return q;
    });
}

/** 奥ほど小さく（遠近） */
export function depthScale(room: RoomDef, y: number): number {
  const t = Math.min(1, Math.max(0, (y - room.floorTop) / (1000 - room.floorTop)));
  return room.scaleBack + (room.scaleFront - room.scaleBack) * t;
}

// ---- 置いたもの（保存する形）

export interface Placed {
  /** 'item:sofa' / 'char:koro' */
  ref: string;
  x: number;
  y: number;
  flip?: boolean;
  /** 座っている もの（その Placed の番号）と座席の番号 */
  on?: { idx: number; seat: number };
}

export type RoomLayouts = Partial<Record<RoomId, Placed[]>>;

export const MAX_PLACED = 40;

/** はじめて開いたときの部屋（からっぽだと何をすればいいか分からないので、少し置いておく） */
export function starterLayout(room: RoomId): Placed[] {
  // ころ は さいしょから ソファに すわっている（すわれることが 見て分かるように）
  if (room === 'living') return [{ ref: 'item:rug', x: 520, y: 900 }, { ref: 'item:sofa', x: 470, y: 690 }, { ref: 'item:table', x: 520, y: 900 }, { ref: 'char:koro', x: 410, y: 600, on: { idx: 1, seat: 0 } }];
  // しんしつ：ベッド（コース3で とどいている）
  if (room === 'bedroom') return [{ ref: 'item:bed', x: 500, y: 760 }];
  if (room === 'yard') return [{ ref: 'item:camp-tent', x: 260, y: 720 }];
  if (room === 'aquarium-room') return [{ ref: 'item:shell-sofa', x: 280, y: 720 }];
  if (room === 'attic') return [{ ref: 'item:gothic-sofa', x: 280, y: 720 }];
  // ひみつきち は からっぽから（何を置くかを自分で決める）
  return [];
}

/** 置き場所を床の中に収める */
export function clampToFloor(room: RoomDef, x: number, y: number): { x: number; y: number } {
  return { x: Math.min(960, Math.max(40, x)), y: Math.min(985, Math.max(room.floorTop, y)) };
}

/**
 * 保存データの検査：壊れていたら、その部屋だけ消す。
 * 同じ物は1つだけ・座標は部屋の中・座れるのは「友だち」が「座席のある物（それ自体は座っていない）」の「実在する空いた座席」だけ。
 */
export function validLayouts(v: unknown, charIds: readonly CharacterId[]): RoomLayouts {
  const out: RoomLayouts = {};
  if (typeof v !== 'object' || v === null) return out;
  for (const r of ROOMS) {
    const arr = (v as Record<string, unknown>)[r.id];
    if (!Array.isArray(arr) || arr.length > MAX_PLACED) continue;
    const refs = new Set<string>();
    const shape = arr.every((p) => {
      if (typeof p !== 'object' || p === null) return false;
      const o = p as Record<string, unknown>;
      if (typeof o.ref !== 'string' || refs.has(o.ref)) return false;
      refs.add(o.ref);
      const m = /^(item|char):([a-z0-9-]+)$/.exec(o.ref);
      if (!m || (m[1] === 'item' ? !ITEM_BY_ID[m[2]] : !charIds.includes(m[2] as CharacterId))) return false;
      if (typeof o.x !== 'number' || typeof o.y !== 'number' || !(o.x >= 0 && o.x <= 1000 && o.y >= 0 && o.y <= 1000)) return false;
      if (o.flip !== undefined && typeof o.flip !== 'boolean') return false;
      return true;
    });
    if (!shape) continue;
    const list = arr as Placed[];
    const used = new Set<string>();
    const seats = list.every((p, i) => {
      if (p.on === undefined) return true;
      const on = p.on as unknown as Record<string, unknown>;
      if (typeof on !== 'object' || on === null || !Number.isInteger(on.idx) || !Number.isInteger(on.seat)) return false;
      const idx = on.idx as number;
      const seat = on.seat as number;
      if (!p.ref.startsWith('char:') || idx < 0 || idx >= list.length || idx === i) return false;
      const base = list[idx];
      const it = base.ref.startsWith('item:') ? ITEM_BY_ID[base.ref.slice(5)] : undefined;
      if (!it?.seats || base.on !== undefined || seat < 0 || seat >= it.seats.length) return false;
      const key = idx + ':' + seat;
      if (used.has(key)) return false;
      used.add(key);
      return true;
    });
    if (seats) out[r.id] = list;
  }
  return out;
}
