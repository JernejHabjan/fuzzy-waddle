import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_SHEEP_SHEEP_IDLE_BACK_SHEEP_IDLE_BACK = "Sheep/Sheep_Idle/back/Sheep_Idle_back";
const ANIM_SHEEP_SHEEP_IDLE_FRONT_SHEEP_IDLE_FRONT = "Sheep/Sheep_Idle/front/Sheep_Idle_front";
const ANIM_SHEEP_SHEEP_IDLE_LEFT_SHEEP_IDLE_LEFT = "Sheep/Sheep_Idle/left/Sheep_Idle_left";
const ANIM_SHEEP_SHEEP_IDLE_RIGHT_SHEEP_IDLE_RIGHT = "Sheep/Sheep_Idle/right/Sheep_Idle_right";
const ANIM_SHEEP_SHEEP_WALK_BACK_SHEEP_WALK_BACK = "Sheep/Sheep_Walk/back/Sheep_walk_back";
const ANIM_SHEEP_SHEEP_WALK_FRONT_SHEEP_WALK_FRONT = "Sheep/Sheep_Walk/front/Sheep_walk_front";
const ANIM_SHEEP_SHEEP_WALK_LEFT_SHEEP_WALK_LEFT = "Sheep/Sheep_Walk/left/Sheep_walk_left";
const ANIM_SHEEP_SHEEP_WALK_RIGHT_SHEEP_WALK_RIGHT = "Sheep/Sheep_Walk/right/Sheep_walk_right";

export const ANIM_SHEEP2_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: ANIM_SHEEP_SHEEP_IDLE_BACK_SHEEP_IDLE_BACK },
    southeast: { key: ANIM_SHEEP_SHEEP_IDLE_FRONT_SHEEP_IDLE_FRONT },
    southwest: { key: ANIM_SHEEP_SHEEP_IDLE_LEFT_SHEEP_IDLE_LEFT },
    northeast: { key: ANIM_SHEEP_SHEEP_IDLE_RIGHT_SHEEP_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    northwest: { key: ANIM_SHEEP_SHEEP_WALK_BACK_SHEEP_WALK_BACK },
    southeast: { key: ANIM_SHEEP_SHEEP_WALK_FRONT_SHEEP_WALK_FRONT },
    southwest: { key: ANIM_SHEEP_SHEEP_WALK_LEFT_SHEEP_WALK_LEFT },
    northeast: { key: ANIM_SHEEP_SHEEP_WALK_RIGHT_SHEEP_WALK_RIGHT }
  }
};
