export interface RuntimeVariantV1 {
  readonly id: string;
  readonly scenarioIds?: readonly string[];
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
  readonly perturbations?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "human_attack_ai_home";
    readonly maximumAttackers: number;
  }[];
}
