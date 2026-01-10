// The constants with the animation keys.

import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_CENTURION_HURT = "centurion_hurt";

const ANIM_CENTURION_IDLE_UP = "centurion_idle_up";

const ANIM_CENTURION_IDLE = "centurion_idle";

const ANIM_CENTURION_IDLE_LEFT = "centurion_idle_left";

const ANIM_CENTURION_IDLE_RIGHT = "centurion_idle_right";

const ANIM_CENTURION_THRUST = "centurion_thrust";

const ANIM_CENTURION_THRUST_1 = "centurion_thrust_1";

const ANIM_CENTURION_THRUST_2 = "centurion_thrust_2";

const ANIM_CENTURION_THRUST_RIGHT = "centurion_thrust_right";

const ANIM_CENTURION_WALK = "centurion_walk";

const ANIM_CENTURION_WALK_1 = "centurion_walk_1";

const ANIM_CENTURION_WALK_2 = "centurion_walk_2";

const ANIM_CENTURION_WALK_RIGHT = "centurion_walk_right";

export const ANIM_CENTURION_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_CENTURION_IDLE_UP },
    south: { key: ANIM_CENTURION_IDLE },
    west: { key: ANIM_CENTURION_IDLE_LEFT },
    east: { key: ANIM_CENTURION_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_CENTURION_WALK },
    south: { key: ANIM_CENTURION_WALK_2 },
    west: { key: ANIM_CENTURION_WALK_1 },
    east: { key: ANIM_CENTURION_WALK_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_CENTURION_THRUST },
    south: { key: ANIM_CENTURION_THRUST_2 },
    west: { key: ANIM_CENTURION_THRUST_1 },
    east: { key: ANIM_CENTURION_THRUST_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_CENTURION_HURT },
    south: { key: ANIM_CENTURION_HURT },
    west: { key: ANIM_CENTURION_HURT },
    east: { key: ANIM_CENTURION_HURT }
  }
};
