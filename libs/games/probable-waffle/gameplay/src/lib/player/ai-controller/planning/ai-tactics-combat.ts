import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { knownPosition, distance, movementDomains } from "./ai-tactics-geometry";
import { MAX_LOCAL_ENEMIES } from "./ai-tactics-rules";

export function canTarget(attacker: AiObservedActorV1, target: AiObservedActorV1): boolean {
  const targetMovement = movementDomains(target);
  const attacks = attacker.combatProfile?.status === "known" ? attacker.combatProfile.value.attacks : [];
  return attacks.some((attack) => targetMovement.some((domain) => attack.targetDomains.includes(domain)));
}

export function canSeeTarget(
  attacker: AiObservedActorV1,
  target: AiObservedActorV1,
  catalog: AiCapabilityCatalogV1 | undefined
): boolean {
  const attackerPosition = knownPosition(attacker);
  const targetPosition = knownPosition(target);
  if (!attackerPosition || !targetPosition) return false;
  const visionRange =
    catalog?.entries.find((entry) => entry.sourceObjectName === attacker.objectName)?.constructionProfile
      ?.visionRange ?? 8;
  return distance(attackerPosition, targetPosition) <= visionRange;
}

export function isEconomicActor(actor: AiObservedActorV1, catalog: AiCapabilityCatalogV1 | undefined): boolean {
  return (
    catalog?.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0) ?? false
  );
}

export function actorCombatStrength(actor: AiObservedActorV1, opponents: readonly AiObservedActorV1[]): number {
  if (actor.combatProfile?.status !== "known" || actor.healthPermille?.status !== "known") return 0;
  const profile = actor.combatProfile.value;
  const statusPenalty = profile.statuses.reduce(
    (penalty, status) =>
      Math.min(penalty, status.type === "stunned" || status.type === "frozen" ? 200 : status.movementSpeedPermille),
    1000
  );
  const actorPosition = knownPosition(actor);
  const bestDps = opponents.slice(0, MAX_LOCAL_ENEMIES).reduce((best, opponent) => {
    const targetPosition = knownPosition(opponent);
    const targetDomains = movementDomains(opponent);
    const separation =
      actorPosition && targetPosition ? distance(actorPosition, targetPosition) : Number.POSITIVE_INFINITY;
    const attackValue = profile.attacks
      .filter((attack) => targetDomains.some((domain) => attack.targetDomains.includes(domain)))
      .reduce((attackBest, attack) => {
        const effectiveRange =
          attack.range +
          (actorPosition && targetPosition && actorPosition.z > targetPosition.z ? attack.highGroundRangeBonus : 0);
        const rangePermille =
          separation < attack.minRange
            ? 350
            : separation <= effectiveRange
              ? 1000
              : Math.max(200, Math.floor(1000 / (1 + (separation - effectiveRange) / 8)));
        const areaTargets =
          attack.areaRadius <= 0 || !targetPosition
            ? 1
            : Math.min(
                3,
                opponents.filter((candidate) => {
                  const position = knownPosition(candidate);
                  return position !== null && distance(position, targetPosition) <= attack.areaRadius;
                }).length
              );
        const dps = (attack.damage * areaTargets * 1000) / Math.max(1, attack.cooldownTicks);
        const readinessPermille =
          attack.remainingCooldownTicks == null
            ? 850
            : Math.max(
                200,
                1000 - Math.floor((attack.remainingCooldownTicks * 800) / Math.max(1, attack.cooldownTicks))
              );
        return Math.max(attackBest, (dps * rangePermille * readinessPermille) / 1_000_000);
      }, 0);
    return Math.max(best, attackValue);
  }, 0);
  const effectiveDurability =
    (profile.maxHealth * actor.healthPermille.value) / 1000 + (profile.maxArmour * profile.armourPermille) / 1000;
  const support =
    profile.passiveRegenerationPerSecond +
    (profile.healing ? (profile.healing.amount * 1000) / Math.max(1, profile.healing.cooldownTicks) : 0);
  if (bestDps <= 0 && support <= 0) return 0;
  return Math.max(1, Math.floor(((bestDps + support) * effectiveDurability * statusPenalty) / 1_000_000));
}

/** Bounded local estimate used for a tactical preference, never as self-proving outcome evidence. */
export function estimateAiEngagementV1(
  friendly: readonly AiObservedActorV1[],
  hostile: readonly AiObservedActorV1[],
  pairQuota: number
): Readonly<{
  ratioPermille: number;
  confidencePermille: number;
  predictedFriendlyLossPermille: number;
  predictedEnemyLossPermille: number;
}> {
  const boundedFriendlies = friendly.slice(0, Math.max(1, pairQuota));
  const boundedHostiles = hostile.slice(0, Math.max(1, Math.floor(pairQuota / Math.max(1, boundedFriendlies.length))));
  const friendlyStrength = boundedFriendlies.reduce(
    (total, actor) => total + actorCombatStrength(actor, boundedHostiles),
    0
  );
  const hostileStrength = boundedHostiles.reduce(
    (total, actor) => total + actorCombatStrength(actor, boundedFriendlies),
    0
  );
  const knownProfiles = [...boundedFriendlies, ...boundedHostiles].filter(
    (actor) => actor.combatProfile?.status === "known" && actor.healthPermille?.status === "known"
  ).length;
  const totalActors = boundedFriendlies.length + boundedHostiles.length;
  const confidencePermille = totalActors === 0 ? 0 : Math.floor((knownProfiles * 1000) / totalActors);
  const ratioPermille =
    hostileStrength <= 0
      ? friendlyStrength > 0
        ? 2000
        : 1000
      : Math.max(0, Math.min(4000, Math.floor((friendlyStrength * 1000) / hostileStrength)));
  return {
    ratioPermille,
    confidencePermille,
    predictedFriendlyLossPermille: Math.max(
      0,
      Math.min(1000, Math.floor((hostileStrength * 1000) / Math.max(1, friendlyStrength + hostileStrength)))
    ),
    predictedEnemyLossPermille: Math.max(
      0,
      Math.min(1000, Math.floor((friendlyStrength * 1000) / Math.max(1, friendlyStrength + hostileStrength)))
    )
  };
}

