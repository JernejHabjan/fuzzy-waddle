import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAuthorityStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiBrainStepResultV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain-step-result-v1";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "./ai-decision-dispatch-event";
import { captureAiSelectedMissionState } from "./capture-ai-selected-mission-state";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "./ai-intent-command-dispatch-event";
import { dispatchAiIntents } from "./ai-intent-dispatcher";
import type { AiDecisionInputV1 } from "./ai-decision-input-v1";
// prettier-ignore
import { readAiGatheringSelection } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-gathering-selection-observation";

/** Publishes the actual accepting result, including empty decisions, before ordinary shared command dispatch. */
export function dispatchAiBrainResult(
  scene: ProbableWaffleScene,
  playerNumber: PlayerNumber,
  result: AiBrainStepResultV1,
  authority: AiAuthorityStateV1,
  input?: AiDecisionInputV1
): void {
  if (
    !scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT) &&
    !scene.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)
  ) {
    dispatchAiIntents(scene, playerNumber, result.acceptedIntents);
    return;
  }
  const debug = result.debugSnapshot;
  const identity = {
    playerNumber: debug.playerNumber,
    tick: debug.tick,
    generation: debug.generation,
    decisionSequence: debug.decisionSequence,
    authorityEpoch: authority.authorityEpoch
  };
  if (scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT)) scene.events.emit(
    AI_DECISION_DISPATCH_EVENT,
    structuredClone({
      identity,
      ...(input ? { input } : {}),
      persistedProfile: { profileVersion: result.nextState.profileVersion, profileDifficulty: result.nextState.profileDifficulty },
      acceptedIntents: result.acceptedIntents,
      decisions: result.decisions,
      reservations: result.nextState.reservations,
      economyProduction: result.nextState.economyProduction,
      strategy: result.nextState.strategy,
      opening: result.nextState.opening,
      missionState: captureAiSelectedMissionState(result.nextState),
      gatheringSelections: result.acceptedIntents.flatMap((intent) => {
        const selection = readAiGatheringSelection(intent);
        return selection ? [selection] : [];
      })
    } satisfies AiDecisionDispatchEvent)
  );
  dispatchAiIntents(scene, playerNumber, result.acceptedIntents, identity);
}
