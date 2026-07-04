import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_GOLEM2_ATTACK_E = "Golem2/Attack/e";
const ANIM_GOLEM2_ATTACK_N = "Golem2/Attack/n";
const ANIM_GOLEM2_ATTACK_S = "Golem2/Attack/s";
const ANIM_GOLEM2_ATTACK_W = "Golem2/Attack/w";
const ANIM_GOLEM2_DEATH_E = "Golem2/Death/e";
const ANIM_GOLEM2_DEATH_N = "Golem2/Death/n";
const ANIM_GOLEM2_DEATH_S = "Golem2/Death/s";
const ANIM_GOLEM2_DEATH_W = "Golem2/Death/w";
const ANIM_GOLEM2_HURT_E = "Golem2/Hurt/e";
const ANIM_GOLEM2_HURT_N = "Golem2/Hurt/n";
const ANIM_GOLEM2_HURT_S = "Golem2/Hurt/s";
const ANIM_GOLEM2_HURT_W = "Golem2/Hurt/w";
const ANIM_GOLEM2_IDLE_E = "Golem2/Idle/e";
const ANIM_GOLEM2_IDLE_N = "Golem2/Idle/n";
const ANIM_GOLEM2_IDLE_S = "Golem2/Idle/s";
const ANIM_GOLEM2_IDLE_W = "Golem2/Idle/w";
const ANIM_GOLEM2_RUN_E = "Golem2/Run/e";
const ANIM_GOLEM2_RUN_N = "Golem2/Run/n";
const ANIM_GOLEM2_RUN_S = "Golem2/Run/s";
const ANIM_GOLEM2_RUN_W = "Golem2/Run/w";
const ANIM_GOLEM2_WALK_E = "Golem2/Walk/e";
const ANIM_GOLEM2_WALK_N = "Golem2/Walk/n";
const ANIM_GOLEM2_WALK_S = "Golem2/Walk/s";
const ANIM_GOLEM2_WALK_W = "Golem2/Walk/w";

export const ANIM_STONE_GOLEM_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_GOLEM2_IDLE_S },
    north: { key: ANIM_GOLEM2_IDLE_N },
    west: { key: ANIM_GOLEM2_IDLE_W },
    east: { key: ANIM_GOLEM2_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_GOLEM2_WALK_S },
    north: { key: ANIM_GOLEM2_WALK_N },
    west: { key: ANIM_GOLEM2_WALK_W },
    east: { key: ANIM_GOLEM2_WALK_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_GOLEM2_RUN_S },
    north: { key: ANIM_GOLEM2_RUN_N },
    west: { key: ANIM_GOLEM2_RUN_W },
    east: { key: ANIM_GOLEM2_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_GOLEM2_DEATH_S },
    north: { key: ANIM_GOLEM2_DEATH_N },
    west: { key: ANIM_GOLEM2_DEATH_W },
    east: { key: ANIM_GOLEM2_DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ANIM_GOLEM2_ATTACK_S },
    north: { key: ANIM_GOLEM2_ATTACK_N },
    west: { key: ANIM_GOLEM2_ATTACK_W },
    east: { key: ANIM_GOLEM2_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_GOLEM2_HURT_S },
    north: { key: ANIM_GOLEM2_HURT_N },
    west: { key: ANIM_GOLEM2_HURT_W },
    east: { key: ANIM_GOLEM2_HURT_E }
  }
};
