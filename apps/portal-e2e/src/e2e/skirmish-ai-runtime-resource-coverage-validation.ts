import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeResourceCoverageV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-resource-coverage-v1";

/** Validate all read/cohort tails, including monotone terminal loss; legacy omission is a gap, never implicit completeness. */
export function validateRuntimeResourceCoverage(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [],
    gaps = new Set<string>();
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const ordered = !capture.facts.some((fact, index) => {
    const previousFact = capture.facts[index - 1];
    return (
      fact.playerNumber !== capture.playerNumber ||
      !integer(fact.tick) ||
      fact.tick < capture.startedTick ||
      !integer(fact.sequence) ||
      fact.sequence === 0 ||
      (index > 0 && (!previousFact || fact.tick < previousFact.tick || fact.sequence <= previousFact.sequence))
    );
  });
  if (
    !integer(capture.startedTick) ||
    !integer(capture.playerNumber) ||
    !integer(capture.droppedFactCount) ||
    !integer(capture.droppedSnapshotCount) ||
    !ordered
  ) {
    failures.push("production_resource_capture_order_invalid");
  }
  let previous: AiRuntimeResourceCoverageV1 | undefined;
  const records = [...capture.snapshots.map((snapshot) => snapshot.resourceCoverage), capture.resourceCoverage];
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    if (!record) {
      gaps.add("production_resource_coverage_authority_missing");
      continue;
    }
    const frontier = record.frontier;
    const ids = new Set<number>();
    if (
      record.captureEpoch !== 1 ||
      !integer(record.lossEpoch) ||
      record.lossEpoch > 8192 ||
      record.startedTick !== capture.startedTick ||
      !integer(frontier.tick) ||
      !integer(frontier.captureSequence) ||
      frontier.tick < capture.startedTick ||
      typeof record.lost !== "boolean" ||
      record.lost !== record.lossEpoch > 0 ||
      record.losses.length > 32 ||
      new Set(record.losses).size !== record.losses.length ||
      record.losses.some((reason) => !reason) ||
      (!record.lost && record.losses.length > 0)
    )
      failures.push("production_resource_coverage_invalid");
    if (index < capture.snapshots.length) {
      const snapshot = capture.snapshots[index];
      const marker = capture.facts.reduce(
        (sequence, fact) => (fact.sequence <= frontier.captureSequence ? fact.sequence : sequence),
        0
      );
      if (
        !snapshot ||
        frontier.tick !== snapshot.tick ||
        snapshot.afterSequence !== marker ||
        capture.facts.some((fact) => fact.sequence <= frontier.captureSequence && fact.tick > frontier.tick)
      ) {
        failures.push("production_resource_coverage_read_mismatch");
      }
    }
    for (const cohort of record.cohorts) {
      if (
        !integer(cohort.cohortId) ||
        cohort.cohortId === 0 ||
        ids.has(cohort.cohortId) ||
        !cohort.actorId ||
        !integer(cohort.playerNumber) ||
        !integer(cohort.installed.tick) ||
        !integer(cohort.installed.captureSequence) ||
        cohort.installed.tick < capture.startedTick ||
        cohort.installed.tick > frontier.tick ||
        cohort.installed.captureSequence > frontier.captureSequence ||
        (ordered && !installationClockMatches(capture, cohort.installed.tick, cohort.installed.captureSequence)) ||
        !isDeepStrictEqual(cohort.channels, ["cargo", "credit"])
      ) {
        failures.push("production_resource_cohort_invalid");
      }
      ids.add(cohort.cohortId);
    }
    if (record.cohorts.length > 256) failures.push("production_resource_cohort_overflow");
    if (
      previous &&
      (frontier.tick < previous.frontier.tick ||
        frontier.captureSequence < previous.frontier.captureSequence ||
        record.lossEpoch < previous.lossEpoch ||
        (previous.lost && !record.lost) ||
        previous.losses.some((loss) => !record.losses.includes(loss)) ||
        previous.cohorts.some((cohort, position) => !isDeepStrictEqual(cohort, record.cohorts[position])))
    ) {
      failures.push("production_resource_coverage_revived_or_regressed");
    }
    if (record.lost) gaps.add("production_resource_coverage_lost");
    record.gaps.forEach((gap) => gaps.add(gap));
    previous = record;
  }
  const final = capture.resourceCoverage;
  if (
    final &&
    capture.facts.some((fact) => fact.sequence > final.frontier.captureSequence || fact.tick > final.frontier.tick)
  ) {
    failures.push("production_resource_coverage_frontier_invalid");
  }
  if (capture.droppedFactCount || capture.droppedSnapshotCount) gaps.add("production_resource_coverage_dropped");
  // These routes are unsupported even if a fabricated/synthetic record omits the producer's declared gaps.
  gaps.add("resource_beneficiary_need_history_missing");
  gaps.add("resource_continuous_capacity_predicates_missing");
  gaps.add("resource_service_lifetime_history_incomplete");
  gaps.add("resource_component_mutation_history_incomplete");
  return { coverage: failures.length ? null : (final ?? null), failures: [...new Set(failures)], gaps: [...gaps] };
}

/** Sparse player facts retain the global order. Check both neighbours without a fact scan for every cohort/read pair. */
function installationClockMatches(capture: AiRuntimeProductionCaptureV1, tick: number, sequence: number): boolean {
  let left = 0,
    right = capture.facts.length;
  while (left < right) {
    const middle = Math.floor((left + right) / 2);
    const fact = capture.facts[middle];
    if (!fact) return false;
    if (fact.sequence <= sequence) left = middle + 1;
    else right = middle;
  }
  const before = capture.facts[left - 1],
    after = capture.facts[left];
  return (
    (left === 0 || (!!before && before.tick <= tick)) &&
    (left === capture.facts.length || (!!after && after.tick >= tick))
  );
}
