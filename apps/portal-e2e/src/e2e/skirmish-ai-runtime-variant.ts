import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import type { RuntimePerturbationV1 } from "./skirmish-ai-runtime-perturbation";

export interface RuntimeVariantV1 {
  readonly id: string;
  readonly executionKind: "focused_preset" | "focused_natural" | "continuous";
  readonly role: "subject" | "control" | "standalone";
  readonly pairId?: string;
  readonly setupRationale?: string;
  readonly deadlineRationale?: string;
  readonly evidenceStop?: { readonly earliestTick: number; readonly stableForTicks: number };
  readonly scenarioIds?: readonly string[];
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
  /** Native lobby slots only; actors may not invent players in a two-spawn scene. */
  readonly additionalAiPlayers?: readonly { readonly playerNumber: number; readonly faction: "Tivara" | "Skaduwee";
    readonly difficulty: "Easy" | "Normal" | "Hard" }[];
  /** Initial supported team relations; not an in-match diplomacy command. */
  readonly lobbyTeams?: readonly { readonly playerNumber: number; readonly team: number }[];
  readonly presetWorld?: RuntimePresetWorldV1;
  /** H-32's real multiplayer first match has no preset; this setup belongs exclusively to its ordinary next match. */
  readonly nextMatchPresetWorld?: RuntimePresetWorldV1;
  /** Explicit test-only native construction history; ordinary matches and unmarked recipes install none. */
  readonly captureConstruction?: true;
  /** Adds native damage facts to that same opt-in capture; omitted recipes retain their previous fact stream. */
  readonly captureCombat?: true;
  readonly checkpointTicks?: readonly number[];
  readonly determinismGroup?: string;
  readonly repetitions?: number;
  readonly supplyBranch?: "prebuild" | "ample_control";
  readonly pressureBranch?: "raid" | "safe_control";
  readonly resourceServiceBranch?: "build" | "served_control";
  readonly productionCapacityBranch?: "build" | "already_sufficient";
  /** PRO-04 pairs isolate ready copies or normally paid queue commitments from the same ten-unit force. */
  readonly productionCompositionBranch?: "fill_deficit" | "satisfied_control" | "seeded_queue_control";
  readonly perturbations?: readonly RuntimePerturbationV1[];
}
