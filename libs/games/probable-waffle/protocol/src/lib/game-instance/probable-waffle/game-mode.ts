import type { BaseData } from "@fuzzy-waddle/platform-game-sessions";
import { BaseGameMode } from "@fuzzy-waddle/platform-game-sessions";
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";
import type {
  DifficultyModifiers,
  MapTuning,
  TieConditions,
  LoseConditions,
  WinConditions
} from "../../probable-waffle/probable-waffle-game-mode-lobby";

/** Host-selected terrain visibility rule shared by every participant. */
export enum ProbableWaffleTerrainVisibility {
  Default = "default",
  HideTerrain = "hide-terrain",
  MapExplored = "map-explored",
  AlwaysVisible = "always-visible"
}

/** Resolves legacy/default lobby input to the current authored map policy before launch or persistence. */
export function resolveProbableWaffleTerrainVisibility(
  visibility: ProbableWaffleTerrainVisibility | undefined
): Exclude<ProbableWaffleTerrainVisibility, ProbableWaffleTerrainVisibility.Default> {
  return visibility === ProbableWaffleTerrainVisibility.HideTerrain ||
    visibility === ProbableWaffleTerrainVisibility.AlwaysVisible
    ? visibility
    : ProbableWaffleTerrainVisibility.MapExplored;
}

export interface ProbableWaffleGameModeData extends BaseData {
  map?: ProbableWaffleMapEnum;
  mapTuning: MapTuning;
  difficultyModifiers: DifficultyModifiers;
  tieConditions: TieConditions;
  winConditions: WinConditions;
  loseConditions: LoseConditions;
  /** Resolved match rule; legacy/default data maps to the current pre-explored behavior. */
  terrainVisibility?: ProbableWaffleTerrainVisibility;
}

export class ProbableWaffleGameMode extends BaseGameMode<ProbableWaffleGameModeData> {
  constructor(data?: ProbableWaffleGameModeData) {
    super(data as ProbableWaffleGameModeData);
  }
}
