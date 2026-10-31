import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { sameRuntimeProductionCommand } from "./skirmish-ai-runtime-production-command-equality";

/** Capture-wide application linkage. Native start callbacks may precede the applied outcome and dispatch receipt. */
export function matchRuntimeConstructionApplication(
  capture: AiRuntimeProductionCaptureV1, placement: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  if (placement.spatial.kind !== "placement") return { application: null, failures, gaps };
  const value = placement.spatial;
  const command = value.command;
  const execution = command.execution;
  const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered")
    .filter((fact) => fact.command.execution?.commandId === execution?.commandId);
  const applied = capture.facts.filter((fact) => fact.kind === "outcome")
    .filter((fact) => fact.outcome.commandId === execution?.commandId && fact.outcome.kind === "applied");
  if (deliveries.length > 1 || applied.length > 1 || deliveries.some((fact) =>
    !sameRuntimeProductionCommand(fact.command, command) || fact.tick !== placement.tick) ||
    applied.some((fact) => !value.legal || fact.sequence <= placement.sequence || fact.tick !== placement.tick ||
      fact.outcome.tick !== fact.tick || fact.scheduledTick !== null || fact.outcome.reason !== "applied" ||
      fact.outcome.playerNumber !== command.playerNumber || fact.outcome.authorityEpoch !== execution?.authorityEpoch ||
      fact.outcome.sequence !== execution?.sequence || fact.outcome.commitmentKey !== execution?.commitmentKey ||
      fact.outcome.intentId !== execution?.intentId || fact.outcome.effectId !== execution?.effectId ||
      fact.outcome.actorIds.length !== command.actorIds.length ||
      !fact.outcome.actorIds.every((id, index) => id === command.actorIds[index]) ||
      fact.outcome.worldLinkIds.length !== 1 || fact.outcome.worldLinkIds[0] !== value.site.actorId)) {
    failures.push("production_construction_application_mismatch");
  }
  if (deliveries.length !== 1 || applied.length !== 1) gaps.push("production_construction_application_missing");
  return { application: failures.length || deliveries.length !== 1 ? null : applied[0] ?? null, failures, gaps };
}
