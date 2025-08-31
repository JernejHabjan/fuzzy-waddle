import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_TIVARA_WORKER_MALE_HURT = "tivara_worker_male_hurt";
const ANIM_TIVARA_WORKER_MALE_IDLE_UP = "tivara_worker_male_idle_up";
const ANIM_TIVARA_WORKER_MALE_IDLE_LEFT = "tivara_worker_male_idle_left";
const ANIM_TIVARA_WORKER_MALE_IDLE_DOWN = "tivara_worker_male_idle_down";
const ANIM_TIVARA_WORKER_MALE_IDLE_RIGHT = "tivara_worker_male_idle_right";
const ANIM_TIVARA_WORKER_MALE_SLASH_UP = "tivara_worker_male_slash_up";
const ANIM_TIVARA_WORKER_MALE_SLASH_LEFT = "tivara_worker_male_slash_left";
const ANIM_TIVARA_WORKER_MALE_SLASH_DOWN = "tivara_worker_male_slash_down";
const ANIM_TIVARA_WORKER_MALE_SLASH_RIGHT = "tivara_worker_male_slash_right";
const ANIM_TIVARA_WORKER_MALE_THRUST_UP = "tivara_worker_male_thrust_up";
const ANIM_TIVARA_WORKER_MALE_THRUST_LEFT = "tivara_worker_male_thrust_left";
const ANIM_TIVARA_WORKER_MALE_THRUST_DOWN = "tivara_worker_male_thrust_down";
const ANIM_TIVARA_WORKER_MALE_THRUST_RIGHT = "tivara_worker_male_thrust_right";
const ANIM_TIVARA_WORKER_MALE_WALK_UP = "tivara_worker_male_walk_up";
const ANIM_TIVARA_WORKER_MALE_WALK_LEFT = "tivara_worker_male_walk_left";
const ANIM_TIVARA_WORKER_MALE_WALK_DOWN = "tivara_worker_male_walk_down";
const ANIM_TIVARA_WORKER_MALE_WALK_RIGHT = "tivara_worker_male_walk_right";

import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-actor-component";

export const ANIM_TIVARA_WORKER_MALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_IDLE_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_IDLE_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_IDLE_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_WALK_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_WALK_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_WALK_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_SLASH_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_SLASH_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Chop]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_SLASH_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_SLASH_RIGHT }
  },
  [AnimationType.Mine]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_HURT },
    south: { key: ANIM_TIVARA_WORKER_MALE_HURT },
    west: { key: ANIM_TIVARA_WORKER_MALE_HURT },
    east: { key: ANIM_TIVARA_WORKER_MALE_HURT }
  },
  [AnimationType.Build]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_THRUST_RIGHT }
  },
  [AnimationType.Repair]: {
    north: { key: ANIM_TIVARA_WORKER_MALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_MALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_MALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_MALE_THRUST_RIGHT }
  }
};
