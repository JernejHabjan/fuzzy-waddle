import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_SLIME3_ATTACK_E = "mobs_Slime3/Attack/e";
const ANIM_MOBS_SLIME3_ATTACK_N = "mobs_Slime3/Attack/n";
const ANIM_MOBS_SLIME3_ATTACK_S = "mobs_Slime3/Attack/s";
const ANIM_MOBS_SLIME3_ATTACK_W = "mobs_Slime3/Attack/w";
const ANIM_MOBS_SLIME3_DEATH_E = "mobs_Slime3/Death/e";
const ANIM_MOBS_SLIME3_DEATH_N = "mobs_Slime3/Death/n";
const ANIM_MOBS_SLIME3_DEATH_S = "mobs_Slime3/Death/s";
const ANIM_MOBS_SLIME3_DEATH_W = "mobs_Slime3/Death/w";
const ANIM_MOBS_SLIME3_HURT_E = "mobs_Slime3/Hurt/e";
const ANIM_MOBS_SLIME3_HURT_N = "mobs_Slime3/Hurt/n";
const ANIM_MOBS_SLIME3_HURT_S = "mobs_Slime3/Hurt/s";
const ANIM_MOBS_SLIME3_HURT_W = "mobs_Slime3/Hurt/w";
const ANIM_MOBS_SLIME3_IDLE_E = "mobs_Slime3/Idle/e";
const ANIM_MOBS_SLIME3_IDLE_N = "mobs_Slime3/Idle/n";
const ANIM_MOBS_SLIME3_IDLE_S = "mobs_Slime3/Idle/s";
const ANIM_MOBS_SLIME3_IDLE_W = "mobs_Slime3/Idle/w";
const ANIM_MOBS_SLIME3_RUN_E = "mobs_Slime3/Run/e";
const ANIM_MOBS_SLIME3_RUN_N = "mobs_Slime3/Run/n";
const ANIM_MOBS_SLIME3_RUN_S = "mobs_Slime3/Run/s";
const ANIM_MOBS_SLIME3_RUN_W = "mobs_Slime3/Run/w";
const ANIM_MOBS_SLIME3_WALK_E = "mobs_Slime3/Walk/e";
const ANIM_MOBS_SLIME3_WALK_N = "mobs_Slime3/Walk/n";
const ANIM_MOBS_SLIME3_WALK_S = "mobs_Slime3/Walk/s";
const ANIM_MOBS_SLIME3_WALK_W = "mobs_Slime3/Walk/w";

export const ANIM_FIRE_SLIME_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_SLIME3_IDLE_S },
    north: { key: ANIM_MOBS_SLIME3_IDLE_N },
    west: { key: ANIM_MOBS_SLIME3_IDLE_W },
    east: { key: ANIM_MOBS_SLIME3_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_SLIME3_WALK_S },
    north: { key: ANIM_MOBS_SLIME3_WALK_N },
    west: { key: ANIM_MOBS_SLIME3_WALK_W },
    east: { key: ANIM_MOBS_SLIME3_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_MOBS_SLIME3_RUN_S },
    north: { key: ANIM_MOBS_SLIME3_RUN_N },
    west: { key: ANIM_MOBS_SLIME3_RUN_W },
    east: { key: ANIM_MOBS_SLIME3_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_SLIME3_DEATH_S },
    north: { key: ANIM_MOBS_SLIME3_DEATH_N },
    west: { key: ANIM_MOBS_SLIME3_DEATH_W },
    east: { key: ANIM_MOBS_SLIME3_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_MOBS_SLIME3_ATTACK_S },
    north: { key: ANIM_MOBS_SLIME3_ATTACK_N },
    west: { key: ANIM_MOBS_SLIME3_ATTACK_W },
    east: { key: ANIM_MOBS_SLIME3_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_SLIME3_HURT_S },
    north: { key: ANIM_MOBS_SLIME3_HURT_N },
    west: { key: ANIM_MOBS_SLIME3_HURT_W },
    east: { key: ANIM_MOBS_SLIME3_HURT_E }
  }
};
