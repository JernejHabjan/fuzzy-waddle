// The constants with the animation keys.

import { AnimationDefinitionMap, AnimationType } from "../entity/actor/components/animation-actor-component";

const ANIM_BADGER_BURROW_NE = "badger/burrow/ne";

const ANIM_BADGER_BURROW_NW = "badger/burrow/nw";

const ANIM_BADGER_BURROW_SE = "badger/burrow/se";

const ANIM_BADGER_BURROW_SW = "badger/burrow/sw";

const ANIM_BADGER_IDLE_NE = "badger/idle/ne";

const ANIM_BADGER_IDLE_NW = "badger/idle/nw";

const ANIM_BADGER_IDLE_SE = "badger/idle/se";

const ANIM_BADGER_IDLE_SW = "badger/idle/sw";

const ANIM_BADGER_TUNNEL_NE = "badger/tunnel/ne";

const ANIM_BADGER_TUNNEL_NW = "badger/tunnel/nw";

const ANIM_BADGER_TUNNEL_SE = "badger/tunnel/se";

const ANIM_BADGER_TUNNEL_SW = "badger/tunnel/sw";

const ANIM_BADGER_UNBORROW_NE = "badger/unborrow/ne";

const ANIM_BADGER_UNBORROW_NW = "badger/unborrow/nw";

const ANIM_BADGER_UNBORROW_SE = "badger/unborrow/se";

const ANIM_BADGER_UNBORROW_SW = "badger/unborrow/sw";

const ANIM_BADGER_WALK_NE = "badger/walk/ne";

const ANIM_BADGER_WALK_NW = "badger/walk/nw";

const ANIM_BADGER_WALK_SE = "badger/walk/se";

const ANIM_BADGER_WALK_SW = "badger/walk/sw";

const ANIM_BOAR_IDLE_NE = "boar/idle/ne";

const ANIM_BOAR_IDLE_NW = "boar/idle/nw";

const ANIM_BOAR_IDLE_SE = "boar/idle/se";

const ANIM_BOAR_IDLE_SW = "boar/idle/sw";

const ANIM_BOAR_RUN_NE = "boar/run/ne";

const ANIM_BOAR_RUN_NW = "boar/run/nw";

const ANIM_BOAR_RUN_SE = "boar/run/se";

const ANIM_BOAR_RUN_SW = "boar/run/sw";

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

// Badger Animation Definitions
export const ANIM_BADGER_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_BADGER_IDLE_NE },
    northwest: { key: ANIM_BADGER_IDLE_NW },
    southeast: { key: ANIM_BADGER_IDLE_SE },
    southwest: { key: ANIM_BADGER_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_BADGER_WALK_NE },
    northwest: { key: ANIM_BADGER_WALK_NW },
    southeast: { key: ANIM_BADGER_WALK_SE },
    southwest: { key: ANIM_BADGER_WALK_SW }
  },
  // Custom badger animations
  burrow: {
    // todo
    northeast: { key: ANIM_BADGER_BURROW_NE },
    northwest: { key: ANIM_BADGER_BURROW_NW },
    southeast: { key: ANIM_BADGER_BURROW_SE },
    southwest: { key: ANIM_BADGER_BURROW_SW }
  },
  unburrow: {
    // todo
    northeast: { key: ANIM_BADGER_UNBORROW_NE },
    northwest: { key: ANIM_BADGER_UNBORROW_NW },
    southeast: { key: ANIM_BADGER_UNBORROW_SE },
    southwest: { key: ANIM_BADGER_UNBORROW_SW }
  },
  tunnel: {
    // todo
    northeast: { key: ANIM_BADGER_TUNNEL_NE },
    northwest: { key: ANIM_BADGER_TUNNEL_NW },
    southeast: { key: ANIM_BADGER_TUNNEL_SE },
    southwest: { key: ANIM_BADGER_TUNNEL_SW }
  }
};

// Boar Animation Definitions
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

// Stag Animation Definitions
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

// Wolf Animation Definitions
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
