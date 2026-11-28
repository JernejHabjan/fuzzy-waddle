import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";

/** Live inspection clones one snapshot; bounded history is cloned only when the user selects a past decision. */
export function selectAiDebugSnapshot(controller: PlayerAiController, requestedHistoryOffset: number) {
  if (requestedHistoryOffset === 0) {
    return { snapshot: controller.getBrainDebugSnapshot(), historyOffset: 0 };
  }
  const history = controller.getBrainDebugHistory();
  const historyOffset = Math.min(requestedHistoryOffset, Math.max(0, history.length - 1));
  return {
    snapshot: historyOffset === 0 ? controller.getBrainDebugSnapshot() : history.at(-1 - historyOffset),
    historyOffset
  };
}
