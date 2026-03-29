import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_HARE_IDLE_BACK_HARE_IDLE_BACK = "Hare/Idle/back/Hare_Idle_back";
const ANIM_HARE_IDLE_FRONT_HARE_IDLE_FRONT = "Hare/Idle/front/Hare_Idle_front";
const ANIM_HARE_IDLE_LEFT_HARE_IDLE_LEFT = "Hare/Idle/left/Hare_Idle_left";
const ANIM_HARE_IDLE_RIGHT_HARE_IDLE_RIGHT = "Hare/Idle/right/Hare_Idle_right";
const ANIM_HARE_RUN_BACK_HARE_RUN_BACK = "Hare/Run/back/Hare_Run_back";
const ANIM_HARE_RUN_FRONT_HARE_RUN_FRONT = "Hare/Run/front/Hare_Run_front";
const ANIM_HARE_RUN_LEFT_HARE_RUN_LEFT = "Hare/Run/left/Hare_Run_left";
const ANIM_HARE_RUN_RIGHT_HARE_RUN_RIGHT = "Hare/Run/right/Hare_Run_right";
const ANIM_HARE_WALK_BACK_HARE_WALK_BACK = "Hare/Walk/back/Hare_Walk_back";
const ANIM_HARE_WALK_FRONT_HARE_WALK_FRONT = "Hare/Walk/front/Hare_Walk_front";
const ANIM_HARE_WALK_LEFT_HARE_WALK_LEFT = "Hare/Walk/left/Hare_Walk_left";
const ANIM_HARE_WALK_RIGHT_HARE_WALK_RIGHT = "Hare/Walk/right/Hare_Walk_right";

export const ANIM_HARE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_HARE_IDLE_BACK_HARE_IDLE_BACK },
    south: { key: ANIM_HARE_IDLE_FRONT_HARE_IDLE_FRONT },
    west: { key: ANIM_HARE_IDLE_LEFT_HARE_IDLE_LEFT },
    east: { key: ANIM_HARE_IDLE_RIGHT_HARE_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_HARE_WALK_BACK_HARE_WALK_BACK },
    south: { key: ANIM_HARE_WALK_FRONT_HARE_WALK_FRONT },
    west: { key: ANIM_HARE_WALK_LEFT_HARE_WALK_LEFT },
    east: { key: ANIM_HARE_WALK_RIGHT_HARE_WALK_RIGHT },
  },
};
