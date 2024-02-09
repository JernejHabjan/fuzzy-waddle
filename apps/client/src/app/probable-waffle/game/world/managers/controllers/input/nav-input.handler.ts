import { Pathfinder } from "../../../map/pathfinder";
import { MapSizeInfo } from "../../../const/map-size.info";
import { TilePlacementWorldWithProperties } from "../../../map/tile/manual-tiles/manual-tiles.helper";
import { MapNavHelper } from "../../../map/map-nav-helper";
import { CharacterMovementComponent } from "../../../../entity/actor/components/character-movement-component";
import { RepresentableActor } from "../../../../entity/actor/representable-actor";
import { Scene } from "phaser";
import { TransformComponent } from "../../../../entity/actor/components/transformable-component";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class NavInputHandler {
  constructor(
    private readonly scene: Scene,
    private readonly pathfinder: Pathfinder,
    private readonly mapNavHelper: MapNavHelper
  ) {}

  static tileXYWithinMapBounds(tileXY: Vector2Simple): boolean {
    return 0 <= tileXY.x && tileXY.x <= MapSizeInfo.info.width && 0 <= tileXY.y && tileXY.y <= MapSizeInfo.info.height;
  }

  startNav(navigableTile: TilePlacementWorldWithProperties, selected: RepresentableActor[]) {
    selected.forEach(async (selection) => {
      if (NavInputHandler.tileXYWithinMapBounds(navigableTile.tileWorldData.tileXY)) {
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

  destroy() {
    // todo?
  }
}
