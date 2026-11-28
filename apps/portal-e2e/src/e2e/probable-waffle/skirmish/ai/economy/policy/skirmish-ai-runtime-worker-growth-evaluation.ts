import type { RuntimeAssertion } from "../../evaluation/controls/skirmish-ai-runtime-assertion";
import type { RuntimeCheckpoint } from "../../capture/skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResult } from "../../runner/skirmish-ai-runtime-variant-result";

type WorkerCheckpoint = Pick<RuntimeCheckpoint, "tick" | "workerCount" | "deliveredIncome">;
type FoodCheckpoint = Pick<RuntimeCheckpoint, "deliveredIncomeByResource" | "ownedConstruction">;

/** The open-economy world has no wild food: require an owned ready Field and delivered food. */
export function hasRenewableFoodIncome(checkpoints: readonly FoodCheckpoint[]): boolean {
  return checkpoints.some(
    (checkpoint) =>
      (checkpoint.deliveredIncomeByResource?.["food"] ?? 0) > 0 &&
      checkpoint.ownedConstruction.some((actor) => actor.objectName === "Field" && actor.progress >= 100)
  );
}
type WorkerVariant = Pick<RuntimeVariantResult, "variantId" | "initialWorkerCount" | "presetResourceStartCount"> & {
  readonly checkpoints: readonly WorkerCheckpoint[];
};

/** Requires actual owned workers and income, not a desired-workforce debug label. */
export function evaluateRuntimeWorkerGrowth(
  requirement: NonNullable<RuntimeAssertion["requiredWorkerGrowth"]>,
  variant: WorkerVariant
): string[] {
  if (variant.variantId !== requirement.variantId) return [];
  const failures: string[] = [];
  if (variant.initialWorkerCount !== requirement.initialWorkerCount || variant.presetResourceStartCount !== 1) {
    failures.push("worker_growth_initial_world");
  }
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  if (Math.max(0, ...checkpoints.map((checkpoint) => checkpoint.workerCount)) < requirement.minimumPeakWorkerCount) {
    failures.push("worker_growth_peak_missing");
  }
  if ((checkpoints.at(-1)?.workerCount ?? 0) < requirement.minimumFinalWorkerCount) {
    failures.push("worker_growth_not_retained");
  }
  if (!checkpoints.some((checkpoint) => checkpoint.deliveredIncome > 0)) {
    failures.push("worker_growth_no_delivered_income");
  }
  return failures;
}
