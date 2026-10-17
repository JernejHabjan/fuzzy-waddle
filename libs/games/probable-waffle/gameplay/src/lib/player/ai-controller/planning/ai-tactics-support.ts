import { aiDeadline } from "../contracts/ai-core-types";
import type { AiPlanId } from "../contracts/ai-core-types";
import type { AiSquadStateV1, AiSupportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { knownPosition, distance, movementDomains } from "./ai-tactics-geometry";
import { intentBase } from "./ai-tactics-orders";

export function proposeAiTacticalSupport(
  observation: AiObservationV1,
  squad: AiSquadStateV1,
  members: readonly AiObservedActorV1[],
  enemies: readonly AiObservedActorV1[],
  support: AiSupportStateV1[],
  intents: AiIntentV1[]
): void {
  const wounded = members
    .filter((actor) => actor.healthPermille?.status === "known" && actor.healthPermille.value < 900)
    .sort(
      (left, right) =>
        (left.healthPermille?.status === "known" ? left.healthPermille.value : 1000) -
          (right.healthPermille?.status === "known" ? right.healthPermille.value : 1000) ||
        left.actorId.localeCompare(right.actorId)
    );
  for (const healer of members) {
    const profile = healer.combatProfile?.status === "known" ? healer.combatProfile.value : null;
    const heal = profile?.healing;
    const healerPosition = knownPosition(healer);
    const target = wounded.find((candidate) => {
      const targetPosition = knownPosition(candidate);
      return (
        targetPosition !== null &&
        (healerPosition === null || !heal || distance(healerPosition, targetPosition) <= heal.range)
      );
    });
    if (heal && heal.remainingCooldownTicks === 0 && target) {
      const missingHealth =
        target.combatProfile?.status === "known" && target.healthPermille?.status === "known"
          ? Math.floor((target.combatProfile.value.maxHealth * (1000 - target.healthPermille.value)) / 1000)
          : heal.amount;
      const pendingHealing = support
        .filter(
          (plan) =>
            plan.kind === "heal" &&
            plan.targetIds.includes(target.actorId) &&
            plan.state !== "released" &&
            plan.state !== "completed"
        )
        .reduce((total, plan) => total + (plan.usefulCapacity ?? 0), 0);
      const usefulCapacity = Math.min(heal.amount, Math.max(0, missingHealth - pendingHealing));
      if (usefulCapacity <= 0) continue;
      const planId = `support:heal:${healer.actorId}` as AiSupportStateV1["planId"];
      if (!support.some((plan) => plan.planId === planId)) {
        const effectId = `effect:stage13:${squad.squadId}:heal:${healer.actorId}:${target.actorId}:${observation.tick}`;
        support.push({
          planId,
          actorIds: [healer.actorId],
          targetIds: [target.actorId],
          expiresAt: aiDeadline(observation.tick + Math.max(1, heal.cooldownTicks)),
          kind: "heal",
          spellType: null,
          state: "reserved",
          effectId,
          usefulCapacity,
          reason: "bounded_missing_health"
        });
        intents.push({
          ...intentBase(observation, { ...squad, actorIds: [healer.actorId] }, `heal:${target.actorId}`, 900),
          effectId: effectId as AiIntentV1["effectId"],
          preconditions: [
            { kind: "plan_active", planId: `plan:${squad.squadId}` as AiPlanId },
            { kind: "actor_exists", actorId: target.actorId }
          ],
          kind: "heal",
          actorIds: [healer.actorId],
          targetActorId: target.actorId
        });
      }
    }
    for (const spell of profile?.spells ?? []) {
      if (!spell.ready || !spell.researched || spell.autocast) continue;
      const casterPosition = knownPosition(healer);
      const clusterPool = spell.targetEnemies ? enemies : spell.targetAllies ? wounded : [healer];
      const targets = (spell.targetEnemies ? enemies : spell.targetAllies ? wounded : spell.targetSelf ? [healer] : [])
        .filter((candidate) => movementDomains(candidate).some((domain) => spell.targetDomains.includes(domain)))
        .filter((candidate) => {
          const position = knownPosition(candidate);
          return position !== null && (casterPosition === null || distance(casterPosition, position) <= spell.range);
        })
        .sort((left, right) => {
          if (spell.areaRadius <= 0) return left.actorId.localeCompare(right.actorId);
          const leftPosition = knownPosition(left)!;
          const rightPosition = knownPosition(right)!;
          const leftCluster = clusterPool.filter(
            (candidate) =>
              knownPosition(candidate) !== null && distance(knownPosition(candidate)!, leftPosition) <= spell.areaRadius
          ).length;
          const rightCluster = clusterPool.filter(
            (candidate) =>
              knownPosition(candidate) !== null &&
              distance(knownPosition(candidate)!, rightPosition) <= spell.areaRadius
          ).length;
          return rightCluster - leftCluster || left.actorId.localeCompare(right.actorId);
        });
      const target = targets[0];
      const targetPosition = knownPosition(target);
      if (!target || !targetPosition) continue;
      const statusValue =
        target.activeEffectIds.length > 0
          ? Math.floor((spell.stunTicks + spell.slowTicks) / 5)
          : spell.stunTicks + spell.slowTicks;
      const usefulCapacity = spell.summons
        ? Math.max(1, spell.summonDurationTicks ?? 1)
        : spell.targetEnemies
          ? spell.instantDamage + spell.periodicDamage + statusValue
          : Math.min(
              spell.instantHeal + spell.periodicHeal,
              target.combatProfile?.status === "known" && target.healthPermille?.status === "known"
                ? Math.floor((target.combatProfile.value.maxHealth * (1000 - target.healthPermille.value)) / 1000)
                : spell.instantHeal + spell.periodicHeal
            );
      if (usefulCapacity <= 0) continue;
      const planId = `support:spell:${healer.actorId}:${spell.spellType}` as AiSupportStateV1["planId"];
      if (support.some((plan) => plan.planId === planId)) continue;
      const effectId = `effect:stage13:${squad.squadId}:spell:${healer.actorId}:${spell.spellType}:${target.actorId}:${observation.tick}`;
      support.push({
        planId,
        actorIds: [healer.actorId],
        targetIds: [target.actorId],
        expiresAt: aiDeadline(
          observation.tick + Math.max(1, spell.zoneDurationTicks || spell.stunTicks || spell.slowTicks || 40)
        ),
        kind: spell.summons && spell.summonDurationTicks !== null ? "temporary_support" : "spell",
        spellType: spell.spellType,
        state: "reserved",
        effectId,
        usefulCapacity,
        reason: spell.areaRadius > 0 ? "bounded_observed_cluster" : "highest_useful_target"
      });
      intents.push({
        ...intentBase(
          observation,
          { ...squad, actorIds: [healer.actorId] },
          `cast:${spell.spellType}:${target.actorId}`,
          880
        ),
        effectId: effectId as AiIntentV1["effectId"],
        preconditions: [{ kind: "plan_active", planId: `plan:${squad.squadId}` as AiPlanId }],
        claims: [
          {
            claimId: `claim:stage13:caster:${healer.actorId}` as AiIntentV1["claims"][number]["claimId"],
            kind: "actor",
            actorId: healer.actorId
          },
          {
            claimId: `claim:stage13:effect:${effectId}` as AiIntentV1["claims"][number]["claimId"],
            kind: "effect",
            effectId: effectId as AiIntentV1["effectId"]
          }
        ],
        kind: "cast",
        actorId: healer.actorId,
        spellType: spell.spellType,
        targetActorId: spell.areaRadius === 0 ? target.actorId : null,
        targetPosition
      });
      break;
    }
  }
}
