import type { AiBrainStateV1 } from "./ai-brain-state-v1";
import { assertAiNonNegativeInteger } from "./ai-core-types";
import { assertDeadline, assertUnique } from "./ai-validation-primitives";

/** Validates persisted transport assignments and lifecycle capacity before planning. */
export function assertAiTransportStateV1(value: AiBrainStateV1): void {
  for (const transport of value.transport) {
    if (!transport.lifecycle) continue;
    if (!["island_establishment", "army_transfer", "evacuation"].includes(transport.lifecycle.missionKind)) {
      throw new Error(`invalid_ai_transport_mission:${transport.planId}`);
    }
    assertDeadline(transport.lifecycle.phaseDeadline, `transport.${transport.planId}.phaseDeadline`);
    assertAiNonNegativeInteger(transport.lifecycle.routeGeneration, `transport.${transport.planId}.routeGeneration`);
    assertAiNonNegativeInteger(transport.lifecycle.assignedCapacity, `transport.${transport.planId}.assignedCapacity`);
    assertAiNonNegativeInteger(transport.lifecycle.requiredCapacity, `transport.${transport.planId}.requiredCapacity`);
    assertAiNonNegativeInteger(
      transport.lifecycle.departureCapacityPermille,
      `transport.${transport.planId}.departureCapacityPermille`
    );
    assertAiNonNegativeInteger(
      transport.lifecycle.estimatedTravelTicks,
      `transport.${transport.planId}.estimatedTravelTicks`
    );
    assertAiNonNegativeInteger(transport.lifecycle.recoveryAttempt, `transport.${transport.planId}.recoveryAttempt`);
    assertAiNonNegativeInteger(
      transport.lifecycle.maxRecoveryAttempts,
      `transport.${transport.planId}.maxRecoveryAttempts`
    );
    assertAiNonNegativeInteger(transport.lifecycle.lastProgressTick, `transport.${transport.planId}.lastProgressTick`);
    if (transport.lifecycle.requiredCapacity === 0 || transport.lifecycle.departureCapacityPermille > 1000) {
      throw new Error(`invalid_ai_transport_capacity:${transport.planId}`);
    }
    assertUnique(
      transport.lifecycle.manifest.map((passenger) => passenger.actorId),
      `transport.${transport.planId}.manifest`
    );
    assertUnique([...transport.lifecycle.assignedTransportIds], `transport.${transport.planId}.assignedTransportIds`);
    assertUnique(
      transport.lifecycle.seatAssignments.map((assignment) => assignment.transportId),
      `transport.${transport.planId}.seatAssignments`
    );
    assertUnique(
      transport.lifecycle.seatAssignments.flatMap((assignment) => [...assignment.passengerIds]),
      `transport.${transport.planId}.assignedPassengers`
    );
    const manifestIds = new Set(transport.lifecycle.manifest.map((passenger) => passenger.actorId));
    for (const passenger of transport.lifecycle.manifest) {
      assertAiNonNegativeInteger(passenger.seats, `transport.${transport.planId}.${passenger.actorId}.seats`);
      if (passenger.seats === 0) throw new Error(`invalid_ai_transport_seats:${transport.planId}:${passenger.actorId}`);
    }
    if (
      transport.lifecycle.seatAssignments.some(
        (assignment) =>
          !transport.lifecycle?.assignedTransportIds.includes(assignment.transportId) ||
          assignment.passengerIds.some((passengerId) => !manifestIds.has(passengerId))
      )
    ) {
      throw new Error(`invalid_ai_transport_assignment:${transport.planId}`);
    }
  }
}
