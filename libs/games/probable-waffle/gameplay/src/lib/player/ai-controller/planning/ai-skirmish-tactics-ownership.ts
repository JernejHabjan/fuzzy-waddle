import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";

/** Drops per-actor tactical orders and reservations when a strategic mission changes squad membership. */
export function retainAiSquadTacticsForActors(
  tactics: AiSquadStateV1["tactics"],
  actorIds: readonly string[]
): AiSquadStateV1["tactics"] {
  if (!tactics) return undefined;
  const members = new Set(actorIds);
  return {
    ...tactics,
    orderedActorIds: tactics.orderedActorIds.filter((actorId) => members.has(actorId)),
    assignedPositions: tactics.assignedPositions.filter((entry) => members.has(entry.actorId)),
    damageReservations: tactics.damageReservations.filter((entry) => members.has(entry.actorId))
  };
}
