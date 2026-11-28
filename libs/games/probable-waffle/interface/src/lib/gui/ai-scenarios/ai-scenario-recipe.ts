import type { AiRuntimePresetWorld } from "../main/ai-runtime-browser-test-host";

/** Only the authored setup and lobby inputs are consumed during visual playback. */
export interface AiScenarioRecipe {
  readonly purpose: string;
  readonly scenarioIds: readonly string[];
  readonly acceptance?: {
    readonly setup?: readonly string[];
    readonly actions?: readonly string[];
    readonly measurements?: readonly string[];
    readonly required?: readonly string[];
    readonly forbidden?: readonly string[];
    readonly branches?: readonly string[];
  };
  readonly recipe: {
    readonly mapLabel: string;
    readonly aiPlayerNumber: number;
    readonly requiresMultiplayer?: boolean;
    readonly variants: readonly AiScenarioVariant[];
  };
}

/** A single named variant supplies the exact map, seed and initial conditions for a preview. */
export interface AiScenarioVariant {
  readonly id: string;
  readonly scenarioIds?: readonly string[];
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
  readonly setupRationale?: string;
  readonly requiresMultiplayer?: boolean;
  readonly presetWorld?: Omit<AiRuntimePresetWorld, "provenance">;
  readonly perturbations?: readonly unknown[];
  readonly lobbyTeams?: readonly { readonly playerNumber: number; readonly team: number }[];
  readonly additionalAiPlayers?: readonly {
    readonly playerNumber: number;
    readonly faction: AiScenarioVariant["aiFaction"];
    readonly difficulty: AiScenarioVariant["difficulty"];
  }[];
}
