export interface RuntimePerturbationV1 {
  readonly id: string;
  readonly tick: number;
  readonly kind: "human_attack_ai_home";
  readonly maximumAttackers: number;
  readonly attackerObjectNames?: readonly string[];
  readonly targetObjectName?: string;
}
