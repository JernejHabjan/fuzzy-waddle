import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
const ANIM_FLYING_DEMON_BLUE_IDLE_NE = "flying_demon_blue/idle/ne";
const ANIM_FLYING_DEMON_BLUE_IDLE_NW = "flying_demon_blue/idle/nw";
const ANIM_FLYING_DEMON_BLUE_IDLE_SE = "flying_demon_blue/idle/se";
const ANIM_FLYING_DEMON_BLUE_IDLE_SW = "flying_demon_blue/idle/sw";
const ANIM_FLYING_DEMON_BLUE_RUN_NE = "flying_demon_blue/run/ne";
const ANIM_FLYING_DEMON_BLUE_RUN_NW = "flying_demon_blue/run/nw";
const ANIM_FLYING_DEMON_BLUE_RUN_SE = "flying_demon_blue/run/se";
const ANIM_FLYING_DEMON_BLUE_RUN_SW = "flying_demon_blue/run/sw";

export const ANIM_FLYING_DEMON_BLUE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_FLYING_DEMON_BLUE_IDLE_NE },
    northwest: { key: ANIM_FLYING_DEMON_BLUE_IDLE_NW },
    southeast: { key: ANIM_FLYING_DEMON_BLUE_IDLE_SE },
    southwest: { key: ANIM_FLYING_DEMON_BLUE_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_FLYING_DEMON_BLUE_RUN_NE },
    northwest: { key: ANIM_FLYING_DEMON_BLUE_RUN_NW },
    southeast: { key: ANIM_FLYING_DEMON_BLUE_RUN_SE },
    southwest: { key: ANIM_FLYING_DEMON_BLUE_RUN_SW }
  }
};
