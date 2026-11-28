import type { AiSquadState } from "../../../contracts/state/ai-state-contracts";

/** Drops per-actor tactical orders and reservations when a strategic mission changes squad membership. */
export function retainAiSquadTacticsForActors(
  tactics: AiSquadState["tactics"],
  actorIds: readonly string[]
): AiSquadState["tactics"] {
  if (!tactics) return undefined;
  const members = new Set(actorIds);
  return {
    ...tactics,
    orderedActorIds: tactics.orderedActorIds.filter((actorId) => members.has(actorId)),
    assignedPositions: tactics.assignedPositions.filter((entry) => members.has(entry.actorId)),
    damageReservations: tactics.damageReservations.filter((entry) => members.has(entry.actorId))
  };
}
