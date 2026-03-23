import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_E = "mobs_flower_monster_attack 1/e";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_N = "mobs_flower_monster_attack 1/n";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_S = "mobs_flower_monster_attack 1/s";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_W = "mobs_flower_monster_attack 1/w";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_E = "mobs_flower_monster_attack 2/e";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_N = "mobs_flower_monster_attack 2/n";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_S = "mobs_flower_monster_attack 2/s";
const ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_W = "mobs_flower_monster_attack 2/w";
const ANIM_MOBS_FLOWER_MONSTER_BASE_E = "mobs_flower_monster_base/e";
const ANIM_MOBS_FLOWER_MONSTER_BASE_N = "mobs_flower_monster_base/n";
const ANIM_MOBS_FLOWER_MONSTER_BASE_S = "mobs_flower_monster_base/s";
const ANIM_MOBS_FLOWER_MONSTER_BASE_W = "mobs_flower_monster_base/w";
const ANIM_MOBS_FLOWER_MONSTER_DEATH_E = "mobs_flower_monster_death/e";
const ANIM_MOBS_FLOWER_MONSTER_DEATH_N = "mobs_flower_monster_death/n";
const ANIM_MOBS_FLOWER_MONSTER_DEATH_S = "mobs_flower_monster_death/s";
const ANIM_MOBS_FLOWER_MONSTER_DEATH_W = "mobs_flower_monster_death/w";
const ANIM_MOBS_FLOWER_MONSTER_GROW_E = "mobs_flower_monster_grow/e";
const ANIM_MOBS_FLOWER_MONSTER_GROW_N = "mobs_flower_monster_grow/n";
const ANIM_MOBS_FLOWER_MONSTER_GROW_S = "mobs_flower_monster_grow/s";
const ANIM_MOBS_FLOWER_MONSTER_GROW_W = "mobs_flower_monster_grow/w";
const ANIM_MOBS_FLOWER_MONSTER_HIT_E = "mobs_flower_monster_hit/e";
const ANIM_MOBS_FLOWER_MONSTER_HIT_N = "mobs_flower_monster_hit/n";
const ANIM_MOBS_FLOWER_MONSTER_HIT_S = "mobs_flower_monster_hit/s";
const ANIM_MOBS_FLOWER_MONSTER_HIT_W = "mobs_flower_monster_hit/w";
const ANIM_MOBS_FLOWER_MONSTER_IDLE_E = "mobs_flower_monster_idle/e";
const ANIM_MOBS_FLOWER_MONSTER_IDLE_N = "mobs_flower_monster_idle/n";
const ANIM_MOBS_FLOWER_MONSTER_IDLE_S = "mobs_flower_monster_idle/s";
const ANIM_MOBS_FLOWER_MONSTER_IDLE_W = "mobs_flower_monster_idle/w";
const ANIM_MOBS_FLOWER_MONSTER_PLANT_SHOT = "mobs_flower_monster_plant shot";

export enum FlowerMonsterAnimationTypes {
  Attack1 = "Attack1",
  Attack2 = "Attack2",
  Grow = "Grow",
  PlantShot = "PlantShot"
}

export const ANIM_FLOWER_MONSTER_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_IDLE_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_IDLE_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_IDLE_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_BASE_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_BASE_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_BASE_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_BASE_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_DEATH_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_DEATH_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_DEATH_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_DEATH_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_HIT_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_HIT_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_HIT_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_HIT_E }
  },
  [FlowerMonsterAnimationTypes.Attack1]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_1_E }
  },
  [FlowerMonsterAnimationTypes.Attack2]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_ATTACK_2_E }
  },
  [FlowerMonsterAnimationTypes.Grow]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_GROW_S },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_GROW_N },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_GROW_W },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_GROW_E }
  },
  [FlowerMonsterAnimationTypes.PlantShot]: {
    south: { key: ANIM_MOBS_FLOWER_MONSTER_PLANT_SHOT },
    north: { key: ANIM_MOBS_FLOWER_MONSTER_PLANT_SHOT },
    west: { key: ANIM_MOBS_FLOWER_MONSTER_PLANT_SHOT },
    east: { key: ANIM_MOBS_FLOWER_MONSTER_PLANT_SHOT }
  }
};
