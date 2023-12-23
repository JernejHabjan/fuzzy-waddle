import { Resources, ResourceType } from "./resource-type";

export class WinConditions {
  constructor(public timeLimit: number | null = null) {}
}

export class MapTuning {
  constructor(public unitCap: number = 20) {}
}

export class DifficultyModifiers {
  constructor(
    public aiAdvantageResources: Map<ResourceType, number> = new Map<ResourceType, number>([
      [Resources.wood, 100],
      [Resources.stone, 100]
    ]),
    public reducedIncome: number = 0.5
  ) {}
}

export class ProbableWaffleGameModeLobby {
  constructor(
    public winConditions: WinConditions = new WinConditions(),
    public mapTuning: MapTuning = new MapTuning(),
    public difficultyModifiers: DifficultyModifiers = new DifficultyModifiers()
  ) {}
}