export function objectiveScore(
  actor: AiObservedActorV1,
  origin: Vector3Simple | null,
  routeStatus: AiObservationV1["accessProducts"][number]["status"] | "not_recorded"
): number {
  const families = new Set(actor.capabilities.map((capability) => capability.family));
  const strategicValue =
    (actor.mainBuilding?.status === "known" && actor.mainBuilding.value ? 360 : 0) +
    (families.has("produce") ? 220 : 0) +
    (families.has("drop_off") ? 180 : 0) +
    (families.has("gather") ? 120 : 0) +
    (families.has("attack") ? 160 : 40);
  const damaged = actor.healthPermille?.status === "known" ? 1000 - actor.healthPermille.value : 0;
  const travel = origin && knownPosition(actor) ? Math.min(300, distance(origin, knownPosition(actor)!) * 10) : 300;
  const routeRisk =
    routeStatus === "blocked" || routeStatus === "service_failed"
      ? 500
      : routeStatus === "not_ready" || routeStatus === "unknown"
        ? 180
        : routeStatus === "not_recorded"
          ? 100
          : 0;
  return Math.max(0, Math.min(1000, strategicValue + Math.floor(damaged / 4) - travel - routeRisk));
}

export function assignDamage(
  attackers: readonly AiObservedActorV1[],
  targets: readonly AiObservedActorV1[],
  tick: number,
  squadId: AiSquadStateV1["squadId"],
  previous: NonNullable<AiSquadStateV1["tactics"]>["damageReservations"],
  outcomes: AiBrainStateV1["pendingOutcomes"]
): NonNullable<AiSquadStateV1["tactics"]>["damageReservations"] {
  const remaining = new Map(
    targets.map((target) => {
      const profile = target.combatProfile?.status === "known" ? target.combatProfile.value : null;
      return [
        target.actorId,
        target.healthPermille?.status === "known" && profile
          ? {
              health: (profile.maxHealth * target.healthPermille.value) / 1000,
              armour: (profile.maxArmour * profile.armourPermille) / 1000
            }
          : { health: Number.MAX_SAFE_INTEGER, armour: 0 }
      ] as const;
    })
  );
  const reserveDamage = (targetId: ActorId, damage: number): void => {
    const durability = remaining.get(targetId);
    if (!durability) return;
    if (durability.armour > 0) durability.armour = Math.max(0, durability.armour - damage);
    else durability.health = Math.max(0, durability.health - damage);
  };
  const targetIds = new Set(targets.map((target) => target.actorId));
  const attackerIds = new Set(attackers.map((attacker) => attacker.actorId));
  const failedEffects = new Set(
    outcomes
      .filter((outcome) => outcome.kind === "rejected" || outcome.kind === "cancelled" || outcome.kind === "failed")
      .map((outcome) => outcome.identity.effectId)
  );
  const reservations: Array<NonNullable<AiSquadStateV1["tactics"]>["damageReservations"][number]> = previous
    .filter(
      (entry) =>
        entry.impactTick >= tick &&
        attackerIds.has(entry.actorId) &&
        targetIds.has(entry.targetActorId) &&
        (!entry.effectId || !failedEffects.has(entry.effectId as AiIntentV1["effectId"]))
    )
    .map((entry) => ({ ...entry }));
  for (const reservation of reservations) {
    reserveDamage(reservation.targetActorId, reservation.expectedDamage);
  }
  const reservedAttackers = new Set(reservations.map((reservation) => reservation.actorId));
  for (const attacker of attackers) {
    if (reservedAttackers.has(attacker.actorId)) continue;
    const target = targets.find((candidate) => {
      const durability = remaining.get(candidate.actorId);
      return (
        canTarget(attacker, candidate) && durability !== undefined && (durability.armour > 0 || durability.health > 0)
      );
    });
    const targetMovement = target ? movementDomains(target) : [];
    const attack =
      attacker.combatProfile?.status === "known"
        ? [...attacker.combatProfile.value.attacks]
            .filter((entry) => targetMovement.some((domain) => entry.targetDomains.includes(domain)))
            .sort(
              (left, right) =>
                right.damage / Math.max(1, right.cooldownTicks) - left.damage / Math.max(1, left.cooldownTicks) ||
                right.damage - left.damage
            )[0]
        : undefined;
    if (!attack || !target) continue;
    const attackerPosition = knownPosition(attacker);
    const targetPosition = knownPosition(target);
    const arrivalTicks =
      attackerPosition && targetPosition
        ? Math.max(0, Math.ceil(distance(attackerPosition, targetPosition) - attack.range))
        : 0;
    const impactTick = tick + arrivalTicks + attack.impactDelayTicks;
    reservations.push({
      actorId: attacker.actorId,
      targetActorId: target.actorId,
      expectedDamage: attack.damage,
      impactTick,
      effectId: `effect:stage13:${squadId}:damage:${attacker.actorId}:${target.actorId}:${impactTick}`
    });
    reserveDamage(target.actorId, attack.damage);
  }
  return reservations;
}
