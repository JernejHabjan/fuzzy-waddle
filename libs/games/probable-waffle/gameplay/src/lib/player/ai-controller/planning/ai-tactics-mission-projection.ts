import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import { selectAiAttackApproachPositions } from "./ai-tactics-approach-positions";
import { knownPosition, distance, legalForMembers, formationPositions } from "./ai-tactics-geometry";
import { assignDamage } from "./ai-tactics-combat";
import { TACTICAL_RECONSIDERATION_TICKS, MISSION_EFFECT_EXTENSION_TICKS } from "./ai-tactics-rules";

import type { decideAiTacticalSquad } from "./ai-tactics-mission-decision";
import { aiTacticalScoutDestination } from "./ai-tactics-scout-destination";
/** Projects formation, reservations and tactical state. */
export function projectAiTacticalSquad(input: ReturnType<typeof decideAiTacticalSquad>) {
  const {
    alternatives,
    bestTarget,
    committedTarget,
    estimate,
    fortificationPlan,
    localEnemies,
    members,
    missionExpired,
    missionProgressed,
    nextState,
    observation,
    origin,
    oscillationCount,
    profile,
    reachableDefenderPosts,
    retainPrevious,
    retreat,
    script,
    squad,
    state,
    target,
    targetAwareMembers,
    targetId,
    updates,
    usefulEffectTick,
    visibleTarget
  } = input;
  const rampartPositions = reachableDefenderPosts.flatMap(
    (post) => fortificationPlan?.graph?.nodes.find((node) => node.nodeId === post.nodeId)?.position ?? []
  );
  const recoveryPhase =
    nextState === "retreat" ||
    nextState === "recover" ||
    nextState === "assemble" ||
    nextState === "rally" ||
    nextState === "reserve";
  const retainedRetreatAssignments = input.holdRetreat
    ? (squad.tactics?.assignedPositions ?? []).filter((assignment) =>
        members.some((member) => member.actorId === assignment.actorId)
      )
    : [];
  const anchor = recoveryPhase
    ? (retainedRetreatAssignments[0]?.position ?? retreat ?? origin)
    : squad.role === "scout"
      ? (aiTacticalScoutDestination(observation, squad) ?? knownPosition(target) ?? origin)
    : nextState === "regroup"
      ? origin
      : (rampartPositions[0] ?? knownPosition(target) ?? aiTacticalScoutDestination(observation, squad) ?? origin);
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
  const assignedPositions = retainedRetreatAssignments.length
    ? retainedRetreatAssignments
    : [
        ...postAssignments,
        ...(squad.role === "attack" && !recoveryPhase && anchor && observation.map?.tacticalCells?.length
          ? selectAiAttackApproachPositions(
              postMembers.filter((actor) => !postedActorIds.has(actor.actorId)),
              anchor,
              observation
            )
          : formationPositions(
              postMembers.filter((actor) => !postedActorIds.has(actor.actorId)),
              anchor,
              observation
            ))
      ];
  const finalState: AiSquadStateV1["state"] = oscillationCount >= 2 && nextState === "engage" ? "regroup" : nextState;
  const previousDamageEffectIds = new Set(
    (squad.tactics?.damageReservations ?? [])
      .map((reservation) => reservation.effectId)
      .filter((effectId): effectId is string => effectId !== undefined)
  );
  const damageReservations =
    visibleTarget && targetAwareMembers.length > 0 && (finalState === "engage" || finalState === "advance")
      ? assignDamage(
          targetAwareMembers.slice(0, profile.maxActorOrdersPerStep),
          [visibleTarget, ...localEnemies.filter((enemy) => enemy.actorId !== visibleTarget.actorId)],
          observation.tick,
          squad.squadId,
          squad.tactics?.damageReservations ?? [],
          state.pendingOutcomes
        )
      : [];
  const orderSignature = `${finalState}:${script}:${targetId ?? "none"}:${target?.visibility ?? "missing"}:${anchor ? `${anchor.x},${anchor.y},${anchor.z}` : "none"}`;
  const previouslyOrderedActorIds =
    squad.tactics?.orderSignature === orderSignature
      ? squad.tactics.orderedActorIds.filter((actorId) => members.some((member) => member.actorId === actorId))
      : [];
  const actorsNeedingOrder = members
    .filter((actor) => {
      const activeOrder = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      const assignment = assignedPositions.find((candidate) => candidate.actorId === actor.actorId);
      const desiredPosition =
        assignment?.position ??
        (assignedPositions.length === 0 &&
        anchor &&
        (squad.role !== "attack" || recoveryPhase || !observation.map?.tacticalCells?.length)
          ? anchor
          : undefined);
      // Attack-move is the legal approach before this member sees the mission's player-visible target.
      if (
        visibleTarget &&
        (finalState === "engage" || finalState === "advance") &&
        activeOrder?.orderType === OrderType.Attack &&
        activeOrder.targetActorId === null &&
        !targetAwareMembers.some((member) => member.actorId === actor.actorId)
      )
        return false;
      // Preserve small destination changes, but replace stale retreat moves even under the same order signature.
      if (activeOrder?.orderType === OrderType.Move && activeOrder.targetPosition && desiredPosition) {
        return distance(activeOrder.targetPosition, desiredPosition) > 4;
      }
      if (!previouslyOrderedActorIds.includes(actor.actorId)) return true;
      if (
        visibleTarget &&
        (finalState === "engage" || finalState === "advance") &&
        targetAwareMembers.some((member) => member.actorId === actor.actorId)
      ) {
        return activeOrder?.orderType !== OrderType.Attack || activeOrder.targetActorId !== visibleTarget.actorId;
      }
      if (assignment && distance(knownPosition(actor) ?? assignment.position, assignment.position) > 2) {
        return activeOrder?.orderType !== OrderType.Move;
      }
      return false;
    })
    .map((actor) => actor.actorId);
  const materiallyChanged = squad.tactics?.orderSignature !== orderSignature || actorsNeedingOrder.length > 0;
  const previousMemberCount = squad.tactics?.lastObservedMemberCount ?? members.length;
  const updated: AiSquadStateV1 = {
    ...squad,
    actorIds: finalState === "completed" ? [] : members.map((actor) => actor.actorId),
    objectiveId: squad.role === "attack" ? squad.objectiveId : (targetId ?? squad.objectiveId),
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
              : missionExpired && squad.lifecycle.recoveryAttempt === 0
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
      targetScore: committedTarget
        ? (alternatives.find((candidate) => candidate.objectiveId === committedTarget.actorId)?.score ?? 0)
        : retainPrevious
          ? squad.tactics!.targetScore
          : (bestTarget?.score ?? squad.tactics?.targetScore ?? 0),
      engagementRatioPermille: estimate.ratioPermille,
      confidencePermille: estimate.confidencePermille,
      predictedFriendlyLossPermille: estimate.predictedFriendlyLossPermille,
      predictedEnemyLossPermille: estimate.predictedEnemyLossPermille,
      lastObservedMemberCount: members.length,
      observedLossCount: (squad.tactics?.observedLossCount ?? 0) + Math.max(0, previousMemberCount - members.length),
      lastTransitionTick:
        squad.state === finalState ? (squad.tactics?.lastTransitionTick ?? observation.tick) : observation.tick,
      nextReconsiderTick:
        squad.state === finalState && squad.tactics && observation.tick < squad.tactics.nextReconsiderTick
          ? squad.tactics.nextReconsiderTick
          : observation.tick + TACTICAL_RECONSIDERATION_TICKS,
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
  return {
    ...input,
    rampartPositions,
    recoveryPhase,
    anchor,
    mobileReserveCount,
    mobileReserveActorIds,
    postMembers,
    postAssignments,
    postedActorIds,
    assignedPositions,
    finalState,
    previousDamageEffectIds,
    damageReservations,
    orderSignature,
    previouslyOrderedActorIds,
    actorsNeedingOrder,
    materiallyChanged,
    previousMemberCount,
    updated
  } as const;
}
