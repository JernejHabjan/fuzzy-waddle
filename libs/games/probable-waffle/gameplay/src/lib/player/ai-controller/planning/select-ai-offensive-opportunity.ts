import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiStrategyAssessment } from "../contracts/ai-strategy-assessment";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { canFight, canTarget, distance, domains, position } from "./ai-skirmish-support";
import { selectAiOffensiveForce } from "./select-ai-offensive-force";

export interface AiOffensiveOpportunity {
  readonly opponent: AiObservedActorV1 | undefined;
  readonly attackers: readonly AiObservedActorV1[];
  readonly route: ReturnType<typeof queryAiAccessRouteV1> | undefined;
  readonly assessment: AiStrategyAssessment;
}

const MAX_CANDIDATES = 64;
const TARGET_HYSTERESIS_PERMILLE = 150;
const ALTERNATIVE_CORE_SCORE_ADVANTAGE = 200;
const WORKFORCE_RECOVERY_FLOOR = 6;
const FAILURE_MEMORY_TICKS = 4000;
const REMEMBERED_OBJECTIVE_MAX_AGE_TICKS = 400;
const USEFUL_REMEMBERED_OBJECTIVE_MAX_AGE_TICKS = 1200;
const NATIVE_PURSUIT_ORDER_MAX_AGE_TICKS = 200;
const NATIVE_PURSUIT_DESTINATION_RADIUS = 8;
const NATIVE_PURSUIT_ARRIVAL_RADIUS = 6;

function recentFailedMission(context: AiSkirmishProposalContext): AiStrategyAssessment["recentFailure"] {
  const previous = context.state.strategy.assessment;
  const remembered = previous?.recentFailure;
  const completed = context.state.squads
    .filter(
      (squad) =>
        squad.role === "attack" &&
        squad.state === "completed" &&
        (squad.lifecycle?.terminalReason === "no_members_released" ||
          squad.lifecycle?.terminalReason === "effect_deadline_exhausted")
    )
    .sort((left, right) => (right.lifecycle?.createdTick ?? 0) - (left.lifecycle?.createdTick ?? 0))[0];
  if (!completed?.lifecycle || remembered?.missionCreatedTick === completed.lifecycle.createdTick) return remembered;
  const targetActorId =
    completed.objectiveId && !completed.objectiveId.startsWith("hypothesis:")
      ? completed.objectiveId
      : (previous?.targetActorId ?? null);
  const repeatedFailures =
    remembered?.targetActorId === targetActorId &&
    context.observation.tick - remembered.observedTick <= FAILURE_MEMORY_TICKS
      ? Math.min(3, remembered.repeatedFailures + 1)
      : 1;
  return {
    missionCreatedTick: completed.lifecycle.createdTick,
    observedTick: context.observation.tick,
    targetActorId,
    losses: completed.tactics?.observedLossCount ?? 0,
    repeatedFailures
  };
}

function isCore(actor: AiObservedActorV1): boolean {
  return actor.mainBuilding?.status === "known" && actor.mainBuilding.value === true;
}

function targetValue(actor: AiObservedActorV1): number {
  if (isCore(actor)) return 1200;
  const families = new Set(actor.capabilities.map((capability) => capability.family));
  if (families.has("produce")) return 720;
  if (families.has("drop_off")) return 620;
  if (families.has("gather")) return 520;
  return canFight(actor) ? 280 : 360;
}

function threatNear(
  context: AiSkirmishProposalContext,
  target: AiObservedActorV1,
  attackers: readonly AiObservedActorV1[]
): number {
  const targetPosition = position(target);
  if (!targetPosition) return 0;
  return context.visibleEnemies.filter((enemy) => {
    const enemyPosition = position(enemy);
    return (
      enemyPosition !== undefined &&
      distance(targetPosition, enemyPosition) <= 18 &&
      (enemy.combatProfile?.status === "known"
        ? enemy.combatProfile.value.attacks.some((attack) =>
            attackers.some((actor) => domains(actor).some((domain) => attack.targetDomains.includes(domain)))
          )
        : canFight(enemy) && attackers.some((actor) => canTarget(enemy, actor)))
    );
  }).length;
}

