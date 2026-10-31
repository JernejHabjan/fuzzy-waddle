import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";

/** Native command lineage strips the protocol's `effect:` label when stamping the shared command. */
export function expansionEffectMatchesExecution(
  intentEffectId: string,
  execution: { readonly effectId?: string } | undefined
): boolean {
  return !!execution?.effectId && intentEffectId.replace(/^effect:/, "") === execution.effectId;
}

/**
 * Bind a paid expansion to its original builder's native arrival and exact economic-worker delivery into that building.
 */
export function expansionServiceFailures(
  result: Pick<RuntimeVariantResultV1, "productionCapture" | "presetCreatedActorIds">,
  siteId: string, commandId: string, builderId: string, latestTick = 3000
): string[] {
  const capture = result.productionCapture, sourceId = result.presetCreatedActorIds["safe-source"];
  if (!capture || !sourceId) return ["expansion_native_service_capture_missing"];
  const facts = capture.facts.filter((fact) => fact.tick <= latestTick), failures: string[] = [];
  const completions = facts.filter((fact) => fact.kind === "construction_authority" &&
    fact.construction.site.actorId === siteId && fact.construction.kind === "lifecycle" && fact.construction.transition === "finished"
  );
  const completion = completions[0];
  const charges = facts.filter((fact) => fact.kind === "construction_authority" &&
    fact.construction.site.actorId === siteId && fact.construction.kind === "resource" &&
    fact.construction.operation === "start_charge" && fact.construction.status === "returned" &&
    fact.construction.callbackCount === 1 && fact.construction.balanceMatches && !fact.construction.nestedEmission &&
    fact.construction.ownerArgument === 2
  );
  if (completions.length !== 1 || !completion || charges.length !== 1 || facts.some((fact) =>
    fact.kind === "construction_authority" && fact.construction.site.actorId === siteId &&
    (fact.construction.clockTick !== fact.tick || !fact.construction.sceneActive || fact.construction.snapshotRestoreInProgress)
  )) return ["expansion_native_paid_completion_missing_or_invalid"];
  const movements = normalizeRuntimeMovement(capture);
  const movementArrival = movements.movements.some((movement) => movement.callerAttributed && !movement.gaps.length &&
    movement.arrival === "original_destination" && movement.returned === "true" && movement.observations.some((entry) =>
      entry.tick <= completion.tick && entry.spatial.phase === "arrived" && entry.spatial.source.actorId === builderId &&
      entry.spatial.caller?.caller === "actor_movement" && entry.spatial.caller.order?.orderType === "Build" &&
      entry.spatial.caller.order.target?.actorId === siteId
    )
  );
  const placement = facts.find((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement" &&
    fact.spatial.site.actorId === siteId && fact.spatial.command.execution?.commandId === commandId);
  const observedBuildAssignment = !!placement && facts.some((fact) => {
    if (fact.kind !== "decision_selected" || fact.tick < placement.tick || fact.tick > completion.tick) return false;
    const input = fact.decision.input;
    if (!input || input.gaps.length || input.snapshotRestoreInProgress || input.observation?.tick !== fact.tick) return false;
    const builder = input.observation.actors.find((actor) => actor.actorId === builderId);
    return !!builder && isNativeBuilderAssignedToSite(builder, builderId, siteId, fact.tick);
  });
  if (movements.failures.length || (!movementArrival && !observedBuildAssignment))
    failures.push("expansion_original_builder_native_arrival_missing");
  if (!facts.some((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied" &&
    fact.outcome.commandId === commandId && fact.outcome.worldLinkIds.includes(siteId)
  )) failures.push("expansion_original_shared_application_missing");
  const retained = capture.frontiers?.intervals.filter((interval) => interval.closedThroughTick >= completion.tick) ?? [];
  if (!retained.length || retained.some((interval) => !interval.actors.some(({ identity }) => identity.actorId === siteId &&
    identity.active && identity.alive && identity.finished && identity.indexed
  ))) failures.push("expansion_completed_deposit_not_retained");
  if (!hasNativeSourceDelivery(facts, { sourceActorId: sourceId, sourceOwner: null, playerNumber: 2,
    resourceType: ResourceType.Wood, fromTick: completion.tick, throughTick: latestTick, depositActorId: siteId
  })) failures.push("expansion_has_no_native_worker_delivery_to_new_deposit");
  return failures;
}

/** Require a fresh fair observation of the original owned builder's native Build order for this exact site. */
export function isNativeBuilderAssignedToSite(
  actor: {
    readonly actorId: string;
    readonly relation: string;
    readonly logicalPosition?: { readonly status: string };
    readonly activeOrder?: {
      readonly status: string;
      readonly value?: { readonly orderType: string; readonly targetActorId?: string | null } | null;
      readonly observedTick?: number;
    };
  },
  builderId: string,
  siteId: string,
  observedTick: number
): boolean {
  return actor.actorId === builderId && actor.relation === "self" && actor.logicalPosition?.status === "known" &&
    actor.activeOrder?.status === "known" && actor.activeOrder.observedTick === observedTick &&
    actor.activeOrder.value?.orderType === "Build" &&
    actor.activeOrder.value.targetActorId === siteId;
}
