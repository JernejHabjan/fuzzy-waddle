import { AnimationDefinitionMap, AnimationType } from "../../../entity/actor/components/animation-actor-component";

const ANIM_BOAR_IDLE_NE = "boar/idle/ne";
const ANIM_BOAR_IDLE_NW = "boar/idle/nw";
const ANIM_BOAR_IDLE_SE = "boar/idle/se";
const ANIM_BOAR_IDLE_SW = "boar/idle/sw";
const ANIM_BOAR_RUN_NE = "boar/run/ne";
const ANIM_BOAR_RUN_NW = "boar/run/nw";
const ANIM_BOAR_RUN_SE = "boar/run/se";
const ANIM_BOAR_RUN_SW = "boar/run/sw";

export const ANIM_BOAR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_BOAR_IDLE_NE },
    northwest: { key: ANIM_BOAR_IDLE_NW },
    southeast: { key: ANIM_BOAR_IDLE_SE },
    southwest: { key: ANIM_BOAR_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_BOAR_RUN_NE },
    northwest: { key: ANIM_BOAR_RUN_NW },
    southeast: { key: ANIM_BOAR_RUN_SE },
    southwest: { key: ANIM_BOAR_RUN_SW }
  }
};
