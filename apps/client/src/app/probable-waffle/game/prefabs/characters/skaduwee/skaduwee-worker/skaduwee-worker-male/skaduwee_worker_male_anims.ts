const ANIM_SKADUWEE_WORKER_MALE_HURT = "skaduwee_worker_male_hurt";
const ANIM_SKADUWEE_WORKER_MALE_IDLE_UP = "skaduwee_worker_male_idle_up";
const ANIM_SKADUWEE_WORKER_MALE_IDLE_LEFT = "skaduwee_worker_male_idle_left";
const ANIM_SKADUWEE_WORKER_MALE_IDLE_DOWN = "skaduwee_worker_male_idle_down";
const ANIM_SKADUWEE_WORKER_MALE_IDLE_RIGHT = "skaduwee_worker_male_idle_right";
const ANIM_SKADUWEE_WORKER_MALE_SLASH_UP = "skaduwee_worker_male_slash_up";
const ANIM_SKADUWEE_WORKER_MALE_SLASH_LEFT = "skaduwee_worker_male_slash_left";
const ANIM_SKADUWEE_WORKER_MALE_SLASH_DOWN = "skaduwee_worker_male_slash_down";
const ANIM_SKADUWEE_WORKER_MALE_SLASH_RIGHT = "skaduwee_worker_male_slash_right";
const ANIM_SKADUWEE_WORKER_MALE_THRUST_UP = "skaduwee_worker_male_thrust_up";
const ANIM_SKADUWEE_WORKER_MALE_THRUST_LEFT = "skaduwee_worker_male_thrust_left";
const ANIM_SKADUWEE_WORKER_MALE_THRUST_DOWN = "skaduwee_worker_male_thrust_down";
const ANIM_SKADUWEE_WORKER_MALE_THRUST_RIGHT = "skaduwee_worker_male_thrust_right";
const ANIM_SKADUWEE_WORKER_MALE_WALK_UP = "skaduwee_worker_male_walk_up";
const ANIM_SKADUWEE_WORKER_MALE_WALK_LEFT = "skaduwee_worker_male_walk_left";
const ANIM_SKADUWEE_WORKER_MALE_WALK_DOWN = "skaduwee_worker_male_walk_down";
const ANIM_SKADUWEE_WORKER_MALE_WALK_RIGHT = "skaduwee_worker_male_walk_right";

import {
  type AnimationDefinitionMap,
  AnimationType
} from "../../../../../entity/actor/components/animation-actor-component";

export const ANIM_SKADUWEE_WORKER_MALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_IDLE_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_IDLE_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_WALK_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_WALK_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_WALK_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Chop]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_SLASH_RIGHT }
  },
  [AnimationType.Mine]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_HURT },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_HURT },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_HURT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_HURT }
  },
  [AnimationType.Repair]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Build]: {
    north: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_MALE_THRUST_RIGHT }
  }
};
