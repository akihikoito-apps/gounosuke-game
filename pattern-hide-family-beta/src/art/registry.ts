// 差し替え用の絵（art/ フォルダ）を読む窓口。
// ファイルが無ければ、コードで描いた既定の絵を使う（ゲームは必ず動く）。
// 置き場所・寸法の決まりは ART_SLOTS.md を参照。
import type { CharacterId } from '../core/characters';
import type { SceneId } from '../core/scene';

const files = import.meta.glob('../../art/{characters,scenes,patterns,ui}/**/*.{png,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const EXT = ['webp', 'png', 'svg'];

function find(dir: string, name: string): string | undefined {
  for (const e of EXT) {
    const u = files[`../../art/${dir}/${name}.${e}`];
    if (u) return u;
  }
  return undefined;
}

/** キャラクターの絵の枠（ローカル座標）。画像は 450×600px（2.5倍）を基準にする */
export const CHAR_FRAME = { x: -90, y: -225, w: 180, h: 240 };

export interface CharacterArt {
  /** 服より後ろ（足・背中側の髪など） */
  back?: string;
  /** 服の形（白＝服）。ここにゲームの柄を流し込む */
  clothesMask: string;
  /** 服の陰影（乗算）。任意 */
  clothesShade?: string;
  /** 服のふち線。難易度で濃さを変える */
  clothesLine?: string;
  /** 服より前（顔・手・線） */
  front: string;
  /** 見つかった時の前面（手をふる）。無ければ front */
  frontFound?: string;
}

export function characterArt(id: CharacterId): CharacterArt | null {
  const d = `characters/${id}`;
  const clothesMask = find(d, 'clothes-mask');
  const front = find(d, 'front');
  if (!clothesMask || !front) return null;
  return {
    back: find(d, 'back'),
    clothesMask,
    clothesShade: find(d, 'clothes-shade'),
    clothesLine: find(d, 'clothes-line'),
    front,
    frontFound: find(d, 'front-found'),
  };
}

export interface SceneArt {
  /** 柄の領域より下（空・床・壁の質感など）1000×1000 */
  back?: string;
  /** 柄の領域の上・キャラクターの後ろ（家具の縁・陰影など）。透過 */
  over?: string;
  /** 小さい画面では省く飾り。透過 */
  minor?: string;
  /** 前景の小物すべて（キャラクターより前）。透過 */
  fore?: string;
}

export function sceneArt(id: SceneId): SceneArt | null {
  const d = `scenes/${id}`;
  const a: SceneArt = { back: find(d, 'back'), over: find(d, 'over'), minor: find(d, 'minor'), fore: find(d, 'fore') };
  return a.back || a.over || a.minor || a.fore ? a : null;
}

/** 柄のタイル（scene-costume）。正方形で、つなぎ目なく敷き詰められること */
export function patternTile(scene: SceneId, costume: string): string | undefined {
  return find('patterns', `${scene}-${costume}`);
}

export function uiArt(name: 'title' | 'handoff' | 'bye'): string | undefined {
  return find('ui', name);
}

export function artSummary(): string[] {
  return Object.keys(files).map((k) => k.replace('../../art/', ''));
}
