import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_PIGLET_PIGLET_IDLE_BACK_PIGLET_BACK_IDLE = "Piglet/Piglet_Idle/back/Piglet_back_Idle";
const ANIM_PIGLET_PIGLET_IDLE_FRONT_PIGLET_FRONT_IDLE = "Piglet/Piglet_Idle/front/Piglet_front_Idle";
const ANIM_PIGLET_PIGLET_IDLE_LEFT_PIGLET_LEFT_IDLE = "Piglet/Piglet_Idle/left/Piglet_left_Idle";
const ANIM_PIGLET_PIGLET_IDLE_RIGHT_PIGLET_RIGHT_IDLE = "Piglet/Piglet_Idle/right/Piglet_right_Idle";
const ANIM_PIGLET_PIGLET_WALK_BACK_PIGLET_BACK_WALK = "Piglet/Piglet_Walk/back/Piglet_back_Walk";
const ANIM_PIGLET_PIGLET_WALK_FRONT_PIGLET_FRONT_WALK = "Piglet/Piglet_Walk/front/Piglet_front_Walk";
const ANIM_PIGLET_PIGLET_WALK_LEFT_PIGLET_LEFT_WALK = "Piglet/Piglet_Walk/left/Piglet_left_Walk";
const ANIM_PIGLET_PIGLET_WALK_RIGHT_PIGLET_RIGHT_WALK = "Piglet/Piglet_Walk/right/Piglet_right_Walk";

export const ANIM_PIGLET_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_PIGLET_PIGLET_IDLE_BACK_PIGLET_BACK_IDLE },
    southeast: { key: ANIM_PIGLET_PIGLET_IDLE_FRONT_PIGLET_FRONT_IDLE },
    southwest: { key: ANIM_PIGLET_PIGLET_IDLE_LEFT_PIGLET_LEFT_IDLE },
    northeast: { key: ANIM_PIGLET_PIGLET_IDLE_RIGHT_PIGLET_RIGHT_IDLE },
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_PIGLET_PIGLET_WALK_BACK_PIGLET_BACK_WALK },
    southeast: { key: ANIM_PIGLET_PIGLET_WALK_FRONT_PIGLET_FRONT_WALK },
    southwest: { key: ANIM_PIGLET_PIGLET_WALK_LEFT_PIGLET_LEFT_WALK },
    northeast: { key: ANIM_PIGLET_PIGLET_WALK_RIGHT_PIGLET_RIGHT_WALK },
  },
};
