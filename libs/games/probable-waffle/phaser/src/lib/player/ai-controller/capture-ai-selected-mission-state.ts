import type { AiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionDispatchEvent } from "./ai-decision-dispatch-event";

/** Called only inside listener-gated dispatch. Keep complete slices or explicit loss, never a convincing subset. */
export function captureAiSelectedMissionState(state: AiBrainStateV1): AiDecisionDispatchEvent["missionState"] {
  if (state.squads.length > 64 || state.knowledge.evidence.length > 512 || state.knowledge.questions.length > 256 ||
      state.bases.length > 32 || state.fortifications.length > 64 || state.support.length > 256 ||
      state.progress.length > 256 || state.recoveryEpisodes.length > 256 || state.skirmish.incidents.length > 256 ||
      state.skirmish.timeline.length > 512 ||
      state.squads.some((squad) => squad.actorIds.length > 256 ||
        (squad.tactics?.damageReservations.length ?? 0) > 256 || (squad.tactics?.assignedPositions.length ?? 0) > 256) ||
      state.fortifications.some((plan) => plan.nodeIds.length > 256 || (plan.graph?.nodes.length ?? 0) > 256)) return null;
  return {
    squads: state.squads, knowledge: state.knowledge, skirmish: state.skirmish, bases: state.bases,
    fortifications: state.fortifications, support: state.support, progress: state.progress,
    recoveryEpisodes: state.recoveryEpisodes
  };
}
