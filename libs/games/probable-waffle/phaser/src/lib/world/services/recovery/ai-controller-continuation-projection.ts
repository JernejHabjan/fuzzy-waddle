import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";

/** Measured spans/events are diagnostics, not deterministic continuation. All saved gameplay fields stay intact. */
export function projectAiControllerContinuation(state: AIBehaviorTreeStateData | undefined) {
  if (!state) return undefined;
  const continuation = { ...state };
  delete continuation.telemetry;
  return continuation;
}
