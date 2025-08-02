import Minimap from "../../../prefabs/gui/Minimap";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { emitEventIssueActorCommandToSelectedActors } from "../../../data/scene-data";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class GameObjectActionAssigner {
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindActionSubscription();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  private bindActionSubscription() {
    this.scene.events.on(Minimap.assignActorActionToTileCoordinatesEvent, this.assignActionToTileCoordinates, this);
  }

  private assignActionToTileCoordinates(tileXY: Vector2Simple) {
    emitEventIssueActorCommandToSelectedActors(this.scene, {
      tileVec3: {
        x: tileXY.x,
        y: tileXY.y,
        z: 0
      }
    });
  }

  private destroy() {
    this.scene.events.on(Minimap.assignActorActionToTileCoordinatesEvent, this.assignActionToTileCoordinates, this);
  }
}
