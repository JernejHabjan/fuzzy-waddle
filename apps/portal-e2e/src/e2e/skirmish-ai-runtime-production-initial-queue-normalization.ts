// prettier-ignore
import { AI_RUNTIME_MAX_FACTS } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/append-ai-runtime-production-fact";
import { appendRuntimeInitialQueueApplication } from "./skirmish-ai-runtime-initial-queue-application";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimeProductionInitialQueueV1 } from "./skirmish-ai-runtime-production-initial-queue";

/** Joins actual setup commands to captured physical insertion/money and the tick-zero item, before resource resets. */
export function normalizeRuntimeProductionInitialQueues(
  capture: AiRuntimeProductionCaptureV1,
  setup: AiRuntimePresetApplicationV1 | undefined
) {
  const items: RuntimeProductionInitialQueueV1[] = [];
  const failures: string[] = [];
  const gaps = new Set<string>();
  if (
    capture.facts.length > AI_RUNTIME_MAX_FACTS ||
    (setup && (setup.queueApplications.length > 2048 || setup.initialQueueItems.length > 2048))
  ) {
    return { items, failures: ["production_initial_queue_setup_overflow"], gaps: [] };
  }
  const initial = capture.snapshots[0];
  if (!setup || capture.startedTick !== 0 || initial?.tick !== 0 || !initial.world) {
    return { items, failures, gaps: ["production_initial_queue_provenance_missing"] };
  }
  if (
    initial.world.snapshotRestoreInProgress ||
    !setup.fixtureId ||
    !setup.sourceRevision ||
    !setup.fixtureDigest ||
    setup.queuedItemCount !== setup.initialQueueItems.length ||
    setup.queueApplications.length !== setup.queuedItemCount ||
    new Set(setup.initialQueueItems.map((entry) => entry.itemId)).size !== setup.initialQueueItems.length ||
    new Set(setup.queueApplications.map((entry) => entry.itemId)).size !== setup.queueApplications.length
  ) {
    return { items, failures: ["production_initial_queue_setup_invalid"], gaps: [] };
  }
  const applications = setup.queueApplications.filter((entry) => entry.command.playerNumber === capture.playerNumber);
  // Subsequent gameplay can charge, finish or refund this same item; it cannot rewrite its paused setup provenance.
  const facts = capture.facts.filter((fact) => fact.tick === 0);
  const physical = initial.queues.flatMap((queue) =>
    queue.lanes.flatMap((lane) => lane.items.map((item) => ({ queue, lane, item })))
  );
  if (physical.length > 2048) return { items, failures: ["production_initial_queue_physical_overflow"], gaps: [] };
  for (const application of applications) {
    appendRuntimeInitialQueueApplication(
      application,
      capture,
      setup,
      { ...initial, world: initial.world },
      facts,
      physical,
      items,
      failures,
      gaps
    );
  }
  if (physical.some((entry) => !applications.some((application) => application.itemId === entry.item.itemId))) {
    gaps.add("production_initial_queue_pre_capture_or_uncommanded");
  }
  return structuredClone({
    items: failures.length ? [] : items,
    failures: [...new Set(failures)],
    gaps: [...gaps].sort()
  });
}
