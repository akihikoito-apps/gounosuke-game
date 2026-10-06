// 絵の検査・ガイド作成用に、ゲームと同じ形状データを Node から使えるようにする入口
export { SCENES, SCENE_IDS } from '../../src/core/scenes';
export { CHARACTERS, CHARACTER_IDS, BODY, characterMarkup } from '../../src/core/characters';
export { LIMITS, silhouetteWorld, spotTransform, spotAnchor, regionAt } from '../../src/core/placement';
export { contains, samplePoints, transformPt, transformShape, shapeToSvg, distanceTo } from '../../src/core/geometry';
export { patternMarkup } from '../../src/core/patterns';
export const CHAR_FRAME = { x: -90, y: -225, w: 180, h: 240 };
