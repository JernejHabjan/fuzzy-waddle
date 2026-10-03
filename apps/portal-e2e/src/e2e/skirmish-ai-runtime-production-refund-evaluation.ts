import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** Checks application-order cash, definition prices and remaining pay-over-time commitments without predicted refunds. */
export function evaluateRuntimeProductionPayments(evidence: RuntimeProductionEvidenceV1): string[] {
  const failures: string[] = [];
  const paid = new Map<string, Record<string, number>>();
  const remainingTicks = new Map<string, { ticks: number; actorId: string; productKey: string }>();
  for (const event of evidence.events) {
    if (!["construct", "enqueue", "enqueue_rejected", "pay", "refund"].includes(event.kind)) continue;
    const entry = evidence.catalog.find((candidate) => candidate.productKey === event.productKey);
    if (!entry || !Object.keys(entry.cost).length) {
      failures.push("production_catalog_price_missing");
      continue;
    }
    const perTick = entry.payment === "per_successful_tick";
    const paying = event.kind === "pay";
    const admitting = ["construct", "enqueue"].includes(event.kind);
    const ticks = event.remainingSuccessfulTicks;
    const validTicks = typeof ticks === "number" && Number.isSafeInteger(ticks) && ticks > 0;
    if (perTick && (admitting || paying) && (!event.itemId || !validTicks ||
      !Number.isSafeInteger(entry.durationTicks) || entry.durationTicks < 0 ||
      (admitting && (event.kind !== "enqueue" || ticks !== Math.max(1, entry.durationTicks) || remainingTicks.has(event.itemId))) ||
      (paying && (remainingTicks.get(event.itemId)?.ticks !== ticks ||
        remainingTicks.get(event.itemId)?.actorId !== event.actorId ||
        remainingTicks.get(event.itemId)?.productKey !== event.productKey)))) {
      failures.push("production_per_tick_identity_timing_missing");
    }
    if (paying && !perTick) failures.push("production_unexpected_repeat_payment");
    const resources = new Set([...Object.keys(entry.cost), ...Object.keys(event.charged), ...Object.keys(event.refundAmounts),
      ...Object.keys(event.resourcesBefore), ...Object.keys(event.resourcesAfter), ...Object.keys(event.reservedUnspent),
      ...Object.keys(event.obligationsDue), ...Object.keys(event.obligationsAfter)]);
    for (const resource of resources) {
      const before = event.resourcesBefore[resource];
      const after = event.resourcesAfter[resource];
      const cost = entry.cost[resource] ?? 0;
      const charged = event.charged[resource] ?? 0;
      const refund = event.kind === "refund" ? event.refundAmounts[resource] ?? 0 : 0;
      const reserved = event.reservedUnspent[resource];
      const obligation = event.obligationsDue[resource];
      const obligationAfter = event.obligationsAfter[resource];
      if (before === undefined || after === undefined || reserved === undefined || obligation === undefined ||
        obligationAfter === undefined || [before, after, cost, charged, refund, reserved, obligation, obligationAfter]
          .some((value) => !Number.isFinite(value) || value < 0)) {
        failures.push("production_payment_numeric_evidence");
        continue;
      }
      if (after !== before - charged + refund) failures.push("production_payment_balance_mismatch");
      const ownRemaining = perTick && paying && validTicks ? cost * ticks : 0;
      const admissionPrice = perTick && validTicks ? cost * ticks : cost;
      if (![ownRemaining, admissionPrice].every(Number.isFinite)) failures.push("production_payment_numeric_evidence");
      if (charged > before - reserved - Math.max(0, obligation - ownRemaining)) {
        failures.push("production_spent_unapplied_money");
      }
      if (admitting && admissionPrice > before - reserved - obligation) {
        failures.push("production_unfunded_catalog_obligation");
      }
      if (admitting && charged !== (perTick ? 0 : cost)) failures.push("production_catalog_price_mismatch");
      if (perTick && paying && charged !== cost) failures.push("production_catalog_price_mismatch");
      if (perTick && ((admitting && obligationAfter !== obligation + admissionPrice) ||
        (paying && (obligation < ownRemaining || obligationAfter !== obligation - cost)))) {
        failures.push("production_unfunded_remaining_obligation");
      }
      if (event.kind === "refund" && charged !== 0) failures.push("production_refund_charged");
      if (event.kind === "enqueue_rejected" && charged !== 0) failures.push("production_rejected_order_charged");
      if (event.itemId && ["enqueue", "pay"].includes(event.kind)) {
        const itemPaid = paid.get(event.itemId) ?? {};
        const totalPaid = (itemPaid[resource] ?? 0) + charged;
        itemPaid[resource] = totalPaid;
        paid.set(event.itemId, itemPaid);
        const maximum = perTick ? cost * Math.max(1, entry.durationTicks) : cost;
        if (!Number.isFinite(maximum) || totalPaid > maximum) failures.push("production_paid_more_than_catalog");
      }
    }
    if (perTick && event.itemId && validTicks) {
      if (admitting) remainingTicks.set(event.itemId, { ticks, actorId: event.actorId, productKey: event.productKey });
      else if (paying) {
        const previous = remainingTicks.get(event.itemId);
        if (previous) remainingTicks.set(event.itemId, { ...previous, ticks: ticks - 1 });
      }
    }
  }
  return [...new Set(failures)];
}

