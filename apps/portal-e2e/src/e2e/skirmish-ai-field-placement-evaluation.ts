import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { hasNativeFieldFoodDelivery } from "./skirmish-ai-field-food-delivery";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Safe-room owner outcome: native new fields, reserved-space exclusion and actual crop-to-food delivery. */
export function evaluateFieldPlacementWorld(
  result: Pick<RuntimeVariantResultV1, "productionPreset" | "productionCapture" | "presetCreatedActorIds">
): string[] {
  const capture = result.productionCapture, baseline = result.productionPreset?.placementBaseline;
  if (!capture || !baseline || capture.startedTick !== 0 || capture.droppedFactCount || capture.droppedSnapshotCount ||
      capture.frontiers?.latestTick !== 2400 || capture.frontiers.closedThroughTick !== 2400 || capture.frontiers.gaps.length) {
    return ["field_placement_native_history_incomplete"];
  }
  const facts = capture.facts.filter((fact) => fact.tick <= 2400);
  let nextTick = 0;
  for (const interval of capture.frontiers.intervals) {
    if (interval.closedFromTick !== nextTick || !Number.isSafeInteger(interval.closedThroughTick) ||
        interval.closedThroughTick < interval.closedFromTick || interval.closedThroughTick > 2400 ||
        interval.capturedAtTick !== interval.closedThroughTick + 1) return ["field_placement_closed_interval_missing_or_reordered"];
    nextTick = interval.closedThroughTick + 1;
  }
  if (nextTick !== 2401) return ["field_placement_closed_interval_missing_or_reordered"];
  const placements = facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "placement" && fact.spatial.site.canonicalObjectName === "Field"
  );
  const failures: string[] = [], fields: { id: string; x: number; y: number; completedAt: number }[] = [];
  for (const fact of placements) {
    if (fact.spatial.kind !== "placement") continue;
    const spatial = fact.spatial, id = spatial.site.actorId;
    if (facts.some((entry) => entry.kind === "construction_authority" && entry.construction.site.actorId === id &&
      (!entry.construction.sceneActive || entry.construction.snapshotRestoreInProgress || entry.construction.clockTick !== entry.tick)
    )) failures.push("field_construction_native_boundary_invalid");
    const applied = facts.some((entry) => entry.kind === "outcome" && entry.outcome.kind === "applied" &&
      entry.outcome.commandId === spatial.command.execution?.commandId && entry.outcome.worldLinkIds.includes(id ?? "")
    );
    if (!applied) continue;
    const finished = facts.filter((entry) => entry.kind === "construction_authority" &&
      entry.construction.kind === "lifecycle" && entry.construction.transition === "finished" && entry.construction.site.actorId === id
    );
    const completion = finished[0];
    const price = facts.filter((entry) => entry.kind === "construction_authority" &&
      entry.construction.kind === "resource" && entry.construction.operation === "start_charge" &&
      entry.construction.site.actorId === id && entry.construction.status === "returned" &&
      entry.construction.balanceMatches && entry.construction.callbackCount === 1 && entry.construction.ownerArgument === capture.playerNumber
    );
    if (!id || !spatial.legal || !spatial.footprint?.length || spatial.gaps.length || spatial.footprint.some((tile) =>
      !Number.isSafeInteger(tile.x) || !Number.isSafeInteger(tile.y) || tile.x < 0 || tile.y < 0
    ) ||
        spatial.clockTick !== fact.tick || spatial.snapshotRestoreInProgress || !spatial.sceneActive ||
        spatial.command.execution?.source !== "ai" || spatial.site.playerNumber !== capture.playerNumber ||
        Object.values(result.presetCreatedActorIds).includes(id) || fields.some((field) => field.id === id) ||
        finished.length !== 1 || !completion || price.length !== 1) {
      failures.push("new_field_not_native_paid_ai_completion");
      continue;
    }
    const footprint = spatial.footprint;
    const occupiedReserve = baseline.routes.some((route) => (route.path ?? []).some((point) => footprint.some((tile) =>
      Math.abs(tile.x - point.x) <= route.declaration.tileMargin && Math.abs(tile.y - point.y) <= route.declaration.tileMargin
    )));
    if (occupiedReserve) failures.push("new_field_occupies_reserved_production_or_retreat_space");
    const x = (Math.min(...footprint.map((tile) => tile.x)) + Math.max(...footprint.map((tile) => tile.x))) / 2;
    const y = (Math.min(...footprint.map((tile) => tile.y)) + Math.max(...footprint.map((tile) => tile.y))) / 2;
    fields.push({ id, x, y, completedAt: completion.tick });
    const retained = capture.frontiers.intervals.filter((interval) => interval.closedThroughTick >= completion.tick);
    if (!retained.length || retained.some((interval) => !interval.actors.some(({ identity }) => identity.actorId === id &&
      identity.active && identity.alive && identity.indexed && identity.finished
    ))) failures.push(`new_field_not_retained_after_completion:${id}`);
  }
  if (fields.length < 2) failures.push("multiple_new_completed_fields_missing");
  if (fields.length >= 2 && !fields.some((left, index) => fields.some((right, other) => index !== other &&
    ((left.x === right.x && left.y !== right.y) || (left.y === right.y && left.x !== right.x))
  ))) failures.push("new_fields_have_no_aligned_row_or_column");
  for (const field of fields) {
    if (!hasNativeFieldFoodDelivery(facts, field.id, field.completedAt, capture.playerNumber)) {
      failures.push(`new_field_has_no_native_delivered_food:${field.id}`);
    }
  }
  return [...new Set(failures)];
}
