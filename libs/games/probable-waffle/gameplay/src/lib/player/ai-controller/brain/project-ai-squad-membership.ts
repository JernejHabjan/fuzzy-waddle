import type { AiBrainState, AiSquadState } from "../contracts/ai-brain-state";

function family(squadId: AiSquadState["squadId"]): string {
  return squadId.split(":domain:")[0] ?? squadId;
}

/** Tactical proposals read the previous decision: their snapshots must not take actors from newly projected missions. */
export function projectAiSquadMembership(
  current: AiBrainState["squads"],
  update: AiSquadState,
  previous: AiBrainState["squads"],
  updates: readonly AiSquadState[]
): AiSquadState {
  const currentSquad = current.find((squad) => squad.squadId === update.squadId);
  const previousMembers = new Set(
    previous.filter((squad) => family(squad.squadId) === family(update.squadId)).flatMap((squad) => squad.actorIds)
  );
  const introducedMembers = currentSquad?.actorIds.filter((actorId) => !previousMembers.has(actorId)) ?? [];
  // Newly staffed actors already partitioned into a sibling must not also remain in the parent.
  const assignedToSibling = new Set(
    updates
      .filter((squad) => squad.squadId !== update.squadId && family(squad.squadId) === family(update.squadId))
      .flatMap((squad) => squad.actorIds)
  );
  // An old empty/expired mission cannot complete a newly staffed or restarted mission of the same stable ID.
  if (
    currentSquad &&
    (currentSquad.lifecycle?.createdTick !== update.lifecycle?.createdTick ||
      (update.actorIds.length === 0 && introducedMembers.length > 0))
  )
    return currentSquad;
  const owners = new Map(
    current.flatMap((squad) => squad.actorIds.map((actorId) => [actorId, family(squad.squadId)] as const))
  );
  const allowed = update.actorIds.filter(
    (actorId) => !owners.has(actorId) || owners.get(actorId) === family(update.squadId)
  );
  const currentMission = current.find((squad) => squad.squadId === family(update.squadId)) ?? currentSquad;
  return {
    ...update,
    objectiveId: currentMission ? currentMission.objectiveId : update.objectiveId,
    actorIds: [
      ...new Set([...introducedMembers.filter((actorId) => !assignedToSibling.has(actorId)), ...allowed])
    ].sort()
  };
}
