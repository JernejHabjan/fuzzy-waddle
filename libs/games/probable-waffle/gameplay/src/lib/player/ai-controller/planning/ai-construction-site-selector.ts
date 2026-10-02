import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** Selects an observed buildable footprint and reserves its tiles for this decision. */
export function selectConstructionPosition(
  observation: AiObservationV1,
  builder: AiObservationV1["actors"][number],
  decisionSequence: number,
  ordinal: number,
  selectedTileKeys: Set<string>,
  footprintRadiusTiles = 0,
  /** Optional production policy filter; shared construction application remains the placement authority. */
  acceptCell?: (cell: NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number]) => boolean
) {
  if (builder.logicalPosition.status !== "known") return undefined;
  const origin = builder.logicalPosition.value;
  const cells = observation.map?.constructionCells ?? [];
  const byKey = new Map(cells.map((cell) => [cell.tileKey, cell]));
  const footprintKeys = (x: number, y: number) => {
    const keys: string[] = [];
    for (let offsetY = -footprintRadiusTiles; offsetY <= footprintRadiusTiles; offsetY += 1) {
      for (let offsetX = -footprintRadiusTiles; offsetX <= footprintRadiusTiles; offsetX += 1) {
        keys.push(`${x + offsetX},${y + offsetY}`);
      }
    }
    return keys;
  };
  const candidates = cells
    .filter((cell) => {
      const keys = footprintKeys(cell.position.x, cell.position.y);
      return keys.every((key) => {
        const footprintCell = byKey.get(key);
        return (
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
  const selected = candidates[(decisionSequence + ordinal) % candidates.length];
  if (!selected) return undefined;
  for (const key of footprintKeys(selected.position.x, selected.position.y)) selectedTileKeys.add(key);
  return selected.position;
}
