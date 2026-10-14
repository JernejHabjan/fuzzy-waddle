import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import { productionWorldAt } from "./skirmish-ai-runtime-production-authority-evaluation";

/** Optional forecasts release at abandonment; already admitted work keeps its exact native terminal or retained identity. */
export function evaluateRuntimeProductionAbandonedWork(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV2,
  committed: RuntimeProductionEvidenceV2["decisions"][number]
): string[] {
  const transition = committed.result.economyProduction.transition;
  if (!transition) return ["production_v2_transition_origin_or_deadline_invalid"];
  const failures: string[] = [];
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
  const abandoned = evidence.decisions.find(
    (decision) =>
      decision.result.economyProduction.transition?.planId === transition.planId &&
      decision.result.economyProduction.transition.status === "abandoned"
  );
  if (!abandoned || abandoned.selectedTick >= transition.beginsTick) return ["production_v2_abandonment_missing"];
  const released = committed.result.reservations.filter(
    (lease) =>
      lease.ownerPlanId === transition.planId && (lease.state.kind === "forecast" || lease.state.kind === "provisional")
  );
  const paidConstructionClaims = new Set(
    construction.flatMap((entry) =>
      entry.placement &&
      entry.placement.sequence < abandoned.selectedSequence &&
      entry.placement.spatial.kind === "placement" &&
      entry.placement.spatial.legal
        ? (entry.commandScope?.acceptedIntent.claims.map((claim) => claim.claimId) ?? [])
        : []
    )
  );
  if (
    !released.length ||
    evidence.decisions
      .filter((decision) => decision.selectedSequence >= abandoned.selectedSequence)
      .some((decision) =>
        decision.result.reservations.some((lease) =>
          released.some(
            (prior) =>
              prior.claimId === lease.claimId &&
              (prior.state.kind === "forecast" ||
                lease.state.kind !== "applied_spending" ||
                !paidConstructionClaims.has(lease.claimId))
          )
        )
      )
  ) {
    failures.push("production_v2_forecast_not_released");
  }
  if (
    evidence.decisions
      .filter((decision) => decision.selectedSequence >= abandoned.selectedSequence)
      .some((decision) =>
        decision.result.acceptedIntents.some(
          (intent) => intent.planId === transition.planId && ["construct", "produce", "research"].includes(intent.kind)
        )
      )
  )
    failures.push("production_v2_abandoned_new_dispatch");
  // Already admitted work may finish normally. Its paid native lineage must remain visible through a real terminal.
  for (const placement of placements) {
    if (placement.sequence >= abandoned.selectedSequence || placement.spatial.kind !== "placement") continue;
    const id = placement.spatial.site.actorId;
    const terminal = construction.some(
      (entry) =>
        entry.boundary.construction.site.actorId === id &&
        entry.boundary.construction.kind === "lifecycle" &&
        ["finished", "teardown"].includes(entry.boundary.construction.transition)
    );
    const retained = productionWorldAt(evidence, contract.latestTick)?.actors.some(
      (actor) =>
        actor.identity.actorId === id && actor.identity.alive && actor.identity.active && actor.identity.indexed
    );
    if (!terminal && !retained) {
      failures.push("production_v2_admitted_construction_terminal_missing");
    }
  }
  for (const enqueue of evidence.lifecycle.queues.filter(
    (event) =>
      event.kind === "enqueue" && event.planId === transition.planId && event.sequence < abandoned.selectedSequence
  )) {
    const completed = evidence.lifecycle.queues.some(
      (event) =>
        event.kind === "complete" &&
        event.itemId === enqueue.itemId &&
        event.actorId === enqueue.actorId &&
        event.productKey === enqueue.productKey &&
        event.commandId === enqueue.commandId &&
        event.effectId === enqueue.effectId &&
        event.sequence > enqueue.sequence
    );
    const lost = evidence.lifecycle.losses.some(
      (event) => event.actorId === enqueue.actorId && event.actor?.alive === false && event.sequence > enqueue.sequence
    );
    const retained = productionWorldAt(evidence, contract.latestTick)?.queues.some(
      (queue) =>
        queue.actorId === enqueue.actorId &&
        queue.lanes.some((lane) => lane.itemIds.some((item) => item === enqueue.itemId))
    );
    if (!completed && !lost && !retained) failures.push("production_v2_abandoned_paid_queue_vanished");
    if (
      !lost &&
      evidence.lifecycle.queues.some(
        (event) =>
          event.itemId === enqueue.itemId &&
          event.sequence >= abandoned.selectedSequence &&
          ["cancel", "refund"].includes(event.kind)
      )
    ) {
      failures.push("production_v2_abandoned_paid_queue_cancelled");
    }
  }
  return failures;
}
