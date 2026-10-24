import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
/** Unloads all or a selected stable subset of a transport's current cargo. */
export interface UnloadCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Unload;
  readonly passengerIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
}
