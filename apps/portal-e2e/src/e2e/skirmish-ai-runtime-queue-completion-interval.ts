import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** Checks the actual live-handle scope without deriving identity from a completed outcome or a later queue snapshot. */
export function validateRuntimeQueueCompletionInterval(
  group: readonly Extract<AiRuntimeProductionFactV1, { kind: "queue_completion" }>[],
  commands: RuntimeProductionCausalityV1["commands"]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const before = group.find((fact) => fact.completion.phase === "before");
  const after = group.find((fact) => fact.completion.phase === "after");
  if (group.length !== 2 || !before || !after || !Number.isSafeInteger(before.completion.completionId) ||
    before.completion.completionId <= 0 || after.sequence <= before.sequence || before.tick !== after.tick ||
    before.completion.createdActor !== null || before.completion.createdActorInProducerScene !== null ||
    !isDeepStrictEqual({ ...before.completion, phase: "after", createdActor: after.completion.createdActor,
      createdActorInProducerScene: after.completion.createdActorInProducerScene,
      researchRegistered: after.completion.researchRegistered }, after.completion)) {
    return { scope: null, failures: ["production_ai_completion_interval_invalid"], gaps };
  }
  const value = before.completion;
  const context = value.originatingCommandContext;
  const origin = commands.find((entry) => entry.command.execution?.commandId === context?.execution.commandId);
  if (!origin?.decision || !value.item || !value.actorId || !context) {
    return { scope: null, failures, gaps: ["production_ai_completion_native_scope_missing"] };
  }
  const command = origin.command;
  if (!["PRODUCTION", "RESEARCH"].includes(command.type) || !isDeepStrictEqual(context.execution, command.execution) ||
    context.playerNumber !== command.playerNumber || !isDeepStrictEqual(context.actorIds, command.actorIds) ||
    command.actorIds.length !== 1 || command.actorIds[0] !== value.actorId || before.tick < command.tick ||
    value.item.identitySource !== "command" || value.item.commandId !== context.execution.commandId ||
    value.item.itemId !== `queue:${value.actorId}:${context.execution.commandId}` ||
    value.item.effectId !== context.execution.effectId || value.item.remainingTimeMs !== 0 ||
    (command.type === "PRODUCTION" ? value.item.objectName !== command.actorName || value.item.researchType !== null :
      command.type !== "RESEARCH" || value.item.researchType !== command.researchType || value.item.objectName !== null)) {
    failures.push("production_ai_completion_native_scope_invalid");
  }
  if (group.some((fact) => fact.completion.snapshotRestoreInProgress || fact.boundaryState?.snapshotRestoreInProgress)) {
    failures.push("production_ai_completion_during_restore");
  }
  group.forEach((fact) => gaps.push(...fact.completion.gaps));
  if (!before.boundaryState || !after.boundaryState) gaps.push("production_ai_completion_boundary_missing");
  return { scope: failures.length || value.gaps.length || after.completion.gaps.length ? null : { before, after, origin },
    failures, gaps };
}
