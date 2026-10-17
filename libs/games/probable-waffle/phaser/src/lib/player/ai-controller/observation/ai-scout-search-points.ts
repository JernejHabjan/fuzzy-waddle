import type { AiAccessNodeId, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiAccessCellV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-access-graph-v1";

/** Cached geography samples for information missions, separate from route connectivity. No hidden actors are consulted. */
export function buildAiScoutSearchPoints(cells: readonly AiAccessCellV1[], nodes: ReadonlyMap<string, AiAccessNodeId>) {
  let width = 0,
    height = 0;
  for (const cell of cells) {
    width = Math.max(width, cell.x + 1);
    height = Math.max(height, cell.y + 1);
  }
  let sector = 8;
  while (Math.ceil(width / sector) * Math.ceil(height / sector) > 128) sector += 4;
  const selected = new Map<string, AiAccessCellV1>();
  const distance = (cell: AiAccessCellV1) =>
    Math.hypot(
      cell.x - (Math.floor(cell.x / sector) * sector + (sector - 1) / 2),
      cell.y - (Math.floor(cell.y / sector) * sector + (sector - 1) / 2)
    );
  for (const cell of cells) {
    if (!cell.ground || cell.knowledge !== "known_static" || !nodes.has(`${cell.x},${cell.y}`)) continue;
    const key = `search:ground:${sector}:${Math.floor(cell.x / sector)}:${Math.floor(cell.y / sector)}`;
    const previous = selected.get(key);
    if (
      !previous ||
      distance(cell) < distance(previous) ||
      (distance(cell) === distance(previous) && (cell.y < previous.y || (cell.y === previous.y && cell.x < previous.x)))
    )
      selected.set(key, cell);
  }
  return [...selected]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([pointId, cell]) => {
      const accessNodeId = nodes.get(`${cell.x},${cell.y}`);
      return accessNodeId
        ? [{ pointId, accessNodeId, position: { x: cell.x, y: cell.y, z: cell.elevation }, observed: false }]
        : [];
    }) satisfies NonNullable<NonNullable<AiObservationV1["map"]>["scoutSearchPoints"]>;
}
