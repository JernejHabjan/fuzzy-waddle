/** One predeclared legal-start workload; side swaps are separate matches but one statistical seed cluster. */
export interface AiCalibrationJob {
  readonly id: string;
  readonly revision: "candidate" | "baseline";
  readonly phase: "calibration" | "holdout" | "soak";
  readonly seed: number;
  readonly faction: "Tivara" | "Skaduwee";
  readonly mapLabel: "River Crossing" | "Ember Enclave";
  readonly opponentArchetype: "balanced" | "rush" | "macro" | "turtle" | "tech";
  readonly targetPlayerNumber: 1 | 2;
  readonly difficulty: "Easy" | "Normal" | "Hard" | "Legacy";
  readonly maximumTick: number;
}
