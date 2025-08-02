import { OrderType } from "./order-type";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export class OrderData {
  constructor(
    public orderType: OrderType,
    public data: {
      targetGameObject?: GameObject;
      targetTileLocation?: Vector3Simple;
    } = {}
  ) {}
}
