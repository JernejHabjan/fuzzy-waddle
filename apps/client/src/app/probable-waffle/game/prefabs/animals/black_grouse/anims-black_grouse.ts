import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_BACK_BLACK_GROUSE_FLIGHT_BACK =
  "Black_grouse/Black_grouse_Flight/back/Black_grouse_Flight_Back";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_FRONT_BLACK_GROUSE_FLIGHT_FRONT =
  "Black_grouse/Black_grouse_Flight/front/Black_grouse_Flight_Front";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_LEFT_BLACK_GROUSE_FLIGHT_LEFT =
  "Black_grouse/Black_grouse_Flight/left/Black_grouse_Flight_left";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_RIGHT_BLACK_GROUSE_FLIGHT_RIGHT =
  "Black_grouse/Black_grouse_Flight/right/Black_grouse_Flight_Right";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_BACK_BLACK_GROUSE_IDLE_BACK =
  "Black_grouse/Black_grouse_Idle/back/Black_grouse_Idle_Back";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_FRONT_BLACK_GROUSE_IDLE_FRONT =
  "Black_grouse/Black_grouse_Idle/front/Black_grouse_Idle_Front";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_LEFT_BLACK_GROUSE_IDLE_LEFT =
  "Black_grouse/Black_grouse_Idle/left/Black_grouse_Idle_left";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_RIGHT_BLACK_GROUSE_IDLE_RIGHT =
  "Black_grouse/Black_grouse_Idle/right/Black_grouse_Idle_Right";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_BACK_BLACK_GROUSE_WALK_BACK =
  "Black_grouse/Black_grouse_Walk/back/Black_grouse_Walk_Back";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_FRONT_BLACK_GROUSE_WALK_FRONT =
  "Black_grouse/Black_grouse_Walk/front/Black_grouse_Walk_Front";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_LEFT_BLACK_GROUSE_WALK_LEFT =
  "Black_grouse/Black_grouse_Walk/left/Black_grouse_Walk_left";
const ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_RIGHT_BLACK_GROUSE_WALK_RIGHT =
  "Black_grouse/Black_grouse_Walk/right/Black_grouse_Walk_right";

export const ANIM_BLACK_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Thrust]: {
    north: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_BACK_BLACK_GROUSE_FLIGHT_BACK },
    south: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_FRONT_BLACK_GROUSE_FLIGHT_FRONT },
    west: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_LEFT_BLACK_GROUSE_FLIGHT_LEFT },
    east: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_FLIGHT_RIGHT_BLACK_GROUSE_FLIGHT_RIGHT }
  },
  [AnimationType.Idle]: {
    north: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_BACK_BLACK_GROUSE_IDLE_BACK },
    south: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_FRONT_BLACK_GROUSE_IDLE_FRONT },
    west: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_LEFT_BLACK_GROUSE_IDLE_LEFT },
    east: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_IDLE_RIGHT_BLACK_GROUSE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_BACK_BLACK_GROUSE_WALK_BACK },
    south: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_FRONT_BLACK_GROUSE_WALK_FRONT },
    west: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_LEFT_BLACK_GROUSE_WALK_LEFT },
    east: { key: ANIM_BLACK_GROUSE_BLACK_GROUSE_WALK_RIGHT_BLACK_GROUSE_WALK_RIGHT }
  }
};
