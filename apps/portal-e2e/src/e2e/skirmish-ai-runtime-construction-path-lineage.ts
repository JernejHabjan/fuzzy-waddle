import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { sameRuntimeProductionCommand } from "./skirmish-ai-runtime-production-command-equality";

/** Joins a requested native builder route to one real legal placement and actual native delivery/application. */
export function matchRuntimeConstructionPath(
  capture: AiRuntimeProductionCaptureV1,
  request: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>,
  resolution: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const path = request.spatial;
  if (path.kind !== "builder_path") return { placement: null, failures, gaps };
  const candidates = capture.facts.filter((fact) => fact.kind === "spatial_authority" &&
    fact.sequence < request.sequence && fact.spatial.kind === "placement" && fact.spatial.legal &&
    fact.spatial.site.actorId === path.target.actorId && fact.spatial.command.actorIds.includes(path.source.actorId ?? ""));
  const placement = candidates[0];
  if (candidates.length > 1) failures.push("production_spatial_construction_path_ambiguous");
  if (!placement || placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement") {
    return { placement: null, failures, gaps: ["production_spatial_construction_command_path_join_missing"] };
  }
  const binding = placement.spatial;
  if (binding.clockTick === null || !binding.sceneActive || !binding.footprint || !binding.site.indexed ||
    !binding.site.active || !binding.site.alive) {
    return { placement: null, failures, gaps: ["production_spatial_construction_placement_binding_missing"] };
  }
  const command = placement.spatial.command;
  const id = command.execution?.commandId;
  const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered" && fact.command.execution?.commandId === id);
  const applied = capture.facts.filter((fact) => fact.kind === "outcome" && fact.outcome.commandId === id &&
    fact.outcome.kind === "applied");
  if (!id || deliveries.length === 0 || applied.length === 0) {
    gaps.push("production_spatial_construction_application_missing"); return { placement: null, failures, gaps };
  }
  if (deliveries.length !== 1 || applied.length !== 1 || deliveries.some((fact) => fact.kind !== "command_delivered" ||
    fact.sequence >= resolution.sequence || fact.tick > resolution.tick ||
    !sameRuntimeProductionCommand(fact.command, command)) ||
    applied.some((fact) => fact.kind !== "outcome" || fact.outcome.playerNumber !== command.playerNumber ||
      fact.outcome.authorityEpoch !== command.execution?.authorityEpoch || fact.outcome.reason !== "applied" ||
      fact.outcome.sequence !== command.execution?.sequence || fact.outcome.commitmentKey !== command.execution?.commitmentKey ||
      fact.outcome.intentId !== command.execution?.intentId || fact.outcome.effectId !== command.execution?.effectId ||
      fact.outcome.tick !== fact.tick || fact.tick !== placement.tick || fact.outcome.tick < command.tick ||
      fact.sequence >= resolution.sequence || fact.tick > resolution.tick ||
      fact.sequence <= placement.sequence || !fact.outcome.worldLinkIds.includes(path.target.actorId ?? "") ||
      !fact.outcome.actorIds.includes(path.source.actorId ?? ""))) {
    failures.push("production_spatial_construction_application_mismatch");
  }
  return { placement: failures.length ? null : placement, failures, gaps };
}
