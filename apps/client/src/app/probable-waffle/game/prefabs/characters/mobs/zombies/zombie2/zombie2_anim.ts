import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ZOMBIE2_HURT = "zombie2_hurt";
const ANIM_ZOMBIE2_IDLE = "zombie2_idle";
const ANIM_ZOMBIE2_IDLE_1 = "zombie2_idle_1";
const ANIM_ZOMBIE2_IDLE_2 = "zombie2_idle_2";
const ANIM_ZOMBIE2_IDLE_3 = "zombie2_idle_3";
const ANIM_ZOMBIE2_SLASH = "zombie2_slash";
const ANIM_ZOMBIE2_SLASH_1 = "zombie2_slash_1";
const ANIM_ZOMBIE2_SLASH_2 = "zombie2_slash_2";
const ANIM_ZOMBIE2_SLASH_3 = "zombie2_slash_3";
const ANIM_ZOMBIE2_WALK = "zombie2_walk";
const ANIM_ZOMBIE2_WALK_1 = "zombie2_walk_1";
const ANIM_ZOMBIE2_WALK_2 = "zombie2_walk_2";
const ANIM_ZOMBIE2_WALK_3 = "zombie2_walk_3";

export const ANIM_ZOMBIE2_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ZOMBIE2_IDLE },
    south: { key: ANIM_ZOMBIE2_IDLE_2 },
    west: { key: ANIM_ZOMBIE2_IDLE_1 },
    east: { key: ANIM_ZOMBIE2_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ZOMBIE2_WALK },
    south: { key: ANIM_ZOMBIE2_WALK_2 },
    west: { key: ANIM_ZOMBIE2_WALK_1 },
    east: { key: ANIM_ZOMBIE2_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_ZOMBIE2_SLASH },
    south: { key: ANIM_ZOMBIE2_SLASH_2 },
    west: { key: ANIM_ZOMBIE2_SLASH_1 },
    east: { key: ANIM_ZOMBIE2_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ZOMBIE2_HURT },
    south: { key: ANIM_ZOMBIE2_HURT },
    west: { key: ANIM_ZOMBIE2_HURT },
    east: { key: ANIM_ZOMBIE2_HURT }
  }
};
