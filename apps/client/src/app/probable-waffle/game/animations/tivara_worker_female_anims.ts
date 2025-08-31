import { AnimationDefinitionMap, AnimationType } from "../entity/actor/components/animation-actor-component";

const ANIM_TIVARA_WORKER_FEMALE_HURT = "tivara_worker_female_hurt";
const ANIM_TIVARA_WORKER_FEMALE_IDLE_UP = "tivara_worker_female_idle_up";
const ANIM_TIVARA_WORKER_FEMALE_IDLE_LEFT = "tivara_worker_female_idle_left";
const ANIM_TIVARA_WORKER_FEMALE_IDLE_DOWN = "tivara_worker_female_idle_down";
const ANIM_TIVARA_WORKER_FEMALE_IDLE_RIGHT = "tivara_worker_female_idle_right";
const ANIM_TIVARA_WORKER_FEMALE_SLASH_UP = "tivara_worker_female_slash_up";
const ANIM_TIVARA_WORKER_FEMALE_SLASH_LEFT = "tivara_worker_female_slash_left";
const ANIM_TIVARA_WORKER_FEMALE_SLASH_DOWN = "tivara_worker_female_slash_down";
const ANIM_TIVARA_WORKER_FEMALE_SLASH_RIGHT = "tivara_worker_female_slash_right";
const ANIM_TIVARA_WORKER_FEMALE_THRUST_UP = "tivara_worker_female_thrust_up";
const ANIM_TIVARA_WORKER_FEMALE_THRUST_LEFT = "tivara_worker_female_thrust_left";
const ANIM_TIVARA_WORKER_FEMALE_THRUST_DOWN = "tivara_worker_female_thrust_down";
const ANIM_TIVARA_WORKER_FEMALE_THRUST_RIGHT = "tivara_worker_female_thrust_right";
const ANIM_TIVARA_WORKER_FEMALE_WALK_UP = "tivara_worker_female_walk_up";
const ANIM_TIVARA_WORKER_FEMALE_WALK_LEFT = "tivara_worker_female_walk_left";
const ANIM_TIVARA_WORKER_FEMALE_WALK_DOWN = "tivara_worker_female_walk_down";
const ANIM_TIVARA_WORKER_FEMALE_WALK_RIGHT = "tivara_worker_female_walk_right";

export const ANIM_TIVARA_WORKER_FEMALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_IDLE_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_IDLE_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_IDLE_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_WALK_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_WALK_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_WALK_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_RIGHT }
  },
  [AnimationType.Chop]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_SLASH_RIGHT }
  },
  [AnimationType.Mine]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_HURT },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_HURT },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_HURT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_HURT }
  },
  [AnimationType.Build]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_RIGHT }
  },
  [AnimationType.Repair]: {
    north: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_UP },
    south: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_DOWN },
    west: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_LEFT },
    east: { key: ANIM_TIVARA_WORKER_FEMALE_THRUST_RIGHT }
  }
};
