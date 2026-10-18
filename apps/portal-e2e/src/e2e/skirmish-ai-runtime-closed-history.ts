import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Require native sealed history, not horizon counters alone. This supplies no service, geometry or combat verdict. */
export function runtimeClosedHistoryFailures(capture: AiRuntimeProductionCaptureV1 | undefined, latestTick: number): string[] {
  const history = capture?.frontiers;
  if (!capture || capture.startedTick !== 0 || capture.droppedFactCount || capture.droppedSnapshotCount || !history ||
      history.latestTick !== latestTick || history.closedThroughTick !== latestTick || history.gaps.length) {
    return ["native_closed_history_incomplete"];
  }
  let nextTick = 0;
  for (const interval of history.intervals) {
    if (interval.closedFromTick !== nextTick || !Number.isSafeInteger(interval.closedThroughTick) ||
        interval.closedThroughTick < interval.closedFromTick || interval.closedThroughTick > latestTick ||
        interval.capturedAtTick !== interval.closedThroughTick + 1) return ["native_closed_history_reordered_or_missing"];
    nextTick = interval.closedThroughTick + 1;
  }
  if (nextTick !== latestTick + 1) return ["native_closed_history_reordered_or_missing"];
  let sequence = 0, tick = 0;
  for (const fact of capture.facts) {
    if (!Number.isSafeInteger(fact.sequence) || fact.sequence <= sequence || !Number.isSafeInteger(fact.tick) ||
        fact.tick < tick || fact.playerNumber !== capture.playerNumber) return ["native_fact_history_reordered_or_cross_owner"];
    sequence = fact.sequence;
    tick = fact.tick;
  }
  return [];
}
