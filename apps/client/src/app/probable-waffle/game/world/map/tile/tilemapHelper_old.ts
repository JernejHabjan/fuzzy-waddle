import { MapSizeInfo_old } from "../../const/map-size.info_old";
import { TileCenterOptions } from "./types/tile-types";
import { IsoHelper } from "./iso-helper";
import { Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class TilemapHelper_old {
  constructor(private readonly scene: Scene) {}

  static get tileCenterOffset_old(): number {
    // todo move to IsoHelper
    return MapSizeInfo_old.info.tileHeightHalf;
  }

  static adjustTileWorldWithVerticalOffset_old(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    if (tileCenterOptions?.offsetInPx) {
      return { x: tileXY.x, y: tileXY.y - tileCenterOptions.offsetInPx };
    }
    if (tileCenterOptions?.centerOfTile) {
      return { x: tileXY.x, y: tileXY.y + TilemapHelper_old.tileCenterOffset_old };
    }
    return tileXY;
  }

  static getTileWorldCenterByTilemapTileXY(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    return this.adjustTileWorldWithVerticalOffset_old(IsoHelper.getWorldCenterXY(tileXY), tileCenterOptions);
  }
}
