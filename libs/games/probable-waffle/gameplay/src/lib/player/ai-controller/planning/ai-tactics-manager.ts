import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline, type AiPlanId } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiSquadStateV1, AiSupportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiDomainV1, AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

export const AI_TACTICS_ATTACK_RATIO_PERMILLE = 1200;
export const AI_TACTICS_RETREAT_RATIO_PERMILLE = 800;
export const AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE = 200;
const TACTICAL_RECONSIDERATION_TICKS = 40;
const MAX_LOCAL_ENEMIES = 16;
const MAX_OBJECTIVE_ALTERNATIVES = 6;
const MAX_RETREAT_CANDIDATES = 64;
const MAX_STRATEGIC_CONTACTS = 64;
const MISSION_EFFECT_EXTENSION_TICKS = 2400;
const STALE_OBJECTIVE_TICKS = 1200;

function knownPosition(actor: AiObservedActorV1 | undefined): Vector3Simple | null {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

function movementDomains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  const domains = [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
  return domains.length > 0 ? domains : ["ground"];
}

function canTarget(attacker: AiObservedActorV1, target: AiObservedActorV1): boolean {
  const targetMovement = movementDomains(target);
  const attacks = attacker.combatProfile?.status === "known" ? attacker.combatProfile.value.attacks : [];
  return attacks.some((attack) => targetMovement.some((domain) => attack.targetDomains.includes(domain)));
}

function canSeeTarget(
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

function isEconomicActor(actor: AiObservedActorV1, catalog: AiCapabilityCatalogV1 | undefined): boolean {
  return (
    catalog?.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0) ?? false
  );
}

function actorCombatStrength(actor: AiObservedActorV1, opponents: readonly AiObservedActorV1[]): number {
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

function objectiveScore(
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

function harmfulAt(position: Vector3Simple, observation: AiObservationV1): boolean {
  return observation.effects.some(
    (effect) => effect.influence === "harmful" && distance(position, effect.position) <= (effect.radius ?? 0) + 1
  );
}

function legalForMembers(
  position: Vector3Simple,
  observation: AiObservationV1,
  members: readonly AiObservedActorV1[]
): boolean {
  if (harmfulAt(position, observation)) return false;
  const cell = observation.map?.constructionCells?.find(
    (candidate) => candidate.position.x === position.x && candidate.position.y === position.y
  );
  if (!cell) return members.every((member) => movementDomains(member).includes("air"));
  return members.every((member) =>
    movementDomains(member).some(
      (domain) =>
        domain === "air" || (domain === "water" ? cell.waterPassable : cell.groundPassable && !cell.observedBlocked)
    )
  );
}

function safeRetreatPosition(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  members: readonly AiObservedActorV1[]
): Vector3Simple | null {
  const anchors = state.bases
    .filter((base) => base.active && base.anchorPosition)
    .map((base) => base.anchorPosition!)
    .sort((left, right) => left.x - right.x || left.y - right.y);
  const cells = observation.map?.constructionCells ?? [];
  const candidates = anchors.slice(0, 4).flatMap((anchor) => [
    ...cells
      .map((cell) => cell.position)
      .sort((left, right) => distance(left, anchor) - distance(right, anchor))
      .slice(0, MAX_RETREAT_CANDIDATES),
    anchor
  ]);
  return candidates.find((candidate) => legalForMembers(candidate, observation, members)) ?? null;
}

function splitDomainSquads(
  squads: readonly AiSquadStateV1[],
  actorById: ReadonlyMap<ActorId, AiObservedActorV1>
): AiSquadStateV1[] {
  const split = squads.flatMap((squad) => {
    const groups = new Map<AiDomainV1, ActorId[]>();
    for (const actorId of squad.actorIds) {
      const actor = actorById.get(actorId);
      const domain = actor
        ? (movementDomains(actor)[0] ?? "ground")
        : squad.domain === "mixed"
          ? "ground"
          : squad.domain;
      groups.set(domain, [...(groups.get(domain) ?? []), actorId]);
    }
    const ordered = [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0]));
    if (ordered.length <= 1) return [squad];
    return ordered.map(([domain, actorIds], index) => ({
      ...squad,
      squadId: index === 0 ? squad.squadId : (`${squad.squadId}:domain:${domain}` as AiSquadStateV1["squadId"]),
      domain,
      actorIds
    }));
  });
  return split.filter(
    (squad, index, all) => all.findIndex((candidate) => candidate.squadId === squad.squadId) === index
  );
}

function intentBase(
  observation: AiObservationV1,
  squad: AiSquadStateV1,
  suffix: string,
  utility: number
): Pick<
  AiIntentV1,
  | "intentId"
  | "effectId"
  | "planId"
  | "demandId"
  | "lane"
  | "proposedTick"
  | "urgencyClass"
  | "utility"
  | "preconditions"
  | "claims"
  | "reasonCode"
> {
  const planId = `plan:${squad.squadId}` as AiPlanId;
  return {
    intentId: `intent:stage13:${observation.generation}:${squad.squadId}:${suffix}` as AiIntentV1["intentId"],
    effectId: `effect:stage13:${squad.squadId}:${suffix}:${observation.tick}` as AiIntentV1["effectId"],
    planId,
    demandId: null,
    lane: "army_threat",
    proposedTick: observation.tick,
    urgencyClass: squad.role === "defense" ? 1 : 4,
    utility,
    preconditions: [{ kind: "plan_active", planId }],
    claims: squad.actorIds.map((actorId) => ({
      claimId: `claim:stage13:actor:${actorId}` as AiIntentV1["claims"][number]["claimId"],
      kind: "actor" as const,
      actorId
    })),
    reasonCode: `stage13:${suffix}`
  };
}

function assignDamage(
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

function formationPositions(
  members: readonly AiObservedActorV1[],
  anchor: Vector3Simple | null,
  observation: AiObservationV1
): NonNullable<AiSquadStateV1["tactics"]>["assignedPositions"] {
  if (!anchor) return [];
  const spacing = Math.max(
    1,
    ...members.map((actor) =>
      actor.combatProfile?.status === "known"
        ? Math.ceil(Math.max(0, ...actor.combatProfile.value.attacks.map((attack) => attack.minRange))) + 1
        : 1
    )
  );
  const offsets = [
    { x: spacing, y: 0 },
    { x: -spacing, y: 0 },
    { x: 0, y: spacing },
    { x: 0, y: -spacing },
    { x: spacing, y: spacing },
    { x: -spacing, y: spacing },
    { x: spacing, y: -spacing },
    { x: -spacing, y: -spacing }
  ];
  return members.slice(0, offsets.length).flatMap((actor, index) => {
    const offset = offsets[index]!;
    const candidate = { x: anchor.x + offset.x, y: anchor.y + offset.y, z: anchor.z };
    return legalForMembers(candidate, observation, [actor]) ? [{ actorId: actor.actorId, position: candidate }] : [];
  });
}

function boundedTacticalIntents(intents: readonly AiIntentV1[], actorOrderLimit: number): readonly AiIntentV1[] {
  const accepted: AiIntentV1[] = [];
  let actorOrders = 0;
  for (const intent of [...intents].sort(
    (left, right) =>
      left.urgencyClass - right.urgencyClass ||
      right.utility - left.utility ||
      left.intentId.localeCompare(right.intentId)
  )) {
    const count = "actorIds" in intent ? intent.actorIds.length : "actorId" in intent ? 1 : 0;
    if (actorOrders + count > Math.max(1, actorOrderLimit)) continue;
    accepted.push(intent);
    actorOrders += count;
  }
  return accepted;
}

/** Owns deterministic local combat preservation, focus reservations, support windows and tactical recovery. */
export class AiTacticsManager implements AiProposalManagerV1 {
  readonly managerId = "stagez13.tactics";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog?: () => AiCapabilityCatalogV1 | undefined
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog?.();
    const actorById = new Map(observation.actors.map((actor) => [actor.actorId, actor]));
    const transportOwned = new Set(
      state.transport
        .filter((plan) => !["handoff", "completed", "cancelled", "failed"].includes(plan.phase))
        .flatMap((plan) => [...plan.passengerIds])
    );
    const visibleEnemies = observation.actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible" && knownPosition(actor))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const assignedBeforeReinforcement = new Set(state.squads.flatMap((squad) => [...squad.actorIds]));
    const homeAnchors = state.bases
      .filter((base) => base.active && base.anchorPosition)
      .map((base) => base.anchorPosition!);
    const underLocalPressure = visibleEnemies.some(
      (enemy) =>
        enemy.housingCost.status === "known" &&
        enemy.housingCost.value > 0 &&
        homeAnchors.some((anchor) => distance(anchor, knownPosition(enemy)!) <= 12)
    );
    const reinforcementActors = observation.actors
      .filter(
        (actor) => actor.relation === "self" && actor.containedInActorId == null && !transportOwned.has(actor.actorId)
      )
      .filter((actor) => !isEconomicActor(actor, catalog))
      .filter((actor) => actor.combatProfile?.status === "known" && actor.combatProfile.value.attacks.length > 0)
      .filter((actor) => !assignedBeforeReinforcement.has(actor.actorId))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const augmentedSquads = state.squads.map((squad) => ({ ...squad, actorIds: [...squad.actorIds] }));
    for (const actor of reinforcementActors) {
      const destination =
        augmentedSquads.find((squad) => underLocalPressure && squad.role === "defense") ??
        augmentedSquads.find((squad) => squad.role === "attack") ??
        augmentedSquads.find((squad) => squad.role === "reinforcement" || squad.role === "reserve");
      if (destination) destination.actorIds = [...destination.actorIds, actor.actorId];
    }
    const claimedActors = new Set<ActorId>();
    const priority: Record<AiSquadStateV1["role"], number> = {
      defense: 0,
      escort: 1,
      attack: 2,
      reinforcement: 3,
      reserve: 4,
      scout: 5
    };
    const squads = splitDomainSquads(augmentedSquads, actorById).sort(
      (left, right) => priority[left.role] - priority[right.role] || left.squadId.localeCompare(right.squadId)
    );
    const updates: AiSquadStateV1[] = [];
    const intents: AiIntentV1[] = [];
    const terminalEffectIds = new Set(
      state.pendingOutcomes
        .filter(
          (outcome) =>
            outcome.kind === "completed" ||
            outcome.kind === "rejected" ||
            outcome.kind === "cancelled" ||
            outcome.kind === "failed"
        )
        .map((outcome) => outcome.identity.effectId)
    );
    const support: AiSupportStateV1[] = state.support
      .filter((plan) => plan.expiresAt === null || plan.expiresAt.dueTick > observation.tick)
      .filter((plan) => plan.effectId == null || !terminalEffectIds.has(plan.effectId as AiIntentV1["effectId"]))
      .slice(0, 32);
    const existingSupportIds = new Set(support.map((plan) => plan.planId));

    for (const squad of squads) {
      if (squad.state === "completed" || squad.state === "cancelled") continue;
      const objectiveActor = squad.objectiveId ? actorById.get(squad.objectiveId as ActorId) : undefined;
      const objectiveObservedTick =
        objectiveActor?.logicalPosition.status === "known"
          ? objectiveActor.logicalPosition.observedTick
          : objectiveActor?.observedTick;
      if (
        squad.role === "attack" &&
        squad.objectiveId !== null &&
        ((!squad.objectiveId.startsWith("hypothesis:") &&
          objectiveActor === undefined &&
          visibleEnemies.length === 0 &&
          observation.tick -
            (objectiveObservedTick ??
              squad.lifecycle?.lastUsefulEffectTick ??
              squad.lifecycle?.createdTick ??
              observation.tick) >
            STALE_OBJECTIVE_TICKS) ||
          (objectiveActor?.visibility === "last_seen" &&
            objectiveObservedTick !== undefined &&
            observation.tick - objectiveObservedTick > STALE_OBJECTIVE_TICKS))
      ) {
        updates.push({
          ...squad,
          actorIds: [],
          state: "completed",
          ...(squad.lifecycle ? { lifecycle: { ...squad.lifecycle, terminalReason: "stale_contact_released" } } : {})
        });
        continue;
      }
      const members = squad.actorIds
        .filter((actorId) => !claimedActors.has(actorId) && !transportOwned.has(actorId))
        .map((actorId) => actorById.get(actorId))
        .filter(
          (actor): actor is AiObservedActorV1 =>
            actor !== undefined &&
            actor.relation === "self" &&
            actor.containedInActorId == null &&
            !isEconomicActor(actor, catalog)
        )
        .sort((left, right) => left.actorId.localeCompare(right.actorId));
      members.forEach((actor) => claimedActors.add(actor.actorId));
      const origin = knownPosition(members[0]);
      const localEnemies = visibleEnemies
        .filter((enemy) => !origin || distance(origin, knownPosition(enemy)!) <= 18)
        .slice(0, MAX_LOCAL_ENEMIES);
      const sourceNodeId = members[0]?.accessNodeId.status === "known" ? members[0].accessNodeId.value : null;
      const alternatives = visibleEnemies
        .slice(0, MAX_STRATEGIC_CONTACTS)
        .map((enemy) => {
          const targetNodeId = enemy.accessNodeId.status === "known" ? enemy.accessNodeId.value : null;
          const routeStatus =
            sourceNodeId && targetNodeId
              ? (observation.accessProducts.find(
                  (product) => product.fromNodeId === sourceNodeId && product.toNodeId === targetNodeId
                )?.status ?? "not_recorded")
              : "not_recorded";
          return {
            objectiveId: enemy.actorId,
            score: objectiveScore(enemy, origin, routeStatus),
            reason: `visible_value_route_${routeStatus}`
          };
        })
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score || left.objectiveId.localeCompare(right.objectiveId))
        .slice(0, MAX_OBJECTIVE_ALTERNATIVES);
      const previousTarget = squad.tactics?.targetActorId ? actorById.get(squad.tactics.targetActorId) : undefined;
      const bestTarget = alternatives[0];
      const rememberedTarget = squad.objectiveId ? actorById.get(squad.objectiveId as ActorId) : undefined;
      const retainPrevious = Boolean(
        previousTarget &&
          previousTarget.visibility === "visible" &&
          squad.tactics &&
          bestTarget &&
          bestTarget.score * 1000 < squad.tactics.targetScore * (1000 + AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE)
      );
      const targetId = retainPrevious
        ? previousTarget?.actorId
        : ((bestTarget?.objectiveId as ActorId | undefined) ?? rememberedTarget?.actorId);
      const target = targetId ? actorById.get(targetId) : undefined;
      const visibleTarget = target?.visibility === "visible" ? target : undefined;
      const targetAwareMembers = visibleTarget
        ? members.filter((member) => canTarget(member, visibleTarget) && canSeeTarget(member, visibleTarget, catalog))
        : [];
      const estimate = estimateAiEngagementV1(members, localEnemies, this.profile.maxLocalEngagementPairsPerStep);
      const retreat = safeRetreatPosition(observation, state, members);
      const fortificationPlan =
        squad.role === "defense"
          ? (state.fortifications.find(
              (plan) =>
                plan.lifecycle !== "abandoned" &&
                squad.lifecycle?.protectedBaseId != null &&
                plan.protectedBaseIds.includes(squad.lifecycle.protectedBaseId)
            ) ?? state.fortifications.find((plan) => plan.lifecycle !== "abandoned"))
          : undefined;
      const reachableDefenderPosts = fortificationPlan?.graph?.defenderPosts.filter((post) => post.reachable) ?? [];
      const topologyLost = Boolean(
        fortificationPlan?.graph?.defenderPosts.length && reachableDefenderPosts.length === 0
      );
      const landedForRegroup = state.transport.some(
        (plan) => plan.phase === "handoff" && plan.passengerIds.some((actorId) => squad.actorIds.includes(actorId))
      );
      const previousRetreat = squad.state === "retreat" || squad.state === "retreating";
      const favorable =
        estimate.ratioPermille >= AI_TACTICS_ATTACK_RATIO_PERMILLE && estimate.confidencePermille >= 500;
      const unfavorable =
        estimate.ratioPermille < AI_TACTICS_RETREAT_RATIO_PERMILLE ||
        members.filter((actor) => actor.healthPermille?.status === "known" && actor.healthPermille.value <= 250)
          .length >= Math.max(1, Math.ceil(members.length / 3));
      const awaitingLaunch = ["forming", "assemble", "rally", "ready", "advance", "moving"].includes(squad.state);
      const forcedDecision =
        awaitingLaunch && (squad.lifecycle?.assemblyDeadline.dueTick ?? observation.tick) <= observation.tick;
      const usefulEffectTick = state.pendingOutcomes
        .filter((outcome) => outcome.identity.effectId.startsWith(`effect:stage13:${squad.squadId}:`))
        .filter((outcome) => {
          const effectId = outcome.identity.effectId;
          if (effectId.includes(":spell:")) return outcome.kind === "applied" || outcome.kind === "completed";
          return (effectId.includes(":damage:") || effectId.includes(":heal:")) && outcome.kind === "completed";
        })
        .reduce<number | null>(
          (latest, outcome) => (latest === null ? outcome.tick : Math.max(latest, outcome.tick)),
          squad.lifecycle?.lastUsefulEffectTick ?? null
        );
      const missionProgressed =
        usefulEffectTick !== null && usefulEffectTick > (squad.lifecycle?.lastUsefulEffectTick ?? -1);
      const missionExpired =
        ["attack", "escort", "reinforcement", "scout"].includes(squad.role) &&
        !missionProgressed &&
        (squad.lifecycle?.effectDeadline.dueTick ?? Number.MAX_SAFE_INTEGER) <= observation.tick;
      const missionRecoveryExhausted =
        missionExpired &&
        (squad.state === "recover" || squad.state === "recovering") &&
        (squad.lifecycle?.recoveryAttempt ?? 0) >= 1;
      const emptyRecoveryExhausted =
        members.length === 0 && (squad.state === "recover" || squad.state === "recovering");
      const quietState: AiSquadStateV1["state"] = landedForRegroup
        ? "regroup"
        : squad.role === "reserve"
          ? "reserve"
          : squad.role === "defense"
            ? "defend"
            : squad.state === "forming"
              ? "assemble"
              : squad.state === "assemble"
                ? "rally"
                : squad.state === "rally"
                  ? "advance"
                  : previousRetreat
                    ? "recover"
                    : squad.state === "recover" || squad.state === "recovering"
                      ? "rally"
                      : "advance";
      const nextState: AiSquadStateV1["state"] =
        emptyRecoveryExhausted || missionRecoveryExhausted
          ? "completed"
          : members.length === 0 || missionExpired
            ? "recover"
            : (unfavorable || topologyLost) && retreat
              ? "retreat"
              : localEnemies.length > 0 && (favorable || forcedDecision)
                ? "engage"
                : localEnemies.length > 0
                  ? "regroup"
                  : quietState;
      const nowRetreat = nextState === "retreat";
      const oscillationCount =
        previousRetreat !== nowRetreat && squad.tactics && observation.tick <= squad.tactics.nextReconsiderTick
          ? squad.tactics.oscillationCount + 1
          : Math.max(0, (squad.tactics?.oscillationCount ?? 0) - 1);
      const script: NonNullable<AiSquadStateV1["tactics"]>["script"] =
        oscillationCount >= 2
          ? "hold_front"
          : topologyLost
            ? "rampart_withdraw"
            : landedForRegroup
              ? "land_regroup"
              : nextState === "retreat" || nextState === "recover"
                ? "protected_retreat"
                : fortificationPlan?.graph?.breach.missingNodeIds.length
                  ? "rampart_reinforce"
                  : reachableDefenderPosts.length > 0
                    ? "rampart_defend"
                    : squad.domain === "water"
                      ? "naval_control"
                      : localEnemies.some((enemy) => movementDomains(enemy).includes("air"))
                        ? "intercept_air_transport"
                        : members.some(
                              (actor) =>
                                actor.combatProfile?.status === "known" &&
                                actor.combatProfile.value.attacks.some((attack) => attack.minRange > 0)
                            )
                          ? "ranged_distance"
                          : "advance_focus";
      const rampartPositions = reachableDefenderPosts.flatMap(
        (post) => fortificationPlan?.graph?.nodes.find((node) => node.nodeId === post.nodeId)?.position ?? []
      );
      const recoveryPhase =
        nextState === "retreat" ||
        nextState === "recover" ||
        nextState === "assemble" ||
        nextState === "rally" ||
        nextState === "reserve";
      const anchor = recoveryPhase
        ? (retreat ?? origin)
        : nextState === "regroup"
          ? origin
          : (rampartPositions[0] ?? knownPosition(target) ?? origin);
      const mobileReserveCount = reachableDefenderPosts.length > 0 ? Math.max(1, Math.ceil(members.length * 0.25)) : 0;
      const mobileReserveActorIds = members
        .slice(Math.max(0, members.length - mobileReserveCount))
        .map((actor) => actor.actorId);
      const postMembers = members.filter((actor) => !mobileReserveActorIds.includes(actor.actorId));
      const postAssignments = postMembers.slice(0, rampartPositions.length).flatMap((actor, index) => {
        const position = rampartPositions[index]!;
        return legalForMembers(position, observation, [actor]) ? [{ actorId: actor.actorId, position }] : [];
      });
      const postedActorIds = new Set(postAssignments.map((assignment) => assignment.actorId));
      const assignedPositions = [
        ...postAssignments,
        ...formationPositions(
          postMembers.filter((actor) => !postedActorIds.has(actor.actorId)),
          anchor,
          observation
        )
      ];
      const finalState: AiSquadStateV1["state"] =
        oscillationCount >= 2 && nextState === "engage" ? "regroup" : nextState;
      const previousDamageEffectIds = new Set(
        (squad.tactics?.damageReservations ?? [])
          .map((reservation) => reservation.effectId)
          .filter((effectId): effectId is string => effectId !== undefined)
      );
      const damageReservations =
        visibleTarget && targetAwareMembers.length > 0 && (finalState === "engage" || finalState === "advance")
          ? assignDamage(
              targetAwareMembers.slice(0, this.profile.maxActorOrdersPerStep),
              [visibleTarget, ...localEnemies.filter((enemy) => enemy.actorId !== visibleTarget.actorId)],
              observation.tick,
              squad.squadId,
              squad.tactics?.damageReservations ?? [],
              state.pendingOutcomes
            )
          : [];
      const orderSignature = `${finalState}:${script}:${targetId ?? "none"}:${anchor ? `${anchor.x},${anchor.y},${anchor.z}` : "none"}`;
      const previouslyOrderedActorIds =
        squad.tactics?.orderSignature === orderSignature
          ? squad.tactics.orderedActorIds.filter((actorId) => members.some((member) => member.actorId === actorId))
          : [];
      const actorsNeedingOrder = members
        .filter((actor) => {
          if (!previouslyOrderedActorIds.includes(actor.actorId)) return true;
          const activeOrder = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
          if (
            visibleTarget &&
            (finalState === "engage" || finalState === "advance") &&
            targetAwareMembers.some((member) => member.actorId === actor.actorId)
          ) {
            return activeOrder?.orderType !== OrderType.Attack || activeOrder.targetActorId !== visibleTarget.actorId;
          }
          return false;
        })
        .map((actor) => actor.actorId);
      const materiallyChanged = squad.tactics?.orderSignature !== orderSignature || actorsNeedingOrder.length > 0;
      const previousMemberCount = squad.tactics?.lastObservedMemberCount ?? members.length;
      const updated: AiSquadStateV1 = {
        ...squad,
        actorIds: finalState === "completed" ? [] : members.map((actor) => actor.actorId),
        objectiveId: targetId ?? squad.objectiveId,
        state: finalState,
        ...(squad.lifecycle
          ? {
              lifecycle: {
                ...squad.lifecycle,
                lastUsefulEffectTick: usefulEffectTick,
                ...(missionProgressed
                  ? {
                      effectDeadline: aiDeadline(observation.tick + MISSION_EFFECT_EXTENSION_TICKS),
                      terminalReason: null
                    }
                  : missionExpired && squad.state !== "recover" && squad.state !== "recovering"
                    ? {
                        effectDeadline: aiDeadline(observation.tick + MISSION_EFFECT_EXTENSION_TICKS),
                        recoveryAttempt: squad.lifecycle.recoveryAttempt + 1,
                        terminalReason: "effect_deadline_recovery"
                      }
                    : {}),
                ...(finalState === "completed"
                  ? {
                      terminalReason: members.length === 0 ? "no_members_released" : "effect_deadline_exhausted"
                    }
                  : {}),
                ...(!missionExpired &&
                (squad.state === "recover" || squad.state === "recovering") &&
                finalState !== "recover"
                  ? { terminalReason: null }
                  : {})
              }
            }
          : {}),
        tactics: {
          taskForceId: `task-force:${squad.lifecycle?.targetPlayerNumber ?? "local"}`,
          script,
          targetActorId: targetId ?? null,
          targetScore: retainPrevious
            ? squad.tactics!.targetScore
            : (bestTarget?.score ?? squad.tactics?.targetScore ?? 0),
          engagementRatioPermille: estimate.ratioPermille,
          confidencePermille: estimate.confidencePermille,
          predictedFriendlyLossPermille: estimate.predictedFriendlyLossPermille,
          predictedEnemyLossPermille: estimate.predictedEnemyLossPermille,
          lastObservedMemberCount: members.length,
          observedLossCount:
            (squad.tactics?.observedLossCount ?? 0) + Math.max(0, previousMemberCount - members.length),
          lastTransitionTick:
            squad.state === finalState ? (squad.tactics?.lastTransitionTick ?? observation.tick) : observation.tick,
          nextReconsiderTick: observation.tick + TACTICAL_RECONSIDERATION_TICKS,
          oscillationCount,
          orderSignature,
          orderedActorIds: previouslyOrderedActorIds,
          assignedPositions,
          damageReservations,
          protectedRouteNodeIds: [
            squad.lifecycle?.retreatNodeId,
            squad.lifecycle?.rallyNodeId,
            fortificationPlan?.graph?.openingNodeId,
            ...reachableDefenderPosts.map((post) => post.nodeId)
          ].filter((id): id is string => id !== null && id !== undefined),
          mobileReserveActorIds,
          objectiveAlternatives: alternatives
        }
      };
      updates.push(updated);

      if (materiallyChanged && updated.state === "retreat" && retreat) {
        const batch = actorsNeedingOrder.slice(0, this.profile.maxActorOrdersPerStep);
        if (batch.length > 0)
          intents.push({
            ...intentBase(
              observation,
              { ...updated, actorIds: batch },
              `protected_retreat:${batch[0]}:${batch[batch.length - 1]}`,
              980
            ),
            kind: "move",
            actorIds: batch,
            logicalPosition: retreat
          });
      } else if (
        materiallyChanged &&
        (updated.state === "engage" || updated.state === "advance") &&
        visibleTarget &&
        damageReservations.length > 0
      ) {
        for (const reservation of damageReservations) {
          if (reservation.effectId && previousDamageEffectIds.has(reservation.effectId)) continue;
          const attacker = actorById.get(reservation.actorId);
          const reservedTarget = actorById.get(reservation.targetActorId);
          if (!attacker || !reservedTarget || !canTarget(attacker, reservedTarget)) continue;
          const single = { ...updated, actorIds: [attacker.actorId] };
          intents.push({
            ...intentBase(observation, single, `focus:${visibleTarget.actorId}:${attacker.actorId}`, 820),
            ...(reservation.effectId ? { effectId: reservation.effectId as AiIntentV1["effectId"] } : {}),
            preconditions: [
              { kind: "plan_active", planId: `plan:${updated.squadId}` as AiPlanId },
              { kind: "target_visible", actorId: reservedTarget.actorId }
            ],
            kind: "attack",
            actorIds: [attacker.actorId],
            targetActorId: reservation.targetActorId,
            targetPosition: null
          });
        }
      } else if (materiallyChanged && anchor && !["completed", "cancelled"].includes(updated.state)) {
        if (assignedPositions.length > 0) {
          for (const assignment of assignedPositions.filter((entry) => actorsNeedingOrder.includes(entry.actorId))) {
            const positioned = { ...updated, actorIds: [assignment.actorId] };
            intents.push({
              ...intentBase(
                observation,
                positioned,
                `position:${assignment.actorId}`,
                updated.role === "defense" ? 860 : 720
              ),
              kind: "move",
              actorIds: [assignment.actorId],
              logicalPosition: assignment.position
            });
          }
        } else {
          const batch = actorsNeedingOrder.slice(0, this.profile.maxActorOrdersPerStep);
          if (batch.length > 0)
            intents.push({
              ...intentBase(
                observation,
                { ...updated, actorIds: batch },
                `move:${updated.state}:${batch[0]}:${batch[batch.length - 1]}`,
                720
              ),
              kind: "move",
              actorIds: batch,
              logicalPosition: anchor
            });
        }
      }

      this.proposeSupport(
        observation,
        updated,
        members.slice(0, this.profile.maxActorOrdersPerStep),
        localEnemies,
        support,
        intents
      );
    }

    const boundedIntents = boundedTacticalIntents(intents, this.profile.maxActorOrdersPerStep);
    const issuedEffectIds = new Set(boundedIntents.map((intent) => intent.effectId));
    const boundedSupport = support
      .filter(
        (plan) =>
          existingSupportIds.has(plan.planId) ||
          (plan.effectId != null && issuedEffectIds.has(plan.effectId as AiIntentV1["effectId"]))
      )
      .slice(-32);
    const issuedActorsByPlan = new Map<string, ActorId[]>();
    for (const intent of boundedIntents) {
      if (intent.kind !== "move" && intent.kind !== "attack") continue;
      issuedActorsByPlan.set(intent.planId, [...(issuedActorsByPlan.get(intent.planId) ?? []), ...intent.actorIds]);
    }
    const committedUpdates = updates.map((squad) =>
      squad.tactics
        ? {
            ...squad,
            tactics: {
              ...squad.tactics,
              orderedActorIds: [
                ...new Set([
                  ...squad.tactics.orderedActorIds,
                  ...(issuedActorsByPlan.get(`plan:${squad.squadId}`) ?? [])
                ])
              ]
                .filter((actorId) => squad.actorIds.includes(actorId))
                .sort()
            }
          }
        : squad
    );
    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents: boundedIntents,
      reasons: [
        `squads:${committedUpdates.length}`,
        `support:${boundedSupport.length}`,
        `orders:${boundedIntents.length}`
      ],
      statePatch: { squadUpdates: committedUpdates, support: boundedSupport }
    };
  }

  private proposeSupport(
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
        const targets = (
          spell.targetEnemies ? enemies : spell.targetAllies ? wounded : spell.targetSelf ? [healer] : []
        )
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
                knownPosition(candidate) !== null &&
                distance(knownPosition(candidate)!, leftPosition) <= spell.areaRadius
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
}
