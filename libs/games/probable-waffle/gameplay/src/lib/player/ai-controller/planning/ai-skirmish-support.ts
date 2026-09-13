import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRouteCapabilityV1 } from "../contracts/ai-access-graph-v1";
import type {
  AiBrainStateV1,
  AiKnowledgeStateV1,
  AiSkirmishStateV1,
  AiThreatIncidentV1
} from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiAccessNodeId, AiPlanId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiDomainV1, AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";

const MAX_TIMELINE_ENTRIES = 128;

export function position(actor: AiObservedActorV1 | undefined): Vector3Simple | undefined {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : undefined;
}

export function node(actor: AiObservedActorV1 | undefined): AiAccessNodeId | undefined {
  return actor?.accessNodeId.status === "known" ? actor.accessNodeId.value : undefined;
}

export function domains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
}

export function targetDomains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.targetDomains))].sort();
}

export function canFight(actor: AiObservedActorV1): boolean {
  return actor.housingCost.status === "known" && actor.housingCost.value > 0 && targetDomains(actor).length > 0;
}

/** Both sides of the domain check are required: a ranged ground unit is not anti-air by name alone. */
export function canTarget(attacker: AiObservedActorV1, target: AiObservedActorV1): boolean {
  const supported = new Set(targetDomains(attacker));
  const targetMovementDomains = domains(target);
  const effectiveTargetDomains: readonly AiDomainV1[] =
    targetMovementDomains.length > 0 ? targetMovementDomains : ["ground"];
  return effectiveTargetDomains.some((domain) => supported.has(domain));
}

export function ownedCombat(observation: AiObservationV1, catalog: AiCapabilityCatalogV1): AiObservedActorV1[] {
  return observation.actors
    .filter(
      (actor) =>
        actor.relation === "self" &&
        actor.visibility === "owned" &&
        (actor.containedInActorId === undefined || actor.containedInActorId === null)
    )
    .filter(canFight)
    .filter(
      (actor) =>
        !catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

export function hostileContacts(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors
    .filter((actor) => actor.relation === "enemy")
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

export function regionId(actor: AiObservedActorV1): string | null {
  return node(actor) ?? null;
}

export function incidentKind(actor: AiObservedActorV1): AiThreatIncidentV1["kind"] {
  const movement = domains(actor);
  if (movement.includes("air")) return "flyer";
  if (movement.includes("water")) return actor.containerState?.status === "known" ? "transport_landing" : "naval";
  if (canFight(actor)) return "army_pressure";
  if (actor.housingCost.status === "known" && actor.housingCost.value > 0) return "worker_harassment";
  return "unknown";
}

export function baseId(state: AiBrainStateV1): `base:${string}` {
  return state.bases.find((base) => base.active)?.baseId ?? "base:home";
}

export function homeActor(observation: AiObservationV1): AiObservedActorV1 | undefined {
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .sort((left, right) => {
      const leftMain = left.mainBuilding?.status === "known" && left.mainBuilding.value ? 0 : 1;
      const rightMain = right.mainBuilding?.status === "known" && right.mainBuilding.value ? 0 : 1;
      return leftMain - rightMain || left.actorId.localeCompare(right.actorId);
    })[0];
}

export function homePosition(observation: AiObservationV1): Vector3Simple | undefined {
  return position(homeActor(observation));
}

export function homeNode(observation: AiObservationV1): AiAccessNodeId | undefined {
  return node(homeActor(observation));
}

export function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

export function intentBase(
  state: AiBrainStateV1,
  planId: AiPlanId,
  tick: number,
  suffix: string,
  lane: AiIntentV1["lane"],
  utility: number
) {
  const ordinal = state.scheduler.decisionSequence;
  return {
    intentId: `intent:stage9:${ordinal}:${suffix}` as AiIntentV1["intentId"],
    effectId: `effect:stage9:${ordinal}:${suffix}` as AiIntentV1["effectId"],
    planId,
    demandId: null,
    lane,
    proposedTick: tick,
    urgencyClass: lane === "army_threat" ? 1 : 4,
    utility,
    preconditions: [{ kind: "plan_active" as const, planId }],
    claims: [],
    reasonCode: `stage9:${suffix}`
  };
}

export function withTimeline(
  current: AiSkirmishStateV1,
  tick: number,
  kind: AiSkirmishStateV1["timeline"][number]["kind"],
  subjectId: string,
  detail: string
): AiSkirmishStateV1 {
  const eventId = `timeline:${tick}:${kind}:${subjectId}`;
  const event = { eventId, tick, kind, subjectId, detail } as const;
  return {
    ...current,
    timeline: [
      ...current.timeline.filter(
        (candidate) =>
          candidate.eventId !== eventId &&
          (candidate.kind !== kind || candidate.subjectId !== subjectId || candidate.detail !== detail)
      ),
      event
    ]
      .sort((left, right) => left.tick - right.tick || left.eventId.localeCompare(right.eventId))
      .slice(-MAX_TIMELINE_ENTRIES)
  };
}

function canProduceTransport(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  domain: "water" | "air"
): boolean {
  const carrierNames = new Set(
    catalog.entries
      .filter((entry) => entry.cargoCapacity !== null && entry.movementDomains.includes(domain))
      .map((entry) => entry.sourceObjectName)
  );
  return observation.actors.some(
    (actor) =>
      actor.relation === "self" &&
      actor.visibility === "owned" &&
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.produces.some((name) => carrierNames.has(name))
      )
  );
}

export function routeCapability(
  observation: AiObservationV1,
  members: readonly AiObservedActorV1[],
  catalog: AiCapabilityCatalogV1
): AiRouteCapabilityV1 {
  const transports = observation.actors.filter(
    (actor) => actor.relation === "self" && actor.containerState?.status === "known"
  );
  const seats = (domain: AiDomainV1) =>
    transports
      .filter(
        (actor) => actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.includes(domain)
      )
      .reduce(
        (total, actor) => total + (actor.containerState?.status === "known" ? actor.containerState.value.capacity : 0),
        0
      );
  return {
    moverDomains: [...new Set(members.flatMap(domains))].sort(),
    targetDomains: [...new Set(members.flatMap(targetDomains))].sort(),
    waterTransportSeats: seats("water"),
    airTransportSeats: seats("air"),
    canProduceWaterTransport: canProduceTransport(observation, catalog, "water"),
    canProduceAirTransport: canProduceTransport(observation, catalog, "air"),
    requiredPassengerSeats: Math.max(1, members.length),
    requiredClearance: 1
  };
}

export function nextQuestion(
  observation: AiObservationV1,
  knowledge: AiKnowledgeStateV1
): AiKnowledgeStateV1["questions"][number] | undefined {
  const covered = new Set(observation.map?.scoutCoverageAccessNodeIds ?? []);
  const frontier = [...(observation.map?.frontierAccessNodeIds ?? [])]
    .filter((candidate) => !covered.has(candidate))
    .sort()[0];
  if (!frontier) return undefined;
  const questionId = `question:frontier:${frontier}` as AiKnowledgeStateV1["questions"][number]["questionId"];
  return (
    knowledge.questions.find((question) => question.questionId === questionId) ?? {
      questionId,
      kind: `safe_route:${frontier}`,
      createdTick: observation.tick,
      state: "open"
    }
  );
}
