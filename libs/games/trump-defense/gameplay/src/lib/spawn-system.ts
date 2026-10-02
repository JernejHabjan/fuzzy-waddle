import type { GameEntity, GameState } from "./game-state";

export function spawnEnemies(state: GameState): void {
  const { rules, paths } = state.level;
  if (state.elapsedMs < rules.spawnDelayMs) return;
  const roster = rules.enemyRoster;
  if (!roster.length) return;
  while (state.spawnMs >= rules.spawnIntervalMs) {
    state.spawnMs -= rules.spawnIntervalMs;
    const kind = roster[state.spawnIndex % roster.length];
    state.spawnIndex++;
    if (!kind) continue;
    // Draw.cpp overwrote multiple ground enemies on the entry square each spawn;
    // rotating through the cumulative roster makes every listed type actually appear.
    const definition = rules.enemies[kind];
    const start = paths[definition.path][0];
    if (!start) continue;
    const entity: GameEntity = {
      id: state.nextEntityId++,
      visual: kind,
      position: { x: start[0], y: definition.altitude, z: -start[1] },
      orientation: { y: 0 },
      path: { kind: definition.path, waypoint: 0 },
      health: { current: rules.enemyHp + state.bonusHp, reward: definition.reward }
    };
    state.entities.set(entity.id, entity);
    state.sounds.push({ kind: definition.path === "flying" ? "baloon" : "spawn", worldX: start[0] });
  }
}
