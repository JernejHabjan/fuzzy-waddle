import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { constructionAccessPolicy } from "./ai-construction-access";

/** Selects an observed buildable footprint and reserves its tiles for this decision. */
export function selectConstructionPosition(
  observation: AiObservationV1,
  builder: AiObservationV1["actors"][number],
  _decisionSequence: number,
  _ordinal: number,
  selectedTileKeys: Set<string>,
  footprintRadiusTiles = 0,
  /** Optional production policy filter; shared construction application remains the placement authority. */
  acceptCell?: (cell: NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number]) => boolean
) {
  if (builder.logicalPosition.status !== "known") return undefined;
  const origin = builder.logicalPosition.value;
  const cells = observation.map?.constructionCells ?? [];
  const byKey = new Map(cells.map((cell) => [cell.tileKey, cell]));
  const builderAccessNodeId = observation.map?.regionGeneration.status === "ready" &&
      builder.accessNodeId.status === "known"
    ? builder.accessNodeId.value
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
        if (approach.groundAccessNodeId === builderAccessNodeId) return true;
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
