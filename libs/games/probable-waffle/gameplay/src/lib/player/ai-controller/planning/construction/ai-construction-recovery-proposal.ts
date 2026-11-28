import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../contracts/commands/ai-intent";
import { claimedActorIds, isAvailableBuilder, owned } from "../production/macro/ai-macro-observation";
import { nextIds } from "../production/macro/ai-macro-effect-identity";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId } from "../../contracts/ai-core-types";
import { queryAiAccessRoute } from "../access/ai-access-graph";
import { node, routeCapability } from "../strategy/missions/ai-skirmish-support";

/** Repairs one abandoned worker-built site even after its original opening checkpoint has completed.
 * Existing sites retain their native payment/work; this proposal claims no construction resources.
 */
export function proposeAiConstructionRecovery(
  observation: AiObservation,
  state: AiBrainState,
  catalog: AiCapabilityCatalog,
  reservedActorIds: ReadonlySet<string>,
  priorIntents: readonly AiIntent[],
  ordinal: number
): AiIntent | null {
  const self = owned(observation);
  const claimed = claimedActorIds(priorIntents);
  const blockedBuilders = new Set(
    self
      .filter((actor) => {
        const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
        const target = self.find((site) => site.actorId === order?.targetActorId);
        return (
          order?.orderType === OrderType.Build &&
          target &&
          !canReachAiConstructionSite(observation, catalog, actor, target)
        );
      })
      .map((actor) => actor.actorId)
  );
  for (const site of self) {
    if (
      site.constructionProgress?.status !== "known" ||
      site.constructionProgress.value >= 100 ||
      self.some(
        (actor) =>
          !blockedBuilders.has(actor.actorId) &&
          actor.activeOrder?.status === "known" &&
          actor.activeOrder.value?.orderType === OrderType.Build &&
          actor.activeOrder.value.targetActorId === site.actorId
      ) ||
      priorIntents.some((intent) => intent.kind === "resume_construct" && intent.targetActorId === site.actorId) ||
      !catalog.entries.some(
        (entry) =>
          entry.sourceObjectName === site.objectName && entry.constructionProfile?.requiresAssignedBuilder === true
      )
    )
      continue;
    const siteRecoveryBuilders = new Set([
      ...state.reservations.flatMap((reservation) => {
        const actorId = reservation.subjectKey?.startsWith("actor:")
          ? reservation.subjectKey.slice("actor:".length)
          : null;
        const activeLease =
          reservation.state.kind === "dispatched" ||
          (reservation.state.kind === "provisional" && reservation.state.expiresAt.dueTick > observation.tick);
        return actorId && reservation.claimId.startsWith(`resume-construction:${site.actorId}:`) && activeLease
          ? [actorId]
          : [];
      }),
      ...state.pendingOutcomes.flatMap((outcome) =>
        outcome.kind === "failed" && outcome.identity.intentId.startsWith(`intent:resume-construction:${site.actorId}:`)
          ? (outcome.actorIds ?? [])
          : []
      )
    ]);
    const builder = self
      .filter((actor) => {
        const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
        const target = self.find((actor) => actor.actorId === order?.targetActorId);
        const abandonedOrder =
          blockedBuilders.has(actor.actorId) ||
          (order?.orderType === OrderType.Build &&
            order.targetActorId !== null &&
            (!target || (target.constructionProgress?.status === "known" && target.constructionProgress.value >= 100)));
        return isAvailableBuilder(
          abandonedOrder
            ? {
                ...actor,
                activeOrder: {
                  status: "known",
                  value: null,
                  observedTick: observation.tick
                }
              }
            : actor
        );
      })
      .filter(
        (actor) =>
          !claimed.has(actor.actorId) &&
          !reservedActorIds.has(actor.actorId) &&
          !siteRecoveryBuilders.has(actor.actorId)
      )
      .filter((actor) =>
        catalog.entries.some(
          (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(site.objectName)
        )
      )
      .filter((actor) => canReachAiConstructionSite(observation, catalog, actor, site))
      .sort(
        (left, right) => distance(left, site) - distance(right, site) || left.actorId.localeCompare(right.actorId)
      )[0];
    if (!builder) continue;
    const ids = nextIds(state, `resume-construction:${site.actorId}`, ordinal);
    return {
      ...ids,
      kind: "resume_construct",
      planId: state.opening.plan.planId,
      demandId: null,
      lane: "supply_production",
      proposedTick: observation.tick,
      urgencyClass: 1,
      utility: 950,
      preconditions: [
        { kind: "actor_exists", actorId: builder.actorId },
        { kind: "actor_exists", actorId: site.actorId }
      ],
      claims: [
        { claimId: `${ids.claimId}:builder`, kind: "actor", actorId: builder.actorId },
        { claimId: `${ids.claimId}:site`, kind: "site", siteKey: `observed-site:${site.actorId}` },
        { claimId: `${ids.claimId}:effect`, kind: "effect", effectId: ids.effectId }
      ],
      reasonCode: "construction:resume_unassigned_site",
      actorIds: [builder.actorId],
      targetActorId: site.actorId
    };
  }
  const blocked = self.find(
    (actor) => blockedBuilders.has(actor.actorId) && !claimed.has(actor.actorId) && !reservedActorIds.has(actor.actorId)
  );
  if (blocked) {
    const ids = nextIds(state, `release-construction:${blocked.actorId}`, ordinal);
    return {
      ...ids,
      kind: "stop",
      planId: state.opening.plan.planId,
      demandId: null,
      lane: "supply_production",
      proposedTick: observation.tick,
      urgencyClass: 1,
      utility: 950,
      preconditions: [{ kind: "actor_exists", actorId: blocked.actorId }],
      claims: [{ claimId: `${ids.claimId}:builder`, kind: "actor", actorId: blocked.actorId }],
      reasonCode: "construction:release_unreachable_site",
      actorIds: [blocked.actorId]
    };
  }
  return null;
}

/** Reject known impossible routes, while leaving missing advisory topology to shared native validation. */
export function canReachAiConstructionSite(
  observation: AiObservation,
  catalog: AiCapabilityCatalog,
  builder: AiObservation["actors"][number],
  site: AiObservation["actors"][number]
): boolean {
  // A completed access graph often gives a structure's footprint its own isolated region.
  // For an already assigned job, the native Build order plus a worker at the footprint edge
  // is stronger evidence than a route query whose destination is the non-walkable structure.
  const activeOrder = builder.activeOrder?.status === "known" ? builder.activeOrder.value : null;
  const builderPosition = builder.logicalPosition.status === "known" ? builder.logicalPosition.value : null;
  const sitePosition = site.logicalPosition.status === "known" ? site.logicalPosition.value : null;
  if (
    activeOrder?.orderType === OrderType.Build &&
    activeOrder.targetActorId === site.actorId &&
    builderPosition &&
    sitePosition
  ) {
    const footprintRadius =
      catalog.entries.find((entry) => entry.sourceObjectName === site.objectName)?.constructionProfile
        ?.footprintRadiusTiles ?? 0;
    const buildReach = Math.max(1, footprintRadius + 1);
    const withinFootprintApproach =
      builderPosition.z === sitePosition.z &&
      Math.max(Math.abs(builderPosition.x - sitePosition.x), Math.abs(builderPosition.y - sitePosition.y)) <=
        buildReach;
    if (withinFootprintApproach) return true;
  }

  const approachRoute = sitePosition
    ? canReachAiConstructionPosition(observation, catalog, builder, site.objectName, sitePosition, site.actorId)
    : undefined;
  if (approachRoute !== undefined) return approachRoute;

  const from = node(builder);
  const to = node(site);
  if (!from || !to) return true;
  const product = observation.accessProducts.find(
    (entry) =>
      entry.fromNodeId === from &&
      entry.toNodeId === to &&
      entry.updatedTick >= Math.max(builder.observedTick, site.observedTick)
  );
  if (product?.status === "blocked" || product?.status === "service_failed") return false;
  const graph = observation.map?.accessGraph;
  if (!graph || graph.status !== "ready") return true;
  if (!graph.nodes.some((region) => region.nodeId === from) || !graph.nodes.some((region) => region.nodeId === to))
    return true;
  const result = queryAiAccessRoute(graph, {
    queryId: `query:construction:${builder.actorId}:${site.actorId}:${observation.generation}`,
    kind: "movement",
    fromNodeId: from,
    toNodeId: to,
    capabilities: routeCapability(observation, [builder], catalog),
    firingNodeIds: []
  });
  return result.kind === "direct" || result.kind === "pending";
}

/** Uses reachable build-edge cells when current topology provides enough evidence. */
export function canReachAiConstructionPosition(
  observation: AiObservation,
  catalog: AiCapabilityCatalog,
  builder: AiObservation["actors"][number],
  objectName: AiObservation["actors"][number]["objectName"],
  position: Vector3Simple,
  subjectId: string
): boolean | undefined {
  const approachNodes = constructionApproachNodes(observation, catalog, objectName, position);
  const from = node(builder);
  const graph = observation.map?.accessGraph;
  if (
    !approachNodes.length ||
    !from ||
    graph?.status !== "ready" ||
    !graph.nodes.some((region) => region.nodeId === from)
  )
    return undefined;
  const capabilities = routeCapability(observation, [builder], catalog);
  const results = approachNodes.map((to, index) =>
    queryAiAccessRoute(graph, {
      queryId: `query:construction:${builder.actorId}:${subjectId}:${observation.generation}:${index}`,
      kind: "movement",
      fromNodeId: from,
      toNodeId: to,
      capabilities,
      firingNodeIds: []
    })
  );
  return results.some((result) => result.kind === "direct" || result.kind === "pending");
}

/** Native builders route to a passable tile beside a footprint, never to the building's own region. */
function constructionApproachNodes(
  observation: AiObservation,
  catalog: AiCapabilityCatalog,
  objectName: AiObservation["actors"][number]["objectName"],
  position: Vector3Simple
): AiAccessNodeId[] {
  const footprintRadius =
    catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile?.footprintRadiusTiles ??
    0;
  const buildReach = Math.max(1, footprintRadius + 1);
  return [
    ...new Set(
      (observation.map?.constructionCells ?? [])
        .filter((cell) => {
          const dx = Math.abs(cell.position.x - position.x);
          const dy = Math.abs(cell.position.y - position.y);
          return (
            cell.position.z === position.z &&
            Math.max(dx, dy) <= buildReach &&
            (dx > footprintRadius || dy > footprintRadius) &&
            cell.groundPassable &&
            !cell.observedBlocked &&
            cell.groundAccessNodeId !== undefined
          );
        })
        .map((cell) => cell.groundAccessNodeId!)
    )
  ].sort();
}

/** Unknown locations sort last without inventing native reachability. */
function distance(actor: AiObservation["actors"][number], target: AiObservation["actors"][number]): number {
  if (actor.logicalPosition.status !== "known" || target.logicalPosition.status !== "known")
    return Number.MAX_SAFE_INTEGER;
  return (
    Math.abs(actor.logicalPosition.value.x - target.logicalPosition.value.x) +
    Math.abs(actor.logicalPosition.value.y - target.logicalPosition.value.y)
  );
}
