import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_FOX_IDLE_BACK_FOX_IDLE_BACK = "Fox/Idle/back/Fox_Idle_back";
const ANIM_FOX_IDLE_FRONT_FOX_IDLE_FRONT = "Fox/Idle/front/Fox_Idle_front";
const ANIM_FOX_IDLE_LEFT_FOX_IDLE_LEFT = "Fox/Idle/left/Fox_Idle_left";
const ANIM_FOX_IDLE_RIGHT_FOX_IDLE_RIGHT = "Fox/Idle/right/Fox_Idle_right";
const ANIM_FOX_RUN_BACK_FOX_RUN_BACK = "Fox/Run/back/Fox_Run_back";
const ANIM_FOX_RUN_FRONT_FOX_RUN_FRONT = "Fox/Run/front/Fox_Run_front";
const ANIM_FOX_RUN_LEFT_FOX_RUN_LEFT = "Fox/Run/left/Fox_Run_left";
const ANIM_FOX_RUN_RIGHT_FOX_RUN_RIGHT = "Fox/Run/right/Fox_Run_right";
const ANIM_FOX_WALK_BACK_FOX_WALK_BACK = "Fox/Walk/back/Fox_walk_back";
const ANIM_FOX_WALK_FRONT_FOX_WALK_FRONT = "Fox/Walk/front/Fox_walk_front";
const ANIM_FOX_WALK_LEFT_FOX_WALK_LEFT = "Fox/Walk/left/Fox_walk_left";
const ANIM_FOX_WALK_RIGHT_FOX_WALK_RIGHT = "Fox/Walk/right/Fox_walk_right";

export const ANIM_FOX_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_FOX_IDLE_BACK_FOX_IDLE_BACK },
    southeast: { key: ANIM_FOX_IDLE_FRONT_FOX_IDLE_FRONT },
    southwest: { key: ANIM_FOX_IDLE_LEFT_FOX_IDLE_LEFT },
    northeast: { key: ANIM_FOX_IDLE_RIGHT_FOX_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_FOX_WALK_BACK_FOX_WALK_BACK },
    southeast: { key: ANIM_FOX_WALK_FRONT_FOX_WALK_FRONT },
    southwest: { key: ANIM_FOX_WALK_LEFT_FOX_WALK_LEFT },
    northeast: { key: ANIM_FOX_WALK_RIGHT_FOX_WALK_RIGHT },
  },
};
