import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

/** Victory acceptance uses the AI player's authoritative score result. */
export function isAiVictory(checkpoint: Pick<RuntimeCheckpointV1, "gameResult">): boolean {
  return checkpoint.gameResult === "win";
}

/** A terminal world cannot satisfy a pending event or an unrelated scenario's observation horizon. */
export function canStopAfterTerminal(
  assertions: Readonly<Record<string, Pick<RuntimeAssertionV1, "requireAiVictory">>>,
  scenarioIds: readonly string[],
  checkpoint: Pick<RuntimeCheckpointV1, "gameResult" | "tick">,
  pendingEventTicks: readonly number[]
): boolean {
  if (!checkpoint.gameResult || scenarioIds.length === 0) return false;
  if (scenarioIds.some((id) => assertions[id]?.requireAiVictory !== true)) return false;
  return pendingEventTicks.every((tick) => tick <= checkpoint.tick);
}
