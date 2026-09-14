import type { Page } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

export async function captureRuntimeEconomyCheckpoint(
  page: Page,
  aiPlayerNumber: number,
  targetTick: number
): Promise<Partial<RuntimeCheckpointV1>> {
  return page.evaluate(
    ({ playerNumber, expectedTick }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      const observation = parts.controller.getCommittedObservation();
      const state = parts.controller.getBrainState();
      const catalog = parts.controller.getCommittedCapabilityCatalog();
      const bridge = parts.controller.getBrainCommandBridgeSnapshot();
      const debug = parts.controller.getBrainDebugSnapshot();
      if (!observation || !state || !catalog || !bridge || !debug) throw new Error("runtime_checkpoint_not_committed");
      const selfActors = observation.actors.filter(
        (actor) => actor.relation === "self" && actor.visibility === "owned"
      );
      const workerNames = new Set(
        catalog.entries.filter((entry) => entry.gathers.length > 0).map((entry) => entry.sourceObjectName)
      );
      const terminalFailureReasons: Record<string, number> = {};
      bridge.outcomes
        .filter((outcome) => ["rejected", "cancelled", "failed"].includes(outcome.kind))
        .forEach((outcome) => {
          const reason = outcome.reason ?? "unknown";
          terminalFailureReasons[reason] = (terminalFailureReasons[reason] ?? 0) + 1;
        });
      return {
        targetTick: expectedTick,
        tick: parts.tickService.currentTick,
        observationTick: observation.tick,
        decisionSequence: state.scheduler.decisionSequence,
        faction: observation.faction,
        openingPlanId: state.opening.plan.planId,
        openingSteps: Object.fromEntries(
          state.opening.plan.steps.map((step) => [
            step.stepId,
            { state: step.state, completedTick: step.completedTick }
          ])
        ),
        workerCount: selfActors.filter((actor) => workerNames.has(actor.objectName)).length,
        deliveredIncome: observation.resources.reduce(
          (total, resource) =>
            total +
            (resource.deliveredIncomePerMinute.status === "known" ? resource.deliveredIncomePerMinute.value : 0),
          0
        ),
        appliedCommands: bridge.outcomes
          .filter((outcome) => outcome.kind === "applied")
          .map((outcome) => ({
            commandId: outcome.identity.commandId,
            effectId: outcome.identity.effectId
          })),
        terminalFailureCount: bridge.outcomes.filter((outcome) =>
          ["rejected", "cancelled", "failed"].includes(outcome.kind)
        ).length,
        terminalFailureReasons,
        recentCommandFailures: parts
          .getCommandOutcomes()
          .filter((outcome) => ["rejected", "cancelled", "failed"].includes(outcome.kind))
          .slice(-50)
          .map((outcome) => ({
            kind: outcome.kind,
            reason: outcome.reason,
            detail: outcome.detail ?? null,
            effectId: outcome.effectId ?? null
          })),
        ownedActorNames: selfActors.map((actor) => actor.objectName).sort(),
        rawOwnedActorNames: [...parts.getRawOwnedActorNames(playerNumber)],
        ownedConstruction: selfActors
          .filter((actor) => actor.constructionProgress?.status === "known")
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            progress: actor.constructionProgress?.status === "known" ? actor.constructionProgress.value : 100
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        workerOrders: selfActors
          .filter((actor) => workerNames.has(actor.objectName))
          .map((actor) => ({
            actorId: actor.actorId,
            orderType: actor.activeOrder?.status === "known" ? (actor.activeOrder.value?.orderType ?? null) : null,
            targetActorId:
              actor.activeOrder?.status === "known" ? (actor.activeOrder.value?.targetActorId ?? null) : null
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        workerConstructs: Object.fromEntries(
          catalog.entries
            .filter((entry) => entry.gathers.length > 0)
            .map((entry) => [entry.sourceObjectName, [...entry.constructs].sort()])
        ),
        constructionCellCount: observation.map?.constructionCells?.length ?? 0,
        legalConstructionCellCount:
          observation.map?.constructionCells?.filter((cell) => cell.groundPassable && !cell.observedBlocked).length ??
          0,
        ownedMainBuildingNames: selfActors
          .filter((actor) => actor.mainBuilding?.status === "known" && actor.mainBuilding.value)
          .map((actor) => actor.objectName)
          .sort(),
        sceneComponentNames: [...parts.sceneComponentNames].sort(),
        mapBoundsStatus: observation.map?.bounds.status ?? "absent",
        resourceStockpiles: Object.fromEntries(
          observation.resources.map((resource) => [resource.resourceType, resource.stockpile])
        ),
        recentMacroDecisions: debug.decisions
          .filter(
            (decision) =>
              decision.intent.reasonCode.startsWith("opening:") ||
              decision.intent.reasonCode.startsWith("supply_buffer:") ||
              decision.intent.reasonCode.startsWith("capacity:") ||
              decision.intent.reasonCode.startsWith("composition:") ||
              decision.intent.reasonCode.startsWith("adapt:")
          )
          .map((decision) =>
            [
              decision.outcome,
              decision.reason,
              decision.detail,
              decision.intent.kind,
              decision.intent.objectName,
              decision.intent.reasonCode
            ]
              .filter((value) => value !== undefined)
              .join(":")
          )
      };
    },
    { playerNumber: aiPlayerNumber, expectedTick: targetTick }
  );
}
