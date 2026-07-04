import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_GOLEM3_ATTACK_E = "Golem3/Attack/e";
const ANIM_GOLEM3_ATTACK_N = "Golem3/Attack/n";
const ANIM_GOLEM3_ATTACK_S = "Golem3/Attack/s";
const ANIM_GOLEM3_ATTACK_W = "Golem3/Attack/w";
const ANIM_GOLEM3_DEATH_E = "Golem3/Death/e";
const ANIM_GOLEM3_DEATH_N = "Golem3/Death/n";
const ANIM_GOLEM3_DEATH_S = "Golem3/Death/s";
const ANIM_GOLEM3_DEATH_W = "Golem3/Death/w";
const ANIM_GOLEM3_HURT_E = "Golem3/Hurt/e";
const ANIM_GOLEM3_HURT_N = "Golem3/Hurt/n";
const ANIM_GOLEM3_HURT_S = "Golem3/Hurt/s";
const ANIM_GOLEM3_HURT_W = "Golem3/Hurt/w";
const ANIM_GOLEM3_IDLE_E = "Golem3/Idle/e";
const ANIM_GOLEM3_IDLE_N = "Golem3/Idle/n";
const ANIM_GOLEM3_IDLE_S = "Golem3/Idle/s";
const ANIM_GOLEM3_IDLE_W = "Golem3/Idle/w";
const ANIM_GOLEM3_RUN_E = "Golem3/Run/e";
const ANIM_GOLEM3_RUN_N = "Golem3/Run/n";
const ANIM_GOLEM3_RUN_S = "Golem3/Run/s";
const ANIM_GOLEM3_RUN_W = "Golem3/Run/w";
const ANIM_GOLEM3_WALK_E = "Golem3/Walk/e";
const ANIM_GOLEM3_WALK_N = "Golem3/Walk/n";
const ANIM_GOLEM3_WALK_S = "Golem3/Walk/s";
const ANIM_GOLEM3_WALK_W = "Golem3/Walk/w";

export const ANIM_METAL_GOLEM_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_GOLEM3_IDLE_S },
    north: { key: ANIM_GOLEM3_IDLE_N },
    west: { key: ANIM_GOLEM3_IDLE_W },
    east: { key: ANIM_GOLEM3_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_GOLEM3_WALK_S },
    north: { key: ANIM_GOLEM3_WALK_N },
    west: { key: ANIM_GOLEM3_WALK_W },
    east: { key: ANIM_GOLEM3_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_GOLEM3_RUN_S },
    north: { key: ANIM_GOLEM3_RUN_N },
    west: { key: ANIM_GOLEM3_RUN_W },
    east: { key: ANIM_GOLEM3_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_GOLEM3_DEATH_S },
    north: { key: ANIM_GOLEM3_DEATH_N },
    west: { key: ANIM_GOLEM3_DEATH_W },
    east: { key: ANIM_GOLEM3_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_GOLEM3_ATTACK_S },
    north: { key: ANIM_GOLEM3_ATTACK_N },
    west: { key: ANIM_GOLEM3_ATTACK_W },
    east: { key: ANIM_GOLEM3_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_GOLEM3_HURT_S },
    north: { key: ANIM_GOLEM3_HURT_N },
    west: { key: ANIM_GOLEM3_HURT_W },
    east: { key: ANIM_GOLEM3_HURT_E }
  }
};
