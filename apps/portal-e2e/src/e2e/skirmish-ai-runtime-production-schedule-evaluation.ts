import { evaluateRuntimeProductionAbandonedWork } from "./skirmish-ai-runtime-production-abandoned-work-evaluation";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import { productionActorRetained, productionWorldAt } from "./skirmish-ai-runtime-production-authority-evaluation";
import { runtimeProductionUsefulOutputs } from "./skirmish-ai-runtime-production-useful-output";
import { runtimeProductionBuilderWork } from "./skirmish-ai-runtime-production-builder-work";

/** Dates belong to consumed inputs; physical ready/output deadlines belong to native closed histories. */
export function evaluateRuntimeProductionSchedule(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV2
) {
  const committed = evidence.decisions.find(
    (decision) => decision.result.economyProduction.transition?.status === "committed"
  );
  const transition = committed?.result.economyProduction.transition;
  if (
    !committed ||
    !transition ||
    transition.committedTick !== committed.inputTick ||
    transition.beginsTick <= committed.selectedTick ||
    transition.forceDeadlineTick <= transition.beginsTick ||
    transition.forceDeadlineTick + contract.stableForTicks > contract.latestTick ||
    transition.productObjectName !== contract.productKey ||
    transition.producerObjectName !== contract.producerObjectName
  ) {
    return ["production_v2_transition_origin_or_deadline_invalid"];
  }
  const first = productionWorldAt(evidence, committed.selectedTick);
  const initial = first?.queues.filter(
    (queue) =>
      queue.objectName === contract.producerObjectName &&
      first.actors.some((actor) => actor.identity.actorId === queue.actorId && actor.identity.finished)
  );
  if (
    initial?.length !== 1 ||
    initial[0]?.lanes.some((lane) => lane.itemIds.length > 0) ||
    !first?.actors.some(
      (actor) =>
        actor.identity.actorId === initial[0]?.actorId &&
        actor.identity.alive &&
        actor.identity.active &&
        actor.identity.indexed &&
        actor.identity.finished
    )
  ) {
    return ["production_v2_transition_idle_capacity_missing"];
  }
  const failures: string[] = [];
  const readyForce =
    first?.actors.filter(
      (actor) =>
        actor.identity.canonicalObjectName === contract.productKey && actor.identity.alive && actor.identity.finished
    ).length ?? 0;
  const perProducer =
    Math.floor((transition.forceDeadlineTick - transition.beginsTick) / transition.unitDurationTicks) *
    (initial[0]?.lanes.length ?? 0);
  if (
    !Number.isSafeInteger(transition.unitDurationTicks) ||
    transition.unitDurationTicks <= 0 ||
    !Number.isFinite(perProducer) ||
    perProducer <= 0 ||
    transition.desiredForce - readyForce <= perProducer ||
    transition.desiredForce - readyForce > perProducer * 2 ||
    transition.desiredProducers !== 2
  ) {
    failures.push("production_v2_future_throughput_unjustified");
  }
  if (contract.branch === "future_abandoned")
    return [...failures, ...evaluateRuntimeProductionAbandonedWork(contract, evidence, committed)];
  const construction = evidence.lifecycle.construction.filter(
    (entry) =>
      entry.placement?.spatial.kind === "placement" &&
      entry.placement.spatial.command.actorName === contract.producerObjectName &&
      entry.commandScope?.acceptedIntent.planId === transition.planId
  );
  const placements = [
    ...new Map(
      construction.flatMap((entry) => (entry.placement ? [[entry.placement.sequence, entry.placement] as const] : []))
    ).values()
  ];
  if (contract.branch !== "future_committed") return ["production_v2_transition_branch_invalid"];
  const ready = construction.find(
    (entry) =>
      entry.boundary.construction.kind === "lifecycle" &&
      entry.boundary.construction.transition === "finished" &&
      entry.boundary.tick < transition.beginsTick
  );
  const id = ready?.boundary.construction.site.actorId;
  if (
    placements.length !== 1 ||
    !ready ||
    !id ||
    !productionActorRetained(evidence, id, ready.boundary.tick + 1, contract.latestTick) ||
    !runtimeProductionBuilderWork(evidence, id)
  ) {
    failures.push("production_v2_prebuilt_capacity_missing");
  }
  const deadline = productionWorldAt(evidence, transition.forceDeadlineTick);
  const force =
    deadline?.actors.filter(
      (actor) =>
        actor.identity.canonicalObjectName === contract.productKey && actor.identity.alive && actor.identity.finished
    ) ?? [];
  if (
    force.length < transition.desiredForce ||
    force.some(
      (actor) =>
        !actor.identity.actorId ||
        !productionActorRetained(
          evidence,
          actor.identity.actorId,
          transition.forceDeadlineTick,
          transition.forceDeadlineTick + contract.stableForTicks
        )
    )
  )
    failures.push("production_v2_force_deadline_or_retention");
  const useful = runtimeProductionUsefulOutputs(evidence, contract).filter(
    (output) =>
      output.completion.planId === transition.planId &&
      output.arrivedTick <= transition.forceDeadlineTick &&
      output.completion.createdActor?.canonicalObjectName === contract.productKey
  );
  if (useful.length < transition.desiredForce - readyForce) failures.push("production_v2_useful_force_missing");
  return failures;
}
