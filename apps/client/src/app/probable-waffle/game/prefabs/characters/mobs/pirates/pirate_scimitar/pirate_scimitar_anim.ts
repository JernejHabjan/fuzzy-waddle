import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_PIRATE_SCIMITAR_HURT = "pirate_scimitar_hurt";
const ANIM_PIRATE_SCIMITAR_IDLE = "pirate_scimitar_idle";
const ANIM_PIRATE_SCIMITAR_IDLE_1 = "pirate_scimitar_idle_1";
const ANIM_PIRATE_SCIMITAR_IDLE_2 = "pirate_scimitar_idle_2";
const ANIM_PIRATE_SCIMITAR_IDLE_3 = "pirate_scimitar_idle_3";
const ANIM_PIRATE_SCIMITAR_SLASH = "pirate_scimitar_slash";
const ANIM_PIRATE_SCIMITAR_SLASH_1 = "pirate_scimitar_slash_1";
const ANIM_PIRATE_SCIMITAR_SLASH_2 = "pirate_scimitar_slash_2";
const ANIM_PIRATE_SCIMITAR_SLASH_3 = "pirate_scimitar_slash_3";
const ANIM_PIRATE_SCIMITAR_WALK = "pirate_scimitar_walk";
const ANIM_PIRATE_SCIMITAR_WALK_1 = "pirate_scimitar_walk_1";
const ANIM_PIRATE_SCIMITAR_WALK_2 = "pirate_scimitar_walk_2";
const ANIM_PIRATE_SCIMITAR_WALK_3 = "pirate_scimitar_walk_3";

export const ANIM_PIRATE_SCIMITAR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_PIRATE_SCIMITAR_IDLE },
    south: { key: ANIM_PIRATE_SCIMITAR_IDLE_2 },
    west: { key: ANIM_PIRATE_SCIMITAR_IDLE_1 },
    east: { key: ANIM_PIRATE_SCIMITAR_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_PIRATE_SCIMITAR_WALK },
    south: { key: ANIM_PIRATE_SCIMITAR_WALK_2 },
    west: { key: ANIM_PIRATE_SCIMITAR_WALK_1 },
    east: { key: ANIM_PIRATE_SCIMITAR_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_PIRATE_SCIMITAR_SLASH },
    south: { key: ANIM_PIRATE_SCIMITAR_SLASH_2 },
    west: { key: ANIM_PIRATE_SCIMITAR_SLASH_1 },
    east: { key: ANIM_PIRATE_SCIMITAR_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_PIRATE_SCIMITAR_HURT },
    south: { key: ANIM_PIRATE_SCIMITAR_HURT },
    west: { key: ANIM_PIRATE_SCIMITAR_HURT },
    east: { key: ANIM_PIRATE_SCIMITAR_HURT }
  }
};
