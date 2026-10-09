import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionBoundaryState } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-boundary-state";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
import { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-unspent";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Exact local rejection callback interval. Missing older state is a gap; supplied contradiction fails closed. */
export function validateRuntimeRejectionBoundaries(
  before: AiRuntimeProductionBoundaryState | undefined,
  after: AiRuntimeProductionBoundaryState | undefined,
  intent: AiIntentV1,
  commandId: string | null,
  stage: "admission" | "application"
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  if (before?.snapshotRestoreInProgress || after?.snapshotRestoreInProgress)
    failures.push("production_ai_rejection_restore");
  if (before?.snapshotRestoreInProgress === undefined || after?.snapshotRestoreInProgress === undefined) {
    gaps.push("production_ai_rejection_restore_authority_missing");
  }
  if (
    !before?.resources ||
    !after?.resources ||
    !before.queues ||
    !after.queues ||
    !before.obligations ||
    !after.obligations
  ) {
    gaps.push("production_ai_rejection_boundary_missing");
  } else if (
    ![before.resources, after.resources, before.obligations, after.obligations].every(isRuntimeProductionBalance) ||
    !sameRuntimeQueueVector(
      calculateRuntimeQueueLiabilities(before.queues, before.exhaustedProgressItemId),
      before.obligations
    ) ||
    !sameRuntimeQueueVector(
      calculateRuntimeQueueLiabilities(after.queues, after.exhaustedProgressItemId),
      after.obligations
    ) ||
    !sameRuntimeQueueVector(before.resources, after.resources) ||
    !sameRuntimeQueueVector(before.obligations, after.obligations) ||
    !isDeepStrictEqual(before.queues, after.queues) ||
    before.exhaustedProgressItemId !== after.exhaustedProgressItemId ||
    (commandId !== null &&
      [before, after].some((state) =>
        state.queues?.some((queue) =>
          queue.lanes.some((lane) => lane.items.some((item) => item.commandId === commandId))
        )
      ))
  )
    failures.push("production_ai_rejection_boundary_invalid");
  const left = before?.unspentClaims;
  const right = after?.unspentClaims;
  if (!left?.resources || !right?.resources) gaps.push("production_ai_rejection_claim_release_missing");
  else {
    const owns = (entry: (typeof left.entries)[number]) => isDeepStrictEqual(entry.intent, intent);
    const expected = left.entries.map((entry) => (owns(entry) ? { ...entry, state: "released" as const } : entry));
    const targets = left.entries.filter(owns);
    const target = targets[0];
    const resourceClaims = intent.claims.some((claim) => claim.kind === "resource");
    if (
      !isDeepStrictEqual(expected, right.entries) ||
      (resourceClaims &&
        (targets.length !== 1 ||
          !target ||
          target.state !== (stage === "admission" ? "selected" : "admitted") ||
          target.commandId !== (stage === "admission" ? null : commandId)))
    ) {
      failures.push("production_ai_rejection_claim_release_invalid");
    }
  }
  return { failures, gaps };
}
