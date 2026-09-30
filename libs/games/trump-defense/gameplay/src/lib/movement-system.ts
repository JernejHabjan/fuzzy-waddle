import type { GameState } from "./game-state";

export function moveEnemies(state: GameState): void {
  const interval = state.level.rules.moveIntervalMs;
  while (state.movementMs >= interval && state.status === "playing") {
    state.movementMs -= interval;
    for (const entity of state.entities.values()) {
      if (!entity.path) continue;
      const path = state.level.paths[entity.path.kind];
      const next = path[entity.path.waypoint + 1];
      if (!next) {
        state.entities.delete(entity.id);
        state.lives = Math.max(0, state.lives - 1);
        state.sounds.push("die");
        if (state.lives <= 0) {
          state.status = "lost";
          return;
        }
        continue;
      }
      entity.path.waypoint++;
      entity.position.x = next[0];
      entity.position.z = -next[1];
    }
  }
}
