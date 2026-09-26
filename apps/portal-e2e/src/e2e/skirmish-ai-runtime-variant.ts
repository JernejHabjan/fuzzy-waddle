import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import type { RuntimePerturbationV1 } from "./skirmish-ai-runtime-perturbation";

export interface RuntimeVariantV1 {
  readonly id: string;
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
  readonly resourceServiceBranch?: "build" | "served_control";
  readonly perturbations?: readonly RuntimePerturbationV1[];
}
