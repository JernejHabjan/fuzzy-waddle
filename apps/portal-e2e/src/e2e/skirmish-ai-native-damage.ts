import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Match an actual post-damage callback, refusing score totals, foreign scenes, restores and absent native clocks/identities. */
export function nativeDamageMatches(
  fact: AiRuntimeProductionFactV1, targetId: string, initiatorOwner: number, initiatorId?: string
): fact is Extract<AiRuntimeProductionFactV1, { kind: "native_damage" }> {
  if (fact.kind !== "native_damage") return false;
  const damage = fact.damage;
  return damage.damageTick === fact.tick && damage.sceneActive && !damage.snapshotRestoreInProgress &&
    damage.targetInCaptureScene && damage.initiatorInCaptureScene && damage.target.actorId === targetId &&
    damage.target.playerNumber === fact.playerNumber && !!damage.initiator?.actorId &&
    damage.initiator.playerNumber === initiatorOwner &&
    (initiatorId === undefined || damage.initiator.actorId === initiatorId) &&
    Number.isFinite(damage.amount) && damage.amount > 0 &&
    damage.healthAfter !== null && Number.isFinite(damage.healthAfter) && damage.healthAfter >= 0 &&
    damage.armourAfter !== null && Number.isFinite(damage.armourAfter) && damage.armourAfter >= 0;
}
