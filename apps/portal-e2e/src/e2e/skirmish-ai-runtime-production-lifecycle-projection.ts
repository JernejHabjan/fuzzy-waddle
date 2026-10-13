import { projectRuntimeControlledOutputs } from "./skirmish-ai-runtime-controlled-output";
import { projectRuntimeControlledRefunds } from "./skirmish-ai-runtime-production-controlled-refund";
import { projectRuntimeControlledCommands } from "./skirmish-ai-runtime-production-controlled-commands";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionLifecycleV2 } from "./skirmish-ai-runtime-production-lifecycle-v2";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Retains checked native joins and marks every unsupported cash/claim/site origin unavailable. */
export function projectRuntimeProductionLifecycleV2(
  capture: AiRuntimeProductionCaptureV1,
  causal: RuntimeProductionCausalityV1,
  preset?: AiRuntimePresetApplicationV1
): RuntimeProductionLifecycleV2 {
  const controlled = projectRuntimeControlledCommands(capture);
  const gaps = new Set<string>();
  const failures: string[] = [...controlled.failures];
  const setupIds = new Set(capture.setup?.actors.map((actor) => actor.actorId));
  const firstSelected = capture.facts.find((fact) => fact.kind === "decision_selected")?.sequence ?? Infinity;
  const isSetup = (entry: RuntimeProductionCausalityV1["constructionLineage"][number]) => {
    const record = entry.boundary.construction;
    if (record.site.actorId !== null && setupIds.has(record.site.actorId)) return true;
    // Native finished-actor initialization precedes deterministic ID registration. It is never runtime work or payment.
    return (
      !!capture.setup &&
      capture.setup.tick === 0 &&
      entry.boundary.tick === 0 &&
      entry.boundary.sequence < firstSelected &&
      record.kind === "lifecycle" &&
      record.transition === "restored" &&
      record.remainingWorkMs === 0 &&
      record.site.finished &&
      !record.site.indexed &&
      !record.sceneActive &&
      !record.snapshotRestoreInProgress
    );
  };
  const setupConstruction = causal.constructionLineage.filter(isSetup);
  const construction = causal.constructionLineage.filter((entry) => !isSetup(entry));
  for (const entry of construction) {
    entry.gaps.forEach((gap) => gaps.add(gap));
    const record = entry.boundary.construction;
    const boundary = entry.boundary.boundaryState;
    if (
      !boundary?.unspentClaims?.resources ||
      !boundary.resources ||
      !boundary.obligations ||
      boundary.snapshotRestoreInProgress
    )
      gaps.add("production_v2_construction_claim_boundary_missing");
    if (entry.origin === "placement" && (!entry.commandScope || !entry.application || !entry.placement)) {
      gaps.add("production_v2_construction_command_missing");
    }
    if (record.kind === "resource" && record.configuredCostType !== PaymentType.PayImmediately) {
      gaps.add("production_v2_construction_per_tick_unsupported");
    }
    if (
      record.kind === "lifecycle" &&
      ["started", "finished"].includes(record.transition) &&
      entry.origin === "placement"
    ) {
      if (
        !causal.constructionLineage.some(
          (charge) =>
            charge.boundary.sequence < entry.boundary.sequence &&
            charge.boundary.construction.site.actorId === record.site.actorId &&
            charge.boundary.construction.kind === "resource" &&
            charge.boundary.construction.operation === "start_charge" &&
            (charge.boundary.construction.status === "returned" ||
              (charge.boundary.construction.status === "skipped" &&
                charge.boundary.construction.configuredCostType === PaymentType.PayImmediately &&
                !Object.values(charge.boundary.construction.configuredCost ?? {}).some((amount) => amount > 0)))
        )
      ) {
        gaps.add("production_v2_construction_start_payment_missing");
      }
    }
    if (record.kind === "resource" && record.status === "returned") {
      if (
        !record.balanceMatches ||
        record.callbackCount !== 1 ||
        record.nestedEmission ||
        !record.before ||
        !record.after ||
        !record.callbackAmounts
      )
        failures.push("production_v2_construction_money_invalid");
      if (record.configuredCostType !== 0) gaps.add("production_v2_construction_per_tick_unsupported");
      if (
        record.operation === "start_charge" &&
        record.before &&
        record.requested &&
        boundary?.unspentClaims?.resources &&
        boundary.obligations &&
        Object.values(ResourceType).some(
          (resource) =>
            (record.requested?.[resource] ?? 0) >
            (record.before?.[resource] ?? -1) -
              (boundary.unspentClaims?.resources?.[resource] ?? Infinity) -
              (boundary.obligations?.[resource] ?? Infinity)
        )
      )
        failures.push("production_v2_construction_unfunded_global_claims");
    }
  }
  for (const rejection of causal.rejections) {
    if (
      !rejection.resourcesBefore ||
      !rejection.resourcesAfter ||
      !rejection.obligationsBefore ||
      !rejection.obligationsAfter ||
      !rejection.reservedUnspentBefore ||
      !rejection.reservedUnspentAfter
    ) {
      gaps.add("production_v2_rejection_money_missing");
    } else if (
      JSON.stringify(rejection.resourcesBefore) !== JSON.stringify(rejection.resourcesAfter) ||
      JSON.stringify(rejection.obligationsBefore) !== JSON.stringify(rejection.obligationsAfter)
    ) {
      failures.push("production_v2_rejection_spent_or_queued");
    }
  }
  const cancellationRequests = causal.cancellations.map((cancel) => ({
    sequence: cancel.requestedSequence,
    requestTick: cancel.requestedTick,
    scheduledTick: cancel.scheduledTick,
    commandId: cancel.commandId,
    effectId: cancel.effectId,
    itemId: cancel.item.itemId
  }));
  const horizon = capture.frontiers?.latestTick ?? Number.POSITIVE_INFINITY;
  const losses = capture.facts
    .filter((fact) => fact.kind === "actor_unregistered")
    .filter((fact) => fact.tick <= horizon);
  if (losses.some((fact) => fact.boundaryState?.snapshotRestoreInProgress || !fact.boundaryState)) {
    gaps.add("production_v2_loss_boundary_missing");
  }
  const setupPayments = preset?.queueApplications ?? [];
  for (const item of causal.initialQueues) {
    if (!setupPayments.some((application) => application.itemId === item.item.itemId)) {
      gaps.add("production_v2_initial_payment_missing");
    }
  }
  // Money, removal and completion require their own frames. Requests deliberately use their separate identity-only channel.
  for (const fact of capture.facts.filter(
    (fact) =>
      fact.sequence >= firstSelected &&
      ["queue_resource", "queue_mutation", "queue_progress", "construction_authority"].includes(fact.kind)
  )) {
    // Immediate-payment callbacks intentionally keep ownership indeterminate until their checked terminal.
    if (fact.kind === "queue_resource" && fact.resource.emission.phase === "callback") continue;
    if (
      !fact.boundaryState?.unspentClaims?.resources ||
      !fact.boundaryState.resources ||
      !fact.boundaryState.obligations
    ) {
      gaps.add("production_v2_runtime_financial_frame_missing");
    }
    fact.boundaryState?.unspentClaims?.gaps.forEach((gap) => gaps.add(gap));
  }
  const queues = (causal.queueLifecycleEvents ?? [])
    .filter((event) => event.kind !== "cancel_requested" && event.tick <= horizon)
    .map((event) => ({
      ...event,
      applicationTick: event.tick,
      selectedSequence:
        causal.commands.find((scope) => scope.command.execution?.commandId === event.commandId)?.decision?.sequence ??
        null
    }));
  if (
    causal.cancellations.some(
      (cancel) =>
        !queues.some((event) => event.kind === "refund" && event.sequence === cancel.refund.sequence) ||
        !queues.some((event) => event.kind === "cancel" && event.sequence === cancel.removal.sequence)
    )
  )
    gaps.add("production_v2_refund_or_removal_frame_missing");
  return structuredClone({
    controlledOutputs: projectRuntimeControlledOutputs(capture, causal),
    controlledRefunds: projectRuntimeControlledRefunds(capture, preset),
    controlledCommands: controlled.commands,
    queues,
    cancellationRequests,
    construction,
    setupConstruction,
    constructionDefinitions: causal.constructionCatalog,
    rejections: causal.rejections,
    setupPayments,
    losses,
    failures: [...new Set(failures)],
    gaps: [...gaps].sort()
  });
}
