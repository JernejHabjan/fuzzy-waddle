import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

import type { ObjectNames } from "./object-names";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
/** Creates one construction site and assigns the addressed builders atomically. */
export interface ConstructCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Construct;
  readonly actorName: ObjectNames;
  readonly tileVec3: Vector3Simple;
  readonly siteKey: string;
}
