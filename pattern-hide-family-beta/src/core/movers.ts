// うごくもの：コースが進むと、背景に 鳥・雲・子犬 などが動く（ご本人の要望 2026-10-15）。
// 目を引いて、探すのを少し難しくする。後半は友だちの前を一瞬だけ横切る（ずっと隠しはしない）。
// タップは さえぎらない（うごくものの上から押しても、うしろの友だちが見つかる）。
import { type Rng, mulberry32, shuffle } from './rng';
import type { SceneId } from './scene';

export type MoverKind =
  | 'bird'
  | 'butterfly'
  | 'cloud'
  | 'cat'
  | 'puppy'
  | 'balloon'
  | 'seagull'
  | 'sailboat'
  | 'crab'
  | 'ball'
  | 'squirrel'
  | 'owl'
  | 'falling-leaf'
  | 'tropical-fish'
  | 'jellyfish'
  | 'penguin'
  | 'bubble'
  | 'firefly'
  | 'frog'
  | 'dragonfly'
  | 'floating-lantern'
  | 'brachio'
  | 'pteranodon'
  | 'tricera'
  | 'stegosaur'
  | 'mini-raptor';
/** cross：端から端へ通りぬけて、また最初から / patrol：行って もどる（向きを変える） */
export type MoverMove = 'cross' | 'patrol';

export interface MoverDef {
  id: string;
  kind: MoverKind;
  move: MoverMove;
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 片道の秒数 */
  sec: number;
  scale: number;
  /** front：友だちの前を通る（後半のコースだけ） */
  layer: 'back' | 'front';
  /** 窓の中だけに見せる など */
  clip?: { x: number; y: number; w: number; h: number };
}

const WIN = { x: 262, y: 92, w: 226, h: 206 };

