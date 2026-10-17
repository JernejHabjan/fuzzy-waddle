import type {
  AiBrainStateV1,
  AiFortificationNodeStateV1,
  AiFortificationStateV1
} from "../contracts/ai-brain-state-v1";

import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";

import type { AiObservationV1 } from "../contracts/ai-observation-v1";

import { tileKey, positionOf } from "./ai-fortification-support";
const BREACH_RETRY_TICKS = 100;
const MAX_BREACH_RECOVERY_ATTEMPTS = 2;
function reconcileNode(
  current: AiFortificationNodeStateV1,
  observation: AiObservationV1,
  outcomes: readonly AiCommandOutcomeV1[],
  reserved: boolean
): AiFortificationNodeStateV1 {
  if (!current.objectName) return current;
  const observed = observation.actors.find((actor) => {
    const position = positionOf(actor);
    return (
      actor.relation === "self" &&
      actor.objectName === current.objectName &&
      position !== null &&
      tileKey(position) === tileKey(current.position)
    );
  });
  if (observed) {
    const finished = observed.constructionProgress?.status !== "known" || observed.constructionProgress.value >= 100;
    return {
      ...current,
      lifecycle: finished ? "finished" : "requested",
      completedActorId: observed.actorId,
      attempt: finished ? 0 : current.attempt,
      retryAfterTick: observation.tick + 40
    };
  }
  if (current.lifecycle === "finished" && observation.tick >= current.retryAfterTick) {
    return {
      ...current,
      lifecycle: "destroyed",
      completedActorId: null,
      effectId: null,
      retryAfterTick: observation.tick
    };
  }
  const outcome = current.effectId
    ? [...outcomes].reverse().find((candidate) => candidate.identity.effectId === current.effectId)
    : undefined;
  if (!outcome) {
    if (reserved) return { ...current, lifecycle: "requested" };
    if (current.lifecycle === "requested" && observation.tick >= current.retryAfterTick) {
      return { ...current, lifecycle: "planned" };
    }
    return current;
  }
  if (outcome.kind === "completed") {
    return {
      ...current,
      lifecycle: "finished",
      completedActorId: outcome.resultingActorIds[0] ?? null,
      attempt: 0,
      retryAfterTick: observation.tick + 40
    };
  }
  if (outcome.kind === "rejected" || outcome.kind === "failed" || outcome.kind === "cancelled") {
    return {
      ...current,
      lifecycle: current.lifecycle === "destroyed" ? "destroyed" : "planned",
      completedActorId: null,
      attempt: current.attempt + 1,
      effectId: null,
      retryAfterTick: observation.tick + BREACH_RETRY_TICKS
    };
  }
  return { ...current, lifecycle: "requested" };
}

export function reconcileFortificationPlan(
  plan: AiFortificationStateV1,
  observation: AiObservationV1,
  state: AiBrainStateV1
): AiFortificationStateV1 {
  if (!plan.graph) return plan;
  const nodes = plan.graph.nodes.map((current) => {
    const effectClaimId = `claim:fortification:${current.nodeId}:effect`;
    const reserved = state.reservations.some(
      (reservation) =>
        reservation.claimId === effectClaimId &&
        (reservation.state.kind !== "provisional" || reservation.state.expiresAt.dueTick > observation.tick)
    );
    return reconcileNode(current, observation, state.pendingOutcomes, reserved);
  });
  const missing = nodes
    .filter((current) => current.lifecycle === "destroyed")
    .map((current) => current.nodeId)
    .sort();
  const missingKinds = nodes.filter((current) => current.lifecycle === "destroyed").map((current) => current.kind);
  const liveStairComponents = new Set(
    nodes
      .filter((current) => current.kind === "stair" && current.lifecycle === "finished")
      .map((current) => current.componentId)
  );
  const risk = missingKinds.some((kind) => kind === "stair" || kind === "tower")
    ? "high"
    : missingKinds.length > 0
      ? "medium"
      : "none";
  const recoveryAttempts = missing.length
    ? Math.max(
        plan.graph.breach.recoveryAttempts,
        ...nodes.filter((current) => current.lifecycle === "destroyed").map((current) => current.attempt + 1)
      )
    : plan.graph.breach.recoveryAttempts;
  const abandoned = recoveryAttempts > MAX_BREACH_RECOVERY_ATTEMPTS;
  const completedNodeIds = nodes
    .filter((current) => current.lifecycle === "finished")
    .map((current) => current.nodeId)
    .sort();
  const lifecycle = abandoned
    ? "abandoned"
    : missing.length
      ? "breached"
      : nodes.every((current) => current.lifecycle === "finished")
        ? "active"
        : nodes.some((current) => current.lifecycle === "requested" || current.lifecycle === "finished")
          ? "building"
          : "planned";
  return {
    ...plan,
    completedNodeIds,
    lifecycle,
    graph: {
      ...plan.graph,
      nodes: abandoned
        ? nodes.map((current) =>
            current.lifecycle === "destroyed" ? { ...current, lifecycle: "abandoned" as const } : current
          )
        : nodes,
      defenderPosts: plan.graph.defenderPosts.map((post) => {
        const postNode = nodes.find((current) => current.nodeId === post.nodeId);
        return {
          ...post,
          reachable: postNode?.lifecycle === "finished" && liveStairComponents.has(postNode.componentId)
        };
      }),
      breach: {
        ...plan.graph.breach,
        missingNodeIds: missing,
        reason: missing.length ? "observed_finished_node_missing" : null,
        risk,
        responseEffectId: missing.length ? plan.graph.breach.responseEffectId : null,
        recoveryAttempts
      }
    }
  };
}
