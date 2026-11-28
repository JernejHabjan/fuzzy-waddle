import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiFortificationState } from "../../contracts/state/ai-fortification-state";
import { reachableAiAccessNodeIds } from "../access/ai-access-graph";
import { constructionAccessPolicy } from "./ai-construction-access";

type ConstructionCell = NonNullable<NonNullable<AiObservation["map"]>["constructionCells"]>[number];

/** Keeps generic construction out of the current fortification's gate and two-tile approach. */
export function aiFortificationGateClearanceFilter(
  fortifications: readonly AiFortificationState[],
  acceptCell?: (cell: ConstructionCell) => boolean
): (cell: ConstructionCell) => boolean {
  const protectedGateTiles = new Set<string>();
  for (const plan of fortifications) {
    if (plan.lifecycle === "abandoned" || !plan.graph) continue;
    const gate = plan.graph.nodes.find(
      (node) => node.nodeId === plan.graph?.openingNodeId && node.kind === "gate_slot"
    );
    if (!gate) continue;
    const centerX = Math.round(gate.position.x),
      centerY = Math.round(gate.position.y);
    for (let dy = -2; dy <= 2; dy += 1)
      for (let dx = -2; dx <= 2; dx += 1) protectedGateTiles.add(`${centerX + dx},${centerY + dy}`);
  }
  return (cell) => !protectedGateTiles.has(cell.tileKey) && (acceptCell?.(cell) ?? true);
}

/** Selects an observed buildable footprint and reserves its tiles for this decision. */
export function selectConstructionPosition(
  observation: AiObservation,
  builder: AiObservation["actors"][number],
  _decisionSequence: number,
  _ordinal: number,
  selectedTileKeys: Set<string>,
  footprintRadiusTiles = 0,
  /** Optional production policy filter; shared construction application remains the placement authority. */
  acceptCell?: (cell: NonNullable<NonNullable<AiObservation["map"]>["constructionCells"]>[number]) => boolean
) {
  if (builder.logicalPosition.status !== "known") return undefined;
  const origin = builder.logicalPosition.value;
  const cells = observation.map?.constructionCells ?? [];
  const byKey = new Map(cells.map((cell) => [cell.tileKey, cell]));
  const builderAccessNodeId =
    observation.map?.regionGeneration?.status === "ready" && builder.accessNodeId.status === "known"
      ? builder.accessNodeId.value
      : undefined;
  const builderReachableAccessNodeIds =
    builderAccessNodeId && observation.map?.accessGraph?.status === "ready"
      ? reachableAiAccessNodeIds(observation.map.accessGraph, [builderAccessNodeId], "ground", 1)
      : undefined;
  const preservesAccess = constructionAccessPolicy(observation, builder, selectedTileKeys, footprintRadiusTiles);
  const footprintKeys = (x: number, y: number) => {
    const keys: string[] = [];
    for (let offsetY = -footprintRadiusTiles; offsetY <= footprintRadiusTiles; offsetY += 1) {
      for (let offsetX = -footprintRadiusTiles; offsetX <= footprintRadiusTiles; offsetX += 1) {
        keys.push(`${x + offsetX},${y + offsetY}`);
      }
    }
    return keys;
  };
  const hasBuilderReachableApproach = (x: number, y: number) => {
    if (!builderAccessNodeId) return true;
    let hasKnownApproach = false;
    for (let offsetY = -footprintRadiusTiles - 1; offsetY <= footprintRadiusTiles + 1; offsetY += 1) {
      for (let offsetX = -footprintRadiusTiles - 1; offsetX <= footprintRadiusTiles + 1; offsetX += 1) {
        if (Math.abs(offsetX) <= footprintRadiusTiles && Math.abs(offsetY) <= footprintRadiusTiles) continue;
        const approach = byKey.get(`${x + offsetX},${y + offsetY}`);
        if (!approach?.groundAccessNodeId) continue;
        hasKnownApproach = true;
        if (
          approach.groundAccessNodeId === builderAccessNodeId ||
          builderReachableAccessNodeIds?.has(approach.groundAccessNodeId)
        )
          return true;
      }
    }
    return !hasKnownApproach;
  };
  const candidates = cells
    .filter((cell) => {
      if (!hasBuilderReachableApproach(cell.position.x, cell.position.y)) return false;
      const keys = footprintKeys(cell.position.x, cell.position.y);
      return keys.every((key) => {
        const footprintCell = byKey.get(key);
        return (
          key !== `${Math.round(origin.x)},${Math.round(origin.y)}` &&
          footprintCell !== undefined &&
          footprintCell.groundPassable &&
          !footprintCell.observedBlocked &&
          !selectedTileKeys.has(key) &&
          (acceptCell?.(footprintCell) ?? true)
        );
      });
    })
    .sort(
      (left, right) =>
        Math.abs(left.position.x - origin.x) +
          Math.abs(left.position.y - origin.y) -
          (Math.abs(right.position.x - origin.x) + Math.abs(right.position.y - origin.y)) ||
        left.tileKey.localeCompare(right.tileKey)
    );
  if (candidates.length === 0) return undefined;
  // Reservations already spread concurrent footprints. Rotating across all candidates discards the distance
  // ordering and can send an idle builder across the map, invalidating the capacity schedule's travel allowance.
  const selected = candidates.find((cell) => preservesAccess(footprintKeys(cell.position.x, cell.position.y)));
  if (!selected) return undefined;
  for (const key of footprintKeys(selected.position.x, selected.position.y)) selectedTileKeys.add(key);
  return selected.position;
}
