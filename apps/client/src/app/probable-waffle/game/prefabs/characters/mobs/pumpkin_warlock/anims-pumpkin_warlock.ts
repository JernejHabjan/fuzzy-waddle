import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_PUMPKIN_WARLOCK_IDLE_NE = "pumpkin_warlock/idle/ne";
const ANIM_PUMPKIN_WARLOCK_IDLE_NW = "pumpkin_warlock/idle/nw";
const ANIM_PUMPKIN_WARLOCK_IDLE_SE = "pumpkin_warlock/idle/se";
const ANIM_PUMPKIN_WARLOCK_IDLE_SW = "pumpkin_warlock/idle/sw";
const ANIM_PUMPKIN_WARLOCK_RUN_NE = "pumpkin_warlock/run/ne";
const ANIM_PUMPKIN_WARLOCK_RUN_NW = "pumpkin_warlock/run/nw";
const ANIM_PUMPKIN_WARLOCK_RUN_SE = "pumpkin_warlock/run/se";
const ANIM_PUMPKIN_WARLOCK_RUN_SW = "pumpkin_warlock/run/sw";

export const ANIM_PUMPKIN_WARLOCK_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_PUMPKIN_WARLOCK_IDLE_NE },
    northwest: { key: ANIM_PUMPKIN_WARLOCK_IDLE_NW },
    southeast: { key: ANIM_PUMPKIN_WARLOCK_IDLE_SE },
    southwest: { key: ANIM_PUMPKIN_WARLOCK_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_PUMPKIN_WARLOCK_RUN_NE },
    northwest: { key: ANIM_PUMPKIN_WARLOCK_RUN_NW },
    southeast: { key: ANIM_PUMPKIN_WARLOCK_RUN_SE },
    southwest: { key: ANIM_PUMPKIN_WARLOCK_RUN_SW }
  }
};
