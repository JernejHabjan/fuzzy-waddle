import { type AnimationDefinitionMap } from "../../../entity/components/animation/animation-actor-component";
import { AnimationType } from "../../../entity/components/animation/animation-type";

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
    northeast: { key: ANIM_BADGER_BURROW_NE },
    northwest: { key: ANIM_BADGER_BURROW_NW },
    southeast: { key: ANIM_BADGER_BURROW_SE },
    southwest: { key: ANIM_BADGER_BURROW_SW }
  },
  unburrow: {
    northeast: { key: ANIM_BADGER_UNBORROW_NE },
    northwest: { key: ANIM_BADGER_UNBORROW_NW },
    southeast: { key: ANIM_BADGER_UNBORROW_SE },
    southwest: { key: ANIM_BADGER_UNBORROW_SW }
  },
  tunnel: {
    northeast: { key: ANIM_BADGER_TUNNEL_NE },
    northwest: { key: ANIM_BADGER_TUNNEL_NW },
    southeast: { key: ANIM_BADGER_TUNNEL_SE },
    southwest: { key: ANIM_BADGER_TUNNEL_SW }
  }
};
