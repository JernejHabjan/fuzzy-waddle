import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_CYCLOPS_HURT = "cyclops_hurt";
const ANIM_CYCLOPS_IDLE_UP = "cyclops_idle";
const ANIM_CYCLOPS_IDLE_LEFT = "cyclops_idle_1";
const ANIM_CYCLOPS_IDLE_DOWN = "cyclops_idle_2";
const ANIM_CYCLOPS_IDLE_RIGHT = "cyclops_idle_3";
const ANIM_CYCLOPS_THRUST_UP = "cyclops_thrust";
const ANIM_CYCLOPS_THRUST_LEFT = "cyclops_thrust_1";
const ANIM_CYCLOPS_THRUST_DOWN = "cyclops_thrust_2";
const ANIM_CYCLOPS_THRUST_RIGHT = "cyclops_thrust_3";
const ANIM_CYCLOPS_WALK_UP = "cyclops_walk";
const ANIM_CYCLOPS_WALK_LEFT = "cyclops_walk_1";
const ANIM_CYCLOPS_WALK_DOWN = "cyclops_walk_2";
const ANIM_CYCLOPS_WALK_RIGHT = "cyclops_walk_3";
const ANIM_CYCLOPS_SLASH_UP = "cyclops_slash";
const ANIM_CYCLOPS_SLASH_LEFT = "cyclops_slash_1";
const ANIM_CYCLOPS_SLASH_DOWN = "cyclops_slash_2";
const ANIM_CYCLOPS_SLASH_RIGHT = "cyclops_slash_3";

export const ANIM_CYCLOPS_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_CYCLOPS_IDLE_UP },
    south: { key: ANIM_CYCLOPS_IDLE_DOWN },
    west: { key: ANIM_CYCLOPS_IDLE_LEFT },
    east: { key: ANIM_CYCLOPS_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_CYCLOPS_WALK_UP },
    south: { key: ANIM_CYCLOPS_WALK_DOWN },
    west: { key: ANIM_CYCLOPS_WALK_LEFT },
    east: { key: ANIM_CYCLOPS_WALK_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_CYCLOPS_THRUST_UP },
    south: { key: ANIM_CYCLOPS_THRUST_DOWN },
    west: { key: ANIM_CYCLOPS_THRUST_LEFT },
    east: { key: ANIM_CYCLOPS_THRUST_RIGHT }
  },
  [AnimationType.LargeSlash]: {
    north: { key: ANIM_CYCLOPS_SLASH_UP },
    south: { key: ANIM_CYCLOPS_SLASH_DOWN },
    west: { key: ANIM_CYCLOPS_SLASH_LEFT },
    east: { key: ANIM_CYCLOPS_SLASH_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_CYCLOPS_HURT },
    south: { key: ANIM_CYCLOPS_HURT },
    west: { key: ANIM_CYCLOPS_HURT },
    east: { key: ANIM_CYCLOPS_HURT }
  }
};
