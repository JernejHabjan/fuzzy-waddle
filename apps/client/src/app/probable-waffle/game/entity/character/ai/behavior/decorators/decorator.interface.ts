import { PawnAiBlackboard } from "../../pawn-ai-blackboard";
import GameObject = Phaser.GameObjects.GameObject;

export class DecoratorData {
  constructor(
    public owner: GameObject,
    public blackboard: PawnAiBlackboard
  ) {}
}

export interface IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean;
}
