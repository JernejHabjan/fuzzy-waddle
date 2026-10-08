import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** Transient consumed inputs, in native resource units. Never saved on an intent or used by arbitration. */
export interface AiGatheringSelection {
  readonly intentId: AiIntentV1["intentId"];
  readonly effectId: AiIntentV1["effectId"];
  readonly playerNumber: number;
  readonly observationGeneration: number;
  readonly catalogGeneration: number;
  readonly tick: number;
  readonly resourceType: ResourceType;
  readonly branch: "forecast" | "stockpile_fallback";
  readonly forecast: { readonly amount: number; readonly horizonTick: number; readonly confidencePermille: number } | null;
  readonly ledger: AiObservationV1["resources"][number] | null;
  /** Exact native deficit, including empirical prediction and unclamped spendable resources. */
  readonly plannerDeficit: number | null;
}
