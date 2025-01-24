import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { NodeDebugger } from "./node-debugger";
import { OrderType } from "../../../../entity/character/ai/order-type";
import { environment } from "../../../../../../../environments/environment";
import { Agent } from "mistreevous/dist/Agent";
import { HealthComponent } from "../../../../entity/combat/components/health-component";

export interface PawnAiDefinition {
  type: AiType;
  stepInterval?: number;
}

export class PawnAiController {
  private readonly DEBUG = true;
  private readonly blackboard: PawnAiBlackboard = new PawnAiBlackboard();
  private readonly agent: Agent;
  private readonly behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private readonly nodeDebugger?: NodeDebugger;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly pawnAiDefinition: PawnAiDefinition
  ) {
    switch (pawnAiDefinition.type) {
      case AiType.Character:
        this.agent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
        this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.agent);
        break;
      default:
        this.agent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
        this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.agent);
        break;
    }

    if (!environment.production && this.DEBUG) {
      this.nodeDebugger = new NodeDebugger(this.gameObject);
    }

    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(HealthComponent.KilledEvent, this.onShutdown, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    this.elapsedTime += dt;
    if (this.elapsedTime >= (this.pawnAiDefinition.stepInterval ?? 1000)) {
      this.behaviourTree.step();
      this.elapsedTime = 0;
      this.updateDebuggerText();
    }
  }

  private updateDebuggerText() {
    if (!this.nodeDebugger) return;
    const playerOrderType = this.blackboard.playerOrderType;
    const playerOrderTypeName = playerOrderType !== undefined ? OrderType[playerOrderType] : null;
    const aiOrderType = this.blackboard.aiOrderType;
    const aiOrderTypeName = aiOrderType !== undefined ? OrderType[aiOrderType] : null;
    const targetGameObject = this.blackboard.targetGameObject;
    const targetGameObjectName = targetGameObject ? targetGameObject.name : null;
    const targetLocation = this.blackboard.targetLocation;
    const targetLocationXYZ = targetLocation ? `${targetLocation.x}, ${targetLocation.y}, ${targetLocation.z}` : null;

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

    this.nodeDebugger.updateText(text);
  }

  private onShutdown() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}

export enum AiType {
  Character = "Character"
}
