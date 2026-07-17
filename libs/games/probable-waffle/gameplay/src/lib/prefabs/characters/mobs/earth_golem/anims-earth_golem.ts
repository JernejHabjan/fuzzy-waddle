import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_GOLEM1_ATTACK_E = "Golem1/Attack/e";
const ANIM_GOLEM1_ATTACK_N = "Golem1/Attack/n";
const ANIM_GOLEM1_ATTACK_S = "Golem1/Attack/s";
const ANIM_GOLEM1_ATTACK_W = "Golem1/Attack/w";
const ANIM_GOLEM1_DEATH_E = "Golem1/Death/e";
const ANIM_GOLEM1_DEATH_N = "Golem1/Death/n";
const ANIM_GOLEM1_DEATH_S = "Golem1/Death/s";
const ANIM_GOLEM1_DEATH_W = "Golem1/Death/w";
const ANIM_GOLEM1_HURT_E = "Golem1/Hurt/e";
const ANIM_GOLEM1_HURT_N = "Golem1/Hurt/n";
const ANIM_GOLEM1_HURT_S = "Golem1/Hurt/s";
const ANIM_GOLEM1_HURT_W = "Golem1/Hurt/w";
const ANIM_GOLEM1_IDLE_E = "Golem1/Idle/e";
const ANIM_GOLEM1_IDLE_N = "Golem1/Idle/n";
const ANIM_GOLEM1_IDLE_S = "Golem1/Idle/s";
const ANIM_GOLEM1_IDLE_W = "Golem1/Idle/w";
const ANIM_GOLEM1_RUN_E = "Golem1/Run/e";
const ANIM_GOLEM1_RUN_N = "Golem1/Run/n";
const ANIM_GOLEM1_RUN_S = "Golem1/Run/s";
const ANIM_GOLEM1_RUN_W = "Golem1/Run/w";
const ANIM_GOLEM1_WALK_E = "Golem1/Walk/e";
const ANIM_GOLEM1_WALK_N = "Golem1/Walk/n";
const ANIM_GOLEM1_WALK_S = "Golem1/Walk/s";
const ANIM_GOLEM1_WALK_W = "Golem1/Walk/w";

export const ANIM_EARTH_GOLEM_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_GOLEM1_IDLE_S },
    north: { key: ANIM_GOLEM1_IDLE_N },
    west: { key: ANIM_GOLEM1_IDLE_W },
    east: { key: ANIM_GOLEM1_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_GOLEM1_WALK_S },
    north: { key: ANIM_GOLEM1_WALK_N },
    west: { key: ANIM_GOLEM1_WALK_W },
    east: { key: ANIM_GOLEM1_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_GOLEM1_RUN_S },
    north: { key: ANIM_GOLEM1_RUN_N },
    west: { key: ANIM_GOLEM1_RUN_W },
    east: { key: ANIM_GOLEM1_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_GOLEM1_DEATH_S },
    north: { key: ANIM_GOLEM1_DEATH_N },
    west: { key: ANIM_GOLEM1_DEATH_W },
    east: { key: ANIM_GOLEM1_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_GOLEM1_ATTACK_S },
    north: { key: ANIM_GOLEM1_ATTACK_N },
    west: { key: ANIM_GOLEM1_ATTACK_W },
    east: { key: ANIM_GOLEM1_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_GOLEM1_HURT_S },
    north: { key: ANIM_GOLEM1_HURT_N },
    west: { key: ANIM_GOLEM1_HURT_W },
    east: { key: ANIM_GOLEM1_HURT_E }
  }
};
