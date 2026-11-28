import type { NativeScenarioWorld } from "./native-scenario-world.ts";

/** Native recipe branch. Natural starts intentionally omit presetWorld. */
export interface NativeScenarioVariant {
  id: string;
  executionKind: string;
  role: string;
  seed: number;
  deadlineRationale: string;
  aiFaction: string;
  humanFaction: string;
  difficulty: string;
  scenarioIds: string[];
  mapLabel?: string;
  pairId?: string;
  setupRationale?: string;
  checkpointTicks?: number[];
  captureConstruction?: boolean;
  captureCombat?: boolean;
  requiresMultiplayer?: boolean;
  additionalAiPlayers?: { playerNumber: number; faction: string; difficulty: string }[];
  lobbyTeams?: { playerNumber: number; team: number }[];
  presetWorld?: NativeScenarioWorld;
  nextMatchPresetWorld?: NativeScenarioWorld;
}
