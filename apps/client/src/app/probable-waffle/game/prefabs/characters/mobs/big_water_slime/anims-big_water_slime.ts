import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_SLIME2_ATTACK_E = "mobs_Slime2/Attack/e";
const ANIM_MOBS_SLIME2_ATTACK_N = "mobs_Slime2/Attack/n";
const ANIM_MOBS_SLIME2_ATTACK_S = "mobs_Slime2/Attack/s";
const ANIM_MOBS_SLIME2_ATTACK_W = "mobs_Slime2/Attack/w";
const ANIM_MOBS_SLIME2_DEATH_E = "mobs_Slime2/Death/e";
const ANIM_MOBS_SLIME2_DEATH_N = "mobs_Slime2/Death/n";
const ANIM_MOBS_SLIME2_DEATH_S = "mobs_Slime2/Death/s";
const ANIM_MOBS_SLIME2_DEATH_W = "mobs_Slime2/Death/w";
const ANIM_MOBS_SLIME2_HURT_E = "mobs_Slime2/Hurt/e";
const ANIM_MOBS_SLIME2_HURT_N = "mobs_Slime2/Hurt/n";
const ANIM_MOBS_SLIME2_HURT_S = "mobs_Slime2/Hurt/s";
const ANIM_MOBS_SLIME2_HURT_W = "mobs_Slime2/Hurt/w";
const ANIM_MOBS_SLIME2_IDLE_E = "mobs_Slime2/Idle/e";
const ANIM_MOBS_SLIME2_IDLE_N = "mobs_Slime2/Idle/n";
const ANIM_MOBS_SLIME2_IDLE_S = "mobs_Slime2/Idle/s";
const ANIM_MOBS_SLIME2_IDLE_W = "mobs_Slime2/Idle/w";
const ANIM_MOBS_SLIME2_RUN_E = "mobs_Slime2/Run/e";
const ANIM_MOBS_SLIME2_RUN_N = "mobs_Slime2/Run/n";
const ANIM_MOBS_SLIME2_RUN_S = "mobs_Slime2/Run/s";
const ANIM_MOBS_SLIME2_RUN_W = "mobs_Slime2/Run/w";
const ANIM_MOBS_SLIME2_WALK_E = "mobs_Slime2/Walk/e";
const ANIM_MOBS_SLIME2_WALK_N = "mobs_Slime2/Walk/n";
const ANIM_MOBS_SLIME2_WALK_S = "mobs_Slime2/Walk/s";
const ANIM_MOBS_SLIME2_WALK_W = "mobs_Slime2/Walk/w";

export const ANIM_BIG_WATER_SLIME_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_SLIME2_IDLE_S },
    north: { key: ANIM_MOBS_SLIME2_IDLE_N },
    west: { key: ANIM_MOBS_SLIME2_IDLE_W },
    east: { key: ANIM_MOBS_SLIME2_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_SLIME2_WALK_S },
    north: { key: ANIM_MOBS_SLIME2_WALK_N },
    west: { key: ANIM_MOBS_SLIME2_WALK_W },
    east: { key: ANIM_MOBS_SLIME2_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_MOBS_SLIME2_RUN_S },
    north: { key: ANIM_MOBS_SLIME2_RUN_N },
    west: { key: ANIM_MOBS_SLIME2_RUN_W },
    east: { key: ANIM_MOBS_SLIME2_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_SLIME2_DEATH_S },
    north: { key: ANIM_MOBS_SLIME2_DEATH_N },
    west: { key: ANIM_MOBS_SLIME2_DEATH_W },
    east: { key: ANIM_MOBS_SLIME2_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_MOBS_SLIME2_ATTACK_S },
    north: { key: ANIM_MOBS_SLIME2_ATTACK_N },
    west: { key: ANIM_MOBS_SLIME2_ATTACK_W },
    east: { key: ANIM_MOBS_SLIME2_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_SLIME2_HURT_S },
    north: { key: ANIM_MOBS_SLIME2_HURT_N },
    west: { key: ANIM_MOBS_SLIME2_HURT_W },
    east: { key: ANIM_MOBS_SLIME2_HURT_E }
  }
};
