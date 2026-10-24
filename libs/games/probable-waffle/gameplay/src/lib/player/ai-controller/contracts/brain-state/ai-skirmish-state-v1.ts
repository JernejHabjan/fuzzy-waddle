import type { AiSimulationTick } from "../ai-core-types";
import type { AiThreatIncidentV1 } from "./ai-threat-incident-v1";
import type { AiModeStateV1 } from "./ai-mode-state-v1";

/** Strategic state: questions, incidents and mission facts without live-world handles. */
export interface AiSkirmishStateV1 {
  readonly incidents: readonly AiThreatIncidentV1[];
  readonly mode: AiModeStateV1;
  /** Bounded causal event ledger used by the read-only debug timeline. */
  readonly timeline: readonly {
    readonly eventId: string;
    readonly tick: AiSimulationTick;
    readonly kind: "question" | "threat" | "mission" | "effect" | "mode";
    readonly subjectId: string;
    readonly detail: string;
  }[];
}
