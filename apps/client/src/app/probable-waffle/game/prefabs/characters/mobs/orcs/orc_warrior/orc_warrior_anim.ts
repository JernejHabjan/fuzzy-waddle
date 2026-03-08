import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ORC_WARRIOR_HURT = "orc_warrior_hurt";
const ANIM_ORC_WARRIOR_IDLE = "orc_warrior_idle";
const ANIM_ORC_WARRIOR_IDLE_1 = "orc_warrior_idle_1";
const ANIM_ORC_WARRIOR_IDLE_2 = "orc_warrior_idle_2";
const ANIM_ORC_WARRIOR_IDLE_3 = "orc_warrior_idle_3";
const ANIM_ORC_WARRIOR_SLASH = "orc_warrior_slash";
const ANIM_ORC_WARRIOR_SLASH_1 = "orc_warrior_slash_1";
const ANIM_ORC_WARRIOR_SLASH_2 = "orc_warrior_slash_2";
const ANIM_ORC_WARRIOR_SLASH_3 = "orc_warrior_slash_3";
const ANIM_ORC_WARRIOR_WALK = "orc_warrior_walk";
const ANIM_ORC_WARRIOR_WALK_1 = "orc_warrior_walk_1";
const ANIM_ORC_WARRIOR_WALK_2 = "orc_warrior_walk_2";
const ANIM_ORC_WARRIOR_WALK_3 = "orc_warrior_walk_3";

export const ANIM_ORC_WARRIOR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ORC_WARRIOR_IDLE },
    south: { key: ANIM_ORC_WARRIOR_IDLE_2 },
    west: { key: ANIM_ORC_WARRIOR_IDLE_1 },
    east: { key: ANIM_ORC_WARRIOR_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ORC_WARRIOR_WALK },
    south: { key: ANIM_ORC_WARRIOR_WALK_2 },
    west: { key: ANIM_ORC_WARRIOR_WALK_1 },
    east: { key: ANIM_ORC_WARRIOR_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_ORC_WARRIOR_SLASH },
    south: { key: ANIM_ORC_WARRIOR_SLASH_2 },
    west: { key: ANIM_ORC_WARRIOR_SLASH_1 },
    east: { key: ANIM_ORC_WARRIOR_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ORC_WARRIOR_HURT },
    south: { key: ANIM_ORC_WARRIOR_HURT },
    west: { key: ANIM_ORC_WARRIOR_HURT },
    east: { key: ANIM_ORC_WARRIOR_HURT }
  }
};
