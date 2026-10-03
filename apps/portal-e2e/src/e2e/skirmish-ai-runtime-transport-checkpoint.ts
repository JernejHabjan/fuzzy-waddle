import type { Page } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

export async function captureRuntimeTransportCheckpoint(
  page: Page,
  aiPlayerNumber: number
): Promise<Partial<RuntimeCheckpointV1>> {
  return page.evaluate((playerNumber) => {
    const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
    if (!parts) throw new Error("runtime_controller_unavailable");
    const observation = parts.controller.getCommittedObservation();
    const state = parts.controller.getBrainState();
    const catalog = parts.controller.getCommittedCapabilityCatalog();
    const bridge = parts.controller.getBrainCommandBridgeSnapshot();
    if (!observation || !state || !catalog || !bridge) throw new Error("runtime_checkpoint_not_committed");
    const selfActors = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
    const accessGraph = observation.map?.accessGraph;
    return {
      accessTopology: {
        status: accessGraph?.status ?? "absent",
        groundNodes: accessGraph?.nodes.filter((node) => node.domain === "ground").length ?? 0,
        waterNodes: accessGraph?.nodes.filter((node) => node.domain === "water").length ?? 0,
        airNodes: accessGraph?.nodes.filter((node) => node.domain === "air").length ?? 0,
        shoreTransfers: accessGraph?.transferPoints.filter((point) => point.kind === "shore").length ?? 0
      },
      carrierCatalog: catalog.entries
        .filter((entry) => entry.cargoCapacity !== null && entry.cargoCapacity !== undefined)
        .map((entry) => ({
          objectName: entry.sourceObjectName,
          capacity: entry.cargoCapacity ?? 0,
          domains: [...entry.movementDomains].sort(),
          producerNames: catalog.entries
            .filter((producer) => producer.produces.includes(entry.sourceObjectName))
            .map((producer) => producer.sourceObjectName)
            .sort()
        }))
        .sort((left, right) => left.objectName.localeCompare(right.objectName)),
      mobileTransports: selfActors
        .filter((actor) => actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.length)
        .map((actor) => ({
          actorId: actor.actorId,
          objectName: actor.objectName,
          capacity: actor.containerState?.status === "known" ? actor.containerState.value.capacity : 0,
          passengerIds: actor.containerState?.status === "known" ? [...actor.containerState.value.passengerIds] : [],
          pendingPassengerIds:
            actor.containerState?.status === "known" ? [...actor.containerState.value.pendingPassengerIds] : [],
          domains: actor.containerState?.status === "known" ? [...actor.containerState.value.mobileDomains] : []
        }))
        .sort((left, right) => left.actorId.localeCompare(right.actorId)),
      transportPlans: state.transport
        .map((plan) => ({
          planId: plan.planId,
          phase: plan.phase,
          routeKind: plan.lifecycle?.route.kind ?? null,
          passengerCount: plan.passengerIds.length,
          transportCount: plan.transportIds.length,
          assignedCapacity: plan.lifecycle?.assignedCapacity ?? 0,
          requiredCapacity: plan.lifecycle?.requiredCapacity ?? 0,
          terminalReason: plan.lifecycle?.terminalReason ?? null
        }))
        .sort((left, right) => left.planId.localeCompare(right.planId)),
      transportDecisions: parts.controller
        .getBrainDebugHistory()
        .flatMap((snapshot) => snapshot.decisions)
        .filter((decision) => decision.intent.reasonCode.startsWith("transport_"))
        .map((decision) =>
          [decision.outcome, decision.reason, decision.detail, decision.intent.kind, decision.intent.reasonCode]
            .filter((value) => value !== undefined)
            .join(":")
        ),
      transportOutcomes: bridge.outcomes
        .filter((outcome) => outcome.identity.intentId.startsWith("intent:transport:"))
        .map((outcome) => ({
          tick: outcome.tick,
          intentId: outcome.identity.intentId,
          effectId: outcome.identity.effectId,
          kind: outcome.kind,
          reason: outcome.reason ?? null
        }))
    };
  }, aiPlayerNumber);
}
