import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ZOMBIE3_HURT = "zombie3_hurt";
const ANIM_ZOMBIE3_IDLE = "zombie3_idle";
const ANIM_ZOMBIE3_IDLE_1 = "zombie3_idle_1";
const ANIM_ZOMBIE3_IDLE_2 = "zombie3_idle_2";
const ANIM_ZOMBIE3_IDLE_3 = "zombie3_idle_3";
const ANIM_ZOMBIE3_SLASH = "zombie3_slash";
const ANIM_ZOMBIE3_SLASH_1 = "zombie3_slash_1";
const ANIM_ZOMBIE3_SLASH_2 = "zombie3_slash_2";
const ANIM_ZOMBIE3_SLASH_3 = "zombie3_slash_3";
const ANIM_ZOMBIE3_WALK = "zombie3_walk";
const ANIM_ZOMBIE3_WALK_1 = "zombie3_walk_1";
const ANIM_ZOMBIE3_WALK_2 = "zombie3_walk_2";
const ANIM_ZOMBIE3_WALK_3 = "zombie3_walk_3";

export const ANIM_ZOMBIE3_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ZOMBIE3_IDLE },
    south: { key: ANIM_ZOMBIE3_IDLE_2 },
    west: { key: ANIM_ZOMBIE3_IDLE_1 },
    east: { key: ANIM_ZOMBIE3_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ZOMBIE3_WALK },
    south: { key: ANIM_ZOMBIE3_WALK_2 },
    west: { key: ANIM_ZOMBIE3_WALK_1 },
    east: { key: ANIM_ZOMBIE3_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_ZOMBIE3_SLASH },
    south: { key: ANIM_ZOMBIE3_SLASH_2 },
    west: { key: ANIM_ZOMBIE3_SLASH_1 },
    east: { key: ANIM_ZOMBIE3_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ZOMBIE3_HURT },
    south: { key: ANIM_ZOMBIE3_HURT },
    west: { key: ANIM_ZOMBIE3_HURT },
    east: { key: ANIM_ZOMBIE3_HURT }
  }
};
