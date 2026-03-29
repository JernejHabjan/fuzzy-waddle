import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ORC_BOOMERANG_HURT = "orc_boomerang_hurt";
const ANIM_ORC_BOOMERANG_IDLE = "orc_boomerang_idle";
const ANIM_ORC_BOOMERANG_IDLE_1 = "orc_boomerang_idle_1";
const ANIM_ORC_BOOMERANG_IDLE_2 = "orc_boomerang_idle_2";
const ANIM_ORC_BOOMERANG_IDLE_3 = "orc_boomerang_idle_3";
const ANIM_ORC_BOOMERANG_SLASH = "orc_boomerang_slash";
const ANIM_ORC_BOOMERANG_SLASH_1 = "orc_boomerang_slash_1";
const ANIM_ORC_BOOMERANG_SLASH_2 = "orc_boomerang_slash_2";
const ANIM_ORC_BOOMERANG_SLASH_3 = "orc_boomerang_slash_3";
const ANIM_ORC_BOOMERANG_WALK = "orc_boomerang_walk";
const ANIM_ORC_BOOMERANG_WALK_1 = "orc_boomerang_walk_1";
const ANIM_ORC_BOOMERANG_WALK_2 = "orc_boomerang_walk_2";
const ANIM_ORC_BOOMERANG_WALK_3 = "orc_boomerang_walk_3";

export const ANIM_ORC_BOOMERANG_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ORC_BOOMERANG_IDLE },
    south: { key: ANIM_ORC_BOOMERANG_IDLE_2 },
    west: { key: ANIM_ORC_BOOMERANG_IDLE_1 },
    east: { key: ANIM_ORC_BOOMERANG_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ORC_BOOMERANG_WALK },
    south: { key: ANIM_ORC_BOOMERANG_WALK_2 },
    west: { key: ANIM_ORC_BOOMERANG_WALK_1 },
    east: { key: ANIM_ORC_BOOMERANG_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_ORC_BOOMERANG_SLASH },
    south: { key: ANIM_ORC_BOOMERANG_SLASH_2 },
    west: { key: ANIM_ORC_BOOMERANG_SLASH_1 },
    east: { key: ANIM_ORC_BOOMERANG_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ORC_BOOMERANG_HURT },
    south: { key: ANIM_ORC_BOOMERANG_HURT },
    west: { key: ANIM_ORC_BOOMERANG_HURT },
    east: { key: ANIM_ORC_BOOMERANG_HURT }
  }
};
