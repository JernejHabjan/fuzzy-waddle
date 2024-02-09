import { MapSizeInfo } from "../../const/map-size.info";
import { TileCenterOptions } from "./types/tile-types";
import { IsoHelper } from "./iso-helper";
import { Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class TilemapHelper {
  constructor(private readonly scene: Scene) {}

  static get tileCenterOffset(): number {
    // todo move to IsoHelper
    return MapSizeInfo.info.tileHeightHalf;
  }

  static adjustTileWorldWithVerticalOffset(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    if (tileCenterOptions?.offsetInPx) {
      return { x: tileXY.x, y: tileXY.y - tileCenterOptions.offsetInPx };
    }
    if (tileCenterOptions?.centerOfTile) {
      return { x: tileXY.x, y: tileXY.y + TilemapHelper.tileCenterOffset };
    }
    return tileXY;
  }

  static getTileWorldCenterByTilemapTileXY(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    return this.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), tileCenterOptions);
  }
}
