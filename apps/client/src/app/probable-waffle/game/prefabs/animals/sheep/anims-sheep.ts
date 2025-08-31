import { type AnimationDefinitionMap } from "../../../entity/actor/components/animation/animation-actor-component";
import { AnimationType } from "../../../entity/actor/components/animation/animation-type";

const ANIM_SHEEP_IDLE_DOWN = "sheep_idle_down";
const ANIM_SHEEP_IDLE_LEFT = "sheep_idle_left";
const ANIM_SHEEP_IDLE_RIGHT = "sheep_idle_right";
const ANIM_SHEEP_IDLE_UP = "sheep_idle_up";
const ANIM_SHEEP_IDLE_DOWN_SHEARED = "sheep_idle_down_sheared";
const ANIM_SHEEP_IDLE_LEFT_SHEARED = "sheep_idle_left_sheared";
const ANIM_SHEEP_IDLE_RIGHT_SHEARED = "sheep_idle_right_sheared";
const ANIM_SHEEP_IDLE_UP_SHEARED = "sheep_idle_up_sheared";
const ANIM_SHEEP_DOWN_WALK = "sheep_down_walk";
const ANIM_SHEEP_LEFT_WALK = "sheep_left_walk";
const ANIM_SHEEP_RIGHT_WALK = "sheep_right_walk";
const ANIM_SHEEP_UP_WALK = "sheep_up_walk";
export const ANIM_SHEEP_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SHEEP_IDLE_UP },
    south: { key: ANIM_SHEEP_IDLE_DOWN },
    west: { key: ANIM_SHEEP_IDLE_LEFT },
    east: { key: ANIM_SHEEP_IDLE_RIGHT }
  },
  ["sheared"]: {
    north: { key: ANIM_SHEEP_IDLE_UP_SHEARED },
    south: { key: ANIM_SHEEP_IDLE_DOWN_SHEARED },
    west: { key: ANIM_SHEEP_IDLE_LEFT_SHEARED },
    east: { key: ANIM_SHEEP_IDLE_RIGHT_SHEARED }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SHEEP_UP_WALK },
    south: { key: ANIM_SHEEP_DOWN_WALK },
    west: { key: ANIM_SHEEP_LEFT_WALK },
    east: { key: ANIM_SHEEP_RIGHT_WALK }
  }
};
