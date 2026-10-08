// 絵の検査・ガイド作成用に、ゲームと同じ形状データを Node から使えるようにする入口
export { SCENES, SCENE_IDS } from '../../src/core/scenes';
export { CHARACTERS, CHARACTER_IDS, BODY, characterMarkup } from '../../src/core/characters';
export { LIMITS, silhouetteWorld, spotTransform, spotAnchor, regionAt } from '../../src/core/placement';
export { contains, samplePoints, transformPt, transformShape, shapeToSvg, distanceTo } from '../../src/core/geometry';
export { patternMarkup } from '../../src/core/patterns';
export const CHAR_FRAME = { x: -90, y: -225, w: 180, h: 240 };
export { hatShapes, umbrellaShapes, HAT_POLY, HAT_POMPOM, UMBRELLA_CANOPY, UMBRELLA_SHAFT } from '../../src/core/accessories';
/** 帽子・傘の絵の枠（src/art/registry.ts の ACC_FRAME と同じ値） */
export const ACC_FRAME = { x: -150, y: -345, w: 300, h: 360 };
