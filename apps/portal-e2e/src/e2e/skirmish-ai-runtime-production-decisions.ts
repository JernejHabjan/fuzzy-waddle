import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionDecisionV1 } from "./skirmish-ai-runtime-production-decision";
import { normalizeRuntimeProductionFairInput } from "./skirmish-ai-runtime-production-fair-input-normalization";
import { validateRuntimeProductionFairGraph } from "./skirmish-ai-runtime-production-fair-graph";

/** Joins exact consumed input/cadence to each selected result. Later checkpoints never fill missing selections. */
export function normalizeRuntimeProductionDecisions(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const decisions: RuntimeProductionDecisionV1[] = [];
  let previous: RuntimeProductionDecisionV1 | undefined;
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { decisions, failures: ["production_decision_capture_dropped"], gaps: [] };
  }
  const facts = capture.facts.filter((fact) => fact.kind === "decision_selected");
  if (!facts.length) gaps.add("production_decision_selection_missing");
  for (const fact of facts) {
    const { identity, input } = fact.decision;
    if (!input) { gaps.add("production_decision_input_missing"); previous = undefined; continue; }
    input.gaps.forEach((gap) => gaps.add(gap));
    if (input.snapshotRestoreInProgress) failures.push("production_decision_restore_unverified");
    if (fact.playerNumber !== capture.playerNumber || identity.playerNumber !== capture.playerNumber ||
      ![fact.sequence, fact.tick, identity.tick, identity.generation, identity.decisionSequence,
        identity.authorityEpoch].every(integer) || fact.sequence === 0 || fact.tick < capture.startedTick || identity.tick > fact.tick) {
      failures.push("production_decision_identity_invalid"); continue;
    }
    const cadence = input.cadence;
    if (!["simulation", "render_fallback"].includes(cadence.clock) ||
      !integer(cadence.configuredIntervalTicks) || cadence.configuredIntervalTicks === 0 || !integer(cadence.completedBefore) ||
      (cadence.clock === "simulation" ? !integer(cadence.tick ?? -1) || cadence.tick !== fact.tick : cadence.tick !== null)) {
      failures.push("production_decision_cadence_invalid"); continue;
    }
    const observation = input.observation;
    const catalog = input.capabilityCatalog;
    if (!observation) {
      gaps.add("production_decision_observation_missing");
      if (input.accessGraph) failures.push(...validateRuntimeProductionFairGraph(input.accessGraph, identity.tick));
    }
    if (observation && (observation.schemaVersion !== 1 ||
      observation.playerNumber !== identity.playerNumber || observation.tick !== identity.tick ||
      observation.generation !== identity.generation)) failures.push("production_decision_input_identity");
    if (!catalog) gaps.add("production_decision_catalog_missing");
    if (catalog && (catalog.schemaVersion !== 1 || catalog.generation !== identity.generation ||
      catalog.entries.length > 512 || catalog.unsupported.length > 512 ||
      new Set(catalog.entries.map((entry) => entry.capabilityId)).size !== catalog.entries.length ||
      catalog.entries.some((entry) => !entry.capabilityId || !entry.sourceObjectName ||
        !integer(entry.effectiveLevel) || entry.effectiveLevel < 1))) {
      failures.push("production_decision_input_identity");
    }
    const fair = normalizeRuntimeProductionFairInput(input);
    failures.push(...fair.failures);
    fair.gaps.forEach((gap) => gaps.add(gap));
    if (cadence.clock !== "simulation") gaps.add("production_decision_simulation_clock_missing");
    if (!observation || !catalog || !fair.fairInput || cadence.clock !== "simulation") {
      previous = undefined; continue;
    }
    const decision = { selectedSequence: fact.sequence, selectedTick: fact.tick, identity, cadence,
      observationAgeTicks: fact.tick - observation.tick, capabilityCatalog: catalog, fairInput: fair.fairInput }
      satisfies RuntimeProductionDecisionV1;
    if (decision.observationAgeTicks) gaps.add("production_decision_stale_observation");
    if (previous) {
      if (fact.sequence <= previous.selectedSequence || fact.tick < previous.selectedTick ||
        identity.authorityEpoch < previous.identity.authorityEpoch) failures.push("production_decision_order_invalid");
      if (identity.authorityEpoch === previous.identity.authorityEpoch) {
        if (identity.decisionSequence <= previous.identity.decisionSequence || identity.generation < previous.identity.generation ||
          identity.tick < previous.identity.tick || cadence.completedBefore <= previous.cadence.completedBefore ||
          cadence.configuredIntervalTicks !== previous.cadence.configuredIntervalTicks) {
          failures.push("production_decision_cadence_regressed");
        }
        if (identity.decisionSequence !== previous.identity.decisionSequence + 1 ||
          cadence.completedBefore !== previous.cadence.completedBefore + 1) gaps.add("production_decision_cadence_incomplete");
      } else gaps.add("production_decision_authority_boundary_unverified");
    } else gaps.add("production_decision_prior_cadence_unknown");
    decisions.push(decision);
    previous = decision;
  }
  return structuredClone({ decisions: failures.length ? [] : decisions,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
