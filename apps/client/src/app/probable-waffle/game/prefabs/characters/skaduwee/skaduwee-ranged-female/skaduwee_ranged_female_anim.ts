const ANIM_SKADUWEE_RANGED_FEMALE_HURT = "skaduwee_ranged_female_hurt";
const ANIM_SKADUWEE_RANGED_FEMALE_IDLE_UP = "skaduwee_ranged_female_idle_up";
const ANIM_SKADUWEE_RANGED_FEMALE_IDLE_LEFT = "skaduwee_ranged_female_idle_left";
const ANIM_SKADUWEE_RANGED_FEMALE_IDLE_DOWN = "skaduwee_ranged_female_idle_down";
const ANIM_SKADUWEE_RANGED_FEMALE_IDLE_RIGHT = "skaduwee_ranged_female_idle_right";
const ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_UP = "skaduwee_ranged_female_shoot_up";
const ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_LEFT = "skaduwee_ranged_female_shoot_left";
const ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_DOWN = "skaduwee_ranged_female_shoot_down";
const ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_RIGHT = "skaduwee_ranged_female_shoot_right";
const ANIM_SKADUWEE_RANGED_FEMALE_WALK_UP = "skaduwee_ranged_female_walk_up";
const ANIM_SKADUWEE_RANGED_FEMALE_WALK_LEFT = "skaduwee_ranged_female_walk_left";
const ANIM_SKADUWEE_RANGED_FEMALE_WALK_DOWN = "skaduwee_ranged_female_walk_down";
const ANIM_SKADUWEE_RANGED_FEMALE_WALK_RIGHT = "skaduwee_ranged_female_walk_right";

import {
  type AnimationDefinitionMap,
  AnimationType
} from "../../../../entity/actor/components/animation-actor-component";

export const ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_RANGED_FEMALE_IDLE_UP },
    south: { key: ANIM_SKADUWEE_RANGED_FEMALE_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_RANGED_FEMALE_IDLE_LEFT },
    east: { key: ANIM_SKADUWEE_RANGED_FEMALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_RANGED_FEMALE_WALK_UP },
    south: { key: ANIM_SKADUWEE_RANGED_FEMALE_WALK_DOWN },
    west: { key: ANIM_SKADUWEE_RANGED_FEMALE_WALK_LEFT },
    east: { key: ANIM_SKADUWEE_RANGED_FEMALE_WALK_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKADUWEE_RANGED_FEMALE_HURT },
    south: { key: ANIM_SKADUWEE_RANGED_FEMALE_HURT },
    west: { key: ANIM_SKADUWEE_RANGED_FEMALE_HURT },
    east: { key: ANIM_SKADUWEE_RANGED_FEMALE_HURT }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_UP },
    south: { key: ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_DOWN },
    west: { key: ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_LEFT },
    east: { key: ANIM_SKADUWEE_RANGED_FEMALE_SHOOT_RIGHT }
  }
};
