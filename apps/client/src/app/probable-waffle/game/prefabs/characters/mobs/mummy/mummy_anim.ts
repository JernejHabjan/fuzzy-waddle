import { type AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MUMMY_HURT = "mummy_hurt";
const ANIM_MUMMY_IDLE = "mummy_idle";
const ANIM_MUMMY_IDLE_1 = "mummy_idle_1";
const ANIM_MUMMY_IDLE_2 = "mummy_idle_2";
const ANIM_MUMMY_IDLE_3 = "mummy_idle_3";
const ANIM_MUMMY_SLASH = "mummy_slash";
const ANIM_MUMMY_SLASH_1 = "mummy_slash_1";
const ANIM_MUMMY_SLASH_2 = "mummy_slash_2";
const ANIM_MUMMY_SLASH_3 = "mummy_slash_3";
const ANIM_MUMMY_WALK = "mummy_walk";
const ANIM_MUMMY_WALK_1 = "mummy_walk_1";
const ANIM_MUMMY_WALK_2 = "mummy_walk_2";
const ANIM_MUMMY_WALK_3 = "mummy_walk_3";
const ANIM_MUMMY_CAST = "mummy_cast";
const ANIM_MUMMY_CAST_1 = "mummy_cast_1";
const ANIM_MUMMY_CAST_2 = "mummy_cast_2";
const ANIM_MUMMY_CAST_3 = "mummy_cast_3";

export const ANIM_MUMMY_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_MUMMY_IDLE },
    south: { key: ANIM_MUMMY_IDLE_2 },
    west: { key: ANIM_MUMMY_IDLE_1 },
    east: { key: ANIM_MUMMY_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_MUMMY_WALK },
    south: { key: ANIM_MUMMY_WALK_2 },
    west: { key: ANIM_MUMMY_WALK_1 },
    east: { key: ANIM_MUMMY_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_MUMMY_SLASH },
    south: { key: ANIM_MUMMY_SLASH_2 },
    west: { key: ANIM_MUMMY_SLASH_1 },
    east: { key: ANIM_MUMMY_SLASH_3 }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_MUMMY_CAST },
    south: { key: ANIM_MUMMY_CAST_2 },
    west: { key: ANIM_MUMMY_CAST_1 },
    east: { key: ANIM_MUMMY_CAST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_MUMMY_HURT },
    south: { key: ANIM_MUMMY_HURT },
    west: { key: ANIM_MUMMY_HURT },
    east: { key: ANIM_MUMMY_HURT }
  }
};
