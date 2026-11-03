import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
/** Casts a runtime-defined spell at an actor and/or logical tile. */
export interface CastSpellCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CastSpell;
  readonly spellType: string;
  readonly targetObjectId?: ActorId;
  readonly tileVec3: Vector3Simple;
}
