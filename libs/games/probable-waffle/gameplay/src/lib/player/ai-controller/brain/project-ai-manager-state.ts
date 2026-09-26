import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";

/** Applies manager-owned state projections without allowing a later narrow update to resurrect an earlier removal. */
export function projectAiManagerState(
  initialState: AiBrainStateV1,
  proposalBatches: readonly AiManagerProposalV1[]
): AiBrainStateV1 {
  const initialSquadIds = new Set(initialState.squads.map((squad) => squad.squadId));
  return proposalBatches.reduce<AiBrainStateV1>((state, batch) => {
    const patch = batch.statePatch;
    if (!patch) return state;
    const { transportAppend, squadUpdates, adaptation, adaptationDemands, openingArchetypeId, ...replacePatch } = patch;
    const currentSquadIds = new Set(state.squads.map((squad) => squad.squadId));
    const applicableSquadUpdates = squadUpdates?.filter((update) => {
      const parentSquadId = update.squadId.includes(":domain:")
        ? (update.squadId.slice(0, update.squadId.indexOf(":domain:")) as typeof update.squadId)
        : null;
      return (
        currentSquadIds.has(update.squadId) ||
        !initialSquadIds.has(update.squadId) ||
        (parentSquadId !== null && currentSquadIds.has(parentSquadId))
      );
    });
    return {
      ...state,
      ...replacePatch,
      ...(openingArchetypeId ? { opening: { ...state.opening, archetypeId: openingArchetypeId } } : {}),
      ...(adaptation || adaptationDemands
        ? {
            economyProduction: {
              ...state.economyProduction,
              ...(adaptation ? { adaptation } : {}),
              ...(adaptationDemands
                ? {
                    demands: [
                      ...state.economyProduction.demands.filter(
                        (demand) => !demand.demandId.startsWith("demand:adapt:")
                      ),
                      ...adaptationDemands
                    ].sort((left, right) => left.demandId.localeCompare(right.demandId))
                  }
                : {})
            }
          }
        : {}),
      ...(transportAppend?.length
        ? {
            transport: [
              ...state.transport,
              ...transportAppend.filter(
                (candidate) => !state.transport.some((current) => current.planId === candidate.planId)
              )
            ]
          }
        : {}),
      ...(applicableSquadUpdates?.length
        ? {
            squads: [
              ...state.squads.filter(
                (squad) => !applicableSquadUpdates.some((update) => update.squadId === squad.squadId)
              ),
              ...applicableSquadUpdates
            ].sort((left, right) => left.squadId.localeCompare(right.squadId))
          }
        : {})
    };
  }, initialState);
}
