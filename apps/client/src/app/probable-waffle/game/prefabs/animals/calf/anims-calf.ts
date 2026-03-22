import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_CALF_CALF_IDLE_BACK_CALF_BACK_IDLE = "Calf/Calf_Idle/back/Calf_back_Idle";
const ANIM_CALF_CALF_IDLE_FRONT_CALF_FRONT_IDLE = "Calf/Calf_Idle/front/Calf_front_Idle";
const ANIM_CALF_CALF_IDLE_LEFT_CALF_LEFT_IDLE = "Calf/Calf_Idle/left/Calf_left_Idle";
const ANIM_CALF_CALF_IDLE_RIGHT_CALF_RIGHT_IDLE = "Calf/Calf_Idle/right/Calf_right_Idle";
const ANIM_CALF_CALF_WALK_BACK_CALF_BACK_WALK = "Calf/Calf_Walk/back/Calf_back_Walk";
const ANIM_CALF_CALF_WALK_FRONT_CALF_FRONT_WALK = "Calf/Calf_Walk/front/Calf_front_Walk";
const ANIM_CALF_CALF_WALK_LEFT_CALF_LEFT_WALK = "Calf/Calf_Walk/left/Calf_left_Walk";
const ANIM_CALF_CALF_WALK_RIGHT_CALF_RIGHT_WALK = "Calf/Calf_Walk/right/Calf_right_Walk";

export const ANIM_CALF_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_CALF_CALF_IDLE_BACK_CALF_BACK_IDLE },
    southeast: { key: ANIM_CALF_CALF_IDLE_FRONT_CALF_FRONT_IDLE },
    southwest: { key: ANIM_CALF_CALF_IDLE_LEFT_CALF_LEFT_IDLE },
    northeast: { key: ANIM_CALF_CALF_IDLE_RIGHT_CALF_RIGHT_IDLE },
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_CALF_CALF_WALK_BACK_CALF_BACK_WALK },
    southeast: { key: ANIM_CALF_CALF_WALK_FRONT_CALF_FRONT_WALK },
    southwest: { key: ANIM_CALF_CALF_WALK_LEFT_CALF_LEFT_WALK },
    northeast: { key: ANIM_CALF_CALF_WALK_RIGHT_CALF_RIGHT_WALK },
  },
};
