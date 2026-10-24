import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBaseId, AiDeadlineV1, AiSimulationTick } from "../ai-core-types";

/** A bounded, player-fair incident built only from permitted hostile evidence. */
export interface AiThreatIncidentV1 {
  readonly incidentId: string;
  readonly baseId: AiBaseId | null;
  readonly regionId: string | null;
  readonly hostileActorIds: readonly ActorId[];
  readonly kind:
    | "worker_harassment"
    | "army_pressure"
    | "flyer"
    | "naval"
    | "transport_landing"
    | "proxy_blocker"
    | "unknown";
  readonly confidencePermille: number;
  readonly severity: number;
  readonly createdTick: AiSimulationTick;
  readonly expiresAt: AiDeadlineV1;
}
