import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_ROOSTER_ROOSTER_IDLE_BACK_ROOSTER__BACK_IDLE = "Rooster/Rooster_Idle/back/Rooster__back_Idle";
const ANIM_ROOSTER_ROOSTER_IDLE_FRONT_ROOSTER__FRONT_IDLE = "Rooster/Rooster_Idle/front/Rooster__front_Idle";
const ANIM_ROOSTER_ROOSTER_IDLE_LEFT_ROOSTER__LEFT_IDLE = "Rooster/Rooster_Idle/left/Rooster__left_Idle";
const ANIM_ROOSTER_ROOSTER_IDLE_RIGHT_ROOSTER__RIGHT_IDLE = "Rooster/Rooster_Idle/right/Rooster__right_Idle";
const ANIM_ROOSTER_ROOSTER_WALK_BACK_ROOSTER__BACK_WALK = "Rooster/Rooster_Walk/back/Rooster__back_Walk";
const ANIM_ROOSTER_ROOSTER_WALK_FRONT_ROOSTER__FRONT_WALK = "Rooster/Rooster_Walk/front/Rooster__front_Walk";
const ANIM_ROOSTER_ROOSTER_WALK_LEFT_ROOSTER__LEFT_WALK = "Rooster/Rooster_Walk/left/Rooster__left_Walk";
const ANIM_ROOSTER_ROOSTER_WALK_RIGHT_ROOSTER__RIGHT_WALK = "Rooster/Rooster_Walk/right/Rooster__right_Walk";

export const ANIM_ROOSTER_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_ROOSTER_ROOSTER_IDLE_BACK_ROOSTER__BACK_IDLE },
    southeast: { key: ANIM_ROOSTER_ROOSTER_IDLE_FRONT_ROOSTER__FRONT_IDLE },
    southwest: { key: ANIM_ROOSTER_ROOSTER_IDLE_LEFT_ROOSTER__LEFT_IDLE },
    northeast: { key: ANIM_ROOSTER_ROOSTER_IDLE_RIGHT_ROOSTER__RIGHT_IDLE },
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_ROOSTER_ROOSTER_WALK_BACK_ROOSTER__BACK_WALK },
    southeast: { key: ANIM_ROOSTER_ROOSTER_WALK_FRONT_ROOSTER__FRONT_WALK },
    southwest: { key: ANIM_ROOSTER_ROOSTER_WALK_LEFT_ROOSTER__LEFT_WALK },
    northeast: { key: ANIM_ROOSTER_ROOSTER_WALK_RIGHT_ROOSTER__RIGHT_WALK },
  },
};
