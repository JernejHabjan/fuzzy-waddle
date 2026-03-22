import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_BULL_IDLE_BACK_BULL_BACK_IDLE = "Bull/Idle/back/Bull_back_Idle";
const ANIM_BULL_IDLE_FRONT_BULL_FRONT_IDLE = "Bull/Idle/front/Bull_front_Idle";
const ANIM_BULL_IDLE_LEFT_BULL_LEFT_IDLE = "Bull/Idle/left/Bull_left_Idle";
const ANIM_BULL_IDLE_RIGHT_BULL_RIGHT_IDLE = "Bull/Idle/right/Bull_right_Idle";
const ANIM_BULL_WALK_BACK_BULL_BACK_WALK = "Bull/Walk/back/Bull_back_Walk";
const ANIM_BULL_WALK_FRONT_BULL_FRONT_WALK = "Bull/Walk/front/Bull_front_Walk";
const ANIM_BULL_WALK_LEFT_BULL_LEFT_WALK = "Bull/Walk/left/Bull_left_Walk";
const ANIM_BULL_WALK_RIGHT_BULL_RIGHT_WALK = "Bull/Walk/right/Bull_right_Walk";

export const ANIM_BULL_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_BULL_IDLE_BACK_BULL_BACK_IDLE },
    southeast: { key: ANIM_BULL_IDLE_FRONT_BULL_FRONT_IDLE },
    southwest: { key: ANIM_BULL_IDLE_LEFT_BULL_LEFT_IDLE },
    northeast: { key: ANIM_BULL_IDLE_RIGHT_BULL_RIGHT_IDLE },
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_BULL_WALK_BACK_BULL_BACK_WALK },
    southeast: { key: ANIM_BULL_WALK_FRONT_BULL_FRONT_WALK },
    southwest: { key: ANIM_BULL_WALK_LEFT_BULL_LEFT_WALK },
    northeast: { key: ANIM_BULL_WALK_RIGHT_BULL_RIGHT_WALK },
  },
};
