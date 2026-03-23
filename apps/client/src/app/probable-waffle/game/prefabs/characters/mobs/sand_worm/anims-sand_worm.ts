import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ATTACK1_E = "mobs_sand_worm_attack1/e";
const ATTACK1_N = "mobs_sand_worm_attack1/n";
const ATTACK1_S = "mobs_sand_worm_attack1/s";
const ATTACK1_W = "mobs_sand_worm_attack1/w";
const ATTACK2_E = "mobs_sand_worm_attack2/e";
const ATTACK2_N = "mobs_sand_worm_attack2/n";
const ATTACK2_S = "mobs_sand_worm_attack2/s";
const ATTACK2_W = "mobs_sand_worm_attack2/w";
const COME_OUT_E = "mobs_sand_worm_come out/e";
const COME_OUT_N = "mobs_sand_worm_come out/n";
const COME_OUT_S = "mobs_sand_worm_come out/s";
const COME_OUT_W = "mobs_sand_worm_come out/w";
const DEATH_E = "mobs_sand_worm_death/e";
const DEATH_N = "mobs_sand_worm_death/n";
const DEATH_S = "mobs_sand_worm_death/s";
const DEATH_W = "mobs_sand_worm_death/w";
const HIDE_E = "mobs_sand_worm_hide/e";
const HIDE_N = "mobs_sand_worm_hide/n";
const HIDE_S = "mobs_sand_worm_hide/s";
const HIDE_W = "mobs_sand_worm_hide/w";
const HIT_E = "mobs_sand_worm_hit/e";
const HIT_N = "mobs_sand_worm_hit/n";
const HIT_S = "mobs_sand_worm_hit/s";
const HIT_W = "mobs_sand_worm_hit/w";
const IDLE_E = "mobs_sand_worm_idle/e";
const IDLE_N = "mobs_sand_worm_idle/n";
const IDLE_S = "mobs_sand_worm_idle/s";
const IDLE_W = "mobs_sand_worm_idle/w";
const POISON_SHOT_FULL_ANIMATION = "mobs_sand_worm_poison shot - full animation";

export enum SandWormAnimationTypes {
  Attack1 = "Attack1",
  Attack2 = "Attack2",
  ComeOut = "ComeOut",
  Hide = "Hide",
  PoisonShot = "PoisonShot"
}

export const ANIM_SAND_WORM_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
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
  [SandWormAnimationTypes.Attack1]: {
    south: { key: ATTACK1_S },
    north: { key: ATTACK1_N },
    west: { key: ATTACK1_W },
    east: { key: ATTACK1_E }
  },
  [SandWormAnimationTypes.Attack2]: {
    south: { key: ATTACK2_S },
    north: { key: ATTACK2_N },
    west: { key: ATTACK2_W },
    east: { key: ATTACK2_E }
  },
  [SandWormAnimationTypes.ComeOut]: {
    south: { key: COME_OUT_S },
    north: { key: COME_OUT_N },
    west: { key: COME_OUT_W },
    east: { key: COME_OUT_E }
  },
  [SandWormAnimationTypes.Hide]: {
    south: { key: HIDE_S },
    north: { key: HIDE_N },
    west: { key: HIDE_W },
    east: { key: HIDE_E }
  },
  [SandWormAnimationTypes.PoisonShot]: {
    south: { key: POISON_SHOT_FULL_ANIMATION },
    north: { key: POISON_SHOT_FULL_ANIMATION },
    west: { key: POISON_SHOT_FULL_ANIMATION },
    east: { key: POISON_SHOT_FULL_ANIMATION }
  }
};