export const MOVERS: Record<SceneId, MoverDef[]> = {
  room: [
    { id: 'room-bird', kind: 'bird', move: 'cross', from: { x: 200, y: 200 }, to: { x: 560, y: 160 }, sec: 9, scale: 0.75, layer: 'back', clip: WIN },
    { id: 'room-cloud', kind: 'cloud', move: 'cross', from: { x: 130, y: 210 }, to: { x: 640, y: 210 }, sec: 30, scale: 0.69, layer: 'back', clip: WIN },
    { id: 'room-cat', kind: 'cat', move: 'patrol', from: { x: -90, y: 900 }, to: { x: 1090, y: 900 }, sec: 16, scale: 1.12, layer: 'front' },
    { id: 'room-ball', kind: 'ball', move: 'patrol', from: { x: -90, y: 830 }, to: { x: 1090, y: 830 }, sec: 7, scale: 1.12, layer: 'front' },
    { id: 'room-butterfly', kind: 'butterfly', move: 'patrol', from: { x: -90, y: 450 }, to: { x: 1090, y: 380 }, sec: 11, scale: 1.05, layer: 'front' },
  ],
  garden: [
    { id: 'garden-cloud', kind: 'cloud', move: 'cross', from: { x: -150, y: 110 }, to: { x: 1150, y: 110 }, sec: 40, scale: 1.26, layer: 'back' },
    { id: 'garden-bird', kind: 'bird', move: 'cross', from: { x: -80, y: 230 }, to: { x: 1080, y: 170 }, sec: 12, scale: 1.12, layer: 'back' },
    { id: 'garden-butterfly', kind: 'butterfly', move: 'patrol', from: { x: -90, y: 520 }, to: { x: 1090, y: 600 }, sec: 12, scale: 1.12, layer: 'front' },
    { id: 'garden-puppy', kind: 'puppy', move: 'patrol', from: { x: -90, y: 850 }, to: { x: 1090, y: 850 }, sec: 15, scale: 1.19, layer: 'front' },
    { id: 'garden-butterfly2', kind: 'butterfly', move: 'patrol', from: { x: 1090, y: 860 }, to: { x: -90, y: 830 }, sec: 14, scale: 0.98, layer: 'front' },
  ],
  shop: [
    { id: 'shop-balloon', kind: 'balloon', move: 'cross', from: { x: 600, y: 1100 }, to: { x: 680, y: -60 }, sec: 18, scale: 1.12, layer: 'back' },
    { id: 'shop-balloon2', kind: 'balloon', move: 'cross', from: { x: 330, y: 1100 }, to: { x: 260, y: -60 }, sec: 22, scale: 0.98, layer: 'back' },
    { id: 'shop-puppy', kind: 'puppy', move: 'patrol', from: { x: -90, y: 920 }, to: { x: 1090, y: 920 }, sec: 15, scale: 1.19, layer: 'front' },
    { id: 'shop-cat', kind: 'cat', move: 'patrol', from: { x: 1090, y: 770 }, to: { x: -90, y: 770 }, sec: 17, scale: 1.05, layer: 'front' },
    { id: 'shop-butterfly', kind: 'butterfly', move: 'patrol', from: { x: -90, y: 520 }, to: { x: 1090, y: 540 }, sec: 12, scale: 0.98, layer: 'front' },
  ],
  beach: [
    { id: 'beach-cloud', kind: 'cloud', move: 'cross', from: { x: -150, y: 90 }, to: { x: 1150, y: 90 }, sec: 40, scale: 1.26, layer: 'back' },
    { id: 'beach-sailboat', kind: 'sailboat', move: 'patrol', from: { x: 380, y: 410 }, to: { x: 640, y: 410 }, sec: 24, scale: 0.84, layer: 'back' },
    { id: 'beach-seagull', kind: 'seagull', move: 'cross', from: { x: -100, y: 200 }, to: { x: 1100, y: 140 }, sec: 11, scale: 1.12, layer: 'back' },
    { id: 'beach-crab', kind: 'crab', move: 'patrol', from: { x: -90, y: 850 }, to: { x: 1090, y: 850 }, sec: 14, scale: 1.19, layer: 'front' },
    { id: 'beach-seagull2', kind: 'seagull', move: 'cross', from: { x: 1100, y: 600 }, to: { x: -100, y: 520 }, sec: 10, scale: 1.05, layer: 'front' },
  ],
  forest: [
    { id: 'forest-cloud', kind: 'cloud', move: 'cross', from: { x: -150, y: 80 }, to: { x: 1150, y: 80 }, sec: 42, scale: 1.15, layer: 'back' },
    { id: 'forest-owl', kind: 'owl', move: 'cross', from: { x: 1100, y: 180 }, to: { x: -100, y: 140 }, sec: 13, scale: 1.05, layer: 'back' },
    { id: 'forest-squirrel', kind: 'squirrel', move: 'patrol', from: { x: -90, y: 860 }, to: { x: 1090, y: 860 }, sec: 14, scale: 1.15, layer: 'front' },
    { id: 'forest-leaf', kind: 'falling-leaf', move: 'cross', from: { x: 240, y: -40 }, to: { x: 760, y: 1060 }, sec: 11, scale: 1.0, layer: 'front' },
    { id: 'forest-butterfly', kind: 'butterfly', move: 'patrol', from: { x: 1090, y: 540 }, to: { x: -90, y: 580 }, sec: 13, scale: 1.05, layer: 'front' },
  ],
  aquarium: [
    { id: 'aquarium-fish', kind: 'tropical-fish', move: 'cross', from: { x: -120, y: 180 }, to: { x: 1120, y: 150 }, sec: 15, scale: 1.1, layer: 'back' },
    { id: 'aquarium-jelly', kind: 'jellyfish', move: 'patrol', from: { x: 180, y: 240 }, to: { x: 820, y: 200 }, sec: 22, scale: 1.05, layer: 'back' },
    { id: 'aquarium-penguin', kind: 'penguin', move: 'patrol', from: { x: -90, y: 860 }, to: { x: 1090, y: 860 }, sec: 14, scale: 1.15, layer: 'front' },
    { id: 'aquarium-bubble', kind: 'bubble', move: 'cross', from: { x: 240, y: 1060 }, to: { x: 760, y: -40 }, sec: 12, scale: 1.0, layer: 'front' },
    { id: 'aquarium-fish2', kind: 'tropical-fish', move: 'patrol', from: { x: 1090, y: 580 }, to: { x: -90, y: 600 }, sec: 13, scale: 1.0, layer: 'front' },
  ],
  night: [
    { id: 'night-firefly1', kind: 'firefly', move: 'cross', from: { x: -120, y: 170 }, to: { x: 1120, y: 140 }, sec: 14, scale: 1.1, layer: 'back' },
    { id: 'night-dragonfly', kind: 'dragonfly', move: 'patrol', from: { x: 180, y: 240 }, to: { x: 820, y: 200 }, sec: 18, scale: 1.05, layer: 'back' },
    { id: 'night-frog', kind: 'frog', move: 'patrol', from: { x: -90, y: 860 }, to: { x: 1090, y: 860 }, sec: 14, scale: 1.15, layer: 'front' },
    { id: 'night-firefly2', kind: 'firefly', move: 'cross', from: { x: 240, y: 1060 }, to: { x: 760, y: -40 }, sec: 12, scale: 1.0, layer: 'front' },
    { id: 'night-lantern', kind: 'floating-lantern', move: 'patrol', from: { x: 1090, y: 548 }, to: { x: -90, y: 556 }, sec: 14, scale: 1.0, layer: 'front' },
  ],
  dino: [
    { id: 'dino-brachio', kind: 'brachio', move: 'patrol', from: { x: -200, y: 455 }, to: { x: 1200, y: 455 }, sec: 26, scale: 1.8, layer: 'back' },
    { id: 'dino-ptera', kind: 'pteranodon', move: 'cross', from: { x: 1160, y: 175 }, to: { x: -160, y: 135 }, sec: 15, scale: 1.4, layer: 'back' },
    { id: 'dino-tricera', kind: 'tricera', move: 'patrol', from: { x: -120, y: 615 }, to: { x: 1120, y: 615 }, sec: 14, scale: 1.1, layer: 'front' },
    { id: 'dino-stego', kind: 'stegosaur', move: 'patrol', from: { x: 1120, y: 855 }, to: { x: -120, y: 855 }, sec: 15, scale: 1.1, layer: 'front' },
    { id: 'dino-raptor', kind: 'mini-raptor', move: 'cross', from: { x: -110, y: 740 }, to: { x: 1110, y: 760 }, sec: 9, scale: 1.05, layer: 'front' },
  ],
};

