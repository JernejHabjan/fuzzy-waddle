import type { AiSquadState } from "../../../contracts/state/ai-state-contracts";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { distance, knownPosition, movementDomains } from "../combat/ai-tactics-geometry";
import {
  AI_TACTICS_ATTACK_RATIO_PERMILLE,
  AI_TACTICS_RETREAT_RELEASE_RATIO_PERMILLE,
  TACTICAL_RECONSIDERATION_TICKS
} from "../combat/ai-tactics-rules";
import { selectAiSafeFiringPositions } from "../combat/ai-tactics-approach-positions";
import { canTarget } from "../combat/ai-tactics-combat";

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
  const postNodes = new Map(fortificationPlan?.graph?.nodes.map((node) => [node.nodeId, node]));
  // Unfinished posts describe future construction, not positions whose loss can force the mobile defense to retreat.
  const establishedPosts =
    fortificationPlan?.graph?.defenderPosts.filter((post) =>
      ["finished", "destroyed"].includes(postNodes.get(post.nodeId)?.lifecycle ?? "")
    ) ?? [];
  const reachableDefenderPosts = establishedPosts.filter(
    (post) => post.reachable && postNodes.get(post.nodeId)?.lifecycle === "finished"
  );
  const topologyLost = establishedPosts.length > 0 && reachableDefenderPosts.length === 0;
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
  // Owned actors remain observable while reassigned or in transport. Count missing
  // roster members, rather than treating every reduction in this step's force as a death.
  const missingMembers = squad.actorIds.filter((actorId) => !input.actorById.has(actorId)).length;
  const observedLossCount = (squad.tactics?.observedLossCount ?? 0) + missingMembers;
  const majorityOfCommittedForceLost = observedLossCount > squad.actorIds.length - missingMembers;
  const scoutNeedsSafeWithdrawal = squad.role === "scout" && localEnemies.length > 0 && retreat !== null;
  const safeFiringPositions = selectAiSafeFiringPositions(members, localEnemies, visibleTarget, observation);
  const endangeredActorIds = members
    .filter((member) => {
      const memberHealth = member.healthPermille;
      const memberCombat = member.combatProfile;
      const memberPosition = knownPosition(member);
      if (
        memberHealth?.status !== "known" ||
        memberCombat?.status !== "known" ||
        (memberHealth.value > 250 &&
          (memberHealth.value > 400 || !memberCombat.value.attacks.some((attack) => attack.minRange > 0))) ||
        !memberCombat.value.attacks.some((attack) => attack.damage > 0) ||
        !memberPosition
      )
        return false;
      const memberDomains = movementDomains(member);
      const activeMove =
        member.activeOrder?.status === "known" && member.activeOrder.value?.orderType === "Move"
          ? member.activeOrder.value
          : null;
      const alreadyWithdrawing =
        activeMove?.targetPosition != null && distance(memberPosition, activeMove.targetPosition) > 1;
      return localEnemies.some((enemy) => {
        const enemyPosition = knownPosition(enemy);
        const enemyCombat = enemy.combatProfile;
        if (!enemyPosition || enemyCombat?.status !== "known") return false;
        const separation = distance(memberPosition, enemyPosition);
        return enemyCombat.value.attacks.some(
          (attack) =>
            attack.damage > 0 &&
            memberDomains.some((domain) => attack.targetDomains.includes(domain)) &&
            (alreadyWithdrawing ||
              (separation >= attack.minRange &&
                separation <= attack.range + (memberPosition.z > enemyPosition.z ? attack.highGroundRangeBonus : 0)))
        );
      });
    })
    .map((member) => member.actorId);
  const endangeredMemberThreat = endangeredActorIds.length > 0;
  const entireSquadCriticallyExposed =
    endangeredMemberThreat &&
    endangeredActorIds.length === members.length &&
    members.every((member) => member.healthPermille?.status === "known" && member.healthPermille.value <= 250);
  // A healthy home defender should contest an attacker already threatening the economy, even when
  // the full fight is unfavorable. Once injured it returns to the normal retreat policy.
  const urgentHomeDefense =
    squad.role === "defense" &&
    visibleTarget &&
    members.every((member) => member.healthPermille?.status === "known" && member.healthPermille.value > 250) &&
    members.some(
      (member) =>
        member.healthPermille?.status === "known" &&
        member.healthPermille.value > 700 &&
        canTarget(member, visibleTarget)
    ) &&
    localEnemies.some((enemy) => {
      if (enemy.actorId !== visibleTarget.actorId) return false;
      const enemyPosition = knownPosition(enemy);
      const attacks = enemy.combatProfile?.status === "known" ? enemy.combatProfile.value.attacks : [];
      if (!enemyPosition || !attacks.length) return false;
      return observation.actors.some((actor) => {
        const actorPosition = knownPosition(actor);
        return (
          actor.relation === "self" &&
          actor.visibility === "owned" &&
          actorPosition &&
          ((actor.mainBuilding?.status === "known" && actor.mainBuilding.value) ||
            actor.capabilities.some((capability) => capability.family === "gather")) &&
          canTarget(enemy, actor) &&
          attacks.some(
            (attack) =>
              attack.damage > 0 &&
              movementDomains(actor).some((domain) => attack.targetDomains.includes(domain)) &&
              distance(enemyPosition, actorPosition) <= attack.range + 1
          )
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
  const awaitingStrategicLaunch = input.awaitingStrategicLaunch;
  // A provisional pressure goal must remain in formation through incidental contact; strategy has not authorized its attack yet.
  const committedPressure =
    squad.role === "attack" &&
    state.strategy.stance === "pressure" &&
    state.strategy.objectiveId === squad.objectiveId &&
    state.strategy.assessment?.choice === "pressure" &&
    state.strategy.assessment.targetActorId === squad.objectiveId &&
    state.strategy.commitmentDeadline.dueTick >= observation.tick &&
    !awaitingStrategicLaunch &&
    !topologyLost;
  const missionExpired =
    ["attack", "escort", "reinforcement", "scout"].includes(squad.role) &&
    !missionProgressed &&
    (squad.lifecycle?.effectDeadline.dueTick ?? Number.MAX_SAFE_INTEGER) <= observation.tick;
  const raidAbortRequested =
    squad.squadId.startsWith("squad:attack:raid:") && squad.lifecycle?.terminalReason === "raid_counterforce_abort";
  const raidAbortReachedSafety =
    raidAbortRequested &&
    members.length > 0 &&
    members.every((member) => {
      const memberPosition = knownPosition(member);
      const committedDestination =
        squad.tactics?.stateReason === "raid_counterforce_abort"
          ? squad.tactics.assignedPositions?.find((assignment) => assignment.actorId === member.actorId)?.position
          : undefined;
      const destination = committedDestination ?? retreat;
      return memberPosition !== null && destination !== null && distance(memberPosition, destination) <= 3;
    });
  const withdrawalStillInProgress =
    !raidAbortRequested &&
    (squad.state === "retreat" ||
      squad.state === "retreating" ||
      squad.state === "recover" ||
      squad.state === "recovering") &&
    squad.tactics?.script === "protected_retreat" &&
    members.some((member) => {
      const memberPosition = knownPosition(member);
      const assignedDestination = squad.tactics?.assignedPositions?.find(
        (assignment) => assignment.actorId === member.actorId
      )?.position;
      const activeOrder = member.activeOrder?.status === "known" ? member.activeOrder.value : null;
      const destination =
        assignedDestination ??
        (activeOrder?.orderType === OrderType.Move ? (activeOrder.targetPosition ?? undefined) : undefined);
      return destination !== undefined && (memberPosition === null || distance(memberPosition, destination) > 3);
    });
  const raidTargetLost =
    !raidAbortRequested &&
    squad.squadId.startsWith("squad:attack:raid:") &&
    !observation.actors.some((actor) => actor.actorId === squad.objectiveId && actor.relation === "enemy");
  const missionRecoveryExhausted = missionExpired && (squad.lifecycle?.recoveryAttempt ?? 0) >= 1;
  const emptyRecoveryExhausted = members.length === 0 && (squad.state === "recover" || squad.state === "recovering");
  const quietState: AiSquadState["state"] = landedForRegroup
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
  const shouldWithdrawAfterLosses = majorityOfCommittedForceLost && localEnemies.length > 0 && !favorableRecovery;
  const shouldWithdraw =
    scoutNeedsSafeWithdrawal ||
    (retreat !== null && (entireSquadCriticallyExposed || topologyLost || shouldWithdrawAfterLosses));
  const proposedState: AiSquadState["state"] =
    emptyRecoveryExhausted ||
    missionRecoveryExhausted ||
    raidTargetLost ||
    raidAbortReachedSafety ||
    (raidAbortRequested && members.length === 0)
      ? "completed"
      : raidAbortRequested && retreat && !missionExpired
        ? "retreat"
        : members.length === 0
          ? "recover"
          : withdrawalStillInProgress
            ? "retreat"
            : missionExpired
              ? squad.state === "recover" || squad.state === "recovering"
                ? quietState
                : "recover"
              : shouldWithdraw
                ? "retreat"
                : endangeredMemberThreat ||
                    urgentHomeDefense ||
                    (localEnemies.length > 0 && (squad.state === "engage" || squad.state === "engaged"))
                  ? "engage"
                  : committedPressure
                    ? localEnemies.length > 0
                      ? "engage"
                      : "advance"
                    : recoveringFromRetreat && localEnemies.length > 0 && !favorableRecovery && retreat
                      ? "retreat"
                      : awaitingStrategicLaunch
                        ? "assemble"
                        : localEnemies.length > 0 &&
                            ((recoveringFromRetreat ? favorableRecovery : favorable) || forcedDecision)
                          ? "engage"
                          : localEnemies.length > 0
                            ? "regroup"
                            : quietState;
  const holdQuietRetreat =
    previousRetreat &&
    observation.tick < (squad.tactics?.nextReconsiderTick ?? observation.tick + 2 * TACTICAL_RECONSIDERATION_TICKS);
  const holdCombatRetreat =
    localEnemies.length > 0 &&
    (!favorableRecovery ||
      (squad.tactics !== undefined &&
        (squad.tactics.oscillationCount ?? 0) !== 1 &&
        observation.tick - squad.tactics.lastTransitionTick < 2 * TACTICAL_RECONSIDERATION_TICKS));
  const holdRetreat =
    !endangeredMemberThreat &&
    !urgentHomeDefense &&
    !committedPressure &&
    !raidTargetLost &&
    !raidAbortRequested &&
    recoveringFromRetreat &&
    !missionExpired &&
    !topologyLost &&
    (localEnemies.length > 0 ? holdCombatRetreat : holdQuietRetreat);
  const nextState: AiSquadState["state"] = holdRetreat ? "retreat" : proposedState;
  const nowRetreat = nextState === "retreat";
  const stateReason =
    nextState === "retreat"
      ? raidAbortRequested
        ? "raid_counterforce_abort"
        : shouldWithdrawAfterLosses
          ? "majority_committed_losses"
          : entireSquadCriticallyExposed
            ? "whole_squad_critically_exposed"
            : topologyLost
              ? "defender_post_topology_lost"
              : scoutNeedsSafeWithdrawal
                ? "scout_withdraws_under_fire"
                : withdrawalStillInProgress
                  ? "continue_withdrawal_until_safe"
                  : holdRetreat
                    ? localEnemies.length > 0
                      ? "hold_safe_retreat_from_local_threat"
                      : "hold_retreat_during_regroup_window"
                    : recoveringFromRetreat
                      ? "continue_withdrawal_until_recovery_ready"
                      : "tactical_withdrawal"
      : nextState === "engage"
        ? previousRetreat && favorableRecovery
          ? "force_ready_to_reengage"
          : endangeredActorIds.length > 0
            ? "squad_engages_with_individual_fallback"
            : "local_threat_in_range"
        : nextState === "recover"
          ? "safe_regroup_recovery"
          : nextState === "defend"
            ? "return_to_defense_post"
            : nextState === "completed"
              ? raidTargetLost
                ? "raid_target_lost_or_destroyed"
                : raidAbortReachedSafety
                  ? "raid_disengagement_complete"
                  : "mission_completed_or_exhausted"
              : "continue_committed_mission";
  const oscillationCount =
    previousRetreat !== nowRetreat && squad.tactics && observation.tick <= squad.tactics.nextReconsiderTick
      ? squad.tactics.oscillationCount + 1
      : Math.max(0, (squad.tactics?.oscillationCount ?? 0) - 1);
  const script: NonNullable<AiSquadState["tactics"]>["script"] =
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
    majorityOfCommittedForceLost,
    observedLossCount,
    awaitingLaunch,
    forcedDecision,
    usefulEffectTick,
    missionProgressed,
    awaitingStrategicLaunch,
    committedPressure,
    missionExpired,
    raidAbortRequested,
    raidAbortReachedSafety,
    raidTargetLost,
    missionRecoveryExhausted,
    emptyRecoveryExhausted,
    endangeredActorIds,
    safeFiringPositions: nextState === "retreat" ? [] : safeFiringPositions,
    holdRetreat,
    quietState,
    nextState,
    stateReason,
    nowRetreat,
    oscillationCount,
    script
  } as const;
}
