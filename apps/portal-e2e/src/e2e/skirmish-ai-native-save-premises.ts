import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Extract actual original queue/site/receipt premises before rewinding. Full captures never enter save reports. */
export function nativeSavePremises(capture: AiRuntimeProductionCaptureV1, tick: number, siteId?: string) {
  const snapshot = capture.snapshots.filter((entry) => entry.tick === tick).at(-1);
  if (!snapshot) throw new Error("native_save_exact_snapshot_missing");
  const items = snapshot.queues.flatMap((queue) => queue.lanes.flatMap((lane) => lane.items));
  const heldApplied = capture.facts.filter((fact) => fact.tick <= tick && fact.kind === "authority_delivery" &&
    fact.delivery.phase === "held" && fact.delivery.outcome?.kind === "applied");
  return { tick, paidTrainingItems: items.filter((item) => item.objectName !== null && item.remainingTimeMs > 0 &&
      item.remainingTimeMs < item.totalTimeMs && Object.values(item.charge).some((amount) => (amount ?? 0) > 0)).length,
    paidResearchItems: items.filter((item) => item.researchType !== null && item.payment === "immediate" &&
      item.remainingTimeMs > 0).length,
    unfinishedOriginalSite: !!siteId && snapshot.world?.actors.some((actor) =>
      actor.actorId === siteId && actor.active && actor.alive && actor.indexed && !actor.finished) === true,
    heldAppliedReceipts: heldApplied.length,
    captureDropped: capture.droppedFactCount > 0 || capture.droppedSnapshotCount > 0,
    captureGaps: [...capture.gaps] };
}
