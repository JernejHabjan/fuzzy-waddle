import type { AiSquadState } from "../../../contracts/state/ai-state-contracts";
import { distance, knownPosition, movementDomains } from "../combat/ai-tactics-geometry";
import {
  AI_TACTICS_ATTACK_RATIO_PERMILLE,
  AI_TACTICS_RETREAT_RATIO_PERMILLE,
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
  const unfavorable =
    estimate.ratioPermille < AI_TACTICS_RETREAT_RATIO_PERMILLE ||
    (estimate.predictedFriendlyLossPermille > 0 &&
      members.filter((actor) => actor.healthPermille?.status === "known" && actor.healthPermille.value <= 250).length >=
        Math.max(1, Math.ceil(members.length / 3)));
  const scoutUnderFire = members.some(
    (member) => member.healthPermille?.status === "known" && member.healthPermille.value < 1000
  );
  const scoutNeedsSafeWithdrawal =
    squad.role === "scout" && scoutUnderFire && localEnemies.length > 0 && retreat !== null;
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
  const proposedState: AiSquadState["state"] =
    emptyRecoveryExhausted || missionRecoveryExhausted
      ? "completed"
      : members.length === 0
        ? "recover"
        : missionExpired
          ? squad.state === "recover" || squad.state === "recovering"
            ? quietState
            : "recover"
          : scoutNeedsSafeWithdrawal
            ? "retreat"
            : endangeredMemberThreat
              ? members.some(
                  (member) =>
                    !endangeredActorIds.includes(member.actorId) &&
                    member.combatProfile?.status === "known" &&
                    member.combatProfile.value.attacks.length > 0
                ) && localEnemies.length > 0
                ? "engage"
                : "retreat"
              : urgentHomeDefense
                ? "engage"
                : committedPressure
                  ? localEnemies.length > 0
                    ? "engage"
                    : "advance"
                  : (unfavorable ||
                        topologyLost ||
                        (recoveringFromRetreat && localEnemies.length > 0 && !favorableRecovery)) &&
                      retreat
                    ? "retreat"
                    : awaitingStrategicLaunch
                      ? "assemble"
                      : localEnemies.length > 0 &&
                          ((recoveringFromRetreat ? favorableRecovery : favorable) || forcedDecision)
                        ? "engage"
                        : localEnemies.length > 0
                          ? "regroup"
                          : quietState;
  const holdRetreat =
    !endangeredMemberThreat &&
    !urgentHomeDefense &&
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
  const nextState: AiSquadState["state"] = holdRetreat ? "retreat" : proposedState;
  const nowRetreat = nextState === "retreat";
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
    endangeredActorIds,
    safeFiringPositions,
    holdRetreat,
    quietState,
    nextState,
    nowRetreat,
    oscillationCount,
    script
  } as const;
}
