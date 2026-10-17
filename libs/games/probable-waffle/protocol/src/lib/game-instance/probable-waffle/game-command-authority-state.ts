import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import type { GameCommandOutcome } from "./game-command-outcome";
/** Persisted deduplication frontier used by save, reconnect and host migration. */
export interface GameCommandAuthorityState {
  readonly schemaVersion: 1;
  readonly authorityEpoch: number;
  readonly nextSequenceByPlayer: Readonly<Record<number, number>>;
  readonly processedSequenceWatermarkByPlayer?: Readonly<Record<number, number>>;
  readonly processedCommandIds: readonly string[];
  /** Legacy global keys; restored by the owning command's player identity. New snapshots use the scoped field. */
  readonly activeCommitments?: Readonly<Record<string, string>>;
  /** Player-local opaque commitment key to active command ID, preserving equal keys from different players. */
  readonly activeCommitmentsByPlayer?: Readonly<Record<number, Readonly<Record<string, string>>>>;
  readonly activeCommandProgress?: Readonly<
    Record<string, { readonly expectedActorIds: readonly ActorId[]; readonly terminalActorIds: readonly ActorId[] }>
  >;
  readonly outcomes: readonly GameCommandOutcome[];
}
