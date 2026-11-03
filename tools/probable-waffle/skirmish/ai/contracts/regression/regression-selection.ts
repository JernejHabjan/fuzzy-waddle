import type { RegressionCase } from "./regression-case.ts";

/** Bounded selection with explicit accounting for every omitted scenario or repetition. */
export interface RegressionSelection {
  packId: string;
  runtimeBudgetMs: number;
  estimatedWallMs: number;
  selected: RegressionCase[];
  omissions: { scenarioId: string; variantId?: string | null; repetition?: number; reason: string }[];
}
