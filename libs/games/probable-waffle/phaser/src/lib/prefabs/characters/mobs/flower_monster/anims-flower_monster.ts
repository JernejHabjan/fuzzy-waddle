import type { AnimationDefinitionMap } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-definition-map";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";

const ATTACK_1_E = "mobs_flower_monster_attack 1/e";
const ATTACK_1_N = "mobs_flower_monster_attack 1/n";
const ATTACK_1_S = "mobs_flower_monster_attack 1/s";
const ATTACK_1_W = "mobs_flower_monster_attack 1/w";
const ATTACK_2_E = "mobs_flower_monster_attack 2/e";
const ATTACK_2_N = "mobs_flower_monster_attack 2/n";
const ATTACK_2_S = "mobs_flower_monster_attack 2/s";
const ATTACK_2_W = "mobs_flower_monster_attack 2/w";
const BASE_E = "mobs_flower_monster_base/e";
const BASE_N = "mobs_flower_monster_base/n";
const BASE_S = "mobs_flower_monster_base/s";
const BASE_W = "mobs_flower_monster_base/w";
const DEATH_E = "mobs_flower_monster_death/e";
const DEATH_N = "mobs_flower_monster_death/n";
const DEATH_S = "mobs_flower_monster_death/s";
const DEATH_W = "mobs_flower_monster_death/w";
const GROW_E = "mobs_flower_monster_grow/e";
const GROW_N = "mobs_flower_monster_grow/n";
const GROW_S = "mobs_flower_monster_grow/s";
const GROW_W = "mobs_flower_monster_grow/w";
const HIT_E = "mobs_flower_monster_hit/e";
const HIT_N = "mobs_flower_monster_hit/n";
const HIT_S = "mobs_flower_monster_hit/s";
const HIT_W = "mobs_flower_monster_hit/w";
const IDLE_E = "mobs_flower_monster_idle/e";
const IDLE_N = "mobs_flower_monster_idle/n";
const IDLE_S = "mobs_flower_monster_idle/s";
const IDLE_W = "mobs_flower_monster_idle/w";
const PLANT_SHOT = "mobs_flower_monster_plant shot";

export enum FlowerMonsterAnimationTypes {
  AttackStomp = "AttackStomp",
  AttackSpit = "AttackSpit",
  ShrunkenDown = "ShrunkenDown",
  Grow = "Grow",
  Shoot = "Shoot"
}

export const ANIM_FLOWER_MONSTER_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
  },
  [FlowerMonsterAnimationTypes.ShrunkenDown]: {
    // todo use this
    south: { key: BASE_S },
    north: { key: BASE_N },
    west: { key: BASE_W },
    east: { key: BASE_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [AnimationType.Damage]: {
    south: { key: HIT_S },
    north: { key: HIT_N },
    west: { key: HIT_W },
    east: { key: HIT_E }
  },
  [FlowerMonsterAnimationTypes.AttackStomp]: {
    south: { key: ATTACK_1_S },
    north: { key: ATTACK_1_N },
    west: { key: ATTACK_1_W },
    east: { key: ATTACK_1_E }
  },
  [FlowerMonsterAnimationTypes.AttackSpit]: {
    south: { key: ATTACK_2_S },
    north: { key: ATTACK_2_N },
    west: { key: ATTACK_2_W },
    east: { key: ATTACK_2_E }
  },
  [FlowerMonsterAnimationTypes.Grow]: {
    // todo use this
    south: { key: GROW_S },
    north: { key: GROW_N },
    west: { key: GROW_W },
    east: { key: GROW_E }
  },
  [FlowerMonsterAnimationTypes.Shoot]: {
    south: { key: PLANT_SHOT },
    north: { key: PLANT_SHOT },
    west: { key: PLANT_SHOT },
    east: { key: PLANT_SHOT }
  }
};
