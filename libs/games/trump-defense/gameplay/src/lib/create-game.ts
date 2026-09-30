import type { GameState } from "./game-state";
import { tileKey } from "./game-state";
import type { LevelDefinition } from "./level-definition";

/** Each run starts afresh; the next level already declares its cumulative roster. */
export function createGame(level: LevelDefinition): GameState {
  return {
    level,
    status: "playing",
    money: level.rules.startingMoney,
    lives: level.rules.startingLives,
    wallHeight: 0,
    selectedTile: null,
    entities: new Map(),
    occupied: new Set(),
    blocked: new Set(level.paths.ground.map(tileKey)),
    elapsedMs: 0,
    spawnMs: 0,
    movementMs: 0,
    hpIncreaseMs: 0,
    bonusHp: 0,
    spawnIndex: 0,
    nextEntityId: 1,
    sounds: [],
    shotEffects: []
  };
}
