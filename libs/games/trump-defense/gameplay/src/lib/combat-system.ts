import type { GameEntity, GameState } from "./game-state";
import { isEnemy } from "./game-state";

function inRange(tower: GameEntity, enemy: GameEntity): boolean {
  const dx = tower.position.x - enemy.position.x;
  const dz = tower.position.z - enemy.position.z;
  return dx * dx + dz * dz < (tower.weapon?.range ?? 0) ** 2;
}

export function fireTowers(state: GameState): void {
  for (const tower of state.entities.values()) {
    const weapon = tower.weapon;
    if (!weapon) continue;
    // GameObject.cpp: "cannon nemore strelat gor" — target eligibility is weapon data.
    const target = [...state.entities.values()]
      .filter(
        (enemy) =>
          isEnemy(enemy) && enemy.path && (weapon.canHitFlying || enemy.path.kind === "ground") && inRange(tower, enemy)
      )
      .sort((left, right) => (right.path?.waypoint ?? 0) - (left.path?.waypoint ?? 0))[0];
    if (!target?.health || !target.path) continue;
    const dx = target.position.x - tower.position.x;
    const dz = target.position.z - tower.position.z;
    tower.orientation = { y: Math.atan2(-dz, dx) };
    if (state.elapsedMs - weapon.lastShotMs < weapon.cooldownMs) continue;
    weapon.lastShotMs = state.elapsedMs;
    target.health.current -= weapon.damage + (target.path.kind === "flying" ? weapon.airBonusDamage : 0);
    state.shotEffects.push({
      id: state.nextProjectileId++,
      from: { ...tower.position },
      to: { ...target.position },
      elapsedMs: 0,
      durationMs: 450
    });
    state.sounds.push({ kind: weapon.fireSound, worldX: tower.position.x });
    if (target.health.current <= 0) {
      state.entities.delete(target.id);
      state.money += target.health.reward;
      state.sounds.push({ kind: "die", worldX: target.position.x });
      state.sounds.push({ kind: "cash", worldX: target.position.x });
    }
  }
}
