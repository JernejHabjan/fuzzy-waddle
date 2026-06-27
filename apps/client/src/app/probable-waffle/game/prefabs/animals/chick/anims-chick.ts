import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_CHICK_IDLE_BACK_CHICK_IDLE_BACK = "Chick/Idle/back/Chick_Idle_back";
const ANIM_CHICK_IDLE_FRONT_CHICK_IDLE_FRONT = "Chick/Idle/front/Chick_Idle_front";
const ANIM_CHICK_IDLE_LEFT_CHICK_IDLE_LEFT = "Chick/Idle/left/Chick_Idle_left";
const ANIM_CHICK_IDLE_RIGHT_CHICK_IDLE_RIGHT = "Chick/Idle/right/Chick_Idle_right";
const ANIM_CHICK_WALK_BACK_CHICK_WALK_BACK = "Chick/Walk/back/Chick_walk_back";
const ANIM_CHICK_WALK_FRONT_CHICK_WALK_FRONT = "Chick/Walk/front/Chick_walk_front";
const ANIM_CHICK_WALK_LEFT_CHICK_WALK_LEFT = "Chick/Walk/left/Chick_walk_left";
const ANIM_CHICK_WALK_RIGHT_CHICK_WALK_RIGHT = "Chick/Walk/right/Chick_walk_right";

export const ANIM_CHICK_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_CHICK_IDLE_BACK_CHICK_IDLE_BACK },
    south: { key: ANIM_CHICK_IDLE_FRONT_CHICK_IDLE_FRONT },
    west: { key: ANIM_CHICK_IDLE_LEFT_CHICK_IDLE_LEFT },
    east: { key: ANIM_CHICK_IDLE_RIGHT_CHICK_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_CHICK_WALK_BACK_CHICK_WALK_BACK },
    south: { key: ANIM_CHICK_WALK_FRONT_CHICK_WALK_FRONT },
    west: { key: ANIM_CHICK_WALK_LEFT_CHICK_WALK_LEFT },
    east: { key: ANIM_CHICK_WALK_RIGHT_CHICK_WALK_RIGHT },
  },
};
