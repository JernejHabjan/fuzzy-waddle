import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRouteCapability } from "../contracts/ai-access-graph";
import type {
  AiBrainState,
  AiKnowledgeState,
  AiSkirmishState,
  AiThreatIncident
} from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiAccessNodeId, AiPlanId } from "../contracts/ai-core-types";
import type { AiIntent } from "../contracts/ai-intent";
import type { AiDomain, AiObservation, AiObservedActor } from "../contracts/ai-observation";

const MAX_TIMELINE_ENTRIES = 128;

export function position(actor: AiObservedActor | undefined): Vector3Simple | undefined {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : undefined;
}

export function node(actor: AiObservedActor | undefined): AiAccessNodeId | undefined {
  return actor?.accessNodeId.status === "known" ? actor.accessNodeId.value : undefined;
}

export function domains(actor: AiObservedActor): readonly AiDomain[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
}

export function targetDomains(actor: AiObservedActor): readonly AiDomain[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.targetDomains))].sort();
}

export function canFight(actor: AiObservedActor): boolean {
  return actor.housingCost.status === "known" && actor.housingCost.value > 0 && targetDomains(actor).length > 0;
}

/** Both sides of the domain check are required: a ranged ground unit is not anti-air by name alone. */
export function canTarget(attacker: AiObservedActor, target: AiObservedActor): boolean {
  const supported = new Set(targetDomains(attacker));
  const targetMovementDomains = domains(target);
  const effectiveTargetDomains: readonly AiDomain[] =
    targetMovementDomains.length > 0 ? targetMovementDomains : ["ground"];
  return effectiveTargetDomains.some((domain) => supported.has(domain));
}

export function ownedCombat(observation: AiObservation, catalog: AiCapabilityCatalog): AiObservedActor[] {
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
    .sort((left, right) => {
      const leftPosition = position(left);
      const rightPosition = position(right);
      return (
        (leftPosition?.x ?? Number.POSITIVE_INFINITY) - (rightPosition?.x ?? Number.POSITIVE_INFINITY) ||
        (leftPosition?.y ?? Number.POSITIVE_INFINITY) - (rightPosition?.y ?? Number.POSITIVE_INFINITY) ||
        (leftPosition?.z ?? Number.POSITIVE_INFINITY) - (rightPosition?.z ?? Number.POSITIVE_INFINITY) ||
        left.actorId.localeCompare(right.actorId)
      );
    });
}

export function hostileContacts(observation: AiObservation): AiObservedActor[] {
  return observation.actors
    .filter((actor) => actor.relation === "enemy")
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

export function regionId(actor: AiObservedActor): string | null {
  return node(actor) ?? null;
}

export function incidentKind(actor: AiObservedActor): AiThreatIncident["kind"] {
  const movement = domains(actor);
  if (movement.includes("air")) return "flyer";
  if (movement.includes("water")) return actor.containerState?.status === "known" ? "transport_landing" : "naval";
  if (canFight(actor)) return "army_pressure";
  if (actor.housingCost.status === "known" && actor.housingCost.value > 0) return "worker_harassment";
  return "unknown";
}

export function baseId(state: AiBrainState): `base:${string}` {
  return state.bases.find((base) => base.active)?.baseId ?? "base:home";
}

export function homeActor(observation: AiObservation): AiObservedActor | undefined {
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .sort((left, right) => {
      const leftMain = left.mainBuilding?.status === "known" && left.mainBuilding.value ? 0 : 1;
      const rightMain = right.mainBuilding?.status === "known" && right.mainBuilding.value ? 0 : 1;
      return leftMain - rightMain || left.actorId.localeCompare(right.actorId);
    })[0];
}

export function homePosition(observation: AiObservation): Vector3Simple | undefined {
  return position(homeActor(observation));
}

export function homeNode(observation: AiObservation): AiAccessNodeId | undefined {
  return node(homeActor(observation));
}

export function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

export function intentBase(
  state: AiBrainState,
  planId: AiPlanId,
  tick: number,
  suffix: string,
  lane: AiIntent["lane"],
  utility: number
) {
  const ordinal = state.scheduler.decisionSequence;
  return {
    intentId: `intent:stage9:${ordinal}:${suffix}` as AiIntent["intentId"],
    effectId: `effect:stage9:${ordinal}:${suffix}` as AiIntent["effectId"],
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
  current: AiSkirmishState,
  tick: number,
  kind: AiSkirmishState["timeline"][number]["kind"],
  subjectId: string,
  detail: string
): AiSkirmishState {
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
  observation: AiObservation,
  catalog: AiCapabilityCatalog,
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
  observation: AiObservation,
  members: readonly AiObservedActor[],
  catalog: AiCapabilityCatalog
): AiRouteCapability {
  const transports = observation.actors.filter(
    (actor) => actor.relation === "self" && actor.containerState?.status === "known"
  );
  const seats = (domain: AiDomain) =>
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
  observation: AiObservation,
  knowledge: AiKnowledgeState
): AiKnowledgeState["questions"][number] | undefined {
  if (observation.map?.scoutSearchPoints) {
    const point = [...observation.map.scoutSearchPoints]
      .sort((left, right) => left.pointId.localeCompare(right.pointId))
      .find(
        (point) =>
          !point.observed &&
          !knowledge.questions.some(
            (question) => question.kind === `explore:${point.pointId}` && question.state === "answered"
          )
      );
    if (!point) return undefined;
    const questionId = `question:${point.pointId}` as AiKnowledgeState["questions"][number]["questionId"];
    return (
      knowledge.questions.find((question) => question.questionId === questionId) ?? {
        questionId,
        kind: `explore:${point.pointId}`,
        createdTick: observation.tick,
        state: "open"
      }
    );
  }
  const covered = new Set(observation.map?.scoutCoverageAccessNodeIds ?? []);
  const frontier = [...(observation.map?.frontierAccessNodeIds ?? [])]
    .filter(
      (candidate) =>
        !covered.has(candidate) &&
        !knowledge.questions.some(
          (question) => question.kind === `safe_route:${candidate}` && question.state === "answered"
        )
    )
    .sort()[0];
  if (!frontier) return undefined;
  const questionId = `question:frontier:${frontier}` as AiKnowledgeState["questions"][number]["questionId"];
  return (
    knowledge.questions.find((question) => question.questionId === questionId) ?? {
      questionId,
      kind: `safe_route:${frontier}`,
      createdTick: observation.tick,
      state: "open"
    }
  );
}
