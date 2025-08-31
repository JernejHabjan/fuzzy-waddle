import { type AnimationDefinitionMap } from "../../../entity/components/animation/animation-actor-component";
import { AnimationType } from "../../../entity/components/animation/animation-type";

const ANIM_STAG_IDLE_NE = "stag/idle/ne";
const ANIM_STAG_IDLE_NW = "stag/idle/nw";
const ANIM_STAG_IDLE_SE = "stag/idle/se";
const ANIM_STAG_IDLE_SW = "stag/idle/sw";
const ANIM_STAG_RUN_NE = "stag/run/ne";
const ANIM_STAG_RUN_NW = "stag/run/nw";
const ANIM_STAG_RUN_SE = "stag/run/se";
const ANIM_STAG_RUN_SW = "stag/run/sw";
const ANIM_STAG_WALK_NE = "stag/walk/ne";
const ANIM_STAG_WALK_NW = "stag/walk/nw";
const ANIM_STAG_WALK_SE = "stag/walk/se";
const ANIM_STAG_WALK_SW = "stag/walk/sw";

export const ANIM_STAG_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_STAG_IDLE_NE },
    northwest: { key: ANIM_STAG_IDLE_NW },
    southeast: { key: ANIM_STAG_IDLE_SE },
    southwest: { key: ANIM_STAG_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_STAG_WALK_NE },
    northwest: { key: ANIM_STAG_WALK_NW },
    southeast: { key: ANIM_STAG_WALK_SE },
    southwest: { key: ANIM_STAG_WALK_SW }
  },
  run: {
    // todo
    northeast: { key: ANIM_STAG_RUN_NE },
    northwest: { key: ANIM_STAG_RUN_NW },
    southeast: { key: ANIM_STAG_RUN_SE },
    southwest: { key: ANIM_STAG_RUN_SW }
  }
};
