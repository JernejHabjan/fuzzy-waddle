import { PlayerState } from './probable-waffle-game/player-state';
import { GameMode } from './probable-waffle-game/game-mode/game-mode';
import { Building } from './probable-waffle-game/buildings/building';
import { Character } from './probable-waffle-game/characters/character';

export class GameStatistics {
  constructor(public players: PlayerStatistics[], public gameInfoStatistics: GameInfoStatistics) {}
}

export class PlayerStatistics {
  constructor(public player: PlayerState, public units: UnitStatistics[], public buildings: BuildingStatistics[]) {}
}

export class UnitStatistics {
  constructor(public unit: Character, public kills: number, public deaths: number) {}
}

export class BuildingStatistics {
  constructor(public building: Building, public kills: number, public deaths: number) {}
}

export class GameInfoStatistics {
  constructor(public gameTime: number, public gameMode: GameMode) {}
}
