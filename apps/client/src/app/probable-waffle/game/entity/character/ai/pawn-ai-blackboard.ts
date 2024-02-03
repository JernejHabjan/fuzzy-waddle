import { Blackboard } from "./blackboard";
import { OrderType } from "./order-type";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export class PawnAiBlackboard extends Blackboard {
  orderType?: OrderType;
  targetGameObject?: GameObject;
  targetLocation?: Vector3Simple;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: string;
}