function hasItem(items: readonly string[], itemId: string | null): boolean {
  return itemId !== null && items.includes(itemId);
}

/** A physical lane is shared by train/research; cancellation money becomes spendable only at resource application. */
export function evaluateRuntimeProductionRefund(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV1
): string[] {
  if (!["shared_contention", "cancel_pending_refund"].includes(contract.branch)) return ["production_queue_branch_missing"];
  const failures: string[] = [];
  const { snapshots, events } = evidence;
  for (const snapshot of snapshots) {
    const producers = snapshot.producers.filter((producer) => producer.objectName === contract.producerObjectName);
    if (!producers.length || producers.some((producer) => !producer.lanes.length)) {
      failures.push("production_physical_lane_evidence_missing");
    }
    const itemIds = producers.flatMap((producer) => producer.lanes.flatMap((lane) => lane.itemIds));
    if (new Set(itemIds).size !== itemIds.length || producers.some((producer) => producer.lanes.some((lane) =>
      !Number.isSafeInteger(lane.capacity) || lane.capacity <= 0 || lane.itemIds.length > lane.capacity))) {
      failures.push("production_shared_lane_overbooked");
    }
  }
  const enqueued = events.filter((event) => event.kind === "enqueue");
  if (enqueued.some((event) => !event.itemId || !event.laneId) ||
    new Set(enqueued.map((event) => event.itemId)).size !== enqueued.length) failures.push("production_queue_identity_missing");
  for (const event of enqueued) {
    if (!snapshots.some((snapshot) => snapshot.tick >= event.tick && snapshot.producers.some((producer) =>
      producer.actorId === event.actorId && producer.lanes.some((lane) => lane.laneId === event.laneId &&
        hasItem(lane.itemIds, event.itemId))))) failures.push("production_applied_lane_not_observed");
  }
  const cancellations = events.filter((event) => event.kind === "cancel");
  if (cancellations.some((cancel) => enqueued.some((event) => event.sequence > cancel.sequence &&
    event.actorId === cancel.actorId && event.productKey === cancel.productKey))) failures.push("production_cancel_requeue_cycle");
  if (new Set(cancellations.map((event) => event.itemId)).size !== cancellations.length) {
    failures.push("production_repeated_cancellation");
  }
  const completed = events.filter((event) => event.kind === "complete");
  for (const completion of completed) {
    const start = enqueued.find((event) => event.itemId === completion.itemId && event.sequence < completion.sequence &&
      event.actorId === completion.actorId && event.productKey === completion.productKey);
    if (!start || cancellations.some((cancel) => cancel.itemId === completion.itemId)) failures.push("production_completion_unlinked");
  }
  const usefulCompleted = completed.filter((event) => event.tick <= contract.latestTick - contract.stableForTicks &&
    snapshots.filter((snapshot) => snapshot.tick >= event.tick).length > 0 &&
    snapshots.filter((snapshot) => snapshot.tick >= event.tick).every((snapshot) =>
      evidence.catalog.some((entry) => entry.productKey === event.productKey && entry.kind === "research")
        ? snapshot.completedResearchKeys.includes(event.productKey)
        : !!event.createdActorId && !evidence.initialProductActorIds.includes(event.createdActorId) &&
          snapshot.products.some((product) => product.actorId === event.createdActorId && product.productKey === event.productKey)));
  if (contract.branch === "shared_contention") {
    const kinds = new Set(enqueued.map((event) => evidence.catalog.find((entry) => entry.productKey === event.productKey)?.kind));
    const shared = enqueued.some((train) => evidence.catalog.some((entry) => entry.productKey === train.productKey &&
      entry.kind === "production") && enqueued.some((research) => research.actorId === train.actorId &&
      research.laneId === train.laneId && evidence.catalog.some((entry) => entry.productKey === research.productKey &&
        entry.kind === "research") && snapshots.some((snapshot) => snapshot.producers.some((producer) =>
          producer.actorId === train.actorId && producer.lanes.some((lane) => lane.laneId === train.laneId &&
            hasItem(lane.itemIds, train.itemId) && hasItem(lane.itemIds, research.itemId))))));
    if (!shared || !kinds.has("production") || !kinds.has("research")) failures.push("production_shared_contention_missing");
    if (!["production", "research"].every((kind) => usefulCompleted.some((event) =>
      evidence.catalog.some((entry) => entry.productKey === event.productKey && entry.kind === kind)))) {
      failures.push("production_useful_train_research_completion_missing");
    }
    if (cancellations.length) failures.push("production_unnecessary_cancellation");
  } else {
    const cancellation = cancellations[0];
    const requested = events.find((event) => event.kind === "cancel_requested" && event.itemId === cancellation?.itemId);
    const refund = events.find((event) => event.kind === "refund" && event.refundForItemId === cancellation?.itemId);
    if (cancellations.length !== 1 || !cancellation?.itemId || !evidence.initialPaidItemIds.includes(cancellation.itemId) ||
      !requested || requested.commandId !== cancellation.commandId || requested.actorId !== cancellation.actorId ||
      requested.productKey !== cancellation.productKey || requested.sequence >= cancellation.sequence || !refund ||
      refund.sequence <= requested.sequence ||
      !Number.isSafeInteger(requested.scheduledTick) || (requested.scheduledTick ?? -1) <= requested.tick ||
      refund.tick < (requested.scheduledTick ?? Number.POSITIVE_INFINITY) || refund.tick !== cancellation.tick ||
      refund.tick + contract.stableForTicks > contract.latestTick ||
      !Object.values(refund.refundAmounts).some((amount) => amount > 0)) {
      failures.push("production_pending_refund_boundary_missing");
      return failures;
    }
    const rejected = events.find((event) => event.kind === "enqueue_rejected" &&
      event.sequence > requested.sequence && event.sequence < refund.sequence &&
      event.tick >= requested.tick && event.tick <= refund.tick);
    const price = evidence.catalog.find((entry) => entry.productKey === rejected?.productKey);
    const shortfall = rejected && price && Object.entries(price.cost).some(([resource, amount]) =>
      amount > (rejected.resourcesBefore[resource] ?? 0) - (rejected.reservedUnspent[resource] ?? 0) -
        (rejected.obligationsDue[resource] ?? 0));
    const affordableWithRefund = rejected && price && Object.entries(price.cost).every(([resource, amount]) =>
      amount <= (rejected.resourcesBefore[resource] ?? 0) - (rejected.reservedUnspent[resource] ?? 0) -
        (rejected.obligationsDue[resource] ?? 0) + (refund.refundAmounts[resource] ?? 0));
    if (!shortfall || !affordableWithRefund) failures.push("production_unapplied_refund_probe_missing");
    if (snapshots.filter((snapshot) => snapshot.tick >= cancellation.tick).some((snapshot) =>
      snapshot.producers.some((producer) => producer.lanes.some((lane) => hasItem(lane.itemIds, cancellation.itemId))))) {
      failures.push("production_cancelled_item_still_queued");
    }
    const resumed = enqueued.find((event) => event.sequence > refund.sequence && event.productKey === rejected?.productKey);
    if (!resumed || !usefulCompleted.some((event) => event.itemId === resumed.itemId && event.sequence > resumed.sequence &&
      event.tick <= contract.latestTick - contract.stableForTicks)) failures.push("production_post_refund_progress_missing");
  }
  return [...new Set(failures)];
}
