import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_LAMB_LAMB_IDLE_BACK_LAMB_IDLE_BACK = "Lamb/Lamb_Idle/back/Lamb_Idle_back";
const ANIM_LAMB_LAMB_IDLE_FRONT_LAMB_IDLE_FRONT = "Lamb/Lamb_Idle/front/Lamb_Idle_front";
const ANIM_LAMB_LAMB_IDLE_LEFT_LAMB_IDLE_LEFT = "Lamb/Lamb_Idle/left/Lamb_Idle_left";
const ANIM_LAMB_LAMB_IDLE_RIGHT_LAMB_IDLE_RIGHT = "Lamb/Lamb_Idle/right/Lamb_Idle_right";
const ANIM_LAMB_LAMB_WALK_BACK_LAMB_WALK_BACK = "Lamb/Lamb_walk/back/Lamb_walk_back";
const ANIM_LAMB_LAMB_WALK_FRONT_LAMB_WALK_FRONT = "Lamb/Lamb_walk/front/Lamb_walk_front";
const ANIM_LAMB_LAMB_WALK_LEFT_LAMB_WALK_LEFT = "Lamb/Lamb_walk/left/Lamb_walk_left";
const ANIM_LAMB_LAMB_WALK_RIGHT_LAMB_WALK_RIGHT = "Lamb/Lamb_walk/right/Lamb_walk_right";

export const ANIM_LAMB_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_LAMB_LAMB_IDLE_BACK_LAMB_IDLE_BACK },
    south: { key: ANIM_LAMB_LAMB_IDLE_FRONT_LAMB_IDLE_FRONT },
    west: { key: ANIM_LAMB_LAMB_IDLE_LEFT_LAMB_IDLE_LEFT },
    east: { key: ANIM_LAMB_LAMB_IDLE_RIGHT_LAMB_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_LAMB_LAMB_WALK_BACK_LAMB_WALK_BACK },
    south: { key: ANIM_LAMB_LAMB_WALK_FRONT_LAMB_WALK_FRONT },
    west: { key: ANIM_LAMB_LAMB_WALK_LEFT_LAMB_WALK_LEFT },
    east: { key: ANIM_LAMB_LAMB_WALK_RIGHT_LAMB_WALK_RIGHT },
  },
};
