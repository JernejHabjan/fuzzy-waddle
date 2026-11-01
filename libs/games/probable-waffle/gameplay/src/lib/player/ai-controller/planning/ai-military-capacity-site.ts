import type { AiObservedActor, AiObservation } from "../contracts/ai-observation";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { isAiProducerPositionExposed, reachableAiConstructionTiles } from "./ai-producer-safety";

/** Builder preference never vetoes all capacity: try the next available worker when the first has no known legal route/site. */
export function selectAiMilitaryCapacitySite(args: {
  readonly observation: AiObservation;
  readonly builders: readonly AiObservedActor[];
  readonly decisionSequence: number;
  readonly ordinal: number;
  readonly selectedTileKeys: Set<string>;
  readonly footprintRadiusTiles: number;
  readonly safePolicy: boolean;
  readonly threats: readonly AiObservedActor[];
}) {
  for (const builder of args.builders) {
    const reachable = args.safePolicy ? reachableAiConstructionTiles(args.observation, builder) : null;
    const position = selectConstructionPosition(
      args.observation,
      builder,
      args.decisionSequence,
      args.ordinal,
      args.selectedTileKeys,
      args.footprintRadiusTiles,
      args.safePolicy
        ? (cell) =>
            reachable?.has(cell.tileKey) === true &&
            !isAiProducerPositionExposed({ ...cell.position, z: cell.elevation }, args.threats)
        : undefined
    );
    if (position) return { builder, position };
  }
  return null;
}
