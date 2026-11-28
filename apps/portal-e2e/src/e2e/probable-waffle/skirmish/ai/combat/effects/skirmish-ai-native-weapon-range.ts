import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { HIGH_GROUND_THRESHOLD } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/high-ground-constants";

interface ObservedGroundAttack {
  readonly damage: number;
  readonly minRange: number;
  readonly range: number;
  readonly highGroundRangeBonus: number;
  readonly targetDomains: readonly string[];
}

/** Mirrors native targeting: the height bonus applies only when the attacker is actually higher. */
export function isWithinObservedGroundWeaponRange(
  attackerPosition: Vector3Simple,
  targetPosition: Vector3Simple,
  attacks: readonly ObservedGroundAttack[]
): boolean {
  const distance = Math.floor(Math.hypot(attackerPosition.x - targetPosition.x, attackerPosition.y - targetPosition.y));
  const highGroundBonus = attackerPosition.z >= targetPosition.z + HIGH_GROUND_THRESHOLD;
  return attacks.some((attack) => {
    const bonus = highGroundBonus ? attack.highGroundRangeBonus : 0;
    return (
      attack.damage > 0 &&
      attack.targetDomains.includes("ground") &&
      distance >= attack.minRange &&
      distance <= attack.range + bonus
    );
  });
}
