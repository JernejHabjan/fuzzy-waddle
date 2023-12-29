import { PlayerState } from "../game/player/player-state";
import { GameMode } from "../game/world/managers/game-mode/game-mode";
import { Building } from "../game/entity/assets/buildings/building";
import { Character } from "../game/entity/actor/character";

export class GameStatistics {
  constructor(
    public players: PlayerStatistics[],
    public gameInfoStatistics: GameInfoStatistics
  ) {}
}

export class PlayerStatistics {
  constructor(
    public player: PlayerState,
    public units: UnitStatistics[],
    public buildings: BuildingStatistics[]
  ) {}
}

export class UnitStatistics {
  constructor(
    public unit: Character,
    public kills: number,
    public deaths: number
  ) {}
}

export class BuildingStatistics {
  constructor(
    public building: Building,
    public kills: number,
    public deaths: number
  ) {}
}

export class GameInfoStatistics {
  constructor(
    public gameTime: number,
    public gameMode: GameMode
  ) {}
}
