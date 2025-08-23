import Minimap from "../../../prefabs/gui/Minimap";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { emitEventIssueActorCommandToSelectedActors } from "../../../data/scene-data";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { OrderType } from "../../../entity/character/ai/order-type";

export interface GameObjectActionAssignerConfig {
  objectIds?: string[];
  tileVec3?: Vector3Simple;
  orderType?: OrderType;
}

export class GameObjectActionAssigner {
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindActionSubscription();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  private bindActionSubscription() {
    this.scene.events.on(Minimap.assignActorActionToTileCoordinatesEvent, this.assignActionToTileCoordinates, this);
  }

  private assignActionToTileCoordinates(data: GameObjectActionAssignerConfig) {
    emitEventIssueActorCommandToSelectedActors(this.scene, data);
  }

  private destroy() {
    this.scene.events.off(Minimap.assignActorActionToTileCoordinatesEvent, this.assignActionToTileCoordinates, this);
  }
}
