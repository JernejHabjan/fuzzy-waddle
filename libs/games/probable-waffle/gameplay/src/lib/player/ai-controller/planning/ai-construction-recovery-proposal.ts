import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { claimedActorIds, isAvailableBuilder, owned } from "./ai-macro-observation";
import { nextIds } from "./ai-macro-effect-identity";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { node, routeCapability } from "./ai-skirmish-support";

/** Repairs one abandoned worker-built site even after its original opening checkpoint has completed.
 * Existing sites retain their native payment/work; this proposal claims no construction resources.
 */
export function proposeAiConstructionRecovery(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  reservedActorIds: ReadonlySet<string>,
  priorIntents: readonly AiIntentV1[],
  ordinal: number
): AiIntentV1 | null {
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
      .filter((actor) => !claimed.has(actor.actorId) && !reservedActorIds.has(actor.actorId))
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
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  builder: AiObservationV1["actors"][number],
  site: AiObservationV1["actors"][number]
): boolean {
  const from = node(builder),
    to = node(site);
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
  const result = queryAiAccessRouteV1(graph, {
    queryId: `query:construction:${builder.actorId}:${site.actorId}:${observation.generation}`,
    kind: "movement",
    fromNodeId: from,
    toNodeId: to,
    capabilities: routeCapability(observation, [builder], catalog),
    firingNodeIds: []
  });
  return result.kind === "direct" || result.kind === "pending";
}

/** Unknown locations sort last without inventing native reachability. */
function distance(actor: AiObservationV1["actors"][number], target: AiObservationV1["actors"][number]): number {
  if (actor.logicalPosition.status !== "known" || target.logicalPosition.status !== "known")
    return Number.MAX_SAFE_INTEGER;
  return (
    Math.abs(actor.logicalPosition.value.x - target.logicalPosition.value.x) +
    Math.abs(actor.logicalPosition.value.y - target.logicalPosition.value.y)
  );
}
