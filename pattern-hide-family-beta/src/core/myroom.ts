// じぶんの へや：仲間にした友だちと、シールでもらった「もの」を、好きな場所に置いて遊ぶ（おままごと）。
// 勝ち負け・時間制限・正解はない。コースで遊ぶほど、置ける もの と へや が増える。
// 座標は 1000×1000 の部屋の中。もの と 友だち は「足もと中央」を基準に置く（ゲームの他の画面と同じ単位）。
import type { ContentId } from '../entitlements/entitlements';
import type { CanPlay } from './access';
import type { CharacterId } from './characters';
import { STICKERS, hasSticker } from './stickers';
import type { SceneId } from './scene';

export type RoomId = 'living' | 'bedroom' | 'yard' | 'treehouse';
export type Motion = 'walk' | 'swing' | 'bob' | 'sway' | 'roll' | 'swim';

export interface RoomDef {
  id: RoomId;
  name: string;
  /** この部屋が開くクリア数（0：はじめから） */
  needCleared: number;
  /** どのパックの中身か */
  content: ContentId;
  /** 置ける床の範囲（足もとの y）。これより上には置けない */
  floorTop: number;
  /** 奥（floorTop）と手前（1000）での大きさ */
  scaleBack: number;
  scaleFront: number;
}

/** 無課金で遊べるのは 2部屋まで（リビング・しんしつ）。ほかは追加パックで増える（ご本人の方針 2026-10-15） */
export const ROOMS: RoomDef[] = [
  { id: 'living', name: 'リビング', needCleared: 0, content: 'room:living', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'bedroom', name: 'しんしつ', needCleared: 3, content: 'room:bedroom', floorTop: 580, scaleBack: 1.0, scaleFront: 1.5 },
  { id: 'yard', name: 'おにわ', needCleared: 6, content: 'room:yard', floorTop: 540, scaleBack: 0.95, scaleFront: 1.45 },
  { id: 'treehouse', name: 'ひみつきち', needCleared: 0, content: 'room:treehouse', floorTop: 560, scaleBack: 1.0, scaleFront: 1.5 },
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
  /** 床に敷くもの（いつも いちばん奥に描く） */
  flat?: boolean;
  /** 座れる場所（ソファ・ベッド・ブランコ） */
  seats?: Seat[];
  motion?: Motion;
}

// 絵の枠は全部同じ：viewBox "-150 -300 300 300"、足もと中央が (0, 0)。友だちと同じ大きさの単位で描く。
export const ITEMS: ItemDef[] = [
  // はじめから
  { id: 'sofa', name: 'ソファ', sticker: null, w: 280, seats: [{ x: -62, y: -62 }, { x: 62, y: -62 }] },
  { id: 'table', name: 'テーブル', sticker: null, w: 190 },
  { id: 'rug', name: 'ラグ', sticker: null, w: 300, flat: true },
  // コースのシール
  { id: 'ball', name: 'ボール', sticker: 'c1', w: 64, motion: 'roll' },
  { id: 'cushion', name: 'クッション', sticker: 'c2', w: 90 },
  { id: 'bed', name: 'ベッド', sticker: 'c3', w: 290, seats: [{ x: -40, y: -70 }, { x: 60, y: -70 }] },
  { id: 'flowerpot', name: 'はなの はちうえ', sticker: 'c4', w: 80, motion: 'sway' },
  { id: 'present', name: 'プレゼント', sticker: 'c5', w: 90 },
  { id: 'cake', name: 'ケーキ', sticker: 'c6', w: 90 },
  { id: 'moonlamp', name: 'おつきさまの ランプ', sticker: 'c7', w: 90, motion: 'bob' },
  { id: 'fishtank', name: 'すいそう', sticker: 'c8', w: 150, motion: 'swim' },
  { id: 'swing', name: 'ブランコ', sticker: 'c9', w: 260, seats: [{ x: 0, y: -62 }], motion: 'swing' },
  { id: 'puppy', name: 'こいぬ', sticker: 'c10', w: 120, motion: 'walk' },
  // 見つけた回数のシール
  { id: 'plant', name: 'うえき', sticker: 'f10', w: 100, motion: 'sway' },
  { id: 'breadbasket', name: 'パンの かご', sticker: 'f30', w: 100 },
  { id: 'heartcushion', name: 'ハートの クッション', sticker: 'f60', w: 90 },
  { id: 'balloon', name: 'ふうせん', sticker: 'f100', w: 80, motion: 'bob' },
  { id: 'starmobile', name: 'ほしの メリー', sticker: 'f150', w: 110, motion: 'sway' },
  // うみべパック
  { id: 'shell', name: 'かいがら', sticker: 'b1', w: 70 },
  { id: 'floatring', name: 'うきわ', sticker: 'b10', w: 120 },
  { id: 'beachball', name: 'ビーチボール', sticker: 'b30', w: 80, motion: 'roll' },
  // きのこの もりパック
  { id: 'camp-tent', name: 'キャンプテント', sticker: null, content: 'scene:forest', w: 280, seats: [{ x: 0, y: -50 }] },
  { id: 'stump-chair', name: 'きりかぶの いす', sticker: 'f-s1', w: 120, seats: [{ x: 0, y: -55 }] },
  { id: 'acorn-lamp', name: 'どんぐりランプ', sticker: 'f-s5', w: 90, motion: 'bob' },
  { id: 'mushroom-table', name: 'きのこの つくえ', sticker: 'f-s15', w: 170 },
  { id: 'campfire-pot', name: 'たきびの なべ', sticker: 'f-s30', w: 140, motion: 'sway' },
  { id: 'squirrel', name: 'りす', sticker: 'f-s50', w: 110, motion: 'walk' },
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

export function openRooms(cleared: number, can: CanPlay): RoomDef[] {
  return ROOMS.filter((r) => can(r.content) && cleared >= r.needCleared);
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
  if (room === 'living') return [{ ref: 'item:rug', x: 520, y: 900 }, { ref: 'item:sofa', x: 470, y: 690 }, { ref: 'item:table', x: 520, y: 900 }, { ref: 'char:koro', x: 830, y: 960 }];
  if (room === 'bedroom') return [{ ref: 'item:rug', x: 500, y: 900 }];
  if (room === 'treehouse') return [{ ref: 'item:camp-tent', x: 260, y: 720 }, { ref: 'char:koro', x: 640, y: 880 }];
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
