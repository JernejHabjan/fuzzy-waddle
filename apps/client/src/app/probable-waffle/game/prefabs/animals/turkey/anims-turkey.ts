import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_TURKEY_TURKEY_IDLE_BACK_TURKEY_IDLE_BACK = "Turkey/Turkey_Idle/back/Turkey_Idle_Back";
const ANIM_TURKEY_TURKEY_IDLE_FRONT_TURKEY_IDLE_FRONT = "Turkey/Turkey_Idle/front/Turkey_Idle_Front";
const ANIM_TURKEY_TURKEY_IDLE_LEFT_TURKEY_IDLE_LEFT = "Turkey/Turkey_Idle/left/Turkey_Idle_Left";
const ANIM_TURKEY_TURKEY_IDLE_RIGHT_TURKEY_IDLE_RIGHT = "Turkey/Turkey_Idle/right/Turkey_Idle_Right";
const ANIM_TURKEY_TURKEY_WALK_BACK_TURKEY_WALK_BACK = "Turkey/Turkey_Walk/back/Turkey_Walk_Back";
const ANIM_TURKEY_TURKEY_WALK_FRONT_TURKEY_WALK_FRONT = "Turkey/Turkey_Walk/front/Turkey_Walk_Front";
const ANIM_TURKEY_TURKEY_WALK_LEFT_TURKEY_WALK_LEFT = "Turkey/Turkey_Walk/left/Turkey_Walk_Left";
const ANIM_TURKEY_TURKEY_WALK_RIGHT_TURKEY_WALK_RIGHT = "Turkey/Turkey_Walk/right/Turkey_Walk_Right";

export const ANIM_TURKEY_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_TURKEY_TURKEY_IDLE_BACK_TURKEY_IDLE_BACK },
    south: { key: ANIM_TURKEY_TURKEY_IDLE_FRONT_TURKEY_IDLE_FRONT },
    west: { key: ANIM_TURKEY_TURKEY_IDLE_LEFT_TURKEY_IDLE_LEFT },
    east: { key: ANIM_TURKEY_TURKEY_IDLE_RIGHT_TURKEY_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_TURKEY_TURKEY_WALK_BACK_TURKEY_WALK_BACK },
    south: { key: ANIM_TURKEY_TURKEY_WALK_FRONT_TURKEY_WALK_FRONT },
    west: { key: ANIM_TURKEY_TURKEY_WALK_LEFT_TURKEY_WALK_LEFT },
    east: { key: ANIM_TURKEY_TURKEY_WALK_RIGHT_TURKEY_WALK_RIGHT },
  },
};
