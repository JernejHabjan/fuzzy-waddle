import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";

/** Compares the entire stamped queue payload semantically; socket property insertion order is irrelevant. */
export function sameRuntimeQueueCommand(left: GameCommand, right: GameCommand | undefined): boolean {
  if (!right || left.tick !== right.tick || left.playerNumber !== right.playerNumber ||
    left.actorIds.length !== right.actorIds.length ||
    left.actorIds.some((actorId, index) => actorId !== right.actorIds[index]) ||
    !(["schemaVersion", "commandId", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
      .every((key) => left.execution?.[key] === right.execution?.[key])) return false;
  return (left.type === "PRODUCTION" && right.type === "PRODUCTION" && left.actorName === right.actorName) ||
    (left.type === "RESEARCH" && right.type === "RESEARCH" && left.researchType === right.researchType) ||
    (left.type === "CANCEL_PRODUCTION" && right.type === "CANCEL_PRODUCTION" && left.queueIndex === right.queueIndex) ||
    (left.type === "CANCEL_RESEARCH" && right.type === "CANCEL_RESEARCH");
}
