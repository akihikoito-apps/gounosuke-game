import type { SceneDef, SceneId } from '../scene';
import { room } from './room';
import { garden } from './garden';
import { shop } from './shop';

export const SCENES: Record<SceneId, SceneDef> = { room, garden, shop };
export const SCENE_IDS: SceneId[] = ['room', 'garden', 'shop'];
