import type { Page } from "@playwright/test";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";

/** Candidate reads are sparse because an oracle needs the actual detached history for both players. */
export interface RuntimeNativeEvidenceProbe {
  readonly checkpoints: readonly number[];
  /** Reuses the final scenario oracle and retains needed opponent evidence only on acceptance. */
  accepts(page: Page, candidate: RuntimeVariantResult): Promise<boolean>;
}
