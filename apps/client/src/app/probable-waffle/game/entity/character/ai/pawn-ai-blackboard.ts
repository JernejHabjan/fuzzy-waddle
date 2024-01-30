import { Blackboard } from "./blackboard";
import { OrderType } from "./order-type";
import { Actor } from "../../actor/actor";
import { TilePlacementData } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { ActorAbleToBeBuiltClass } from "../../actor/components/builder-component";
import GameObject = Phaser.GameObjects.GameObject;
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";

export class PawnAiBlackboard extends Blackboard {
  orderType?: OrderType;
  targetGameObject?: GameObject;
  targetLocation?: Vector3Simple;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: ActorAbleToBeBuiltClass;
}
