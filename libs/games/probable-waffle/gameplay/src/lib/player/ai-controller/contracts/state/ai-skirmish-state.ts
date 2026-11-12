import type { AiSimulationTick } from "../ai-core-types";
import type { AiThreatIncident } from "./ai-threat-incident";
import type { AiModeState } from "./ai-mode-state";

/** Strategic state: questions, incidents and mission facts without live-world handles. */
export interface AiSkirmishState {
  readonly incidents: readonly AiThreatIncident[];
  readonly mode: AiModeState;
  /** Bounded causal event ledger used by the read-only debug timeline. */
  readonly timeline: readonly {
    readonly eventId: string;
    readonly tick: AiSimulationTick;
    readonly kind: "question" | "threat" | "mission" | "effect" | "mode";
    readonly subjectId: string;
    readonly detail: string;
  }[];
}
