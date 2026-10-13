// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { projectRuntimeControlledCommands } from "./skirmish-ai-runtime-production-controlled-commands";

/** Controlled refund experiment joins physical setup payment, exact handle removal and real native money callbacks. */
export function projectRuntimeControlledRefunds(
  capture: AiRuntimeProductionCaptureV1,
  setup?: AiRuntimePresetApplicationV1
) {
  const controls = projectRuntimeControlledCommands(capture).commands;
  return controls
    .filter((entry) => entry.command.type === "CANCEL_PRODUCTION")
    .map((cancel) => {
      const failures: string[] = [];
      const itemId = cancel.request.control.setupItemId;
      const paid = setup?.queueApplications.find((entry) => entry.itemId === itemId);
      const commandId = cancel.command.execution?.commandId;
      const removals = capture.facts
        .filter((fact) => fact.kind === "queue_mutation")
        .filter(
          (fact) =>
            fact.mutation.operation === "cancel_remove" &&
            fact.mutation.cancellationCommand?.execution?.commandId === commandId
        );
      const before = removals.find((fact) => fact.mutation.phase === "before");
      const after = removals.find((fact) => fact.mutation.phase === "after");
      const refundFacts = capture.facts
        .filter((fact) => fact.kind === "queue_resource")
        .filter(
          (fact) =>
            fact.resource.operation === "cancellation_refund" &&
            fact.resource.cancellationCommand?.execution?.commandId === commandId
        );
      const started = refundFacts.find((fact) => fact.resource.emission.phase === "started");
      const callback = refundFacts.find((fact) => fact.resource.emission.phase === "callback");
      const finished = refundFacts.find((fact) => fact.resource.emission.phase === "finished");
      const money = finished?.resource.emission;
      if (
        !paid ||
        !itemId ||
        paid.command.execution?.source !== "human" ||
        !before ||
        !after ||
        removals.length !== 2 ||
        before.mutation.item?.itemId !== itemId ||
        after.mutation.item?.itemId !== itemId ||
        before.mutation.originatingCommandContext?.execution.commandId !== paid.command.execution.commandId ||
        before.sequence >= after.sequence ||
        after.sequence >= (started?.sequence ?? -1) ||
        !started ||
        !callback ||
        !finished ||
        refundFacts.length !== 3 ||
        started.sequence >= callback.sequence ||
        callback.sequence >= finished.sequence ||
        finished.resource.itemId !== itemId ||
        finished.resource.actorId !== cancel.request.control.actorId ||
        money?.phase !== "finished" ||
        money.status !== "returned" ||
        !money.balanceMatches ||
        money.callbackCount !== 1 ||
        money.callbackLimitExceeded ||
        money.nestedEmission ||
        money.snapshotRestoreInProgress ||
        !money.before ||
        !money.after ||
        !money.requested ||
        !cancel.outcomes.some((fact) => fact.outcome.kind === "cancelled" && fact.sequence > finished.sequence) ||
        !capture.facts.some(
          (fact) =>
            fact.kind === "outcome" &&
            fact.outcome.kind === "cancelled" &&
            fact.outcome.commandId === paid.command.execution?.commandId &&
            fact.sequence > (after?.sequence ?? Infinity) &&
            fact.sequence < started.sequence
        )
      ) {
        failures.push("production_v2_controlled_refund_native_lineage_invalid");
      }
      const probe = controls.find(
        (entry) =>
          entry.command.type === "PRODUCTION" &&
          entry.request.sequence > cancel.request.sequence &&
          entry.application.sequence < (started?.sequence ?? -1) &&
          entry.command.actorIds[0] === cancel.command.actorIds[0] &&
          entry.outcomes.some(
            (fact) => fact.outcome.kind === "rejected" && fact.outcome.reason === "insufficient_resources"
          )
      );
      const post = controls.find(
        (entry) =>
          entry.command.type === "PRODUCTION" &&
          entry.request.sequence > (finished?.sequence ?? Infinity) &&
          entry.command.actorIds[0] === cancel.command.actorIds[0] &&
          entry.command.type === probe?.command.type &&
          entry.command.actorName === probe.command.actorName &&
          entry.outcomes.some((fact) => fact.outcome.kind === "applied")
      );
      const productKey = probe?.command.type === "PRODUCTION" ? probe.command.actorName : null;
      const postEnqueues = capture.facts.filter(
        (fact) =>
          fact.kind === "queue_mutation" &&
          fact.mutation.operation === "enqueue" &&
          fact.mutation.item?.commandId === post?.command.execution?.commandId
      );
      if (
        postEnqueues.length !== 2 ||
        !postEnqueues.some(
          (fact) =>
            fact.kind === "queue_mutation" &&
            fact.mutation.phase === "after" &&
            fact.sequence > (post?.request.sequence ?? Infinity) &&
            fact.tick === post?.application.tick &&
            fact.mutation.item?.objectName === productKey
        )
      ) {
        failures.push("production_v2_controlled_enqueue_identity_missing");
      }
      const definition = before?.definitionCatalog?.find(
        (entry) => entry.productKey === productKey && entry.producerActorId === cancel.command.actorIds[0]
      );
      // Cancellation catalog is not guaranteed by older captures: the checked setup's exact producer catalog is independent.
      const price =
        definition ??
        capture.snapshots[0]?.world?.catalog.find(
          (entry) => entry.productKey === productKey && entry.producerActorId === cancel.command.actorIds[0]
        );
      const available = probe?.request.boundaryState?.resources;
      const nativeClaims = probe?.request.boundaryState?.unspentClaims?.resources;
      const emptyBoot =
        capture.startedTick === 0 &&
        capture.setup &&
        probe?.request.boundaryState?.brain?.reservations.length === 0 &&
        !capture.facts.some(
          (fact) =>
            fact.sequence < (probe?.request.sequence ?? 0) &&
            (fact.kind === "decision_selected" || fact.kind === "intent_dispatch")
        );
      const claims = nativeClaims ?? (emptyBoot ? { food: 0, wood: 0, stone: 0, minerals: 0 } : null);
      const obligations = probe?.request.boundaryState?.obligations;
      const refund = money?.phase === "finished" ? money.requested : null;
      if (
        !price ||
        !probe ||
        !post ||
        !available ||
        !claims ||
        !obligations ||
        !refund ||
        price.payment !== "immediate" ||
        !Object.values(ResourceType).some(
          (resource) => (price.cost[resource] ?? 0) > available[resource] - claims[resource] - obligations[resource]
        ) ||
        !Object.values(ResourceType).every(
          (resource) =>
            (price.cost[resource] ?? 0) <=
            available[resource] - claims[resource] - obligations[resource] + (refund[resource] ?? 0)
        ) ||
        cancel.request.tick >= cancel.application.tick ||
        !Object.values(ResourceType).some(
          (resource) => paid && paid.resourcesBefore[resource] > paid.resourcesAfter[resource]
        )
      ) {
        failures.push("production_v2_controlled_refund_affordability_invalid");
      }
      const item = finished?.resource;
      if (
        !item?.storedPrice ||
        item.refundFactor === null ||
        !refund ||
        !Object.values(ResourceType).every(
          (resource) =>
            (refund[resource] ?? 0) === Math.floor((item.storedPrice?.[resource] ?? 0) * (item.refundFactor ?? NaN))
        )
      ) {
        failures.push("production_v2_controlled_refund_amount_invalid");
      }
      return {
        request: cancel.request,
        application: cancel.application,
        paid: paid ?? null,
        removal: after ?? null,
        refund: finished ?? null,
        probe: probe ?? null,
        post: post ?? null,
        failures: [...new Set(failures)]
      };
    });
}
