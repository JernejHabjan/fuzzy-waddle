import type { ActorId, GameInstanceId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AiCommandId, AiDeadline, AiEffectId, AiIntentId, AiSimulationTick } from "./ai-core-types";

/** Authority-fenced identity shared across dispatch, application and replay. */
export interface AiCommandIdentity {
  readonly matchId: GameInstanceId;
  readonly authorityEpoch: number;
  readonly playerNumber: PlayerNumber;
  readonly sequence: number;
  readonly commandId: AiCommandId;
  readonly effectId: AiEffectId;
  readonly intentId: AiIntentId;
}

/** Shared lifecycle outcome; sent, applied and completed are intentionally distinct. */
export type AiCommandOutcome =
  | { readonly kind: "dispatched"; readonly identity: AiCommandIdentity; readonly tick: AiSimulationTick }
  | {
      readonly kind: "applied";
      readonly identity: AiCommandIdentity;
      readonly tick: AiSimulationTick;
      readonly worldLinkIds: readonly string[];
    }
  | {
      readonly kind: "active";
      readonly identity: AiCommandIdentity;
      readonly tick: AiSimulationTick;
      readonly actorIds: readonly ActorId[];
    }
  | {
      readonly kind: "completed";
      readonly identity: AiCommandIdentity;
      readonly tick: AiSimulationTick;
      readonly resultingActorIds: readonly ActorId[];
      readonly worldLinkIds?: readonly string[];
    }
  | {
      readonly kind: "rejected" | "cancelled" | "failed";
      readonly identity: AiCommandIdentity;
      readonly tick: AiSimulationTick;
      readonly reason: string;
    };

/** Persisted reconciliation cursor and bounded unresolved command set. */
export interface AiAuthorityState {
  readonly authorityEpoch: number;
  /** Highest terminal sequence, or -1 before the first terminal command. */
  readonly processedSequenceWatermark: number;
  readonly pendingCommandIds: readonly AiCommandId[];
  readonly pendingLimit: number;
  readonly reconciliationDeadline: AiDeadline | null;
  readonly health: "healthy" | "reconciling" | "technical_fault";
}
