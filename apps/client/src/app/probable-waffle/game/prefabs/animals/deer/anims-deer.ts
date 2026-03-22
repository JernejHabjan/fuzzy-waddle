import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_DEER_IDLE_BACK_DEER_IDLE_BACK = "Deer/Idle/back/Deer_Idle_back";
const ANIM_DEER_IDLE_FRONT_DEER_IDLE_FRONT = "Deer/Idle/front/Deer_Idle_front";
const ANIM_DEER_IDLE_LEFT_DEER_IDLE_LEFT = "Deer/Idle/left/Deer_Idle_left";
const ANIM_DEER_IDLE_RIGHT_DEER_IDLE_RIGHT = "Deer/Idle/right/Deer_Idle_right";
const ANIM_DEER_RUN_BACK_DEER_RUN_BACK = "Deer/Run/back/Deer_Run_back";
const ANIM_DEER_RUN_FRONT_DEER_RUN_FRONT = "Deer/Run/front/Deer_Run_front";
const ANIM_DEER_RUN_LEFT_DEER_RUN_LEFT = "Deer/Run/left/Deer_Run_left";
const ANIM_DEER_RUN_RIGHT_DEER_RUN_RIGHT = "Deer/Run/right/Deer_Run_right";
const ANIM_DEER_WALK_BACK_DEER_WALK_BACK = "Deer/Walk/back/Deer_Walk_back";
const ANIM_DEER_WALK_FRONT_DEER_WALK_FRONT = "Deer/Walk/front/Deer_Walk_front";
const ANIM_DEER_WALK_LEFT_DEER_WALK_LEFT = "Deer/Walk/left/Deer_Walk_left";
const ANIM_DEER_WALK_RIGHT_DEER_WALK_RIGHT = "Deer/Walk/right/Deer_Walk_right";

export const ANIM_DEER_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_DEER_IDLE_BACK_DEER_IDLE_BACK },
    south: { key: ANIM_DEER_IDLE_FRONT_DEER_IDLE_FRONT },
    west: { key: ANIM_DEER_IDLE_LEFT_DEER_IDLE_LEFT },
    east: { key: ANIM_DEER_IDLE_RIGHT_DEER_IDLE_RIGHT },
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_DEER_WALK_BACK_DEER_WALK_BACK },
    south: { key: ANIM_DEER_WALK_FRONT_DEER_WALK_FRONT },
    west: { key: ANIM_DEER_WALK_LEFT_DEER_WALK_LEFT },
    east: { key: ANIM_DEER_WALK_RIGHT_DEER_WALK_RIGHT },
  },
};
