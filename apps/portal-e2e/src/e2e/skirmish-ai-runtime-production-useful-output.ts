import { runtimeProductionRouteCurrent } from "./skirmish-ai-runtime-production-route-current";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import { productionActorRetained } from "./skirmish-ai-runtime-production-authority-evaluation";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";

/** Exact completion -> legal spawn -> normal attributed rally query -> actual original-destination arrival and stable actor. */
export function runtimeProductionUsefulOutputs(
  evidence: RuntimeProductionEvidenceV2,
  contract: RuntimeProductionContractV1
) {
  const { stableForTicks, usefulRallyActorRole } = contract;
  const horizon = evidence.coverage?.latestTick ?? -1;
  return evidence.routes.outputs.flatMap((output) => {
    const completion = output.completion;
    const boundary = output.boundary.spatial;
    const spawn = output.spawn?.spatial;
    if (
      !completion?.createdActor?.actorId ||
      boundary.kind !== "output" ||
      spawn?.kind !== "spawn" ||
      !spawn.tile ||
      !spawn.position ||
      output.gaps.length ||
      spawn.item.itemId !== completion.itemId ||
      boundary.product.actorId !== completion.createdActor.actorId
    )
      return [];
    if (
      !usefulRallyActorRole ||
      !boundary.target?.actorId ||
      boundary.target.playerNumber !== boundary.producer.playerNumber ||
      evidence.setup?.roles[boundary.target.actorId] !== `fixture:${usefulRallyActorRole}`
    )
      return [];
    // Arrival plus closed survival supplies usefulness. These legacy gaps explicitly described the previously missing channels.
    const supplied = new Set([
      "production_route_useful_arrival_missing",
      "production_spatial_navigation_history_unverified",
      "production_spatial_native_cache_mutable_result_history_missing",
      "production_route_order_useful_effect_missing",
      "production_route_complete_order_history_missing"
    ]);
    const route = evidence.routes.paths.find((path) => {
      const current = runtimeProductionRouteCurrent(evidence, path);
      return (
        path.requested.spatial.kind === "producer_path" &&
        path.requested.spatial.target?.actorId === boundary.target?.actorId &&
        path.output?.boundary.sequence === output.boundary.sequence &&
        path.orderLineage.queryCallerAttributed &&
        current &&
        path.gaps.every(
          (gap) =>
            supplied.has(gap) ||
            (gap === "production_route_shared_service_command_missing" &&
              path.orderLineage.rally?.spatial.kind === "route_rally_order" &&
              path.orderLineage.rally.spatial.outputId === boundary.outputId) ||
            (current &&
              [
                "production_route_stale_or_missing_actor_binding",
                "production_route_awaited_history_unverified"
              ].includes(gap))
        ) &&
        path.nativeNavigation.completedRebuildInterval === "same_completed" &&
        path.nativeNavigation.queryGenerationAtTerminal === "same_native_generation" &&
        ["same_requested_generation", "uncached_overlay"].includes(path.nativeNavigation.cacheLineage) &&
        path.terminal.spatial.kind === "producer_path" &&
        path.terminal.spatial.result === "path"
      );
    });
    if (!route) return [];
    const arrival = evidence.movements.find(
      (movement) =>
        movement.callerAttributed &&
        movement.gaps.length === 0 &&
        movement.arrival === "original_destination" &&
        movement.returned === "true" &&
        movement.started.spatial.kind === "movement" &&
        movement.started.spatial.source.actorId === completion.createdActor?.actorId &&
        movement.started.sequence >= route.requested.sequence &&
        movement.admission?.sequence === route.orderLineage.admission?.sequence
    );
    const arrived = arrival?.observations.find((fact) => fact.spatial.phase === "arrived");
    if (
      !arrived ||
      arrived.tick + stableForTicks > horizon ||
      !productionActorRetained(evidence, completion.createdActor.actorId, arrived.tick, arrived.tick + stableForTicks)
    )
      return [];
    return [{ completion, arrivedTick: arrived.tick }];
  });
}
