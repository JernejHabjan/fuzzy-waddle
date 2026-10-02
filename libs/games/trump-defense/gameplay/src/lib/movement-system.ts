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
        state.sounds.push({ kind: "lifeLost", worldX: entity.position.x });
        if (state.lives <= 0) {
          state.status = "lost";
          return;
        }
        continue;
      }
      const nextPosition = { x: next[0], z: -next[1] };
      const dx = nextPosition.x - entity.position.x;
      const dz = nextPosition.z - entity.position.z;
      if (dx || dz) entity.orientation = { y: Math.atan2(-dz, dx) };
      entity.path.waypoint++;
      entity.position.x = nextPosition.x;
      entity.position.z = nextPosition.z;
    }
  }
}