function productionNear(context: AiSkirmishProposalContext, target: AiObservedActorV1): number {
  const targetPosition = position(target);
  if (!targetPosition) return 0;
  return context.visibleEnemies.filter((enemy) => {
    const enemyPosition = position(enemy);
    return (
      enemy.actorId !== target.actorId &&
      enemyPosition !== undefined &&
      distance(targetPosition, enemyPosition) <= 18 &&
      enemy.capabilities.some((capability) => capability.family === "produce")
    );
  }).length;
}

/** Deterministically ranks only observed or remembered, reachable and targetable objectives. */
export function selectAiOffensiveOpportunity(
  context: AiSkirmishProposalContext,
  attackers: readonly AiObservedActorV1[]
): AiOffensiveOpportunity {
  const recentFailure = recentFailedMission(context);
  const contacts = [...context.visibleEnemies, ...context.rememberedEnemies].slice(0, MAX_CANDIDATES);
  const candidates = contacts
    .flatMap((opponent) => {
      const viable = selectAiOffensiveForce(context, opponent, attackers);
      if (!viable) return [];
      const { group: compatibleAttackers, route } = viable;
      const threats = threatNear(context, opponent, compatibleAttackers);
      const producers = productionNear(context, opponent);
      const capable = compatibleAttackers.length;
      const failurePenalty =
        recentFailure?.targetActorId === opponent.actorId &&
        context.observation.tick - recentFailure.observedTick <= FAILURE_MEMORY_TICKS
          ? Math.min(4, recentFailure.repeatedFailures * 2 + Math.floor(recentFailure.losses / 4))
          : 0;
      const required =
        Math.max(producers >= 2 ? 8 : isCore(opponent) ? 2 : 3, Math.ceil(threats * 1.5) + 1) + failurePenalty;
      const travel =
        position(compatibleAttackers[0]) && position(opponent)
          ? distance(position(compatibleAttackers[0])!, position(opponent)!)
          : 40;
      const stale =
        opponent.visibility === "last_seen" ? Math.min(400, context.observation.tick - opponent.observedTick) : 0;
      const routeCost = route.kind === "direct" ? 0 : 180;
      const score =
        targetValue(opponent) - Math.min(400, travel * 8) - threats * 100 - producers * 70 - stale - routeCost;
      return [
        { opponent, attackers: compatibleAttackers, route, score, capable, required, threats, producers, travel }
      ];
    })
    .sort((left, right) => right.score - left.score || left.opponent.actorId.localeCompare(right.opponent.actorId));
  const actionable = candidates.filter((candidate) => candidate.route.kind !== "pending");
  const readyActionable = actionable.filter((candidate) => candidate.capable >= candidate.required);
  const ranked = readyActionable.length > 0 ? readyActionable : actionable.length > 0 ? actionable : candidates;
  const focusedPlayer = context.activeAttack?.lifecycle?.targetPlayerNumber;
  const mission = context.activeAttack;
  const missionMembers = new Set(
    context.state.squads
      .filter(
        (squad) =>
          mission &&
          squad.role === "attack" &&
          squad.squadId.split(":domain:")[0] === mission.squadId.split(":domain:")[0] &&
          squad.objectiveId === mission.objectiveId &&
          !["completed", "cancelled"].includes(squad.state)
      )
      .flatMap((squad) => squad.actorIds)
  );
  // Ranking new opportunities must not pull a progressing attack away from its reachable objective. Retreat and
  // recovery release the strategic target so another viable mission can take over.
  const canRetainObjective =
    mission !== undefined && !["retreat", "retreating", "recover", "recovering"].includes(mission.state);
  const usefulMission =
    canRetainObjective &&
    mission?.lifecycle?.lastUsefulEffectTick != null &&
    mission.lifecycle.effectDeadline.dueTick > context.observation.tick;
  const hasNativeAttackOrder = (targetActorId: string) =>
    attackers.some((actor) => {
      const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      return (
        missionMembers.has(actor.actorId) &&
        order?.orderType === OrderType.Attack &&
        order.targetActorId === targetActorId
      );
    });
  const hasNativePursuitOrder = (target: AiObservedActorV1) => {
    const targetPosition = position(target);
    if (!targetPosition || target.visibility !== "last_seen") return false;
    return attackers.some((actor) => {
      const activeOrder = actor.activeOrder?.status === "known" ? actor.activeOrder : null;
      const order = activeOrder?.value ?? null;
      if (!missionMembers.has(actor.actorId)) return false;
      const followingMove =
        order?.orderType === OrderType.Move &&
        order.targetPosition != null &&
        context.observation.tick - (activeOrder?.observedTick ?? 0) <= NATIVE_PURSUIT_ORDER_MAX_AGE_TICKS &&
        distance(order.targetPosition, targetPosition) <= NATIVE_PURSUIT_DESTINATION_RADIUS;
      const actorPosition = position(actor);
      const arrivedAtObjective =
        (order?.orderType === OrderType.Move || order?.orderType === OrderType.Attack) &&
        actorPosition !== undefined &&
        distance(actorPosition, targetPosition) <= NATIVE_PURSUIT_ARRIVAL_RADIUS;
      return followingMove || arrivedAtObjective;
    });
  };
  const workingObjective = canRetainObjective
    ? actionable.find(
        (candidate) =>
          (candidate.opponent.actorId === mission?.objectiveId ||
            `hypothesis:${candidate.opponent.evidenceId}` === mission?.objectiveId) &&
          (candidate.opponent.visibility === "visible" ||
            (context.observation.tick - candidate.opponent.observedTick <= REMEMBERED_OBJECTIVE_MAX_AGE_TICKS &&
              hasNativePursuitOrder(candidate.opponent)) ||
            (usefulMission &&
              context.observation.tick - candidate.opponent.observedTick <= USEFUL_REMEMBERED_OBJECTIVE_MAX_AGE_TICKS)) &&
          (candidate.capable >= candidate.required ||
            usefulMission ||
            hasNativeAttackOrder(candidate.opponent.actorId) ||
            !readyActionable.some((alternative) => alternative.opponent.actorId !== candidate.opponent.actorId)) &&
          (usefulMission ||
            hasNativeAttackOrder(candidate.opponent.actorId) ||
            hasNativePursuitOrder(candidate.opponent))
      )
    : undefined;
  const focused = ranked.find((candidate) => candidate.opponent.owner === focusedPlayer);
  const best = ranked[0];
  const visibleReachableCore = actionable
    .filter(
      (candidate) =>
        candidate.opponent.visibility === "visible" &&
        isCore(candidate.opponent) &&
        candidate.route.kind === "direct"
    )
    .sort((left, right) => right.score - left.score || left.opponent.actorId.localeCompare(right.opponent.actorId))[0];
  const retainedRememberedObjective =
    workingObjective?.opponent.visibility === "last_seen" &&
    (hasNativePursuitOrder(workingObjective.opponent) ||
      (usefulMission &&
        context.observation.tick - workingObjective.opponent.observedTick <=
          USEFUL_REMEMBERED_OBJECTIVE_MAX_AGE_TICKS));
  const rememberedCore = actionable
    .filter(
      (candidate) =>
        candidate.opponent.visibility === "last_seen" &&
        isCore(candidate.opponent)
    )
    .sort((left, right) => right.score - left.score || left.opponent.actorId.localeCompare(right.opponent.actorId))[0];
  const scoutingCore = context.activeScout
    ? actionable.find(
        (candidate) =>
          isCore(candidate.opponent) &&
          context.activeScout?.objectiveId === `core:${candidate.opponent.evidenceId}`
      )
    : undefined;
  const coreScoutTarget = scoutingCore ?? rememberedCore;
  const hasMateriallyBetterReadyAlternative =
    visibleReachableCore !== undefined &&
    ranked.some(
      (candidate) =>
        candidate !== visibleReachableCore &&
        candidate.capable >= candidate.required &&
        candidate.score >= visibleReachableCore.score + ALTERNATIVE_CORE_SCORE_ADVANTAGE
    );
  const competingVisibleCore =
    visibleReachableCore &&
    !retainedRememberedObjective &&
    !hasMateriallyBetterReadyAlternative &&
    (coreScoutTarget !== undefined || mission?.objectiveId !== visibleReachableCore.opponent.actorId)
      ? visibleReachableCore
      : undefined;
  const selected =
    competingVisibleCore ??
    scoutingCore ??
    rememberedCore ??
    workingObjective ??
    (focused &&
    best &&
    focused.score >= best.score - Math.max(50, Math.floor((Math.abs(best.score) * TARGET_HYSTERESIS_PERMILLE) / 1000))
      ? focused
      : best);
  const selectionSource: AiStrategyAssessment["selectionSource"] =
    selected && scoutingCore === selected
      ? "active_core_scout"
      : selected && rememberedCore === selected
        ? "remembered_core"
        : selected && visibleReachableCore === selected
          ? "visible_core"
          : selected && workingObjective === selected
            ? "working_objective"
            : selected && focused === selected
              ? "focused_opponent"
              : selected
                ? "highest_ranked"
                : undefined;
  const workers = context.observation.actors.filter(
    (actor) => actor.relation === "self" && actor.capabilities.some((capability) => capability.family === "gather")
  ).length;
  const pendingRoute = selected?.route.kind === "pending";
  const ready = selected ? !pendingRoute && selected.capable >= selected.required : false;
  const recovering =
    context.state.opening.plan.lifecycle === "completed" && workers < WORKFORCE_RECOVERY_FLOOR && !ready;
  const rebuildingFailedMission =
    selected !== undefined &&
    recentFailure?.targetActorId === selected.opponent.actorId &&
    context.observation.tick < recentFailure.observedTick + Math.min(400, recentFailure.repeatedFailures * 100);
  const assessmentReason = selected
    ? pendingRoute
      ? "route_pending"
      : recovering || rebuildingFailedMission
        ? recovering
          ? "workforce_below_recovery_floor"
          : "recent_failed_mission_rebuild"
        : ready
          ? "credible_force_and_route"
          : selected.producers >= 2
            ? "assembling_against_developed_base"
            : "assembling_compatible_force"
    : "no_reachable_observed_objective";
  const choice: AiStrategyAssessment["choice"] = selected
    ? pendingRoute
      ? "scout"
      : recovering || rebuildingFailedMission
        ? "recover"
        : isCore(selected.opponent) && ready
          ? "finish"
          : "pressure"
    : "scout";
  const travelTicks = selected ? Math.max(100, selected.travel * 20) : null;
  return {
    opponent: selected?.opponent,
    attackers: selected?.attackers ?? [],
    route: selected?.route,
    assessment: {
      choice,
      reason: assessmentReason,
      ...(selectionSource ? { selectionSource } : {}),
      targetActorId: selected?.opponent.actorId ?? null,
      routeDomain: selected?.route.kind === "direct" ? selected.route.domain : null,
      readyForce: selected?.capable ?? 0,
      requiredForce: selected?.required ?? 0,
      visibleThreatCount: selected?.threats ?? 0,
      confidencePermille: selected?.opponent.visibility === "visible" ? 1000 : selected ? 550 : 0,
      expectedEffectTick: travelTicks === null || pendingRoute ? null : context.observation.tick + travelTicks,
      reconsiderTick:
        rebuildingFailedMission && recentFailure
          ? recentFailure.observedTick + Math.min(400, recentFailure.repeatedFailures * 100)
          : context.observation.tick + (ready ? 40 : 100),
      ...(recentFailure ? { recentFailure } : {}),
      alternatives: candidates
        .filter((candidate) => candidate !== selected)
        .slice(0, 4)
        .map((candidate) => ({
          targetActorId: candidate.opponent.actorId,
          reason: [
            `score_${candidate.score}`,
            `threats_${candidate.threats}`,
            `route_${candidate.route.kind}`,
            `force_${candidate.capable}_${candidate.required}`,
            candidate.opponent.visibility,
            `core_${isCore(candidate.opponent)}`,
            `working_${candidate === workingObjective}`
          ].join("_")
        }))
    }
  };
}
