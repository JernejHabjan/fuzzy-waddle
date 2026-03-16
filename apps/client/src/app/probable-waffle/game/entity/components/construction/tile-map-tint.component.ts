import { getTilesAroundGameObjectsOfShape } from "../../../data/tile-map-helpers";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { NavigationService } from "../../../world/services/navigation.service";
import { GameObjects } from "phaser";
import { HealthComponent } from "../combat/components/health-component";

export class TileMapTintComponent {
  private rerenderTintEvent = "rerender-tint-event";
  private gameObject!: GameObjects.GameObject;
  constructor(
    private readonly tint: number,
    private readonly radius: number
  ) {}

  init(gameObject: GameObjects.GameObject) {
    this.gameObject = gameObject;
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.scene.events.on(this.rerenderTintEvent, this.tintTilemapAroundTransform, this);
    this.tintTilemapAroundTransform();
  }

  private tintTilemapAroundTransform = () => {
    const scene = this.gameObject.scene;
    const { tiles } = getTilesAroundGameObjectsOfShape(this.gameObject, scene, this.radius, "circle");
    const navigationService = getSceneService(scene, NavigationService)!;
    tiles.forEach((tile) => {
      const isWalkable = navigationService.isTileGridWithoutBlockingObjectsWalkable({ x: tile.x, y: tile.y });
      if (isWalkable) tile.tint = this.tint;
    });
  };

  private restoreTint = () => {
    const scene = this.gameObject.scene;
    const { tiles } = getTilesAroundGameObjectsOfShape(this.gameObject, scene, this.radius, "circle");
    const navigationService = getSceneService(scene, NavigationService)!;
    tiles.forEach((tile) => {
      const isWalkable = navigationService.isTileGridWithoutBlockingObjectsWalkable({ x: tile.x, y: tile.y });
      if (isWalkable) tile.tint = 0xffffff;
    });
  };

  onKilled() {
    this.gameObject.scene.events.off(this.rerenderTintEvent, this.tintTilemapAroundTransform, this);
    if (!this.gameObject.active || !this.gameObject.scene.scene.isActive()) return;
    this.restoreTint();
    // make sure others know to rerender tints as current tint may be overlapping with others
    this.gameObject.scene.events.emit(this.rerenderTintEvent);
  }

  destroy() {
    this.onKilled();
  }
}
