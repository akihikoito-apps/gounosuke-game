import type { SceneDef, SceneId } from '../scene';
import { room } from './room';
import { garden } from './garden';
import { shop } from './shop';
import { beach } from './beach';
import { forest } from './forest';
import { aquarium } from './aquarium';

export const SCENES: Record<SceneId, SceneDef> = { room, garden, shop, beach, forest, aquarium };
export const SCENE_IDS: SceneId[] = ['room', 'garden', 'shop', 'beach', 'forest', 'aquarium'];
