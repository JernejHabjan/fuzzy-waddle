import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ZOMBIE1_HURT = "zombie1_hurt";
const ANIM_ZOMBIE1_IDLE = "zombie1_idle";
const ANIM_ZOMBIE1_IDLE_1 = "zombie1_idle_1";
const ANIM_ZOMBIE1_IDLE_2 = "zombie1_idle_2";
const ANIM_ZOMBIE1_IDLE_3 = "zombie1_idle_3";
const ANIM_ZOMBIE1_SLASH = "zombie1_slash";
const ANIM_ZOMBIE1_SLASH_1 = "zombie1_slash_1";
const ANIM_ZOMBIE1_SLASH_2 = "zombie1_slash_2";
const ANIM_ZOMBIE1_SLASH_3 = "zombie1_slash_3";
const ANIM_ZOMBIE1_WALK = "zombie1_walk";
const ANIM_ZOMBIE1_WALK_1 = "zombie1_walk_1";
const ANIM_ZOMBIE1_WALK_2 = "zombie1_walk_2";
const ANIM_ZOMBIE1_WALK_3 = "zombie1_walk_3";

export const ANIM_ZOMBIE1_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ZOMBIE1_IDLE },
    south: { key: ANIM_ZOMBIE1_IDLE_2 },
    west: { key: ANIM_ZOMBIE1_IDLE_1 },
    east: { key: ANIM_ZOMBIE1_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ZOMBIE1_WALK },
    south: { key: ANIM_ZOMBIE1_WALK_2 },
    west: { key: ANIM_ZOMBIE1_WALK_1 },
    east: { key: ANIM_ZOMBIE1_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_ZOMBIE1_SLASH },
    south: { key: ANIM_ZOMBIE1_SLASH_2 },
    west: { key: ANIM_ZOMBIE1_SLASH_1 },
    east: { key: ANIM_ZOMBIE1_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ZOMBIE1_HURT },
    south: { key: ANIM_ZOMBIE1_HURT },
    west: { key: ANIM_ZOMBIE1_HURT },
    east: { key: ANIM_ZOMBIE1_HURT }
  }
};
