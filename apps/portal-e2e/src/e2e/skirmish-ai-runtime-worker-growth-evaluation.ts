import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

type WorkerCheckpoint = Pick<RuntimeCheckpointV1, "tick" | "workerCount" | "deliveredIncome">;
type WorkerVariant = Pick<RuntimeVariantResultV1, "variantId" | "initialWorkerCount" | "presetResourceStartCount"> & {
  readonly checkpoints: readonly WorkerCheckpoint[];
};

/** Requires actual owned workers and income, not a desired-workforce debug label. */
export function evaluateRuntimeWorkerGrowth(
  requirement: NonNullable<RuntimeAssertionV1["requiredWorkerGrowth"]>,
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
