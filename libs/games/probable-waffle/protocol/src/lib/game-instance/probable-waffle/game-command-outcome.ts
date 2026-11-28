import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";

import type { GameCommandOutcomeKind } from "./game-command-outcome-kind";
import type { GameCommandOutcomeReason } from "./game-command-outcome-reason";
/** One authoritative lifecycle observation for a command effect. */
export interface GameCommandOutcome {
  readonly schemaVersion: 1;
  readonly kind: GameCommandOutcomeKind;
  readonly reason: GameCommandOutcomeReason;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly commandId: string;
  readonly commitmentKey: string;
  readonly authorityEpoch: number;
  readonly sequence: number;
  readonly intentId?: string;
  readonly effectId?: string;
  readonly actorIds: readonly ActorId[];
  readonly worldLinkIds: readonly string[];
  readonly detail?: string;
}
