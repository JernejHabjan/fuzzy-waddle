import { PawnAiBlackboard } from "../../pawn-ai-blackboard";
import GameObject = Phaser.GameObjects.GameObject;

export class DecoratorData_old {
  constructor(
    public owner: GameObject,
    public blackboard: PawnAiBlackboard
  ) {}
}

export interface IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean;
}
