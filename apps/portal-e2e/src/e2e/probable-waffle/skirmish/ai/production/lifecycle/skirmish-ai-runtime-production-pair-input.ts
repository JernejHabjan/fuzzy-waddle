import type { RuntimeVariantResult } from "../../runner/skirmish-ai-runtime-variant-result";
import type { RuntimeNativeProductionEvidence } from "../evidence/skirmish-ai-runtime-native-production-evidence";

/** Bounded actual pair comparison inputs. This projection cannot serve as full scenario or lifecycle evidence. */
export interface RuntimeProductionPairInput
  extends Pick<
    RuntimeVariantResult,
    "variantId" | "aiFaction" | "seed" | "mapLabel" | "presetFixtureId" | "presetInitialResourceBalances"
  > {
  readonly productionEvidenceV2?: Pick<RuntimeNativeProductionEvidence, "setup" | "decisions">;
}
