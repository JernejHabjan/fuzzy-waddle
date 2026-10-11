import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeProducerRoutesV1 } from "./skirmish-ai-runtime-producer-routes";

/** Require exact native item/product/completion identity; names, prices and nearest timestamps cannot select a demand. */
export function matchRuntimeProducerOutput(
  capture: AiRuntimeProductionCaptureV1, boundary: RuntimeProducerRoutesV1["outputs"][number]["boundary"],
  commands: RuntimeProductionCausalityV1["commands"], completions: RuntimeProductionCausalityV1["completions"],
  spatial: RuntimeProductionSpatialAuthorityV1
) {
  const failures: string[] = [];
  const gaps = ["production_route_rally_command_identity_missing", "production_route_useful_arrival_missing"];
  let completion: RuntimeProducerRoutesV1["outputs"][number]["completion"] = null;
  let commandScope: RuntimeProducerRoutesV1["outputs"][number]["commandScope"] = null;
  let spawn: RuntimeProducerRoutesV1["outputs"][number]["spawn"] = null;
  const value = boundary.spatial;
  if (value.kind !== "output") return { boundary, completion, commandScope, spawn, failures, gaps };
  const candidates = completions.filter((entry) => entry.itemId === value.item.itemId &&
    entry.actorId === value.producer.actorId && entry.worldLinkId === value.product.actorId);
  if (candidates.length > 1) failures.push("production_route_output_completion_ambiguous");
  const actual = candidates[0];
  if (actual) {
    const origin = commands.find((entry) => entry.command.execution?.commandId === actual.originatingCommandId);
    const before = capture.facts.find((fact) => fact.sequence === actual.authorityBoundarySequences[0]);
    const created = actual.createdActor;
    if (!created || !origin || before?.kind !== "queue_completion" ||
      !isDeepStrictEqual(before.completion.item, value.item) || value.item.commandId !== actual.originatingCommandId ||
      value.item.effectId !== actual.effectId || value.product.canonicalObjectName !== created.canonicalObjectName ||
      value.product.playerNumber !== created.playerNumber || origin.command.type !== "PRODUCTION" ||
      !origin.command.actorIds.includes(value.producer.actorId ?? "") ||
      actual.authorityBoundarySequences[1] >= boundary.sequence || actual.terminalSequence <= boundary.sequence ||
      actual.authorityTick !== boundary.tick || boundary.tick > actual.terminalTick) {
      failures.push("production_route_output_completion_mismatch");
    } else if (!value.snapshotRestoreInProgress && value.clockTick !== null && value.sceneActive &&
      value.product.active && value.product.alive && value.product.finished && value.product.indexed &&
      value.producer.active && value.producer.alive && value.producer.finished && value.producer.indexed) {
      completion = actual; commandScope = origin;
    } else gaps.push("production_route_output_live_binding_missing");
  } else {
    const conflict = completions.some((entry) => entry.itemId === value.item.itemId ||
      entry.worldLinkId === value.product.actorId);
    if (conflict) failures.push("production_route_output_completion_mismatch");
    gaps.push("production_route_output_completion_identity_missing");
  }
  const spawns = spatial.spawns.filter((fact) => fact.spatial.kind === "spawn" &&
    fact.spatial.producer.actorId === value.producer.actorId && fact.spatial.item.itemId === value.item.itemId &&
    fact.sequence < boundary.sequence);
  if (spawns.length > 1) failures.push("production_route_output_spawn_ambiguous");
  const placement = spawns[0];
  if (placement?.spatial.kind === "spawn") {
    if (!isDeepStrictEqual(placement.spatial.item, value.item) || !placement.spatial.tile ||
      placement.tick !== boundary.tick || (actual && (placement.sequence <= actual.removalSequence ||
        placement.sequence >= actual.authorityBoundarySequences[0]))) failures.push("production_route_output_spawn_mismatch");
    else spawn = placement;
  } else gaps.push("production_route_output_spawn_identity_missing");
  if (!commandScope?.decision) gaps.push("production_route_accepted_demand_identity_missing");
  return { boundary, completion, commandScope, spawn, failures, gaps };
}
