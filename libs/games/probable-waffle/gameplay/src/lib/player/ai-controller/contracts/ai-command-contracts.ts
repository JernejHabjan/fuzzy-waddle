import type { ActorId, GameInstanceId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AiCommandId, AiDeadlineV1, AiEffectId, AiIntentId, AiSimulationTick } from "./ai-core-types";

/** Authority-fenced identity shared across dispatch, application and replay. */
export interface AiCommandIdentityV1 {
  readonly matchId: GameInstanceId;
  readonly authorityEpoch: number;
  readonly playerNumber: PlayerNumber;
  readonly sequence: number;
  readonly commandId: AiCommandId;
  readonly effectId: AiEffectId;
  readonly intentId: AiIntentId;
}

/** Shared lifecycle outcome; sent, applied and completed are intentionally distinct. */
export type AiCommandOutcomeV1 =
  | { readonly kind: "dispatched"; readonly identity: AiCommandIdentityV1; readonly tick: AiSimulationTick }
  | {
      readonly kind: "applied";
      readonly identity: AiCommandIdentityV1;
      readonly tick: AiSimulationTick;
      readonly worldLinkIds: readonly string[];
    }
  | {
      readonly kind: "active";
      readonly identity: AiCommandIdentityV1;
      readonly tick: AiSimulationTick;
      readonly actorIds: readonly ActorId[];
    }
  | {
      readonly kind: "completed";
      readonly identity: AiCommandIdentityV1;
      readonly tick: AiSimulationTick;
      readonly resultingActorIds: readonly ActorId[];
    }
  | {
      readonly kind: "rejected" | "cancelled" | "failed";
      readonly identity: AiCommandIdentityV1;
      readonly tick: AiSimulationTick;
      readonly reason: string;
    };

/** Persisted reconciliation cursor and bounded unresolved command set. */
export interface AiAuthorityStateV1 {
  readonly authorityEpoch: number;
  readonly processedSequenceWatermark: number;
  readonly pendingCommandIds: readonly AiCommandId[];
  readonly pendingLimit: number;
  readonly reconciliationDeadline: AiDeadlineV1 | null;
  readonly health: "healthy" | "reconciling" | "technical_fault";
}
