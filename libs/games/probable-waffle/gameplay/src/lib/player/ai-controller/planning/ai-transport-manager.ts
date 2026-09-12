import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiAccessTransferPointV1, AiRouteRequestV1, AiRouteResultV1 } from "../contracts/ai-access-graph-v1";
import type { AiBrainStateV1, AiTransportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline, type AiTransportPlanId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";

export const AI_TRANSPORT_BOARDING_TIMEOUT_TICKS = 600;
export const AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE = 750;
const MAX_TRANSPORT_RECOVERY_ATTEMPTS = 3;
type AiTransportPlanWithLifecycle = AiTransportStateV1 & {
  readonly lifecycle: NonNullable<AiTransportStateV1["lifecycle"]>;
};

export interface CreateAiTransportPlanV1Input {
  readonly planId: AiTransportPlanId;
  readonly routeRequest: AiRouteRequestV1;
  readonly route: Extract<AiRouteResultV1, { readonly kind: "water_transport" | "air_transport" }>;
  readonly tick: number;
  readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
  readonly estimatedTravelTicks: number;
  readonly passengers: readonly {
    readonly actorId: ActorId;
    readonly role: "builder" | "protection" | "worker" | "combat" | "support";
    readonly seats?: number;
    readonly indispensable: boolean;
    readonly handoff: "economy" | "squad" | "support";
  }[];
  readonly escortIds?: readonly ActorId[];
}

/** Creates a save-safe mission; no live object or Promise crosses this boundary. */
export function createAiTransportPlanV1(input: CreateAiTransportPlanV1Input): AiTransportStateV1 {
  const manifest = [...input.passengers]
    .map((passenger) => ({ ...passenger, seats: passenger.seats ?? 1 }))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const requiredCapacity = manifest.reduce((total, passenger) => total + passenger.seats, 0);
  if (requiredCapacity <= 0 || !manifest.some((passenger) => passenger.indispensable)) {
    throw new Error("invalid_ai_transport_manifest");
  }
  if (
    input.missionKind === "island_establishment" &&
    (!manifest.some((passenger) => passenger.role === "builder" && passenger.indispensable) ||
      !manifest.some((passenger) => passenger.role === "protection" && passenger.indispensable))
  ) {
    throw new Error("invalid_ai_island_establishment_manifest");
  }
  return {
    planId: input.planId,
    phase: "proposed",
    passengerIds: manifest.map((passenger) => passenger.actorId),
    transportIds: [],
    queryIds: [input.routeRequest.queryId],
    lifecycle: {
      missionKind: input.missionKind,
      route: input.route,
      routeRequest: input.routeRequest,
      routeGeneration: input.route.graphGeneration,
      manifest,
      assignedTransportIds: [],
      seatAssignments: [],
      escortIds: [...(input.escortIds ?? [])].sort(),
      assignedCapacity: 0,
      requiredCapacity,
      departureCapacityPermille: AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE,
      pickupTransferId: null,
      landingTransferId: null,
      phaseDeadline: aiDeadline(input.tick + AI_TRANSPORT_BOARDING_TIMEOUT_TICKS),
      estimatedTravelTicks: Math.max(1, Math.floor(input.estimatedTravelTicks)),
      recoveryAttempt: 0,
      maxRecoveryAttempts: MAX_TRANSPORT_RECOVERY_ATTEMPTS,
      lastProgressTick: input.tick,
      pendingIntentIds: [],
      capacityDemand: null,
      terminalReason: null
    }
  };
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

function actorPosition(actor: AiObservedActorV1 | undefined): Vector3Simple | undefined {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : undefined;
}

function near(actor: AiObservedActorV1 | undefined, position: Vector3Simple, radius = 2): boolean {
  const current = actorPosition(actor);
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
    .map(actorPosition)
    .filter((position): position is Vector3Simple => position !== undefined);
  const risk = visibleThreatPositions.reduce(
    (total, position) => total + (distance(position, landing.passengerPosition) <= 8 ? 200 : 0),
    0
  );
  const travel = distance(pickup.carrierPosition, landing.carrierPosition);
  return 1000 + Math.min(200, landing.clearance * 20) - risk - travel;
}

function chooseTransfers(
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

function mobileTransportActors(
  observation: AiObservationV1,
  routeKind: "water_transport" | "air_transport",
  missionPassengerIds: ReadonlySet<ActorId>
) {
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

function assignSeats(
  transports: readonly AiObservedActorV1[],
  manifest: AiTransportPlanWithLifecycle["lifecycle"]["manifest"],
  requiredCapacity: number
): { transportIds: ActorId[]; assignments: { transportId: ActorId; passengerIds: ActorId[] }[]; capacity: number } {
  const selected: ActorId[] = [];
  const assignments: { transportId: ActorId; passengerIds: ActorId[] }[] = [];
  const remaining = [...manifest];
  let capacity = 0;
  for (const transport of transports) {
    if (capacity >= requiredCapacity) break;
    if (transport.containerState?.status !== "known") continue;
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

function capacityDemand(plan: AiTransportPlanWithLifecycle, preferredObjectNames: readonly ObjectNames[]): AiDemandV1 {
  const lifecycle = plan.lifecycle;
  return {
    demandId: `demand:transport:${plan.planId}`,
    purpose: `transport_capacity:${plan.planId}`,
    capabilityOrRole: lifecycle.route.kind === "water_transport" ? "water_transport" : "air_transport",
    unit: "cargo_seats",
    desired: lifecycle.requiredCapacity,
    satisfiedActorIds: lifecycle.assignedTransportIds,
    queuedIds: [],
    constructingIds: [],
    acceptedNotObservedEffectIds: [],
    preferredObjectNames: [...preferredObjectNames].sort(),
    resourceObligations: {}
  };
}

function intentBase(plan: AiTransportPlanWithLifecycle, tick: number, suffix: string) {
  const attempt = `r${plan.lifecycle.recoveryAttempt}`;
  return {
    intentId: `intent:${plan.planId}:${attempt}:${suffix}` as const,
    effectId: `effect:${plan.planId}:${attempt}:${suffix}` as const,
    planId: `plan:${plan.planId}` as const,
    demandId: plan.lifecycle.capacityDemand?.demandId ?? null,
    lane: "army_threat" as const,
    proposedTick: tick,
    urgencyClass: 4,
    utility: 650,
    preconditions: [{ kind: "plan_active" as const, planId: `plan:${plan.planId}` as const }],
    reasonCode: `transport_${plan.phase}`
  };
}

function hasNonTerminalOutcome(state: AiBrainStateV1, intentId: string): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      outcome.identity.intentId === intentId &&
      (outcome.kind === "dispatched" || outcome.kind === "applied" || outcome.kind === "active")
  );
}

function hasFailedOutcome(state: AiBrainStateV1, intentIds: readonly string[]): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      intentIds.includes(outcome.identity.intentId) &&
      (outcome.kind === "rejected" || outcome.kind === "cancelled" || outcome.kind === "failed")
  );
}

function withPhase(
  plan: AiTransportPlanWithLifecycle,
  phase: AiTransportStateV1["phase"],
  tick: number,
  duration: number,
  changes: Partial<NonNullable<AiTransportStateV1["lifecycle"]>> = {}
): AiTransportPlanWithLifecycle {
  const lifecycle = plan.lifecycle;
  return {
    ...plan,
    phase,
    lifecycle: {
      ...lifecycle,
      ...changes,
      phaseDeadline: aiDeadline(tick + duration),
      lastProgressTick: tick,
      pendingIntentIds: []
    }
  };
}

/** Advances saved transport operations and emits only shared command intents. */
export class AiTransportManager implements AiProposalManagerV1 {
  readonly managerId = "stage8.transport";

  constructor(private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const graph = observation.map?.accessGraph;
    const candidateCatalog = this.getCatalog();
    const catalog = candidateCatalog?.generation === observation.generation ? candidateCatalog : undefined;
    const intents: AiIntentV1[] = [];
    const reasons: string[] = [];
    const occupiedActors = new Set<ActorId>();
    const occupiedTransfers = new Set<string>();
    const occupiedDestinations = new Set<string>();
    const transport = [...state.transport]
      .sort((left, right) => left.planId.localeCompare(right.planId))
      .map((original) => {
        const intentStart = intents.length;
        if (!original.lifecycle || ["completed", "cancelled", "failed"].includes(original.phase)) return original;
        let plan: AiTransportPlanWithLifecycle = { ...original, lifecycle: original.lifecycle };
        if (plan.phase === "handoff") {
          return withPhase({ ...plan, passengerIds: [], transportIds: [] }, "completed", observation.tick, 1, {
            assignedTransportIds: [],
            seatAssignments: [],
            assignedCapacity: 0,
            terminalReason: "handoff_complete"
          });
        }
        const lifecycle = plan.lifecycle;
        const transferSlot = (id: string | null) =>
          id ? `${id}:${Math.floor(lifecycle.phaseDeadline.dueTick / 200)}` : null;
        const pickupSlot = transferSlot(lifecycle.pickupTransferId);
        const landingSlot = transferSlot(lifecycle.landingTransferId);
        const conflicts = [
          ...lifecycle.manifest.map((member) => member.actorId),
          ...lifecycle.assignedTransportIds,
          ...lifecycle.escortIds
        ].some((actorId) => occupiedActors.has(actorId));
        if (
          conflicts ||
          [pickupSlot, landingSlot].some((id) => id && occupiedTransfers.has(id)) ||
          occupiedDestinations.has(lifecycle.route.destinationNodeId)
        ) {
          return withPhase(plan, "cancelled", observation.tick, 1, { terminalReason: "transport_ownership_conflict" });
        }
        lifecycle.manifest.forEach((member) => occupiedActors.add(member.actorId));
        lifecycle.assignedTransportIds.forEach((actorId) => occupiedActors.add(actorId));
        lifecycle.escortIds.forEach((actorId) => occupiedActors.add(actorId));
        if (pickupSlot) occupiedTransfers.add(pickupSlot);
        if (landingSlot) occupiedTransfers.add(landingSlot);
        occupiedDestinations.add(lifecycle.route.destinationNodeId);

        const observedActorIds = new Set(observation.actors.map((actor) => actor.actorId));
        const missingIndispensable = plan.lifecycle.manifest.some(
          (member) => member.indispensable && !observedActorIds.has(member.actorId)
        );
        const aliveManifest = plan.lifecycle.manifest.filter(
          (member) => member.indispensable || observedActorIds.has(member.actorId)
        );
        if (!missingIndispensable && aliveManifest.length !== plan.lifecycle.manifest.length) {
          const aliveIds = new Set(aliveManifest.map((member) => member.actorId));
          plan = {
            ...plan,
            passengerIds: aliveManifest.map((member) => member.actorId),
            lifecycle: {
              ...plan.lifecycle,
              manifest: aliveManifest,
              requiredCapacity: aliveManifest.reduce((sum, member) => sum + member.seats, 0),
              seatAssignments: plan.lifecycle.seatAssignments.map((assignment) => ({
                ...assignment,
                passengerIds: assignment.passengerIds.filter((actorId) => aliveIds.has(actorId))
              }))
            }
          };
        }

        const missionAlreadyArrived = plan.lifecycle.manifest.every((member) => {
          const actor = observation.actors.find((candidate) => candidate.actorId === member.actorId);
          if (!actor) return false;
          return (
            actor.containedInActorId === null &&
            actor.accessNodeId.status === "known" &&
            actor.accessNodeId.value === plan.lifecycle.route.destinationNodeId
          );
        });
        if (missionAlreadyArrived && !["handoff", "completed"].includes(plan.phase)) {
          return withPhase(plan, "handoff", observation.tick, 1, { terminalReason: "cargo_survived_at_destination" });
        }

        if (hasFailedOutcome(state, lifecycle.pendingIntentIds)) {
          plan = withPhase(plan, "recovering", observation.tick, 200, { terminalReason: "shared_command_failed" });
        }
        const indispensableMissing = missingIndispensable;
        const transportMissing = plan.lifecycle.assignedTransportIds.some(
          (actorId) => !observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self")
        );
        if (indispensableMissing || transportMissing || observation.tick >= plan.lifecycle.phaseDeadline.dueTick) {
          plan = withPhase(plan, "recovering", observation.tick, 200, {
            terminalReason: indispensableMissing
              ? "indispensable_passenger_lost"
              : transportMissing
                ? "transport_lost"
                : "phase_timeout"
          });
        }
        if (plan.phase === "recovering") {
          if (!graph || graph.status !== "ready") {
            if (observation.tick < plan.lifecycle.phaseDeadline.dueTick) return plan;
            const pendingAttempt = plan.lifecycle.recoveryAttempt + 1;
            if (pendingAttempt > plan.lifecycle.maxRecoveryAttempts) {
              return withPhase(plan, "cancelled", observation.tick, 1, {
                assignedTransportIds: [],
                seatAssignments: [],
                assignedCapacity: 0,
                terminalReason: "route_pending_exhausted"
              });
            }
            return withPhase(plan, "recovering", observation.tick, 200, {
              recoveryAttempt: pendingAttempt,
              terminalReason: "route_pending"
            });
          }
          const route = queryAiAccessRouteV1(graph, plan.lifecycle.routeRequest);
          if (route.kind === "pending") {
            if (observation.tick < plan.lifecycle.phaseDeadline.dueTick) return plan;
            const pendingAttempt = plan.lifecycle.recoveryAttempt + 1;
            if (pendingAttempt > plan.lifecycle.maxRecoveryAttempts) {
              return withPhase(plan, "cancelled", observation.tick, 1, { terminalReason: "route_pending_exhausted" });
            }
            return withPhase(plan, "recovering", observation.tick, 200, {
              recoveryAttempt: pendingAttempt,
              terminalReason: `route_${route.reason}`
            });
          }
          const attempt = plan.lifecycle.recoveryAttempt + 1;
          if (attempt > plan.lifecycle.maxRecoveryAttempts) {
            return withPhase(plan, "cancelled", observation.tick, 1, {
              assignedTransportIds: [],
              seatAssignments: [],
              assignedCapacity: 0,
              terminalReason: plan.lifecycle.terminalReason ?? "recovery_exhausted"
            });
          }
          if (route.kind !== "water_transport" && route.kind !== "air_transport") {
            return withPhase(plan, "cancelled", observation.tick, 200, {
              recoveryAttempt: attempt,
              terminalReason: `route_${route.kind}`
            });
          }
          plan = withPhase(plan, "reserving", observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS, {
            route,
            routeGeneration: route.graphGeneration,
            recoveryAttempt: attempt,
            assignedTransportIds: [],
            seatAssignments: [],
            assignedCapacity: 0,
            pickupTransferId: null,
            landingTransferId: null,
            terminalReason: null
          });
        }
        if (plan.phase === "proposed") {
          return withPhase(plan, "reserving", observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
        }
        if (plan.phase === "reserving") {
          const route = plan.lifecycle.route;
          if (route.kind !== "water_transport" && route.kind !== "air_transport") {
            return withPhase(plan, "cancelled", observation.tick, 200, { terminalReason: `route_${route.kind}` });
          }
          const candidates = mobileTransportActors(observation, route.kind, new Set(plan.passengerIds));
          const assigned = assignSeats(candidates, plan.lifecycle.manifest, plan.lifecycle.requiredCapacity);
          const transportEntries =
            catalog?.entries
              .filter(
                (entry) =>
                  entry.cargoCapacity !== null &&
                  entry.movementDomains.includes(plan.lifecycle.route.kind === "water_transport" ? "water" : "air")
              )
              .sort((left, right) => left.sourceObjectName.localeCompare(right.sourceObjectName)) ?? [];
          const demand = capacityDemand(
            plan,
            transportEntries.map((entry) => entry.sourceObjectName)
          );
          if (assigned.capacity < plan.lifecycle.requiredCapacity) {
            const option = transportEntries[0];
            const producer = option
              ? observation.actors
                  .filter((actor) => actor.relation === "self" && actor.queue.status === "known")
                  .find((actor) =>
                    catalog?.entries.some(
                      (entry) =>
                        entry.sourceObjectName === actor.objectName && entry.produces.includes(option.sourceObjectName)
                    )
                  )
              : undefined;
            if (option && producer) {
              const suffix = `capacity:${option.sourceObjectName}`;
              const base = intentBase(plan, observation.tick, suffix);
              if (!hasNonTerminalOutcome(state, base.intentId)) {
                intents.push({
                  ...base,
                  kind: "produce",
                  producerId: producer.actorId,
                  objectName: option.sourceObjectName,
                  demandId: demand.demandId,
                  preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
                  claims: [
                    {
                      claimId: `claim:${plan.planId}:capacity:${producer.actorId}`,
                      kind: "production_slot",
                      producerId: producer.actorId,
                      slot: 0
                    },
                    { claimId: `claim:${plan.planId}:capacity-effect`, kind: "effect", effectId: base.effectId }
                  ]
                });
              }
            }
            reasons.push(
              `transport_capacity_wait:${plan.planId}:${assigned.capacity}/${plan.lifecycle.requiredCapacity}`
            );
            return {
              ...plan,
              transportIds: assigned.transportIds,
              lifecycle: {
                ...plan.lifecycle,
                capacityDemand: demand,
                assignedCapacity: assigned.capacity,
                assignedTransportIds: assigned.transportIds,
                seatAssignments: assigned.assignments
              }
            };
          }
          const transfers = chooseTransfers(
            route,
            observation,
            plan.lifecycle.routeRequest.capabilities.requiredClearance,
            plan.lifecycle.recoveryAttempt
          );
          if (!transfers)
            return withPhase(plan, "recovering", observation.tick, 200, { terminalReason: "no_safe_transfer" });
          return withPhase(
            { ...plan, transportIds: assigned.transportIds },
            "gather",
            observation.tick,
            AI_TRANSPORT_BOARDING_TIMEOUT_TICKS,
            {
              assignedTransportIds: assigned.transportIds,
              seatAssignments: assigned.assignments,
              assignedCapacity: assigned.capacity,
              capacityDemand: { ...demand, satisfiedActorIds: assigned.transportIds },
              pickupTransferId: transfers.pickup.transferId,
              landingTransferId: transfers.landing.transferId
            }
          );
        }
        const route = plan.lifecycle.route;
        if (route.kind !== "water_transport" && route.kind !== "air_transport") {
          return withPhase(plan, "failed", observation.tick, 1, { terminalReason: "invalid_transport_route" });
        }
        if (!graph || graph.status !== "ready" || graph.generation !== plan.lifecycle.routeGeneration) {
          return withPhase(plan, "recovering", observation.tick, 200, {
            terminalReason: "route_generation_invalidated"
          });
        }
        const pickup = route.pickupCandidates.find((point) => point.transferId === plan.lifecycle.pickupTransferId);
        const landing = route.landingCandidates.find((point) => point.transferId === plan.lifecycle.landingTransferId);
        if (!pickup || !landing)
          return withPhase(plan, "recovering", observation.tick, 200, { terminalReason: "transfer_invalidated" });
        const actors = new Map(observation.actors.map((actor) => [actor.actorId, actor] as const));
        if (["gather", "rendezvous", "boarding"].includes(plan.phase)) {
          const invalidCarrier = plan.lifecycle.assignedTransportIds.some((actorId) => {
            const container = actors.get(actorId)?.containerState;
            const assignedPassengerIds =
              plan.lifecycle.seatAssignments.find((assignment) => assignment.transportId === actorId)?.passengerIds ??
              [];
            const assignedSeats = plan.lifecycle.manifest
              .filter((member) => assignedPassengerIds.includes(member.actorId))
              .reduce((total, member) => total + member.seats, 0);
            return (
              container?.status !== "known" ||
              container.value.capacity < assignedSeats ||
              container.value.passengerIds.some((passengerId) => !plan.passengerIds.includes(passengerId))
            );
          });
          if (invalidCarrier) {
            return withPhase(plan, "recovering", observation.tick, 200, {
              terminalReason: "carrier_capacity_or_ownership_changed"
            });
          }
        }
        if (plan.phase === "gather") {
          const waiting = plan.passengerIds.filter((actorId) => !near(actors.get(actorId), pickup.passengerPosition));
          if (!waiting.length)
            return withPhase(plan, "rendezvous", observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
          const suffix = `gather:${waiting.join("+")}`;
          const base = intentBase(plan, observation.tick, suffix);
          if (!hasNonTerminalOutcome(state, base.intentId)) {
            intents.push({
              ...base,
              kind: "move",
              actorIds: waiting,
              logicalPosition: pickup.passengerPosition,
              claims: [
                ...waiting.map((actorId) => ({
                  claimId: `claim:${plan.planId}:passenger:${actorId}` as const,
                  kind: "actor" as const,
                  actorId
                })),
                { claimId: `claim:${plan.planId}:rendezvous`, kind: "site", siteKey: pickup.transferId }
              ]
            });
          }
        } else if (plan.phase === "rendezvous") {
          const waiting = plan.lifecycle.assignedTransportIds.filter(
            (actorId) => !near(actors.get(actorId), pickup.carrierPosition)
          );
          if (!waiting.length)
            return withPhase(plan, "boarding", observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
          const suffix = `rendezvous:${waiting.join("+")}`;
          const base = intentBase(plan, observation.tick, suffix);
          if (!hasNonTerminalOutcome(state, base.intentId)) {
            intents.push({
              ...base,
              kind: "move",
              actorIds: waiting,
              logicalPosition: pickup.carrierPosition,
              claims: waiting.map((actorId) => ({
                claimId: `claim:${plan.planId}:transport:${actorId}` as const,
                kind: "actor" as const,
                actorId
              }))
            });
          }
        } else if (plan.phase === "boarding") {
          const onboardIds = new Set(
            plan.lifecycle.assignedTransportIds.flatMap((actorId) => {
              const containerState = actors.get(actorId)?.containerState;
              return containerState?.status === "known" ? containerState.value.passengerIds : [];
            })
          );
          const indispensableReady = plan.lifecycle.manifest
            .filter((member) => member.indispensable)
            .every((member) => onboardIds.has(member.actorId));
          const boardedSeats = plan.lifecycle.manifest
            .filter((member) => onboardIds.has(member.actorId))
            .reduce((sum, member) => sum + member.seats, 0);
          if (
            indispensableReady &&
            boardedSeats * 1000 >= plan.lifecycle.requiredCapacity * plan.lifecycle.departureCapacityPermille
          ) {
            return withPhase(plan, "transit", observation.tick, Math.max(600, 2 * plan.lifecycle.estimatedTravelTicks));
          }
          for (const assignment of plan.lifecycle.seatAssignments) {
            const waiting = assignment.passengerIds.filter((actorId) => !onboardIds.has(actorId));
            if (!waiting.length) continue;
            const waitingSeats = plan.lifecycle.manifest
              .filter((member) => waiting.includes(member.actorId))
              .reduce((total, member) => total + member.seats, 0);
            const suffix = `board:${assignment.transportId}:${waiting.join("+")}`;
            const base = intentBase(plan, observation.tick, suffix);
            if (hasNonTerminalOutcome(state, base.intentId)) continue;
            intents.push({
              ...base,
              kind: "board",
              actorIds: waiting,
              transportId: assignment.transportId,
              claims: [
                ...waiting.map((actorId) => ({
                  claimId: `claim:${plan.planId}:passenger:${actorId}` as const,
                  kind: "actor" as const,
                  actorId
                })),
                {
                  claimId: `claim:${plan.planId}:transport:${assignment.transportId}`,
                  kind: "actor",
                  actorId: assignment.transportId
                },
                {
                  claimId: `claim:${plan.planId}:seats:${assignment.transportId}`,
                  kind: "cargo_seat",
                  transportId: assignment.transportId,
                  seats: waitingSeats
                }
              ]
            });
          }
        } else if (plan.phase === "transit") {
          const waiting = plan.lifecycle.assignedTransportIds.filter(
            (actorId) => !near(actors.get(actorId), landing.carrierPosition)
          );
          if (!waiting.length) return withPhase(plan, "landing", observation.tick, 200);
          const suffix = `transit:${waiting.join("+")}`;
          const base = intentBase(plan, observation.tick, suffix);
          if (!hasNonTerminalOutcome(state, base.intentId)) {
            intents.push({
              ...base,
              kind: "move",
              actorIds: waiting,
              logicalPosition: landing.carrierPosition,
              claims: waiting.map((actorId) => ({
                claimId: `claim:${plan.planId}:transport:${actorId}` as const,
                kind: "actor" as const,
                actorId
              }))
            });
          }
        } else if (plan.phase === "landing") {
          if (
            !graph ||
            graph.generation !== plan.lifecycle.routeGeneration ||
            scoreAiTransportTransferV1(
              pickup,
              landing,
              observation,
              plan.lifecycle.routeRequest.capabilities.requiredClearance
            ) < 0
          ) {
            return withPhase(plan, "recovering", observation.tick, 200, {
              terminalReason: "landing_revalidation_failed"
            });
          }
          return withPhase(plan, "unloading", observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
        } else if (plan.phase === "unloading") {
          const loaded = plan.passengerIds.filter((actorId) => {
            const containerId = actors.get(actorId)?.containedInActorId;
            return containerId !== null && containerId !== undefined;
          });
          if (!loaded.length) return withPhase(plan, "regroup", observation.tick, 300);
          for (const assignment of plan.lifecycle.seatAssignments) {
            const passengers = assignment.passengerIds.filter((actorId) => loaded.includes(actorId));
            if (!passengers.length) continue;
            const suffix = `unload:${assignment.transportId}:${passengers.join("+")}`;
            const base = intentBase(plan, observation.tick, suffix);
            if (hasNonTerminalOutcome(state, base.intentId)) continue;
            intents.push({
              ...base,
              kind: "unload",
              transportId: assignment.transportId,
              passengerIds: passengers,
              logicalPosition: landing.passengerPosition,
              claims: [
                {
                  claimId: `claim:${plan.planId}:transport:${assignment.transportId}`,
                  kind: "actor",
                  actorId: assignment.transportId
                },
                { claimId: `claim:${plan.planId}:landing`, kind: "site", siteKey: landing.transferId }
              ]
            });
          }
        } else if (plan.phase === "regroup") {
          const notArrived = plan.passengerIds.filter((actorId) => {
            const accessNodeId = actors.get(actorId)?.accessNodeId;
            return accessNodeId?.status !== "known" || accessNodeId.value !== route.destinationNodeId;
          });
          if (!notArrived.length) return withPhase(plan, "handoff", observation.tick, 1);
          const suffix = `regroup:${notArrived.join("+")}`;
          const base = intentBase(plan, observation.tick, suffix);
          if (!hasNonTerminalOutcome(state, base.intentId)) {
            intents.push({
              ...base,
              kind: "move",
              actorIds: notArrived,
              logicalPosition: landing.passengerPosition,
              claims: notArrived.map((actorId) => ({
                claimId: `claim:${plan.planId}:regroup:${actorId}` as const,
                kind: "actor" as const,
                actorId
              }))
            });
          }
        }
        const pendingIntentIds = [
          ...new Set([
            ...plan.lifecycle.pendingIntentIds,
            ...intents.slice(intentStart).map((intent) => intent.intentId)
          ])
        ].sort();
        return { ...plan, lifecycle: { ...plan.lifecycle, pendingIntentIds } };
      });

    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents,
      reasons,
      statePatch: { transport }
    };
  }
}
