import Minimap from "./Minimap";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getCurrentPlayerNumber, getPlayer } from "../../data/scene-data";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { OrderType } from "../../ai/order-type";
import { CommandBusService } from "../../world/services/command-bus.service";
import { getSceneService } from "../../world/services/scene-component-helpers";

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
    const playerNumber = getCurrentPlayerNumber(this.scene);
    const actorIds = getPlayer(this.scene)?.getSelection() ?? [];
    if (!playerNumber || !actorIds.length) return;

    const commandBus = getSceneService(this.scene, CommandBusService);
    commandBus?.dispatch({
      type: "ACTOR_ACTION",
      playerNumber,
      actorIds,
      orderType: data.orderType,
      targetObjectIds: data.objectIds,
      tileVec3: data.tileVec3,
      queue: false
    });
  }

  private destroy() {
    this.scene.events.off(Minimap.assignActorActionToTileCoordinatesEvent, this.assignActionToTileCoordinates, this);
  }
}
