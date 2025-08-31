import { AnimationType } from "../../../../entity/actor/components/animation/animation-type";

const ANIM_GENERAL_WARRIOR_HURT = "general_warrior_hurt";
const ANIM_GENERAL_WARRIOR_IDLE_UP = "general_warrior_idle_up";
const ANIM_GENERAL_WARRIOR_IDLE_LEFT = "general_warrior_idle_left";
const ANIM_GENERAL_WARRIOR_IDLE_DOWN = "general_warrior_idle_down";
const ANIM_GENERAL_WARRIOR_IDLE_RIGHT = "general_warrior_idle_right";
const ANIM_GENERAL_WARRIOR_THRUST_UP = "general_warrior_thrust_up";
const ANIM_GENERAL_WARRIOR_THRUST_LEFT = "general_warrior_thrust_left";
const ANIM_GENERAL_WARRIOR_THRUST_DOWN = "general_warrior_thrust_down";
const ANIM_GENERAL_WARRIOR_THRUST_RIGHT = "general_warrior_thrust_right";
const ANIM_GENERAL_WARRIOR_WALK_UP = "general_warrior_walk_up";
const ANIM_GENERAL_WARRIOR_WALK_LEFT = "general_warrior_walk_left";
const ANIM_GENERAL_WARRIOR_WALK_DOWN = "general_warrior_walk_down";
const ANIM_GENERAL_WARRIOR_WALK_RIGHT = "general_warrior_walk_right";

import { type AnimationDefinitionMap } from "../../../../entity/actor/components/animation/animation-actor-component";

export const ANIM_GENERAL_WARRIOR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_GENERAL_WARRIOR_IDLE_UP },
    south: { key: ANIM_GENERAL_WARRIOR_IDLE_DOWN },
    west: { key: ANIM_GENERAL_WARRIOR_IDLE_LEFT },
    east: { key: ANIM_GENERAL_WARRIOR_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_GENERAL_WARRIOR_WALK_UP },
    south: { key: ANIM_GENERAL_WARRIOR_WALK_DOWN },
    west: { key: ANIM_GENERAL_WARRIOR_WALK_LEFT },
    east: { key: ANIM_GENERAL_WARRIOR_WALK_RIGHT }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_GENERAL_WARRIOR_THRUST_UP },
    south: { key: ANIM_GENERAL_WARRIOR_THRUST_DOWN },
    west: { key: ANIM_GENERAL_WARRIOR_THRUST_LEFT },
    east: { key: ANIM_GENERAL_WARRIOR_THRUST_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_GENERAL_WARRIOR_HURT },
    south: { key: ANIM_GENERAL_WARRIOR_HURT },
    west: { key: ANIM_GENERAL_WARRIOR_HURT },
    east: { key: ANIM_GENERAL_WARRIOR_HURT }
  }
};
