import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";

/** Bounded actual pair comparison inputs. This projection cannot serve as full scenario or lifecycle evidence. */
export interface RuntimeProductionPairInput
  extends Pick<
    RuntimeVariantResultV1,
    "variantId" | "aiFaction" | "seed" | "mapLabel" | "presetFixtureId" | "presetInitialResourceBalances"
  > {
  readonly productionEvidenceV2?: Pick<RuntimeProductionEvidenceV2, "setup" | "decisions">;
}
