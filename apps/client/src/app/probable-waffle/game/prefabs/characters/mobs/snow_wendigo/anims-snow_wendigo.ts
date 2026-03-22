import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_SNOW_WENDIGO_IDLE_NE = "snow_wendigo/idle/ne";
const ANIM_SNOW_WENDIGO_IDLE_NW = "snow_wendigo/idle/nw";
const ANIM_SNOW_WENDIGO_IDLE_SE = "snow_wendigo/idle/se";
const ANIM_SNOW_WENDIGO_IDLE_SW = "snow_wendigo/idle/sw";
const ANIM_SNOW_WENDIGO_RUN_NE = "snow_wendigo/run/ne";
const ANIM_SNOW_WENDIGO_RUN_NW = "snow_wendigo/run/nw";
const ANIM_SNOW_WENDIGO_RUN_SE = "snow_wendigo/run/se";
const ANIM_SNOW_WENDIGO_RUN_SW = "snow_wendigo/run/sw";

export const ANIM_SNOW_WENDIGO_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_SNOW_WENDIGO_IDLE_NE },
    northwest: { key: ANIM_SNOW_WENDIGO_IDLE_NW },
    southeast: { key: ANIM_SNOW_WENDIGO_IDLE_SE },
    southwest: { key: ANIM_SNOW_WENDIGO_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_SNOW_WENDIGO_RUN_NE },
    northwest: { key: ANIM_SNOW_WENDIGO_RUN_NW },
    southeast: { key: ANIM_SNOW_WENDIGO_RUN_SE },
    southwest: { key: ANIM_SNOW_WENDIGO_RUN_SW }
  }
};
