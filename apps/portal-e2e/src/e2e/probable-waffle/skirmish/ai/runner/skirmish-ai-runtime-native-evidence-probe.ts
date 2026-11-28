import type { Page } from "@playwright/test";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";

/** Candidate reads are sparse because an oracle needs the actual detached history for both players. */
export interface RuntimeNativeEvidenceProbe {
  readonly checkpoints: readonly number[];
  /** Budget for one focused browser world, including setup and evidence reads. */
  readonly wallClockBudgetMs: number;
  /** Reuses the final oracle and retains opponent evidence only when its failure list is empty. */
  failures(page: Page, candidate: RuntimeVariantResult): Promise<readonly string[]>;
}
