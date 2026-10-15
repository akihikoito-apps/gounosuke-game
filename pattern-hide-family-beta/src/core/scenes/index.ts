import type { SceneDef, SceneId } from '../scene';
import { room } from './room';
import { garden } from './garden';
import { shop } from './shop';
import { beach } from './beach';
import { forest } from './forest';
import { aquarium } from './aquarium';
import { haunted } from './haunted';

export const SCENES: Record<SceneId, SceneDef> = { room, garden, shop, beach, forest, aquarium, haunted };
export const SCENE_IDS: SceneId[] = ['room', 'garden', 'shop', 'beach', 'forest', 'aquarium', 'haunted'];
