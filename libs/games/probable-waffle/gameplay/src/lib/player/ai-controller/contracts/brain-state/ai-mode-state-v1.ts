import type { AiSimulationTick } from "../ai-core-types";

/** Mode evaluation is saved so a reload cannot forget a chronic loss or duplicate concession. */
export interface AiModeStateV1 {
  readonly state: "active" | "winning" | "hopeless" | "conceding" | "conceded" | "finished";
  readonly hopelessSinceTick: AiSimulationTick | null;
  readonly concessionIntentId: string | null;
  readonly lastReason: string | null;
}
