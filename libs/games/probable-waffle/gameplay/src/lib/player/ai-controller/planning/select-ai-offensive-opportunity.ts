import type { AiRouteRequestV1 } from "../contracts/ai-access-graph-v1";
import type { AiStrategyAssessment } from "../contracts/ai-strategy-assessment";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { canFight, canTarget, distance, domains, node, position, routeCapability } from "./ai-skirmish-support";

export interface AiOffensiveOpportunity {
  readonly opponent: AiObservedActorV1 | undefined;
  readonly attackers: readonly AiObservedActorV1[];
  readonly route: ReturnType<typeof queryAiAccessRouteV1> | undefined;
  readonly assessment: AiStrategyAssessment;
}

const MAX_CANDIDATES = 64;
const TARGET_HYSTERESIS_PERMILLE = 150;
const WORKFORCE_RECOVERY_FLOOR = 6;
const FAILURE_MEMORY_TICKS = 4000;

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
  const targetActorId = previous?.targetActorId ?? null;
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

function threatNear(context: AiSkirmishProposalContext, target: AiObservedActorV1): number {
  const targetPosition = position(target);
  if (!targetPosition) return 0;
  return context.visibleEnemies.filter((enemy) => {
    const enemyPosition = position(enemy);
    return (
      enemyPosition !== undefined &&
      distance(targetPosition, enemyPosition) <= 18 &&
      (canFight(enemy) || (enemy.combatProfile?.status === "known" && enemy.combatProfile.value.attacks.length > 0))
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
  const graph = context.observation.map?.accessGraph;
  const recentFailure = recentFailedMission(context);
  const contacts = [...context.visibleEnemies, ...context.rememberedEnemies].slice(0, MAX_CANDIDATES);
  const candidates = contacts
    .flatMap((opponent) => {
      const objectiveDomain = domains(opponent)[0] ?? "ground";
      const domainAttackers = attackers.filter(
        (attacker) => canTarget(attacker, opponent) && domains(attacker).includes(objectiveDomain)
      );
      const airAttackers = attackers.filter(
        (attacker) => canTarget(attacker, opponent) && domains(attacker).includes("air")
      );
      const targetNode = node(opponent);
      if (!targetNode || !graph) return [];
      const attempts = [domainAttackers, airAttackers]
        .filter((group, index, all) => group.length > 0 && all.findIndex((other) => other[0] === group[0]) === index)
        .flatMap((group) => {
          const sourceNode = node(group[0]);
          if (!sourceNode) return [];
          const route = queryAiAccessRouteV1(graph, {
            queryId: `query:strategy:${opponent.actorId}:${group[0]!.actorId}:${context.observation.generation}`,
            kind: "firing_position",
            fromNodeId: sourceNode,
            toNodeId: targetNode,
            capabilities: routeCapability(context.observation, group, context.catalog),
            firingNodeIds: [targetNode]
          } satisfies AiRouteRequestV1);
          return [{ group, route }];
        });
      const viable =
        attempts.find((attempt) => ["direct", "water_transport", "air_transport"].includes(attempt.route.kind)) ??
        attempts.find((attempt) => attempt.route.kind === "pending");
      if (!viable) return [];
      const { group: compatibleAttackers, route } = viable;
      const threats = threatNear(context, opponent);
      const producers = productionNear(context, opponent);
      const capable = compatibleAttackers.length;
      const failurePenalty =
        recentFailure?.targetActorId === opponent.actorId &&
        context.observation.tick - recentFailure.observedTick <= FAILURE_MEMORY_TICKS
          ? Math.min(6, recentFailure.repeatedFailures * 2 + Math.floor(recentFailure.losses / 4))
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
  const focusedPlayer = context.activeAttack?.lifecycle?.targetPlayerNumber;
  const focused = candidates.find((candidate) => candidate.opponent.owner === focusedPlayer);
  const best = candidates[0];
  const selected =
    focused &&
    best &&
    focused.score >= best.score - Math.max(50, Math.floor((Math.abs(best.score) * TARGET_HYSTERESIS_PERMILLE) / 1000))
      ? focused
      : best;
  const workers = context.observation.actors.filter(
    (actor) => actor.relation === "self" && actor.capabilities.some((capability) => capability.family === "gather")
  ).length;
  const ready = selected ? selected.capable >= selected.required : false;
  const recovering =
    context.state.opening.plan.lifecycle === "completed" && workers < WORKFORCE_RECOVERY_FLOOR && !ready;
  const rebuildingFailedMission =
    selected !== undefined &&
    recentFailure?.targetActorId === selected.opponent.actorId &&
    context.observation.tick < recentFailure.observedTick + Math.min(400, recentFailure.repeatedFailures * 100);
  const choice: AiStrategyAssessment["choice"] = selected
    ? recovering || rebuildingFailedMission
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
      reason: selected
        ? recovering || rebuildingFailedMission
          ? recovering
            ? "workforce_below_recovery_floor"
            : "recent_failed_mission_rebuild"
          : ready
            ? "credible_force_and_route"
            : selected.producers >= 2
              ? "assembling_against_developed_base"
              : "assembling_compatible_force"
        : "no_reachable_observed_objective",
      targetActorId: selected?.opponent.actorId ?? null,
      routeDomain: selected?.route.kind === "direct" ? selected.route.domain : null,
      readyForce: selected?.capable ?? 0,
      requiredForce: selected?.required ?? 0,
      visibleThreatCount: selected?.threats ?? 0,
      confidencePermille: selected?.opponent.visibility === "visible" ? 1000 : selected ? 550 : 0,
      expectedEffectTick: travelTicks === null ? null : context.observation.tick + travelTicks,
      reconsiderTick: rebuildingFailedMission && recentFailure
        ? recentFailure.observedTick + Math.min(400, recentFailure.repeatedFailures * 100)
        : context.observation.tick + (ready ? 40 : 100),
      ...(recentFailure ? { recentFailure } : {}),
      alternatives: candidates
        .filter((candidate) => candidate !== selected)
        .slice(0, 4)
        .map((candidate) => ({
          targetActorId: candidate.opponent.actorId,
          reason: `score_${candidate.score}_threats_${candidate.threats}`
        }))
    }
  };
}
