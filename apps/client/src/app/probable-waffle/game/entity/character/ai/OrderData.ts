import { OrderType } from "./order-type";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "../../actor/components/id-component";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import GameObject = Phaser.GameObjects.GameObject;

export class OrderData {
  constructor(
    public orderType: OrderType,
    public data: {
      targetGameObject?: GameObject;
      targetTileLocation?: Vector3Simple;
    } = {}
  ) {}

  static mapFromOrderDataClassToRecord(order: OrderData): Record<string, any> {
    return {
      orderType: order.orderType,
      data: {
        targetTileLocation: order.data.targetTileLocation,
        targetGameObjectId: order.data.targetGameObject
          ? getActorComponent(order.data.targetGameObject, IdComponent)?.id
          : undefined
      }
    };
  }

  static mapFromRecordToOrderDataClass(record: Record<string, any>, scene: Phaser.Scene): OrderData {
    const orderType = record.orderType as OrderType;
    const data: { targetGameObject?: GameObject; targetTileLocation?: Vector3Simple } = {};
    if (record.data?.targetTileLocation) {
      data.targetTileLocation = record.data.targetTileLocation as Vector3Simple;
    }

    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (record.data?.targetGameObjectId) {
      const targetGameObjectId = record.data.targetGameObjectId as string;
      const targetGameObject = actorIndex?.getActorById(targetGameObjectId);
      if (targetGameObject) {
        data.targetGameObject = targetGameObject;
      }
    }
    return new OrderData(orderType, data);
  }
}
