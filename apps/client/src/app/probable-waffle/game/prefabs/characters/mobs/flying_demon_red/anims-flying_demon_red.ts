import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_FLYING_DEMON_RED_IDLE_NE = "flying_demon_red/idle/ne";
const ANIM_FLYING_DEMON_RED_IDLE_NW = "flying_demon_red/idle/nw";
const ANIM_FLYING_DEMON_RED_IDLE_SE = "flying_demon_red/idle/se";
const ANIM_FLYING_DEMON_RED_IDLE_SW = "flying_demon_red/idle/sw";
const ANIM_FLYING_DEMON_RED_RUN_NE = "flying_demon_red/run/ne";
const ANIM_FLYING_DEMON_RED_RUN_NW = "flying_demon_red/run/nw";
const ANIM_FLYING_DEMON_RED_RUN_SE = "flying_demon_red/run/se";
const ANIM_FLYING_DEMON_RED_RUN_SW = "flying_demon_red/run/sw";

export const ANIM_FLYING_DEMON_RED_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_FLYING_DEMON_RED_IDLE_NE },
    northwest: { key: ANIM_FLYING_DEMON_RED_IDLE_NW },
    southeast: { key: ANIM_FLYING_DEMON_RED_IDLE_SE },
    southwest: { key: ANIM_FLYING_DEMON_RED_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_FLYING_DEMON_RED_RUN_NE },
    northwest: { key: ANIM_FLYING_DEMON_RED_RUN_NW },
    southeast: { key: ANIM_FLYING_DEMON_RED_RUN_SE },
    southwest: { key: ANIM_FLYING_DEMON_RED_RUN_SW }
  }
};
