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
    if (!weapon || state.elapsedMs - weapon.lastShotMs < weapon.cooldownMs) continue;
    // GameObject.cpp: "cannon nemore strelat gor" — target eligibility is weapon data.
    const target = [...state.entities.values()]
      .filter(
        (enemy) =>
          isEnemy(enemy) && enemy.path && (weapon.canHitFlying || enemy.path.kind === "ground") && inRange(tower, enemy)
      )
      .sort((left, right) => (right.path?.waypoint ?? 0) - (left.path?.waypoint ?? 0))[0];
    if (!target?.health || !target.path) continue;
    weapon.lastShotMs = state.elapsedMs;
    target.health.current -= weapon.damage + (target.path.kind === "flying" ? weapon.airBonusDamage : 0);
    state.shotEffects.push({ from: { ...tower.position }, to: { ...target.position } });
    state.sounds.push(weapon.fireSound);
    if (target.health.current <= 0) {
      state.entities.delete(target.id);
      state.money += target.health.reward;
      state.sounds.push("cash");
    }
  }
}
