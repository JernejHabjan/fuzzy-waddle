// The constants with the animation keys.

const ANIM_SKADUWEE_MAGICIAN_FEMALE_HURT = "skaduwee_magician_female_hurt";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_UP = "skaduwee_magician_female_large_thrust_up";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_LEFT = "skaduwee_magician_female_large_thrust_left";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_DOWN = "skaduwee_magician_female_large_thrust_down";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_RIGHT = "skaduwee_magician_female_large_thrust_right";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_UP = "skaduwee_magician_female_idle_up";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_LEFT = "skaduwee_magician_female_idle_left";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_DOWN = "skaduwee_magician_female_idle_down";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_RIGHT = "skaduwee_magician_female_idle_right";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_UP = "skaduwee_magician_female_cast_up";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_LEFT = "skaduwee_magician_female_cast_left";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_DOWN = "skaduwee_magician_female_cast_down";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_RIGHT = "skaduwee_magician_female_cast_right";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_UP = "skaduwee_magician_female_walk_up";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_LEFT = "skaduwee_magician_female_walk_left";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_DOWN = "skaduwee_magician_female_walk_down";

const ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_RIGHT = "skaduwee_magician_female_walk_right";

import { AnimationDefinitionMap, AnimationType } from "../entity/actor/components/animation-actor-component";

export const ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_UP },
    south: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_LEFT },
    east: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_UP },
    south: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_DOWN },
    west: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_LEFT },
    east: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_WALK_RIGHT }
  },
  [AnimationType.Hurt]: {
    north: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_HURT },
    south: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_HURT },
    west: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_HURT },
    east: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_HURT }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_UP },
    south: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_DOWN },
    west: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_LEFT },
    east: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_RIGHT }
  },
  [AnimationType.LargeThrust]: {
    north: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_UP },
    south: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_DOWN },
    west: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_LEFT },
    east: { key: ANIM_SKADUWEE_MAGICIAN_FEMALE_LARGE_THRUST_RIGHT }
  }
};
