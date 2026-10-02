import type { GameState } from "./game-state";
import { fireTowers } from "./combat-system";
import { moveEnemies } from "./movement-system";
import { spawnEnemies } from "./spawn-system";

/** Fixed simulation steps make the source's timers independent of display frame rate. */
export function stepGame(state: GameState, deltaMs: number): void {
  if (state.status !== "playing") return;
  state.sounds.length = 0;
  for (const effect of state.shotEffects) effect.elapsedMs += deltaMs;
  state.shotEffects = state.shotEffects.filter((effect) => effect.elapsedMs < effect.durationMs);
  const previousMs = state.elapsedMs;
  state.elapsedMs += deltaMs;
  // Draw.cpp: "počaka 5 sec na začetk" — first spawn follows the opening delay.
  if (previousMs < state.level.rules.spawnDelayMs && state.elapsedMs >= state.level.rules.spawnDelayMs) {
    state.spawnMs = state.level.rules.spawnIntervalMs;
  } else if (previousMs >= state.level.rules.spawnDelayMs) {
    state.spawnMs += deltaMs;
  }
  state.movementMs += deltaMs;
  state.hpIncreaseMs += deltaMs;
  spawnEnemies(state);
  moveEnemies(state);
  if (state.status === "playing") fireTowers(state);
  // Draw.cpp: every five seconds enemies gain health and become harder.
  while (state.hpIncreaseMs >= state.level.rules.enemyHpIntervalMs) {
    state.hpIncreaseMs -= state.level.rules.enemyHpIntervalMs;
    state.bonusHp += state.level.rules.enemyHpIncrease;
  }
}
