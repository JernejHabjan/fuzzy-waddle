// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import { normalizeRuntimeProductionSetup } from "./skirmish-ai-runtime-production-setup";
import { projectRuntimeProductionLifecycleV2 } from "./skirmish-ai-runtime-production-lifecycle-projection";

/** Projects separate authority channels. No poll-time planner state, predicted refund or fabricated spatial verdict enters V2. */
export function projectRuntimeProductionEvidenceV2(
  capture: AiRuntimeProductionCaptureV1,
  causal: RuntimeProductionCausalityV1,
  preset?: AiRuntimePresetApplicationV1
): RuntimeProductionEvidenceV2 {
  const failures = [...causal.failures];
  const gaps = new Set<string>(capture.setupGaps);
  const horizon = capture.frontiers?.latestTick;
  if (horizon === null || horizon === undefined) gaps.add("production_v2_frontiers_missing");
  const facts = capture.facts.filter((fact) => horizon === null || horizon === undefined || fact.tick <= horizon);
  const decisions: RuntimeProductionEvidenceV2["decisions"][number][] = [];
  const commitments = new Map<string, string>();
  for (const fact of facts) {
    if (fact.kind !== "decision_selected") continue;
    const normalized = causal.decisions.find((entry) => entry.selectedSequence === fact.sequence);
    if (!normalized || !fact.decision.input) {
      gaps.add("production_v2_decision_missing");
      continue;
    }
    decisions.push({
      inputTick: fact.decision.identity.tick,
      inputGeneration: fact.decision.identity.generation,
      selectedTick: fact.tick,
      selectedSequence: fact.sequence,
      result: fact.decision
    });
    const transition = fact.decision.economyProduction.transition;
    if (transition) {
      const { status, ...immutable } = transition;
      const previous = commitments.get(transition.planId);
      const value = JSON.stringify({ ...immutable, reason: undefined });
      if (previous && previous !== value) failures.push("production_v2_commitment_changed");
      if (!previous && (status !== "committed" || transition.committedTick !== fact.decision.identity.tick)) {
        failures.push("production_v2_commitment_origin_missing");
      }
      commitments.set(transition.planId, value);
    }
  }
  for (const scope of causal.commands) {
    const selected = scope.decision;
    if (
      !selected ||
      selected.decision.identity.tick > selected.tick ||
      selected.sequence >= scope.requestedSequence ||
      selected.tick > scope.requestedTick ||
      scope.deliveries.some((fact) => fact.tick < selected.tick) ||
      scope.outcomes.some((fact) => ["applied", "completed"].includes(fact.outcome.kind) && fact.tick < selected.tick)
    ) {
      failures.push("production_v2_application_clock_invalid");
    }
  }
  let setup: RuntimeProductionEvidenceV2["setup"] = null;
  if (capture.setup) {
    try {
      setup = normalizeRuntimeProductionSetup(capture.setup, preset?.createdActorIds ?? {});
    } catch {
      gaps.add("production_v2_setup_invalid");
    }
    failures.push(...(setup?.failures ?? []));
  } else gaps.add("production_v2_setup_missing");
  const lifecycle = projectRuntimeProductionLifecycleV2(capture, causal, preset);
  failures.push(...lifecycle.failures);
  lifecycle.gaps.forEach((gap) => gaps.add(gap));
  capture.frontiers?.gaps.forEach((gap) => gaps.add(gap));
  if (capture.droppedFactCount || capture.droppedSnapshotCount) failures.push("production_v2_capture_dropped");
  const definitions: RuntimeProductionEvidenceV2["definitions"][number][] = [];
  for (const fact of facts)
    if (fact.kind === "queue_mutation" && fact.mutation.operation === "enqueue") {
      if (!fact.definitionCatalog || fact.definitionGaps?.length)
        gaps.add("production_v2_operation_definition_missing");
      else definitions.push({ sequence: fact.sequence, applicationTick: fact.tick, catalog: fact.definitionCatalog });
    }
  return structuredClone({
    schemaVersion: 2,
    setup,
    decisions,
    coverage: capture.frontiers ?? null,
    lifecycle,
    definitions,
    spatial: causal.spatialAuthority,
    routes: causal.producerRoutes,
    movements: causal.movements,
    failures: [...new Set(failures)],
    gaps: [...gaps].sort()
  });
}
