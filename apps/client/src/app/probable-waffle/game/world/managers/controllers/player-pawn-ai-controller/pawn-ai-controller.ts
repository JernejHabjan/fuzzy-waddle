import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { NodeDebugger } from "./node-debugger";
import { OrderType } from "../../../../entity/character/ai/order-type";
import { environment } from "../../../../../../../environments/environment";

export class PawnAiController {
  private readonly DEBUG = true;
  private blackboard: PawnAiBlackboard = new PawnAiBlackboard();
  private playerPawnAiControllerAgent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private readonly stepInterval: number = 1000;
  private readonly nodeDebugger?: NodeDebugger;
  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.playerPawnAiControllerAgent);
    if (!environment.production && this.DEBUG) {
      this.nodeDebugger = new NodeDebugger(this.gameObject);
    }

    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    this.elapsedTime += dt;
    if (this.elapsedTime >= this.stepInterval) {
      this.behaviourTree.step();
      this.elapsedTime = 0;
      this.updateDebuggerText();
    }
  }

  private updateDebuggerText() {
    if (!this.nodeDebugger) return;
    const playerOrderType = this.blackboard.playerOrderType;
    const playerOrderTypeName = playerOrderType ? OrderType[playerOrderType] : null;
    const aiOrderType = this.blackboard.aiOrderType;
    const aiOrderTypeName = aiOrderType ? OrderType[aiOrderType] : null;
    const targetGameObject = this.blackboard.targetGameObject;
    const targetGameObjectName = targetGameObject ? targetGameObject.constructor.name : null;
    const targetLocation = this.blackboard.targetLocation;
    const targetLocationXYZ = targetLocation ? `${targetLocation.x}, ${targetLocation.y}, ${targetLocation.z}` : null;
    const range = this.blackboard.range;
    const acceptanceRadius = this.blackboard.acceptanceRadius;
    const buildingType = this.blackboard.buildingType;

    let text = "";
    if (playerOrderTypeName) {
      text += `Player Order Type: ${playerOrderTypeName}\n`;
    }
    if (aiOrderTypeName) {
      text += `AI Order Type: ${aiOrderTypeName}\n`;
    }
    if (targetGameObjectName) {
      text += `Target Game Object: ${targetGameObjectName}\n`;
    }
    if (targetLocationXYZ) {
      text += `Target Location: ${targetLocationXYZ}\n`;
    }
    if (range) {
      text += `Range: ${range}\n`;
    }
    if (acceptanceRadius) {
      text += `Acceptance Radius: ${acceptanceRadius}\n`;
    }
    if (buildingType) {
      text += `Building Type: ${buildingType}\n`;
    }

    this.nodeDebugger.updateText(text);
  }

  private onShutdown() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
