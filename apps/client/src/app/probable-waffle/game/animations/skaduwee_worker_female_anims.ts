// The constants with the animation keys.

const ANIM_SKADUWEE_WORKER_FEMALE_HURT = "skaduwee_worker_female_hurt";

const ANIM_SKADUWEE_WORKER_FEMALE_IDLE_UP = "skaduwee_worker_female_idle_up";

const ANIM_SKADUWEE_WORKER_FEMALE_IDLE_LEFT = "skaduwee_worker_female_idle_left";

const ANIM_SKADUWEE_WORKER_FEMALE_IDLE_DOWN = "skaduwee_worker_female_idle_down";

const ANIM_SKADUWEE_WORKER_FEMALE_IDLE_RIGHT = "skaduwee_worker_female_idle_right";

const ANIM_SKADUWEE_WORKER_FEMALE_SLASH_UP = "skaduwee_worker_female_slash_up";

const ANIM_SKADUWEE_WORKER_FEMALE_SLASH_LEFT = "skaduwee_worker_female_slash_left";

const ANIM_SKADUWEE_WORKER_FEMALE_SLASH_DOWN = "skaduwee_worker_female_slash_down";

const ANIM_SKADUWEE_WORKER_FEMALE_SLASH_RIGHT = "skaduwee_worker_female_slash_right";

const ANIM_SKADUWEE_WORKER_FEMALE_THRUST_UP = "skaduwee_worker_female_thrust_up";

const ANIM_SKADUWEE_WORKER_FEMALE_THRUST_LEFT = "skaduwee_worker_female_thrust_left";

const ANIM_SKADUWEE_WORKER_FEMALE_THRUST_DOWN = "skaduwee_worker_female_thrust_down";

const ANIM_SKADUWEE_WORKER_FEMALE_THRUST_RIGHT = "skaduwee_worker_female_thrust_right";

const ANIM_SKADUWEE_WORKER_FEMALE_WALK_UP = "skaduwee_worker_female_walk_up";

const ANIM_SKADUWEE_WORKER_FEMALE_WALK_LEFT = "skaduwee_worker_female_walk_left";

const ANIM_SKADUWEE_WORKER_FEMALE_WALK_DOWN = "skaduwee_worker_female_walk_down";

const ANIM_SKADUWEE_WORKER_FEMALE_WALK_RIGHT = "skaduwee_worker_female_walk_right";

import { AnimationDefinitionMap, AnimationType } from "../entity/actor/components/animation-actor-component";

export const ANIM_SKADUWEE_WORKER_FEMALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_WORKER_FEMALE_IDLE_UP },
    south: { key: ANIM_SKADUWEE_WORKER_FEMALE_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_FEMALE_IDLE_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_FEMALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_WORKER_FEMALE_WALK_UP },
    south: { key: ANIM_SKADUWEE_WORKER_FEMALE_WALK_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_FEMALE_WALK_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_FEMALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKADUWEE_WORKER_FEMALE_SLASH_UP },
    south: { key: ANIM_SKADUWEE_WORKER_FEMALE_SLASH_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_FEMALE_SLASH_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_FEMALE_SLASH_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_SKADUWEE_WORKER_FEMALE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_WORKER_FEMALE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_WORKER_FEMALE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_WORKER_FEMALE_THRUST_RIGHT }
  },
  [AnimationType.Hurt]: {
    north: { key: ANIM_SKADUWEE_WORKER_FEMALE_HURT },
    south: { key: ANIM_SKADUWEE_WORKER_FEMALE_HURT },
    west: { key: ANIM_SKADUWEE_WORKER_FEMALE_HURT },
    east: { key: ANIM_SKADUWEE_WORKER_FEMALE_HURT }
  }
};
