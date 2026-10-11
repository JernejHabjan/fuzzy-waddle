import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { nextIds } from "./ai-macro-effect-identity";
import { claimedActorIds } from "./ai-macro-observation";

/** Assigns one free farmer without stealing cargo or a Field's returning worker. */
export function proposeAiFieldLabor(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  self: readonly AiObservationV1["actors"][number][],
  readyFoodSources: readonly AiObservationV1["actors"][number][],
  foodPrerequisiteObject: ObjectNames | undefined,
  reservedActorIds: ReadonlySet<string>,
  priorIntents: readonly AiIntentV1[],
  ordinal: number
): AiIntentV1 | null {
  const staffedFoodSourceIds = new Set(
    self.flatMap((actor) => {
      const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      return order?.orderType === OrderType.Gather && order.targetActorId ? [order.targetActorId] : [];
    })
  );
  // A returning food worker will automatically resume its Field after delivery. Its transient order does not
  // expose the source identity, so defer new Field assignments until all such workers resume gathering.
  const returningWorkerCount = self.filter((actor) => {
    const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
    if (order?.orderType !== OrderType.ReturnResources) return false;
    if (actor.resourceState.status === "known") return actor.resourceState.value.resourceType === ResourceType.Food;
    // Main buildings can accept food too. With unavailable cargo/source identity, preserve the returning assignment
    // until it resumes rather than staffing its apparently empty Field with a worker needed by another resource.
    return self.some(
      (target) =>
        target.actorId === order.targetActorId &&
        (target.objectName === foodPrerequisiteObject ||
          target.objectName === ObjectNames.Granary ||
          catalog.entries.some(
            (entry) =>
              entry.sourceObjectName === target.objectName && entry.acceptsResources?.includes(ResourceType.Food)
          ))
    );
  }).length;
  const unstaffedFoodSource =
    returningWorkerCount === 0
      ? readyFoodSources.find((source) => !staffedFoodSourceIds.has(source.actorId))
      : undefined;
  if (!unstaffedFoodSource) return null;
  const alreadyClaimed = claimedActorIds(priorIntents);
  const worker = self
    .filter((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.gathers.includes(ResourceType.Food)
      )
    )
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
    .filter((actor) => {
      const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      // Returning food is part of the Field's durable labor assignment. Replacing
      // that order strands the carried food and causes every decision to bounce a
      // worker between otherwise healthy Fields.
      return (
        order === null ||
        (order.orderType === OrderType.Gather &&
          (order.targetActorId === null || !readyFoodSources.some((source) => source.actorId === order.targetActorId)))
      );
    })
    .sort((left, right) => {
      const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 0 : 1;
      const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 0 : 1;
      return leftIdle - rightIdle || left.actorId.localeCompare(right.actorId);
    })[0];
  if (!worker) return null;
  const next = nextIds(state, "food-labor", ordinal);
  return {
    ...next,
    kind: "assign_gatherers",
    planId: state.opening.plan.planId,
    demandId: "demand:economy:sustainable-food" as AiDemandV1["demandId"],
    lane: "essential_economy",
    proposedTick: observation.tick,
    urgencyClass: 1,
    utility: 900,
    preconditions: [
      { kind: "actor_exists", actorId: worker.actorId },
      { kind: "actor_exists", actorId: unstaffedFoodSource.actorId }
    ],
    claims: [
      { claimId: next.claimId, kind: "actor", actorId: worker.actorId },
      {
        claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode: `food_labor:source=${unstaffedFoodSource.actorId}`,
    actorIds: [worker.actorId],
    resourceType: ResourceType.Food,
    sourceActorId: unstaffedFoodSource.actorId
  };
}
