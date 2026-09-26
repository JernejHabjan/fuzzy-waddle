import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessTransferPointV1, AiRouteResultV1 } from "../contracts/ai-access-graph-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

export function aiTransportActorPosition(actor: AiObservedActorV1 | undefined): Vector3Simple | undefined {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : undefined;
}

export function isAiTransportActorNear(
  actor: AiObservedActorV1 | undefined,
  position: Vector3Simple,
  radius = 2
): boolean {
  const current = aiTransportActorPosition(actor);
  return current !== undefined && distance(current, position) <= radius;
}

/** Scores legal transfer pairs from permitted threat evidence, room and total travel. Higher is better. */
export function scoreAiTransportTransferV1(
  pickup: AiAccessTransferPointV1,
  landing: AiAccessTransferPointV1,
  observation: AiObservationV1,
  requiredClearance: number
): number {
  if (pickup.clearance < requiredClearance || landing.clearance < requiredClearance) return Number.MIN_SAFE_INTEGER;
  const visibleThreatPositions = observation.actors
    .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .map(aiTransportActorPosition)
    .filter((position): position is Vector3Simple => position !== undefined);
  const risk = visibleThreatPositions.reduce(
    (total, position) => total + (distance(position, landing.passengerPosition) <= 8 ? 200 : 0),
    0
  );
  const travel = distance(pickup.carrierPosition, landing.carrierPosition);
  return 1000 + Math.min(200, landing.clearance * 20) - risk - travel;
}

export function chooseAiTransportTransfers(
  route: Extract<AiRouteResultV1, { readonly kind: "water_transport" | "air_transport" }>,
  observation: AiObservationV1,
  requiredClearance: number,
  attempt: number
): { pickup: AiAccessTransferPointV1; landing: AiAccessTransferPointV1 } | undefined {
  const pairs = route.pickupCandidates
    .flatMap((pickup) => route.landingCandidates.map((landing) => ({ pickup, landing })))
    .map((pair) => ({
      ...pair,
      score: scoreAiTransportTransferV1(pair.pickup, pair.landing, observation, requiredClearance)
    }))
    .filter((pair) => pair.score !== Number.MIN_SAFE_INTEGER)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.pickup.transferId.localeCompare(right.pickup.transferId) ||
        left.landing.transferId.localeCompare(right.landing.transferId)
    );
  return pairs[attempt % Math.max(1, pairs.length)];
}

export function mobileAiTransportActors(
  observation: AiObservationV1,
  routeKind: "water_transport" | "air_transport",
  missionPassengerIds: ReadonlySet<ActorId>
): AiObservedActorV1[] {
  const requiredDomain = routeKind === "water_transport" ? "water" : "air";
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.containerState?.status === "known")
    .filter(
      (actor) =>
        actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.includes(requiredDomain)
    )
    .filter(
      (actor) =>
        actor.containerState?.status === "known" &&
        actor.containerState.value.passengerIds.every((passengerId) => missionPassengerIds.has(passengerId))
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

export function assignAiTransportSeats(
  transports: readonly AiObservedActorV1[],
  manifest: AiTransportPlanWithLifecycle["lifecycle"]["manifest"],
  requiredCapacity: number
): { transportIds: ActorId[]; assignments: { transportId: ActorId; passengerIds: ActorId[] }[]; capacity: number } {
  const selected: ActorId[] = [];
  const assignments: { transportId: ActorId; passengerIds: ActorId[] }[] = [];
  const remaining = [...manifest];
  let capacity = 0;
  for (const transport of transports) {
    if (capacity >= requiredCapacity || transport.containerState?.status !== "known") continue;
    const assignedMembers = remaining.filter(
      (member) =>
        transport.containerState?.status === "known" &&
        transport.containerState.value.passengerIds.includes(member.actorId)
    );
    for (const member of assignedMembers) remaining.splice(remaining.indexOf(member), 1);
    let assignedSeats = assignedMembers.reduce((total, member) => total + member.seats, 0);
    for (const passenger of [...remaining]) {
      if (assignedSeats + passenger.seats > transport.containerState.value.capacity) continue;
      assignedMembers.push(passenger);
      assignedSeats += passenger.seats;
      remaining.splice(remaining.indexOf(passenger), 1);
    }
    if (!assignedMembers.length) continue;
    selected.push(transport.actorId);
    assignments.push({
      transportId: transport.actorId,
      passengerIds: assignedMembers.map((member) => member.actorId).sort()
    });
    capacity += assignedSeats;
  }
  return { transportIds: selected, assignments, capacity };
}
