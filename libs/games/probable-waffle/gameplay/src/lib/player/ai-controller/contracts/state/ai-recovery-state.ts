import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiDeadline, AiPlanId, AiSimulationTick } from "../ai-core-types";

/** Causal recovery facts are bounded, save-safe and never contain live runtime handles. */
export interface AiRecoveryState {
  readonly records: readonly {
    readonly recoveryKey: string;
    readonly domain: "economy" | "placement" | "blocker" | "repair" | "transport" | "fortification" | "squad";
    readonly planId: AiPlanId | null;
    readonly actorId: ActorId | null;
    readonly cause: string;
    readonly enteredTick: AiSimulationTick;
    readonly lastProgressTick: AiSimulationTick;
    readonly nextRetryTick: AiSimulationTick;
    readonly phaseDeadline: AiDeadline;
    readonly attempt: number;
    readonly state: "watching" | "backoff" | "recovering" | "abandoned" | "technical_fault";
    readonly alternate: string | null;
    readonly releasedClaimIds: readonly string[];
  }[];
}
