import { type AnimationDefinitionMap } from "../../../entity/actor/components/animation-actor-component";
import { AnimationType } from "../../../entity/actor/components/animation/animation-type";

const ANIM_WOLF_BITE_NE = "wolf/bite/ne";
const ANIM_WOLF_BITE_NW = "wolf/bite/nw";
const ANIM_WOLF_BITE_SE = "wolf/bite/se";
const ANIM_WOLF_BITE_SW = "wolf/bite/sw";
const ANIM_WOLF_DEATH_NE = "wolf/death/ne";
const ANIM_WOLF_DEATH_NW = "wolf/death/nw";
const ANIM_WOLF_DEATH_SE = "wolf/death/se";
const ANIM_WOLF_DEATH_SW = "wolf/death/sw";
const ANIM_WOLF_HOWL_NE = "wolf/howl/ne";
const ANIM_WOLF_HOWL_NW = "wolf/howl/nw";
const ANIM_WOLF_HOWL_SE = "wolf/howl/se";
const ANIM_WOLF_HOWL_SW = "wolf/howl/sw";
const ANIM_WOLF_IDLE_NE = "wolf/idle/ne";
const ANIM_WOLF_IDLE_NW = "wolf/idle/nw";
const ANIM_WOLF_IDLE_SE = "wolf/idle/se";
const ANIM_WOLF_IDLE_SW = "wolf/idle/sw";
const ANIM_WOLF_RUN_NE = "wolf/run/ne";
const ANIM_WOLF_RUN_NW = "wolf/run/nw";
const ANIM_WOLF_RUN_SE = "wolf/run/se";
const ANIM_WOLF_RUN_SW = "wolf/run/sw";

export const ANIM_WOLF_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_WOLF_IDLE_NE },
    northwest: { key: ANIM_WOLF_IDLE_NW },
    southeast: { key: ANIM_WOLF_IDLE_SE },
    southwest: { key: ANIM_WOLF_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_WOLF_RUN_NE },
    northwest: { key: ANIM_WOLF_RUN_NW },
    southeast: { key: ANIM_WOLF_RUN_SE },
    southwest: { key: ANIM_WOLF_RUN_SW }
  },
  [AnimationType.Death]: {
    northeast: { key: ANIM_WOLF_DEATH_NE },
    northwest: { key: ANIM_WOLF_DEATH_NW },
    southeast: { key: ANIM_WOLF_DEATH_SE },
    southwest: { key: ANIM_WOLF_DEATH_SW }
  },
  [AnimationType.LargeSlash]: {
    northeast: { key: ANIM_WOLF_BITE_NE },
    northwest: { key: ANIM_WOLF_BITE_NW },
    southeast: { key: ANIM_WOLF_BITE_SE },
    southwest: { key: ANIM_WOLF_BITE_SW }
  },
  howl: {
    // todo
    northeast: { key: ANIM_WOLF_HOWL_NE },
    northwest: { key: ANIM_WOLF_HOWL_NW },
    southeast: { key: ANIM_WOLF_HOWL_SE },
    southwest: { key: ANIM_WOLF_HOWL_SW }
  }
};
