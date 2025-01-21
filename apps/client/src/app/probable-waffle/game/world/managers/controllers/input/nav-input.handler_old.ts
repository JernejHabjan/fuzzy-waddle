import { Pathfinder_old } from "../../../map/pathfinder_old";
import { MapSizeInfo_old } from "../../../const/map-size.info_old";
import { TilePlacementWorldWithProperties } from "../../../map/tile/manual-tiles/manual-tiles.helper";
import { MapNavHelper_old } from "../../../map/map-nav-helper_old";
import { CharacterMovementComponent } from "../../../../entity/actor/components/character-movement-component";
import { RepresentableActor_old } from "../../../../entity/actor/representable-actor_old";
import { Scene } from "phaser";
import { TransformComponent } from "../../../../entity/actor/components/transformable-component";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class NavInputHandler_old {
  constructor(
    private readonly scene: Scene,
    private readonly pathfinder: Pathfinder_old,
    private readonly mapNavHelper: MapNavHelper_old
  ) {}

  static tileXYWithinMapBounds(tileXY: Vector2Simple): boolean {
    return (
      0 <= tileXY.x &&
      tileXY.x <= MapSizeInfo_old.info.width &&
      0 <= tileXY.y &&
      tileXY.y <= MapSizeInfo_old.info.height
    );
  }

  startNav_old(navigableTile: TilePlacementWorldWithProperties, selected: RepresentableActor_old[]) {
    selected.forEach(async (selection) => {
      if (NavInputHandler_old.tileXYWithinMapBounds(navigableTile.tileWorldData.tileXY)) {
        try {
          const transformComponent = selection.components.findComponent(TransformComponent);
          const tileXYPath = await this.pathfinder.find(
            transformComponent.tilePlacementData.tileXY,
            {
              x: navigableTile.tileWorldData.tileXY.x,
              y: navigableTile.tileWorldData.tileXY.y
            },
            this.mapNavHelper.getFlattenedGrid
          );

          const characterMovementComponent = selection.components.findComponentOrNull(CharacterMovementComponent);
          if (characterMovementComponent) {
            characterMovementComponent.moveSpriteToTileCenters(tileXYPath);
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  destroy() {}
}
