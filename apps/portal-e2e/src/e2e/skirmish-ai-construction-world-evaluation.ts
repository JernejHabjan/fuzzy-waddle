import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";
import { CONSTRUCTION_INTERRUPTION_TICK as interruptionTick } from "./skirmish-ai-construction-world";

/** Independent native lifecycle/identity checks. No debug explanation or different replacement site can satisfy recovery. */
export function evaluateConstructionRecoveryWorld(
  branch: "builder_loss" | "intact" | "cancel_site",
  result: Pick<RuntimeVariantResultV1,
    "productionPreset" | "presetCreatedActorIds" | "productionCapture" | "perturbations" | "checkpoints">
): string[] {
  const failures: string[] = [];
  const application = result.productionPreset?.constructionApplications?.[0];
  const siteId = result.presetCreatedActorIds["unfinished-producer"];
  const builderId = result.presetCreatedActorIds["original-builder"];
  const capture = result.productionCapture;
  if (!application || !siteId || !builderId || application.siteActorId !== siteId ||
      application.fixtureActorId !== "unfinished-producer" || application.command.actorName !== "AnkGuard" ||
      application.command.actorIds.length !== 1 || application.command.actorIds[0] !== builderId ||
      !application.outcomes.some((outcome) => outcome.kind === "applied" && outcome.worldLinkIds.includes(siteId))) {
    return ["construction_setup_application_missing"];
  }
  if (!capture || capture.startedTick !== 0 || capture.droppedFactCount !== 0 || capture.droppedSnapshotCount !== 0 ||
      !capture.frontiers || capture.frontiers.latestTick !== 1200 || capture.frontiers.closedThroughTick < 1200 ||
      capture.frontiers.gaps.length > 0) {
    return ["construction_native_history_incomplete"];
  }
  const intervals = capture.frontiers.intervals;
  let nextTick = 0;
  for (const interval of intervals) {
    if (interval.closedFromTick !== nextTick || !Number.isSafeInteger(interval.closedThroughTick) ||
        interval.closedThroughTick < interval.closedFromTick || interval.closedThroughTick > 1200 ||
        interval.capturedAtTick !== interval.closedThroughTick + 1) {
      return ["construction_closed_interval_missing_or_reordered"];
    }
    nextTick = interval.closedThroughTick + 1;
  }
  if (nextTick !== 1201) return ["construction_closed_interval_missing_or_reordered"];
  const facts = capture.facts.filter((fact) => fact.tick <= 1200);
  const construction = facts.filter((fact) =>
    fact.kind === "construction_authority" && fact.construction.site.actorId === siteId
  );
  if (construction.some((fact) => fact.kind === "construction_authority" &&
    (!fact.construction.sceneActive || fact.construction.snapshotRestoreInProgress || fact.construction.clockTick !== fact.tick)
  )) failures.push("construction_native_clock_or_restore_unavailable");
  const started = construction.find((fact) => fact.kind === "construction_authority" &&
    fact.construction.kind === "lifecycle" && fact.construction.transition === "started"
  );
  if (!started || started.tick >= interruptionTick) failures.push("original_site_did_not_start_before_interruption");
  const completions = construction.filter((fact) => fact.kind === "construction_authority" &&
    fact.construction.kind === "lifecycle" && fact.construction.transition === "finished"
  );
  const charges = construction.filter((fact) => fact.kind === "construction_authority" &&
    fact.construction.kind === "resource" && fact.construction.operation === "start_charge" &&
    fact.construction.status === "returned" && fact.construction.balanceMatches &&
    fact.construction.ownerArgument === capture.playerNumber && fact.construction.callbackCount === 1
  );
  if (charges.length !== 1) failures.push("original_construction_not_paid_exactly_once");
  if (branch !== "intact") {
    const event = result.perturbations.find((entry) => entry.id === "construction-interruption");
    const expected = branch === "builder_loss" ? builderId : siteId;
    if (!event || event.tick !== interruptionTick || event.affectedActorId !== expected || event.dispatchedActors !== 1) {
      failures.push("construction_interruption_identity_missing");
    }
  }
  if (branch === "cancel_site") {
    if (completions.length !== 0) failures.push("cancelled_original_site_completed");
    const refunds = construction.filter((fact) => fact.kind === "construction_authority" &&
      fact.construction.kind === "resource" && fact.construction.operation === "cancel_refund" &&
      fact.construction.status === "returned" && fact.construction.balanceMatches &&
      fact.construction.ownerArgument === capture.playerNumber && fact.construction.callbackCount === 1
    );
    if (refunds.length !== 1) failures.push("cancelled_site_refund_not_exactly_once");
    if (intervals.some((interval) => interval.closedThroughTick >= interruptionTick && interval.actors.some(({ identity }) =>
      identity.actorId === siteId && identity.active && identity.indexed
    ))) failures.push("cancelled_site_still_present");
    const cleared = result.checkpoints.filter((point) => point.tick >= 180).every((point) =>
      point.workerOrders.every((order) => order.targetActorId !== siteId) &&
      Object.values(point.workerConstructs).every((sites) => !sites.includes(siteId))
    );
    if (!cleared) failures.push("cancelled_site_retained_worker_orders");
    const resumed = result.checkpoints.some((point) => point.tick >= 180 && point.workerOrders.some((order) =>
      order.actorId === builderId && ["Gather", "Build"].includes(order.orderType ?? "") && order.targetActorId !== siteId
    ));
    if (!resumed) failures.push("cancelled_builder_not_reassigned_to_useful_work");
    const credited = facts.some((fact) => fact.tick > interruptionTick && fact.kind === "spatial_authority" &&
      fact.spatial.kind === "resource_service" && fact.spatial.phase === "resource_credit" &&
      fact.spatial.source.actorId === builderId && fact.spatial.sourceInCaptureScene && fact.spatial.targetInCaptureScene &&
      fact.spatial.beneficiary === capture.playerNumber && !fact.spatial.snapshotRestoreInProgress &&
      runtimeResourceCreditMatches(fact.spatial)
    );
    const productiveBuild = result.checkpoints.some((point) => point.tick > interruptionTick && point.workerOrders.some((order) =>
      order.actorId === builderId && order.orderType === "Build" && order.targetActorId !== siteId &&
      facts.some((fact) => fact.tick >= point.tick && fact.kind === "construction_authority" &&
        fact.construction.kind === "lifecycle" && fact.construction.transition === "finished" &&
        fact.construction.site.actorId === order.targetActorId
      )
    ));
    if (!credited && !productiveBuild) failures.push("cancelled_builder_new_duty_has_no_native_effect");
  } else {
    if (completions.length !== 1 || (completions[0]?.tick ?? 0) <= (branch === "builder_loss" ? interruptionTick : 0)) {
      failures.push("same_site_completion_missing_or_duplicated");
    }
    const completedTick = completions[0]?.tick ?? 1201;
    const afterCompletion = intervals.filter((interval) => interval.closedThroughTick >= completedTick);
    if (!afterCompletion.length || afterCompletion.some((interval) => !interval.actors.some(({ identity }) =>
      identity.actorId === siteId && identity.finished && identity.active && identity.alive && identity.indexed
    ))) failures.push("completed_original_producer_not_retained");
    if (branch === "builder_loss") {
      const reassigned = result.checkpoints.some((point) => point.tick > interruptionTick && point.workerOrders.some((order) =>
        order.actorId !== builderId && order.orderType === "Build" && order.targetActorId === siteId
      ));
      if (!reassigned) failures.push("unfinished_original_site_never_gained_another_builder");
      if (!facts.some((fact) => fact.kind === "actor_unregistered" && fact.actorId === builderId && fact.tick >= interruptionTick)) {
        failures.push("original_builder_loss_not_observed");
      }
      if (intervals.some((interval) => interval.closedThroughTick >= interruptionTick && interval.actors.some(({ identity }) =>
        identity.actorId === builderId && identity.active && identity.alive && identity.indexed
      ))) failures.push("original_builder_still_alive_after_pinned_loss");
    }
    const refunds = construction.filter((fact) => fact.kind === "construction_authority" &&
      fact.construction.kind === "resource" && fact.construction.operation === "cancel_refund" &&
      fact.construction.status === "returned"
    );
    if (refunds.length !== 0) failures.push("healthy_or_recovered_work_was_cancelled");
  }
  return [...new Set(failures)];
}
