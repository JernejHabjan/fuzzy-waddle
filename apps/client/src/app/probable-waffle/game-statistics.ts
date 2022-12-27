import { PlayerState } from './probable-waffle-game/player-state';

export class GameStatistics {
  constructor(public players: PlayerStatistics[], public gameInfoStatistics: GameInfoStatistics) {}
}

export class PlayerStatistics {
  constructor(public player: PlayerState, public units: UnitStatistics[], public buildings: BuildingStatistics[]) {}
}

export class UnitStatistics {
  constructor(public unit: Unit, public kills: number, public deaths: number) {}
}

export class BuildingStatistics {
  constructor(public building: Building, public kills: number, public deaths: number) {}
}

export class GameInfoStatistics {
  constructor(public gameTime: number, public gameMode: GameMode) {}
}
