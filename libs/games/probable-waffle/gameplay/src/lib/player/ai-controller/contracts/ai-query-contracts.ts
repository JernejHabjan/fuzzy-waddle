import type { AiDeadlineV1, AiQueryId, AiSimulationTick } from "./ai-core-types";

/** Independent, bounded query status so optional navigation cannot stall local defense. */
export interface AiQueryStateV1 {
  readonly queryId: AiQueryId;
  readonly kind: "route" | "landing" | "placement" | "threat_region" | "visibility";
  readonly generation: number;
  readonly inputRevision: number;
  readonly status: "not_ready" | "ready" | "unknown" | "blocked" | "service_failed" | "stale";
  readonly ownerId: string;
  readonly createdTick: AiSimulationTick;
  readonly updatedTick: AiSimulationTick;
  readonly deadline: AiDeadlineV1;
  readonly continuationCursor: number;
}
