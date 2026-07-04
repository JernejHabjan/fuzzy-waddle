import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ATTACK_1_E = "mobs_snow_wendigo_attack 1/e";
const ATTACK_1_N = "mobs_snow_wendigo_attack 1/n";
const ATTACK_1_S = "mobs_snow_wendigo_attack 1/s";
const ATTACK_1_W = "mobs_snow_wendigo_attack 1/w";
const ATTACK_2_E = "mobs_snow_wendigo_attack 2/e";
const ATTACK_2_N = "mobs_snow_wendigo_attack 2/n";
const ATTACK_2_S = "mobs_snow_wendigo_attack 2/s";
const ATTACK_2_W = "mobs_snow_wendigo_attack 2/w";
const ATTACK_3_E = "mobs_snow_wendigo_attack 3/e";
const ATTACK_3_N = "mobs_snow_wendigo_attack 3/n";
const ATTACK_3_S = "mobs_snow_wendigo_attack 3/s";
const ATTACK_3_W = "mobs_snow_wendigo_attack 3/w";
const DEATH_E = "mobs_snow_wendigo_death/e";
const DEATH_N = "mobs_snow_wendigo_death/n";
const DEATH_S = "mobs_snow_wendigo_death/s";
const DEATH_W = "mobs_snow_wendigo_death/w";
const HIT_E = "mobs_snow_wendigo_hit/e";
const HIT_N = "mobs_snow_wendigo_hit/n";
const HIT_S = "mobs_snow_wendigo_hit/s";
const HIT_W = "mobs_snow_wendigo_hit/w";
const IDLE_E = "mobs_snow_wendigo_idle/e";
const IDLE_N = "mobs_snow_wendigo_idle/n";
const IDLE_S = "mobs_snow_wendigo_idle/s";
const IDLE_W = "mobs_snow_wendigo_idle/w";
const WALK_E = "mobs_snow_wendigo_walk/e";
const WALK_N = "mobs_snow_wendigo_walk/n";
const WALK_S = "mobs_snow_wendigo_walk/s";
const WALK_W = "mobs_snow_wendigo_walk/w";

export enum SnowWendigoAnimationTypes {
  Attack1 = "Attack1",
  Attack2 = "Attack2",
  Attack3 = "Attack3"
}

export const ANIM_SNOW_WENDIGO_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: WALK_S },
    north: { key: WALK_N },
    west: { key: WALK_W },
    east: { key: WALK_E }
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
  [SnowWendigoAnimationTypes.Attack1]: {
    south: { key: ATTACK_1_S },
    north: { key: ATTACK_1_N },
    west: { key: ATTACK_1_W },
    east: { key: ATTACK_1_E }
  },
  [SnowWendigoAnimationTypes.Attack2]: {
    south: { key: ATTACK_2_S },
    north: { key: ATTACK_2_N },
    west: { key: ATTACK_2_W },
    east: { key: ATTACK_2_E }
  },
  [SnowWendigoAnimationTypes.Attack3]: {
    south: { key: ATTACK_3_S },
    north: { key: ATTACK_3_N },
    west: { key: ATTACK_3_W },
    east: { key: ATTACK_3_E }
  }
};
