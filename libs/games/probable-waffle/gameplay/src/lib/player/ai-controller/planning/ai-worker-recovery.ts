import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";

/** Maintains the current workforce after an opening checkpoint has completed without reopening historical steps. */
export function proposeAiWorkerRecovery(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  workerObjectName: ObjectNames,
  desired: number
): { readonly demand: AiDemandV1; readonly intent: AiIntentV1 | null } {
  const owned = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const workers = owned.filter((actor) =>
    catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
  );
  const queues = owned.flatMap((actor) =>
    actor.queue.status === "known"
      ? (actor.queue.value.items ?? [])
          .filter((item) => item.kind === "production" && item.objectName === workerObjectName)
          .map((item) => item.itemId)
      : []
  );
  const rawAccepted = state.reservations
    .map((reservation) => reservation.subjectKey)
    .filter((key): key is string => key?.startsWith("effect:effect:worker-recovery:") === true)
    .map((key) => key.slice("effect:".length) as AiIntentV1["effectId"])
    .sort();
  const accepted = rawAccepted.slice(0, Math.max(0, desired - workers.length - queues.length));
  const demandId = "demand:economy:worker-floor" as AiDemandV1["demandId"];
  const demand: AiDemandV1 = {
    demandId,
    purpose: "sustain_worker_economy",
    capabilityOrRole: workerObjectName,
    unit: "actor_count",
    desired,
    satisfiedActorIds: workers.map((actor) => actor.actorId).sort(),
    queuedIds: queues.sort(),
    constructingIds: [],
    acceptedNotObservedEffectIds: accepted,
    preferredObjectNames: [workerObjectName],
    resourceObligations: {}
  };
  if (workers.length + queues.length + accepted.length >= desired) return { demand, intent: null };
  const producer = owned
    .filter((actor) => actor.queue.status !== "known" || actor.queue.value.occupied < actor.queue.value.capacity)
    .sort((left, right) => left.actorId.localeCompare(right.actorId))
    .find((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.produces.includes(workerObjectName)
      )
    );
  if (!producer) return { demand, intent: null };
  const resourceCost =
    catalog.entries.find((entry) => entry.sourceObjectName === workerObjectName)?.constructionProfile?.resourceCost ??
    {};
  if (
    Object.entries(resourceCost).some(([type, amount]) => {
      const resource = observation.resources.find((entry) => entry.resourceType === type);
      return (
        (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0) < (amount ?? 0)
      );
    })
  )
    return { demand, intent: null };
  const suffix = `${state.scheduler.decisionSequence}:${producer.actorId}`;
  const intentId = `intent:worker-recovery:${suffix}` as AiIntentV1["intentId"];
  const effectId = `effect:worker-recovery:${suffix}` as AiIntentV1["effectId"];
  const claimId = `claim:worker-recovery:${suffix}` as AiIntentV1["claims"][number]["claimId"];
  const resourceClaims = Object.entries(resourceCost)
    .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceType, amount]) => ({
      claimId: `${claimId}:${resourceType}` as AiIntentV1["claims"][number]["claimId"],
      kind: "resource" as const,
      resourceType,
      amount
    }));
  return {
    demand,
    intent: {
      kind: "produce",
      intentId,
      effectId,
      planId: state.opening.plan.planId,
      demandId,
      lane: "essential_economy",
      proposedTick: observation.tick,
      urgencyClass: 0,
      utility: 990,
      preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
      claims: [
        { claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
        ...resourceClaims,
        { claimId: `${claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId }
      ],
      reasonCode: `worker_recovery:${workers.length}/${desired}`,
      producerId: producer.actorId,
      objectName: workerObjectName
    }
  };
}
