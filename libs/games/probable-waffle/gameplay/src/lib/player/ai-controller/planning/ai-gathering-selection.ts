import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntent } from "../contracts/ai-intent";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiResourceInputRead } from "./ai-resource-input-read";

/** Transient consumed inputs, in native resource units. Never saved on an intent or used by arbitration. */
export interface AiGatheringSelection {
  readonly intentId: AiIntent["intentId"];
  readonly effectId: AiIntent["effectId"];
  readonly playerNumber: number;
  readonly observationGeneration: number;
  readonly catalogGeneration: number;
  readonly tick: number;
  readonly resourceType: ResourceType;
  readonly branch: "forecast" | "stockpile_fallback";
  readonly forecast: { readonly amount: number; readonly horizonTick: number; readonly confidencePermille: number } | null;
  readonly ledger: AiObservation["resources"][number] | null;
  /** Exact native deficit, including empirical prediction and unclamped spendable resources. */
  readonly plannerDeficit: number | null;
  /** Actual consumed ledger boundary; omitted for legacy/unmarked/copied observations. */
  readonly resourceInputRead?: AiResourceInputRead;
}
