import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { isDeepStrictEqual } from "node:util";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Complete construction payload/stamp equality; queue equality remains owned by its existing helper. */
export function sameRuntimeProductionCommand(left: GameCommand, right: GameCommand | undefined): boolean {
  if (left.type !== "CONSTRUCT") return sameRuntimeQueueCommand(left, right);
  return right?.type === "CONSTRUCT" && left.tick === right.tick && left.playerNumber === right.playerNumber &&
    isDeepStrictEqual(left.actorIds, right.actorIds) &&
    (["schemaVersion", "commandId", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
      .every((key) => left.execution?.[key] === right.execution?.[key]) &&
    left.actorName === right.actorName && left.siteKey === right.siteKey && isDeepStrictEqual(left.tileVec3, right.tileVec3);
}
