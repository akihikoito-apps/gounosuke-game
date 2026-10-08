import type { SceneDef, SceneId } from '../scene';
import { room } from './room';
import { garden } from './garden';
import { shop } from './shop';
import { beach } from './beach';

export const SCENES: Record<SceneId, SceneDef> = { room, garden, shop, beach };
export const SCENE_IDS: SceneId[] = ['room', 'garden', 'shop', 'beach'];
