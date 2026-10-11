import type { ActorId, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getActorComponent } from "../../data/actor-component";
import { FlyingComponent } from "../components/movement/flying-component";
import type { MovementRuntime } from "./movement-runtime";

// Formation expansion stops after a bounded connected-component search so large
// move groups do not flood-fill an entire platform while assigning destinations.
const FORMATION_MAX_CONNECTED_CELLS = 96;

/** Selects and reserves a connected formation slot using the original actor ordering and native reachability calls. */
export class MovementFormation {
  constructor(private readonly runtime: MovementRuntime) {}

  /**
   * Prevents units from clumping up in the same point.
   * It places units in a classic RTS game formation, arranging them in a grid around the target tile.
   * Todo - this is not the most efficient way to do this:
   * Todo - instead of finding tileVec3 here, we should rework "command.issued.move"
   * Todo - to send the target tileVec3 for each actor
   */
  async getTileVec3ByDynamicFlocking(
    tileVec3: Vector3Simple,
    selectedActorObjectIds: ActorId[]
  ): Promise<Vector3Simple> {
    const unitCount = selectedActorObjectIds.length;
    if (unitCount < 2) {
      return tileVec3;
    }
    if (getActorComponent(this.runtime.gameObject, FlyingComponent)) {
      return tileVec3;
    }

    const idComponent = getActorComponent(this.runtime.gameObject, IdComponent);
    if (!idComponent || !this.runtime.navigationService) return tileVec3;

    const ownId = idComponent.id;
    const ownIndex = selectedActorObjectIds.findIndex((id) => id === ownId);

    if (ownIndex === -1) {
      console.warn(
        `[MovementSystem] getTileVec3ByDynamicFlocking: ownId (${ownId}) not found in selectedActorObjectIds. ` +
          "This should not happen if logic is correct. Returning original tileVec3.",
        { ownId, selectedActorObjectIds, tileVec3 }
      );
      return tileVec3; // Should not happen if logic is correct
    }

    const formationPoints = this.getConnectedFormationPoints(tileVec3, unitCount);

    // Sort the selected units by their ID to ensure a consistent order
    const sortedSelectedIds = [...selectedActorObjectIds].sort();
    const ownSortedIndex = sortedSelectedIds.findIndex((id) => id === ownId);

    // Sort formation points by distance to the original target tile
    formationPoints.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - tileVec3.x, 2) + Math.pow(a.y - tileVec3.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - tileVec3.x, 2) + Math.pow(b.y - tileVec3.y, 2));
      if (distA !== distB) return distA - distB;
      // Deterministic tie-break for equal-distance points keeps formation assignment stable.
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const terrainType =
      this.runtime.actorTranslateComponent?.actorTranslateDefinition.movementTerrainType ?? MovementTerrainType.Ground;
    const targetHeight = this.runtime.navigationService.getNavigableHeightAtTile(tileVec3);
    const sameHeightFormationPoints: Vector2Simple[] = [];
    const otherHeightFormationPoints: Vector2Simple[] = [];
    for (const point of formationPoints) {
      const pointHeight = this.runtime.navigationService.getNavigableHeightAtTile(point);
      if (pointHeight === targetHeight) {
        sameHeightFormationPoints.push(point);
      } else {
        otherHeightFormationPoints.push(point);
      }
    }

    // Assign a unique formation point to this unit based on its sorted index
    const orderedCandidateGroups = [sameHeightFormationPoints, otherHeightFormationPoints];
    for (const candidateGroup of orderedCandidateGroups) {
      if (candidateGroup.length === 0) continue;
      const candidateStartIndex = ownSortedIndex % candidateGroup.length;
      const orderedCandidates = [
        ...candidateGroup.slice(candidateStartIndex),
        ...candidateGroup.slice(0, candidateStartIndex)
      ];

      for (const assignedPoint of orderedCandidates) {
        const destinationTile: Vector2Simple = { x: assignedPoint.x, y: assignedPoint.y };

        // Check if the assigned point is valid and reachable
        if (this.runtime.navigationService.isTileNavigable(destinationTile, terrainType)) {
          const movementOccupancy = this.runtime.movementOccupancyService;
          const destinationHeight = this.runtime.navigationService.getNavigableHeightAtTile(destinationTile);
          const dynamicBlockers =
            movementOccupancy?.getDynamicBlockersForActor(ownId, {
              includeDestinationReservations: false
            }) ?? [];
          const path = await this.runtime.navigationService.findPathFromGameObjectToTileAvoidingDynamicBlockers(
            this.runtime.gameObject,
            destinationTile,
            dynamicBlockers
          );
          if (path !== null && path.length > 0) {
            const footprint = movementOccupancy?.getActorFootprintAtTile(this.runtime.gameObject, destinationTile);
            if (footprint && !movementOccupancy?.reserveDestination(ownId, footprint, destinationHeight)) {
              continue;
            }
            return {
              x: destinationTile.x,
              y: destinationTile.y,
              z: destinationHeight
            } satisfies Vector3Simple;
          }
        }
      }
    }

    // Fallback to original target if no suitable position is found
    return tileVec3;
  }

  private getConnectedFormationPoints(tileVec3: Vector3Simple, unitCount: number): Vector2Simple[] {
    const navigationService = this.runtime.navigationService;
    if (!navigationService) return [{ x: tileVec3.x, y: tileVec3.y }];
    // Prefer connected same-height positions so formations do not assign some
    // units to the ground while others are standing on walls or stairs.
    const connectedSameHeight = navigationService.getConnectedNavigableTiles(
      { x: tileVec3.x, y: tileVec3.y },
      { sameHeightOnly: true, maxTiles: FORMATION_MAX_CONNECTED_CELLS }
    );
    if (connectedSameHeight.length >= unitCount) {
      return connectedSameHeight;
    }
    const connectedAnyHeight = navigationService.getConnectedNavigableTiles(
      { x: tileVec3.x, y: tileVec3.y },
      { sameHeightOnly: false, maxTiles: FORMATION_MAX_CONNECTED_CELLS }
    );
    return connectedSameHeight.concat(
      connectedAnyHeight.filter(
        (point) => !connectedSameHeight.some((sameHeight) => sameHeight.x === point.x && sameHeight.y === point.y)
      )
    );
  }
}
