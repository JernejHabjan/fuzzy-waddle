import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import type { RuntimePerturbationV1 } from "./skirmish-ai-runtime-perturbation";

export interface RuntimeVariantV1 {
  readonly id: string;
  readonly executionKind: "focused_preset" | "focused_natural" | "continuous";
  readonly role: "subject" | "control" | "standalone";
  readonly pairId?: string;
  readonly setupRationale?: string;
  readonly deadlineRationale?: string;
  readonly evidenceStop?: { readonly earliestTick: number; readonly stableForTicks: number };
  readonly scenarioIds?: readonly string[];
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
  readonly presetWorld?: RuntimePresetWorldV1;
  readonly checkpointTicks?: readonly number[];
  readonly determinismGroup?: string;
  readonly repetitions?: number;
  readonly supplyBranch?: "prebuild" | "ample_control";
  readonly pressureBranch?: "raid" | "safe_control";
  readonly resourceServiceBranch?: "build" | "served_control";
  readonly productionCapacityBranch?: "build" | "already_sufficient";
  /** PRO-04 pairs isolate ready copies or normally paid queue commitments from the same ten-unit force. */
  readonly productionCompositionBranch?: "fill_deficit" | "satisfied_control" | "seeded_queue_control";
  readonly perturbations?: readonly RuntimePerturbationV1[];
}
