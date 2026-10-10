import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import type { GameCommandOutcome } from "./game-command-outcome";
/** Persisted deduplication frontier used by save, reconnect and host migration. */
export interface GameCommandAuthorityState {
  readonly schemaVersion: 1;
  readonly authorityEpoch: number;
  readonly nextSequenceByPlayer: Readonly<Record<number, number>>;
  readonly processedSequenceWatermarkByPlayer?: Readonly<Record<number, number>>;
  readonly processedCommandIds: readonly string[];
  readonly activeCommitments?: Readonly<Record<string, string>>;
  readonly activeCommandProgress?: Readonly<
    Record<string, { readonly expectedActorIds: readonly ActorId[]; readonly terminalActorIds: readonly ActorId[] }>
  >;
  readonly outcomes: readonly GameCommandOutcome[];
}
