import { evaluateRuntimeProductionAbandonment } from "./skirmish-ai-runtime-production-abandonment-evaluation";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** A dated future commitment must cause ready capacity; abandonment releases only optional, unspent leases. */
export function evaluateRuntimeProductionTransition(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV1
): string[] {
  const { snapshots, events } = evidence;
  const initial = snapshots[0];
  const committed = snapshots.find((snapshot) => snapshot.transition?.status === "committed");
  const transition = committed?.transition;
  if (
    !["future_committed", "future_abandoned"].includes(contract.branch) ||
    !initial ||
    !committed ||
    !transition ||
    transition.status !== "committed" ||
    !transition.planId ||
    !transition.demandId ||
    !Number.isSafeInteger(transition.committedTick) ||
    transition.committedTick !== committed?.tick ||
    transition.committedTick < 0 ||
    transition.committedTick >= transition.beginsTick ||
    !Number.isSafeInteger(transition.beginsTick) ||
    !Number.isSafeInteger(transition.forceDeadlineTick) ||
    transition.beginsTick <= 0 ||
    transition.forceDeadlineTick <= transition.beginsTick ||
    transition.forceDeadlineTick + contract.stableForTicks > contract.latestTick ||
    !Number.isSafeInteger(transition.desiredForce) ||
    transition.desiredForce <= initial.products.filter((actor) => actor.productKey === contract.productKey).length
  ) {
    return ["production_transition_initial_commitment"];
  }
  const initialProducers = committed.producers.filter(
    (producer) => producer.objectName === contract.producerObjectName
  );
  const initialProducer = initialProducers[0];
  if (
    initialProducers.length !== 1 ||
    !initialProducer ||
    !initialProducer.ready ||
    !evidence.initialProducerIds.includes(initialProducer.actorId) ||
    !initialProducer.lanes.length ||
    initialProducer.lanes.some((lane) => lane.itemIds.length > 0)
  ) {
    return ["production_transition_requires_idle_producer"];
  }
  const product = evidence.catalog.find(
    (entry) => entry.productKey === contract.productKey && entry.kind === "production"
  );
  const producerDefinition = evidence.catalog.find((entry) => entry.productKey === contract.producerObjectName);
  const perProducer = product
    ? Math.floor((transition.forceDeadlineTick - transition.beginsTick) / product.durationTicks) *
      initialProducer.lanes.length
    : 0;
  const missing =
    transition.desiredForce - initial.products.filter((actor) => actor.productKey === contract.productKey).length;
  if (!product || !producerDefinition || perProducer <= 0 || missing <= perProducer || missing > perProducer * 2) {
    return ["production_transition_future_throughput_unjustified"];
  }
  const failures: string[] = [];
  if (
    snapshots
      .filter((snapshot) => snapshot.tick >= committed.tick)
      .some(
        (snapshot) =>
          !snapshot.transition ||
          snapshot.transition.planId !== transition.planId ||
          snapshot.transition.demandId !== transition.demandId ||
          snapshot.transition.committedTick !== transition.committedTick ||
          snapshot.transition.beginsTick !== transition.beginsTick ||
          snapshot.transition.forceDeadlineTick !== transition.forceDeadlineTick ||
          snapshot.transition.desiredForce !== transition.desiredForce
      )
  )
    failures.push("production_transition_changed_commitment");
  const construction = events.filter(
    (event) => event.kind === "construct" && event.productKey === contract.producerObjectName
  );
  if (contract.branch === "future_abandoned") {
    return [...failures, ...evaluateRuntimeProductionAbandonment(contract, evidence, committed)];
  }
  const fulfilled = snapshots.find((snapshot) => snapshot.transition?.status === "fulfilled");
  if (
    snapshots
      .filter((snapshot) => snapshot.tick >= committed.tick)
      .some(
        (snapshot) =>
          snapshot.transition?.status !== (fulfilled && snapshot.tick >= fulfilled.tick ? "fulfilled" : "committed")
      )
  ) {
    failures.push("production_transition_not_retained");
  }
  // The planner's terminal state is valid only after the same plan's actual force exists, within its original deadline.
  if (
    fulfilled &&
    (fulfilled.tick > transition.forceDeadlineTick ||
      fulfilled.products.filter((actor) => actor.productKey === contract.productKey).length < transition.desiredForce)
  ) {
    failures.push("production_transition_premature_or_late_fulfillment");
  }
  const applied = construction.find(
    (event) =>
      event.planId === transition.planId &&
      event.createdActorId &&
      !evidence.initialProducerIds.includes(event.createdActorId) &&
      event.tick < transition.beginsTick
  );
  const ready =
    applied &&
    snapshots.find(
      (snapshot) =>
        snapshot.tick >= applied.tick + producerDefinition.durationTicks &&
        snapshot.tick < transition.beginsTick &&
        snapshot.producers.some(
          (producer) => producer.actorId === applied.createdActorId && producer.ready && producer.reachable
        )
    );
  if (construction.length !== 1 || !ready) failures.push("production_transition_capacity_not_prebuilt");
  if (
    ready &&
    snapshots
      .filter((snapshot) => snapshot.tick >= ready.tick)
      .some(
        (snapshot) =>
          !snapshot.producers.some((producer) => producer.actorId === applied?.createdActorId && producer.ready)
      )
  ) {
    failures.push("production_transition_capacity_not_retained");
  }
  const force = snapshots.find((snapshot) => snapshot.tick === transition.forceDeadlineTick);
  if (
    !force ||
    force.products.filter((product) => product.productKey === contract.productKey).length < transition.desiredForce
  ) {
    failures.push("production_transition_force_deadline");
  }
  const created = new Set(
    events
      .filter(
        (event) =>
          event.kind === "complete" &&
          event.productKey === contract.productKey &&
          event.planId === transition.planId &&
          event.tick <= transition.forceDeadlineTick &&
          event.createdActorId &&
          !evidence.initialProductActorIds.includes(event.createdActorId)
      )
      .map((event) => event.createdActorId)
  );
  if (
    !force ||
    force.products.filter((product) => created.has(product.actorId)).length <
      transition.desiredForce - initial.products.filter((product) => product.productKey === contract.productKey).length
  ) {
    failures.push("production_transition_applied_force_missing");
  }
  if (
    fulfilled &&
    fulfilled.products.filter(
      (product) =>
        created.has(product.actorId) &&
        events.some(
          (event) =>
            event.kind === "complete" && event.createdActorId === product.actorId && event.tick <= fulfilled.tick
        )
    ).length < missing
  ) {
    failures.push("production_transition_fulfillment_effect_missing");
  }
  const retainedIds = new Set(
    force?.products.filter((actor) => actor.productKey === contract.productKey).map((actor) => actor.actorId)
  );
  if (
    snapshots
      .filter((snapshot) => snapshot.tick >= transition.forceDeadlineTick)
      .some(
        (snapshot) =>
          snapshot.products.filter((product) => product.productKey === contract.productKey).length !==
            transition.desiredForce ||
          [...retainedIds].some(
            (id) =>
              !snapshot.products.some((product) => product.actorId === id && product.productKey === contract.productKey)
          )
      )
  ) {
    failures.push("production_transition_force_not_retained");
  }
  return failures;
}
