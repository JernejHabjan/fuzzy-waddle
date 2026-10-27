import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import { distance, knownPosition, movementDomains } from "./ai-tactics-geometry";
import {
  AI_TACTICS_ATTACK_RATIO_PERMILLE,
  AI_TACTICS_RETREAT_RATIO_PERMILLE,
  AI_TACTICS_RETREAT_RELEASE_RATIO_PERMILLE,
  TACTICAL_RECONSIDERATION_TICKS
} from "./ai-tactics-rules";

import type { prepareAiTacticalSquad } from "./ai-tactics-mission-preparation";
/** Chooses bounded mission state and recovery. */
export function decideAiTacticalSquad(input: NonNullable<ReturnType<typeof prepareAiTacticalSquad>>) {
  const { estimate, localEnemies, members, observation, retreat, squad, state, visibleTarget } = input;
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
  const topologyLost = Boolean(fortificationPlan?.graph?.defenderPosts.length && reachableDefenderPosts.length === 0);
  const landedForRegroup = state.transport.some(
    (plan) => plan.phase === "handoff" && plan.passengerIds.some((actorId) => squad.actorIds.includes(actorId))
  );
  const previousRetreat = squad.state === "retreat" || squad.state === "retreating";
  const recoveringFromRetreat =
    previousRetreat ||
    ((squad.state === "recover" || squad.state === "recovering") &&
      (squad.tactics?.script === "protected_retreat" || (squad.tactics?.oscillationCount ?? 0) > 0));
  const favorable = estimate.ratioPermille >= AI_TACTICS_ATTACK_RATIO_PERMILLE && estimate.confidencePermille >= 500;
  const favorableRecovery =
    visibleTarget !== null &&
    localEnemies.length > 0 &&
    estimate.ratioPermille >= AI_TACTICS_RETREAT_RELEASE_RATIO_PERMILLE &&
    estimate.confidencePermille >= 750 &&
    estimate.predictedFriendlyLossPermille <= 400;
  const unfavorable =
    estimate.ratioPermille < AI_TACTICS_RETREAT_RATIO_PERMILLE ||
    (estimate.predictedFriendlyLossPermille > 0 &&
      members.filter((actor) => actor.healthPermille?.status === "known" && actor.healthPermille.value <= 250).length >=
        Math.max(1, Math.ceil(members.length / 3)));
  const criticalRangedThreat = members.some((member) => {
    const memberHealth = member.healthPermille;
    const memberCombat = member.combatProfile;
    const memberPosition = knownPosition(member);
    if (
      memberHealth?.status !== "known" ||
      memberHealth.value > 400 ||
      memberCombat?.status !== "known" ||
      !memberCombat.value.attacks.some((attack) => attack.minRange > 0) ||
      !memberPosition
    ) return false;
    const memberDomains = movementDomains(member);
    return localEnemies.some((enemy) => {
      const enemyPosition = knownPosition(enemy);
      const enemyCombat = enemy.combatProfile;
      if (!enemyPosition || enemyCombat?.status !== "known") return false;
      const separation = distance(memberPosition, enemyPosition);
      return enemyCombat.value.attacks.some((attack) =>
        memberDomains.some((domain) => attack.targetDomains.includes(domain)) &&
        separation >= attack.minRange &&
        separation <= attack.range + (memberPosition.z > enemyPosition.z ? attack.highGroundRangeBonus : 0)
      );
    });
  });
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
  // Strategy launches the mission once; domain children inherit that permission without launching again.
  const strategicLaunchRecorded = state.skirmish.timeline.some(
    (event) =>
      event.kind === "mission" &&
      event.subjectId.split(":domain:")[0] === squad.squadId.split(":domain:")[0] &&
      event.detail.startsWith("launch:") &&
      event.tick >= (squad.lifecycle?.createdTick ?? observation.tick)
  );
  const awaitingStrategicLaunch =
    squad.role === "attack" &&
    state.strategy.assessment?.targetActorId === squad.objectiveId &&
    !strategicLaunchRecorded;
  const committedPressure =
    squad.role === "attack" &&
    state.strategy.stance === "pressure" &&
    state.strategy.objectiveId === squad.objectiveId &&
    state.strategy.assessment?.choice === "pressure" &&
    state.strategy.assessment.targetActorId === squad.objectiveId &&
    state.strategy.commitmentDeadline.dueTick >= observation.tick &&
    !topologyLost;
  const missionExpired =
    ["attack", "escort", "reinforcement", "scout"].includes(squad.role) &&
    !missionProgressed &&
    (squad.lifecycle?.effectDeadline.dueTick ?? Number.MAX_SAFE_INTEGER) <= observation.tick;
  const missionRecoveryExhausted = missionExpired && (squad.lifecycle?.recoveryAttempt ?? 0) >= 1;
  const emptyRecoveryExhausted = members.length === 0 && (squad.state === "recover" || squad.state === "recovering");
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
  const proposedState: AiSquadStateV1["state"] =
    emptyRecoveryExhausted || missionRecoveryExhausted
      ? "completed"
      : members.length === 0
        ? "recover"
        : missionExpired
          ? squad.state === "recover" || squad.state === "recovering"
            ? quietState
            : "recover"
          : criticalRangedThreat
            ? "retreat"
          : committedPressure
            ? localEnemies.length > 0
              ? "engage"
              : "advance"
          : (unfavorable || topologyLost || (recoveringFromRetreat && localEnemies.length > 0 && !favorableRecovery)) &&
              retreat
            ? "retreat"
            : awaitingStrategicLaunch
              ? "assemble"
              : localEnemies.length > 0 && ((recoveringFromRetreat ? favorableRecovery : favorable) || forcedDecision)
                ? "engage"
                : localEnemies.length > 0
                  ? "regroup"
                  : quietState;
  const holdRetreat =
    !committedPressure &&
    recoveringFromRetreat &&
    squad.tactics !== undefined &&
    !missionExpired &&
    !topologyLost &&
    Boolean(retreat) &&
    (localEnemies.length > 0
      ? !favorableRecovery ||
        (squad.tactics.oscillationCount !== 1 &&
          observation.tick - squad.tactics.lastTransitionTick < 2 * TACTICAL_RECONSIDERATION_TICKS)
      : observation.tick < squad.tactics.nextReconsiderTick);
  const nextState: AiSquadStateV1["state"] = holdRetreat ? "retreat" : proposedState;
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
  return {
    ...input,
    fortificationPlan,
    reachableDefenderPosts,
    topologyLost,
    landedForRegroup,
    previousRetreat,
    recoveringFromRetreat,
    favorable,
    favorableRecovery,
    unfavorable,
    awaitingLaunch,
    forcedDecision,
    usefulEffectTick,
    missionProgressed,
    strategicLaunchRecorded,
    awaitingStrategicLaunch,
    committedPressure,
    missionExpired,
    missionRecoveryExhausted,
    emptyRecoveryExhausted,
    holdRetreat,
    quietState,
    nextState,
    nowRetreat,
    oscillationCount,
    script
  } as const;
}