/** かくして わたす で、隠す人が選べる うごくもの の数 */
export const HIDE_MOVERS_MAX = 3;

export const MOVER_NAMES: Record<MoverKind, string> = {
  bird: 'ことり',
  butterfly: 'ちょうちょ',
  cloud: 'くも',
  cat: 'ねこ',
  puppy: 'こいぬ',
  balloon: 'ふうせん',
  seagull: 'かもめ',
  sailboat: 'ヨット',
  crab: 'かに',
  ball: 'ボール',
  squirrel: 'りす',
  owl: 'ふくろう',
  'falling-leaf': 'はっぱ',
  'tropical-fish': 'さかな',
  jellyfish: 'くらげ',
  penguin: 'ペンギン',
  bubble: 'あわ',
  firefly: 'ほたる',
  frog: 'かえる',
  dragonfly: 'とんぼ',
  'floating-lantern': 'とうろうぶね',
  brachio: 'くびながりゅう',
  pteranodon: 'よくりゅう',
  tricera: 'つのりゅう',
  stegosaur: 'せびれりゅう',
  'mini-raptor': 'ちびきょうりゅう',
};

/** コースごとの うごくものの数（コース1は なし） */
export const COURSE_MOVERS = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5];
/** このコースから、友だちの前を通るもの も出る */
export const FRONT_FROM_COURSE = 6;

/** コース no の1回分に出す うごくもの（シードが同じなら同じ） */
export function pickMovers(scene: SceneId, courseNo: number, seed: number): MoverDef[] {
  const n = COURSE_MOVERS[Math.min(COURSE_MOVERS.length, Math.max(1, courseNo)) - 1];
  if (!n) return [];
  const rng: Rng = mulberry32(seed ^ 0x5eed);
  const list = MOVERS[scene];
  const back = shuffle(rng, list.filter((m) => m.layer === 'back'));
  const front = courseNo >= FRONT_FROM_COURSE ? shuffle(rng, list.filter((m) => m.layer === 'front')) : [];
  // 前半は うしろの物だけ。後半は 前を通る物を先に1つ以上
  const order = courseNo >= FRONT_FROM_COURSE ? [front[0], ...back, ...front.slice(1)] : back;
  return order.filter(Boolean).slice(0, n) as MoverDef[];
}

/** 「じゆうに さがす」の1回分に出す うごくもの（やさしい＝後ろ2〜3個、ふつう＝前も入れて4〜5個） */
export function pickSearchMovers(scene: SceneId, difficulty: 'easy' | 'normal', seed: number): MoverDef[] {
  const rng: Rng = mulberry32(seed ^ 0x5eed);
  const list = MOVERS[scene];
  const back = shuffle(rng, list.filter((m) => m.layer === 'back'));
  if (difficulty === 'easy') {
    return back.slice(0, 3);
  }
  const front = shuffle(rng, list.filter((m) => m.layer === 'front'));
  const n = rng() < 0.5 ? 4 : 5;
  const order = [front[0], ...back, ...front.slice(1)];
  return order.filter(Boolean).slice(0, n) as MoverDef[];
}

/** その時刻（秒）での位置。テストと、うしろの友だちを長く隠さないことの確認に使う */
export function moverPos(m: MoverDef, t: number): { x: number; y: number } {
  const period = m.move === 'patrol' ? m.sec * 2 : m.sec;
  let u = (((t % period) + period) % period) / m.sec;
  if (m.move === 'patrol' && u > 1) u = 2 - u;
  return { x: m.from.x + (m.to.x - m.from.x) * u, y: m.from.y + (m.to.y - m.from.y) * u };
}
