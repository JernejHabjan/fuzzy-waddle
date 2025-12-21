import { getTilesAroundGameObjectsOfShape } from "../../../data/tile-map-helpers";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { NavigationService } from "../../../world/services/navigation.service";
import { GameObjects } from "phaser";

export class TileMapTintComponent {
  constructor(
    private readonly tint: number,
    private readonly radius: number
  ) {}

  tintTilemapAroundTransform = (gameObject: GameObjects.GameObject) => {
    const scene = gameObject.scene;
    const { tiles } = getTilesAroundGameObjectsOfShape(gameObject, scene, this.radius, "circle");
    const navigationService = getSceneService(scene, NavigationService)!;
    tiles.forEach((tile) => {
      const isWalkable = navigationService.isTileGridWithoutBlockingObjectsWalkable({ x: tile.x, y: tile.y });
      if (isWalkable) tile.tint = this.tint;
    });
  };
}
