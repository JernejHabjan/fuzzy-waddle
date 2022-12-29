import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { Vector2Simple } from '../math/intersection';
import { MapNavHelper } from '../map/map-nav-helper';
import { CharacterMovementComponent } from '../characters/character-movement-component';
import { RepresentableActor } from '../characters/representable-actor';

export class NavInputHandler {
  constructor(
    private readonly scene: Phaser.Scene,
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
          const tileXYPath = await this.pathfinder.find(
            selection.transformComponent.tilePlacementData.tileXY,
            {
              x: navigableTile.tileWorldData.tileXY.x,
              y: navigableTile.tileWorldData.tileXY.y
            },
            this.mapNavHelper.getFlattenedGrid
          );

          const characterMovementComponent = selection.components.findComponent(CharacterMovementComponent);
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
