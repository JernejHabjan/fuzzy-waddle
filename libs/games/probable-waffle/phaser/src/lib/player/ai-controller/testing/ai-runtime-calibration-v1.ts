/** Explicit developer-only legal duel setup. It selects controllers/strategy, never resources, stats or visibility. */
export interface AiRuntimeCalibrationV1 {
  readonly targetPlayerNumber: 1 | 2;
  readonly difficulty: "Easy" | "Normal" | "Hard";
  readonly opponentArchetype: "balanced" | "rush" | "macro" | "turtle" | "tech";
}
