import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

/** Canonical keyed mission state; sequence/history semantics remain owned by the original contracts. */
export function canonicalizeAiSquads(state: AiBrainStateV1): AiBrainStateV1["squads"] {
  return [...state.squads]
    .map((squad) => ({
      ...squad,
      actorIds: [...squad.actorIds].sort(),
      ...(squad.tactics
        ? {
            tactics: {
              ...squad.tactics,
              orderedActorIds: [...squad.tactics.orderedActorIds].sort(),
              assignedPositions: [...squad.tactics.assignedPositions].sort((left, right) =>
                left.actorId.localeCompare(right.actorId)
              ),
              damageReservations: [...squad.tactics.damageReservations].sort(
                (left, right) => left.impactTick - right.impactTick || left.actorId.localeCompare(right.actorId)
              ),
              protectedRouteNodeIds: [...squad.tactics.protectedRouteNodeIds].sort(),
              mobileReserveActorIds: [...squad.tactics.mobileReserveActorIds].sort(),
              objectiveAlternatives: [...squad.tactics.objectiveAlternatives].sort(
                (left, right) => right.score - left.score || left.objectiveId.localeCompare(right.objectiveId)
              )
            }
          }
        : {})
    }))
    .sort((left, right) => left.squadId.localeCompare(right.squadId));
}

/** Canonical keyed mission state; sequence/history semantics remain owned by the original contracts. */
export function canonicalizeAiTransport(state: AiBrainStateV1): AiBrainStateV1["transport"] {
  return [...state.transport]
    .map((plan) => ({
      ...plan,
      passengerIds: [...plan.passengerIds].sort(),
      transportIds: [...plan.transportIds].sort(),
      queryIds: [...plan.queryIds].sort(),
      ...(plan.lifecycle
        ? {
            lifecycle: {
              ...plan.lifecycle,
              manifest: [...plan.lifecycle.manifest].sort((left, right) => left.actorId.localeCompare(right.actorId)),
              assignedTransportIds: [...plan.lifecycle.assignedTransportIds].sort(),
              seatAssignments: [...plan.lifecycle.seatAssignments]
                .map((assignment) => ({ ...assignment, passengerIds: [...assignment.passengerIds].sort() }))
                .sort((left, right) => left.transportId.localeCompare(right.transportId)),
              escortIds: [...plan.lifecycle.escortIds].sort(),
              pendingIntentIds: [...plan.lifecycle.pendingIntentIds].sort(),
              capacityDemand: plan.lifecycle.capacityDemand
                ? {
                    ...plan.lifecycle.capacityDemand,
                    satisfiedActorIds: [...plan.lifecycle.capacityDemand.satisfiedActorIds].sort(),
                    queuedIds: [...plan.lifecycle.capacityDemand.queuedIds].sort(),
                    constructingIds: [...plan.lifecycle.capacityDemand.constructingIds].sort(),
                    acceptedNotObservedEffectIds: [
                      ...plan.lifecycle.capacityDemand.acceptedNotObservedEffectIds
                    ].sort(),
                    preferredObjectNames: [...plan.lifecycle.capacityDemand.preferredObjectNames].sort()
                  }
                : null
            }
          }
        : {})
    }))
    .sort((left, right) => left.planId.localeCompare(right.planId));
}

/** Canonical keyed mission state; sequence/history semantics remain owned by the original contracts. */
export function canonicalizeAiFortifications(state: AiBrainStateV1): AiBrainStateV1["fortifications"] {
  return [...state.fortifications]
    .map((plan) => ({
      ...plan,
      nodeIds: [...plan.nodeIds].sort(),
      completedNodeIds: [...plan.completedNodeIds].sort(),
      protectedBaseIds: [...plan.protectedBaseIds].sort(),
      ...(plan.graph
        ? {
            graph: {
              ...plan.graph,
              terrainAnchorTileKeys: [...plan.graph.terrainAnchorTileKeys].sort(),
              protectedAssetIds: [...plan.graph.protectedAssetIds].sort(),
              nodes: [...plan.graph.nodes]
                .map((node) => ({
                  ...node,
                  footprintTileKeys: [...node.footprintTileKeys].sort(),
                  targetDomains: [...node.targetDomains].sort()
                }))
                .sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
              defenderPosts: [...plan.graph.defenderPosts]
                .map((post) => ({ ...post, assignedActorIds: [...post.assignedActorIds].sort() }))
                .sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
              breach: { ...plan.graph.breach, missingNodeIds: [...plan.graph.breach.missingNodeIds].sort() }
            }
          }
        : {})
    }))
    .sort((left, right) => left.planId.localeCompare(right.planId));
}
