import type { GameCommand, GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

export const AI_RUNTIME_PRESET_CONTROL_EVENT = "ai-runtime-preset-control";

/** Root capture orders real controller requests and actual shared applications without manufacturing AI proposals. */
export interface AiRuntimePresetControlEvent {
  readonly id: string;
  readonly playerNumber: number;
  readonly actorId: string;
  readonly phase: "requested" | "applied";
  readonly requestedTick: number;
  readonly scheduledTick: number;
  readonly setupItemId: string | null;
  readonly command: GameCommand | null;
  readonly outcomes: readonly GameCommandOutcome[];
}
