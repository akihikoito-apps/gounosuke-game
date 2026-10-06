import type { Shape } from './geometry';
import type { PatternKind, PatternSpec } from './patterns';
import type { Prop } from './props';

export type SceneId = 'room' | 'garden' | 'shop';

export interface CostumeDef {
  id: string;
  kind: PatternKind;
  spec: PatternSpec;
}

/** 柄が分かっている背景の領域。配列の順に塗る（後ろほど上）。 */
export interface RegionDef {
  id: string;
  costume: string;
  shapes: Shape[];
}

/** あらかじめ検証した隠れ場所。 */
export interface SpotDef {
  id: string;
  /** キャラクターの足もと */
  x: number;
  y: number;
  /** 大きさ */
  s: number;
  /** 背中側に見える柄の領域 */
  region: string;
  /** 前に置く小物 */
  prop: Prop;
  /** 「やさしい」でも使う（顔とからだが見えやすい） */
  easy: boolean;
}

export interface SceneDef {
  id: SceneId;
  name: string;
  costumes: CostumeDef[];
  regions: RegionDef[];
  spots: SpotDef[];
  /** 領域より先に塗る土台（空など） */
  base: string;
  /** 領域の上に塗る飾り（キャラクターより後ろ） */
  decor: string;
  /** 小さい画面では省く飾り */
  minorDecor: string;
  /** 飾り用の追加の defs。id は {P} を接頭辞にする */
  extraDefs: string;
}
