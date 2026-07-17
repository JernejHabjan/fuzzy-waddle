import { OrderType } from "./order-type";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../data/actor-component";
import { IdComponent } from "../entity/components/id-component";
import { getSceneService } from "../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../world/services/ActorIndexSystem";
import { SimulationTickService } from "../world/services/simulation-tick.service";
import type { Subscription } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;

export class OrderData {
  constructor(
    public orderType: OrderType,
    public data: {
      targetGameObject?: GameObject;
      targetTileLocation?: Vector3Simple;
      targetGameObjectId?: string;
    } = {}
  ) {}

  static mapFromOrderDataClassToRecord(order: OrderData): Record<string, any> {
    return {
      orderType: order.orderType,
      data: {
        targetTileLocation: order.data.targetTileLocation,
        targetGameObjectId: order.data.targetGameObject
          ? getActorComponent(order.data.targetGameObject, IdComponent)?.id
          : order.data.targetGameObjectId
      }
    };
  }

  static mapFromRecordToOrderDataClass(record: Record<string, any>, scene: Phaser.Scene): OrderData {
    const orderType = record.orderType as OrderType;
    const data: { targetGameObject?: GameObject; targetTileLocation?: Vector3Simple; targetGameObjectId?: string } = {};
    if (record.data?.targetTileLocation) {
      data.targetTileLocation = record.data.targetTileLocation as Vector3Simple;
    }

    if (record.data?.targetGameObjectId) {
      const targetGameObjectId = record.data.targetGameObjectId as string;
      data.targetGameObjectId = targetGameObjectId;
      // Fixes desync from wall-clock restore ordering by resolving actor references on simulation ticks.
      OrderData.resolveTargetGameObjectDeterministic(scene, data, targetGameObjectId);
    }
    return new OrderData(orderType, data);
  }

  private static resolveTargetGameObjectDeterministic(
    scene: Phaser.Scene,
    data: { targetGameObject?: GameObject; targetTileLocation?: Vector3Simple; targetGameObjectId?: string },
    targetGameObjectId: string
  ): void {
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    const immediateTarget = actorIndex?.getActorById(targetGameObjectId);
    if (immediateTarget) {
      data.targetGameObject = immediateTarget;
      return;
    }

    const simulationTickService = getSceneService(scene, SimulationTickService);
    if (!simulationTickService) {
      return;
    }

    let retries = 0;
    let tickSub: Subscription | undefined;
    const stopResolving = () => {
      tickSub?.unsubscribe();
      tickSub = undefined;
    };

    tickSub = simulationTickService.tick$.subscribe(() => {
      retries++;
      const target = actorIndex?.getActorById(targetGameObjectId);
      if (target) {
        data.targetGameObject = target;
        stopResolving();
        return;
      }
      // Fixes runaway subscriptions when an id never appears after snapshot restore.
      if (retries >= 200) {
        stopResolving();
      }
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopResolving);
  }
}
