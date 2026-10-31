import { OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { createAiTransportPlanV1 } from "./ai-transport-plan-creation";
import { canAffordAiEconomyCost, hasCredibleAiEconomyThreat } from "./ai-economy-policy";
import { node, ownedCombat, routeCapability } from "./ai-skirmish-support";

const terminal = (phase: string) => ["completed", "cancelled", "failed"].includes(phase);
const available = (actor: AiObservedActorV1) => actor.resourceState.status === "known" &&
  actor.resourceState.value.available.status === "known" ? actor.resourceState.value.available.value : 0;

/** Seed a real protected builder transfer only for observed offshore resources needed after local exhaustion. */
export function proposeAiIslandEstablishment(
  observation: AiObservationV1, state: AiBrainStateV1, catalog: AiCapabilityCatalogV1
): AiManagerProposalV1 | undefined {
  const graph = observation.map?.accessGraph;
  if (!graph || graph.status !== "ready" || hasCredibleAiEconomyThreat(observation) ||
    state.transport.some((plan) => !terminal(plan.phase))) return;
  const owned = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const idleWorkers = owned.filter((actor) => node(actor) && !actor.containedInActorId &&
    !actor.resourceTransferInFlight && (actor.carriedResourceAmount ?? 0) === 0 &&
    actor.activeOrder?.status === "known" && (!actor.activeOrder.value || actor.activeOrder.value.orderType === OrderType.Stop) &&
    catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.constructs.length && entry.gathers.length))
    .sort((a, b) => a.actorId.localeCompare(b.actorId));
  for (const builder of idleWorkers.slice(0, 4)) {
    const from = node(builder)!;
    const protection = ownedCombat(observation, catalog).find((actor) => node(actor) === from &&
      !state.squads.some((squad) => squad.actorIds.includes(actor.actorId) &&
        !["reserve", "completed", "cancelled"].includes(squad.state)));
    if (!protection) continue;
    const sources = observation.actors.filter((actor) => actor.relation !== "enemy" && actor.visibility !== "last_seen" &&
      node(actor) && node(actor) !== from && available(actor) >= 200 && actor.resourceState.status === "known" &&
      actor.resourceState.value.resourceType !== ResourceType.Food).sort((a, b) => a.actorId.localeCompare(b.actorId));
    for (const source of sources.slice(0, 4)) {
      if (source.resourceState.status !== "known") continue;
      const type = source.resourceState.value.resourceType, destination = node(source)!;
      if (!(state.economyProduction.forecasts.some((entry) => entry.resourceType === type && entry.amount > 0)) ||
        observation.actors.some((actor) => node(actor) === from && actor.relation !== "enemy" &&
          actor.visibility !== "last_seen" && available(actor) >= 200 && actor.resourceState.status === "known" &&
          actor.resourceState.value.resourceType === type)) continue;
      const planId = `transport:island-service:${source.actorId}` as const;
      if (state.transport.some((plan) => plan.planId === planId) || owned.some((actor) => node(actor) === destination &&
        catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.acceptsResources?.includes(type))))
        continue;
      const builderEntry = catalog.entries.find((entry) => entry.sourceObjectName === builder.objectName);
      const service = catalog.entries.filter((entry) => entry.acceptsResources?.includes(type) && entry.constructionProfile &&
        builderEntry?.constructs.includes(entry.sourceObjectName) &&
        canAffordAiEconomyCost(observation, entry.constructionProfile.resourceCost))
        .sort((a, b) => (a.acceptsResources?.length ?? 0) - (b.acceptsResources?.length ?? 0) ||
          a.sourceObjectName.localeCompare(b.sourceObjectName))[0];
      if (!service) continue;
      const optionalWorkers = idleWorkers.filter((actor) => actor.actorId !== builder.actorId && node(actor) === from).slice(0, 2);
      const members = [builder, protection, ...optionalWorkers];
      const request = { queryId: `query:${planId}`, kind: "movement" as const, fromNodeId: from, toNodeId: destination,
        capabilities: routeCapability(observation, members, catalog), firingNodeIds: [] };
      const route = queryAiAccessRouteV1(graph, request);
      if (route.kind !== "water_transport") continue;
      const plan = createAiTransportPlanV1({ planId, routeRequest: request, route, tick: observation.tick,
        establishment: { sourceActorId: source.actorId, serviceObjectName: service.sourceObjectName,
          resourceCost: service.constructionProfile!.resourceCost },
        missionKind: "island_establishment", estimatedTravelTicks: Math.max(1, route.distanceCost), passengers: [
          { actorId: builder.actorId, role: "builder", indispensable: true, handoff: "economy" },
          { actorId: protection.actorId, role: "protection", indispensable: true, handoff: "squad" },
          ...optionalWorkers.map((worker) => ({ actorId: worker.actorId, role: "worker" as const,
            indispensable: false, handoff: "economy" as const }))
        ] });
      return { managerId: "stage8.transport", lane: "army_threat", evaluated: true, intents: [],
        reasons: ["observed_offshore_resource_requires_protected_builder_transfer"], statePatch: { transportAppend: [plan] } };
    }
  }
  return;
}
