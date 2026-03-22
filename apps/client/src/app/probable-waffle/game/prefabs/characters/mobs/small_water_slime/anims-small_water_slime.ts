import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_SLIME1_ATTACK_E = "mobs_Slime1/Attack/e";
const ANIM_MOBS_SLIME1_ATTACK_N = "mobs_Slime1/Attack/n";
const ANIM_MOBS_SLIME1_ATTACK_S = "mobs_Slime1/Attack/s";
const ANIM_MOBS_SLIME1_ATTACK_W = "mobs_Slime1/Attack/w";
const ANIM_MOBS_SLIME1_DEATH_E = "mobs_Slime1/Death/e";
const ANIM_MOBS_SLIME1_DEATH_N = "mobs_Slime1/Death/n";
const ANIM_MOBS_SLIME1_DEATH_S = "mobs_Slime1/Death/s";
const ANIM_MOBS_SLIME1_DEATH_W = "mobs_Slime1/Death/w";
const ANIM_MOBS_SLIME1_HURT_E = "mobs_Slime1/Hurt/e";
const ANIM_MOBS_SLIME1_HURT_N = "mobs_Slime1/Hurt/n";
const ANIM_MOBS_SLIME1_HURT_S = "mobs_Slime1/Hurt/s";
const ANIM_MOBS_SLIME1_HURT_W = "mobs_Slime1/Hurt/w";
const ANIM_MOBS_SLIME1_IDLE_E = "mobs_Slime1/Idle/e";
const ANIM_MOBS_SLIME1_IDLE_N = "mobs_Slime1/Idle/n";
const ANIM_MOBS_SLIME1_IDLE_S = "mobs_Slime1/Idle/s";
const ANIM_MOBS_SLIME1_IDLE_W = "mobs_Slime1/Idle/w";
const ANIM_MOBS_SLIME1_RUN_E = "mobs_Slime1/Run/e";
const ANIM_MOBS_SLIME1_RUN_N = "mobs_Slime1/Run/n";
const ANIM_MOBS_SLIME1_RUN_S = "mobs_Slime1/Run/s";
const ANIM_MOBS_SLIME1_RUN_W = "mobs_Slime1/Run/w";
const ANIM_MOBS_SLIME1_WALK_E = "mobs_Slime1/Walk/e";
const ANIM_MOBS_SLIME1_WALK_N = "mobs_Slime1/Walk/n";
const ANIM_MOBS_SLIME1_WALK_S = "mobs_Slime1/Walk/s";
const ANIM_MOBS_SLIME1_WALK_W = "mobs_Slime1/Walk/w";

export const ANIM_SMALL_WATER_SLIME_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_SLIME1_IDLE_S },
    north: { key: ANIM_MOBS_SLIME1_IDLE_N },
    west: { key: ANIM_MOBS_SLIME1_IDLE_W },
    east: { key: ANIM_MOBS_SLIME1_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_SLIME1_WALK_S },
    north: { key: ANIM_MOBS_SLIME1_WALK_N },
    west: { key: ANIM_MOBS_SLIME1_WALK_W },
    east: { key: ANIM_MOBS_SLIME1_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_MOBS_SLIME1_RUN_S },
    north: { key: ANIM_MOBS_SLIME1_RUN_N },
    west: { key: ANIM_MOBS_SLIME1_RUN_W },
    east: { key: ANIM_MOBS_SLIME1_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_SLIME1_DEATH_S },
    north: { key: ANIM_MOBS_SLIME1_DEATH_N },
    west: { key: ANIM_MOBS_SLIME1_DEATH_W },
    east: { key: ANIM_MOBS_SLIME1_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_MOBS_SLIME1_ATTACK_S },
    north: { key: ANIM_MOBS_SLIME1_ATTACK_N },
    west: { key: ANIM_MOBS_SLIME1_ATTACK_W },
    east: { key: ANIM_MOBS_SLIME1_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_SLIME1_HURT_S },
    north: { key: ANIM_MOBS_SLIME1_HURT_N },
    west: { key: ANIM_MOBS_SLIME1_HURT_W },
    east: { key: ANIM_MOBS_SLIME1_HURT_E }
  }
};
