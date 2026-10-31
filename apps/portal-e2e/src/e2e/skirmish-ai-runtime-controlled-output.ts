import { runtimeProductionRouteCurrent } from "./skirmish-ai-runtime-production-route-current";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { projectRuntimeControlledCommands } from "./skirmish-ai-runtime-production-controlled-commands";

/** Shared-controller output keeps native command identity with no AI effect/plan. Usefulness still needs normal route and arrival. */
export function projectRuntimeControlledOutputs(
  capture: AiRuntimeProductionCaptureV1,
  causal: RuntimeProductionCausalityV1
) {
  const controls = projectRuntimeControlledCommands(capture).commands;
  return controls
    .filter((control) => control.command.type === "PRODUCTION")
    .flatMap((control) => {
      const commandId = control.command.execution?.commandId;
      const terminal = capture.facts
        .filter((fact) => fact.kind === "queue_completion")
        .filter(
          (fact) =>
            fact.completion.phase === "after" &&
            fact.completion.originatingCommandContext?.execution.commandId === commandId
        );
      const complete = terminal[0];
      const actorId = complete?.completion.createdActor?.actorId;
      const itemId = complete?.completion.item?.itemId;
      if (
        terminal.length !== 1 ||
        !complete ||
        !actorId ||
        !itemId ||
        complete.completion.gaps.length ||
        !complete.completion.createdActorInProducerScene ||
        complete.completion.snapshotRestoreInProgress ||
        !control.outcomes.some((fact) => fact.outcome.kind === "applied") ||
        !control.outcomes.some(
          (fact) => fact.outcome.kind === "completed" && fact.outcome.worldLinkIds.includes(actorId)
        )
      )
        return [];
      const output = capture.facts
        .filter((fact) => fact.kind === "spatial_authority")
        .find(
          (fact) =>
            fact.spatial.kind === "output" &&
            fact.spatial.item.itemId === itemId &&
            fact.spatial.product.actorId === actorId &&
            fact.spatial.target?.playerNumber === capture.playerNumber
        );
      const spawn = capture.facts
        .filter((fact) => fact.kind === "spatial_authority")
        .find(
          (fact) =>
            fact.spatial.kind === "spawn" &&
            fact.spatial.item.itemId === itemId &&
            fact.spatial.tile &&
            fact.spatial.position
        );
      if (!output || output.spatial.kind !== "output" || output.spatial.gaps.length || !spawn) return [];
      const supplied = new Set([
        "production_route_useful_arrival_missing",
        "production_spatial_navigation_history_unverified",
        "production_spatial_native_cache_mutable_result_history_missing",
        "production_route_order_useful_effect_missing",
        "production_route_complete_order_history_missing"
      ]);
      const path = causal.producerRoutes.paths.find((entry) => {
        const current = runtimeProductionRouteCurrent(
          {
            coverage: capture.frontiers ?? null,
            lifecycle: { losses: capture.facts.filter((fact) => fact.kind === "actor_unregistered") }
          },
          entry
        );
        return (
          entry.requested.spatial.kind === "producer_path" &&
          entry.requested.spatial.target?.actorId ===
            (output.spatial.kind === "output" ? output.spatial.target?.actorId : null) &&
          entry.output?.boundary.sequence === output.sequence &&
          current &&
          entry.orderLineage.queryCallerAttributed &&
          entry.gaps.every(
            (gap) =>
              supplied.has(gap) ||
              (gap === "production_route_shared_service_command_missing" &&
                entry.orderLineage.rally?.spatial.kind === "route_rally_order" &&
                output.spatial.kind === "output" &&
                entry.orderLineage.rally.spatial.outputId === output.spatial.outputId) ||
              (current &&
                [
                  "production_route_stale_or_missing_actor_binding",
                  "production_route_awaited_history_unverified"
                ].includes(gap))
          ) &&
          entry.nativeNavigation.completedRebuildInterval === "same_completed" &&
          entry.nativeNavigation.queryGenerationAtTerminal === "same_native_generation" &&
          ["same_requested_generation", "uncached_overlay"].includes(entry.nativeNavigation.cacheLineage) &&
          entry.terminal.spatial.kind === "producer_path" &&
          entry.terminal.spatial.result === "path"
        );
      });
      const movement =
        path &&
        causal.movements.find(
          (entry) =>
            entry.callerAttributed &&
            !entry.gaps.length &&
            entry.arrival === "original_destination" &&
            entry.returned === "true" &&
            entry.started.spatial.kind === "movement" &&
            entry.started.spatial.source.actorId === actorId &&
            entry.admission?.sequence === path.orderLineage.admission?.sequence
        );
      const arrived = movement?.observations.find((fact) => fact.spatial.phase === "arrived");
      if (!path || !arrived) return [];
      return [
        {
          commandId,
          actorId,
          itemId,
          arrivedTick: arrived.tick,
          targetActorId: output.spatial.target?.actorId ?? null,
          completion: complete,
          output,
          spawn
        }
      ];
    });
}
